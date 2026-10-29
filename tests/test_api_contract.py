"""FastAPI contract tests without downloading the embedding model or calling Gemini.

Run: pytest -q tests/test_api_contract.py
"""
from types import SimpleNamespace
from unittest.mock import patch
import json

import pandas as pd
from fastapi.testclient import TestClient
from google.genai import errors

from src import api


def test_api_analyze_contract(monkeypatch):
    data = pd.DataFrame([
        {
            "rank": 1,
            "project_id": "P001",
            "title": "Past project",
            "abstract": "An app to organize students' study schedules.",
            "department": "Computer Science",
            "source_page": 5
        },
        {
            "rank": 2,
            "project_id": "P002",
            "title": "Unrelated project",
            "abstract": "A plant watering device.",
            "department": "",
            "source_page": 6
        }
    ])
    class FakeRetrieval:
        def language_aware_search(self, title, description, language, top_k=5):
            assert top_k == 5
            assert language == "en"
            return data

    class FakeModels:
        def generate_content(self, **kwargs):
            payload = json.loads(kwargs["contents"])
            assert len(payload["retrieved_projects"]) == 2
            return SimpleNamespace(text=json.dumps({
                "comparisons": [
                    {"projectId": "P001", "inCommon": "Both organize study schedules."},
                    {"projectId": "P999", "inCommon": "Invented source"}
                ],
                "suggestions": [
                    {
                        "label": "Evaluation",
                        "title": "Test the scheduling flow",
                        "body": "Compare scheduling time with the manual process.",
                        "reason": "A practical way to evaluate usefulness.",
                        "citedProjectIds": ["P001", "P999"]
                    }
                ]
            }))

    fake_client = SimpleNamespace(models=FakeModels())
    monkeypatch.setattr(api, "get_retrieval", lambda: FakeRetrieval())
    monkeypatch.setattr(api, "get_genai_client", lambda: fake_client)
    client = TestClient(api.app)
    response = client.post("/api/analyze", json={
        "title": "AI Study Planner",
        "description": "A web app that helps students plan revision sessions for university exams.",
        "language": "en"
    })
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["retrieval"]["isDemo"] is False
    assert len(payload["retrieval"]["results"]) == 2
    assert payload["retrieval"]["results"][0]["project"]["id"] == "P001"
    assert payload["retrieval"]["results"][0]["project"]["isFictional"] is False
    assert payload["retrieval"]["comparisons"][0]["projectId"] == "P001"
    assert len(payload["retrieval"]["comparisons"]) == 1
    assert payload["suggestions"][0]["citedProjectIds"] == ["P001"]


def test_api_request_validation():
    client = TestClient(api.app)
    response = client.post("/api/analyze", json={
        "title": "a",
        "description": "short",
        "language": "invalid"
    })
    assert response.status_code == 422


def test_genai_client_has_no_hidden_sdk_retries(monkeypatch):
    captured = {}
    fake_client = object()

    def make_client(**kwargs):
        captured.update(kwargs)
        return fake_client

    monkeypatch.setenv("GEMINI_API_KEY", "test-only-placeholder")
    monkeypatch.setattr(api.genai, "Client", make_client)
    api.get_genai_client.cache_clear()
    try:
        assert api.get_genai_client() is fake_client
        http_options = captured["http_options"]
        assert http_options.timeout == 60_000
        assert http_options.retry_options.attempts == 1
    finally:
        api.get_genai_client.cache_clear()


def test_auto_language_detection():
    assert api.get_language(api.IdeaInput(
        title="مخطط دراسي",
        description="تطبيق يساعد الطلاب على تنظيم المذاكرة خلال فترة الاختبارات في الجامعة.",
        language="auto"
    )) == "ar"
    assert api.get_language(api.IdeaInput(
        title="Study planner",
        description="A system that helps students prepare for university examinations.",
        language="auto"
    )) == "en"


import pytest

IDEA = {
    "title": "AI Study Planner",
    "description": "A web app that helps students plan revision sessions for university exams.",
    "language": "en",
}


@pytest.fixture
def stubbed(monkeypatch):
    """Real corpus records, stubbed selection and Gemini; no live ranking claims."""
    df = pd.read_csv(api.DATA, encoding="utf-8-sig", keep_default_na=False)
    df.columns = df.columns.str.lower()
    found = df.head(5).copy()
    found.insert(0, "rank", range(1, 6))
    calls = []

    def search(title, description, language, top_k):
        calls.append(language)
        assert top_k == 5
        return found

    output = {"comparisons": [], "suggestions": []}
    def generate(**kwargs):
        request = json.loads(kwargs["contents"])
        assert request["retrieved_projects"][0]["title"] == df.iloc[0]["title"]
        return SimpleNamespace(text=json.dumps(output, ensure_ascii=False))

    monkeypatch.setattr(api, "get_retrieval", lambda: SimpleNamespace(language_aware_search=search))
    monkeypatch.setattr(api, "get_genai_client", lambda: SimpleNamespace(models=SimpleNamespace(generate_content=generate)))
    return output, calls, df


@pytest.mark.parametrize("language", ["ar", "en"])
def test_real_records_bilingual_contract(stubbed, language):
    output, calls, corpus = stubbed
    output.update({
        "comparisons": [{"projectId": "P001", "inCommon": "Shared topic"}, {"projectId": "P999", "inCommon": "Invalid"}],
        "suggestions": [{"title": "Evaluate the prototype", "label": "Testing", "body": "Run a usability study.", "reason": "Measure completion time.", "citedProjectIds": ["P001", "P999", "P001"]}],
    })
    idea = IDEA if language == "en" else {"title": "نظام ري ذكي", "description": "نظام يساعد أصحاب الحدائق على ري النباتات حسب رطوبة التربة ودرجة الحرارة.", "language": "auto"}
    response = TestClient(api.app).post("/api/analyze", json=idea)
    assert response.status_code == 200
    payload = response.json()
    assert calls == [language]
    results = payload["retrieval"]["results"]
    assert len(results) == 5
    for result, record in zip(results, corpus.to_dict("records")):
        project = result["project"]
        assert project["id"] == record["project_id"]
        assert project["title"][language] == record["title"]
        assert project["abstract"][language] == record["abstract"]
        assert project["year"] == str(record["year"])
        assert project["sourcePage"] == record["source_page"]
    assert len(payload["retrieval"]["comparisons"]) == 1
    assert payload["suggestions"][0]["citedProjectIds"] == ["P001"]
    assert payload["suggestions"][0]["isDemo"] is False


@pytest.mark.parametrize("bad", [None, [], "text", {"comparisons": None, "suggestions": []}, {"comparisons": [], "suggestions": [{"title": {}}]}])
def test_malformed_generation_preserves_retrieval(stubbed, monkeypatch, bad):
    monkeypatch.setattr(api, "get_genai_client", lambda: SimpleNamespace(models=SimpleNamespace(generate_content=lambda **kw: SimpleNamespace(text=json.dumps(bad)))))
    response = TestClient(api.app).post("/api/analyze", json=IDEA)
    assert response.status_code == 200
    assert len(response.json()["retrieval"]["results"]) == 5
    assert response.json()["suggestions"] == []
    assert response.json()["enhancementUnavailable"] is True


@pytest.mark.parametrize("failure", [RuntimeError("secret key must not leak"), TimeoutError("private prompt")])
def test_gemini_failure_is_safe_and_preserves_retrieval(stubbed, monkeypatch, failure):
    def fail():
        raise failure
    monkeypatch.setattr(api, "get_genai_client", fail)
    response = TestClient(api.app).post("/api/analyze", json=IDEA)
    assert response.status_code == 200
    assert "secret" not in response.text and "private" not in response.text
    assert len(response.json()["retrieval"]["results"]) == 5
    assert response.json()["enhancementUnavailable"] is True
    assert not api.ANALYSIS_LOCK.locked()


def test_transient_gemini_server_error_retries_once(stubbed, monkeypatch):
    attempts = []
    sleeps = []

    def generate(**kwargs):
        attempts.append(kwargs)
        if len(attempts) == 1:
            raise errors.ServerError(503, {
                "error": {"code": 503, "status": "UNAVAILABLE", "message": "temporary"}
            })
        return SimpleNamespace(text=json.dumps({"comparisons": [], "suggestions": []}))

    monkeypatch.setattr(
        api,
        "get_genai_client",
        lambda: SimpleNamespace(models=SimpleNamespace(generate_content=generate)),
    )
    monkeypatch.setattr(api.time, "sleep", sleeps.append)
    monkeypatch.setattr(api.random, "uniform", lambda start, end: 0.5)
    monkeypatch.setattr(api, "_gemini_503_cooldown_until", 0.0)
    response = TestClient(api.app).post("/api/analyze", json=IDEA)

    assert response.status_code == 200
    assert response.json()["enhancementUnavailable"] is False
    assert len(response.json()["retrieval"]["results"]) == 5
    assert len(attempts) == 2
    assert sleeps == [api.GEMINI_RETRY_INITIAL_DELAY_SECONDS + 0.5]


def test_gemini_quota_error_is_not_retried(stubbed, monkeypatch):
    attempts = []
    sleeps = []

    def generate(**kwargs):
        attempts.append(kwargs)
        raise errors.ClientError(429, {
            "error": {
                "code": 429,
                "status": "RESOURCE_EXHAUSTED",
                "message": "quota exhausted",
            }
        })

    monkeypatch.setattr(
        api,
        "get_genai_client",
        lambda: SimpleNamespace(models=SimpleNamespace(generate_content=generate)),
    )
    monkeypatch.setattr(api.time, "sleep", sleeps.append)
    monkeypatch.setattr(api, "_gemini_503_cooldown_until", 0.0)
    response = TestClient(api.app).post("/api/analyze", json=IDEA)

    assert response.status_code == 200
    assert response.json()["enhancementUnavailable"] is True
    assert len(response.json()["retrieval"]["results"]) == 5
    assert len(attempts) == 1
    assert sleeps == []


def test_nontransient_gemini_server_error_is_not_retried(stubbed, monkeypatch):
    attempts = []

    def generate(**kwargs):
        attempts.append(kwargs)
        raise errors.ServerError(501, {
            "error": {"code": 501, "status": "NOT_IMPLEMENTED", "message": "unsupported"}
        })

    monkeypatch.setattr(
        api,
        "get_genai_client",
        lambda: SimpleNamespace(models=SimpleNamespace(generate_content=generate)),
    )
    monkeypatch.setattr(api.time, "sleep", lambda _: pytest.fail("must not retry"))
    monkeypatch.setattr(api, "_gemini_503_cooldown_until", 0.0)
    response = TestClient(api.app).post("/api/analyze", json=IDEA)

    assert response.status_code == 200
    assert response.json()["enhancementUnavailable"] is True
    assert len(attempts) == 1


def test_gemini_transport_timeout_is_not_retried(stubbed, monkeypatch):
    attempts = []

    def generate(**kwargs):
        attempts.append(kwargs)
        raise TimeoutError("connection timed out")

    monkeypatch.setattr(
        api,
        "get_genai_client",
        lambda: SimpleNamespace(models=SimpleNamespace(generate_content=generate)),
    )
    monkeypatch.setattr(api.time, "sleep", lambda _: pytest.fail("must not retry"))
    monkeypatch.setattr(api, "_gemini_503_cooldown_until", 0.0)
    response = TestClient(api.app).post("/api/analyze", json=IDEA)

    assert response.status_code == 200
    assert response.json()["enhancementUnavailable"] is True
    assert len(attempts) == 1


def test_repeated_503_opens_cooldown_without_more_api_calls(stubbed, monkeypatch):
    attempts = []
    sleeps = []

    def generate(**kwargs):
        attempts.append(kwargs)
        raise errors.ServerError(503, {
            "error": {"code": 503, "status": "UNAVAILABLE", "message": "busy"}
        })

    monkeypatch.setattr(
        api,
        "get_genai_client",
        lambda: SimpleNamespace(models=SimpleNamespace(generate_content=generate)),
    )
    monkeypatch.setattr(api.time, "sleep", sleeps.append)
    monkeypatch.setattr(api.time, "monotonic", lambda: 100.0)
    monkeypatch.setattr(api.random, "uniform", lambda start, end: 0.0)
    monkeypatch.setattr(api, "_gemini_503_cooldown_until", 0.0)

    first = TestClient(api.app).post("/api/analyze", json=IDEA)
    second = TestClient(api.app).post("/api/analyze", json=IDEA)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["enhancementUnavailable"] is True
    assert second.json()["enhancementUnavailable"] is True
    assert len(first.json()["retrieval"]["results"]) == 5
    assert len(second.json()["retrieval"]["results"]) == 5
    assert len(attempts) == 2
    assert sleeps == [api.GEMINI_RETRY_INITIAL_DELAY_SECONDS]
    assert api._gemini_503_cooldown_until == 160.0


def test_whitespace_input_rejected():
    response = TestClient(api.app).post("/api/analyze", json={**IDEA, "title": "     "})
    assert response.status_code == 422


def test_busy_returns_429():
    with api.ANALYSIS_LOCK:
        response = TestClient(api.app).post("/api/analyze", json=IDEA)
    assert response.status_code == 429


def test_health_and_cors():
    client = TestClient(api.app)
    assert client.get("/health").json()["status"] == "ok"
    accepted = client.options("/api/analyze", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"})
    assert accepted.headers["access-control-allow-origin"] == "http://localhost:5173"
    denied = client.options("/api/analyze", headers={"Origin": "https://untrusted.example", "Access-Control-Request-Method": "POST"})
    assert "access-control-allow-origin" not in denied.headers
    accepted_loopback = client.options("/api/analyze", headers={"Origin": "http://127.0.0.1:5173", "Access-Control-Request-Method": "POST"})
    assert accepted_loopback.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"


def test_corpus_ids_unique_and_complete():
    corpus = pd.read_csv(api.DATA, encoding="utf-8-sig")
    assert corpus.shape == (103, 7)
    assert corpus.Project_ID.is_unique
    assert corpus[["Title", "Abstract", "Source_Page"]].notna().all().all()
