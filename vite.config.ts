import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// NOTE: Better Auth ~v1.7.12 together with SvelteKit ~v3.X.X is currently broken.
// During login, auth refuses to resolve its API endpoints without setting the
// SvelteKit app origin to the production base URL for the server. This setting
// is marked down below, but it requires configuration during build time.
// This means that the value cannot be changed anymore at or before runtime.
//
// const isDev = process.env['NODE_ENV'] === 'development';
// const originURL = isDev ? process.env['ORIGIN_DEV'] : process.env['ORIGIN'];

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// NOTE: See as described above.
			// paths: { origin: originURL },
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
