import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messenger } from '$lib/server/Messenger';
import { directory } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';
import { exists } from '$lib/server/path';
import { BAD_REQUEST } from '$lib/constants/http';

const PATH_START = 0;
const TOP_MOST_DIR = 1;
const OMIT_CHILD_PATH = -1;

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const { path }: { path: string } = await request.json();

	// Minimal user input checks
	if (!path || !path.startsWith('~'))
		return json({ error: 'Invalid path' }, { status: BAD_REQUEST });

	// Check if parent directory of path exists (unless it's a top-level dir under ~)
	const parts = path.split('/');
	const parent = parts.slice(PATH_START, OMIT_CHILD_PATH).join('/');
	if (parts.length > TOP_MOST_DIR) {
		if (parent !== '~' && !exists(parent))
			return json({ error: 'Parent directory does not exist' }, { status: BAD_REQUEST });
	}

	// Create directory entry in Database
	await db.insert(directory).values({ path }).onConflictDoNothing();

	// Broadcast channel creation message
	messenger.send(parent, {
		user: locals.user.name,
		content: `created a new subdirectory: ${path}`
	});

	return new Response();
};
