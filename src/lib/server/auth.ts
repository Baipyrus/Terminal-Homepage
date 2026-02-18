import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { dev } from '$app/environment';

const originURL = dev ? env.ORIGIN_DEV : env.ORIGIN;
const githubId = dev ? env.GITHUB_CLIENT_ID_DEV : env.GITHUB_CLIENT_ID;
const githubSecret = dev ? env.GITHUB_CLIENT_SECRET_DEV : env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
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
});
