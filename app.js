// ==========================================================================
// ZenStudy AI - Core Application Script
// ==========================================================================

// Global Application State
const state = {
    theme: localStorage.getItem('zenstudy_theme') || 'dark',
    history: JSON.parse(localStorage.getItem('zenstudy_history')) || [],
    selectedMood: null,
    
    // Breathing Pacer State
    breathing: {
        timerId: null,
        isActive: false,
        pattern: 'box', // 'box', 'relax', 'calm'
        phaseIndex: 0,
        secondsRemaining: 0,
        cycleCount: 0
    },

    // Pomodoro Timer State
    pomodoro: {
        timerId: null,
        isActive: false,
        durationSeconds: 25 * 60, // 25 mins
        secondsRemaining: 25 * 60,
        mode: 'work' // 'work' or 'break'
    },

    // Audio Playback State
    audio: {
        playingBtn: null,
        playerEl: null
    }
};

// Breathing Presets Configurations
const BREATHING_PRESETS = {
    box: {
        name: 'Box Breathing',
        desc: 'Navy SEALs technique to eliminate stress and achieve calm, razor-sharp focus.',
        phases: [
            { type: 'inhale', duration: 4, prompt: 'Inhale', instruction: 'Breathe in slowly through your nose...' },
            { type: 'hold', duration: 4, prompt: 'Hold', instruction: 'Suspending breath. Relax your shoulders.' },
            { type: 'exhale', duration: 4, prompt: 'Exhale', instruction: 'Exhale slowly through your mouth...' },
            { type: 'hold', duration: 4, prompt: 'Hold', instruction: 'Suspending breath. Empty and quiet mind.' }
        ]
    },
    relax: {
        name: '4-7-8 Breathing',
        desc: 'Natural tranquilizer for the nervous system. Highly recommended before sleep or exams.',
        phases: [
            { type: 'inhale', duration: 4, prompt: 'Inhale', instruction: 'Breathe in quietly through your nose...' },
            { type: 'hold', duration: 7, prompt: 'Hold', instruction: 'Keep the air inside. Keep calm.' },
            { type: 'exhale', duration: 8, prompt: 'Exhale', instruction: 'Whoosh breath out completely through your mouth...' }
        ]
    },
    calm: {
        name: 'Calm Breathing',
        desc: 'Simple, light breathing pattern designed to curb rapid anxiety spikes.',
        phases: [
            { type: 'inhale', duration: 4, prompt: 'Inhale', instruction: 'Gentle inhale...' },
            { type: 'hold', duration: 2, prompt: 'Hold', instruction: 'Brief pause.' },
            { type: 'exhale', duration: 4, prompt: 'Exhale', instruction: 'Gentle exhale...' }
        ]
    }
};

// ==========================================================================
// Initialization & Event Listeners
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupTabs();
    setupMoodSelector();
    setupCheckinForm();
    setupBreathingPacer();
    setupAudioPlayer();
    setupPomodoroTimer();
    
    // Render historical data on load
    updateAnalyticsDisplay();

    // Run Developer Diagnostics Suite
    runDiagnosticTests();
});

// ==========================================================================
// Helper Functions (Security, Sanitization, & Math Utilities)
// ==========================================================================

// Sanitizes user inputs to prevent Cross-Site Scripting (XSS)
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (match) => {
        const charMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return charMap[match];
    });
}

// Displays non-blocking glassmorphic notification toast
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    // Force reflow
    toast.offsetHeight;
    
    toast.classList.add('show');
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 4000);
}

// Convert mood label to numerical score for trending visualization
function getMoodScore(mood) {
    const scores = {
        'motivated': 5,
        'calm': 4,
        'anxious': 3,
        'stressed': 2,
        'sad': 1,
        'burned-out': 0
    };
    return scores[mood] !== undefined ? scores[mood] : 3;
}

// Format Unix Timestamp to a readable local string
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// ==========================================================================
// Theme Management (Light / Dark Mode Controller)
// ==========================================================================
function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const themeBtn = document.getElementById('btn-toggle-theme');
    const themeIcon = themeBtn.querySelector('span');
    themeIcon.textContent = state.theme === 'dark' ? 'light_mode' : 'dark_mode';
    themeBtn.setAttribute('aria-label', `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`);

    themeBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('zenstudy_theme', state.theme);
        document.documentElement.setAttribute('data-theme', state.theme);
        themeIcon.textContent = state.theme === 'dark' ? 'light_mode' : 'dark_mode';
        themeBtn.setAttribute('aria-label', `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`);
    });
}

// ==========================================================================
// Navigation & Tab Switching Controls
// ==========================================================================
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            tabContents.forEach(content => {
                content.classList.remove('active-content');
            });

            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
            const targetEl = document.getElementById(targetTab);
            if (targetEl) {
                targetEl.classList.add('active-content');
            }
        });
    });
}

// ==========================================================================
// Interactive Mood Radio Selection
// ==========================================================================
function setupMoodSelector() {
    const moodButtons = document.querySelectorAll('.mood-btn');
    
    moodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            moodButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-checked', 'false');
            });

            btn.classList.add('active');
            btn.setAttribute('aria-checked', 'true');
            state.selectedMood = btn.getAttribute('data-mood');
        });
    });
}

// ==========================================================================
// Form Submission & Mental Wellness AI Engine
// ==========================================================================
function setupCheckinForm() {
    const form = document.getElementById('wellness-checkin-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Validation
        if (!state.selectedMood) {
            showToast('Please select how you are feeling right now.', 'warning');
            return;
        }

        const reflectionText = document.getElementById('input-reflection').value.trim();
        if (!reflectionText) {
            showToast('Please share a brief reflection or description of your thoughts.', 'warning');
            return;
        }

        // Gather checked triggers
        const triggers = [];
        document.querySelectorAll('#trigger-group input:checked').forEach(cb => {
            triggers.push(cb.value);
        });

        // 2. Visual State Update (Show Skeleton loader)
        document.getElementById('counselor-placeholder').classList.add('hidden');
        document.getElementById('counselor-content').classList.add('hidden');
        document.getElementById('counselor-skeleton').classList.remove('hidden');
        
        // Ensure counselor tab is opened to show results
        document.getElementById('tab-btn-counselor').click();

        // Build Payload
        const checkinData = {
            mood: state.selectedMood,
            triggers: triggers,
            reflection: reflectionText,
            timestamp: Date.now()
        };

        try {
            // 3. AI Query Process
            const responseData = await fetchAIWellnessPlan(checkinData);
            
            // 4. Update state & save locally
            checkinData.plan = responseData;
            state.history.unshift(checkinData); // Add new check-in to top
            localStorage.setItem('zenstudy_history', JSON.stringify(state.history));

            // 5. Render AI Response
            renderAIResponse(responseData);
            updateAnalyticsDisplay();

            // Clear inputs
            form.reset();
            state.selectedMood = null;
            document.querySelectorAll('.mood-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-checked', 'false');
            });

            // Transition loaders
            document.getElementById('counselor-skeleton').classList.add('hidden');
            document.getElementById('counselor-content').classList.remove('hidden');

        } catch (error) {
            console.error('Check-in processing error:', error);
            showToast('Using local wellness plan fallback.', 'info');
            
            // Fail-safe fallback mode
            const localPlan = generateLocalWellnessPlan(checkinData);
            checkinData.plan = localPlan;
            state.history.unshift(checkinData);
            localStorage.setItem('zenstudy_history', JSON.stringify(state.history));

            renderAIResponse(localPlan);
            updateAnalyticsDisplay();
            
            form.reset();
            state.selectedMood = null;
            document.querySelectorAll('.mood-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-checked', 'false');
            });

            document.getElementById('counselor-skeleton').classList.add('hidden');
            document.getElementById('counselor-content').classList.remove('hidden');
        }
    });

    // Action button inside Counsel Card - "Try Grounding Now" launches breathing guide
    document.getElementById('btn-counsel-action').addEventListener('click', () => {
        document.getElementById('tab-btn-breathing').click();
    });
}

// REST call to secure Vercel API proxy
async function fetchAIWellnessPlan(checkin) {
    const prompt = `
You are ZenStudy AI, an empathetic mental wellness counselor. Write a student wellness guidance plan based on this entry:
- Selected Mood: "${checkin.mood}"
- Stress Triggers: ${checkin.triggers.length > 0 ? checkin.triggers.join(', ') : 'None selected'}
- Reflection Journal: "${checkin.reflection}"

You MUST respond with a single, highly structured JSON object following this EXACT schema (do not write any markdown wrappers like \`\`\`json outside, just return the raw JSON text):
{
  "guidance": "Empathetic, non-judgmental analysis of their mood and triggers, followed by 2 detailed, practical study-health balance tips tailored to their exam prep situation (like NEET, JEE, board exams, syllabus management). Keep it under 150 words.",
  "exerciseTitle": "Specific grounding or meditation technique (e.g. 5-4-3-2-1 Technique, Box Breathing, Muscle relaxation)",
  "exerciseDesc": "3 simple bullet steps guiding them through this specific exercise.",
  "studyAdvice": "One paragraph of exam-prep specific encouragement or pacing tactics to manage stress triggers.",
  "quoteText": "One highly comforting or inspiring quote focused on persistence, mental peace, or healthy studying.",
  "quoteAuthor": "Author of the quote"
}
`;

    const response = await fetch('/api/wellness', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
        throw new Error('API server returned error code ' + response.status);
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    
    // Parse response
    return JSON.parse(rawText);
}

// High-fidelity fallback plan generator if backend API is not configured or offline
function generateLocalWellnessPlan(checkin) {
    const mood = checkin.mood;
    const triggers = checkin.triggers;
    
    let guidance = "";
    let exerciseTitle = "";
    let exerciseDesc = "";
    let studyAdvice = "";
    let quoteText = "";
    let quoteAuthor = "";

    // Tailor fallback on mood
    if (mood === 'anxious' || mood === 'stressed') {
        guidance = `We hear you. Preparing for major exams with triggers like ${triggers.join(' or ') || 'general anxiety'} can feel overwhelming. Your feelings are natural, but they do not define your capabilities. Remember that mock test scores and study pacing are stepping stones, not final verdicts. Give yourself permission to breathe.`;
        exerciseTitle = "5-4-3-2-1 Sensory Grounding";
        exerciseDesc = "1. Name 5 things you can see around you.\n2. Name 4 things you can physically touch (your chair, desk).\n3. Name 3 things you hear, 2 things you smell, and 1 positive affirmation.";
        studyAdvice = "Break your revision modules into 25-minute blocks. When anxiety spikes, step away from the desk for 3 minutes. Focus entirely on the immediate topic rather than the entire massive syllabus.";
        quoteText = "Your calm mind is the ultimate weapon against your challenges. So relax.";
        quoteAuthor = "Bryant McGill";
    } else if (mood === 'burned-out') {
        guidance = `Burnout is your body's request for rest. Attempting to force study hours when depleted is counterproductive. Pushing through exhaustion damages recall. Let's work on restoring your cognitive energy.`;
        exerciseTitle = "Progressive Muscle Relaxation (PMR)";
        exerciseDesc = "1. Tense your toes and feet tightly for 5 seconds, then release completely.\n2. Work upward, tensing and relaxing calf muscles, thighs, stomach, and hands.\n3. Keep shoulders soft and feel the tension leave your body.";
        studyAdvice = "Take a full 30-minute power nap or walk outside. Declare a 'study-free zone' for the next two hours. Rest is not wasted time; it is active recovery.";
        quoteText = "Rest is not laziness, it is medicine. Healing minds learn faster.";
        quoteAuthor = "Wellness Wisdom";
    } else if (mood === 'sad' || mood === 'motivated') {
        guidance = `Whether riding a wave of motivation or dealing with exam blues, consistency is key. Keep tracking triggers like ${triggers.join(', ') || 'study fatigue'} to build self-awareness and stay resilient.`;
        exerciseTitle = "Sankalpa (Intention Setting)";
        exerciseDesc = "1. Sit straight, close your eyes, and place your hands on your lap.\n2. Formulate a positive statement (e.g., 'I will do my best, and that is enough').\n3. Repeat it mentally three times slowly.";
        studyAdvice = "Align your high-priority revision chapters with your peak energetic hours. Celebrate small victories like finishing a test paper, regardless of the score.";
        quoteText = "Success is not final, failure is not fatal: it is the courage to continue that counts.";
        quoteAuthor = "Winston Churchill";
    } else {
        // Calm or default
        guidance = `It's wonderful that you are feeling calm and balanced. Maintaining this peace of mind during intensive competitive entrance tests is a superpower. Let's anchor this state.`;
        exerciseTitle = "Heart-Centered Visualization";
        exerciseDesc = "1. Close your eyes and focus on your heartbeat.\n2. Visualize a warm, golden light radiating calm throughout your body.\n3. Carry this feeling into your next study session.";
        studyAdvice = "Maintain your healthy sleeping schedule of 7-8 hours. Consistent sleep consolidates memory and boosts analytical thinking.";
        quoteText = "The greatest weapon against stress is our ability to choose one thought over another.";
        quoteAuthor = "William James";
    }

    return {
        guidance,
        exerciseTitle,
        exerciseDesc,
        studyAdvice,
        quoteText,
        quoteAuthor
    };
}

// Render dynamic HTML output securely
function renderAIResponse(plan) {
    document.getElementById('counselor-response-text').innerHTML = escapeHTML(plan.guidance);
    document.getElementById('coping-exercise-title').textContent = plan.exerciseTitle;
    
    // Format exercise description lists securely
    const descContainer = document.getElementById('coping-exercise-desc');
    descContainer.innerHTML = '';
    const lines = plan.exerciseDesc.split('\n');
    lines.forEach(line => {
        if (line.trim()) {
            const p = document.createElement('p');
            p.style.marginBottom = '6px';
            p.textContent = line;
            descContainer.appendChild(p);
        }
    });

    document.getElementById('study-tip-desc').textContent = plan.studyAdvice;
    document.getElementById('wellness-quote-text').textContent = plan.quoteText;
    document.getElementById('wellness-quote-author').textContent = `— ${plan.quoteAuthor}`;
}

// ==========================================================================
// Mood Trends Timeline & Analytics Rendering Engine (SVG Chart)
// ==========================================================================
function updateAnalyticsDisplay() {
    renderMoodTrendsChart();
    renderTriggersFrequency();
    renderReflectionsTimeline();
}

function renderMoodTrendsChart() {
    const svg = document.getElementById('mood-svg-chart');
    const gridLinesGroup = document.getElementById('chart-grid-lines');
    const axesGroup = document.getElementById('chart-axes');
    const path = document.getElementById('chart-line-path');
    const dotsGroup = document.getElementById('chart-dots');
    const labelsGroup = document.getElementById('chart-labels');

    // Clear previous dynamic groupings
    gridLinesGroup.innerHTML = '';
    axesGroup.innerHTML = '';
    dotsGroup.innerHTML = '';
    labelsGroup.innerHTML = '';
    path.setAttribute('d', '');

    if (state.history.length === 0) {
        return;
    }

    // Grab up to the last 7 entries, chronological order (oldest first)
    const recentLogs = [...state.history].slice(0, 7).reverse();

    // Chart margins & sizes
    const width = 600;
    const height = 240;
    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Mood mapping levels (0-5)
    const moodLevels = [
        { label: 'Motivated', score: 5 },
        { label: 'Calm', score: 4 },
        { label: 'Anxious', score: 3 },
        { label: 'Stressed', score: 2 },
        { label: 'Sad', score: 1 },
        { label: 'Burnout', score: 0 }
    ];

    // 1. Draw horizontal gridlines and mood y-axis labels
    moodLevels.forEach(level => {
        const y = paddingTop + chartHeight - (level.score / 5) * chartHeight;
        
        // Gridline
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', paddingLeft);
        line.setAttribute('y1', y);
        line.setAttribute('x2', width - paddingRight);
        line.setAttribute('y2', y);
        line.setAttribute('class', 'chart-grid-line');
        gridLinesGroup.appendChild(line);

        // Label
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', paddingLeft - 10);
        txt.setAttribute('y', y + 4);
        txt.setAttribute('text-anchor', 'end');
        txt.setAttribute('class', 'chart-label-text');
        txt.textContent = level.label;
        labelsGroup.appendChild(txt);
    });

    // 2. Draw basic axes lines
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', paddingLeft);
    xAxis.setAttribute('y1', height - paddingBottom);
    xAxis.setAttribute('x2', width - paddingRight);
    xAxis.setAttribute('y2', height - paddingBottom);
    xAxis.setAttribute('class', 'chart-axis-line');
    axesGroup.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', paddingLeft);
    yAxis.setAttribute('y1', paddingTop);
    yAxis.setAttribute('x2', paddingLeft);
    yAxis.setAttribute('y2', height - paddingBottom);
    yAxis.setAttribute('class', 'chart-axis-line');
    axesGroup.appendChild(yAxis);

    // 3. Compute data coordinates
    const points = [];
    const stepX = recentLogs.length > 1 ? chartWidth / (recentLogs.length - 1) : chartWidth;

    recentLogs.forEach((log, index) => {
        const score = getMoodScore(log.mood);
        const x = paddingLeft + index * stepX;
        const y = paddingTop + chartHeight - (score / 5) * chartHeight;
        points.push({ x, y, log });
    });

    // 4. Draw smooth connecting line (Cubic Bezier curves)
    if (points.length > 0) {
        if (points.length === 1) {
            path.setAttribute('d', `M ${points[0].x} ${points[0].y}`);
        } else {
            let d = `M ${points[0].x} ${points[0].y}`;
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const cpX1 = p0.x + (p1.x - p0.x) / 3;
                const cpY1 = p0.y;
                const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
                const cpY2 = p1.y;
                d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
            }
            path.setAttribute('d', d);
        }
    }

    // 5. Draw data points and x-axis date labels
    points.forEach((pt, index) => {
        // Dot marker
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pt.x);
        circle.setAttribute('cy', pt.y);
        circle.setAttribute('r', '6');
        circle.setAttribute('class', 'chart-dot');
        circle.setAttribute('stroke', `var(--mood-${pt.log.mood === 'burned-out' ? 'burnout' : pt.log.mood})`);
        
        // Tooltip description
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `Feeling ${pt.log.mood} on ${formatTimestamp(pt.log.timestamp)}`;
        circle.appendChild(title);
        dotsGroup.appendChild(circle);

        // Date text label
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', pt.x);
        txt.setAttribute('y', height - paddingBottom + 20);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('class', 'chart-label-text');
        
        // Simple day/time display
        const d = new Date(pt.log.timestamp);
        txt.textContent = `${d.getMonth() + 1}/${d.getDate()}`;
        labelsGroup.appendChild(txt);
    });
}

function renderTriggersFrequency() {
    const container = document.getElementById('trigger-list-wrapper');
    container.innerHTML = '';

    if (state.history.length === 0) {
        container.innerHTML = '<div class="no-data-msg">Log some moods to calculate study stress triggers.</div>';
        return;
    }

    // Aggregate trigger frequencies
    const freq = {};
    state.history.forEach(log => {
        if (log.triggers) {
            log.triggers.forEach(tr => {
                freq[tr] = (freq[tr] || 0) + 1;
            });
        }
    });

    // Sort by count descending
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
        container.innerHTML = '<div class="no-data-msg">No stress triggers registered yet. Keep studying!</div>';
        return;
    }

    sorted.forEach(([name, count]) => {
        const item = document.createElement('div');
        item.className = 'trigger-freq-item';
        
        item.innerHTML = `
            <span class="trigger-name-freq">${escapeHTML(name)}</span>
            <span class="trigger-freq-badge">${count} ${count === 1 ? 'time' : 'times'}</span>
        `;
        container.appendChild(item);
    });
}

function renderReflectionsTimeline() {
    const container = document.getElementById('reflections-history-container');
    container.innerHTML = '';

    if (state.history.length === 0) {
        container.innerHTML = '<div class="no-data-msg">No check-ins logged yet. Complete your first wellness check-in to start your history!</div>';
        return;
    }

    state.history.forEach(log => {
        const item = document.createElement('div');
        item.className = 'reflection-timeline-item';
        
        // Format triggers
        let triggerPills = '';
        if (log.triggers && log.triggers.length > 0) {
            triggerPills = `
                <div class="timeline-item-triggers">
                    ${log.triggers.map(tr => `<span class="timeline-trigger-pill">${escapeHTML(tr)}</span>`).join('')}
                </div>
            `;
        }

        const dateStr = formatTimestamp(log.timestamp);
        const moodClass = log.mood;
        const moodName = log.mood.replace('-', ' ');

        item.innerHTML = `
            <div class="timeline-item-header">
                <span class="timeline-item-date">${dateStr}</span>
                <span class="timeline-item-mood-badge m-${moodClass}">${escapeHTML(moodName)}</span>
            </div>
            <p class="timeline-item-text">"${escapeHTML(log.reflection)}"</p>
            ${triggerPills}
        `;
        container.appendChild(item);
    });
}

// ==========================================================================
// Guided Breathing Pacer Controller
// ==========================================================================
function setupBreathingPacer() {
    const btn = document.getElementById('btn-breath-start');
    const select = document.getElementById('select-breath-pattern');
    const promptDisplay = document.getElementById('pacer-prompt-display');
    const timerDisplay = document.getElementById('pacer-timer-display');
    const instructionText = document.getElementById('pacer-instruction-text');
    const presetDesc = document.getElementById('breath-preset-desc');
    const container = document.querySelector('.breathing-visual-container');

    // Update preset description text on select change
    select.addEventListener('change', () => {
        const selected = select.value;
        presetDesc.textContent = BREATHING_PRESETS[selected].desc;
        if (state.breathing.isActive) {
            stopBreathingPacer();
        }
    });

    btn.addEventListener('click', () => {
        if (state.breathing.isActive) {
            stopBreathingPacer();
        } else {
            startBreathingPacer();
        }
    });

    function startBreathingPacer() {
        state.breathing.isActive = true;
        state.breathing.pattern = select.value;
        state.breathing.phaseIndex = 0;
        state.breathing.cycleCount = 0;
        
        const patternData = BREATHING_PRESETS[state.breathing.pattern];
        const currentPhase = patternData.phases[0];
        
        state.breathing.secondsRemaining = currentPhase.duration;

        // Button state
        btn.querySelector('span').textContent = 'pause';
        document.getElementById('btn-breath-start-label').textContent = 'Pause Pacer';
        btn.className = 'btn btn-secondary btn-block'; // glass feel

        // Run interval
        updatePacerUI(currentPhase);
        
        state.breathing.timerId = setInterval(() => {
            state.breathing.secondsRemaining--;

            if (state.breathing.secondsRemaining <= 0) {
                // Advance phase
                state.breathing.phaseIndex++;
                const phasesCount = BREATHING_PRESETS[state.breathing.pattern].phases.length;
                
                if (state.breathing.phaseIndex >= phasesCount) {
                    state.breathing.phaseIndex = 0;
                    state.breathing.cycleCount++;
                }

                const nextPhase = BREATHING_PRESETS[state.breathing.pattern].phases[state.breathing.phaseIndex];
                state.breathing.secondsRemaining = nextPhase.duration;
            }

            const activePhase = BREATHING_PRESETS[state.breathing.pattern].phases[state.breathing.phaseIndex];
            updatePacerUI(activePhase);

        }, 1000);
    }

    function stopBreathingPacer() {
        state.breathing.isActive = false;
        clearInterval(state.breathing.timerId);
        state.breathing.timerId = null;

        // Reset elements
        btn.querySelector('span').textContent = 'play_arrow';
        document.getElementById('btn-breath-start-label').textContent = 'Start Pacer';
        btn.className = 'btn btn-primary btn-block';

        promptDisplay.textContent = 'Get Ready';
        timerDisplay.textContent = '0';
        instructionText.textContent = 'Press Start to begin guided breathing';
        
        container.className = 'breathing-visual-container glass card';
    }

    function updatePacerUI(phase) {
        promptDisplay.textContent = phase.prompt;
        timerDisplay.textContent = state.breathing.secondsRemaining;
        instructionText.textContent = phase.instruction;

        // Update CSS scale classes
        container.className = 'breathing-visual-container glass card';
        container.classList.add(`${phase.type}-state`);
    }
}

// ==========================================================================
// Calming Ambient Soundscapes Player
// ==========================================================================
function setupAudioPlayer() {
    const playButtons = document.querySelectorAll('.btn-audio-play');
    const audioEl = document.getElementById('audio-background-player');
    state.audio.playerEl = audioEl;

    playButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const trackSrc = btn.getAttribute('data-src');

            // 1. If clicking the currently playing track button, pause it
            if (state.audio.playingBtn === btn) {
                audioEl.pause();
                btn.querySelector('span').textContent = 'play_arrow';
                state.audio.playingBtn = null;
                btn.classList.remove('btn-primary');
                return;
            }

            // 2. If another track was playing, reset its button icon
            if (state.audio.playingBtn) {
                state.audio.playingBtn.querySelector('span').textContent = 'play_arrow';
                state.audio.playingBtn.classList.remove('btn-primary');
            }

            // 3. Load and play new track
            audioEl.src = trackSrc;
            audioEl.play()
                .then(() => {
                    btn.querySelector('span').textContent = 'pause';
                    btn.classList.add('btn-primary');
                    state.audio.playingBtn = btn;
                })
                .catch(err => {
                    console.error('Audio load failure:', err);
                    showToast('Audio playback failed. Please check your network.', 'error');
                });
        });
    });
}

// ==========================================================================
// Study Pacing Pomodoro Countdown Timer
// ==========================================================================
function setupPomodoroTimer() {
    const pomoDisplay = document.getElementById('pomo-timer-display');
    const startBtn = document.getElementById('btn-pomo-start');
    const resetBtn = document.getElementById('btn-pomo-reset');

    startBtn.addEventListener('click', () => {
        if (state.pomodoro.isActive) {
            pausePomodoro();
        } else {
            startPomodoro();
        }
    });

    resetBtn.addEventListener('click', resetPomodoro);

    function startPomodoro() {
        state.pomodoro.isActive = true;
        startBtn.textContent = 'Pause Focus';
        startBtn.className = 'btn btn-secondary btn-sm';

        state.pomodoro.timerId = setInterval(() => {
            state.pomodoro.secondsRemaining--;

            updatePomoDisplay();

            if (state.pomodoro.secondsRemaining <= 0) {
                clearInterval(state.pomodoro.timerId);
                triggerPomoCompletionAlert();
            }
        }, 1000);
    }

    function pausePomodoro() {
        state.pomodoro.isActive = false;
        clearInterval(state.pomodoro.timerId);
        startBtn.textContent = 'Resume Focus';
        startBtn.className = 'btn btn-primary btn-sm';
    }

    function resetPomodoro() {
        state.pomodoro.isActive = false;
        clearInterval(state.pomodoro.timerId);
        state.pomodoro.mode = 'work';
        state.pomodoro.secondsRemaining = 25 * 60; // 25 mins
        startBtn.textContent = 'Start Focus';
        startBtn.className = 'btn btn-secondary btn-sm';
        updatePomoDisplay();
    }

    function updatePomoDisplay() {
        const mins = Math.floor(state.pomodoro.secondsRemaining / 60);
        const secs = state.pomodoro.secondsRemaining % 60;
        pomoDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        // Update circular progress SVG stroke offset
        const ring = document.getElementById('pomo-progress-ring-el');
        if (ring) {
            const total = state.pomodoro.mode === 'work' ? 25 * 60 : 5 * 60;
            const percentage = state.pomodoro.secondsRemaining / total;
            const offset = 440 - (percentage * 440);
            ring.style.strokeDashoffset = offset;
            
            if (state.pomodoro.mode === 'work') {
                ring.style.stroke = 'var(--primary-light)';
            } else {
                ring.style.stroke = 'var(--accent-color)';
            }
        }
    }

    function triggerPomoCompletionAlert() {
        state.pomodoro.isActive = false;
        
        if (state.pomodoro.mode === 'work') {
            showToast('Study Pomodoro finished! Take a 5-minute restorative break.', 'success');
            state.pomodoro.mode = 'break';
            state.pomodoro.secondsRemaining = 5 * 60; // 5 mins
        } else {
            showToast('Break finished! Ready to lock back into study focus?', 'success');
            state.pomodoro.mode = 'work';
            state.pomodoro.secondsRemaining = 25 * 60;
        }

        startBtn.textContent = 'Start Pacing';
        startBtn.className = 'btn btn-primary btn-sm';
        updatePomoDisplay();
    }
}

// ==========================================================================
// Self-Running Developer Diagnostic Test Suite
// ==========================================================================
function runDiagnosticTests() {
    console.group('%cZenStudy AI Diagnostics Suite', 'color: var(--primary-light); font-weight: bold; font-size: 14px;');
    let passCount = 0;
    let failCount = 0;

    function assert(testName, assertion) {
        if (assertion) {
            console.log(`%c[PASS] ${testName}`, 'color: #10b981; font-weight: 500;');
            passCount++;
        } else {
            console.error(`[FAIL] ${testName}`);
            failCount++;
        }
    }

    // Test 1: HTML Input Sanitization Helper
    try {
        const dirtyInput = "<script>alert('xss')</script>&hello";
        const clean = escapeHTML(dirtyInput);
        assert('HTML Sanitizer escapes script tags & special characters', 
            !clean.includes('<script>') && clean.includes('&lt;script&gt;') && clean.includes('&amp;hello')
        );
    } catch (e) {
        assert('HTML Sanitizer Executed without throwing', false);
    }

    // Test 2: Mood Scores Conversion Math
    try {
        const scoreCalm = getMoodScore('calm');
        const scoreBurn = getMoodScore('burned-out');
        const scoreDefault = getMoodScore('unknown');
        
        assert('Mood Calming maps correctly to numerical score 4', scoreCalm === 4);
        assert('Mood Burnout maps correctly to numerical score 0', scoreBurn === 0);
        assert('Unknown mood labels default to 3', scoreDefault === 3);
    } catch (e) {
        assert('Mood score converters executed without throwing', false);
    }

    // Test 3: Fallback Wellness Plan Tailoring
    try {
        const mockCheckin = {
            mood: 'anxious',
            triggers: ['Mock Test Scores'],
            reflection: 'Studied all night, feeling stressed.'
        };
        const generated = generateLocalWellnessPlan(mockCheckin);
        
        assert('Fallback plan returns correct mock properties', 
            generated.guidance && generated.exerciseTitle && generated.exerciseDesc && generated.studyAdvice
        );
        assert('Fallback plan correctly customizes exercise for anxiety', 
            generated.exerciseTitle.includes('5-4-3-2-1')
        );
    } catch (e) {
        assert('Fallback generators run without throwing', false);
    }

    // Summary output
    console.log(`%cDiagnostic Summary: ${passCount} / ${passCount + failCount} Tests Passed.`, 
        failCount === 0 ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;'
    );
    console.groupEnd();
}
