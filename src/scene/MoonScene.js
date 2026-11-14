// SI disclosure: written with the SI tool Claude Code and reviewed by the team. See SI_USAGE.md and si-manifest.json.
// The Moon base, drawn with Phaser. This scene only DRAWS: it reads `scene.view` (set by the
// controller every frame) and reports room taps through game.events ('room-tap', roomId).
// Everything here is placeholder art made from shapes. When the team's art lands, list the images
// in assets/art/manifest.json and they replace the shapes (see assets/art/README.md).

import { ROOM_IDS } from '../rules/config.js';
import { ROOMS } from '../rules/content.js';

const C = {
  skyTop: 0x04060f, skyBottom: 0x111a3a,
  groundDay: 0x9a9384, groundDayShade: 0x7d776a, groundNight: 0x3c4157, groundNightShade: 0x2d3146,
  hull: 0xeceae3, hullNight: 0xaeb3c6, outline: 0x252c4a,
  windowDay: 0x8ad4ff, windowNight: 0xffd77a, windowOff: 0x3a4262,
  panel: 0x2c63c9, panelLine: 0x8db3ff, dust: 0x8c7b5e,
  glass: 0xa6f0d6, plant: 0x55b847, regolith: 0x7c7564, regolithNight: 0x4a4b5c,
  earthDark: 0x15204a, earthLit: 0x4e9bff, earthCloud: 0xe8f3ff,
  sun: 0xfff4d6, sunGlow: 0xffbf3c,
  shield: 0x5edcf0, particle: 0xc58cff, spark: 0xf0dcff,
  alert: 0xff7b5c, label: '#f3f0e8',
};

// Earth as seen from the Moon, in units of its radius (x to the right, y down). Shapes stay inside the disc.
const EARTH = {
  northAmerica: [[-0.82, -0.3], [-0.7, -0.52], [-0.5, -0.66], [-0.3, -0.6], [-0.28, -0.42], [-0.42, -0.3], [-0.5, -0.12], [-0.66, -0.14]],
  southAmerica: [[-0.74, 0.02], [-0.52, -0.04], [-0.36, 0.14], [-0.38, 0.36], [-0.5, 0.6], [-0.58, 0.74], [-0.64, 0.5], [-0.7, 0.26]],
  europe: [[0.0, -0.5], [0.06, -0.68], [0.2, -0.78], [0.4, -0.74], [0.52, -0.58], [0.4, -0.46], [0.2, -0.44]],
  africa: [[-0.08, -0.32], [0.08, -0.38], [0.3, -0.38], [0.46, -0.2], [0.54, 0.0], [0.4, 0.1], [0.36, 0.36], [0.24, 0.6], [0.12, 0.58], [0.08, 0.28], [-0.1, 0.12], [-0.2, -0.1]],
  sahara: [[-0.04, -0.28], [0.1, -0.33], [0.28, -0.32], [0.4, -0.18], [0.3, -0.08], [0.08, -0.06], [-0.1, -0.12]],
  clouds: [[-0.3, -0.3, 0.62, 0.14], [-0.12, 0.34, 0.5, 0.12], [0.3, -0.56, 0.4, 0.1], [0.42, 0.26, 0.36, 0.1], [-0.52, 0.12, 0.3, 0.09]],
};

export function createMoonScene() {
  return class MoonScene extends Phaser.Scene {
    constructor() {
      super('moon');
      this.view = null;
      this.slot = { x: 0, y: 0, w: 1, h: 1 };
      this.art = { rooms: {}, background: null };
      this.parts = [];
      this.sparks = [];
      this.puffs = [];
      this.rnd = new Phaser.Math.RandomDataGenerator(['moonbase']);
      this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    }

    init(data) {
      this.art = data?.art || this.art;
      this.dpr = data?.dpr || 1;
    }

    preload() {
      for (const [id, file] of Object.entries(this.art.rooms || {})) if (file) this.load.image(`room-${id}`, `assets/art/${file}`);
      if (this.art.background) this.load.image('art-bg', `assets/art/${this.art.background}`);
    }

    create() {
      this.sky = this.add.graphics();
      this.starsG = this.add.graphics();
      this.sunG = this.add.graphics();
      this.earthG = this.add.graphics();
      this.groundG = this.add.graphics();
      this.baseG = this.add.graphics();
      this.imgLayer = this.add.container(0, 0);
      this.domeG = this.add.graphics();
      this.fxG = this.add.graphics();
      this.badgeLayer = this.add.container(0, 0);
      this.radLabel = this.add.text(0, 0, 'Radiation from the Sun', {}).setOrigin(0, 0).setVisible(false);
      this.solarLabel = this.add.text(0, 0, '', {}).setOrigin(0.5, 1).setVisible(false);
      this.labelLayer = this.add.container(0, 0);
      this.zones = {};
      // A tap counts only if it started and ended on the same spot, and not on an HTML control.
      // Phaser hears every press on the page, so without this a tap on a button above the base
      // (closing a sheet, "Clean panels") also tapped the room below it.
      const free = (el) => !el?.closest?.('button, a, input, .modal');
      const tappable = (z, event, id) => {
        z.on('pointerdown', (p) => { this.pressed = free(p.downElement) ? z : null; });
        z.on('pointerup', (p) => { if (this.pressed === z && free(p.upElement)) this.game.events.emit(event, id); this.pressed = null; });
      };
      this.input.on('pointerup', () => { this.pressed = null; }); // released somewhere else
      for (const id of ROOM_IDS) {
        const z = this.add.zone(0, 0, 10, 10).setOrigin(0).setInteractive({ useHandCursor: true });
        tappable(z, 'room-tap', id);
        this.zones[id] = z;
      }
      // Easter eggs: tapping Earth or the Sun gives a fun fact.
      this.skyZones = {};
      for (const id of ['earth', 'sun']) {
        const z = this.add.zone(0, 0, 10, 10).setOrigin(0.5).setInteractive({ useHandCursor: true });
        tappable(z, 'sky-tap', id);
        this.skyZones[id] = z;
      }
      this.stars = Array.from({ length: 140 }, () => ({
        x: this.rnd.frac(), y: this.rnd.frac(), r: 0.6 + this.rnd.frac() * 1.3, a: 0.35 + this.rnd.frac() * 0.65, p: this.rnd.frac() * 6.28,
      }));
      this.shieldAlpha = 0;
      this.last = {};
      this.scale.on('resize', () => this.layout());
      this.layout();
      this.game.events.emit('moon-ready', this);
    }

    /**
     * Stage rectangle in CSS pixels (the empty grid cell between the HUD parts). `base` is the part
     * the base may use (clear of Sam's bubble and the repair buttons). `tight`: the sky may sit behind
     * the bubble, so the base fills its part from top to bottom.
     */
    setSlot(rect, dpr, base = rect, tight = false) {
      this.dpr = dpr;
      const px = (r) => ({ x: r.x * dpr, y: r.y * dpr, w: Math.max(1, r.w * dpr), h: Math.max(1, r.h * dpr) });
      this.slot = px(rect);
      this.baseSlot = px(base);
      this.tight = tight;
      if (this.sky) this.layout();
    }

    /** Keep Earth and the Sun above the roofs, on every screen shape. */
    fitSky(unit) {
      const s = this.slot;
      const roofs = Math.min(...Object.values(this.boxes).map((b) => b.y)) - unit * 4;
      for (const p of [this.earth, this.sunPos]) {
        p.r = Math.max(10 * this.dpr, Math.min(p.r, (roofs - s.y) * 0.3));
        p.y = Math.max(s.y + p.r * 1.2, Math.min(p.y, roofs - p.r * 1.3));
      }
      for (const [id, p] of [['earth', this.earth], ['sun', this.sunPos]]) {
        const size = Math.max(p.r * 2.6, 48 * this.dpr);
        this.skyZones[id].setPosition(p.x, p.y).setSize(size, size);
        this.skyZones[id].input.hitArea.setSize(size, size);
      }
    }

    // ------------------------------------------------------------------ layout

    layout() {
      const W = this.scale.width;
      const H = this.scale.height;
      const s = this.slot;
      const bs = this.baseSlot || s;
      let tall;
      let unit;
      if (this.tight) {
        // Earth and the Sun live in the whole stage, so the base may fill its own part:
        // pick one row or two rows, whichever draws the buildings bigger, and centre it.
        // A thin strip at the bottom stays free, so the base never touches the edge.
        // The top strip stays free for the labels above the base (solar output, radiation).
        const labels = 26 * this.dpr;
        const bh = bs.h - 20 * this.dpr - labels;
        const rowU = Math.min(bs.w / 125, bh / 22); // 125: modules stand apart, joined by hoses
        const tallU = Math.min(bs.w / 72, bh / 42);
        tall = tallU > rowU * 1.1;
        unit = tall ? tallU : rowU;
        this.groundY = bs.y + labels + bh / 2 + (tall ? -6.5 : 4.5) * unit;
      } else {
        tall = bs.w / bs.h < 1.15;
        // Ground line: the base stands on it. Leave room above for Earth and the Sun.
        this.groundY = bs.y + bs.h * (tall ? 0.5 : 0.64);
        unit = tall ? Math.min(bs.w / 72, bs.h / 56) : Math.min(bs.w / 125, bs.h / 34);
      }
      this.tall = tall;
      this.u = unit;
      const cx = bs.x + bs.w / 2;
      const gy = this.groundY;
      if (tall) {
        // Two rows: three rooms at the back, two bigger ones in front.
        const back = [['solar', 20, 13], ['greenhouse', 18, 12], ['lab', 20, 13]];
        const front = [['hab', 28, 16], ['shelter', 24, 12]];
        this.boxes = {
          ...row(back, cx, gy, unit, 6),
          ...row(front, cx, gy + unit * 21, unit, 9),
        };
        this.baseBottom = gy + unit * 21;
      } else {
        const one = [['solar', 18, 12], ['greenhouse', 17, 11], ['hab', 24, 14], ['lab', 19, 12], ['shelter', 19, 10]];
        this.boxes = row(one, cx, gy, unit, 7);
        this.baseBottom = gy;
      }
      // Rooms on the horizon row stand on the hills: each one sits on the lowest point under it,
      // so no foot hangs in the air (where the ground is higher it simply hides behind the room).
      this.onHorizon = {};
      for (const [id, b] of Object.entries(this.boxes)) {
        if (Math.abs(b.y + b.h - gy) > unit * 0.5) continue;
        let base = -Infinity;
        for (let i = 0; i <= 12; i++) base = Math.max(base, this.groundAt(b.x + (b.w * i) / 12));
        b.y = base + unit * 0.3 - b.h;
        this.onHorizon[id] = true;
      }
      const all = Object.values(this.boxes);
      const minX = Math.min(...all.map((b) => b.x));
      const maxX = Math.max(...all.map((b) => b.x + b.w));
      const minY = Math.min(...all.map((b) => b.y));
      // The shield dome must cover every corner of every module (with a margin for ports and dishes).
      const dcx = (minX + maxX) / 2;
      const rx = (maxX - minX) / 2 + unit * (tall ? 16 : 9); // wider dome = lower, rounder dome
      let ry = this.baseBottom - minY + unit * 4;
      for (const b of all) {
        for (const x of [b.x - unit * 2, b.x + b.w + unit * 2]) {
          const f = 1 - ((x - dcx) / rx) ** 2;
          if (f > 0) ry = Math.max(ry, (this.baseBottom - (b.y - unit * 2)) / Math.sqrt(f));
        }
      }
      this.dome = { cx: dcx, cy: this.baseBottom, rx, ry };
      this.earth = { x: s.x + s.w * (tall ? 0.78 : 0.83), y: s.y + Math.max(unit * 10, s.h * 0.17), r: Math.max(14 * this.dpr, unit * (tall ? 6.5 : 5.2)) };
      this.sunPos = { x: s.x + s.w * 0.14, y: s.y + Math.max(unit * 8, s.h * 0.12), r: Math.max(10 * this.dpr, unit * 3.4) };

      // Names the purple particles, so nobody takes them for rain. Shown while radiation is raised.
      const rfs = Math.round(15 * this.dpr);
      this.radLabel.setStyle({
        fontFamily: 'Lexend, system-ui, sans-serif', fontSize: `${rfs}px`, fontStyle: '600', color: '#e3c8ff',
        backgroundColor: 'rgba(60,28,104,0.92)',
      }).setPadding(8 * this.dpr, 4 * this.dpr);
      // Phones: Sam's bubble covers the top of the stage, so the label sits just above the base, on the right
      // (the solar label is on the left). Wide screens: top centre, between the Sun and Earth.
      if (this.tight) this.radLabel.setOrigin(1, 1).setPosition(Math.min(maxX + unit * 3, s.x + s.w - 4 * this.dpr), Math.max(bs.y + this.radLabel.height, minY - unit * 1.2));
      else this.radLabel.setOrigin(0.5, 0).setPosition(s.x + s.w * 0.47, s.y + 6 * this.dpr);
      // How much power the panels make right now, always visible above them.
      const sb = this.boxes.solar;
      this.solarLabel.setStyle({
        fontFamily: 'Lexend, system-ui, sans-serif', fontSize: `${Math.round(13 * this.dpr)}px`, fontStyle: '700', color: '#1d1503',
        backgroundColor: '#ffbf3c',
      }).setPadding(6 * this.dpr, 3 * this.dpr).setPosition(sb.x + sb.w / 2, sb.y - unit * (this.tight ? 0.4 : 1.2));
      for (const [id, p] of [['earth', this.earth], ['sun', this.sunPos]]) {
        const size = Math.max(p.r * 2.6, 48 * this.dpr);
        this.skyZones[id].setPosition(p.x, p.y).setSize(size, size);
        this.skyZones[id].input.hitArea.setSize(size, size);
      }
      this.fitSky(unit);
      for (const id of ROOM_IDS) {
        const b = this.boxes[id];
        const pad = unit * 2;
        this.zones[id].setPosition(b.x - pad, b.y - pad).setSize(b.w + pad * 2, b.h + pad * 2 + unit * 5);
        this.zones[id].input.hitArea.setSize(b.w + pad * 2, b.h + pad * 2 + unit * 5);
      }
      this.buildLabels();
      this.last = {};
      this.drawStatic();
    }

    buildLabels() {
      this.labelLayer.removeAll(true);
      this.badgeLayer.removeAll(true);
      this.badges = {};
      this.roomLabels = {};
      const fs = Math.round(Math.max((this.tall ? 12 : 10) * this.dpr, Math.min(16 * this.dpr, this.u * 2.6)));
      for (const id of ROOM_IDS) {
        const b = this.boxes[id];
        const t = this.add.text(b.x + b.w / 2, b.y + b.h + this.u * 1.2, ROOMS[id].short, {
          fontFamily: 'Lexend, system-ui, sans-serif', fontSize: `${fs}px`, fontStyle: '600', color: C.label,
          stroke: '#070b18', strokeThickness: Math.round(fs * 0.3),
        }).setOrigin(0.5, 0);
        // Small screens: shrink a long name to its building's width, so neighbours never overlap.
        const maxW = b.w + this.u * 2.4;
        if (t.width > maxW) t.setScale(maxW / t.width);
        this.labelLayer.add(t);
        this.roomLabels[id] = t;
        const r = Math.max(13 * this.dpr, this.u * 2.6);
        const badge = this.add.container(b.x + b.w * 0.82, b.y + b.h * 0.12);
        const disc = this.add.circle(0, 0, r, C.alert).setStrokeStyle(r * 0.18, 0x2b0a00);
        const mark = this.add.text(0, 0, '!', { fontFamily: 'Lexend, system-ui, sans-serif', fontSize: `${Math.round(r * 1.3)}px`, fontStyle: '800', color: '#2b0a00' }).setOrigin(0.5, 0.52);
        badge.add([disc, mark]).setVisible(false);
        badge.disc = disc;
        badge.mark = mark;
        this.badgeLayer.add(badge);
        this.badges[id] = badge;
        if (!this.reduced) {
          this.tweens.add({ targets: badge, scale: 1.15, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      }
    }

    // ------------------------------------------------------------------ static drawing

    drawStatic() {
      const v = this.view;
      const night = v ? !v.daylight : false;
      this.drawSky(night);
      this.drawGround(night);
      this.drawSun(v ? v.daylight : true);
      this.drawEarth(v ? v.earthLit : 0.5);
      this.drawBase(v);
    }

    drawSky() {
      const W = this.scale.width;
      const H = this.scale.height;
      const g = this.sky.clear();
      if (this.textures.exists('art-bg')) {
        if (!this.bgImage) this.bgImage = this.add.image(0, 0, 'art-bg').setOrigin(0.5).setDepth(-1);
        const img = this.bgImage;
        const sc = Math.max(W / img.width, H / img.height);
        img.setPosition(W / 2, H / 2).setScale(sc);
        return;
      }
      if (this.game.renderer.type === Phaser.WEBGL) {
        g.fillGradientStyle(C.skyTop, C.skyTop, C.skyBottom, C.skyBottom, 1);
      } else g.fillStyle(C.skyTop, 1);
      g.fillRect(0, 0, W, H);
    }

    drawStars(time) {
      const W = this.scale.width;
      const H = this.groundY;
      const g = this.starsG.clear();
      for (const st of this.stars) {
        const tw = this.reduced ? 1 : 0.75 + 0.25 * Math.sin(time / 900 + st.p);
        g.fillStyle(0xffffff, st.a * tw);
        g.fillCircle(st.x * W, st.y * H, st.r * this.dpr);
      }
    }

    /** Height of the rolling horizon at x (screen y). Rooms on the horizon stand on this line. */
    groundAt(x) {
      const k = (x / this.scale.width) * 12;
      return this.groundY - this.u * 0.5 + Math.sin(k * 1.7) * this.u * 0.9 + Math.cos(k * 0.6) * this.u * 1.2;
    }

    drawGround(night) {
      const W = this.scale.width;
      const H = this.scale.height;
      const gy = this.groundY;
      const u = this.u;
      const g = this.groundG.clear();
      g.fillStyle(night ? C.groundNight : C.groundDay, 1);
      g.beginPath();
      g.moveTo(0, gy + u * 2);
      const steps = 72;
      for (let i = 0; i <= steps; i++) {
        const x = (W * i) / steps;
        g.lineTo(x, this.groundAt(x));
      }
      g.lineTo(W, H);
      g.lineTo(0, H);
      g.closePath();
      g.fillPath();
      // craters
      const shade = night ? C.groundNightShade : C.groundDayShade;
      const rnd = new Phaser.Math.RandomDataGenerator(['craters']);
      for (let i = 0; i < 14; i++) {
        const x = rnd.frac() * W;
        const y = gy + u * 4 + rnd.frac() * (H - gy);
        const r = u * (1.5 + rnd.frac() * 5);
        g.fillStyle(shade, 0.9);
        g.fillEllipse(x, y, r * 2.4, r * 0.8);
        g.fillStyle(night ? C.groundNight : C.groundDay, 1);
        g.fillEllipse(x + r * 0.2, y + r * 0.08, r * 2, r * 0.55);
      }
    }

    drawSun(day) {
      const g = this.sunG.clear();
      if (!day) return;
      const { x, y, r } = this.sunPos;
      for (let i = 4; i >= 1; i--) {
        g.fillStyle(C.sunGlow, 0.05 * (5 - i));
        g.fillCircle(x, y, r * (1 + i * 0.7));
      }
      g.fillStyle(C.sun, 1);
      g.fillCircle(x, y, r);
    }

    drawEarth(lit) {
      const { x, y, r } = this.earth;
      const g = this.earthG.clear();
      const poly = (pts, color, alpha = 1) => {
        g.fillStyle(color, alpha);
        g.fillPoints(pts.map(([px, py]) => ({ x: x + px * r, y: y + py * r })), true);
      };
      // thin blue air glow around the planet
      for (let i = 3; i >= 1; i--) {
        g.fillStyle(0x6fb6ff, 0.06 * (4 - i));
        g.fillCircle(x, y, r * (1 + i * 0.07));
      }
      // oceans, lighter towards the sunlit side
      g.fillStyle(0x1f5fc0, 1);
      g.fillCircle(x, y, r);
      g.fillStyle(0x3d8df0, 0.9);
      g.fillCircle(x - r * 0.18, y - r * 0.12, r * 0.78);
      g.fillStyle(0x62aaff, 0.5);
      g.fillCircle(x - r * 0.36, y - r * 0.26, r * 0.42);
      // continents (a simple view of the Atlantic side: the Americas, Europe and Africa)
      poly(EARTH.northAmerica, 0x4aa565);
      poly(EARTH.southAmerica, 0x3f9a5a);
      poly(EARTH.europe, 0x5bab6a);
      poly(EARTH.africa, 0x4aa565);
      poly(EARTH.sahara, 0xd8c382);
      // ice at the poles
      g.fillStyle(0xf4f9ff, 0.95);
      g.fillEllipse(x, y - r * 0.9, r * 0.56, r * 0.16);
      g.fillEllipse(x + r * 0.05, y + r * 0.92, r * 0.42, r * 0.12);
      // clouds
      g.fillStyle(C.earthCloud, 0.8);
      for (const [cx, cy, w, h] of EARTH.clouds) g.fillEllipse(x + cx * r, y + cy * r, w * r, h * r);
      // Night side. The lit part faces the Sun (on the left); lit = fraction of the disc in sunlight.
      const f = Phaser.Math.Clamp(lit, 0, 1);
      if (f < 0.98) {
        const a = 2 * f - 1; // where the day-night line crosses the middle: 1 = right edge, -1 = left edge
        const pts = [];
        const n = 24;
        for (let i = 0; i <= n; i++) {
          const th = -Math.PI / 2 + (Math.PI * i) / n;
          pts.push([Math.cos(th) * 1.01, Math.sin(th) * 1.01]);
        }
        for (let i = n; i >= 0; i--) {
          const th = -Math.PI / 2 + (Math.PI * i) / n;
          pts.push([Math.cos(th) * a, Math.sin(th) * 1.01]);
        }
        poly(pts, 0x060a1c, 0.86);
      }
      // rim light on the sunlit edge
      g.lineStyle(Math.max(1, r * 0.05), 0x9fd0ff, 0.55);
      g.beginPath();
      g.arc(x, y, r, Math.PI * 0.55, Math.PI * 1.45, false);
      g.strokePath();
    }

    drawBase(v) {
      const g = this.baseG.clear();
      this.imgLayer.removeAll(true);
      const night = v ? !v.daylight : false;
      const u = this.u;
      const lw = Math.max(1.5, u * 0.35);
      // Every module has its own docking ports; flexible hoses join them (unused ports are capped).
      const links = (this.tall
        ? [['solar.r', 'greenhouse.l', 'power'], ['greenhouse.r', 'lab.l', 'air'], ['hab.r', 'shelter.l', 'air'], ['greenhouse.d', 'hab.t', 'air']]
        : [['solar.r', 'greenhouse.l', 'power'], ['greenhouse.r', 'hab.l', 'air'], ['hab.r', 'lab.l', 'air'], ['lab.r', 'shelter.l', 'air']])
        // During the intro a hose appears only once both of its modules are built.
        .filter(([a, b]) => this.isBuilt(v, a.split('.')[0]) && this.isBuilt(v, b.split('.')[0]));
      const ports = {};
      for (const id of ROOM_IDS) {
        const box = this.boxes[id];
        const floor = this.onHorizon[id] ? (x) => this.groundAt(x) : () => box.y + box.h;
        for (const [k, p] of Object.entries(PORTS[id](box, u))) ports[`${id}.${k}`] = { ...p, room: id, floor, row: this.onHorizon[id] ? 'back' : 'front' };
      }
      const used = new Set(links.flatMap(([a, b]) => [a, b]));
      const shown = Object.keys(ports).filter((k) => used.has(k) || !ports[k].optional);
      for (const id of ROOM_IDS) {
        const b = this.boxes[id];
        const status = v?.rooms?.[id] ?? 'ok';
        if (!this.isBuilt(v, id)) {
          // The free spot for the next building: a dashed outline on the ground.
          if (v.buildNext === id) {
            g.lineStyle(Math.max(2, u * 0.45), 0xffbf3c, 0.95);
            const step = u * 2.2;
            for (let x = b.x; x < b.x + b.w - step * 0.5; x += step) {
              g.lineBetween(x, b.y, Math.min(b.x + b.w, x + step * 0.55), b.y);
              g.lineBetween(x, b.y + b.h, Math.min(b.x + b.w, x + step * 0.55), b.y + b.h);
            }
            for (let y = b.y; y < b.y + b.h - step * 0.5; y += step) {
              g.lineBetween(b.x, y, b.x, Math.min(b.y + b.h, y + step * 0.55));
              g.lineBetween(b.x + b.w, y, b.x + b.w, Math.min(b.y + b.h, y + step * 0.55));
            }
            g.fillStyle(0xffbf3c, 0.12);
            g.fillRect(b.x, b.y, b.w, b.h);
          }
          continue;
        }
        // shadow
        g.fillStyle(0x000000, 0.22);
        g.fillEllipse(b.x + b.w / 2, b.y + b.h, b.w * 1.05, u * 2.2);
        if (this.textures.exists(`room-${id}`)) {
          const img = this.add.image(b.x + b.w / 2, b.y + b.h, `room-${id}`).setOrigin(0.5, 1);
          img.setScale(Math.min(b.w / img.width, b.h / img.height));
          if (status === 'lost') img.setTint(0x555a70);
          this.imgLayer.add(img);
          for (const k of shown) if (ports[k].room === id) dock(g, ports[k], used.has(k), u, lw, night);
          continue;
        }
        const ctx = { g, b, u, lw, night, status, v };
        DRAW[id](ctx);
        for (const k of shown) if (ports[k].room === id) dock(g, ports[k], used.has(k), u, lw, night);
        if (status === 'lost') {
          g.fillStyle(0x070b18, 0.55);
          g.fillRoundedRect(b.x - u * 0.5, b.y - u * 0.5, b.w + u, b.h + u, u * 1.5);
          // hazard tape
          g.lineStyle(u * 1.1, 0xffbf3c, 0.9);
          g.lineBetween(b.x, b.y + b.h * 0.3, b.x + b.w, b.y + b.h * 0.7);
          g.lineStyle(u * 1.1, 0x252c4a, 0.9);
          g.lineBetween(b.x, b.y + b.h * 0.42, b.x + b.w, b.y + b.h * 0.82);
        }
      }
      for (const [a, b, kind] of links) {
        const A = ports[a];
        const B = ports[b];
        const ground = A.row === B.row ? A.floor : null; // a hose between rows hangs free
        hose(g, portEnd(A, u), A, portEnd(B, u), B, kind, ground, u, lw, night);
      }
    }

    // ------------------------------------------------------------------ per-frame

    update(time, deltaMs) {
      const v = this.view;
      if (!v || !this.boxes) return;
      const dt = Math.min(0.05, deltaMs / 1000);
      const sig = `${v.daylight}|${JSON.stringify(v.rooms)}|${v.dust}|${v.filter}|${v.sheltered}|${v.powerEmergency}|${JSON.stringify(v.built || 0)}|${v.buildNext || ''}`;
      if (sig !== this.last.sig) {
        if (this.last.daylight !== v.daylight) { this.drawSky(); this.drawGround(!v.daylight); this.drawSun(v.daylight); }
        this.drawBase(v);
        this.last.sig = sig;
        this.last.daylight = v.daylight;
      }
      if (Math.abs((this.last.earthLit ?? -1) - v.earthLit) > 0.01) {
        this.drawEarth(v.earthLit);
        this.last.earthLit = v.earthLit;
      }
      if (!this.last.starsAt || time - this.last.starsAt > 120) { this.drawStars(time); this.last.starsAt = time; }

      for (const id of ROOM_IDS) {
        const kind = v.buildNext === id ? 'build' : this.isBuilt(v, id) ? v.repairs?.[id] : null;
        const badge = this.badges[id];
        badge.setVisible(Boolean(kind));
        if (kind) {
          const rebuild = kind === 'rebuild';
          const build = kind === 'build' || kind === 'fort'; // something to build, not something broken
          badge.disc.setFillStyle(build ? 0xffbf3c : rebuild ? 0x2c3863 : C.alert);
          badge.mark.setText(rebuild || build ? '+' : '!').setColor(rebuild ? '#f3f0e8' : '#2b0a00');
        }
      }

      // shield dome eases to its level
      const target = [0, 0.13, 0.22, 0.32][v.shield] ?? 0;
      this.shieldAlpha += (target - this.shieldAlpha) * Math.min(1, dt * 4);
      this.drawDome();
      this.updateParticles(dt, v);
      this.radLabel.setVisible((v.radiation || 1) >= 2);
      const solarText = this.isBuilt(v, 'solar') ? v.solarText : '';
      if (solarText !== this.last.solarText) {
        this.solarLabel.setText(solarText || '').setVisible(Boolean(solarText));
        this.solarLabel.setBackgroundColor(v.solarLow ? '#c9c5bb' : '#ffbf3c');
        // Keep the whole label on screen, even when the panels stand at the edge.
        const sb = this.boxes.solar;
        const half = this.solarLabel.width / 2 + 4 * this.dpr;
        this.solarLabel.setX(Math.min(Math.max(sb.x + sb.w / 2, this.slot.x + half), this.slot.x + this.slot.w - half));
        this.last.solarText = solarText;
      }
      for (const id of ROOM_IDS) this.roomLabels[id].setVisible(this.isBuilt(v, id));
    }

    /** During the intro, buildings appear one by one (`view.built`). In a mission, all are built. */
    isBuilt(v, id) {
      return !v?.built || Boolean(v.built[id]);
    }

    drawDome() {
      const g = this.domeG.clear();
      const a = this.shieldAlpha;
      if (a < 0.01) return;
      const d = this.dome;
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const ang = Math.PI + (Math.PI * i) / 40;
        pts.push({ x: d.cx + Math.cos(ang) * d.rx, y: d.cy + Math.sin(ang) * d.ry });
      }
      g.fillStyle(C.shield, a * 0.55);
      g.fillPoints(pts, true);
      g.lineStyle(Math.max(2, this.u * 0.45), C.shield, Math.min(1, a * 3));
      g.strokePoints(pts, false);
    }

    updateParticles(dt, v) {
      const W = this.scale.width;
      const H = this.scale.height;
      const times = Math.max(1, v.radiation || 1);
      let want = Math.round(3 + 15 * Math.log10(times));
      want = Math.min(this.reduced ? 18 : 60, want);
      while (this.parts.length < want) this.parts.push(this.spawn(true));
      if (this.parts.length > want) this.parts.length = want;
      const g = this.fxG.clear();
      const d = this.dome;
      const speed = H * (0.32 + Math.min(0.4, Math.log10(times) * 0.1));
      const len = 16 * this.dpr;
      const head = Math.max(1.6, this.dpr * 1.7);
      for (let i = 0; i < this.parts.length; i++) {
        const p = this.parts[i];
        p.x += p.dx * speed * p.v * dt;
        p.y += p.dy * speed * p.v * dt;
        if (!p.checked && v.blockShield > 0) {
          const nx = (p.x - d.cx) / d.rx;
          const ny = (p.y - d.cy) / d.ry;
          if (nx * nx + ny * ny < 1 && p.y < d.cy) {
            p.checked = true;
            if (Math.random() < v.blockShield) {
              this.sparks.push({ x: p.x, y: p.y, t: 0 });
              this.parts[i] = this.spawn(false);
              continue;
            }
          }
        }
        if (p.y > H || p.x > W + 20 || p.y > this.baseBottom + this.u * 12) {
          this.parts[i] = this.spawn(false);
          continue;
        }
        // Particles from the Sun: a bright dot with a short fading tail, not a rain streak.
        const hs = head * p.s;
        g.lineStyle(hs * 0.9, C.particle, 0.4);
        g.lineBetween(p.x, p.y, p.x - p.dx * len * p.s, p.y - p.dy * len * p.s);
        g.fillStyle(C.particle, 0.3);
        g.fillCircle(p.x, p.y, hs * 2.1);
        g.fillStyle(C.particle, 1);
        g.fillCircle(p.x, p.y, hs * 1.2);
        g.fillStyle(C.spark, 1);
        g.fillCircle(p.x, p.y, hs * 0.55);
      }
      // sparks where the shield stopped a particle
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i];
        s.t += dt;
        if (s.t > 0.35) { this.sparks.splice(i, 1); continue; }
        const k = s.t / 0.35;
        g.lineStyle(Math.max(1, this.dpr * 1.4), C.spark, 1 - k);
        g.strokeCircle(s.x, s.y, (3 + 10 * k) * this.dpr);
      }
      // air puffs from leaking rooms
      for (const id of ROOM_IDS) {
        if (v.rooms?.[id] !== 'leak') continue;
        if (Math.random() < dt * (this.reduced ? 3 : 9)) {
          const b = this.boxes[id];
          this.puffs.push({ x: b.x + b.w * (0.3 + Math.random() * 0.4), y: b.y + b.h * 0.3, vx: (Math.random() - 0.5) * this.u * 6, vy: -this.u * (4 + Math.random() * 4), t: 0 });
        }
      }
      for (let i = this.puffs.length - 1; i >= 0; i--) {
        const p = this.puffs[i];
        p.t += dt;
        if (p.t > 1.2) { this.puffs.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        g.fillStyle(0xffffff, 0.55 * (1 - p.t / 1.2));
        g.fillCircle(p.x, p.y, this.u * (0.6 + p.t * 1.6));
      }
    }

    spawn(anywhere) {
      // One steady stream from the Sun's side (upper left), the same by day and by night.
      const W = this.scale.width;
      const H = this.scale.height;
      const a = (27 + Math.random() * 8) * Math.PI / 180; // gently down to the right
      const dx = Math.cos(a), dy = Math.sin(a);
      let x, y;
      if (anywhere) { x = Math.random() * W; y = Math.random() * this.groundY; }
      else if (Math.random() < 0.6) { x = Math.random() * W * 0.9 - W * 0.1; y = -10; } // top edge
      else { x = -10; y = Math.random() * this.groundY * 0.8; } // left edge
      return { x, y, dx, dy, v: 0.8 + Math.random() * 0.4, s: 0.7 + Math.random() * 0.6, checked: false };
    }

    // ------------------------------------------------------------------ effects

    /** A real flare happened. No visual on purpose: the full-screen flash confused players. The card and Sam explain it. */
    flare() {}

    burst() {
      for (let i = 0; i < (this.reduced ? 6 : 24); i++) this.parts.push(this.spawn(true));
    }
  };
}

/** Lay out rooms in a row, centred, standing on the ground line `gy`. Sizes are in units. */
function row(list, cx, gy, u, gap) {
  const total = list.reduce((a, [, w]) => a + w, 0) + gap * (list.length - 1);
  let x = cx - (total * u) / 2;
  const out = {};
  for (const [id, w, h] of list) {
    out[id] = { x, y: gy - h * u, w: w * u, h: h * u };
    x += (w + gap) * u;
  }
  return out;
}

// ------------------------------------------------------------------ placeholder room art
// Modelled on real lunar surface concepts: masted solar arrays that tilt to follow the Sun,
// an inflatable greenhouse with LED grow lights, a rigid habitat on landing legs with a
// micrometeoroid blanket and an airlock, a small lab with a high-gain dish, and a storm
// shelter 3D-printed from Moon dust (regolith) in thick layers.

const P = {
  blanket: 0xebe7dc, blanketShade: 0xc9c3b3, seam: 0xb3ac9b,
  metal: 0xa3a9b6, metalDark: 0x5c6273, metalLight: 0xd5d9e0,
  foil: 0xd9a441, foilDark: 0x9a6b1d,
  cell: 0x18295e, cellLine: 0x4a6cc0, cellGlare: 0xbfd4ff,
  radiator: 0xf3f4f6, radiatorLine: 0xb4bac6,
  film: 0xe6f4ee, rib: 0xffffff, led: 0xff74d4, leaf: 0x58b84a, leafDark: 0x3a8a33,
  printed: 0x8e877a, printedLine: 0x6f695e, door: 0x4b5265, hazard: 0xffbf3c, hazardDark: 0x2a2e3a,
  lightOk: 0x8fe36b,
};

/** Night: mix every colour toward a cold blue-grey so the whole base dims together. */
function tone(c, night, k = 0.42) {
  if (!night) return c;
  const n = 0x343a56;
  const ch = (s) => Math.round(((c >> s) & 255) * (1 - k) + ((n >> s) & 255) * k);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}
const windowColor = (ctx, on = true) => (!on || ctx.v?.powerEmergency ? C.windowOff : ctx.night ? C.windowNight : C.windowDay);

/** Horizontal inset of a rounded rectangle's edge at height y (for bands that follow the corners). */
function insetAt(y, top, h, r) {
  const dy = y < top + r ? top + r - y : y > top + h - r ? y - (top + h - r) : 0;
  return r - Math.sqrt(Math.max(0, r * r - dy * dy));
}
/** A horizontal band of a rounded rectangle, from y0 to y1, as a polygon. */
function band(x, top, w, h, r, y0, y1) {
  const L = [];
  const R = [];
  for (let i = 0; i <= 10; i++) {
    const y = y0 + ((y1 - y0) * i) / 10;
    const d = insetAt(y, top, h, r);
    L.push({ x: x + d, y });
    R.unshift({ x: x + w - d, y });
  }
  return L.concat(R);
}

/** A pressurised module seen from the side: blanket, panel seams, light from the left, end rings. */
function module(g, { x, top, w, h, r, lw, night }) {
  g.fillStyle(tone(P.blanket, night), 1);
  g.fillRoundedRect(x, top, w, h, r);
  g.fillStyle(0xffffff, night ? 0.08 : 0.35);
  g.fillPoints(band(x, top, w, h, r, top + h * 0.08, top + h * 0.2), true);
  g.fillStyle(tone(P.blanketShade, night), 0.9);
  g.fillPoints(band(x, top, w, h, r, top + h * 0.72, top + h), true);
  // blanket seams with stitching
  g.lineStyle(Math.max(1, lw * 0.35), tone(P.seam, night), 0.9);
  const panels = Math.max(3, Math.round((w - r * 2) / (h * 0.42)));
  for (let i = 0; i <= panels; i++) {
    const sx = x + r + ((w - r * 2) * i) / panels;
    g.lineBetween(sx, top + 1, sx, top + h - 1);
  }
  g.lineBetween(x + insetAt(top + h * 0.5, top, h, r), top + h * 0.5, x + w - insetAt(top + h * 0.5, top, h, r), top + h * 0.5);
  // bulkhead rings in gold foil
  g.lineStyle(Math.max(1.5, lw * 0.9), tone(P.foil, night), 1);
  g.lineBetween(x + r * 0.55, top + h * 0.06, x + r * 0.55, top + h * 0.94);
  g.lineBetween(x + w - r * 0.55, top + h * 0.06, x + w - r * 0.55, top + h * 0.94);
  g.lineStyle(lw, C.outline, 1);
  g.strokeRoundedRect(x, top, w, h, r);
}

/** Landing leg with a strut and a round foot pad. */
function leg(g, { x, y, foot, dir, u, lw, night }) {
  g.lineStyle(Math.max(1.5, lw * 1.1), tone(P.metalDark, night), 1);
  g.lineBetween(x, y, x + dir * u * 1.8, foot - u * 0.4);
  g.lineStyle(Math.max(1, lw * 0.6), tone(P.metal, night), 1);
  g.lineBetween(x + dir * u * 1.2, y, x + dir * u * 1.8, foot - u * 0.4);
  g.fillStyle(tone(P.metal, night), 1);
  g.fillEllipse(x + dir * u * 1.8, foot - u * 0.3, u * 2, u * 0.7);
  g.lineStyle(Math.max(1, lw * 0.5), C.outline, 1);
  g.strokeEllipse(x + dir * u * 1.8, foot - u * 0.3, u * 2, u * 0.7);
}

function viewport(g, x, y, s, color, lw) {
  g.fillStyle(P.metalDark, 1);
  g.fillRoundedRect(x - s / 2 - s * 0.18, y - s / 2 - s * 0.18, s * 1.36, s * 1.36, s * 0.4);
  g.fillStyle(color, 1);
  g.fillRoundedRect(x - s / 2, y - s / 2, s, s, s * 0.3);
  g.lineStyle(Math.max(1, lw * 0.5), 0xffffff, 0.5);
  g.lineBetween(x - s * 0.25, y - s * 0.05, x - s * 0.05, y - s * 0.25);
}

const DRAW = {
  // Two arrays on masts. The wings tilt to face the Sun; dust turns them brown.
  solar({ g, b, u, lw, night, v }) {
    const base = b.y + b.h;
    const dust = v?.dust;
    const top = b.y + b.h * 0.02;
    const bot = b.y + b.h * 0.6;
    const ww = b.w * 0.43;
    const skew = u * 1.1;
    for (let i = 0; i < 2; i++) {
      const cx = b.x + b.w * (0.25 + i * 0.5);
      const mid = (top + bot) / 2;
      // truss mast
      const rail = u * 0.45;
      g.lineStyle(Math.max(1, lw * 0.6), tone(P.metal, night), 1);
      g.lineBetween(cx - rail, mid, cx - rail, base - u * 1.2);
      g.lineBetween(cx + rail, mid, cx + rail, base - u * 1.2);
      for (let y = bot, k = 0; y < base - u * 1.4; y += u * 1.1, k++) {
        g.lineBetween(cx + (k % 2 ? rail : -rail), y, cx + (k % 2 ? -rail : rail), y + u * 1.1);
      }
      // tripod and foot pads
      g.lineStyle(Math.max(1.5, lw * 0.9), tone(P.metalDark, night), 1);
      g.lineBetween(cx, base - u * 1.4, cx - u * 2.6, base - u * 0.2);
      g.lineBetween(cx, base - u * 1.4, cx + u * 2.6, base - u * 0.2);
      g.fillStyle(tone(P.metal, night), 1);
      g.fillEllipse(cx - u * 2.6, base - u * 0.2, u * 1.4, u * 0.5);
      g.fillEllipse(cx + u * 2.6, base - u * 0.2, u * 1.4, u * 0.5);
      // gimbal motor under the wing
      g.fillStyle(tone(P.metalDark, night), 1);
      g.fillRoundedRect(cx - u * 0.9, bot - u * 0.2, u * 1.8, u * 1.3, u * 0.3);
      // wing: frame, cells, bus bar
      const at = (s, t) => ({ x: cx - ww / 2 + skew - 2 * skew * t + ww * s, y: top + (bot - top) * t });
      g.fillStyle(tone(P.metalLight, night), 1);
      g.fillPoints([at(0, 0), at(1, 0), at(1, 1), at(0, 1)], true);
      const e = 0.04;
      const ins = (s, t) => at(e + (1 - 2 * e) * s, e * 1.5 + (1 - 3 * e) * t);
      g.fillStyle(dust ? tone(C.dust, night) : tone(P.cell, night, 0.25), 1);
      g.fillPoints([ins(0, 0), ins(1, 0), ins(1, 1), ins(0, 1)], true);
      g.lineStyle(Math.max(1, lw * 0.35), dust ? 0x6f6148 : tone(P.cellLine, night, 0.25), 0.9);
      const cols = 6;
      const rows = 5;
      for (let c = 1; c < cols; c++) { const p0 = ins(c / cols, 0); const p1 = ins(c / cols, 1); g.lineBetween(p0.x, p0.y, p1.x, p1.y); }
      for (let r = 1; r < rows; r++) { const p0 = ins(0, r / rows); const p1 = ins(1, r / rows); g.lineBetween(p0.x, p0.y, p1.x, p1.y); }
      g.lineStyle(Math.max(1.5, lw * 0.7), tone(P.metalLight, night), 1);
      { const p0 = ins(0.5, 0); const p1 = ins(0.5, 1); g.lineBetween(p0.x, p0.y, p1.x, p1.y); }
      if (!dust && !night) {
        g.fillStyle(P.cellGlare, 0.14);
        g.fillPoints([ins(0.05, 0), ins(0.35, 0), ins(0.12, 1), ins(0, 1)], true);
      }
      g.lineStyle(lw, C.outline, 1);
      g.strokePoints([at(0, 0), at(1, 0), at(1, 1), at(0, 1)], true);
    }
    // power unit; its cable port docks the power line to the base
    const px = b.x + b.w * 0.5;
    g.fillStyle(tone(P.radiator, night), 1);
    g.fillRoundedRect(px - u * 1.6, base - u * 2.6, u * 3.2, u * 2.4, u * 0.3);
    g.lineStyle(Math.max(1, lw * 0.35), tone(P.radiatorLine, night), 1);
    for (let k = 1; k < 4; k++) g.lineBetween(px - u * 1.2, base - u * 2.6 + k * u * 0.5, px + u * 0.4, base - u * 2.6 + k * u * 0.5);
    g.fillStyle(v?.powerEmergency ? C.alert : P.lightOk, 1);
    g.fillCircle(px + u * 0.95, base - u * 2.05, u * 0.3);
    g.lineStyle(Math.max(1, lw * 0.6), C.outline, 1);
    g.strokeRoundedRect(px - u * 1.6, base - u * 2.6, u * 3.2, u * 2.4, u * 0.3);
  },

  // Inflatable growth chamber on a rigid ring, lit pink by LED grow lights.
  greenhouse({ g, b, u, lw, night, status, v }) {
    const base = b.y + b.h;
    const skirt = u * 1.4;
    const x = b.x + u * 1.4;
    const w = b.w - u * 2.8;
    const top = b.y + b.h * 0.06;
    const h = base - skirt - top;
    const r = Math.min(h * 0.62, w * 0.3);
    const alive = status !== 'lost';
    const lit = alive && !v?.powerEmergency;
    // inside: glow, racks, plants
    g.fillStyle(lit ? P.led : 0x2a3048, lit ? (night ? 0.55 : 0.32) : 0.6);
    g.fillRoundedRect(x, top, w, h, { tl: r, tr: r, bl: 0, br: 0 });
    g.fillStyle(tone(P.film, night), night ? 0.12 : 0.38);
    g.fillRoundedRect(x, top, w, h, { tl: r, tr: r, bl: 0, br: 0 });
    const shelves = [top + h * 0.5, top + h * 0.92];
    for (const sy of shelves) {
      const d = insetAt(sy - h * 0.3, top, h * 2, r) + u * 0.8;
      if (lit) { g.fillStyle(P.led, 1); g.fillRect(x + d, sy - h * 0.36, w - d * 2, u * 0.35); }
      if (alive) {
        for (let px = x + d + u * 0.8; px < x + w - d - u * 0.5; px += u * 1.5) {
          g.fillStyle(tone(P.leafDark, night), 1);
          g.fillEllipse(px, sy - u * 0.9, u * 1.6, u * 1.7);
          g.fillStyle(tone(P.leaf, night), 1);
          g.fillEllipse(px + u * 0.2, sy - u * 1.3, u * 1.1, u * 1.2);
        }
      }
      g.fillStyle(tone(P.metal, night), 1);
      g.fillRect(x + d - u * 0.3, sy - u * 0.3, w - d * 2 + u * 0.6, u * 0.4);
    }
    // inflated ribs
    g.lineStyle(Math.max(1.5, lw * 0.9), P.rib, night ? 0.25 : 0.55);
    const ribs = 6;
    for (let i = 1; i < ribs; i++) {
      const rx = x + (w * i) / ribs;
      const dx = Math.min(rx - x, x + w - rx);
      const ry = dx < r ? top + r - Math.sqrt(Math.max(0, r * r - (r - dx) * (r - dx))) : top;
      g.lineBetween(rx, ry + 1, rx, top + h);
    }
    g.lineStyle(lw, C.outline, 1);
    g.strokeRoundedRect(x, top, w, h, { tl: r, tr: r, bl: 0, br: 0 });
    // rigid base ring with bolts and a hatch
    g.fillStyle(tone(P.metal, night), 1);
    g.fillRect(x - u * 0.3, base - skirt, w + u * 0.6, skirt);
    g.fillStyle(tone(P.metalDark, night), 1);
    for (let bx = x + u * 0.6; bx < x + w; bx += u * 1.6) g.fillCircle(bx, base - skirt * 0.5, u * 0.18);
    g.lineStyle(lw, C.outline, 1);
    g.strokeRect(x - u * 0.3, base - skirt, w + u * 0.6, skirt);
  },

  // Rigid habitat on landing legs: blanket, small windows, radiator, antenna, handrails, airlock and ladder.
  hab(ctx) {
    const { g, b, u, lw, night, v } = ctx;
    const base = b.y + b.h;
    const airW = b.w * 0.15;
    const x = b.x;
    const w = b.w - airW;
    const top = b.y + b.h * 0.26;
    const h = b.h * 0.56;
    const r = h * 0.32;
    // legs behind the body
    for (const [lx, dir] of [[x + w * 0.16, -1], [x + w * 0.84, 1]]) leg(g, { x: lx, y: top + h * 0.9, foot: base, dir, u, lw, night });
    // radiator panel on posts
    const rx = x + w * 0.1;
    const rw = w * 0.42;
    const ry = top - u * 2.4;
    g.lineStyle(Math.max(1, lw * 0.7), tone(P.metalDark, night), 1);
    g.lineBetween(rx + rw * 0.2, ry + u, rx + rw * 0.2, top + 2);
    g.lineBetween(rx + rw * 0.8, ry + u, rx + rw * 0.8, top + 2);
    g.fillStyle(tone(P.radiator, night), 1);
    g.fillRect(rx, ry, rw, u * 1.1);
    g.lineStyle(Math.max(1, lw * 0.35), tone(P.radiatorLine, night), 1);
    for (let k = 1; k < 8; k++) g.lineBetween(rx + (rw * k) / 8, ry, rx + (rw * k) / 8, ry + u * 1.1);
    g.lineStyle(Math.max(1, lw * 0.6), C.outline, 1);
    g.strokeRect(rx, ry, rw, u * 1.1);
    // antenna mast with a small dish
    const ax = x + w * 0.72;
    g.lineStyle(Math.max(1, lw * 0.7), tone(P.metalDark, night), 1);
    g.lineBetween(ax, top + 2, ax, top - u * 4);
    g.fillStyle(tone(P.metalLight, night), 1);
    g.fillEllipse(ax + u * 0.2, top - u * 4.2, u * 2.2, u * 0.8);
    g.fillStyle(C.alert, 1);
    g.fillCircle(ax, top - u * 4.9, u * 0.28);
    // body
    module(g, { x, top, w, h, r, lw, night });
    // gold handrails along the top
    g.lineStyle(Math.max(1.5, lw * 0.6), tone(P.foil, night), 1);
    g.lineBetween(x + w * 0.56, top - u * 0.6, x + w * 0.66, top - u * 0.6);
    g.lineBetween(x + w * 0.56, top - u * 0.6, x + w * 0.56, top + 1);
    g.lineBetween(x + w * 0.66, top - u * 0.6, x + w * 0.66, top + 1);
    // windows: dark when the crew is in the shelter
    const on = !v?.sheltered;
    for (let i = 0; i < 3; i++) viewport(g, x + w * (0.3 + i * 0.18), top + h * 0.38, u * 2, windowColor(ctx, on), lw);
    // hatch number plate and status lights
    g.fillStyle(on && !v?.powerEmergency ? P.lightOk : 0x3a4262, 1);
    g.fillCircle(x + w * 0.2, top + h * 0.62, u * 0.3);
    g.fillCircle(x + w * 0.2 + u * 0.9, top + h * 0.62, u * 0.3);
    // airlock with a round hatch and a hand wheel
    const lx = x + w - u * 0.6;
    const lt = top + h * 0.14;
    const lh = h * 0.8;
    g.fillStyle(tone(P.metalLight, night), 1);
    g.fillRoundedRect(lx, lt, airW + u * 0.6, lh, u * 1.2);
    g.fillStyle(tone(P.metal, night), 1);
    g.fillRect(lx, lt + lh * 0.72, airW + u * 0.6, lh * 0.18);
    g.lineStyle(lw, C.outline, 1);
    g.strokeRoundedRect(lx, lt, airW + u * 0.6, lh, u * 1.2);
    const hx = lx + (airW + u * 0.6) / 2;
    const hy = lt + lh * 0.42;
    const hr = Math.min(airW * 0.36, lh * 0.3);
    g.fillStyle(tone(P.metal, night), 1);
    g.fillCircle(hx, hy, hr);
    g.lineStyle(Math.max(1, lw * 0.6), C.outline, 1);
    g.strokeCircle(hx, hy, hr);
    g.lineStyle(Math.max(1, lw * 0.5), tone(P.metalDark, night), 1);
    g.strokeCircle(hx, hy, hr * 0.45);
    g.lineBetween(hx - hr * 0.45, hy, hx + hr * 0.45, hy);
    g.lineBetween(hx, hy - hr * 0.45, hx, hy + hr * 0.45);
    g.fillStyle(v?.sheltered ? C.windowNight : P.hazard, 1);
    g.fillCircle(hx, lt + u * 0.8, u * 0.3);
    // ladder to the ground
    const l0 = hx - u * 0.7;
    const l1 = hx + u * 0.7;
    g.lineStyle(Math.max(1, lw * 0.6), tone(P.metalDark, night), 1);
    g.lineBetween(l0, lt + lh, l0, base);
    g.lineBetween(l1, lt + lh, l1, base);
    for (let y = lt + lh + u * 0.7; y < base; y += u * 0.8) g.lineBetween(l0, y, l1, y);
  },

  // Small lab module with an observation window, instrument mast and a high-gain dish to Earth.
  lab(ctx) {
    const { g, b, u, lw, night, v } = ctx;
    const base = b.y + b.h;
    const x = b.x + b.w * 0.02;
    const w = b.w * 0.64;
    const top = b.y + b.h * 0.4;
    const h = b.h * 0.44;
    const r = h * 0.32;
    for (const [lx, dir] of [[x + w * 0.2, -1], [x + w * 0.8, 1]]) leg(g, { x: lx, y: top + h * 0.92, foot: base, dir, u: u * 0.8, lw, night });
    // instrument mast with sensors
    const mx = x + w * 0.2;
    g.lineStyle(Math.max(1, lw * 0.6), tone(P.metalDark, night), 1);
    g.lineBetween(mx, top + 2, mx, b.y + b.h * 0.06);
    g.lineBetween(mx - u * 1.4, b.y + b.h * 0.12, mx + u * 1.4, b.y + b.h * 0.12);
    g.fillStyle(tone(P.metalLight, night), 1);
    g.fillRect(mx - u * 1.8, b.y + b.h * 0.12 - u * 0.4, u * 0.8, u * 0.8);
    g.fillCircle(mx + u * 1.5, b.y + b.h * 0.12, u * 0.45);
    // radiator fins on the roof
    g.fillStyle(tone(P.radiator, night), 1);
    g.fillRect(x + w * 0.42, top - u * 1.6, w * 0.34, u * 0.9);
    g.lineStyle(Math.max(1, lw * 0.35), tone(P.radiatorLine, night), 1);
    for (let k = 1; k < 6; k++) g.lineBetween(x + w * 0.42 + (w * 0.34 * k) / 6, top - u * 1.6, x + w * 0.42 + (w * 0.34 * k) / 6, top - u * 0.7);
    g.lineStyle(Math.max(1, lw * 0.6), tone(P.metalDark, night), 1);
    g.lineBetween(x + w * 0.5, top - u * 0.7, x + w * 0.5, top + 1);
    g.lineBetween(x + w * 0.68, top - u * 0.7, x + w * 0.68, top + 1);
    module(g, { x, top, w, h, r, lw, night });
    // observation window and glovebox port, lit while the crew works
    const working = !v?.sheltered && !v?.powerEmergency;
    g.fillStyle(P.metalDark, 1);
    g.fillRoundedRect(x + w * 0.16, top + h * 0.22, w * 0.42, h * 0.4, u * 0.7);
    g.fillStyle(windowColor(ctx, working), 1);
    g.fillRoundedRect(x + w * 0.18, top + h * 0.27, w * 0.38, h * 0.3, u * 0.5);
    viewport(g, x + w * 0.76, top + h * 0.42, u * 1.4, windowColor(ctx, working), lw);
    for (let i = 0; i < 3; i++) {
      g.fillStyle(working ? P.lightOk : 0x3a4262, 1);
      g.fillCircle(x + w * 0.2 + i * u * 0.9, top + h * 0.78, u * 0.26);
    }
    // high-gain dish on a tripod, pointed at Earth
    const dx = b.x + b.w * 0.84;
    const dy = b.y + b.h * 0.3;
    g.lineStyle(Math.max(1.5, lw * 0.8), tone(P.metalDark, night), 1);
    g.lineBetween(dx, dy, dx, base - u * 1.2);
    g.lineBetween(dx, base - u * 1.6, dx - u * 2, base - u * 0.2);
    g.lineBetween(dx, base - u * 1.6, dx + u * 2, base - u * 0.2);
    g.fillStyle(tone(P.metalDark, night), 1);
    g.fillRoundedRect(dx - u * 0.9, dy - u * 0.2, u * 1.8, u * 1.4, u * 0.3);
    const rim = (t, s = 1) => {
      const a = -0.6; // tilt toward the sky
      const ex = Math.cos(t) * u * 4.2 * s;
      const ey = Math.sin(t) * u * 1.5 * s;
      return { x: dx + ex * Math.cos(a) - ey * Math.sin(a), y: dy - u * 1.6 + ex * Math.sin(a) + ey * Math.cos(a) };
    };
    const dish = [];
    const inner = [];
    for (let i = 0; i <= 30; i++) { dish.push(rim((Math.PI * 2 * i) / 30)); inner.push(rim((Math.PI * 2 * i) / 30, 0.72)); }
    g.fillStyle(tone(P.metalLight, night), 1);
    g.fillPoints(dish, true);
    g.fillStyle(tone(P.blanketShade, night), 1);
    g.fillPoints(inner, true);
    g.lineStyle(Math.max(1, lw * 0.7), C.outline, 1);
    g.strokePoints(dish, true);
    // feed struts meeting at the focus
    const f = { x: dx - u * 1.6, y: dy - u * 4.6 };
    g.lineStyle(Math.max(1, lw * 0.45), tone(P.metalDark, night), 1);
    for (const t of [0, Math.PI * 0.62, Math.PI * 1.38]) { const p = rim(t, 0.95); g.lineBetween(p.x, p.y, f.x, f.y); }
    g.fillStyle(tone(P.foil, night), 1);
    g.fillCircle(f.x, f.y, u * 0.45);
  },

  // Storm shelter printed from Moon dust in thick layers, with an armoured door in a vestibule.
  shelter(ctx) {
    const { g, b, u, lw, night, v } = ctx;
    const cx = b.x + b.w / 2;
    const base = b.y + b.h;
    const rx = b.w / 2;
    const ry = b.h;
    const half = (y) => rx * Math.sqrt(Math.max(0, 1 - ((base - y) / ry) ** 2));
    const pts = [];
    for (let i = 0; i <= 36; i++) {
      const a = Math.PI + (Math.PI * i) / 36;
      pts.push({ x: cx + Math.cos(a) * rx, y: base + Math.sin(a) * ry });
    }
    g.fillStyle(tone(P.printed, night), 1);
    g.fillPoints(pts, true);
    // printed courses, alternating slightly in shade
    const layers = 9;
    for (let k = 0; k < layers; k++) {
      const y0 = base - (ry * (k + 1)) / layers;
      const y1 = base - (ry * k) / layers;
      if (k % 2) {
        const poly = [];
        for (let i = 0; i <= 8; i++) { const y = y0 + ((y1 - y0) * i) / 8; poly.push({ x: cx - half(y), y }); }
        for (let i = 8; i >= 0; i--) { const y = y0 + ((y1 - y0) * i) / 8; poly.push({ x: cx + half(y), y }); }
        g.fillStyle(0x000000, 0.07);
        g.fillPoints(poly, true);
      }
      g.lineStyle(Math.max(1, lw * 0.45), tone(P.printedLine, night), 0.8);
      g.lineBetween(cx - half(y0) + 1, y0, cx + half(y0) - 1, y0);
    }
    // sunlit left, shaded right
    const shade = [];
    for (let i = 0; i <= 12; i++) { const y = base - (ry * i) / 12; shade.push({ x: cx + half(y), y }); }
    for (let i = 12; i >= 0; i--) { const y = base - (ry * i) / 12; shade.push({ x: cx + half(y) * 0.45, y }); }
    g.fillStyle(0x000000, 0.14);
    g.fillPoints(shade, true);
    g.lineStyle(lw, C.outline, 1);
    g.strokePoints(pts, false);
    // vent stack and beacon
    g.fillStyle(tone(P.metal, night), 1);
    g.fillRect(cx + rx * 0.3, base - half(0) - ry * 0.86, u * 0.9, u * 2.2);
    g.fillStyle(v?.sheltered ? P.hazard : P.lightOk, 1);
    g.fillCircle(cx - rx * 0.05, base - ry - u * 0.2, u * 0.4);
    // vestibule, printed too
    const vw = Math.min(b.w * 0.36, u * 8);
    const vh = Math.min(b.h * 0.66, u * 7);
    const vx = cx - vw / 2;
    g.fillStyle(tone(P.printed, night, 0.35), 1);
    g.fillRoundedRect(vx, base - vh, vw, vh, { tl: vw / 2, tr: vw / 2, bl: 0, br: 0 });
    g.lineStyle(Math.max(1, lw * 0.4), tone(P.printedLine, night), 0.8);
    for (let k = 1; k < 5; k++) {
      const y = base - (vh * k) / 5;
      const d = insetAt(y, base - vh, vh * 2, vw / 2);
      g.lineBetween(vx + d + 1, y, vx + vw - d - 1, y);
    }
    g.lineStyle(lw, C.outline, 1);
    g.strokeRoundedRect(vx, base - vh, vw, vh, { tl: vw / 2, tr: vw / 2, bl: 0, br: 0 });
    // armoured door; its porthole glows when the crew is inside
    const dw = vw * 0.56;
    const dh = vh * 0.72;
    const dxl = cx - dw / 2;
    g.fillStyle(tone(P.door, night, 0.2), 1);
    g.fillRoundedRect(dxl, base - dh, dw, dh, { tl: dw * 0.3, tr: dw * 0.3, bl: 0, br: 0 });
    g.lineStyle(Math.max(1, lw * 0.4), 0x2a2e3a, 1);
    g.lineBetween(dxl + dw * 0.1, base - dh * 0.5, dxl + dw * 0.9, base - dh * 0.5);
    g.fillStyle(P.metal, 1);
    for (const [px, py] of [[0.18, 0.2], [0.82, 0.2], [0.18, 0.8], [0.82, 0.8]]) g.fillCircle(dxl + dw * px, base - dh * (1 - py) + dh * 0.05, u * 0.16);
    g.fillStyle(v?.sheltered ? C.windowNight : 0x252c4a, 1);
    g.fillCircle(cx, base - dh * 0.72, Math.min(dw * 0.2, u * 0.9));
    g.lineStyle(lw, C.outline, 1);
    g.strokeRoundedRect(dxl, base - dh, dw, dh, { tl: dw * 0.3, tr: dw * 0.3, bl: 0, br: 0 });
    // hazard stripes on the threshold
    const sw = u * 0.7;
    for (let i = 0, sx = vx; sx < vx + vw; sx += sw, i++) {
      g.fillStyle(i % 2 ? P.hazardDark : P.hazard, 1);
      g.fillRect(sx, base - u * 0.6, Math.min(sw, vx + vw - sx), u * 0.6);
    }
  },
};

/**
 * Docking ports per module. Mirrors the geometry in DRAW. Each port sits on the module wall at
 * (wx, y) and points outward along (dx, dy). `ground` is the floor line hoses may rest on.
 * `optional` ports only appear when a hose uses them; the others show a capped port when unused.
 */
const PORTS = {
  solar(b, u) {
    const base = b.y + b.h;
    return { r: { wx: b.x + b.w * 0.5 + u * 1.6, y: base - u * 1.4, dx: 1, dy: 0, small: true, ground: base } };
  },
  greenhouse(b, u) {
    const base = b.y + b.h;
    const x = b.x + u * 1.4;
    const w = b.w - u * 2.8;
    const y = base - u * 3;
    return {
      l: { wx: x, y, dx: -1, dy: 0, ground: base },
      r: { wx: x + w, y, dx: 1, dy: 0, ground: base },
      d: { wx: x + w * 0.16, y: base - u * 0.7, dx: 0, dy: 1, face: true, optional: true, ground: base },
    };
  },
  hab(b, u) {
    const base = b.y + b.h;
    const top = b.y + b.h * 0.26;
    const h = b.h * 0.56;
    const y = top + h * 0.66;
    const airW = b.w * 0.15;
    const lx = b.x + b.w - airW - u * 0.6;
    const lt = top + h * 0.14;
    const lh = h * 0.8;
    return {
      l: { wx: b.x + insetAt(y, top, h, h * 0.32), y, dx: -1, dy: 0, ground: base },
      r: { wx: b.x + b.w, y: lt + lh * 0.66, dx: 1, dy: 0, ground: base },
      t: { wx: lx + (airW + u * 0.6) / 2, y: lt, dx: 0, dy: -1, optional: true, ground: base },
    };
  },
  lab(b, u) {
    const base = b.y + b.h;
    const x = b.x + b.w * 0.02;
    const w = b.w * 0.64;
    const top = b.y + b.h * 0.4;
    const h = b.h * 0.44;
    const y = top + h * 0.62;
    const d = insetAt(y, top, h, h * 0.32);
    return { l: { wx: x + d, y, dx: -1, dy: 0, ground: base }, r: { wx: x + w - d, y, dx: 1, dy: 0, ground: base } };
  },
  shelter(b, u) {
    const base = b.y + b.h;
    const y = base - u * 2.4;
    const half = (b.w / 2) * Math.sqrt(Math.max(0, 1 - ((base - y) / b.h) ** 2));
    const cx = b.x + b.w / 2;
    return { l: { wx: cx - half, y, dx: -1, dy: 0, ground: base }, r: { wx: cx + half, y, dx: 1, dy: 0, ground: base } };
  },
};

const PORT_LEN = 1.3; // units the collar sticks out of the wall
const portSize = (p, u) => (p.small ? u * 1.3 : u * 2.6);
const portEnd = (p, u) => (p.face ? { x: p.wx, y: p.y } : { x: p.wx + p.dx * u * PORT_LEN, y: p.y + p.dy * u * PORT_LEN });

/** A docking collar: a short tube out of the wall, a flange ring, and a cap plate when nothing is attached. */
function dock(g, p, used, u, lw, night) {
  const s = portSize(p, u);
  const o = Math.max(1, lw * 0.55);
  if (p.face) {
    // a round hatch on the front of the module, facing the viewer
    g.fillStyle(tone(P.metal, night), 1);
    g.fillCircle(p.wx, p.y, s * 0.55);
    g.lineStyle(o, C.outline, 1);
    g.strokeCircle(p.wx, p.y, s * 0.55);
    g.fillStyle(tone(P.metalDark, night), 1);
    g.fillCircle(p.wx, p.y, s * 0.36);
    return;
  }
  const e = portEnd(p, u);
  const horiz = p.dy === 0;
  const inset = u * 0.25;
  // collar tube
  const x0 = horiz ? Math.min(p.wx - p.dx * inset, e.x) : e.x - s / 2;
  const y0 = horiz ? p.y - s / 2 : Math.min(p.y - p.dy * inset, e.y);
  const cw = horiz ? Math.abs(e.x - (p.wx - p.dx * inset)) : s;
  const chh = horiz ? s : Math.abs(e.y - (p.y - p.dy * inset));
  g.fillStyle(tone(P.metalLight, night), 1);
  g.fillRect(x0, y0, cw, chh);
  g.fillStyle(tone(P.metal, night), 1);
  if (horiz) g.fillRect(x0, y0 + chh * 0.62, cw, chh * 0.38);
  else g.fillRect(x0 + cw * 0.62, y0, cw * 0.38, chh);
  g.lineStyle(o, C.outline, 1);
  g.strokeRect(x0, y0, cw, chh);
  // flange ring at the outer end
  const fl = u * 0.45;
  const fx = horiz ? e.x - (p.dx > 0 ? fl : 0) : e.x - s / 2 - u * 0.3;
  const fy = horiz ? p.y - s / 2 - u * 0.3 : e.y - (p.dy > 0 ? fl : 0);
  const fw = horiz ? fl : s + u * 0.6;
  const fh = horiz ? s + u * 0.6 : fl;
  g.fillStyle(tone(P.metalDark, night), 1);
  g.fillRoundedRect(fx, fy, fw, fh, u * 0.15);
  g.lineStyle(o, C.outline, 1);
  g.strokeRoundedRect(fx, fy, fw, fh, u * 0.15);
  if (!used) {
    // cap plate with a yellow handle: "nothing docked here"
    g.fillStyle(tone(P.metalLight, night), 1);
    if (horiz) g.fillRect(e.x + (p.dx > 0 ? 0 : -u * 0.3), p.y - s * 0.38, u * 0.3, s * 0.76);
    else g.fillRect(e.x - s * 0.38, e.y + (p.dy > 0 ? 0 : -u * 0.3), s * 0.76, u * 0.3);
    g.fillStyle(P.hazard, 1);
    if (horiz) g.fillRect(e.x + p.dx * u * 0.3 - u * 0.12, p.y - u * 0.4, u * 0.24, u * 0.8);
    else g.fillRect(e.x - u * 0.4, e.y + p.dy * u * 0.3 - u * 0.12, u * 0.8, u * 0.24);
  }
}

/** Points along a cubic Bézier, spaced about `step` apart. */
function curve(p0, p1, p2, p3, step) {
  const at = (t) => {
    const m = 1 - t;
    return {
      x: m * m * m * p0.x + 3 * m * m * t * p1.x + 3 * m * t * t * p2.x + t * t * t * p3.x,
      y: m * m * m * p0.y + 3 * m * m * t * p1.y + 3 * m * t * t * p2.y + t * t * t * p3.y,
    };
  };
  const rough = [];
  for (let i = 0; i <= 80; i++) rough.push(at(i / 80));
  const out = [rough[0]];
  let acc = 0;
  for (let i = 1; i < rough.length; i++) {
    const a = rough[i - 1];
    const b = rough[i];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    acc += d;
    while (acc >= step) {
      acc -= step;
      const k = 1 - acc / (d || 1);
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
    }
  }
  out.push(rough[rough.length - 1]);
  return out;
}

/**
 * A flexible hose from port A to port B. It leaves each port straight, sags under its own
 * weight and rests on the ground between the modules. Air hoses are ribbed fabric; power is a cable.
 */
function hose(g, a, pa, b, pb, kind, ground, u, lw, night) {
  const power = kind === 'power';
  const hw = power ? u * 0.8 : u * 1.9;
  const span = Math.hypot(b.x - a.x, b.y - a.y);
  const reach = Math.max(u * 1.5, span * 0.33);
  // short hoses hang in a soft curve; long ones droop until they rest on the ground
  const sag = ground != null ? Math.min(u * 4, span * 0.3) : 0;
  const c1 = { x: a.x + pa.dx * reach, y: a.y + pa.dy * reach + sag };
  const c2 = { x: b.x + pb.dx * reach, y: b.y + pb.dy * reach + sag };
  let pts = curve(a, c1, c2, b, Math.max(1, hw * 0.18));
  if (ground != null) {
    pts = pts.map((p) => ({ x: p.x, y: Math.min(p.y, ground(p.x) - hw / 2 + u * 0.2) }));
  }
  const o = Math.max(1, lw * 0.55);
  g.fillStyle(C.outline, 1);
  for (const p of pts) g.fillCircle(p.x, p.y, hw / 2 + o);
  g.fillStyle(power ? tone(0x3a3f4d, night) : tone(P.blanket, night), 1);
  for (const p of pts) g.fillCircle(p.x, p.y, hw / 2);
  // shading on the underside
  g.fillStyle(power ? 0x262a35 : tone(P.blanketShade, night), 1);
  for (const p of pts) g.fillCircle(p.x, p.y + hw * 0.18, hw * 0.3);
  // ribs (air) or a yellow tracer stripe (power)
  if (power) {
    g.fillStyle(tone(P.hazard, night), 1);
    for (let i = 0; i < pts.length; i += 2) g.fillCircle(pts[i].x, pts[i].y - hw * 0.12, hw * 0.12);
    return;
  }
  g.lineStyle(Math.max(1, lw * 0.45), tone(P.seam, night), 1);
  const every = Math.max(2, Math.round((u * 0.9) / Math.max(1, hw * 0.18)));
  for (let i = every; i < pts.length - 1; i += every) {
    const p = pts[i];
    const q = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    const nx = -(q.y - p.y) / len;
    const ny = (q.x - p.x) / len;
    g.lineBetween(p.x + nx * hw * 0.48, p.y + ny * hw * 0.48, p.x - nx * hw * 0.48, p.y - ny * hw * 0.48);
  }
}
