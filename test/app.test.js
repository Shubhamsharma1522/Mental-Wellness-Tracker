const ZenStudy = require('../app.js');

describe('ZenStudy AI Unit Tests', () => {
    // --- 1. HTML Sanitizer Tests ---
    describe('escapeHTML()', () => {
        test('should escape opening and closing script tags', () => {
            const input = "<script>alert('xss')</script>";
            const escaped = ZenStudy.escapeHTML(input);
            expect(escaped).toBe("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
        });

        test('should escape ampersands correctly', () => {
            const input = "Syllabus & Mock Tests";
            const escaped = ZenStudy.escapeHTML(input);
            expect(escaped).toBe("Syllabus &amp; Mock Tests");
        });

        test('should escape double and single quotes', () => {
            const input = `Preparing for "JEE" or 'NEET'`;
            const escaped = ZenStudy.escapeHTML(input);
            expect(escaped).toBe("Preparing for &quot;JEE&quot; or &#039;NEET&#039;");
        });

        test('should return empty string for null or undefined input', () => {
            expect(ZenStudy.escapeHTML(null)).toBe('');
            expect(ZenStudy.escapeHTML(undefined)).toBe('');
        });

        test('should return empty string for non-string inputs', () => {
            expect(ZenStudy.escapeHTML(12345)).toBe('');
            expect(ZenStudy.escapeHTML({})).toBe('');
        });
    });

    // --- 2. Mood Scoring Tests ---
    describe('getMoodScore()', () => {
        test('should map motivated to score 5', () => {
            expect(ZenStudy.getMoodScore('motivated')).toBe(5);
        });

        test('should map calm to score 4', () => {
            expect(ZenStudy.getMoodScore('calm')).toBe(4);
        });

        test('should map anxious to score 3', () => {
            expect(ZenStudy.getMoodScore('anxious')).toBe(3);
        });

        test('should map stressed to score 2', () => {
            expect(ZenStudy.getMoodScore('stressed')).toBe(2);
        });

        test('should map sad to score 1', () => {
            expect(ZenStudy.getMoodScore('sad')).toBe(1);
        });

        test('should map burned-out to score 0', () => {
            expect(ZenStudy.getMoodScore('burned-out')).toBe(0);
        });

        test('should default to score 3 for invalid or unknown moods', () => {
            expect(ZenStudy.getMoodScore('neutral')).toBe(3);
            expect(ZenStudy.getMoodScore('unknown')).toBe(3);
        });
    });

    // --- 3. Date Utility Tests ---
    describe('formatTimestamp()', () => {
        test('should format Unix timestamp into a string', () => {
            const stamp = 1717653600000; // June 6, 2026
            const result = ZenStudy.formatTimestamp(stamp);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });

        test('should return empty string for zero or falsy timestamp', () => {
            expect(ZenStudy.formatTimestamp(0)).toBe('');
            expect(ZenStudy.formatTimestamp(null)).toBe('');
        });
    });

    // --- 4. Fallback Plan Generator & Exam Alignment Tests ---
    describe('generateLocalWellnessPlan()', () => {
        test('should create plan object with all schema properties', () => {
            const checkin = {
                mood: 'stressed',
                triggers: ['Mock Test Scores'],
                exam: 'NEET',
                reflection: 'Low scores in Biology mock tests'
            };
            const plan = ZenStudy.generateLocalWellnessPlan(checkin);
            expect(plan).toHaveProperty('guidance');
            expect(plan).toHaveProperty('exerciseTitle');
            expect(plan).toHaveProperty('exerciseDesc');
            expect(plan).toHaveProperty('studyAdvice');
            expect(plan).toHaveProperty('quoteText');
            expect(plan).toHaveProperty('quoteAuthor');
        });

        test('should customize guidance using selected exam target context', () => {
            const checkin = {
                mood: 'anxious',
                triggers: ['Syllabus Backlog'],
                exam: 'JEE',
                reflection: 'Scared about physics backlog'
            };
            const plan = ZenStudy.generateLocalWellnessPlan(checkin);
            expect(plan.guidance).toContain('JEE');
            expect(plan.exerciseTitle).toBe('5-4-3-2-1 Sensory Grounding');
        });

        test('should customize exercises for burnout', () => {
            const checkin = {
                mood: 'burned-out',
                triggers: ['Sleep Deprivation'],
                exam: 'UPSC',
                reflection: 'Studying 14 hours a day'
            };
            const plan = ZenStudy.generateLocalWellnessPlan(checkin);
            expect(plan.guidance).toContain('UPSC');
            expect(plan.exerciseTitle).toContain('Muscle Relaxation');
        });

        test('should output appropriate intention locking for motivated state', () => {
            const checkin = {
                mood: 'motivated',
                triggers: [],
                exam: 'Board Exams',
                reflection: 'Ready for English paper'
            };
            const plan = ZenStudy.generateLocalWellnessPlan(checkin);
            expect(plan.guidance).toContain('Board Exams');
            expect(plan.exerciseTitle).toBe('Sankalpa Intention Locking');
        });

        test('should handle general exam text fallback if target is empty', () => {
            const checkin = {
                mood: 'calm',
                triggers: [],
                exam: 'General Studies',
                reflection: 'Feeling normal'
            };
            const plan = ZenStudy.generateLocalWellnessPlan(checkin);
            expect(plan.guidance).toContain('your exams');
        });

        test('should customize exercises for sad mood', () => {
            const checkin = {
                mood: 'sad',
                triggers: [],
                exam: 'CAT',
                reflection: 'Scored low on Mock 3'
            };
            const plan = ZenStudy.generateLocalWellnessPlan(checkin);
            expect(plan.exerciseTitle).toBe('Heart-Centered Breathing');
        });

        test('should customize exercises for stressed mood', () => {
            const checkin = {
                mood: 'stressed',
                triggers: ['Family Expectations'],
                exam: 'GATE',
                reflection: 'Family is stressing me out'
            };
            const plan = ZenStudy.generateLocalWellnessPlan(checkin);
            expect(plan.exerciseTitle).toBe('5-4-3-2-1 Sensory Grounding');
        });

        test('should customize exercises for calm mood', () => {
            const checkin = {
                mood: 'calm',
                triggers: [],
                exam: 'General Studies',
                reflection: 'Quiet study day'
            };
            const plan = ZenStudy.generateLocalWellnessPlan(checkin);
            expect(plan.exerciseTitle).toBe('Mindful Breath Watching');
        });
    });

    // --- 5. Application Initial State Tests ---
    describe('Application State Structure', () => {
        test('should have an initialized theme property', () => {
            expect(ZenStudy.state).toHaveProperty('theme');
            expect(typeof ZenStudy.state.theme).toBe('string');
        });

        test('should contain default pomodoro state variables', () => {
            expect(ZenStudy.state).toHaveProperty('pomodoro');
            expect(ZenStudy.state.pomodoro.isActive).toBe(false);
            expect(ZenStudy.state.pomodoro.mode).toBe('work');
            expect(ZenStudy.state.pomodoro.durationSeconds).toBe(1500);
            expect(ZenStudy.state.pomodoro.sessionsCompleted).toBe(0);
        });

        test('should contain default breathing state variables', () => {
            expect(ZenStudy.state).toHaveProperty('breathing');
            expect(ZenStudy.state.breathing.isActive).toBe(false);
            expect(ZenStudy.state.breathing.pattern).toBe('box');
            expect(ZenStudy.state.breathing.cycleCount).toBe(0);
        });
    });
});

