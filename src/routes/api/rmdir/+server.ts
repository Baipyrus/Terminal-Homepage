import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messenger } from '$lib/server/Messenger';
import { directory } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';
import { exists } from '$lib/server/path';
import { BAD_REQUEST, UNAUTHORIZED, NOT_FOUND, FORBIDDEN } from '$lib/constants/http';
import logger from '$lib/server/logger';
import { eq, like } from 'drizzle-orm';

const ANY = 1;
const EMPTY = 0;
const PATH_START = 0;
const OMIT_CHILD_PATH = -1;

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: UNAUTHORIZED });

	const { path }: { path: string } = await request.json();

	// Minimal user input checks
	if (!path || !path.startsWith('~'))
		return json({ error: 'Invalid path' }, { status: BAD_REQUEST });

	if (path === '~') return json({ error: 'Cannot remove root directory' }, { status: BAD_REQUEST });

	// Check if directory exists
	if (!exists(path)) return json({ error: 'Directory does not exist' }, { status: NOT_FOUND });

	// Check if directory is empty of subdirectories
	const subdirs = await db
		.select()
		.from(directory)
		.where(like(directory.path, `${path}/%`))
		.limit(ANY);

	if (subdirs.length > EMPTY)
		return json({ error: 'Directory may contain subdirectories' }, { status: FORBIDDEN });

	// Check if any users are connected to it
	if (messenger.count(path) > EMPTY)
		return json({ error: 'Users may not be connected to directory' }, { status: FORBIDDEN });

	// Delete directory entry from Database
	await db.delete(directory).where(eq(directory.path, path));

	// Broadcast channel deletion message to parent
	const parent = path.split('/').slice(PATH_START, OMIT_CHILD_PATH).join('/');
	messenger.send(parent, {
		user: locals.user.name,
		content: `removed subdirectory: ${path}`
	});

	logger.info(`User '${locals.user.name}' removed directory: ${path}`, { label: 'RMDIR' });

	return new Response();
};
