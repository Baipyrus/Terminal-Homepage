# Baipyrus' Terminal Homepage

My personal homepage providing a focused terminal-based user interface and interactive
experience.

## Overview

This project is a dedicated terminal homepage built with Svelte 5. It provides a
pure terminal environment powered by xterm.js and a custom barebones shell, integrated
into a modern web stack with authentication and authenticated messaging system.

## Technical Stack

- Web Framework: SvelteKit 5
- Scripting Language: TypeScript
- Simple Styling: Tailwind CSS v4
- Authentication: Better Auth (GitHub OAuth)
- Database: SQLite via Drizzle ORM
- Terminal: xterm.js via [BattlefieldDuck/xterm-svelte](https://github.com/BattlefieldDuck/xterm-svelte)
- Theme: Catppuccin Mocha color palette (matched from the [Alacritty theme](https://github.com/catppuccin/alacritty/blob/main/catppuccin-mocha.toml))
- Font: CaskaydiaCove Nerd Font

## Installation and Setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

   > [!NOTE]
   > Required Nerd Fonts are automatically downloaded to `static/fonts` after installation.

2. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   > [!NOTE]
   > All variables defined in `.env.example` are mandatory for the application to
   > function correctly.

## Development

### Running the App

- Start the local development server.

  ```bash
  npm run dev
  ```

  - **Interactive Step**: If `local.db` is not found, you will be prompted to
    initialize the database via `db:push`.

### Development Process

These commands are required to ensure code quality before committing changes:

- `npm run check`: Run Svelte and TypeScript diagnostic checks.
- `npm run lint`: Verify code style and linting rules.
- `npm run format`: Automatically format the codebase.

## Production

To deploy or run the application in a production-ready state:

1. Build the application:

   ```bash
   npm run build
   ```

   - **Interactive Step #1**: If `local.db` is not found, you will be prompted to
     initialize the database before building.
   - **Interactive Step #2**: After a successful build, you will be prompted to run
     the production server immediately.

2. Start the production server:

   ```bash
   npm run prod
   ```

> [!NOTE]
> The `npm run preview` command is not intended to support GitHub authentication,
> as the application logic specifically targets environment variables for either
> development or production modes.
