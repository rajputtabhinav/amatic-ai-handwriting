# Contributing to Amatic.ai

Thank you for your interest in contributing to Amatic.ai! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)
- Basic knowledge of TypeScript, React, and Next.js

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pensil.io.git
   cd pensil.io
   ```

3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/pensil.io.git
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Copy environment variables:
   ```bash
   cp env.example .env.local
   ```

6. Fill in your `.env.local` with development credentials

7. Run the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branching Strategy

We use Git Flow:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
git fetch upstream
git rebase upstream/develop
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types - use proper typing
- Use interfaces for object shapes
- Use type aliases for unions and complex types

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Use Next.js App Router conventions
- Implement proper error boundaries
- Use Server Components where appropriate

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Hooks: `use-hook-name.ts`
- Types: `types.ts` or inline with component

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Best Practices

1. **Keep functions small and focused**
   - Single Responsibility Principle
   - Max 50 lines per function

2. **Write self-documenting code**
   - Use descriptive variable names
   - Add comments for complex logic
   - Use JSDoc for public APIs

3. **Handle errors properly**
   - Use try-catch blocks
   - Provide user-friendly error messages
   - Log errors appropriately

4. **Optimize performance**
   - Use React.memo for expensive components
   - Implement code splitting
   - Lazy load heavy components

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
feat(canvas): add undo/redo functionality

Implement undo/redo using command pattern.
Supports up to 50 history states.

Closes #123

fix(api): handle rate limit errors gracefully

Add retry logic with exponential backoff for rate-limited requests.

refactor(components): extract canvas hooks

Split large canvas component into smaller, reusable hooks for better maintainability.
```

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Run all checks**
   ```bash
   npm run validate  # Runs lint, type-check, and tests
   ```

3. **Test your changes**
   - Manual testing
   - Unit tests
   - E2E tests if applicable

4. **Update documentation**
   - README if needed
   - API documentation
   - Inline code comments

### Submitting

1. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request on GitHub

3. Fill in the PR template:
   - Description of changes
   - Related issues
   - Screenshots (if UI changes)
   - Testing performed
   - Breaking changes (if any)

### PR Requirements

- ✅ All CI checks pass
- ✅ Code review approved
- ✅ No merge conflicts
- ✅ Documentation updated
- ✅ Tests added/updated
- ✅ Follows coding standards

### Review Process

1. Automated checks run (CI/CD)
2. Code review by maintainers
3. Address feedback
4. Approval and merge

## Testing

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Writing Tests

- Write tests for all new features
- Maintain test coverage above 70%
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Test Structure

```typescript
describe('Component/Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = doSomething(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain non-obvious code

### API Documentation

- Document all API endpoints
- Include request/response examples
- Note authentication requirements
- List possible error codes

### README Updates

Update README.md when:
- Adding new features
- Changing setup process
- Updating dependencies
- Modifying configuration

## Questions?

- Open an issue for bugs
- Start a discussion for questions
- Join our Discord community
- Email: dev@amatic.ai

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Amatic.ai! 🎨✨

