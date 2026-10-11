import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', idatData);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Icon drawing function: Sci-Fi Rocket with glowing booster and crosshair
function rocketDrawer(isMaskable) {
  return (x, y, w, h) => {
    // Normalize coordinates -1 to 1
    const scale = isMaskable ? 0.7 : 0.85;
    const nx = ((x / w) * 2 - 1) / scale;
    const ny = ((y / h) * 2 - 1) / scale;
    const distCenter = Math.sqrt(nx * nx + ny * ny);

    // Background gradient: dark navy to deep space slate
    const bgFactor = Math.min(1, Math.max(0, (ny + 1) / 2));
    let r = Math.round(15 + bgFactor * 10);
    let g = Math.round(23 + bgFactor * 25);
    let b = Math.round(42 + bgFactor * 60);
    let a = 255;

    // Glowing circle in background
    if (distCenter < 0.9) {
      const glow = Math.max(0, 1 - distCenter / 0.9);
      r = Math.min(255, Math.round(r + glow * 50));
      g = Math.min(255, Math.round(g + glow * 100));
      b = Math.min(255, Math.round(b + glow * 220));
    }

    // Rocket body: stylized cone/capsule
    // Pointing upwards towards ny = -0.7
    const bodyY = ny + 0.1;
    const bodyX = Math.abs(nx);

    // Nose cone & fuselage
    if (bodyY >= -0.7 && bodyY <= 0.45) {
      const maxW = bodyY < 0 ? (bodyY + 0.7) * 0.45 : 0.315 - (bodyY - 0) * 0.05;
      if (bodyX <= maxW) {
        // Rocket body shading
        const shade = (nx + maxW) / (maxW * 2);
        // Orange / Cyan sci-fi mech armor
        r = Math.round(240 - shade * 60);
        g = Math.round(80 + shade * 60);
        b = Math.round(30 + shade * 40);

        // Cockpit canopy / visor
        if (bodyY >= -0.35 && bodyY <= -0.1 && bodyX <= maxW * 0.6) {
          r = 30;
          g = 220;
          b = 255;
        }

        // Metal panel line
        if (Math.abs(bodyY - 0.1) < 0.02 || Math.abs(bodyX - maxW) < 0.03) {
          r = Math.max(0, r - 80);
          g = Math.max(0, g - 40);
          b = Math.max(0, b - 20);
        }
      }
    }

    // Rocket fins
    if (bodyY >= 0.15 && bodyY <= 0.55) {
      const finX = bodyX - 0.28;
      const finY = bodyY - 0.15;
      if (finX >= 0 && finX <= 0.35 && finX <= finY * 0.9) {
        r = 220;
        g = 40;
        b = 60;
      }
    }

    // Rocket engine flame / thruster exhaust
    if (bodyY > 0.45 && bodyY < 0.85) {
      const flameW = 0.25 * (1 - (bodyY - 0.45) / 0.4);
      if (bodyX < flameW) {
        const coreDist = bodyX / (flameW || 0.001);
        if (coreDist < 0.4) {
          // Yellow-white core
          r = 255;
          g = 255;
          b = 200;
        } else {
          // Orange fiery edges
          r = 255;
          g = 130;
          b = 20;
        }
      }
    }

    // Crosshair rings / sci-fi HUD accents
    const crosshairDist = Math.abs(distCenter - 0.75);
    if (crosshairDist < 0.025 && ((Math.abs(nx) < 0.15) || (Math.abs(ny) < 0.15) || (distCenter > 0.73 && distCenter < 0.77))) {
      // Semi-transparent cyan radar lines
      r = Math.min(255, r + 100);
      g = Math.min(255, g + 200);
      b = Math.min(255, b + 255);
    }

    return [r, g, b, a];
  };
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PNGs
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, rocketDrawer(false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, rocketDrawer(false)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, rocketDrawer(false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, rocketDrawer(true)));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64, rocketDrawer(false)));

// Also create clean SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffedd5" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#c2410c" />
    </linearGradient>
    <linearGradient id="cockpit" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="flame" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="100" fill="url(#bg)" />

  <!-- Radar circle grid -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="8 6" />
  <circle cx="256" cy="256" r="110" fill="none" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.2" />
  <line x1="256" y1="40" x2="256" y2="472" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.2" />
  <line x1="40" y1="256" x2="472" y2="256" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.2" />

  <!-- Rocket exhaust fire -->
  <polygon points="216,360 256,470 296,360 256,390" fill="url(#flame)" filter="url(#glow)" />
  <polygon points="230,360 256,430 282,360" fill="#ffffff" />

  <!-- Wings/Fins -->
  <path d="M190 280 L130 370 L190 355 Z" fill="#ef4444" />
  <path d="M322 280 L382 370 L322 355 Z" fill="#b91c1c" />

  <!-- Rocket Fuselage -->
  <path d="M256 80 C210 160 190 260 190 360 L322 360 C322 260 302 160 256 80 Z" fill="url(#rocketBody)" />

  <!-- Center fin -->
  <polygon points="252,240 260,240 260,360 252,360" fill="#dc2626" />

  <!-- Cockpit glass -->
  <ellipse cx="256" cy="200" rx="26" ry="42" fill="url(#cockpit)" filter="url(#glow)" />
  <ellipse cx="250" cy="190" rx="10" ry="18" fill="#ffffff" opacity="0.6" />

  <!-- Decorative Target Crosshair -->
  <circle cx="256" cy="170" r="48" fill="none" stroke="#ef4444" stroke-width="3" opacity="0.8" />
  <line x1="256" y1="110" x2="256" y2="135" stroke="#ef4444" stroke-width="3" />
  <line x1="256" y1="205" x2="256" y2="230" stroke="#ef4444" stroke-width="3" />
  <line x1="196" y1="170" x2="221" y2="170" stroke="#ef4444" stroke-width="3" />
  <line x1="291" y1="170" x2="316" y2="170" stroke="#ef4444" stroke-width="3" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
console.log('Icons generated successfully!');
