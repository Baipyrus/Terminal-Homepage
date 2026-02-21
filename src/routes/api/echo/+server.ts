import { messenger } from '$lib/server/Messenger';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { message, channel }: { message: string; channel: string } = await request.json();

	if (message && channel)
		messenger.send(channel, {
			user: locals.user.name,
			content: message
		});

	return new Response();
};
