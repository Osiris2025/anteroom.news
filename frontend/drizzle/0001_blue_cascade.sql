CREATE TABLE IF NOT EXISTS digest_subscription (
	id text PRIMARY KEY NOT NULL,
	email text NOT NULL,
	user_id text,
	frequency text DEFAULT 'daily' NOT NULL,
	magazines jsonb,
	verified boolean DEFAULT false NOT NULL,
	verify_token text,
	unsubscribe_token text,
	subscribed_at timestamp DEFAULT now() NOT NULL,
	unsubscribed_at timestamp,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE digest_subscription ADD CONSTRAINT digest_subscription_email_unique UNIQUE(email);
