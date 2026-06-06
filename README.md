# ZenStudy AI | Student Mental Wellness Tracker

[![Vercel Deployment](https://img.shields.io/badge/deployment-vercel-blueviolet.svg?style=flat-square)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Accessibility: WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success.svg?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Tests: 25+ Passed](https://img.shields.io/badge/Tests-25%2B%20Passed-success.svg?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Console)

ZenStudy AI is an immersive, privacy-focused mental wellness companion designed for students preparing for competitive entrance tests (such as NEET, JEE, CUET, CAT, GATE, UPSC) and board examinations. It provides mood tracking, academic stress trigger analysis, journal reflections, dynamic breathing pacers, calming audio environments, and secure, empathetic AI counseling support.

Built with a premium dark glassmorphic design system to create a soothing, ambient workspace.

---

## 🌟 Key Features

1. **Daily Check-in & Reflections Diary**:
   - Programmatically bound grid selector for immediate emotional check-in (Motivated, Calm, Anxious, Stressed, Sad, Burned Out).
   - Multi-select checkbox grid for identifying academic stress triggers (Mock tests, syllabus backlog, peer pressure, family expectations, sleep deprivation).
   - Reflection diary for writing down feelings, automatically sanitized against XSS.

2. **ZenBot Counselor (AI-Driven)**:
   - Queries Google's **Gemini 2.5 Flash** model with a highly formatted system prompt to return structured JSON.
   - Provides empathetic guidance, recommended mindfulness exercises, study health advice, and encouragement.
   - Secure serverless routing hides API keys from the browser.
   - Seamless local fallback generator if the API is offline.

3. **Guided Breathing Pacer**:
   - Custom stress reliever breathing pacer driving scale animations on an ambient sphere.
   - Presets for **Box Breathing** (4s In - 4s Hold - 4s Out - 4s Hold), **4-7-8 Breathing** (4s In - 7s Hold - 8s Out), and **Calm Breathing** (4s In - 2s Hold - 4s Out).
   - **Dynamic Speed Synchronization**: Animation transition speeds automatically adjust to match active phase durations in real-time.

4. **Mind Trends Analytics**:
   - **Dynamic SVG Line Chart**: Renders mood trajectory over the last 7 check-ins.
   - **Trigger Frequencies**: Sorts and counts stress triggers to help students identify patterns.
   - **Thought History**: An interactive timeline of previous reflection entries.

5. **Focus Calming Desk**:
   - **Zen Soundscapes**: Audio stream selectors for Binaural study beats, forest rain, and ocean swells to mask distracting noises.
   - **Focus Pacing Timer**: Pomodoro pacing countdown (25 minutes study, 5 minutes rest) to prevent cognitive burnout.

---

## 🏗️ Architecture

```
                                    +-----------------------+
                                    |     Web Browser       |
                                    |  (Client HTML/CSS/JS) |
                                    +-----------+-----------+
                                                |
                                                | HTTP POST /api/wellness
                                                v
                                    +-----------+-----------+
                                    |     Vercel Proxy      |
                                    |  (api/wellness.js)    |
                                    +-----------+-----------+
                                                |
                                                | Forward Secure API Query
                                                v
                                    +-----------+-----------+
                                    |    Gemini 2.5 Flash   |
                                    |       API Host        |
                                    +-----------------------+
```

---

## 🛠️ Technology Stack

- **Frontend**: Semantic HTML5, Vanilla CSS3 (custom glassmorphic theme, responsive grids, keyframe animations), Vanilla JavaScript.
- **Backend**: Node.js (Vercel Serverless Function `/api/wellness.js`).
- **AI Model**: Google Gemini 2.5 Flash via Serverless Proxy.
- **Development Tooling**: NPM, Static local server (`http-server`).

---

## 🔒 Security & Code Quality

- **API Secret Shielding**: The application routes all AI interactions through `/api/wellness.js`. The Gemini API Key is configured strictly as a Vercel environment variable (`GEMINI_API_KEY`), avoiding push scanner alerts.
- **Input Sanitization**: Journal reflections are escaped using a robust regex-based HTML sanitizer (`escapeHTML`) before rendering, preventing script injection.
- **Zero Inline Scripting**: All event listeners are programmatically bound in `app.js` using `.addEventListener`, ensuring compliance with Content Security Policy (CSP).
- **Diagnostics Test Suite**: Built-in automated unit tests run on page load and output diagnostic results directly to the browser console.

---

## ♿ Accessibility Compliance

ZenStudy AI is built in strict adherence to **WCAG 2.1 Level AA** standards:
- **Keyboard Navigation**: Native focus states utilizing `:focus-visible` outline indicators. Tab buttons are accessible using Left/Right/Up/Down arrow keys.
- **Screen Readers**: Semantic tags (`main`, `header`, `footer`, `nav`, `article`, `section`) and ARIA tags (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-live="polite"`, `role="alert"`) are programmatically updated.
- **Color Contrast**: Maintained at or above a 4.5:1 ratio for text legibility. Supports system high contrast themes via `@media (forced-colors: active)`.
- **Reduced Motion**: Disables visual orb glows and scales transitions to `0.01ms` if the user prefers reduced motion.

---

## 🚀 Getting Started

### Local Development
1. Clone this repository.
2. Install the local development server:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:8080](http://localhost:8080) in your browser.

*Note: In local mode, if the `/api/wellness` serverless function is not active, the application automatically activates high-fidelity fallback mode, simulating AI analysis instantly.*

### Deployment
To deploy to Vercel and configure serverless functions:
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root.
3. Configure the environment variable `GEMINI_API_KEY` with your Google Gemini API key in the Vercel dashboard.

---

## 📝 Diagnostic Tests Summary

The project contains a self-running suite of 25+ automated assertions running in the browser console on load:
- **Input Sanitization**: Confirms proper escaping of `<script>` tags, single quotes, double quotes, and ampersands.
- **Mood Score Conversion**: Asserts mapping of string labels to numerical levels.
- **Local Fallback Planner**: Checks tailoring of mindfulness coping strategies based on selected mood logs.
- **Breathing Preset Config Schema**: Verifies nested structure and duration variables for Box, 4-7-8, and Calm presets.
- **Pomodoro Timer**: Asserts default parameters (25m duration, work mode state, initial inactivity).
