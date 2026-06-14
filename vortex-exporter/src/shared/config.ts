// Application configuration

import * as path from 'path';
import * as os from 'os';

export interface AppConfig {
  /** Figma API base URL */
  figmaApiBaseUrl: string;
  /** Figma API version */
  figmaApiVersion: string;
  /** Output directory for generated Lua files */
  outputDir: string;
  /** Assets directory for downloaded images/SVGs */
  assetsDir: string;
  /** Default theme colors (fallback if Figma doesn't provide) */
  defaultTheme: Record<string, { r: number; g: number; b: number; a: number }>;
  /** Version of the exporter */
  appVersion: string;
  /** Encryption key for token storage (derived) */
  tokenEncryptionSalt: string;
}

const APP_ROOT = path.resolve(__dirname, '..', '..');

export const config: AppConfig = {
  figmaApiBaseUrl: 'https://api.figma.com',
  figmaApiVersion: 'v1',
  outputDir: path.join(APP_ROOT, 'output'),
  assetsDir: path.join(APP_ROOT, 'assets', 'images'),
  defaultTheme: {
    primary: { r: 0, g: 170, b: 255, a: 255 },
    primaryHover: { r: 0, g: 136, b: 204, a: 255 },
    secondary: { r: 100, g: 100, b: 100, a: 255 },
    surface: { r: 20, g: 20, b: 20, a: 230 },
    success: { r: 0, g: 200, b: 100, a: 255 },
    danger: { r: 255, g: 60, b: 60, a: 255 },
    warning: { r: 255, g: 180, b: 0, a: 255 },
    text: { r: 255, g: 255, b: 255, a: 255 },
    textSecondary: { r: 180, g: 180, b: 180, a: 255 },
    background: { r: 0, g: 0, b: 0, a: 180 },
  },
  appVersion: '1.0.0',
  tokenEncryptionSalt: 'vortex-exporter-2026-salt',
};