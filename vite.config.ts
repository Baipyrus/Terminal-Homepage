import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// NOTE: Better Auth ~v1.7.12 together with SvelteKit ~v3.X.X is currently broken.
// This file's origin setting is requires configuration during build time.
// This means that the value cannot be changed anymore at or before runtime,
// which is bad for the public image we want to publish.
// So we insert a placeholder and inject the URL before runtime ourselves.
const isDev = process.env['NODE_ENV'] === 'development';
const originURL = isDev ? undefined : 'http://change_origin_url:5173';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// NOTE: See as described above.
			paths: { origin: originURL },
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
