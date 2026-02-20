import { db } from '$lib/server/db';
import { directory } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Check whether the exact path supplied exists as any of the directories in the database
export const exists = (path: string) =>
	db.select().from(directory).where(eq(directory.path, path)).get();
