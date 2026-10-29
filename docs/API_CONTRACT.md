# Local API contract

The UI calls `POST http://127.0.0.1:8000/api/analyze` through `src/services/originApi.ts`.

Request:

```json
{"title":"...","description":"...","language":"auto"}
```

The response contains `retrieval`, `suggestions`, and `enhancementUnavailable`. Retrieval contains up to five genuine dataset records, detected language, retrieval mode, and grounded comparisons. Suggestions contain at most three generated recommendations. All cited IDs must belong to the returned project set; the frontend validates this contract before rendering.

If Gemini is missing, invalid, rate-limited, or returns invalid JSON, the request still succeeds with real retrieval, empty generated fields, and `enhancementUnavailable: true`. Retrieval/model/data failures return HTTP 503. Concurrent analyses return 429. Validation failures return 422. No failure falls back to fictional results.
