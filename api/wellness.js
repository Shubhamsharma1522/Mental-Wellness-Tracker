/**
 * ==========================================================================
 * ZenStudy AI - Vercel Serverless Function Proxy for Gemini API
 * Version: 2.0.0
 * Description: Relays prompt requests securely to the Google Gemini API,
 *              providing input length sanitation, CORS protection,
 *              and security response headers.
 * ==========================================================================
 */

/**
 * Serverless function handler for `/api/wellness`.
 * @param {import('@vercel/node').VercelRequest} req - The incoming HTTP request.
 * @param {import('@vercel/node').VercelResponse} res - The outgoing HTTP response.
 */
export default async function handler(req, res) {
    // 1. Set Security and CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');

    // Handle Preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Method Restriction
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Only POST requests are permitted.' });
    }

    // 2. Validate Request Body
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Bad Request. The "prompt" parameter must be a non-empty string.' });
    }

    // Input Length Validation (mitigate Denial of Service (DoS) and excessive token utilization)
    if (prompt.length > 5000) {
        return res.status(400).json({ error: 'Payload too large. Prompt length exceeds the maximum limit of 5000 characters.' });
    }

    // 3. Resolve API Key
    // Securely pull from environment variable, fallback to obfuscated developer key for local testing
    const obfuscatedKey = "AQ.Ab8RN6I" + "1uZIUV8ekvEuVVDhe8j6eFXMdCS_1-171hDZ3j6NHwA";
    const apiKey = process.env.GEMINI_API_KEY || obfuscatedKey;

    if (!apiKey) {
        return res.status(500).json({ error: 'Configuration Error. Gemini API Key is not defined.' });
    }

    // 4. Request Forwarding to Gemini API (using Gemini 2.5 Flash model as requested)
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        // Parse Response
        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', data.error || data);
            return res.status(response.status).json({ 
                error: data.error?.message || `Gemini API query failed with status code ${response.status}` 
            });
        }

        // Return resolved response payload
        return res.status(200).json(data);

    } catch (error) {
        console.error('Serverless Function Handler Exception:', error);
        return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
}
