import { redirect, type RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { FOUND, UNAUTHORIZED } from '$lib/constants/http';
import logger from '$lib/server/logger';

export const GET: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return new Response('Unauthorized', { status: UNAUTHORIZED });

	await auth.api.signOut({
		headers: request.headers
	});

	logger.info(`User ${locals.user} logged out successfully`, { label: 'Auth' });

	return redirect(FOUND, '/');
};
