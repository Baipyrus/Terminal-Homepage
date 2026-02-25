import { FOUND, NOT_FOUND, UNAUTHORIZED } from '$lib/constants/http';
import logger from '$lib/server/logger';
import { error, redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ locals, params }) => {
	// Technically, this is a bad request, but we return 404
	if (!Object.hasOwn(params, 'status')) error(NOT_FOUND, 'Not Found');

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
	error(UNAUTHORIZED, 'Unauthorized');
};
