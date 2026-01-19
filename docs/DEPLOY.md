# CI/CD Deployment Guide

## Overview

This project uses GitHub Actions for automated testing and deployment to Vercel. The pipeline runs on every push and pull request to the `main`/`master` branch.

## Pipeline Stages

### 1. Test Stage

- **Linting**: Runs ESLint to check code quality
- **Formatting**: Validates code formatting with Prettier
- **Unit Tests**: Executes Jest tests
- **Coverage**: Ensures minimum 70% code coverage
- **Coverage Upload**: Sends coverage reports to Codecov

### 2. Deploy Stage

- **Vercel Deployment**: Automatically deploys to production on main branch
- Runs only after tests pass
- Uses Vercel CLI for deployment

## Setup Instructions

### 1. Vercel Configuration

1. Install Vercel CLI globally (if not already):

   ```bash
   npm install -g vercel
   ```

2. Link your project to Vercel:

   ```bash
   vercel link
   ```

3. Get your Vercel credentials:

   ```bash
   # Get Vercel Token
   # Go to: https://vercel.com/account/tokens
   # Create a new token

   # Get Vercel Org ID and Project ID
   # After running 'vercel link', check .vercel/project.json
   cat .vercel/project.json
   ```

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

#### Required Secrets:

1. **VERCEL_TOKEN**
   - Description: Vercel deployment token
   - How to get: https://vercel.com/account/tokens
   - Create a new token with deployment permissions

2. **VERCEL_ORG_ID**
   - Description: Your Vercel organization ID
   - Found in: `.vercel/project.json` after running `vercel link`

3. **VERCEL_PROJECT_ID**
   - Description: Your Vercel project ID
   - Found in: `.vercel/project.json` after running `vercel link`

4. **CODECOV_TOKEN** (Optional)
   - Description: Token for uploading coverage reports
   - How to get: https://codecov.io (after adding repository)
   - Not required but recommended for coverage tracking

### 3. Environment Variables

Configure these in Vercel Dashboard:

**Vercel Dashboard → Your Project → Settings → Environment Variables**

Add all variables from `.env.example`:

- `FIGMA_ACCESS_TOKEN`
- `OPENAI_API_KEY` (if using OpenAI)
- `GITHUB_TOKEN` (if using GitHub Models)
- `ANTHROPIC_API_KEY` (if using Anthropic)
- `NODE_ENV=production`

### 4. Verify Setup

1. Create a test branch and push:

   ```bash
   git checkout -b test-ci
   git push origin test-ci
   ```

2. Open a Pull Request to main/master

3. Check GitHub Actions tab to see pipeline running

4. After merge, verify deployment on Vercel

## Coverage Threshold

The pipeline enforces a **minimum 70% code coverage** threshold:

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

If coverage drops below this threshold, the build will fail.

## Troubleshooting

### Pipeline Fails on Coverage

```bash
# Run tests locally with coverage
npm run test:coverage

# Check coverage report
open coverage/lcov-report/index.html
```

### Vercel Deployment Fails

1. Check Vercel secrets are correctly configured
2. Verify `.vercel/project.json` exists locally
3. Check Vercel logs in dashboard

### Tests Pass Locally but Fail in CI

1. Ensure all dependencies are in `package.json`
2. Check Node.js version matches (20.x)
3. Review GitHub Actions logs for specific errors

## Local Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Start development server
npm start
```

## Manual Deployment

If you need to deploy manually:

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Useful Commands

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Fix formatting
npm run format

# Run tests in watch mode
npm run test:watch
```

## Pipeline Status

View pipeline status:

- GitHub Actions: https://github.com/AuronForge/figma-frontend-extractor-agent/actions
- Vercel Dashboard: https://vercel.com/dashboard

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Codecov Documentation](https://docs.codecov.com/)
