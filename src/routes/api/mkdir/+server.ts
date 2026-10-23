import { db } from '#lib/server/db/index.js';
import { messenger, Message } from '#lib/server/messenger/index.js';
import { directory } from '#lib/server/db/schema.js';
import type { RequestHandler } from './$types';
import { exists } from '#lib/server/path.js';
import { BAD_REQUEST, UNAUTHORIZED } from '#lib/constants/http.js';
import logger from '#lib/server/Logger.js';

const PATH_START = 0;
const TOP_MOST_DIR = 1;
const OMIT_CHILD_PATH = -1;

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return Response.json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

	const { path }: { path: string } = await request.json();

	// Minimal user input checks
	if (!path || !path.startsWith('~'))
		return Response.json({ error: 'Invalid path' }, { status: BAD_REQUEST });

	// Check if parent directory of path exists (unless it's a top-level dir under ~)
	const parts = path.split('/');
	const parent = parts.slice(PATH_START, OMIT_CHILD_PATH).join('/');
	if (parts.length > TOP_MOST_DIR) {
		if (parent !== '~' && !exists(parent))
			return Response.json({ error: 'Parent directory does not exist' }, { status: BAD_REQUEST });
	}

	// Create directory entry in Database
	await db.insert(directory).values({ path }).onConflictDoNothing();

	// Broadcast channel creation message
	messenger.sendAs(new Message(locals.user, `created a new subdirectory: ${path}`), parent);

	logger.info(`User '${locals.user.name}' created directory: ${path}`, { label: 'MKDIR' });

	return new Response();
};
