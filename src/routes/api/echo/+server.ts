import { messenger, Message } from '#lib/server/messenger/index.js';
import { exists } from '#lib/server/path.js';
import type { RequestHandler } from './$types';
import { NOT_FOUND, UNAUTHORIZED } from '#lib/constants/http.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return Response.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

	const { message, channel }: { message: string; channel: string } = await request.json();

	if (message && channel) {
		// Validate that the directory (channel) exists in the database
		if (channel !== '~' && !exists(channel))
			return Response.json({ error: 'Channel does not exist' }, { status: NOT_FOUND });

		messenger.sendAs(new Message(locals.user, message), channel);
	}

	return new Response();
};
