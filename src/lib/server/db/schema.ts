import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const directory = sqliteTable('directory', {
	path: text('path').primaryKey()
});

export * from './auth.schema';
