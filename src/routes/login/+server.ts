import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { FOUND, BAD_REQUEST } from '$lib/constants/http';

export const GET: RequestHandler = async () => {
	const result = await auth.api.signInSocial({
		body: {
			provider: 'github',
			callbackURL: '/'
		}
	});

	// If successfully logged in, redirect to callback URL
	if (result.url) return redirect(FOUND, result.url);

	// Notify frontend of failed social sign-in
	return error(BAD_REQUEST, { message: 'Social sign-in failed' });
};
