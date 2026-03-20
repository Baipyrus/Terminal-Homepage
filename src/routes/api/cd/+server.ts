import { BAD_REQUEST, UNAUTHORIZED } from '$lib/constants/http';
import { Message, messenger } from '$lib/server/messenger';
import { exists } from '$lib/server/path';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = ({ url, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

	const path = url.searchParams.get('path') || '~';

	// Validate that the directory (channel) exists in the database
	if (path !== '~' && !exists(path))
		return json({ error: 'Directory does not exist' }, { status: BAD_REQUEST });

	// Try getting client from messenger, if registered
	const client = messenger.getClient(locals.user.id);
	if (!client) return json({ error: 'Not connected' }, { status: BAD_REQUEST });

	// Switch channels (`client.channel` should never be empty after `GET /api/connect`)
	messenger.removeFrom(client, client.channel!);
	messenger.addTo(client, path);
	client.channel = path;

	// Broadcast entry message
	messenger.sendAs(new Message(locals.user, 'entered the channel'), path);

	return new Response();
};
