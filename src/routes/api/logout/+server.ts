import { redirect, type RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { FOUND } from '$lib/constants/http';

export const GET: RequestHandler = async (event) => {
	await auth.api.signOut({
		headers: event.request.headers
	});

	return redirect(FOUND, '/');
};
