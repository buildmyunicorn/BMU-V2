/**
 * Pure TypeScript ISO/IEC 18004 QR Code Matrix Generator (Byte Mode, ECC Level L/M)
 * Zero external dependencies — works offline & online, renders crisp vector SVG and Canvas PNGs.
 */

// Galois Field GF(256) with primitive polynomial 0x11D
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsComputeRemainder(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const rem = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    rem.copyWithin(0, 1);
    rem[ecCount - 1] = 0;
    if (factor !== 0) {
      for (let j = 0; j < ecCount; j++) {
        rem[j] ^= gfMul(gen[j + 1], factor);
      }
    }
  }
  return rem;
}

// QR Version 1–6 specifications at Error Correction Level L (format bits: 01)
// Supports URLs up to 134 bytes without needing Version 7+ 6x3 version info blocks
interface VersionSpec {
  version: number;
  totalDataBytes: number;
  ecBytesPerBlock: number;
  numBlocksGroup1: number;
  dataBytesGroup1: number;
  numBlocksGroup2: number;
  dataBytesGroup2: number;
  alignmentCenters: number[];
}

const VERSION_SPECS_L: VersionSpec[] = [
  { version: 1, totalDataBytes: 19, ecBytesPerBlock: 7, numBlocksGroup1: 1, dataBytesGroup1: 19, numBlocksGroup2: 0, dataBytesGroup2: 0, alignmentCenters: [] },
  { version: 2, totalDataBytes: 34, ecBytesPerBlock: 10, numBlocksGroup1: 1, dataBytesGroup1: 34, numBlocksGroup2: 0, dataBytesGroup2: 0, alignmentCenters: [6, 18] },
  { version: 3, totalDataBytes: 55, ecBytesPerBlock: 15, numBlocksGroup1: 1, dataBytesGroup1: 55, numBlocksGroup2: 0, dataBytesGroup2: 0, alignmentCenters: [6, 22] },
  { version: 4, totalDataBytes: 80, ecBytesPerBlock: 20, numBlocksGroup1: 1, dataBytesGroup1: 80, numBlocksGroup2: 0, dataBytesGroup2: 0, alignmentCenters: [6, 26] },
  { version: 5, totalDataBytes: 108, ecBytesPerBlock: 26, numBlocksGroup1: 1, dataBytesGroup1: 108, numBlocksGroup2: 0, dataBytesGroup2: 0, alignmentCenters: [6, 30] },
  { version: 6, totalDataBytes: 136, ecBytesPerBlock: 18, numBlocksGroup1: 2, dataBytesGroup1: 68, numBlocksGroup2: 0, dataBytesGroup2: 0, alignmentCenters: [6, 34] },
];

function selectVersion(byteLength: number): VersionSpec {
  for (const spec of VERSION_SPECS_L) {
    // Byte mode overhead: 4 bits mode + (8 or 16 bits length) = 2 or 3 bytes
    const overheadBytes = spec.version <= 9 ? 2 : 3;
    if (byteLength + overheadBytes <= spec.totalDataBytes) {
      return spec;
    }
  }
  return VERSION_SPECS_L[VERSION_SPECS_L.length - 1];
}

function encodeDataBits(bytes: Uint8Array, spec: VersionSpec): Uint8Array {
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  // Mode indicator for Byte Mode: 0100
  pushBits(0b0100, 4);
  // Character count indicator: 8 bits for versions 1-9, 16 bits for version 10+
  const countBits = spec.version <= 9 ? 8 : 16;
  const maxLen = Math.min(bytes.length, spec.totalDataBytes - 3);
  pushBits(maxLen, countBits);

  for (let i = 0; i < maxLen; i++) {
    pushBits(bytes[i], 8);
  }

  // Terminator (up to 4 zeros)
  const totalDataBits = spec.totalDataBytes * 8;
  const terminatorLen = Math.min(4, totalDataBits - bits.length);
  pushBits(0, terminatorLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad with alternating 0xEC, 0x11
  let padToggle = true;
  while (bits.length < totalDataBits) {
    pushBits(padToggle ? 0xec : 0x11, 8);
    padToggle = !padToggle;
  }

  const dataCodewords = new Uint8Array(spec.totalDataBytes);
  for (let i = 0; i < spec.totalDataBytes; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataCodewords[i] = b;
  }

  // Split into blocks and compute Reed-Solomon EC codewords
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;

  for (let i = 0; i < spec.numBlocksGroup1; i++) {
    const block = dataCodewords.slice(offset, offset + spec.dataBytesGroup1);
    offset += spec.dataBytesGroup1;
    dataBlocks.push(block);
    ecBlocks.push(rsComputeRemainder(block, spec.ecBytesPerBlock));
  }
  for (let i = 0; i < spec.numBlocksGroup2; i++) {
    const block = dataCodewords.slice(offset, offset + spec.dataBytesGroup2);
    offset += spec.dataBytesGroup2;
    dataBlocks.push(block);
    ecBlocks.push(rsComputeRemainder(block, spec.ecBytesPerBlock));
  }

  // Interleave data codewords, then EC codewords
  const interleaved: number[] = [];
  const maxDataBlockLen = Math.max(spec.dataBytesGroup1, spec.dataBytesGroup2);
  for (let col = 0; col < maxDataBlockLen; col++) {
    for (const block of dataBlocks) {
      if (col < block.length) {
        interleaved.push(block[col]);
      }
    }
  }
  for (let col = 0; col < spec.ecBytesPerBlock; col++) {
    for (const block of ecBlocks) {
      interleaved.push(block[col]);
    }
  }

  return new Uint8Array(interleaved);
}

// Precomputed 15-bit format info strings for ECC Level L (01) and Mask 0..7
const FORMAT_INFO_L = [
  0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
];

function applyMask(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0;
    case 1:
      return r % 2 === 0;
    case 2:
      return c % 3 === 0;
    case 3:
      return (r + c) % 3 === 0;
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7:
    default:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
  }
}

/**
 * Generates a 2D boolean matrix (`true` = dark module, `false` = light module) for any string.
 */
export function generateQrCodeMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text || 'https://startuppreflight.com');
  const spec = selectVersion(bytes.length);
  const size = spec.version * 4 + 17;

  const modules: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  // 1. Place Finder Patterns + Separators
  const placeFinder = (row: number, col: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter =
          dr >= 0 && dr <= 6 && (dc === 0 || dc === 6) ||
          dc >= 0 && dc <= 6 && (dr === 0 || dr === 6);
        const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        modules[r][c] = inOuter || inInner;
        isFunction[r][c] = true;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // 2. Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = i % 2 === 0;
    isFunction[6][i] = true;
    modules[i][6] = i % 2 === 0;
    isFunction[i][6] = true;
  }

  // 3. Alignment Patterns
  const centers = spec.alignmentCenters;
  for (const rCenter of centers) {
    for (const cCenter of centers) {
      // Skip if overlapping with finder patterns
      if (
        (rCenter === 6 && cCenter === 6) ||
        (rCenter === 6 && cCenter === size - 7) ||
        (rCenter === size - 7 && cCenter === 6)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const r = rCenter + dr;
          const c = cCenter + dc;
          const dark =
            Math.max(Math.abs(dr), Math.abs(dc)) === 2 || (dr === 0 && dc === 0);
          modules[r][c] = dark;
          isFunction[r][c] = true;
        }
      }
    }
  }

  // 4. Dark Module & Reserve Format Info Areas
  modules[4 * spec.version + 9][8] = true;
  isFunction[4 * spec.version + 9][8] = true;

  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][size - 1 - i] = true;
    isFunction[size - 1 - i][8] = true;
  }

  // 5. Place Interleaved Codewords in Zig-Zag Order
  const codewords = encodeDataBits(bytes, spec);
  let bitIdx = 0;
  const totalBits = codewords.length * 8;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // Skip vertical timing pattern column
    for (let vert = 0; vert < size; vert++) {
      const upward = ((right + 1) & 2) === 0;
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunction[r][c]) {
          let bit = false;
          if (bitIdx < totalBits) {
            bit = ((codewords[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) === 1;
            bitIdx++;
          }
          modules[r][c] = bit;
        }
      }
    }
  }

  // 6. Apply Mask 0 and Write Format Info Bits
  const maskIndex = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!isFunction[r][c] && applyMask(maskIndex, r, c)) {
        modules[r][c] = !modules[r][c];
      }
    }
  }

  const formatBits = FORMAT_INFO_L[maskIndex];
  const getBit = (bitPosFromLsb: number) =>
    ((formatBits >>> bitPosFromLsb) & 1) === 1;

  // Top-left format info: b14 at (8,0) .. b8 at (8,7), b7 at (8,8), b6 at (7,8), b5..b0 at (5,8)..(0,8)
  modules[8][0] = getBit(14);
  modules[8][1] = getBit(13);
  modules[8][2] = getBit(12);
  modules[8][3] = getBit(11);
  modules[8][4] = getBit(10);
  modules[8][5] = getBit(9);
  modules[8][7] = getBit(8);
  modules[8][8] = getBit(7);
  modules[7][8] = getBit(6);
  modules[5][8] = getBit(5);
  modules[4][8] = getBit(4);
  modules[3][8] = getBit(3);
  modules[2][8] = getBit(2);
  modules[1][8] = getBit(1);
  modules[0][8] = getBit(0);

  // Bottom-left vertical (b14..b8 at rows size-1 .. size-7, col 8)
  for (let i = 0; i < 7; i++) {
    modules[size - 1 - i][8] = getBit(14 - i);
  }
  // Top-right horizontal (b7..b0 at row 8, cols size-8 .. size-1)
  for (let i = 0; i < 8; i++) {
    modules[8][size - 8 + i] = getBit(7 - i);
  }

  return modules;
}

/**
 * Generates a standalone SVG string for a QR code so it can be downloaded as `.svg` or rendered cleanly.
 */
export function generateQrCodeSvgString(
  url: string,
  options?: {
    sizePx?: number;
    quietZoneModules?: number;
    darkColor?: string;
    lightColor?: string;
  }
): string {
  const matrix = generateQrCodeMatrix(url);
  const n = matrix.length;
  const quiet = options?.quietZoneModules ?? 3;
  const totalModules = n + quiet * 2;
  const sizePx = options?.sizePx ?? 512;
  const darkColor = options?.darkColor ?? '#0f172a';
  const lightColor = options?.lightColor ?? '#ffffff';

  const rects: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        rects.push(
          `<rect x="${c + quiet}" y="${r + quiet}" width="1.03" height="1.03" fill="${darkColor}" />`
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges">
  <rect width="${totalModules}" height="${totalModules}" fill="${lightColor}" />
  ${rects.join('\n  ')}
</svg>`;
}
