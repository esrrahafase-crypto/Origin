# Origin frontend

This directory contains the bilingual React/TypeScript interface for Origin.
It communicates only through `src/services/originApi.ts` and defaults to the
local FastAPI backend at `http://127.0.0.1:8000`.

Run from this directory with:

```powershell
npm.cmd ci
npm.cmd run dev -- --host localhost --port 5173 --strictPort
```

See the repository root `README.md` for complete backend setup and validation
commands.
