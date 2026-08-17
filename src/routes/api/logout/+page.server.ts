import { error, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { FOUND, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from '$lib/constants/http';
import logger from '$lib/server/Logger';
import type { PageServerLoad } from './$types';
import { building } from '$app/env';

export const load: PageServerLoad = async ({ locals, request }) => {
	if (!locals.user) return error(UNAUTHORIZED, 'Unauthorized');

	if (!building || !auth) {
		logger.error('Auth instance was not set during sign-out', { label: 'AUTH' });

		// Notify frontend of failed sign-out
		return error(INTERNAL_SERVER_ERROR, { message: 'Sign-out failed' });
	}

	await auth.api.signOut({
		headers: request.headers
	});

	logger.info(`User ${locals.user.name} logged out successfully`, { label: 'AUTH' });

	redirect(FOUND, '/');
};
