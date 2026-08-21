/* ==========================================================================
   Brand asset generator — no external dependencies (Node zlib only).

   Emits every raster/vector instance of the brand mark from ONE source of
   truth, src/brand/geometry.json, which the in-app <BrandMark> component reads
   too. Outputs:

     public/icon-192.png            "any" purpose — rounded teal tile
     public/icon-512.png            "any" purpose — rounded teal tile
     public/icon-maskable-512.png   "maskable" — full bleed, glyph inside the
                                    80% safe circle so a launcher can apply any
                                    mask (circle, squircle, teardrop) without
                                    clipping the B or exposing transparency
     public/apple-touch-icon.png    180px, opaque (iOS applies its own mask)
     public/favicon.svg             the same geometry as a vector

   Run: node scripts/gen-icons.mjs
   ========================================================================== */
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'public')
mkdirSync(outDir, { recursive: true })

const geometry = JSON.parse(readFileSync(join(root, 'src', 'brand', 'geometry.json'), 'utf-8'))

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const TEAL = hexToRgb(geometry.teal)
const INK = hexToRgb(geometry.ink)

/* -- Glyph geometry, derived exactly as src/brand/mark.ts derives it. ------ */
const { left: STEM_L, right: STEM_R, top: TOP, bottom: BOT } = geometry.stem
const MID = (TOP + BOT) / 2
const UPPER = { cy: (TOP + MID) / 2 }
const LOWER = { cy: (MID + BOT) / 2 }
UPPER.outer = MID - UPPER.cy
UPPER.inner = UPPER.outer - geometry.upperBowlThickness
LOWER.outer = BOT - LOWER.cy
LOWER.inner = LOWER.outer - geometry.lowerBowlThickness

/** Normalized-space membership test for the "B" (mirrors isInsideBrandGlyph). */
function isB(px, py) {
  if (px >= STEM_L && px <= STEM_R && py >= TOP && py <= BOT) return true
  if (px < STEM_R) return false
  const dx = px - STEM_R
  const bowl = (b) => {
    const dy = py - b.cy
    const d = Math.sqrt(dx * dx + dy * dy)
    return d <= b.outer && d >= b.inner
  }
  if (py <= MID && bowl(UPPER)) return true
  if (py >= MID && bowl(LOWER)) return true
  return false
}

/* -- PNG plumbing ---------------------------------------------------------- */
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

/** Inside a rounded square of the given corner radius (pixel space). */
function roundedInside(x, y, size, r) {
  const nx = Math.min(x, size - 1 - x)
  const ny = Math.min(y, size - 1 - y)
  if (nx >= r || ny >= r) return true
  const dx = r - nx
  const dy = r - ny
  return dx * dx + dy * dy <= r * r
}

/**
 * @param size    edge length in pixels
 * @param opts.shape  'rounded' (transparent corners) | 'bleed' (opaque square)
 * @param opts.scale  glyph scale about the centre
 */
function makePng(size, { shape = 'rounded', scale = 1 } = {}) {
  const radius = Math.round(size * geometry.tileRadiusRatio)
  const raw = Buffer.alloc((size * 4 + 1) * size)
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const inside = shape === 'bleed' || roundedInside(x, y, size, radius)
      // Sample the glyph in normalized space, un-scaled about the centre.
      const px = 0.5 + (x / size - 0.5) / scale
      const py = 0.5 + (y / size - 0.5) / scale
      const col = inside ? (isB(px, py) ? INK : TEAL) : [0, 0, 0]
      raw[p++] = col[0]
      raw[p++] = col[1]
      raw[p++] = col[2]
      raw[p++] = inside ? 255 : 0
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

/* -- SVG ------------------------------------------------------------------- */
const round = (n) => Math.round(n * 10000) / 10000

function glyphPath(size) {
  const X = (v) => round(v * size)
  const stem = `M${X(STEM_L)} ${X(TOP)}H${X(STEM_R)}V${X(BOT)}H${X(STEM_L)}Z`
  const bowl = (b) =>
    `M${X(STEM_R)} ${X(b.cy - b.outer)}` +
    `A${X(b.outer)} ${X(b.outer)} 0 0 1 ${X(STEM_R)} ${X(b.cy + b.outer)}` +
    `L${X(STEM_R)} ${X(b.cy + b.inner)}` +
    `A${X(b.inner)} ${X(b.inner)} 0 0 0 ${X(STEM_R)} ${X(b.cy - b.inner)}Z`
  return `${stem}${bowl(UPPER)}${bowl(LOWER)}`
}

function makeSvg() {
  const s = geometry.canvas
  const r = round(s * geometry.tileRadiusRatio)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" role="img" aria-label="Binyamin English">
  <rect width="${s}" height="${s}" rx="${r}" fill="${geometry.teal}"/>
  <path d="${glyphPath(s)}" fill="${geometry.ink}"/>
</svg>
`
}

/* -- Emit ------------------------------------------------------------------ */
// The glyph already sits inside the maskable safe circle at full size (its
// furthest point is 0.312 from the centre, well inside the 0.40 safe radius),
// so the maskable icon is the SAME mark at the SAME size — only the corners
// change, from transparent to opaque teal. That is deliberate: the installed
// Android icon must look exactly as it does today, while a launcher applying a
// circle, squircle or teardrop mask can no longer clip into transparency.
const MASKABLE_GLYPH_SCALE = 1

const outputs = [
  ['icon-192.png', makePng(192)],
  ['icon-512.png', makePng(512)],
  ['icon-maskable-512.png', makePng(512, { shape: 'bleed', scale: MASKABLE_GLYPH_SCALE })],
  ['apple-touch-icon.png', makePng(180, { shape: 'bleed' })],
  ['favicon.svg', makeSvg()],
]

for (const [name, data] of outputs) {
  writeFileSync(join(outDir, name), data)
  console.log(`wrote ${name}`)
}
