import { BAD_REQUEST, FOUND, NOT_FOUND } from '$lib/constants/http';
import logger from '$lib/server/logger';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, params }) => {
	if (!Object.hasOwn(params, 'status')) error(BAD_REQUEST, 'Bad Request');

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
	error(NOT_FOUND, 'Not Found');
};
