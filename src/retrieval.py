"""Frozen Origin language-aware retrieval implementation from notebook 07.

Arabic: chunked semantic search. English: BM25 + chunked semantic RRF.
Keep preprocessing, model, pooling, rankings and weights aligned with
07_Language_Aware_Retrieval.ipynb when reusing in evaluation or RAG.
"""

import re
import unicodedata
from types import SimpleNamespace

import numpy as np
import pandas as pd
import torch
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
from sklearn.metrics.pairwise import cosine_similarity


def build_retrieval_pipeline(projects_df):
    """Build the frozen pipeline for the validated 103-project corpus.

    Returns namespace exposing language_aware_search, semantic_search,
    hybrid_search, bm25_search, project embeddings, project IDs and model.
    """
    df = projects_df.copy()
    df.columns = df.columns.str.strip().str.lower()
    df["department"] = df["department"].str.strip()
    assert df.shape == (103, 7)
    assert df["project_id"].is_unique
    assert df[["title", "abstract"]].notna().all().all()

    # ============================================================
    # 3. TEXT PREPARATION AND BM25 PREPROCESSING
    # ============================================================

    import re
    import unicodedata
    from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

    hybrid_df = df.copy()

    # Original text for semantic retrieval
    hybrid_df["text"] = (
        hybrid_df["title"].astype(str).str.strip()
        + ". "
        + hybrid_df["abstract"].astype(str).str.strip()
    )

    hybrid_df["text"] = (
        hybrid_df["text"]
        .str.replace(r"\s+", " ", regex=True)
        .str.strip()
    )

    project_texts = hybrid_df["text"].tolist()

    # Consistent BM25 preprocessing
    def tokenize(text):

        text = unicodedata.normalize(
            "NFKC", str(text)
        ).casefold()

        tokens = re.findall(r"(?u)\b\w+\b", text)

        tokens = [
            token for token in tokens
            if len(token) >= 2
            and token not in ENGLISH_STOP_WORDS
        ]

        return tokens


    # Build tokenized historical corpus
    tokenized_corpus = [
        tokenize(text)
        for text in project_texts
    ]

    assert len(tokenized_corpus) == 103
    assert all(len(tokens) > 0 for tokens in tokenized_corpus)

    print("BM25 PREPROCESSING COMPLETED")
    print("=" * 55)
    print("Total projects:", len(project_texts))
    print("Tokenized documents:", len(tokenized_corpus))
    print("Sample tokens:", tokenized_corpus[0][:20])

    # Build BM25 index
    bm25 = BM25Okapi(tokenized_corpus)

    print("BM25 index created successfully!")
    print("Indexed projects:", len(tokenized_corpus))

    def bm25_search(title, description, top_k=5):
        # Validate input
        if not title.strip() or not description.strip():
            raise ValueError("Title and description must not be empty.")

        if not 1 <= top_k <= len(hybrid_df):
            raise ValueError("Invalid top_k value.")

        # Prepare English query
        query_text = f"{title.strip()}. {description.strip()}"
        query_tokens = tokenize(query_text)

        # Calculate BM25 scores
        scores = bm25.get_scores(query_tokens)

        # Keep projects with positive lexical scores
        matched_indices = np.flatnonzero(scores > 0)

        result_columns = [
            "rank", "project_id", "title", "abstract",
            "department", "source_page", "bm25_score"
        ]

        if len(matched_indices) == 0:
            return pd.DataFrame(columns=result_columns)

        sorted_indices = matched_indices[
            np.argsort(-scores[matched_indices], kind="stable")
        ][:top_k]

        results = hybrid_df.iloc[sorted_indices][
            ["project_id", "title", "abstract", "department", "source_page"]
        ].copy()

        results.insert(0, "rank", range(1, len(results) + 1))
        results["bm25_score"] = scores[sorted_indices]

        return results.reset_index(drop=True)


    print("English BM25 retrieval is ready!")

    # Load semantic model
    model_name = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"

    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = SentenceTransformer(model_name, device=device)

    print("Semantic model loaded successfully!")
    print("Device:", device)
    print("Embedding dimension:", model.get_sentence_embedding_dimension())

    # Configure chunking
    max_tokens = model.max_seq_length
    special_tokens = model.tokenizer.num_special_tokens_to_add(pair=False)

    chunk_size = max_tokens - special_tokens
    chunk_overlap = 20
    chunk_step = chunk_size - chunk_overlap

    assert chunk_step > 0

    # Split text into token-safe chunks
    def safe_chunk_text(text, overlap=20):
        token_ids = model.tokenizer.encode(
            text,
            add_special_tokens=False,
            truncation=False
        )

        chunks = []
        start = 0

        while start < len(token_ids):
            end = min(
                start + model.max_seq_length - special_tokens,
                len(token_ids)
            )

            while end > start:
                chunk = model.tokenizer.decode(
                    token_ids[start:end],
                    skip_special_tokens=True
                )

                length = len(model.tokenizer.encode(
                    chunk,
                    add_special_tokens=True,
                    truncation=False
                ))

                if length <= model.max_seq_length:
                    break

                end -= 1

            if end == start:
                raise ValueError("Unable to create a valid chunk.")

            chunks.append(chunk)

            if end == len(token_ids):
                break

            start = max(start + 1, end - overlap)

        return chunks


    # Chunk all project descriptions
    project_chunk_texts = [
        safe_chunk_text(text)
        for text in project_texts
    ]

    all_chunk_texts = [
        chunk
        for chunks in project_chunk_texts
        for chunk in chunks
    ]

    # Validate chunk lengths
    assert all(
        len(model.tokenizer.encode(
            chunk,
            add_special_tokens=True,
            truncation=False
        )) <= max_tokens
        for chunk in all_chunk_texts
    )

    print("Project chunking completed successfully!")
    print("Total projects:", len(project_chunk_texts))
    print("Total chunks:", len(all_chunk_texts))
    print("Average chunks per project:",
          round(np.mean([len(c) for c in project_chunk_texts]), 2))
    print("Maximum tokens:", max_tokens)

    # Generate embeddings for all project chunks
    chunk_embeddings = model.encode(
        all_chunk_texts,
        batch_size=16,
        show_progress_bar=True,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    # Aggregate chunk embeddings per project
    chunked_project_embeddings = []

    start = 0

    for chunks in project_chunk_texts:
        count = len(chunks)

        project_vectors = chunk_embeddings[start:start + count]
        project_embedding = project_vectors.mean(axis=0)

        project_embedding /= np.linalg.norm(project_embedding)

        chunked_project_embeddings.append(project_embedding)
        start += count

    chunked_project_embeddings = np.vstack(chunked_project_embeddings)

    # Validate embeddings
    assert start == len(chunk_embeddings)
    assert chunked_project_embeddings.shape == (103, 768)
    assert np.isfinite(chunked_project_embeddings).all()

    print("Chunked project embeddings generated successfully!")
    print("Embeddings shape:", chunked_project_embeddings.shape)

    def semantic_search(title, description, top_k=5):
        # Validate input
        if not title.strip() or not description.strip():
            raise ValueError("Title and description must not be empty.")

        if not 1 <= top_k <= len(hybrid_df):
            raise ValueError("Invalid top_k value.")

        # Prepare and chunk query
        query_text = f"{title.strip()}. {description.strip()}"
        query_chunks = safe_chunk_text(query_text)

        # Generate query chunk embeddings
        query_vectors = model.encode(
            query_chunks,
            batch_size=16,
            convert_to_numpy=True,
            normalize_embeddings=True
        )

        # Aggregate query embeddings
        query_embedding = query_vectors.mean(axis=0, keepdims=True)
        query_embedding /= np.linalg.norm(
            query_embedding, axis=1, keepdims=True
        )

        # Calculate cosine similarity
        scores = cosine_similarity(
            query_embedding,
            chunked_project_embeddings
        )[0]

        # Retrieve Top-K
        top_indices = np.argsort(-scores)[:top_k]

        results = hybrid_df.iloc[top_indices][
            ["project_id", "title", "abstract", "department", "source_page"]
        ].copy()

        results.insert(0, "rank", range(1, len(results) + 1))
        results["similarity_score"] = scores[top_indices]

        return results.reset_index(drop=True)


    print("Chunked semantic retrieval is ready!")

    # ============================================================
    # 10. HYBRID RETRIEVAL WITH RRF
    # ============================================================

    def hybrid_search(title, description, top_k=5, rrf_k=60):

        if not title.strip() or not description.strip():
            raise ValueError(
                "Title and description must not be empty."
            )

        if not 1 <= top_k <= len(hybrid_df):
            raise ValueError("Invalid top_k.")

        if rrf_k <= 0:
            raise ValueError("rrf_k must be positive.")

        # 1. Semantic retrieval uses original language
        semantic_results = semantic_search(
            title,
            description,
            top_k=len(hybrid_df)
        )

        semantic_ranks = dict(zip(
            semantic_results["project_id"],
            semantic_results["rank"]
        ))

        # 2. BM25 scores English queries without translation
        bm25_results = bm25_search(
            title,
            description,
            top_k=len(hybrid_df)
        )

        bm25_ranks = dict(zip(
            bm25_results["project_id"],
            bm25_results["rank"]
        ))

        # 3. Prepare final project-level ranking
        results = hybrid_df[
            [
                "project_id",
                "title",
                "abstract",
                "department",
                "source_page"
            ]
        ].copy()

        results["semantic_rank"] = (
            results["project_id"].map(semantic_ranks)
        )

        results["bm25_rank"] = (
            results["project_id"].map(bm25_ranks)
        )

        # 4. Reciprocal Rank Fusion
        semantic_rrf = (
            1.0 / (rrf_k + results["semantic_rank"])
        )

        bm25_rrf = (
            1.0 / (rrf_k + results["bm25_rank"])
        ).fillna(0.0)

        results["rrf_score"] = semantic_rrf + bm25_rrf

        results["retrieval_mode"] = (
            "hybrid"
            if len(bm25_results) > 0
            else "semantic_fallback"
        )

        # 5. Rank projects
        results = results.sort_values(
            ["rrf_score", "project_id"],
            ascending=[False, True]
        ).head(top_k).copy()

        results.insert(
            0, "rank", range(1, len(results) + 1)
        )

        return results.reset_index(drop=True)


    print("Hybrid search updated successfully!")

    def language_aware_search(title, description, language, top_k=5):
        # Select retrieval strategy by language
        if language == "ar":
            results = semantic_search(
                title, description, top_k=top_k
            )
            results["retrieval_mode"] = "semantic_ar"

        elif language == "en":
            results = hybrid_search(
                title, description, top_k=top_k
            )
            results["retrieval_mode"] = "hybrid_en"

        else:
            raise ValueError("Unsupported language.")

        return results


    print("Language-aware retrieval is ready!")

    return SimpleNamespace(
        language_aware_search=language_aware_search,
        semantic_search=semantic_search,
        hybrid_search=hybrid_search,
        bm25_search=bm25_search,
        safe_chunk_text=safe_chunk_text,
        tokenize=tokenize,
        model=model,
        model_name=model_name,
        hybrid_df=hybrid_df,
        chunked_project_embeddings=chunked_project_embeddings,
        bm25=bm25,
        chunk_overlap=chunk_overlap,
    )
