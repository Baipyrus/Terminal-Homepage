import { existsSync, unlinkSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const LOGS_DIR = 'logs';
const LOG_FILES = ['info.log', 'error.log', 'debug.log'];

const MAX_ROTATED_LOGS = 3;
const OLDEST_LOG_INDEX = -1;
const SECOND_OLDEST_IDX = -2;
const NEWEST_NON_CURRENT = 1;
const INCREMENT_INDEX = 1;

/** @type {(file: string, idx: number) => string} */
const withIndex = (file, idx) => file.replace('.log', `.${idx}.log`);

function rotateLogs() {
	// If directory does not exist, create it, but nothing to do.
	if (!existsSync(LOGS_DIR)) {
		mkdirSync(LOGS_DIR, { recursive: true });
		return;
	}

	for (const fileName of LOG_FILES) {
		const filePath = join(LOGS_DIR, fileName);

		// Delete oldest log (e.g., info.2.log)
		const oldestLog = join(LOGS_DIR, withIndex(fileName, MAX_ROTATED_LOGS + OLDEST_LOG_INDEX));
		if (existsSync(oldestLog)) unlinkSync(oldestLog);

		// Shift existing rotated logs (e.g., .1.log -> .2.log, .log -> .1.log)
		for (let i = MAX_ROTATED_LOGS + SECOND_OLDEST_IDX; i >= NEWEST_NON_CURRENT; i--) {
			const current = join(LOGS_DIR, withIndex(fileName, i));
			const next = join(LOGS_DIR, withIndex(fileName, i + INCREMENT_INDEX));
			if (existsSync(current)) renameSync(current, next);
		}

		// Move last active log to .1.log
		const firstRotated = join(LOGS_DIR, withIndex(fileName, NEWEST_NON_CURRENT));
		if (existsSync(filePath)) renameSync(filePath, firstRotated);
	}
}

rotateLogs();
