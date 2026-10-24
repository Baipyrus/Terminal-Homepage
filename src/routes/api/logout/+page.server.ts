import { error, redirect } from '@sveltejs/kit';
import { auth } from '#lib/server/auth.js';
import { FOUND, UNAUTHORIZED } from '#lib/constants/http.js';
import logger from '#lib/server/Logger.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, request }) => {
	if (!locals.user) return error(UNAUTHORIZED, 'Unauthorized');

	await auth.api.signOut({
		headers: request.headers
	});

	logger.info(`User ${locals.user.name} logged out successfully`, { label: 'AUTH' });

	redirect(FOUND, '/');
};
