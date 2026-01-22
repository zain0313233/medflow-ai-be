# GitHub Actions CI Workflow

## Overview
This repository uses GitHub Actions for Continuous Integration (CI) to automatically check code quality and build status.

## Workflow Details

### Triggers
- **Push to main branch**: Runs on every push to main
- **Pull Requests**: Runs on PRs targeting main branch
- **Manual**: Can be triggered manually from GitHub Actions tab

### Steps
1. **Checkout Code**: Gets the latest code from the repository
2. **Setup Node.js**: Installs Node.js 20.x with npm caching
3. **Install Dependencies**: Runs `npm ci` for clean, fast installation
4. **Run Linting**: Executes `npm run lint` to check code quality
5. **Build Project**: Compiles TypeScript with `npm run build`
6. **Upload Artifacts**: Saves build output for 7 days (for debugging)

### Caching
- Dependencies are cached based on `package-lock.json`
- First run: ~2-3 minutes
- Subsequent runs: ~30-60 seconds

## Status Badge

Add this badge to your README.md to show build status:

```markdown
![CI Status](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME/actions/workflows/ci.yml/badge.svg)
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

## Viewing Workflow Results

1. Go to your repository on GitHub
2. Click the "Actions" tab
3. Select "CI - Build and Lint" workflow
4. View individual workflow runs and logs

## Branch Protection (Recommended)

To require CI checks before merging:

1. Go to Settings → Branches
2. Add branch protection rule for `main`
3. Enable "Require status checks to pass before merging"
4. Select "Build and Lint" check

## Troubleshooting

### Workflow fails on lint step
- Run `npm run lint` locally to see errors
- Fix linting issues or run `npm run lint:fix`

### Workflow fails on build step
- Run `npm run build` locally to see TypeScript errors
- Fix compilation errors in your code

### Slow workflow runs
- First run is always slower (no cache)
- Subsequent runs should be much faster with caching
- Check if `package-lock.json` is committed

## Local Testing

Before pushing, always test locally:

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Build project
npm run build
```

This ensures your code will pass CI checks.
