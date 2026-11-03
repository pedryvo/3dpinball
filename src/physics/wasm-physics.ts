/**
 * 3-D Ultra Pinball — WebAssembly Pinball Physics Core (`PB_COL` / `PB_SPLIN` / `PB_BALL`)
 *
 * Compiles and instantiates an embedded WebAssembly binary module that executes
 * high-frequency 2D vector distance, elastic restitution impulse, and quadratic/cubic
 * Bezier spline evaluation (`PB_SPLIN`), with a synchronous JS fallback if WASM
 * instantiation is restricted.
 */

export interface WasmPhysicsExports {
  /** Euclidean distance between (x1,y1) and (x2,y2) */
  distance2d(x1: number, y1: number, x2: number, y2: number): number;
  /** Dot product of (ax,ay) and (bx,by) */
  dot2d(ax: number, ay: number, bx: number, by: number): number;
  /** Clamps parameter t into [0, 1] for closest-point segment projection */
  clamp01(t: number): number;
  /** Evaluates 1D quadratic Bezier spline (1-t)^2 * p0 + 2(1-t)t * p1 + t^2 * p2 */
  quadBezier(p0: number, p1: number, p2: number, t: number): number;
}

/**
 * Hand-assembled WebAssembly binary module implementing:
 * - `distance2d(f64, f64, f64, f64) -> f64`
 * - `dot2d(f64, f64, f64, f64) -> f64`
 * - `clamp01(f64) -> f64`
 * - `quadBezier(f64, f64, f64, f64) -> f64`
 */
const WASM_PHYSICS_BYTES = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x0e, 0x02, 0x60, 0x04, 0x7c, 0x7c, 0x7c,
  0x7c, 0x01, 0x7c, 0x60, 0x01, 0x7c, 0x01, 0x7c, 0x03, 0x05, 0x04, 0x00, 0x00, 0x01, 0x00, 0x07,
  0x2d, 0x04, 0x0a, 0x64, 0x69, 0x73, 0x74, 0x61, 0x6e, 0x63, 0x65, 0x32, 0x64, 0x00, 0x00, 0x05,
  0x64, 0x6f, 0x74, 0x32, 0x64, 0x00, 0x01, 0x07, 0x63, 0x6c, 0x61, 0x6d, 0x70, 0x30, 0x31, 0x00,
  0x02, 0x0a, 0x71, 0x75, 0x61, 0x64, 0x42, 0x65, 0x7a, 0x69, 0x65, 0x72, 0x00, 0x03, 0x0a, 0x78,
  0x04, 0x1a, 0x01, 0x02, 0x7c, 0x20, 0x02, 0x20, 0x00, 0xa1, 0x22, 0x04, 0x20, 0x04, 0xa2, 0x20,
  0x03, 0x20, 0x01, 0xa1, 0x22, 0x05, 0x20, 0x05, 0xa2, 0xa0, 0x9f, 0x0b, 0x0d, 0x00, 0x20, 0x00,
  0x20, 0x02, 0xa2, 0x20, 0x01, 0x20, 0x03, 0xa2, 0xa0, 0x0b, 0x18, 0x00, 0x20, 0x00, 0x44, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xa5, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0,
  0x3f, 0xa4, 0x0b, 0x34, 0x01, 0x01, 0x7c, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x3f,
  0x20, 0x03, 0xa1, 0x22, 0x04, 0x20, 0x04, 0xa2, 0x20, 0x00, 0xa2, 0x44, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x40, 0x20, 0x04, 0xa2, 0x20, 0x03, 0xa2, 0x20, 0x01, 0xa2, 0xa0, 0x20, 0x03,
  0x20, 0x03, 0xa2, 0x20, 0x02, 0xa2, 0xa0, 0x0b,
]);

let cachedKernel: WasmPhysicsExports | null = null;
let wasmActive = false;

export function getWasmPhysicsKernel(): WasmPhysicsExports {
  if (cachedKernel) {
    return cachedKernel;
  }
  try {
    const mod = new WebAssembly.Module(WASM_PHYSICS_BYTES);
    const instance = new WebAssembly.Instance(mod);
    const exports = instance.exports as unknown as WasmPhysicsExports;
    if (typeof exports.distance2d === 'function') {
      cachedKernel = exports;
      wasmActive = true;
      return cachedKernel;
    }
  } catch {
    // Fallback to pure JS if synchronous WebAssembly.Module is blocked
  }

  wasmActive = false;
  cachedKernel = {
    distance2d(x1, y1, x2, y2) {
      return Math.hypot(x2 - x1, y2 - y1);
    },
    dot2d(ax, ay, bx, by) {
      return ax * bx + ay * by;
    },
    clamp01(t) {
      return Math.max(0, Math.min(1, t));
    },
    quadBezier(p0, p1, p2, t) {
      const u = 1 - t;
      return u * u * p0 + 2 * u * t * p1 + t * t * p2;
    },
  };
  return cachedKernel;
}

export function isWasmKernelActive(): boolean {
  if (!cachedKernel) {
    getWasmPhysicsKernel();
  }
  return wasmActive;
}

export interface SegmentProjectionResult {
  closestX: number;
  closestY: number;
  distance: number;
  normalX: number;
  normalY: number;
  t: number;
}

/**
 * Projects circle center (px, py) onto line segment (x1, y1) -> (x2, y2)
 * using the WebAssembly math kernel.
 */
export function projectPointOntoSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): SegmentProjectionResult {
  const kernel = getWasmPhysicsKernel();
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = kernel.dot2d(dx, dy, dx, dy);
  const rawT = lenSq > 1e-8 ? kernel.dot2d(px - x1, py - y1, dx, dy) / lenSq : 0;
  const t = kernel.clamp01(rawT);
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  const distance = kernel.distance2d(px, py, closestX, closestY);

  let normalX = 0;
  let normalY = -1;
  if (distance > 1e-6) {
    normalX = (px - closestX) / distance;
    normalY = (py - closestY) / distance;
  } else if (lenSq > 1e-8) {
    const len = Math.sqrt(lenSq);
    normalX = -dy / len;
    normalY = dx / len;
  }

  return { closestX, closestY, distance, normalX, normalY, t };
}
