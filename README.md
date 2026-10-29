# Origin

Origin is a bilingual Arabic/English local web application that helps students
place a proposed graduation-project idea in the context of earlier projects.
It retrieves related records from a curated 103-project corpus, presents the
real historical projects, and optionally asks Gemini for evidence-grounded
comparisons and practical ways to differentiate and improve the proposed idea.

Origin supports exploration; it does not establish global novelty, detect
plagiarism, or guarantee that an idea is original.

## Main features

- Arabic semantic retrieval using the evaluated multilingual embedding model.
- English hybrid retrieval combining BM25, semantic similarity, and Reciprocal
  Rank Fusion (RRF).
- Up to five real historical projects from the included dataset.
- Gemini RAG enhancement constrained to the retrieved titles and abstracts.
- Up to three actionable, graduation-project-scale recommendations.
- Evidence-checked project citations and retrieval-only results when Gemini is
  unavailable.
- Bilingual responsive React interface with Arabic RTL support.
- Local-only FastAPI and Vite workflow; no Docker, hosting, or tunnel required.

## Architecture

```text
Browser (React/Vite, localhost:5173)
             |
             | POST /api/analyze
             v
FastAPI (127.0.0.1:8000)
             |
             +--> frozen language-aware retrieval --> 103-project CSV
             |
             +--> retrieved context --> Gemini (optional enhancement)
                                      --> validated JSON response
```

The Gemini key remains in the backend environment. The frontend never receives
it. If Gemini fails, Origin keeps the genuine retrieval results and does not
substitute mock projects, comparisons, suggestions, or citations.

## Repository layout

```text
frontend/    React/TypeScript application, assets, and frontend tests
src/         FastAPI integration and evaluated retrieval implementation
data/        Processed project corpus and evaluation queries
notebooks/   Research notebooks 01–09
results/     Final evaluation outputs and research summaries
figures/     EDA figures
tests/       Backend API and contract tests
docs/        API contract and repository preparation notes
```

The evaluated retrieval implementation is in
[`src/retrieval.py`](src/retrieval.py). Research development and evaluation are
documented in [`notebooks/`](notebooks/), including
[`09_RAG_Enhancement.ipynb`](notebooks/09_RAG_Enhancement.ipynb). Final metrics
and ranked outputs are preserved in [`results/`](results/).

## Prerequisites

- Windows with VS Code and PowerShell
- Python 3.12
- Node.js 22 or newer (validated with Node.js 24)
- Internet access for dependency installation, the initial embedding-model
  download, and optional Gemini enhancement
- At least 2 GB of free space for the initial local model cache

## Local setup

Open this repository (`Origin-Final`) in VS Code.

### 1. Backend environment

In the first VS Code terminal, from the repository root:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements-api.txt
Copy-Item .\.env.example .\.env
```

Edit `.env` locally. To enable Gemini comparisons and suggestions, set:

```ini
GEMINI_API_KEY=your_private_key_here
```

Never commit `.env`, and never place the Gemini key in a `VITE_` variable.
Without a key, retrieval remains available and the response clearly marks AI
enhancement as unavailable.

Start the backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn src.api:app --host 127.0.0.1 --port 8000 --workers 1
```

The health endpoint is `http://127.0.0.1:8000/health`. On the first analysis,
the fixed `sentence-transformers/paraphrase-multilingual-mpnet-base-v2` model is
downloaded into `.cache/huggingface`; initialization can take several minutes
on a CPU.

### 2. Frontend environment

In a second VS Code terminal:

```powershell
cd .\frontend
npm.cmd ci
npm.cmd run dev -- --host localhost --port 5173 --strictPort
```

Open `http://localhost:5173`. The frontend defaults to
`http://127.0.0.1:8000`, so no frontend environment file is required. A local
override can be created from `frontend/.env.example` if necessary.

## Tests and build checks

Backend tests use mocked Gemini clients and do not consume API quota:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-test.txt
.\.venv\Scripts\python.exe -m pytest -q
```

Frontend checks:

```powershell
cd .\frontend
npm.cmd ci
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Research dependencies for notebooks can be installed separately with
`requirements.txt`; they are not required merely to run the web application.

## Dataset and evaluation

The application corpus is [`data/processed/projects_clean.csv`](data/processed/projects_clean.csv)
and contains 103 historical project records. Evaluation queries are in
[`data/evaluation/evaluation_queries.csv`](data/evaluation/evaluation_queries.csv).
The retrieval pipeline and its ranking behavior are preserved from the
evaluated research implementation; English and Arabic use their respective
validated retrieval modes rather than a shared mock search.

## Known limitations

- Retrieval quality is limited by the included historical corpus and cannot
  establish worldwide originality.
- Gemini enhancement depends on an external Google service, model availability,
  network access, and the user's quota. Free-tier limits can be restrictive.
- Transient Gemini 5xx failures use bounded backoff. Repeated 503 responses
  temporarily open a local cooldown to protect quota; retrieval still works.
- The embedding model is downloaded on first use and may initialize slowly on
  machines without a GPU.

See [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) for the frontend/backend
contract and [`docs/EXCLUSIONS.md`](docs/EXCLUSIONS.md) for the final-repository
allowlist decisions.
