import type { PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	// Redirect user data to frontend, if available
	return {
		username: event.locals.user?.name
	};
};
