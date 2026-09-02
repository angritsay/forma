// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

/**
 * SITE_URL  — canonical origin of the deployed site, e.g. https://forma.example.com
 *             or https://<user>.github.io/<repo>
 * BASE_PATH — path prefix when deployed to a project GitHub Pages site (e.g. "/forma/").
 *             Defaults to "/" (custom domain or local build).
 */
const SITE_URL = (process.env.SITE_URL || 'http://localhost:4321').replace(/\/$/, '');
const BASE_PATH = normalizeBase(process.env.BASE_PATH || '/');

/** @param {string} b */
function normalizeBase(b) {
  let base = b.trim();
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
    assets: '_assets',
  },
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
