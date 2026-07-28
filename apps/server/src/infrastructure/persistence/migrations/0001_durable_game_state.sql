CREATE TABLE "game_sessions" (
	"session_id" text PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"state" jsonb NOT NULL,
	"schema_version" integer NOT NULL,
	"state_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "players" (
	"player_id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"provider_player_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_commands" (
	"player_id" text NOT NULL,
	"session_id" text NOT NULL,
	"command_id" text NOT NULL,
	"request_hash" text NOT NULL,
	"command_type" text NOT NULL,
	"state_version_before" integer NOT NULL,
	"state_version_after" integer NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processed_commands_player_id_command_id_pk" PRIMARY KEY("player_id","command_id")
);
--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_player_id_players_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("player_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_commands" ADD CONSTRAINT "processed_commands_player_id_players_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("player_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_commands" ADD CONSTRAINT "processed_commands_session_id_game_sessions_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "players_provider_identity_idx" ON "players" USING btree ("provider","provider_player_id");