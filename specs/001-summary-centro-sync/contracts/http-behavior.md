# HTTP behavior contract

## `POST /summaries`

- Keep the existing successful status and `toSummaryResponse` body unchanged.
- Persist and publish the versioned center-refresh event before returning success; the request waits for the event handoff, not for the worker or geocoding.
- A successful response means the event broker accepted the event; it does not mean center synchronization has completed.
- If event publication fails after persistence, return a non-success response and log the persisted summary and center IDs for operator replay. The summary remains persisted, so a client retry may create a duplicate summary. Do not return a success-shaped fallback.
- For operational replay, publish the same deterministic event for the persisted summary; worker idempotency and source-version checks make duplicate delivery safe.
- Do not add a processing-status URL or expose worker state in the response.

## Center reads

- `GET /centros/:id` and `GET /centros` read `FUNCIONAMENTO` from the persisted center record only. Do not use a historical summary as a fallback.
- Existing `ATENDIMENTOS` summary presentation remains separate and follows its current behavior.
- Keep the public field names and the existing weekly `FUNCIONAMENTO` shape.
