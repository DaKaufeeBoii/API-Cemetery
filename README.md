# API Cemetery — MVP

## Run locally

```bash
npm install
npm run dev        # localhost:3000
```

No AWS credentials required — demo dataset loads automatically.

## Project structure

- `src/lib/` — types, risk engine, demo dataset
- `src/app/dashboard/` — dashboard + charts
- `src/app/endpoints/[id]/` — endpoint detail + delete analysis
- `src/components/DependencyGraph.tsx` — React Flow blast radius
- `src/app/ingest/` — data ingestion
- `template.yaml` — SAM / CloudFormation
- `backend/handlers/` — Lambda handlers

## AI Provider Abstraction

- `DeterministicAnalysisProvider` — source of truth for scores
- `LocalOllamaProvider` — optional local LLM explanations
- Default dev mode requires no LLM
