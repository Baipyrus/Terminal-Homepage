import { FOUND, NOT_FOUND, UNAUTHORIZED } from '$lib/constants/http';
import logger from '$lib/server/logger';
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ locals, params }) => {
	// Technically, this is a bad request, but we return 404
	if (!Object.hasOwn(params, 'status')) return new Response('Not Found', { status: NOT_FOUND });

	if (params.status === 'error') {
		logger.error('A user has failed to log in', { label: 'Auth' });
		return redirect(FOUND, '/');
	}

	const { user } = locals;
	if (params.status === 'success' && user) {
		logger.info(`User ${user.name} has successfully logged in`, { label: 'Auth' });
		return redirect(FOUND, '/');
	}

	// Any other edge cases should be unauthorized to access this endpoint
	return new Response('Unauthorized', { status: UNAUTHORIZED });
};
