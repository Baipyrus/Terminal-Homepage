const TOP_MOST_DIR = 1;

export const normalize = (path: string, cwd?: string) => {
	// If current workdir not provided, assume home:
	// Note that this is not needed for absolute paths.
	if (!cwd) cwd = '~';

	// First, assume path is absolute
	let target = path;
	if (!path.startsWith('~')) target = `${cwd}/${path}`;

	// Split into directories and remove trailing slashes
	const parts = target.split('/').filter((p) => p !== '');

	// Normalize path by resolving "backtracking" (double-dot)
	const pathStack: string[] = [];
	for (const p of parts) {
		if (p === '..') {
			// Ignore an additional backtracking if already at the top
			if (pathStack.length > TOP_MOST_DIR) pathStack.pop();
			continue;
		}

		pathStack.push(p);
	}

	return pathStack;
};

export const dirsToPath = (dirs: string[]) => dirs.join('/');
export const pathToDirs = (path: string) => path.split('/');
