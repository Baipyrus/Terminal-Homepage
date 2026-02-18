import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ request }) => {
	const httpMethod = request.method;
	return {
		httpMethod
	};
};
