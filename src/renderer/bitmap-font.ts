import { parseDynamixBitmap, parseDynamixPalette } from '../archive/parser';

export class BitmapFontRenderer {
  private numberCanvases: HTMLCanvasElement[] = [];
  private fontSmCanvases: HTMLCanvasElement[] = [];
  private loaded = false;

  public async preloadFontAssets(): Promise<void> {
    try {
      const [palRes, numRes, fontRes] = await Promise.all([
        fetch('/assets/SCORE.PAL'),
        fetch('/assets/NUMBERS.BMP'),
        fetch('/assets/FONTSM.BMP'),
      ]);

      if (!palRes.ok || !numRes.ok) return;

      const [palBuf, numBuf] = await Promise.all([
        palRes.arrayBuffer(),
        numRes.arrayBuffer(),
      ]);

      const palette = parseDynamixPalette(palBuf);
      const numBmp = parseDynamixBitmap(numBuf);

      this.numberCanvases = numBmp.frames.map((frame) => {
        const c = document.createElement('canvas');
        c.width = frame.width;
        c.height = frame.height;
        const ctx = c.getContext('2d');
        if (ctx) {
          const imgData = ctx.createImageData(frame.width, frame.height);
          const data32 = new Uint32Array(imgData.data.buffer);
          const pix = frame.pixels;
          for (let i = 0; i < pix.length; i++) {
            const idx = pix[i];
            data32[i] = idx === 0 ? 0x00000000 : palette.rgba32[idx];
          }
          ctx.putImageData(imgData, 0, 0);
        }
        return c;
      });

      if (fontRes && fontRes.ok) {
        const fontBuf = await fontRes.arrayBuffer();
        const fontBmp = parseDynamixBitmap(fontBuf);
        this.fontSmCanvases = fontBmp.frames.map((frame) => {
          const c = document.createElement('canvas');
          c.width = frame.width;
          c.height = frame.height;
          const ctx = c.getContext('2d');
          if (ctx) {
            const imgData = ctx.createImageData(frame.width, frame.height);
            const data32 = new Uint32Array(imgData.data.buffer);
            const pix = frame.pixels;
            for (let i = 0; i < pix.length; i++) {
              const idx = pix[i];
              data32[i] = idx === 0 ? 0x00000000 : palette.rgba32[idx];
            }
            ctx.putImageData(imgData, 0, 0);
          }
          return c;
        });
      }

      this.loaded = true;
    } catch {
      // Fallback
    }
  }

  public isLoaded(): boolean {
    return this.loaded && this.numberCanvases.length > 0;
  }

  /**
   * Draws a formatted score string using authentic Sierra 16x24 LED digits
   */
  public drawScore(ctx: CanvasRenderingContext2D, scoreStr: string, x: number, y: number): boolean {
    if (!this.isLoaded()) return false;

    let cursorX = x;
    for (let i = 0; i < scoreStr.length; i++) {
      const ch = scoreStr[i];
      if (ch >= '0' && ch <= '9') {
        const digit = parseInt(ch, 10);
        const glyphCanvas = this.numberCanvases[digit];
        if (glyphCanvas) {
          ctx.drawImage(glyphCanvas, cursorX, y, 14, 20);
          cursorX += 13;
        }
      } else if (ch === ',' || ch === '.') {
        // Draw comma dot
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(cursorX + 1, y + 16, 3, 3);
        cursorX += 6;
      } else {
        cursorX += 8;
      }
    }
    return true;
  }
}
