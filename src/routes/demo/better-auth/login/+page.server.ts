import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { BAD_REQUEST, FOUND } from '$lib/constants/http';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		return redirect(FOUND, '/demo/better-auth');
	}
	return {};
};

export const actions: Actions = {
	signInSocial: async (event) => {
		const formData = await event.request.formData();
		const provider = formData.get('provider')?.toString() ?? 'github';
		const callbackURL = formData.get('callbackURL')?.toString() ?? '/demo/better-auth';

		const result = await auth.api.signInSocial({
			body: {
				provider: provider as 'github',
				callbackURL
			}
		});

		if (result.url) {
			return redirect(FOUND, result.url);
		}
		return fail(BAD_REQUEST, { message: 'Social sign-in failed' });
	}
};
