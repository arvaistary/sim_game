# Data model: M3 durable game-state persistence

## `players`

Represents owner identity boundary. M3 supports anonymous sessions; provider-backed identities remain future-compatible.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `provider` | text | `local` in M3; future values include `yandex` |
| `provider_player_id` | text | Unique together with `provider`; session ID for anonymous M3 identity |
| `created_at` | timestamp | Set on insert |
| `updated_at` | timestamp | Updated when identity metadata changes |

Constraint: `UNIQUE(provider, provider_player_id)`.

## `game_sessions`

Stores current canonical `GameWorldJSON` snapshot.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key; maps to session ID exposed to current API |
| `player_id` | UUID | Foreign key to `players`; one active session per player in M3 |
| `state` | JSONB | Current validated game snapshot |
| `schema_version` | integer | Snapshot format version; starts at `1` |
| `state_version` | bigint | Starts at `0`; increments once per committed mutation |
| `created_at` | timestamp | Set on first initialization |
| `updated_at` | timestamp | Updated on every committed mutation |
| `expires_at` | timestamp | Enforces current 24-hour retention policy |

Constraints:

- `UNIQUE(player_id)` while one active session per player is supported;
- `state_version >= 0`;
- `expires_at > created_at`;
- foreign-key delete behavior must not leave orphaned sessions.

## `processed_commands`

Stores idempotency result for each accepted command.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `player_id` | UUID | Foreign key to `players` |
| `session_id` | UUID | Foreign key to `game_sessions` |
| `command_id` | UUID/text | Client-generated unique identity |
| `command_type` | text | Command family |
| `request_hash` | text | Fingerprint of canonical command payload |
| `state_version_before` | bigint | Version used by command |
| `state_version_after` | bigint | Version returned by command |
| `response` | JSONB | Canonical successful response for retry |
| `created_at` | timestamp | Commit time |

Constraint: `UNIQUE(player_id, command_id)`.

## State transition

```text
request
  → resolve session/player
  → begin transaction
  → find processed command
  → validate request hash or return cached response
  → load session and verify expected state_version
  → execute domain command in memory
  → compare-and-swap game_sessions.state
  → insert processed_commands record
  → commit
  → return state + stateVersion + commandId
```

If compare-and-swap affects zero rows, return `409 state_version_conflict`. If transaction fails, neither state nor idempotency record is considered committed.

## Snapshot migration

`schema_version` is checked before `GameWorld.fromJSON`. Migration functions must be pure and ordered. An unsupported future version is rejected without replacing stored state. Each migration requires fixture tests for old snapshot and current output.

## Deferred entities

`audit_events`, normalized read models, save slots, leaderboards and analytics are outside M3. Redis keys for locks/cache/rate limiting are also outside PostgreSQL data model and must never become canonical state.
