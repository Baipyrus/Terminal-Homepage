import { defineEnvVars } from '@sveltejs/kit/env';

// NOTE: See also: ./.env.example
export const variables = defineEnvVars({
	// better-sqlite3 database file url
	DATABASE_URL: { schema: (input) => input ?? 'local.db' },

	// URL to the production and development server.
	// NOTE: the *_DEV variables are optional if running in production mode and vice versa.
	ORIGIN: { schema: (input) => input ?? '' },
	ORIGIN_DEV: { schema: (input) => input ?? 'http://localhost:5173' },

	// WARN: CHANGE THIS DEFAULT! Generate some 32 characters high entropy. Go to the Better Auth docs for more info.
	BETTER_AUTH_SECRET: { schema: (input) => input ?? 'CHANGE_ME' },

	// Better Auth social sign in for GitHub.
	GITHUB_CLIENT_ID: { schema: (input) => input ?? '' },
	GITHUB_CLIENT_ID_DEV: { schema: (input) => input ?? '' },
	GITHUB_CLIENT_SECRET: { schema: (input) => input ?? '' },
	GITHUB_CLIENT_SECRET_DEV: { schema: (input) => input ?? '' }
});
