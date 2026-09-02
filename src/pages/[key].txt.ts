/**
 * /<INDEXNOW_KEY>.txt — IndexNow key file. Emitted only when INDEXNOW_KEY is set at build time
 * (8–128 hex/alphanumeric chars); otherwise no route is generated.
 */
import type { APIRoute } from 'astro';

const KEY_RE = /^[A-Za-z0-9-]{8,128}$/;

export function getStaticPaths() {
  const key = (process.env.INDEXNOW_KEY ?? import.meta.env.INDEXNOW_KEY ?? '').trim();
  if (!KEY_RE.test(key)) return [];
  return [{ params: { key }, props: { key } }];
}

export const GET: APIRoute = ({ props }) => {
  const key = typeof props.key === 'string' ? props.key : '';
  return new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
