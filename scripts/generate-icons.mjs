// Genererer simple PWA-ikoner (solid baggrund + sol + hav-bølge) som rigtige
// PNG-filer uden eksterne billed-biblioteker. Køres én gang; resultatet
// committes til public/icons.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const BG = [58, 99, 81]; // #3A6351
const SUN = [244, 226, 198]; // varm lys cirkel
const WAVE = [47, 93, 138]; // #2F5D8A, hav-antydning

function crc32(buf) {
  let c;
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function buildPng(size, pixelFn) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y, size);
      const px = rowStart + 1 + x * 4;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
      raw[px + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function iconPixel(x, y, size) {
  const cx = size * 0.5;
  const cy = size * 0.4;
  const r = size * 0.2;
  const dx = x - cx;
  const dy = y - cy;

  // Rund "sol" i midten-øverst.
  if (dx * dx + dy * dy <= r * r) {
    return [...SUN, 255];
  }

  // Bølget "hav" i bunden af ikonet.
  const waveY = size * 0.72 + Math.sin((x / size) * Math.PI * 2) * size * 0.02;
  if (y > waveY) {
    return [...WAVE, 255];
  }

  return [...BG, 255];
}

function maskedRoundedPixel(x, y, size) {
  // Afrundede hjørner ved at gøre hjørne-pixels transparente.
  const radius = size * 0.18;
  const corners = [
    [radius, radius],
    [size - radius, radius],
    [radius, size - radius],
    [size - radius, size - radius],
  ];
  for (const [cx, cy] of corners) {
    const inCornerBox =
      (cx === radius && x < radius && ((cy === radius && y < radius) || (cy === size - radius && y > size - radius))) ||
      (cx === size - radius && x > size - radius && ((cy === radius && y < radius) || (cy === size - radius && y > size - radius)));
    if (inCornerBox) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy > radius * radius) {
        return [0, 0, 0, 0];
      }
    }
  }
  return iconPixel(x, y, size);
}

const targets = [
  { name: 'icon-192.png', size: 192, rounded: false },
  { name: 'icon-512.png', size: 512, rounded: false },
  { name: 'apple-touch-icon.png', size: 180, rounded: true },
];

for (const target of targets) {
  const png = buildPng(target.size, target.rounded ? maskedRoundedPixel : iconPixel);
  writeFileSync(join(outDir, target.name), png);
  console.log(`Skrev ${target.name} (${target.size}x${target.size})`);
}
