# WeatherOps Lite

WeatherOps Lite is the application repository for the WeatherAI technical challenge.

The coordination docs for product ownership, agent workflow, task review, and roadmap tracking live one directory above this repository in `weather-ai-tech-challenge/`.

## Current Status

This repository has been initialized as the codebase root. Implementation tasks should be created from the parent directory's planning docs and completed one reviewed task at a time.

## Quota Awareness

WeatherAI requests run through Firebase Functions so the API key stays server-side. The weather report form includes an AI summary toggle; when disabled, the backend sends `ai=false` to WeatherAI to preserve AI quota. The dashboard usage card reads quota data through the backend usage function and falls back without blocking weather reports when usage data is unavailable.

## Commit Policy

No coding or reviewer agent should commit directly. A task may be committed only after reviewer approval and human owner approval.
