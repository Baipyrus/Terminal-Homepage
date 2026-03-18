import { NOT_FOUND, UNAUTHORIZED } from '$lib/constants/http';
import { messenger, Message, type Client, type SlimMessage } from '$lib/server/messenger';
import { exists } from '$lib/server/path';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const KEEP_ALIVE_MILLIS = 30000;

export const GET: RequestHandler = ({ locals, url }) => {
	if (!locals.user) return error(UNAUTHORIZED, 'Unauthorized');

	const channel = url.searchParams.get('channel') || '~';

	// Validate that the directory (channel) exists in the database
	if (channel !== '~' && !exists(channel)) return new Response('Not Found', { status: NOT_FOUND });

	let client: Client | null = null;
	let keepAlive: ReturnType<typeof setInterval> | null = null;

	const disconnect = () => {
		if (keepAlive) clearInterval(keepAlive);
		if (client) messenger.removeFrom(client, channel);
	};

	const stream = new ReadableStream({
		start(controller) {
			// Create client instance
			client = {
				user: locals.user!,
				send: (data: SlimMessage) => {
					try {
						controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
						/* eslint-disable-next-line no-empty */
					} catch {}
				}
			} as Client;

			// Initialize connection
			controller.enqueue(': connected\n\n');
			messenger.addTo(client, channel);

			// Broadcast entry message
			messenger.sendAs(new Message(locals.user!, 'entered the channel'), channel);

			// Keep-alive interval for `ReadableStream`
			keepAlive = setInterval(() => {
				try {
					controller.enqueue(': keep-alive\n\n');
				} catch {
					disconnect();
				}
			}, KEEP_ALIVE_MILLIS);

			// Disconnect handler for `ReadableStream`
			return disconnect;
		},
		cancel: disconnect
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
