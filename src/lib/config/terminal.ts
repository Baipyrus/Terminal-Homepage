import type { ITheme } from '@xterm/xterm';

export const CATPPUCCIN_MOCHA: ITheme = {
    // Primary colors
    background: '#1e1e2e',
    foreground: '#cdd6f4',

    // Cursor colors
    cursor: '#f5e0dc',
    cursorAccent: '#1e1e2e', // Usually matches background

    // Selection colors
    selectionBackground: '#f5e0dc',
    selectionForeground: '#1e1e2e',

    // Normal ANSI colors
    black: '#45475a',   // Surface 1
    red: '#f38ba8',     // Red
    green: '#a6e3a1',   // Green
    yellow: '#f9e2af',  // Yellow
    blue: '#89b4fa',    // Blue
    magenta: '#cba6f7', // Pink (or Magenta)
    cyan: '#94e2d5',    // Teal (or Cyan)
    white: '#bac2de',   // Subtext 1

    // Bright ANSI colors
    brightBlack: '#585b70',   // Surface 2
    brightRed: '#f38ba8',
    brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af',
    brightBlue: '#89b4fa',
    brightMagenta: '#cba6f7',
    brightCyan: '#94e2d5',
    brightWhite: '#a6adc8',   // Subtext 0
};
