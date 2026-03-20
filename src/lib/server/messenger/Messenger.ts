import type { Client, Message } from '.';

const EMPTY = 0;

// Hub for client management and messaging system categorized by channels
class Messenger {
	private connected: Map<string, { client: Client; stream: ReadableStream }> = new Map();
	private channels: Map<string, Set<Client>> = new Map();

	getClient(id: string): Client | null {
		return this.connected.get(id)?.client ?? null;
	}

	hasClient(id: string): boolean {
		return this.connected.has(id);
	}

	tryAdd(client: Client, stream: ReadableStream): boolean {
		// Detect if user is already connected elsewhere
		if (this.connected.has(client.user.id)) return false;

		// Add user to connected list
		this.connected.set(client.user.id, { client, stream });

		// Add user to default channel
		client.channel = '~';
		this.addTo(client, '~');

		return true;
	}

	addTo(client: Client, channel: string) {
		// If channel does not exist, create it
		if (!this.channels.has(channel)) this.channels.set(channel, new Set());

		// Add user to channel
		this.channels.get(channel)!.add(client);
	}

	tryRemove(client: Client): boolean {
		const existed = this.connected.delete(client.user.id);

		// If client was connected, remove from channels
		if (existed) this.removeFrom(client, client.channel!);

		return existed;
	}

	removeFrom(client: Client, channel: string) {
		// Try getting clients from channel
		const clients = this.channels.get(channel);

		// Ignore if channel does not exist
		if (!clients) return;

		// Remove client from list
		clients.delete(client);

		// Delete channel if empty
		if (clients.size === EMPTY) this.channels.delete(channel);
	}

	countClients(channel?: string): number {
		// If no channel provided, get total user connections
		if (!channel) return this.connected.size;

		// Try getting clients from channel
		const clients = this.channels.get(channel);

		// Return size or 0
		return clients?.size || EMPTY;
	}

	sendAs(message: Message, channel: string) {
		// Try getting clients from channel
		const clients = this.channels.get(channel);

		// Ignore if channel does not exist
		if (!clients) return;

		// Try sending message to all clients in channel
		for (const c of clients) {
			if (c.user.id === message.user.id) continue;

			try {
				c.send(message.toSlim());
				/* eslint-disable-next-line no-empty */
			} catch {}
		}
	}
}

// Single server-wide instance of the messenger hub
export const messenger = new Messenger();
