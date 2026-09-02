/**
 * Visual preview harness — rasterizes frames of pose sets to PNG so authors can look at them.
 * Skipped unless ANIM_PREVIEW is set:
 *
 *   ANIM_PREVIEW=air_squat,burpee npx vitest run src/components/anim/preview.test.ts
 *   ANIM_PREVIEW=all npx vitest run src/components/anim/preview.test.ts
 *
 * Output: /tmp/anim-preview/<id>-<t>.png for t = 0, 0.25, 0.5, 0.75 plus <id>-sheet.png with
 * eight frames in a row (t = 0 … 0.875). Override the folder with ANIM_PREVIEW_OUT and the frame
 * size (px) with ANIM_PREVIEW_SIZE.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hasAnimation } from './lookup';
import { ANIMATION_IDS } from './poses/index';
import { figureSvgString } from './render';

const raw = (process.env.ANIM_PREVIEW ?? '').trim();
const requested = raw
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const ids = requested.includes('all') ? [...ANIMATION_IDS] : requested;
const outDir = process.env.ANIM_PREVIEW_OUT || '/tmp/anim-preview';
const size = Number(process.env.ANIM_PREVIEW_SIZE) || 400;

const FRAMES = [0, 0.25, 0.5, 0.75];
const SHEET_FRAMES = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];

describe.skipIf(ids.length === 0)('anim preview', () => {
  it(`renders ${ids.join(', ')} to ${outDir}`, async () => {
    const { Resvg } = await import('@resvg/resvg-js');
    mkdirSync(outDir, { recursive: true });
    const unknown = ids.filter((id) => !hasAnimation(id));
    expect(unknown, `unknown animation ids: ${unknown.join(', ')}`).toEqual([]);

    const written: string[] = [];
    for (const id of ids) {
      for (const t of FRAMES) {
        const svg = figureSvgString(id, t, { size });
        const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
        const file = join(outDir, `${id}-${t}.png`);
        writeFileSync(file, png);
        written.push(file);
      }
      const cell = 200;
      const gap = 8;
      const sheetWidth = SHEET_FRAMES.length * (cell + gap) + gap;
      const inner = SHEET_FRAMES.map((t, i) => {
        const frame = figureSvgString(id, t, { size: cell });
        const x = gap + i * (cell + gap);
        return frame.replace('<svg ', `<svg x="${x}" y="${gap}" `);
      }).join('');
      const sheet =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetWidth}" height="${cell + gap * 2}" viewBox="0 0 ${sheetWidth} ${cell + gap * 2}">` +
        `<rect width="${sheetWidth}" height="${cell + gap * 2}" fill="#0B0B0D"/>${inner}</svg>`;
      const sheetPng = new Resvg(sheet, { fitTo: { mode: 'width', value: sheetWidth * 2 } })
        .render()
        .asPng();
      const sheetFile = join(outDir, `${id}-sheet.png`);
      writeFileSync(sheetFile, sheetPng);
      written.push(sheetFile);
    }
    console.info(`[anim preview] wrote:\n${written.map((f) => `  ${f}`).join('\n')}`);
    expect(written.length).toBe(ids.length * (FRAMES.length + 1));
  });
});
