# WeatherOps Lite

WeatherOps Lite is the application repository for the WeatherAI technical challenge.

The coordination docs for product ownership, agent workflow, task review, and roadmap tracking live one directory above this repository in `weather-ai-tech-challenge/`.

## Current Status

This repository has been initialized as the codebase root. Implementation tasks should be created from the parent directory's planning docs and completed one reviewed task at a time.

## Quota Awareness

WeatherAI requests run through Firebase Functions so the API key stays server-side. The weather report form includes an AI summary toggle; when disabled, the backend sends `ai=false` to WeatherAI to preserve AI quota. The dashboard usage card reads quota data through the backend usage function and falls back without blocking weather reports when usage data is unavailable.

## Local Functions And CORS

Copy `.env.example` to `.env` and set `VITE_FIREBASE_PROJECT_ID` to the Firebase project id used by the emulator. The frontend builds the local Functions URL as `VITE_FUNCTIONS_EMULATOR_ORIGIN/VITE_FIREBASE_PROJECT_ID/us-central1` unless `VITE_FUNCTIONS_BASE_URL` is set. Use `VITE_FUNCTIONS_BASE_URL` when you want to override the full Functions base URL directly.

To avoid CORS errors, include every local frontend origin in `ALLOWED_ORIGINS`, for example `http://localhost:5173,http://127.0.0.1:5173`. Restart the Firebase Functions emulator after changing backend environment values, and make sure the browser URL origin exactly matches one of the allowed origins.

## Tree Analysis

Tree analysis uploads are sent to Firebase Functions as `multipart/form-data`; the frontend validates JPEG, PNG, and WebP images up to 8MB before upload. The backend keeps WeatherAI credentials server-side, stores successful analysis summaries in Firestore, and uses a clearly labeled deterministic demo fallback when WeatherAI tree analysis is unavailable.

## Commit Policy

No coding or reviewer agent should commit directly. A task may be committed only after reviewer approval and human owner approval.
