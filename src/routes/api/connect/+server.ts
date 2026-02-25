import { NOT_FOUND, UNAUTHORIZED } from '$lib/constants/http';
import { messenger, type Client, type Message } from '$lib/server/Messenger';
import { exists } from '$lib/server/path';
import type { RequestHandler } from './$types';

const KEEP_ALIVE_MILLIS = 30000;

export const GET: RequestHandler = ({ locals, url }) => {
	if (!locals.user) return new Response('Unauthorized', { status: UNAUTHORIZED });

	const channel = url.searchParams.get('channel') || '~';

	// Validate that the directory (channel) exists in the database
	if (channel !== '~' && !exists(channel)) return new Response('Not Found', { status: NOT_FOUND });

	let client: Client | null = null;
	let keepAlive: ReturnType<typeof setInterval> | null = null;

	const disconnect = () => {
		if (keepAlive) clearInterval(keepAlive);
		if (client) messenger.remove(channel, client);
	};

	const stream = new ReadableStream({
		start(controller) {
			// Create client instance
			client = {
				id: locals.user!.id,
				send: (data: Message) => {
					try {
						controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
						/* eslint-disable-next-line no-empty */
					} catch {}
				}
			} as Client;

			// Initialize connection
			controller.enqueue(': connected\n\n');
			messenger.add(channel, client);

			// Broadcast entry message
			messenger.send(channel, {
				user: locals.user!.name,
				content: 'entered the channel'
			});

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
