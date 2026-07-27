# Persistence API contract

M3 keeps existing `/api/game/*` response envelopes and adds metadata needed for safe retries and concurrent clients.

## Mutation request metadata

State-changing requests should carry:

```json
{
  "commandId": "uuid",
  "expectedStateVersion": 3,
  "actionId": "work"
}
```

For sync queues, each queued command carries its own `commandId` and optional `expectedStateVersion`. The server may generate a compatibility command ID only for legacy clients; new client paths must generate IDs before sending.

## Successful mutation response

```json
{
  "success": true,
  "data": {
    "commandId": "uuid",
    "state": {},
    "stateVersion": 4,
    "result": { "success": true, "message": "..." }
  },
  "timestamp": 0
}
```

## Error behavior

| Condition | HTTP | Code | State change |
|---|---:|---|---|
| Session missing/expired | 404 | `session_not_found` | None |
| Stale expected version | 409 | `state_version_conflict` | None |
| Same command ID, different payload | 409 | `command_id_conflict` | None |
| Invalid state/request | 400 | `validation_error` | None |
| PostgreSQL unavailable | 503 | `persistence_unavailable` | None known to be committed |

Repeated request with same command ID and same request hash returns the original successful response and does not increment `stateVersion`.

## Compatibility

Existing clients that omit metadata remain supported during migration through a compatibility path. The compatibility path must be observable and removed only after all active clients send command IDs and expected versions.
