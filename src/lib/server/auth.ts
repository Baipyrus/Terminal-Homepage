import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';

import {
	ORIGIN_DEV,
	ORIGIN,
	GITHUB_CLIENT_ID_DEV,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET_DEV,
	GITHUB_CLIENT_SECRET,
	BETTER_AUTH_SECRET
} from '$app/env/private';

import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db/index.js';
import { dev } from '$app/env';

const originURL = dev ? ORIGIN_DEV : ORIGIN;
const githubId = dev ? GITHUB_CLIENT_ID_DEV : GITHUB_CLIENT_ID;
const githubSecret = dev ? GITHUB_CLIENT_SECRET_DEV : GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
	baseURL: originURL ?? '',
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	socialProviders: {
		github: {
			clientId: githubId ?? '',
			clientSecret: githubSecret ?? ''
		}
	},
	plugins: [
		// make sure this is the last plugin in the array
		sveltekitCookies(getRequestEvent)
	]
});
