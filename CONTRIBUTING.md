# Contributing to ZenStudy AI

Thank you for your interest in contributing to ZenStudy AI! This guide will help you get started.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/Mental-Wellness-Tracker.git
   cd Mental-Wellness-Tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## Code Standards

- All JavaScript must use `"use strict"` mode
- Functions must include JSDoc documentation
- Input data must be sanitized using `escapeHTML()` before DOM insertion
- Constants should be wrapped in `Object.freeze()`
- All interactive elements must have unique `id` attributes
- ARIA labels and roles must be present on all interactive components

## Testing Requirements

- All new features must include corresponding unit tests
- Minimum 70% code coverage is required
- Tests should cover both happy paths and error boundaries
- Run `npm test` before submitting pull requests

## Accessibility Guidelines

- WCAG 2.1 AA compliance is mandatory
- All images must have descriptive `alt` text
- Keyboard navigation must be fully functional
- Screen reader compatibility must be maintained
- Color contrast ratios must meet AA standards (4.5:1 for text)

## Security Policies

- Never expose API keys in client-side code
- All user inputs must be sanitized against XSS
- Content Security Policy headers must be maintained
- No use of `eval()`, `innerHTML` with user data, or `document.write()`

## Pull Request Process

1. Fork the repository and create a feature branch
2. Write tests for new functionality
3. Ensure all tests pass with `npm test`
4. Update documentation as needed
5. Submit a pull request with a clear description of changes

## Code of Conduct

Be respectful, inclusive, and supportive — just like ZenStudy AI aims to be for students.
