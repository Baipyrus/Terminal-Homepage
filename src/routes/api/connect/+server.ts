import { CONFLICT, UNAUTHORIZED } from '$lib/constants/http';
import { messenger, type Client, type SlimMessage } from '$lib/server/messenger';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import logger from '$lib/server/Logger';

const KEEP_ALIVE_MILLIS = 30000;

export const GET: RequestHandler = ({ locals }) => {
	if (!locals.user) return error(UNAUTHORIZED, 'Unauthorized');

	// Deny request if user already connected elsewhere
	if (messenger.hasClient(locals.user.id)) return error(CONFLICT, 'Already Connected');

	// Define connection variables
	let client: Client | null = null;
	let keepAlive: ReturnType<typeof setInterval> | null = null;

	// Define disconnect function for readable stream
	const disconnect = () => {
		if (keepAlive) clearInterval(keepAlive);
		if (client) messenger.tryRemove(client);
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

	const response = new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});

	// Connecting user to messenging service
	messenger.tryAdd(client!, stream);
	logger.info(`User ${locals.user!.name} connected readable stream`, { label: 'MSG' });

	return response;
};
