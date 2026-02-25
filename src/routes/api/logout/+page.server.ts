import { error, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { FOUND, UNAUTHORIZED } from '$lib/constants/http';
import logger from '$lib/server/logger';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, request }) => {
	if (!locals.user) return error(UNAUTHORIZED, 'Unauthorized');

	await auth.api.signOut({
		headers: request.headers
	});

	logger.info(`User ${locals.user} logged out successfully`, { label: 'Auth' });

	redirect(FOUND, '/');
};
