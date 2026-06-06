/**
 * ==========================================================================
 * ZenStudy AI - Core Application Script
 * Version: 2.0.0
 * Description: Empathetic mental wellness tracking, breathing pacer,
 *              Pomodoro focus timer, lo-fi study desk, and analytics.
 * Features: Accessibility keyboard tab navigation, input sanitization,
 *           comprehensive unit tests, and performance-optimized execution.
 * ==========================================================================
 */

'use strict';

/**
 * ZenStudy AI Application Namespace
 * Wrapped in an IIFE to prevent global namespace pollution and protect state.
 */
const ZenStudy = (function () {
    // ==========================================================================
    // 1. Constants (Frozen Objects)
    // ==========================================================================

    /**
     * Local storage keys used by the application.
     * @type {Readonly<{THEME: string, HISTORY: string}>}
     */
    const STORAGE_KEYS = Object.freeze({
        THEME: 'zenstudy_theme',
        HISTORY: 'zenstudy_history'
    });

    /**
     * Mood metadata containing names, emojis, scores, and accent colors.
     * @type {Readonly<Object<string, Readonly<{name: string, emoji: string, score: number, color: string}>>>}
     */
    const MOOD_METADATA = Object.freeze({
        'calm': Object.freeze({ name: 'Calm', emoji: '😌', score: 4, color: 'var(--mood-calm)' }),
        'motivated': Object.freeze({ name: 'Motivated', emoji: '💪', score: 5, color: 'var(--mood-motivated)' }),
        'anxious': Object.freeze({ name: 'Anxious', emoji: '😰', score: 3, color: 'var(--mood-anxious)' }),
        'burned-out': Object.freeze({ name: 'Burned Out', emoji: '🥵', score: 0, color: 'var(--mood-burnout)' }),
        'sad': Object.freeze({ name: 'Sad', emoji: '😔', score: 1, color: 'var(--mood-sad)' }),
        'stressed': Object.freeze({ name: 'Stressed', emoji: '🤯', score: 2, color: 'var(--mood-stressed)' })
    });

    /**
     * Breathing presets configurations for the Stress Reliever Pacer.
     * @type {Readonly<Object<string, Readonly<{name: string, desc: string, phases: ReadonlyArray<Readonly<{type: string, duration: number, prompt: string, instruction: string}>>}>>>}
     */
    const BREATHING_PRESETS = Object.freeze({
        box: Object.freeze({
            name: 'Box Breathing',
            desc: 'Navy SEALs technique to eliminate stress and achieve calm, razor-sharp focus. Excellent before exams.',
            phases: Object.freeze([
                Object.freeze({ type: 'inhale', duration: 4, prompt: 'Inhale', instruction: 'Breathe in slowly through your nose...' }),
                Object.freeze({ type: 'hold', duration: 4, prompt: 'Hold', instruction: 'Suspend breath. Relax your shoulders.' }),
                Object.freeze({ type: 'exhale', duration: 4, prompt: 'Exhale', instruction: 'Exhale slowly through your mouth...' }),
                Object.freeze({ type: 'hold', duration: 4, prompt: 'Hold', instruction: 'Suspend breath. Quiet your mind.' })
            ])
        }),
        relax: Object.freeze({
            name: '4-7-8 Breathing',
            desc: 'Natural tranquilizer for the nervous system. Highly recommended to ease exam anxiety.',
            phases: Object.freeze([
                Object.freeze({ type: 'inhale', duration: 4, prompt: 'Inhale', instruction: 'Breathe in quietly through your nose...' }),
                Object.freeze({ type: 'hold', duration: 7, prompt: 'Hold', instruction: 'Keep the air inside. Stay calm.' }),
                Object.freeze({ type: 'exhale', duration: 8, prompt: 'Exhale', instruction: 'Whoosh breath out completely through your mouth...' })
            ])
        }),
        calm: Object.freeze({
            name: 'Calm Breathing',
            desc: 'Simple, light breathing pattern designed to curb rapid panic or anxiety spikes.',
            phases: Object.freeze([
                Object.freeze({ type: 'inhale', duration: 4, prompt: 'Inhale', instruction: 'Gentle inhale...' }),
                Object.freeze({ type: 'hold', duration: 2, prompt: 'Hold', instruction: 'Brief pause.' }),
                Object.freeze({ type: 'exhale', duration: 4, prompt: 'Exhale', instruction: 'Gentle exhale...' })
            ])
        })
    });

    // ==========================================================================
    // 2. Application State
    // ==========================================================================

    /**
     * Mutable application state object.
     */
    const state = {
        theme: 'dark',
        history: [],
        selectedMood: null,
        
        breathing: {
            timerId: null,
            isActive: false,
            pattern: 'box',
            phaseIndex: 0,
            secondsRemaining: 0,
            cycleCount: 0
        },

        pomodoro: {
            timerId: null,
            isActive: false,
            durationSeconds: 25 * 60,
            secondsRemaining: 25 * 60,
            mode: 'work', // 'work' or 'break'
            sessionsCompleted: 0
        },

        audio: {
            playingBtn: null,
            playerEl: null
        }
    };

    // DOM cache object to minimize queries
    let DOM = {};

    // ==========================================================================
    // 3. Initialization
    // ==========================================================================

    /**
     * Initializes the entire application.
     */
    function init() {
        cacheDOM();
        loadLocalStorage();
        initTheme();
        setupTabs();
        setupMoodSelector();
        setupCheckinForm();
        setupHistoryActions();
        setupBreathingPacer();
        setupAudioPlayer();
        setupPomodoroTimer();
        
        // Render history updates
        updateAnalyticsDisplay();

        // Run internal developers diagnostic tests
        runDiagnosticTests();
    }

    /**
     * Caches references to frequently used DOM elements to improve efficiency.
     */
    function cacheDOM() {
        DOM = {
            themeBtn: document.getElementById('btn-toggle-theme'),
            themeIcon: document.getElementById('btn-toggle-theme')?.querySelector('span'),
            
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            
            checkinForm: document.getElementById('wellness-checkin-form'),
            moodButtons: document.querySelectorAll('.mood-btn'),
            reflectionInput: document.getElementById('input-reflection'),
            validationMsg: document.getElementById('form-validation-msg'),
            submitCheckinBtn: document.getElementById('btn-submit-checkin'),
            examTargetSelect: document.getElementById('select-exam-target'),
            
            counselorPlaceholder: document.getElementById('counselor-placeholder'),
            counselorSkeleton: document.getElementById('counselor-skeleton'),
            counselorContent: document.getElementById('counselor-content'),
            counselorResponseText: document.getElementById('counselor-response-text'),
            copingExerciseTitle: document.getElementById('coping-exercise-title'),
            copingExerciseDesc: document.getElementById('coping-exercise-desc'),
            counselActionBtn: document.getElementById('btn-counsel-action'),
            studyTipDesc: document.getElementById('study-tip-desc'),
            quoteText: document.getElementById('wellness-quote-text'),
            quoteAuthor: document.getElementById('wellness-quote-author'),
            
            breathPatternSelect: document.getElementById('select-breath-pattern'),
            breathStartBtn: document.getElementById('btn-breath-start'),
            breathStartIcon: document.getElementById('btn-breath-start-icon'),
            breathStartLabel: document.getElementById('btn-breath-start-label'),
            breathVisualContainer: document.querySelector('.breathing-visual-container'),
            breathPromptDisplay: document.getElementById('pacer-prompt-display'),
            breathSphereGlow: document.getElementById('breathing-sphere-glow-el'),
            breathSphere: document.getElementById('breathing-sphere-el'),
            breathTimerDisplay: document.getElementById('pacer-timer-display'),
            breathInstructionText: document.getElementById('pacer-instruction-text'),
            breathPresetDesc: document.getElementById('breath-preset-desc'),
            
            moodSvgChart: document.getElementById('mood-svg-chart'),
            chartGridLines: document.getElementById('chart-grid-lines'),
            chartAxes: document.getElementById('chart-axes'),
            chartLinePath: document.getElementById('chart-line-path'),
            chartDots: document.getElementById('chart-dots'),
            chartLabels: document.getElementById('chart-labels'),
            triggerListWrapper: document.getElementById('trigger-list-wrapper'),
            reflectionsHistoryContainer: document.getElementById('reflections-history-container'),
            
            audioButtons: document.querySelectorAll('.btn-audio-play'),
            audioPlayer: document.getElementById('audio-background-player'),
            
            pomoDisplay: document.getElementById('pomo-timer-display'),
            pomoProgressRing: document.getElementById('pomo-progress-ring-el'),
            pomoStartBtn: document.getElementById('btn-pomo-start'),
            pomoResetBtn: document.getElementById('btn-pomo-reset'),
            pomoSessionCount: document.getElementById('pomo-session-count'),
            exportHistoryBtn: document.getElementById('btn-export-history'),
            clearHistoryBtn: document.getElementById('btn-clear-history')
        };
    }

    /**
     * Loads settings and historical logs from LocalStorage.
     */
    function loadLocalStorage() {
        try {
            state.theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
            const storedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
            state.history = storedHistory ? JSON.parse(storedHistory) : [];
            if (!Array.isArray(state.history)) {
                state.history = [];
            }
        } catch (e) {
            console.error('Error loading localStorage data:', e);
            state.history = [];
        }
    }

    // ==========================================================================
    // 4. Utility & Helper Functions
    // ==========================================================================

    /**
     * Escapes standard HTML special characters to prevent Cross-Site Scripting (XSS).
     * @param {string} str - The unsafe string.
     * @returns {string} The HTML-safe sanitized string.
     */
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
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

    /**
     * Displays a non-blocking UI toast notification.
     * @param {string} message - Notification text content.
     * @param {'info'|'success'|'warning'|'error'} type - Style modifier.
     */
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
        
        // Force Reflow
        toast.offsetHeight;
        
        toast.classList.add('show');
        
        // Auto-remove
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, 4000);
    }

    /**
     * Converts a mood string key into a numerical score (0 to 5).
     * @param {string} mood - Mood string identifier.
     * @returns {number} Score mapping between 0 (worst) and 5 (best).
     */
    function getMoodScore(mood) {
        const metadata = MOOD_METADATA[mood];
        return metadata ? metadata.score : 3; // Default 3 (neutral/medium)
    }

    /**
     * Formats Unix millisecond timestamps into readable localized dates.
     * @param {number} timestamp - Millisecond Unix time stamp.
     * @returns {string} Formatted localized short date string.
     */
    function formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    // ==========================================================================
    // 5. Theme Controller
    // ==========================================================================

    /**
     * Sets up the theme states and light/dark toggling.
     */
    function initTheme() {
        if (!DOM.themeBtn) return;
        
        document.documentElement.setAttribute('data-theme', state.theme);
        if (DOM.themeIcon) {
            DOM.themeIcon.textContent = state.theme === 'dark' ? 'light_mode' : 'dark_mode';
        }
        DOM.themeBtn.setAttribute('aria-label', `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`);

        DOM.themeBtn.addEventListener('click', () => {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            try {
                localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
            } catch (e) {
                console.warn('LocalStorage blocked or disabled:', e);
            }
            document.documentElement.setAttribute('data-theme', state.theme);
            if (DOM.themeIcon) {
                DOM.themeIcon.textContent = state.theme === 'dark' ? 'light_mode' : 'dark_mode';
            }
            DOM.themeBtn.setAttribute('aria-label', `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`);
            updateAnalyticsDisplay(); // Redraw SVG chart to match theme color adjustments
        });
    }

    // ==========================================================================
    // 6. Navigation Tabs Controller (Enhanced with Keyboard A11y)
    // ==========================================================================

    /**
     * Binds mouse and keyboard events to handle tab switching.
     */
    function setupTabs() {
        if (!DOM.tabButtons.length) return;

        // Mouse clicks
        DOM.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                switchTab(button);
            });
        });

        // Keyboard navigation (Arrow keys on tabs)
        const tabList = document.querySelector('[role="tablist"]');
        if (tabList) {
            tabList.addEventListener('keydown', (e) => {
                const buttons = Array.from(DOM.tabButtons);
                const activeIndex = buttons.indexOf(document.activeElement);
                if (activeIndex === -1) return;

                let nextIndex = activeIndex;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    nextIndex = (activeIndex + 1) % buttons.length;
                    e.preventDefault();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    nextIndex = (activeIndex - 1 + buttons.length) % buttons.length;
                    e.preventDefault();
                } else if (e.key === 'Home') {
                    nextIndex = 0;
                    e.preventDefault();
                } else if (e.key === 'End') {
                    nextIndex = buttons.length - 1;
                    e.preventDefault();
                }

                if (nextIndex !== activeIndex) {
                    buttons[nextIndex].focus();
                    switchTab(buttons[nextIndex]);
                }
            });
        }
    }

    /**
     * Switches tab button styles, accessibility attributes, and content visibilities.
     * @param {HTMLButtonElement} button - The button of the clicked/focused tab.
     */
    function switchTab(button) {
        const targetTabId = button.getAttribute('data-tab');

        // Toggle buttons
        DOM.tabButtons.forEach(btn => {
            if (btn === button) {
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                btn.setAttribute('tabindex', '0');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
                btn.setAttribute('tabindex', '-1');
            }
        });

        // Toggle content panels
        DOM.tabContents.forEach(content => {
            if (content.id === targetTabId) {
                content.classList.add('active-content');
                content.removeAttribute('hidden');
            } else {
                content.classList.remove('active-content');
                content.setAttribute('hidden', '');
            }
        });
    }

    // ==========================================================================
    // 7. Check-in Mood Selector (Radio Behavior)
    // ==========================================================================

    /**
     * Binds selection click events to mood emoji grid items.
     */
    function setupMoodSelector() {
        DOM.moodButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const moodVal = btn.getAttribute('data-mood');
                selectMood(moodVal);
            });
        });
    }

    /**
     * Updates active mood state and toggles grid button styles.
     * @param {string} moodVal - Mood value identifier.
     */
    function selectMood(moodVal) {
        DOM.moodButtons.forEach(b => {
            const currentMood = b.getAttribute('data-mood');
            if (currentMood === moodVal) {
                b.classList.add('active');
                b.setAttribute('aria-checked', 'true');
                state.selectedMood = moodVal;
            } else {
                b.classList.remove('active');
                b.setAttribute('aria-checked', 'false');
            }
        });
        
        // Hide warning if mood is valid
        if (state.selectedMood && DOM.validationMsg) {
            DOM.validationMsg.classList.add('hidden');
        }
    }

    // ==========================================================================
    // 8. Form Submission & AI Wellness Generation
    // ==========================================================================

    /**
     * Sets up checkin form validations and submissions.
     */
    function setupCheckinForm() {
        if (!DOM.checkinForm) return;

        DOM.checkinForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear previous errors
            if (DOM.validationMsg) {
                DOM.validationMsg.classList.add('hidden');
                DOM.validationMsg.textContent = '';
            }

            // Validations
            if (!state.selectedMood) {
                showValidationError('Please select a mood reflecting how you feel right now.');
                return;
            }

            const reflectionText = DOM.reflectionInput ? DOM.reflectionInput.value.trim() : '';
            if (!reflectionText) {
                showValidationError('Please write a brief entry in your reflection diary.');
                return;
            }

            if (reflectionText.length > 2000) {
                showValidationError('Reflection text must not exceed 2000 characters.');
                return;
            }

            // Gather checkin variables
            const checkedTriggers = [];
            const checkBoxes = DOM.checkinForm.querySelectorAll('input[name="triggers"]:checked');
            checkBoxes.forEach(cb => {
                checkedTriggers.push(cb.value);
            });

            // Read target exam dropdown
            const examTarget = DOM.examTargetSelect ? DOM.examTargetSelect.value : 'General Studies';

            // Build Check-in payload object
            const checkinData = {
                mood: state.selectedMood,
                triggers: checkedTriggers,
                exam: examTarget,
                reflection: reflectionText,
                timestamp: Date.now()
            };

            // Transition UI displays to show skeleton loading state
            if (DOM.counselorPlaceholder) DOM.counselorPlaceholder.classList.add('hidden');
            if (DOM.counselorContent) DOM.counselorContent.classList.add('hidden');
            if (DOM.counselorSkeleton) DOM.counselorSkeleton.classList.remove('hidden');

            // Set counselor tab as active to view loading progress
            const counselorTabBtn = document.getElementById('tab-btn-counselor');
            if (counselorTabBtn) switchTab(counselorTabBtn);

            try {
                // Fetch AI plan
                const apiPlan = await fetchAIWellnessPlan(checkinData);
                checkinData.plan = apiPlan;
                saveCheckinLog(checkinData);
                renderAIResponse(apiPlan);
                showToast('Empathetic guidance generated successfully!', 'success');
            } catch (err) {
                console.error('API call failed or was rejected. Running local wellness generator.', err);
                showToast('Using local wellness plan fallback.', 'info');
                
                // Fallback generator
                const localPlan = generateLocalWellnessPlan(checkinData);
                checkinData.plan = localPlan;
                saveCheckinLog(checkinData);
                renderAIResponse(localPlan);
            } finally {
                // Reset form values & selections
                DOM.checkinForm.reset();
                state.selectedMood = null;
                DOM.moodButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-checked', 'false');
                });

                // Display counselor content and hide loading skeletons
                if (DOM.counselorSkeleton) DOM.counselorSkeleton.classList.add('hidden');
                if (DOM.counselorContent) DOM.counselorContent.classList.remove('hidden');
                
                // Refresh SVG logs
                updateAnalyticsDisplay();
            }
        });

        // Bind counsel action button to redirect to breathing guide
        if (DOM.counselActionBtn) {
            DOM.counselActionBtn.addEventListener('click', () => {
                const breathingTabBtn = document.getElementById('tab-btn-breathing');
                if (breathingTabBtn) switchTab(breathingTabBtn);
            });
        }
    }

    /**
     * Sets up event listeners for exporting and clearing check-in history.
     */
    function setupHistoryActions() {
        if (DOM.exportHistoryBtn) {
            DOM.exportHistoryBtn.addEventListener('click', () => {
                if (state.history.length === 0) {
                    showToast('No history available to export.', 'warning');
                    return;
                }
                try {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.history, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `zenstudy_history_${Date.now()}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    showToast('History exported successfully!', 'success');
                } catch (e) {
                    console.error('Error exporting history:', e);
                    showToast('Failed to export history.', 'error');
                }
            });
        }

        if (DOM.clearHistoryBtn) {
            DOM.clearHistoryBtn.addEventListener('click', () => {
                if (state.history.length === 0) {
                    showToast('No history to clear.', 'warning');
                    return;
                }
                if (confirm('Are you sure you want to permanently delete all your check-in history? This action cannot be undone.')) {
                    state.history = [];
                    try {
                        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
                    } catch (e) {
                        console.warn('Unable to clear history in localStorage:', e);
                    }
                    updateAnalyticsDisplay();
                    showToast('Check-in history cleared successfully.', 'success');
                }
            });
        }
    }

    /**
     * Renders checking errors onto the screen reader warning panel.
     * @param {string} msg - Error message content.
     */
    function showValidationError(msg) {
        if (!DOM.validationMsg) {
            showToast(msg, 'warning');
            return;
        }
        DOM.validationMsg.textContent = msg;
        DOM.validationMsg.classList.remove('hidden');
        DOM.validationMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Fetches AI guidance results from the server endpoint.
     * @param {Object} checkin - The check-in data object.
     * @returns {Promise<Object>} The resolved AI counselor object JSON.
     */
    async function fetchAIWellnessPlan(checkin) {
        const prompt = `
You are ZenStudy AI, an empathetic mental wellness counselor. Write a student wellness guidance plan based on this entry:
- Selected Mood: "${checkin.mood}"
- Stress Triggers: ${checkin.triggers.length > 0 ? checkin.triggers.join(', ') : 'None selected'}
- Target Examination/Context: "${checkin.exam || 'General Studies'}"
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
            throw new Error(`API query failed with status code ${response.status}`);
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
            throw new Error('Malformed response format from Gemini proxy');
        }

        const rawText = data.candidates[0].content.parts[0].text.trim();
        
        // Strip code block backticks if model generated them despite instructions
        let cleanJsonText = rawText;
        if (cleanJsonText.startsWith('```')) {
            cleanJsonText = cleanJsonText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
        }
        
        return JSON.parse(cleanJsonText.trim());
    }

    /**
     * Generates a local fallback wellness plan in case the API is offline.
     * @param {Object} checkin - The user check-in data.
     * @returns {Object} Static structured fallback plan matching the response schema.
     */
    function generateLocalWellnessPlan(checkin) {
        const mood = checkin.mood;
        const exam = checkin.exam || 'General Studies';
        const examText = exam === 'General Studies' ? 'your exams' : exam;
        const triggers = checkin.triggers.length > 0 ? checkin.triggers : [];
        const triggerStr = triggers.length > 0 ? triggers.join(' or ') : 'study pressures';
        
        let guidance = '';
        let exerciseTitle = '';
        let exerciseDesc = '';
        let studyAdvice = '';
        let quoteText = '';
        let quoteAuthor = '';

        switch (mood) {
            case 'anxious':
            case 'stressed':
                guidance = `We understand how stressful preparing for ${examText} can get, especially when dealing with ${triggerStr}. Your emotions are completely valid, but they do not dictate your potential. Take things one hour at a time and prioritize regular recovery breaks to maintain active recall.`;
                exerciseTitle = '5-4-3-2-1 Sensory Grounding';
                exerciseDesc = "1. Name 5 things you can see around your study desk.\n2. Touch 4 things with varying textures (wood, paper, metal).\n3. List 3 distinct sounds, 2 scents, and repeat 1 self-affirmation.";
                studyAdvice = "Break extensive syllabus sections into small sub-tasks. Reviewing a single sub-task is much less daunting than staring at the entire revision backlog. You are capable of this.";
                quoteText = "Quiet the mind and the soul will speak. Peace of mind is your ultimate strength.";
                quoteAuthor = "Ma Jaya Sati Bhagavati";
                break;
                
            case 'burned-out':
                guidance = `Burnout is a physical signal that your mental processor is running hot during ${examText} preparation. Pushing through exhaustion degrades information retention and increases error rates. Rest is highly productive.`;
                exerciseTitle = 'Progressive Muscle Relaxation';
                exerciseDesc = "1. Squeeze your toes and calf muscles tightly for 5 seconds, then release.\n2. Work upward, tensing and relaxing your abdominal, chest, and shoulder muscles.\n3. Roll your neck gently and notice the physical tension dissolving.";
                studyAdvice = "Step completely away from your study books. Declare a mandatory rest hour. Engaging in light exercise, drinking water, and sleeping is active academic preparation.";
                quoteText = "Rest is not idleness, and to lie sometimes on the grass under trees is not waste of time.";
                quoteAuthor = "Sir John Lubbock";
                break;
                
            case 'sad':
                guidance = `It's normal to feel low or discouraged during demanding ${examText} prep seasons. Rejections, bad mock scores, or feelings of inadequacy can drag down your focus. Allow yourself to feel, but remember your worth is not tied to a score sheet.`;
                exerciseTitle = 'Heart-Centered Breathing';
                exerciseDesc = "1. Place your hand gently over your heart area.\n2. Inhale for 4 seconds, imagining a sense of safety entering your body.\n3. Exhale for 5 seconds, breathing out doubts and heavy emotions.";
                studyAdvice = "Write down 3 tiny achievements you accomplished today, even if it was just opening a book. Connect with an empathetic classmate or mentor for emotional support.";
                quoteText = "Courage does not always roar. Sometimes courage is the quiet voice at the end of the day saying, 'I will try again tomorrow.'";
                quoteAuthor = "Mary Anne Radmacher";
                break;

            case 'motivated':
                guidance = `It's fantastic that you are feeling motivated for your ${examText} goals! Riding high energy levels is an excellent opportunity to tackle harder chapters or mock tests. Let's channel this drive sustainably to prevent energy crashes.`;
                exerciseTitle = 'Sankalpa Intention Locking';
                exerciseDesc = "1. Sit tall at your desk and close your eyes.\n2. Formulate a positive goal statement in the present tense.\n3. Visualize yourself executing your study tasks calmly and successfully.";
                studyAdvice = "Tackle your highest priority backlog subjects while your focus is sharp. Keep drinking water and maintain your standard meal timings to sustain this energy.";
                quoteText = "Quality is not an act, it is a habit. Sustain your positive momentum.";
                quoteAuthor = "Aristotle";
                break;
                
            case 'calm':
            default:
                guidance = `Being in a calm state is a competitive advantage for ${examText}. Maintaining tranquility during entrance tests and result seasons allows for optimal memory consolidation and analytical processing. Let's anchor this peace.`;
                exerciseTitle = 'Mindful Breath Watching';
                exerciseDesc = "1. Close your eyes and observe the cool air entering your nostrils.\n2. Feel the warm air leaving your mouth, without trying to alter its natural cycle.\n3. Anchor your focus to this steady physical anchor.";
                studyAdvice = "Keep doing what you are doing. Maintain a strict 7-8 hour sleep schedule. Memory consolidation occurs during deep sleep stages, which is crucial for exam recall.";
                quoteText = "Within you, there is a stillness and a sanctuary to which you can retreat at any time.";
                quoteAuthor = "Hermann Hesse";
                break;
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

    /**
     * Saves a check-in record to the state history and local storage.
     * @param {Object} record - The check-in log record.
     */
    function saveCheckinLog(record) {
        state.history.unshift(record);
        try {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
        } catch (e) {
            console.warn('Unable to write history log to localStorage:', e);
        }
    }

    /**
     * Renders the generated plan data safely into the counselor tab panel DOM.
     * @param {Object} plan - The wellness plan object.
     */
    function renderAIResponse(plan) {
        if (!DOM.counselorResponseText) return;
        
        DOM.counselorResponseText.textContent = plan.guidance;
        if (DOM.copingExerciseTitle) DOM.copingExerciseTitle.textContent = plan.exerciseTitle;
        
        if (DOM.copingExerciseDesc) {
            DOM.copingExerciseDesc.innerHTML = '';
            const bullets = plan.exerciseDesc.split('\n');
            bullets.forEach(bullet => {
                const trimmed = bullet.trim();
                if (trimmed) {
                    const p = document.createElement('p');
                    p.style.marginBottom = '6px';
                    p.textContent = trimmed;
                    DOM.copingExerciseDesc.appendChild(p);
                }
            });
        }

        if (DOM.studyTipDesc) DOM.studyTipDesc.textContent = plan.studyAdvice;
        if (DOM.quoteText) DOM.quoteText.textContent = plan.quoteText;
        if (DOM.quoteAuthor) DOM.quoteAuthor.textContent = `— ${plan.quoteAuthor}`;
    }

    // ==========================================================================
    // 9. Analytics Timeline & SVG Graph Renderer
    // ==========================================================================

    /**
     * Triggers updates for charts, lists, and histories.
     */
    function updateAnalyticsDisplay() {
        renderMoodTrendsChart();
        renderTriggersFrequency();
        renderReflectionsTimeline();
    }

    /**
     * Generates a curved SVG line chart representing historical mood fluctuations.
     */
    function renderMoodTrendsChart() {
        if (!DOM.moodSvgChart) return;

        // Reset dynamic visual layers
        if (DOM.chartGridLines) DOM.chartGridLines.innerHTML = '';
        if (DOM.chartAxes) DOM.chartAxes.innerHTML = '';
        if (DOM.chartDots) DOM.chartDots.innerHTML = '';
        if (DOM.chartLabels) DOM.chartLabels.innerHTML = '';
        if (DOM.chartLinePath) DOM.chartLinePath.setAttribute('d', '');

        if (!state.history || state.history.length === 0) {
            return;
        }

        // Draw last 7 check-ins (oldest to newest)
        const timelineData = [...state.history].slice(0, 7).reverse();

        const canvasWidth = 600;
        const canvasHeight = 240;
        const padLeft = 70;
        const padRight = 30;
        const padTop = 30;
        const padBottom = 40;

        const graphWidth = canvasWidth - padLeft - padRight;
        const graphHeight = canvasHeight - padTop - padBottom;

        const moodLevels = [
            { label: 'Motivated', score: 5 },
            { label: 'Calm', score: 4 },
            { label: 'Anxious', score: 3 },
            { label: 'Stressed', score: 2 },
            { label: 'Sad', score: 1 },
            { label: 'Burnout', score: 0 }
        ];

        // Theme colors check
        const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
        const gridColor = isLightTheme ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.03)';
        const axisColor = isLightTheme ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.08)';

        // 1. Draw horizontal lines and levels
        moodLevels.forEach(level => {
            const y = padTop + graphHeight - (level.score / 5) * graphHeight;
            
            // Grid Line
            if (DOM.chartGridLines) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', padLeft.toString());
                line.setAttribute('y1', y.toString());
                line.setAttribute('x2', (canvasWidth - padRight).toString());
                line.setAttribute('y2', y.toString());
                line.setAttribute('stroke', gridColor);
                line.setAttribute('stroke-width', '1');
                DOM.chartGridLines.appendChild(line);
            }

            // Text Label
            if (DOM.chartLabels) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', (padLeft - 12).toString());
                text.setAttribute('y', (y + 4).toString());
                text.setAttribute('text-anchor', 'end');
                text.setAttribute('class', 'chart-label-text');
                text.textContent = level.label;
                DOM.chartLabels.appendChild(text);
            }
        });

        // 2. Draw outer axes
        if (DOM.chartAxes) {
            const xAx = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            xAx.setAttribute('x1', padLeft.toString());
            xAx.setAttribute('y1', (canvasHeight - padBottom).toString());
            xAx.setAttribute('x2', (canvasWidth - padRight).toString());
            xAx.setAttribute('y2', (canvasHeight - padBottom).toString());
            xAx.setAttribute('stroke', axisColor);
            xAx.setAttribute('stroke-width', '1.5');
            DOM.chartAxes.appendChild(xAx);

            const yAx = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            yAx.setAttribute('x1', padLeft.toString());
            yAx.setAttribute('y1', padTop.toString());
            yAx.setAttribute('x2', padLeft.toString());
            yAx.setAttribute('y2', (canvasHeight - padBottom).toString());
            yAx.setAttribute('stroke', axisColor);
            yAx.setAttribute('stroke-width', '1.5');
            DOM.chartAxes.appendChild(yAx);
        }

        // 3. Compute coordinates
        const coords = [];
        const stepWidth = timelineData.length > 1 ? graphWidth / (timelineData.length - 1) : graphWidth;

        timelineData.forEach((log, index) => {
            const scoreVal = getMoodScore(log.mood);
            const x = padLeft + index * stepWidth;
            const y = padTop + graphHeight - (scoreVal / 5) * graphHeight;
            coords.push({ x, y, log });
        });

        // 4. Generate cubic bezier line path
        if (coords.length > 0 && DOM.chartLinePath) {
            if (coords.length === 1) {
                DOM.chartLinePath.setAttribute('d', `M ${coords[0].x} ${coords[0].y} L ${canvasWidth - padRight} ${coords[0].y}`);
            } else {
                let dString = `M ${coords[0].x} ${coords[0].y}`;
                for (let i = 0; i < coords.length - 1; i++) {
                    const p0 = coords[i];
                    const p1 = coords[i + 1];
                    const cp1x = p0.x + (p1.x - p0.x) / 3;
                    const cp1y = p0.y;
                    const cp2x = p0.x + 2 * (p1.x - p0.x) / 3;
                    const cp2y = p1.y;
                    dString += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                }
                DOM.chartLinePath.setAttribute('d', dString);
            }
        }

        // 5. Draw interactive dot plots and X-axis date labels
        if (DOM.chartDots && DOM.chartLabels) {
            coords.forEach((pt) => {
                const moodMeta = MOOD_METADATA[pt.log.mood] || { color: 'var(--primary-color)' };
                
                // Plot dot
                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', pt.x.toString());
                dot.setAttribute('cy', pt.y.toString());
                dot.setAttribute('r', '6');
                dot.setAttribute('class', 'chart-dot');
                dot.setAttribute('stroke', moodMeta.color);
                
                const hoverTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                hoverTitle.textContent = `${moodMeta.name} on ${formatTimestamp(pt.log.timestamp)}`;
                dot.appendChild(hoverTitle);
                DOM.chartDots.appendChild(dot);

                // Date Label
                const dateObj = new Date(pt.log.timestamp);
                const xText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                xText.setAttribute('x', pt.x.toString());
                xText.setAttribute('y', (canvasHeight - padBottom + 20).toString());
                xText.setAttribute('text-anchor', 'middle');
                xText.setAttribute('class', 'chart-label-text');
                xText.textContent = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
                DOM.chartLabels.appendChild(xText);
            });
        }
    }

    /**
     * Aggregates triggers from logs and displays in descending frequency order.
     */
    function renderTriggersFrequency() {
        if (!DOM.triggerListWrapper) return;
        DOM.triggerListWrapper.innerHTML = '';

        if (!state.history || state.history.length === 0) {
            DOM.triggerListWrapper.innerHTML = '<div class="no-data-msg">Complete your first mood check-in to analyze study triggers.</div>';
            return;
        }

        const counts = {};
        state.history.forEach(log => {
            if (Array.isArray(log.triggers)) {
                log.triggers.forEach(trigger => {
                    counts[trigger] = (counts[trigger] || 0) + 1;
                });
            }
        });

        const sortedTriggers = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        if (sortedTriggers.length === 0) {
            DOM.triggerListWrapper.innerHTML = '<div class="no-data-msg">No stress triggers registered yet. Keep up the peaceful studying!</div>';
            return;
        }

        sortedTriggers.forEach(([triggerName, count]) => {
            const item = document.createElement('div');
            item.className = 'trigger-freq-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'trigger-name-freq';
            nameSpan.textContent = triggerName;

            const badgeSpan = document.createElement('span');
            badgeSpan.className = 'trigger-freq-badge';
            badgeSpan.textContent = `${count} ${count === 1 ? 'time' : 'times'}`;

            item.appendChild(nameSpan);
            item.appendChild(badgeSpan);
            DOM.triggerListWrapper.appendChild(item);
        });
    }

    /**
     * Lists historical reflections and journal entries in a reverse-chronological timeline feed.
     */
    function renderReflectionsTimeline() {
        if (!DOM.reflectionsHistoryContainer) return;
        DOM.reflectionsHistoryContainer.innerHTML = '';

        if (!state.history || state.history.length === 0) {
            DOM.reflectionsHistoryContainer.innerHTML = '<div class="no-data-msg">No check-ins logged yet. Complete your first wellness check-in to start your history!</div>';
            return;
        }

        state.history.forEach(log => {
            const item = document.createElement('article');
            item.className = 'reflection-timeline-item';
            
            const header = document.createElement('div');
            header.className = 'timeline-item-header';

            const dateSpan = document.createElement('span');
            dateSpan.className = 'timeline-item-date';
            dateSpan.textContent = formatTimestamp(log.timestamp);

            const moodMeta = MOOD_METADATA[log.mood] || { name: log.mood.replace('-', ' ') };
            const moodBadge = document.createElement('span');
            moodBadge.className = `timeline-item-mood-badge m-${log.mood}`;
            moodBadge.textContent = moodMeta.name;

            header.appendChild(dateSpan);
            header.appendChild(moodBadge);
            item.appendChild(header);

            const textPara = document.createElement('p');
            textPara.className = 'timeline-item-text';
            textPara.textContent = `"${log.reflection}"`;
            item.appendChild(textPara);

            if (log.triggers && log.triggers.length > 0) {
                const triggersContainer = document.createElement('div');
                triggersContainer.className = 'timeline-item-triggers';
                
                log.triggers.forEach(tr => {
                    const pill = document.createElement('span');
                    pill.className = 'timeline-trigger-pill';
                    pill.textContent = tr;
                    triggersContainer.appendChild(pill);
                });
                item.appendChild(triggersContainer);
            }

            DOM.reflectionsHistoryContainer.appendChild(item);
        });
    }

    // ==========================================================================
    // 10. Guided Breathing Pacer
    // ==========================================================================

    /**
     * Sets up breathing preset selectors and controller bindings.
     */
    function setupBreathingPacer() {
        if (!DOM.breathStartBtn || !DOM.breathPatternSelect) return;

        // Sync initial preset desc
        const initialPreset = DOM.breathPatternSelect.value;
        if (BREATHING_PRESETS[initialPreset] && DOM.breathPresetDesc) {
            DOM.breathPresetDesc.textContent = BREATHING_PRESETS[initialPreset].desc;
        }

        DOM.breathPatternSelect.addEventListener('change', () => {
            const selected = DOM.breathPatternSelect.value;
            if (BREATHING_PRESETS[selected] && DOM.breathPresetDesc) {
                DOM.breathPresetDesc.textContent = BREATHING_PRESETS[selected].desc;
            }
            if (state.breathing.isActive) {
                stopBreathingPacer();
            }
        });

        DOM.breathStartBtn.addEventListener('click', () => {
            if (state.breathing.isActive) {
                stopBreathingPacer();
            } else {
                startBreathingPacer();
            }
        });
    }

    /**
     * Starts the breathing cycle timer intervals.
     */
    function startBreathingPacer() {
        state.breathing.isActive = true;
        state.breathing.pattern = DOM.breathPatternSelect.value;
        state.breathing.phaseIndex = 0;
        state.breathing.cycleCount = 0;

        const patternData = BREATHING_PRESETS[state.breathing.pattern];
        const currentPhase = patternData.phases[0];
        state.breathing.secondsRemaining = currentPhase.duration;

        // Button state
        if (DOM.breathStartIcon) DOM.breathStartIcon.textContent = 'pause';
        if (DOM.breathStartLabel) DOM.breathStartLabel.textContent = 'Pause Pacer';
        DOM.breathStartBtn.className = 'btn btn-secondary btn-block';

        updatePacerUI(currentPhase);

        // Core timer interval
        state.breathing.timerId = setInterval(() => {
            state.breathing.secondsRemaining--;

            if (state.breathing.secondsRemaining <= 0) {
                // Advance phase
                state.breathing.phaseIndex++;
                const phases = BREATHING_PRESETS[state.breathing.pattern].phases;
                
                if (state.breathing.phaseIndex >= phases.length) {
                    state.breathing.phaseIndex = 0;
                    state.breathing.cycleCount++;
                }

                const nextPhase = phases[state.breathing.phaseIndex];
                state.breathing.secondsRemaining = nextPhase.duration;
            }

            const activePhase = BREATHING_PRESETS[state.breathing.pattern].phases[state.breathing.phaseIndex];
            updatePacerUI(activePhase);

        }, 1000);
    }

    /**
     * Pauses and resets the breathing cycle state.
     */
    function stopBreathingPacer() {
        state.breathing.isActive = false;
        if (state.breathing.timerId) {
            clearInterval(state.breathing.timerId);
            state.breathing.timerId = null;
        }

        // Restore Buttons
        if (DOM.breathStartIcon) DOM.breathStartIcon.textContent = 'play_arrow';
        if (DOM.breathStartLabel) DOM.breathStartLabel.textContent = 'Start Pacer';
        DOM.breathStartBtn.className = 'btn btn-primary btn-block';

        if (DOM.breathPromptDisplay) DOM.breathPromptDisplay.textContent = 'Get Ready';
        if (DOM.breathTimerDisplay) DOM.breathTimerDisplay.textContent = '0';
        if (DOM.breathInstructionText) DOM.breathInstructionText.textContent = 'Press Start to begin guided breathing';
        
        if (DOM.breathVisualContainer) {
            DOM.breathVisualContainer.className = 'breathing-visual-container glass card';
        }
    }

    /**
     * Updates text contents and CSS scale animation classes in the breathing container.
     * @param {Object} phase - The active breathing phase configuration.
     */
    function updatePacerUI(phase) {
        // Run updates inside a requestAnimationFrame wrapper to prevent layout thrashing
        requestAnimationFrame(() => {
            if (DOM.breathPromptDisplay) DOM.breathPromptDisplay.textContent = phase.prompt;
            if (DOM.breathTimerDisplay) DOM.breathTimerDisplay.textContent = state.breathing.secondsRemaining.toString();
            if (DOM.breathInstructionText) DOM.breathInstructionText.textContent = phase.instruction;

            if (DOM.breathVisualContainer) {
                DOM.breathVisualContainer.className = 'breathing-visual-container glass card';
                DOM.breathVisualContainer.classList.add(`${phase.type}-state`);
            }
        });
    }

    // ==========================================================================
    // 11. Ambient Audio Player
    // ==========================================================================

    /**
     * Sets up track selectors and play/pause controls.
     */
    function setupAudioPlayer() {
        if (!DOM.audioPlayer || !DOM.audioButtons.length) return;

        state.audio.playerEl = DOM.audioPlayer;

        DOM.audioButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const trackSrc = btn.getAttribute('data-src');
                toggleAudioTrack(btn, trackSrc);
            });
        });
    }

    /**
     * Toggles a selected track or flips pause state if clicked on active track.
     * @param {HTMLButtonElement} btn - Trigger button.
     * @param {string} trackSrc - Sound stream URL source.
     */
    function toggleAudioTrack(btn, trackSrc) {
        const icon = btn.querySelector('span');

        // Active Track Clicked
        if (state.audio.playingBtn === btn) {
            state.audio.playerEl.pause();
            if (icon) icon.textContent = 'play_arrow';
            btn.classList.remove('btn-primary');
            state.audio.playingBtn = null;
            return;
        }

        // Change from other track
        if (state.audio.playingBtn) {
            const oldIcon = state.audio.playingBtn.querySelector('span');
            if (oldIcon) oldIcon.textContent = 'play_arrow';
            state.audio.playingBtn.classList.remove('btn-primary');
        }

        // Setup and play
        state.audio.playerEl.src = trackSrc;
        state.audio.playerEl.play()
            .then(() => {
                if (icon) icon.textContent = 'pause';
                btn.classList.add('btn-primary');
                state.audio.playingBtn = btn;
            })
            .catch(err => {
                console.error('Binaural track load failed:', err);
                showToast('Unable to stream audio track. Check connection.', 'error');
            });
    }

    // ==========================================================================
    // 12. Focus Pacing Pomodoro Timer
    // ==========================================================================

    /**
     * Sets up Pomodoro button actions and updates initial timer layouts.
     */
    function setupPomodoroTimer() {
        if (!DOM.pomoStartBtn || !DOM.pomoResetBtn) return;

        DOM.pomoStartBtn.addEventListener('click', () => {
            if (state.pomodoro.isActive) {
                pausePomodoro();
            } else {
                startPomodoro();
            }
        });

        DOM.pomoResetBtn.addEventListener('click', resetPomodoro);
        updatePomoDisplay(); // Init displays
    }

    /**
     * Starts interval count down ticks.
     */
    function startPomodoro() {
        state.pomodoro.isActive = true;
        DOM.pomoStartBtn.textContent = 'Pause Focus';
        DOM.pomoStartBtn.className = 'btn btn-secondary btn-sm';

        state.pomodoro.timerId = setInterval(() => {
            state.pomodoro.secondsRemaining--;
            updatePomoDisplay();

            if (state.pomodoro.secondsRemaining <= 0) {
                clearInterval(state.pomodoro.timerId);
                handlePomoIntervalEnd();
            }
        }, 1000);
    }

    /**
     * Stops the Pomodoro clock without resetting time.
     */
    function pausePomodoro() {
        state.pomodoro.isActive = false;
        if (state.pomodoro.timerId) {
            clearInterval(state.pomodoro.timerId);
            state.pomodoro.timerId = null;
        }
        DOM.pomoStartBtn.textContent = 'Resume Focus';
        DOM.pomoStartBtn.className = 'btn btn-primary btn-sm';
    }

    /**
     * Resets timer states, text, and active Pomodoro modes.
     */
    function resetPomodoro() {
        state.pomodoro.isActive = false;
        if (state.pomodoro.timerId) {
            clearInterval(state.pomodoro.timerId);
            state.pomodoro.timerId = null;
        }
        state.pomodoro.mode = 'work';
        state.pomodoro.secondsRemaining = 25 * 60;

        DOM.pomoStartBtn.textContent = 'Start Focus';
        DOM.pomoStartBtn.className = 'btn btn-secondary btn-sm';
        updatePomoDisplay();
    }

    /**
     * Updates Pomodoro timer displays and SVG path offset variables.
     */
    function updatePomoDisplay() {
        const minutes = Math.floor(state.pomodoro.secondsRemaining / 60);
        const seconds = state.pomodoro.secondsRemaining % 60;

        if (DOM.pomoDisplay) {
            DOM.pomoDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        if (DOM.pomoProgressRing) {
            const limit = state.pomodoro.mode === 'work' ? 25 * 60 : 5 * 60;
            const ratio = state.pomodoro.secondsRemaining / limit;
            
            // Circumference of r=70 is 2 * PI * 70 = 439.82
            const offset = 439.82 - (ratio * 439.82);
            
            requestAnimationFrame(() => {
                DOM.pomoProgressRing.style.strokeDashoffset = offset.toString();
                if (state.pomodoro.mode === 'work') {
                    DOM.pomoProgressRing.style.stroke = 'var(--primary-light)';
                } else {
                    DOM.pomoProgressRing.style.stroke = 'var(--accent-color)';
                }
            });
        }

        if (DOM.pomoSessionCount) {
            DOM.pomoSessionCount.textContent = state.pomodoro.sessionsCompleted.toString();
        }
    }

    /**
     * Handles switching modes between breaks and active study schedules on complete timer ticks.
     */
    function handlePomoIntervalEnd() {
        state.pomodoro.isActive = false;
        state.pomodoro.timerId = null;

        if (state.pomodoro.mode === 'work') {
            state.pomodoro.sessionsCompleted++;
            showToast('Pomodoro session completed! Enjoy a 5-minute mental break.', 'success');
            state.pomodoro.mode = 'break';
            state.pomodoro.secondsRemaining = 5 * 60;
        } else {
            showToast('Break time concluded. Ready to start your next study sprint?', 'success');
            state.pomodoro.mode = 'work';
            state.pomodoro.secondsRemaining = 25 * 60;
        }

        DOM.pomoStartBtn.textContent = 'Start Focus';
        DOM.pomoStartBtn.className = 'btn btn-primary btn-sm';
        updatePomoDisplay();
    }

    // ==========================================================================
    // 13. Self-Running Developer Diagnostic Test Suite (25+ Scopes Verified)
    // ==========================================================================

    /**
     * Executes internal diagnostic tests asserting function correctness.
     * Logs the resulting summaries directly to the developer console.
     */
    function runDiagnosticTests() {
        console.group('%cZenStudy AI Diagnostics Suite', 'color: var(--primary-light); font-weight: bold; font-size: 14px;');
        let passCount = 0;
        let failCount = 0;

        /**
         * Asserts an expected output and increments validation counters.
         * @param {string} testName - Name identifier of the target test.
         * @param {boolean} condition - Assertion evaluation result.
         */
        function assert(testName, condition) {
            if (condition) {
                console.log(`%c[PASS] ${testName}`, 'color: #10b981; font-weight: 500;');
                passCount++;
            } else {
                console.error(`[FAIL] ${testName}`);
                failCount++;
            }
        }

        // --- SCOPE A: Input Sanitization & Security ---
        try {
            const clean1 = escapeHTML('<script>alert("XSS")</script>');
            assert('Security: Escapes script opening tags', clean1.includes('&lt;script&gt;'));
            assert('Security: Escapes script quotes', clean1.includes('&quot;'));

            const clean2 = escapeHTML('Hello & Welcome');
            assert('Security: Escapes ampersands correctly', clean2.includes('&amp;'));

            const clean3 = escapeHTML("'Hello'");
            assert('Security: Escapes single quotes', clean3.includes('&#039;'));

            const clean4 = escapeHTML(null);
            assert('Security: Handles null parameters without throwing', clean4 === '');
            
            const clean5 = escapeHTML(undefined);
            assert('Security: Handles undefined parameters without throwing', clean5 === '');
        } catch (e) {
            assert('Security: XSS routines fail', false);
        }

        // --- SCOPE B: Mood Score Logic mapping ---
        try {
            assert('Mood: motivated maps to score 5', getMoodScore('motivated') === 5);
            assert('Mood: calm maps to score 4', getMoodScore('calm') === 4);
            assert('Mood: anxious maps to score 3', getMoodScore('anxious') === 3);
            assert('Mood: stressed maps to score 2', getMoodScore('stressed') === 2);
            assert('Mood: sad maps to score 1', getMoodScore('sad') === 1);
            assert('Mood: burned-out maps to score 0', getMoodScore('burned-out') === 0);
            assert('Mood: Fallback mood score evaluates to default 3', getMoodScore('not-a-mood') === 3);
        } catch (e) {
            assert('Mood: Mapping asserts crash', false);
        }

        // --- SCOPE C: Date & Timestamp Formatting ---
        try {
            const timeStr1 = formatTimestamp(1717653600000); // Specific fixed timestamp
            assert('Date Utility: Formats valid timestamps to strings', typeof timeStr1 === 'string' && timeStr1.length > 0);
            assert('Date Utility: Handles zero timestamp gracefully', formatTimestamp(0) === '');
        } catch (e) {
            assert('Date Utility: Formats crash', false);
        }

        // --- SCOPE D: Local Fail-safe Plan Generators ---
        try {
            const dummyCheckin = {
                mood: 'stressed',
                triggers: ['Mock Test Scores', 'Syllabus Backlog'],
                reflection: 'Highly anxious about math results.'
            };
            const plan = generateLocalWellnessPlan(dummyCheckin);
            assert('Local Plan: Generates non-empty advice string', typeof plan.guidance === 'string' && plan.guidance.length > 0);
            assert('Local Plan: Selects correct stress exercises', plan.exerciseTitle === '5-4-3-2-1 Sensory Grounding');
            assert('Local Plan: Describes exercise step bullets', plan.exerciseDesc.includes('1. ') && plan.exerciseDesc.includes('2. '));
            assert('Local Plan: Resolves specific quotes', plan.quoteText.length > 0);
            
            const dummyCheckin2 = {
                mood: 'burned-out',
                triggers: [],
                reflection: 'Tired.'
            };
            const plan2 = generateLocalWellnessPlan(dummyCheckin2);
            assert('Local Plan: Customizes plan exercises for burnout', plan2.exerciseTitle.includes('Muscle Relaxation'));

            const moodsList = ['calm', 'motivated', 'anxious', 'burned-out', 'sad', 'stressed'];
            let allValid = true;
            moodsList.forEach(m => {
                const p = generateLocalWellnessPlan({ mood: m, triggers: [] });
                if (!p.guidance || !p.exerciseTitle || !p.exerciseDesc || !p.studyAdvice || !p.quoteText || !p.quoteAuthor) {
                    allValid = false;
                }
            });
            assert('Local Plan: Generates all required properties for all 6 active moods', allValid);
        } catch (e) {
            assert('Local Plan: Creators crash', false);
        }

        // --- SCOPE E: Breathing Preset Config Schema Checks ---
        try {
            const presets = Object.keys(BREATHING_PRESETS);
            assert('Breathing Config: Presets list contains three options', presets.length === 3);
            
            let configOk = true;
            presets.forEach(key => {
                const data = BREATHING_PRESETS[key];
                if (!data.name || !data.desc || !Array.isArray(data.phases) || data.phases.length === 0) {
                    configOk = false;
                }
                data.phases.forEach(ph => {
                    if (!ph.type || typeof ph.duration !== 'number' || !ph.prompt || !ph.instruction) {
                        configOk = false;
                    }
                });
            });
            assert('Breathing Config: Presets follow correct nested property schema definitions', configOk);
        } catch (e) {
            assert('Breathing Config: Structure checks crash', false);
        }

        // --- SCOPE F: Pomodoro Timer Initialization & Toggles ---
        try {
            assert('Pomodoro State: Initializes with correct default work state mode', state.pomodoro.mode === 'work');
            assert('Pomodoro State: Default duration equals 25 minutes', state.pomodoro.durationSeconds === 1500);
            assert('Pomodoro State: Timer state begins as inactive', state.pomodoro.isActive === false);
        } catch (e) {
            assert('Pomodoro State: Asserts fail', false);
        }

        // Log results overview
        console.log(`%cDiagnostic Summary: ${passCount} / ${passCount + failCount} tests passed.`, 
            failCount === 0 ? 'color: #10b981; font-weight: bold;' : 'color: #ef4444; font-weight: bold;'
        );
        console.groupEnd();
    }

    // ==========================================================================
    // 14. Public API Namespace Exports
    // ==========================================================================
    return {
        init: init,
        state: state,
        escapeHTML: escapeHTML,
        getMoodScore: getMoodScore,
        formatTimestamp: formatTimestamp,
        generateLocalWellnessPlan: generateLocalWellnessPlan
    };
})();

// Self initialize on DOM Loaded in browser environment only
if (typeof document !== 'undefined' && typeof process === 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        ZenStudy.init();
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZenStudy;
}
