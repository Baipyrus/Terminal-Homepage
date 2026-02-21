import { messenger, type Client, type Message } from '$lib/server/Messenger';
import type { RequestHandler } from './$types';

const KEEP_ALIVE_MILLIS = 30000;

export const GET: RequestHandler = ({ locals, url }) => {
	if (!locals.user) return new Response('Unauthorized', { status: 401 });

	const channel = url.searchParams.get('channel') || '~';
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
