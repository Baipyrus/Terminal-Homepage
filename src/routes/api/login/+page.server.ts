import { error, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { FOUND, BAD_REQUEST } from '$lib/constants/http';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const result = await auth.api.signInSocial({
		body: {
			provider: 'github',
			// NOTE: These extra long API routes are based off of
			// the preexisting /api/auth/callback/* routes straight
			// from better-auth itself:
			callbackURL: '/api/login/success',
			errorCallbackURL: '/api/login/error'
		}
	});

	// Redirect to generated social sign in URL from better-auth
	if (result.url) return redirect(FOUND, result.url);

	// Notify frontend of failed social sign-in
	error(BAD_REQUEST, { message: 'Social sign-in failed' });
};
