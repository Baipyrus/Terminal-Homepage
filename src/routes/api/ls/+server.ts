import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { directory } from '$lib/server/db/schema';
import { eq, like, and, not } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { exists } from '$lib/server/path';
import { BAD_REQUEST } from '$lib/constants/http';

const OFFSET_INDEX = 1;

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const parent = url.searchParams.get('path') || '~';

	// Ensure the parent itself exists (if it's not root '~')
	if (parent !== '~' && !exists(parent))
		return json({ error: 'Parent directory does not exist' }, { status: BAD_REQUEST });

	// Find all directories that start with "parent/"
	const all = await db
		.select()
		.from(directory)
		.where(and(like(directory.path, `${parent}/%`), not(eq(directory.path, parent))));

	// Filter for direct children only
	const filtered = all.filter((d) => {
		const relative = d.path.slice(parent.length + OFFSET_INDEX);
		return !relative.includes('/');
	});

	return json(filtered.map((d) => d.path.split('/').pop()));
};
