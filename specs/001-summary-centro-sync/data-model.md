# Data Model: Center summary synchronization

## Summary

An accepted summary remains the source record. A background consumer derives the center fields from that persisted summary and writes them to the center record. The event is a pointer to persisted data, not a second copy of its personal information.

## Entities

### Summary

Existing aggregate representing one submitted center snapshot.

| Field | Role in this feature | Validation / behavior |
|---|---|---|
| `id` | Stable identity referenced by the update event | Required |
| `centroId` | Center whose record may be refreshed | Required; event and summary IDs must match |
| `formId` | Identifies the form version used to interpret answers | Required |
| `formSnapshot` / `questions` | Source of address and contact answers and their question metadata | Read the saved snapshot; do not reconstruct from mutable current answers |
| `attendance` | Normalized activities and weekday/time encounters | Existing derived structure; convert valid encounters to the legacy center schedule |
| `publicationAuthorized` | Controls whether public phone/site values may be stored | Only explicit positive authorization permits public contacts |
| `createdAt`, `updatedAt` | Source ordering and stale-event protection | Compare deterministically, using summary ID as a final tie-breaker |

### Centro

Existing aggregate and public record for one center.

| Field | Role in this feature | Validation / behavior |
|---|---|---|
| `funcionamento` | Persisted weekly schedule | Day-keyed arrays of normalized start times; update only from valid attendance in a newly accepted summary |
| `telefone`, `site` | Public contact values | Set only when disclosure is authorized; remove values without valid answers according to the spec |
| `endereco`, `cep`, `bairro`, `cidade`, `estado`, `pais` | Address inputs | Update only from valid summary answers; absent or invalid address preserves current values |
| `location` | Geocoded location associated with the address | A changed address invalidates the previous result; accept a new result only for the current address hash |
| `summarySourceVersion` *(internal)* | Highest summary version successfully applied | Used for idempotency and stale-message protection; excluded from public presenters and not a user-visible processing status |

Existing centers are not backfilled. If their stored `funcionamento` is empty, queries return the stored value without looking up an older summary.

### Center summary refresh event

Transient message published to SNS and delivered to the subscribed SQS queue.

| Field | Role | Validation / behavior |
|---|---|---|
| `schemaVersion` | Event contract version | Required; current value `center.summary-refresh.v1` |
| `eventId` | Stable duplicate-detection key | Derived from the summary ID |
| `summaryId` | Pointer to the persisted summary | Required |
| `centroId` | Center to refresh | Required and must match the referenced summary |
| `sourceVersion` | Summary ordering tuple | Contains `updatedAt`, `createdAt`, and `summaryId`; older or already-applied versions cannot overwrite newer center data |

The event contains no phone, site, address, answer, or other personal information. SNS raw delivery is enabled so the SQS body follows this event schema directly.

## Relationships and processing lifecycle

1. A summary is persisted for one center.
2. Its refresh event is published; the HTTP caller does not wait for SQS consumption or geocoding.
3. The worker validates the event, loads the current latest summary for that center, and derives the profile fields from the persisted snapshot.
4. The worker atomically applies only a version newer than `summarySourceVersion`. Duplicate or stale messages are safe no-ops.
5. On successful processing, Lambda acknowledges the SQS record. Retryable failures are returned as failed batch items; repeated failures move to the dead-letter queue for operational handling.
6. No processing status is exposed through the public API. The center's existing location status indicates whether its geocoding result is confirmed, approximate, pending, or in error.

If publication fails after persistence, the API returns a non-success response and logs the summary and center IDs for operator replay. The summary remains stored; a caller retry may create another summary. A transactional outbox is intentionally out of scope.

## Compatibility notes

- Keep the public `FUNCIONAMENTO` JSON shape and center response fields unchanged when the center has persisted values.
- Remove only the summary-derived `FUNCIONAMENTO` fallback. Preserve the existing `ATENDIMENTOS` summary representation.
- Do not add a processing-status endpoint or return event details in the summary response.
