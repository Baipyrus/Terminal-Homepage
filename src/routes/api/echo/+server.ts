import { messenger } from '$lib/server/Messenger';
import { exists } from '$lib/server/path';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NOT_FOUND, UNAUTHORIZED } from '$lib/constants/http';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

	const { message, channel }: { message: string; channel: string } = await request.json();

	if (message && channel) {
		// Validate that the directory (channel) exists in the database
		if (channel !== '~' && !exists(channel))
			return json({ error: 'Channel does not exist' }, { status: NOT_FOUND });

		messenger.send(channel, {
			user: locals.user.name,
			content: message
		});
	}

	return new Response();
};
