import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			'no-duplicate-imports': ['error', { includeExports: true }],
			'no-template-curly-in-string': 'warn',
			'no-unmodified-loop-condition': 'warn',
			'no-useless-assignment': 'warn',
			'require-atomic-updates': 'error',
			camelcase: 'error',
			'default-case': 'error',
			'default-case-last': 'warn',
			eqeqeq: ['error', 'smart'],
			'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
			'prefer-object-has-own': 'warn',
			'guard-for-in': 'warn',
			'init-declarations': 'warn',
			'max-classes-per-file': 'error',
			'max-depth': 'error',
			'no-empty-function': ['error', { allow: ['constructors'] }],
			'no-implicit-coercion': 'warn',
			'no-inline-comments': 'warn',
			'no-magic-numbers': [
				'error',
				{
					ignoreArrayIndexes: true,
					ignoreDefaultValues: true,
					ignoreClassFieldInitialValues: true,
					enforceConst: true
				}
			],
			'no-multi-assign': 'warn',
			'no-multi-str': 'warn',
			'no-negated-condition': 'error',
			'no-nested-ternary': 'error',
			'no-new-func': 'error',
			'no-new-wrappers': 'warn',
			'no-proto': 'error',
			'no-regex-spaces': 'warn',
			'no-return-assign': 'warn',
			'no-sequences': 'warn',
			'no-throw-literal': 'error',
			'no-unneeded-ternary': 'error',
			'no-useless-computed-key': 'error',
			'no-useless-concat': 'warn',
			'no-useless-return': 'warn',
			'no-var': 'error',
			'prefer-const': 'error',
			'prefer-numeric-literals': 'warn',
			'prefer-promise-reject-errors': 'warn',
			'prefer-template': 'warn',
			radix: 'warn',
			'require-await': 'warn',
			yoda: 'error'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		files: ['**/*.{spec,test}.{ts,js}'],
		rules: {
			'no-magic-numbers': 'off'
		}
	}
);
