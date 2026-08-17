import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { dev } from '$app/env';
import { building } from '$app/env';

const originURL = dev ? env.ORIGIN_DEV : env.ORIGIN;
const githubId = dev ? env.GITHUB_CLIENT_ID_DEV : env.GITHUB_CLIENT_ID;
const githubSecret = dev ? env.GITHUB_CLIENT_SECRET_DEV : env.GITHUB_CLIENT_SECRET;

const betterAuthOptions: BetterAuthOptions = {
	baseURL: originURL ?? '',
	secret: env.BETTER_AUTH_SECRET,
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
};

const getAuthInstance = () => {
	if (building) return null;

	return betterAuth(betterAuthOptions);
};

export const auth = getAuthInstance();
