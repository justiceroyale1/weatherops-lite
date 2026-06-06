# WeatherOps Lite

[![CI](https://github.com/justiceroyale1/weatherops-lite/actions/workflows/ci.yml/badge.svg)](https://github.com/justiceroyale1/weatherops-lite/actions/workflows/ci.yml)

[![Deploy](https://github.com/justiceroyale1/weatherops-lite/actions/workflows/deploy.yml/badge.svg)](https://github.com/justiceroyale1/weatherops-lite/actions/workflows/deploy.yml)


WeatherOps Lite is a WeatherAI technical challenge project for farms, forestry teams, and field operations. It turns weather data, quota awareness, saved locations, and tree-image analysis into operational risk guidance.

Live URL: _add Firebase Hosting URL after deployment_

Screenshots: _add final desktop and mobile screenshots after deployment_

## What To Review First

- The app shell and dashboard live in `apps/web/src/App.tsx`.
- WeatherAI access is proxied through Firebase Functions in `functions/src/controllers`.
- Weather response normalization lives in `functions/src/lib/weather-ai`.
- Deterministic risk scoring lives in `functions/src/services/risk`.
- The final CI and deploy workflows live in `.github/workflows`.

## Features

- Weather risk dashboard with manual latitude/longitude entry, units, forecast days, and an AI-summary toggle.
- Saved operational locations backed by Firestore through Firebase Functions.
- Deterministic risk score, risk factors, and operational recommendations.
- WeatherAI usage card with non-blocking fallback behavior.
- Tree/farm image analysis with frontend file validation, backend upload handling, WeatherAI integration, demo fallback, and Firestore history.
- Demo/mock-friendly test setup so CI does not consume real WeatherAI quota.

## Architecture

This is a pnpm workspace with two packages:

- `apps/web`: Vite, React, TypeScript, Tailwind CSS, ShadCN-style components, TanStack Query, React Hook Form, Zod, Vitest, and Playwright.
- `functions`: Firebase Functions, TypeScript, Zod schemas, Firestore repositories, WeatherAI client/normalizers, and Vitest tests.

The frontend never calls WeatherAI directly. Browser requests go to Firebase Functions, where inputs are validated, the WeatherAI API key stays server-side, upstream responses are normalized, and safe client-facing errors are returned.

## WeatherAI And Quota Behavior

Set `WEATHERAI_API_KEY` only for Firebase Functions. Do not expose it through `VITE_*` variables.

The weather report form includes an AI summary toggle. When disabled, the backend sends `ai=false` to WeatherAI so reviewers can see quota-saving behavior. The usage card calls the backend usage endpoint and degrades to a non-blocking warning if quota data is unavailable.

When WeatherAI is unavailable or a local/demo path is needed, the backend uses clearly labeled deterministic demo data. Tests and CI rely on mocks or demo behavior, not real WeatherAI quota.

## Risk Scoring

Risk scoring is deterministic and unit-tested. The engine maps normalized weather inputs into:

- A score from 0 to 100.
- A level of `Low`, `Medium`, `High`, or `Critical`.
- Risk factors with severity, score impact, observed metric, and recommendation.
- Operational recommendations for spraying, irrigation, harvesting, delivery, inspections, worker safety, or general field work.

The frontend renders only normalized risk output and does not inspect raw WeatherAI payloads.

## Local Setup

Requirements:

- Node.js 20 or newer.
- pnpm 9.15.4.
- Firebase CLI access if running emulators or deploying.

Install dependencies:

```bash
pnpm install
```

Create local environment values:

```bash
cp .env.example .env
```

For local emulator development, keep or adjust:

```bash
VITE_FIREBASE_PROJECT_ID=weatherops-lite
VITE_FUNCTIONS_BASE_URL=http://127.0.0.1:5001/weatherops-lite/us-central1
VITE_FUNCTIONS_EMULATOR_ORIGIN=http://127.0.0.1:5001
VITE_ENABLE_DEMO_MODE=true
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Set `WEATHERAI_API_KEY` only in backend/Firebase Functions configuration when using real WeatherAI calls.

## Development

Run the web app:

```bash
pnpm dev
```

Run Firebase emulators:

```bash
pnpm firebase:emulators
```

The frontend builds local Functions URLs as:

```text
VITE_FUNCTIONS_EMULATOR_ORIGIN/VITE_FIREBASE_PROJECT_ID/us-central1
```

Set `VITE_FUNCTIONS_BASE_URL` to override the full Functions base URL directly.

## Testing

Run all workspace checks:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

Run package-level checks:

```bash
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web build
pnpm --filter web e2e
pnpm --filter functions typecheck
pnpm --filter functions test
pnpm --filter functions build
```

Install Playwright browsers before first local E2E run if needed:

```bash
pnpm --filter web exec playwright install chromium
```

The Playwright smoke test mocks Firebase Function responses at the browser network layer. It verifies the dashboard shell, saved location visibility, usage card data, weather report happy path, and tree analysis panel without calling WeatherAI.

Note: `pnpm lint` is currently a placeholder in both packages. TypeScript, Vitest, production build, and Playwright are the active quality gates.

## CI/CD

CI is configured in `.github/workflows/ci.yml` and runs on pushes to `main` and pull requests:

- Install dependencies with pnpm.
- Install Chromium for Playwright.
- Run typecheck.
- Run Vitest suites.
- Build web and functions.
- Run E2E smoke tests.

Deployment is configured in `.github/workflows/deploy.yml`. It can be run manually from GitHub Actions, and it also runs automatically after the `CI` workflow completes successfully on `main`. Pull request CI runs do not deploy, and failed CI runs do not deploy. The deploy workflow does not repeat typecheck or test steps; automatic deploys rely on the completed CI run, while manual deploys assume checks were already run or are being intentionally bypassed.

Required GitHub secrets:

- `FIREBASE_SERVICE_ACCOUNT`: Firebase/Google service account JSON with deploy permissions.
- `FIREBASE_PROJECT_ID`: Firebase project id.
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FUNCTIONS_BASE_URL`
- `WEATHERAI_API_KEY`
- `ALLOWED_ORIGINS`: comma-separated deployed and local origins allowed by Functions CORS.

Optional GitHub variable:

- `VITE_ENABLE_DEMO_MODE`: defaults to `false` in the deploy workflow.
- `ENABLE_DEMO_MODE`: backend demo fallback toggle; defaults to `false` in the deploy workflow.
- `WEATHERAI_BASE_URL`: defaults to `https://api.weather-ai.co`.

Deployment command used by the workflow:

```bash
pnpm exec firebase deploy --project "$FIREBASE_PROJECT_ID"
```

Firebase Hosting serves `apps/web/dist`; Functions and Firestore rules/indexes are deployed from the same Firebase project config.
The workflow writes a transient `functions/.env` file from GitHub secrets/variables before deployment so Firebase Functions receive runtime configuration without committing secrets.

## Firebase And Security Notes

- WeatherAI credentials must stay in Firebase Functions secrets/environment.
- `.env` is intentionally not committed.
- CORS is controlled by `ALLOWED_ORIGINS`; include local dev origins and the deployed Hosting URL.
- API errors are mapped to safe messages before reaching the browser.
- Firestore access is mediated by backend functions for the implemented app flows.

## Known Limitations

- Authentication is intentionally omitted for the assessment build; the app uses a single demo workspace.
- Lint scripts are placeholders; typecheck, tests, build, and E2E are the enforced checks.
- Live URL and screenshots must be filled in after the Firebase deployment is complete.
- Demo fallback data is deterministic and labeled; it is not presented as live WeatherAI data.
- Tree analysis depends on WeatherAI plan availability when not using demo fallback.