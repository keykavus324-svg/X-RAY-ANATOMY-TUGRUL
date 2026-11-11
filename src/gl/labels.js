/**
 * HUD labels: leader lines + pills, drawn on a 2D canvas above the WebGL stage.
 * Text stays crisp (device-pixel scaled) and labels never overlap each other.
 */
export class Labels {
  constructor(canvas, host) {
    this.canvas = canvas;
    this.host = host;
    this.ctx = canvas.getContext('2d');
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.placed = new Map();   // id -> {x, y, w, h}
    this.resize();
  }

  resize() {
    const rect = this.host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.dpr = dpr;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
  }

  clear() {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.placed.clear();
  }

  /**
   * @param {Array<{id:string,text:string,x:number,y:number,color:string,weight?:number}>} items
   */
  draw(items) {
    this.clear();
    if (!items.length) return;
    const ctx = this.ctx;
    const font = '600 11.5px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    ctx.font = font;
    ctx.textBaseline = 'middle';

    const pad = 7;
    const boxH = 20;
    // Spread the pills over the visible figure instead of keeping the topmost ones:
    // in full-body view the skull alone would otherwise eat every slot.
    const sorted = [...items].sort((a, b) => a.y - b.y);
    const max = 14;
    const take = sorted.length <= max
      ? sorted
      : Array.from({ length: max }, (_, i) => sorted[Math.round((i * (sorted.length - 1)) / (max - 1))]);

    for (const item of take) {
      const label = item.text;
      const tw = ctx.measureText(label).width;
      const w = tw + pad * 2;
      const h = boxH;

      // anchor pill near the structure, flipping to the other side near the right edge
      const flip = item.x > this.width - (w + 34);
      let px = flip ? item.x - 20 - w : item.x + 20;
      let py = item.y - h / 2;

      // keep inside the stage
      px = Math.max(8, Math.min(this.width - w - 8, px));
      py = Math.max(8, Math.min(this.height - h - 8, py));

      // push down until it no longer collides with an already placed pill
      let guard = 0;
      let collides = true;
      while (collides && guard < 40) {
        collides = false;
        for (const p of this.placed.values()) {
          if (px < p.x + p.w + 4 && px + w + 4 > p.x && py < p.y + p.h + 3 && py + h + 3 > p.y) {
            py += 12;
            collides = true;
          }
        }
        if (py + h > this.height - 8) { py = Math.max(8, this.height - h - 8); break; }
        guard++;
      }
      this.placed.set(item.id, { x: px, y: py, w, h });

      const anchorX = flip ? px + w + 8 : px - 8;
      const anchorY = py + h / 2;

      // leader line
      ctx.strokeStyle = 'rgba(127,209,255,0.42)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y);
      ctx.lineTo(anchorX, anchorY);
      ctx.lineTo(px + (flip ? w : 0), anchorY);
      ctx.stroke();

      // anchor dot
      ctx.beginPath();
      ctx.arc(item.x, item.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = item.color || 'rgba(190,240,255,0.95)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(item.x, item.y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(127,209,255,0.28)';
      ctx.stroke();

      // pill
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(px + r, py);
      ctx.arcTo(px + w, py, px + w, py + h, r);
      ctx.arcTo(px + w, py + h, px, py + h, r);
      ctx.arcTo(px, py + h, px, py, r);
      ctx.arcTo(px, py, px + w, py, r);
      ctx.closePath();
      ctx.fillStyle = 'rgba(5,9,15,0.74)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(127,209,255,0.22)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(226,242,255,0.95)';
      ctx.fillText(label, px + pad, anchorY + 0.5);
    }
  }
}
