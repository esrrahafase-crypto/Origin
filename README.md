# Origin

**Graduation Project Similarity Detection and Idea Enhancement**

Origin is an experimental AI-assisted platform for comparing new graduation project ideas with historical project abstracts and offering evidence-grounded suggestions for differentiation. The project is currently in planning/development; no model performance claims have been established.

## Scope

- **Input:** project title and brief description (Arabic or English where supported).
- **Retrieval experiments:** TF-IDF + cosine similarity, multilingual sentence embeddings + cosine similarity, and optional BM25 + semantic rank fusion (RRF).
- **Evaluation:** human relevance judgments, Precision@K, Recall@K, MRR, nDCG@K where appropriate.
- **Enhancement:** an LLM using retrieved projects as context (RAG), subject to human quality review.
- **Interface:** planned Streamlit prototype.

The initial reference corpus is 103 graduation project abstracts from the 2024–2025 Princess Nourah bint Abdulrahman University College of Computer and Information Sciences collection. This repository does not include the source PDF; assess redistribution permissions before adding data.

## Structure

- `notebooks/` — Colab experiments; read [notebook workflow](notebooks/README.md).
- `data/` — raw, processed, and evaluation datasets (see [data handling](data/README.md)).
- `src/` — reusable Python modules.
- `app/` — planned Streamlit user interface.
- `results/` and `figures/` — safe-to-share results and visuals.
- `docs/` — [team collaboration](docs/TEAM_WORKFLOW.md) and [initial project plan](docs/PROJECT_PLAN.md).

## Getting started in Google Colab

1. Open [Colab](https://colab.research.google.com/), choose **File → Open notebook → GitHub**, and select this repository.
2. Open a task notebook once created; each notebook should install requirements and load its own data independently.
3. Work on a task branch and save changes to that branch; open a pull request to merge reviewed work into `main`.

For a local Python environment:

```bash
pip install -r requirements.txt
```

## Collaboration

Four student contributors use individual GitHub accounts. See [TEAM_WORKFLOW.md](docs/TEAM_WORKFLOW.md). Assign specific work using GitHub Issues. Avoid editing the same notebook simultaneously. Do not commit API keys, restricted PDFs, or personal student data.

## Research note

The report is an **initial roadmap, not a locked implementation**. Retrieval models and pipeline components can be changed if validated experiments indicate a better approach. Similarity scores must not be presented as probabilities of plagiarism or project duplication.
