// Representation of a single client connected via `ReadableStream`
export type Client = {
	id: string;
	send: (data: Message) => void;
};

export type Message = {
	user: string;
	content: string;
};

// Hub for client management and messaging system
class Messenger {
	private clients: Set<Client> = new Set();

	add(client: Client) {
		console.debug('New client connected!');
		this.clients.add(client);
	}

	remove(client: Client) {
		console.debug('Client has disconnected!');
		this.clients.delete(client);
	}

	send(message: Message) {
		console.debug('Broadcast:', message);
		for (const client of this.clients) client.send(message);
	}
}

// Single server-wide instance of the messenger hub
export const messenger = new Messenger();
