import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const DEFAULT_TASK_PRIORITY = 1;

export const task = sqliteTable('task', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(DEFAULT_TASK_PRIORITY)
});

export const directory = sqliteTable('directory', {
	path: text('path').primaryKey()
});

export * from './auth.schema';
