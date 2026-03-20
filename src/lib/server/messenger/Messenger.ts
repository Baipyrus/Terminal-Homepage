import type { Client, Message } from '.';

const EMPTY = 0;

// Hub for client management and messaging system categorized by channels
class Messenger {
	private channels: Map<string, Set<Client>> = new Map();

	addTo(client: Client, channel: string) {
		// If channel does not exist, create it
		if (!this.channels.has(channel)) this.channels.set(channel, new Set());

		// Add user to channel
		this.channels.get(channel)!.add(client);
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

	countClients(channel: string): number {
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
