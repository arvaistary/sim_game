import { integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const players = pgTable(
  'players',
  {
    playerId: text('player_id').primaryKey(),
    provider: text('provider').notNull(),
    providerPlayerId: text('provider_player_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerIdentity: uniqueIndex('players_provider_identity_idx').on(
      table.provider,
      table.providerPlayerId,
    ),
  }),
)

export const gameSessions = pgTable('game_sessions', {
  sessionId: text('session_id').primaryKey(),
  playerId: text('player_id').notNull().references(() => players.playerId),
  state: jsonb('state').notNull(),
  schemaVersion: integer('schema_version').notNull(),
  stateVersion: integer('state_version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
})

export const processedCommands = pgTable(
  'processed_commands',
  {
    playerId: text('player_id').notNull().references(() => players.playerId),
    sessionId: text('session_id').notNull().references(() => gameSessions.sessionId),
    commandId: text('command_id').notNull(),
    requestHash: text('request_hash').notNull(),
    commandType: text('command_type').notNull(),
    stateVersionBefore: integer('state_version_before').notNull(),
    stateVersionAfter: integer('state_version_after').notNull(),
    result: jsonb('result').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    commandKey: primaryKey({ columns: [table.playerId, table.commandId] }),
  }),
)

export type PlayerRow = typeof players.$inferSelect
export type GameSessionRow = typeof gameSessions.$inferSelect
export type ProcessedCommandRow = typeof processedCommands.$inferSelect
