# Origin: initial technical plan

**Status:** proposed starting roadmap, subject to experimental revision.

- Corpus: graduation project titles and abstracts (initial reference: 103 projects from the 2024–2025 PNU collection, if redistribution is permitted).
- Input: student project title and short description.
- Retrieval candidates: TF-IDF/cosine baseline; multilingual sentence embeddings/cosine; optional BM25 + semantic retrieval fused using reciprocal rank fusion.
- Selection: compare approaches using human-judged query-project relevance on identical test inputs.
- Retrieval evaluation: Precision@K, Recall@K, MRR, nDCG@K where judgments are sufficient; separate development from final test queries.
- Idea enhancement: grounded RAG with an LLM using the student's idea plus top retrieved projects; evaluate relevance, usefulness, feasibility, and faithfulness.
- UI: prospective Streamlit prototype.

Avoid interpreting cosine similarity or RRF ranking scores as probabilities of project duplication. Human review retains final authority. Do not claim experiments or metrics are complete until measured.
