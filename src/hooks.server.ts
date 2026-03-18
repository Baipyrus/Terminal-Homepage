import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import logger from '$lib/server/Logger';
import { BAD_REQUEST } from '$lib/constants/http';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	const { locals } = event;

	if (session) {
		locals.session = session.session;
		locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

const handleLogging: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
	const { method } = event.request;
	const { pathname } = event.url;
	const { status } = response;

	if (status >= BAD_REQUEST) logger.error(`${status} ${method} ${pathname}`, { label: 'HTTP' });
	else logger.info(`${status} ${method} ${pathname}`, { label: 'HTTP' });

	return response;
};

export const handle: Handle = sequence(handleBetterAuth, handleLogging);

export const handleError: HandleServerError = ({ error, event }) => {
	const { method } = event.request;
	const { pathname } = event.url;

	const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
	logger.error(`${method} ${pathname} - ${errorMessage}`, { label: 'INTERNAL' });

	if (error instanceof Error && error.stack) logger.debug(error.stack, { label: 'STACK' });
};
