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
      // A flare makes the Sun glow for a moment (not the whole screen).
      this.flash = this.add.circle(0, 0, 10, 0xfff2c4, 1).setAlpha(0);
      this.earthG = this.add.graphics();
      this.groundG = this.add.graphics();
      this.baseG = this.add.graphics();
      this.imgLayer = this.add.container(0, 0);
      this.domeG = this.add.graphics();
      this.fxG = this.add.graphics();
      this.badgeLayer = this.add.container(0, 0);
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

    /** Stage rectangle in CSS pixels (the empty grid cell between the HUD parts). */
    setSlot(rect, dpr) {
      this.dpr = dpr;
      this.slot = { x: rect.x * dpr, y: rect.y * dpr, w: Math.max(1, rect.w * dpr), h: Math.max(1, rect.h * dpr) };
      if (this.sky) this.layout();
    }

    // ------------------------------------------------------------------ layout

    layout() {
      const W = this.scale.width;
      const H = this.scale.height;
      const s = this.slot;
      const tall = s.w / s.h < 1.15;
      this.tall = tall;
      // Ground line: the base stands on it. Leave room above for Earth and the Sun.
      this.groundY = s.y + s.h * (tall ? 0.5 : 0.58);
      const unit = tall ? Math.min(s.w / 66, s.h / 56) : Math.min(s.w / 108, s.h / 34);
      this.u = unit;
      const cx = s.x + s.w / 2;
      const gy = this.groundY;
      if (tall) {
        // Two rows: three rooms at the back, two bigger ones in front.
        const back = [['solar', 20, 13], ['greenhouse', 18, 12], ['lab', 20, 13]];
        const front = [['hab', 28, 16], ['shelter', 24, 12]];
        this.boxes = {
          ...row(back, cx, gy, unit, 2.5),
          ...row(front, cx, gy + unit * 21, unit, 4),
        };
        this.baseBottom = gy + unit * 21;
      } else {
        const one = [['solar', 18, 12], ['greenhouse', 17, 11], ['hab', 24, 14], ['lab', 19, 12], ['shelter', 19, 10]];
        this.boxes = row(one, cx, gy, unit, 3);
        this.baseBottom = gy;
      }
      const all = Object.values(this.boxes);
      const minX = Math.min(...all.map((b) => b.x));
      const maxX = Math.max(...all.map((b) => b.x + b.w));
      const minY = Math.min(...all.map((b) => b.y));
      this.dome = { cx: (minX + maxX) / 2, cy: this.baseBottom, rx: (maxX - minX) / 2 + unit * 5, ry: this.baseBottom - minY + unit * 7 };
      this.earth = { x: s.x + s.w * (tall ? 0.78 : 0.83), y: s.y + Math.max(unit * 10, s.h * 0.17), r: Math.max(14 * this.dpr, unit * (tall ? 6.5 : 5.2)) };
      this.sunPos = { x: s.x + s.w * 0.14, y: s.y + Math.max(unit * 8, s.h * 0.12), r: Math.max(10 * this.dpr, unit * 3.4) };

      this.flash.setPosition(this.sunPos.x, this.sunPos.y).setRadius(this.sunPos.r * 2.6);
      for (const [id, p] of [['earth', this.earth], ['sun', this.sunPos]]) {
        const size = Math.max(p.r * 2.6, 48 * this.dpr);
        this.skyZones[id].setPosition(p.x, p.y).setSize(size, size);
        this.skyZones[id].input.hitArea.setSize(size, size);
      }
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
      const fs = Math.round(Math.max(12 * this.dpr, Math.min(16 * this.dpr, this.u * 2.6)));
      for (const id of ROOM_IDS) {
        const b = this.boxes[id];
        const t = this.add.text(b.x + b.w / 2, b.y + b.h + this.u * 1.2, ROOMS[id].short, {
          fontFamily: 'Lexend, system-ui, sans-serif', fontSize: `${fs}px`, fontStyle: '600', color: C.label,
          stroke: '#070b18', strokeThickness: Math.round(fs * 0.3),
        }).setOrigin(0.5, 0);
        this.labelLayer.add(t);
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
      // Space Apps rule: SI-generated images carry a visible watermark. The placeholder visuals
      // are drawn by SI-written code, so they are marked until the team's own art replaces them.
      if (this.art.siPlaceholders !== false) {
        const s = this.slot;
        const wfs = Math.round(11 * this.dpr);
        const mark = this.add.text(s.x + 8 * this.dpr, s.y + s.h - 6 * this.dpr, 'SI-generated placeholder art', {
          fontFamily: 'Lexend, system-ui, sans-serif', fontSize: `${wfs}px`, fontStyle: '600', color: '#c9d3f2',
          backgroundColor: 'rgba(7,11,24,0.55)', padding: { x: 5 * this.dpr, y: 2 * this.dpr },
        }).setOrigin(0, 1).setAlpha(0.85);
        this.labelLayer.add(mark);
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

    drawGround(night) {
      const W = this.scale.width;
      const H = this.scale.height;
      const gy = this.groundY;
      const u = this.u;
      const g = this.groundG.clear();
      g.fillStyle(night ? C.groundNight : C.groundDay, 1);
      g.beginPath();
      g.moveTo(0, gy + u * 2);
      const steps = 12;
      for (let i = 0; i <= steps; i++) {
        const x = (W * i) / steps;
        const bump = Math.sin(i * 1.7) * u * 0.9 + Math.cos(i * 0.6) * u * 1.2;
        g.lineTo(x, gy - u * 0.5 + bump);
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
      g.fillStyle(C.earthLit, 0.12);
      g.fillCircle(x, y, r * 1.18);
      g.fillStyle(C.earthDark, 1);
      g.fillCircle(x, y, r);
      // Lit part faces the Sun (drawn on the left). lit = fraction of Earth's disc in sunlight.
      const f = Phaser.Math.Clamp(lit, 0, 1);
      if (f > 0.02) {
        g.fillStyle(C.earthLit, 1);
        g.slice(x, y, r, Math.PI / 2, (Math.PI * 3) / 2, false);
        g.fillPath();
        if (f >= 0.5) {
          g.fillEllipse(x, y, 2 * r * (2 * f - 1), 2 * r);
        } else {
          g.fillStyle(C.earthDark, 1);
          g.fillEllipse(x, y, 2 * r * (1 - 2 * f) + 1, 2 * r + 1);
        }
        // a few clouds on the lit side
        g.fillStyle(C.earthCloud, 0.55);
        g.fillEllipse(x - r * 0.35, y - r * 0.35, r * 0.7, r * 0.18);
        g.fillEllipse(x - r * 0.5, y + r * 0.25, r * 0.5, r * 0.14);
      }
      g.lineStyle(Math.max(1, r * 0.06), C.earthLit, 0.5);
      g.strokeCircle(x, y, r);
    }

    drawBase(v) {
      const g = this.baseG.clear();
      this.imgLayer.removeAll(true);
      const night = v ? !v.daylight : false;
      const u = this.u;
      const lw = Math.max(1.5, u * 0.35);
      // tubes between rooms (one row only)
      if (!this.tall) {
        const order = ['solar', 'greenhouse', 'hab', 'lab', 'shelter'];
        g.fillStyle(night ? 0x8e93a8 : 0xc9c5bb, 1);
        for (let i = 1; i < order.length; i++) {
          const a = this.boxes[order[i - 1]];
          const b = this.boxes[order[i]];
          if (order[i - 1] === 'solar') continue;
          g.fillRect(a.x + a.w - u, this.groundY - u * 4, b.x - a.x - a.w + u * 2, u * 2.6);
        }
      }
      for (const id of ROOM_IDS) {
        const b = this.boxes[id];
        const status = v?.rooms?.[id] ?? 'ok';
        // shadow
        g.fillStyle(0x000000, 0.22);
        g.fillEllipse(b.x + b.w / 2, b.y + b.h, b.w * 1.05, u * 2.2);
        if (this.textures.exists(`room-${id}`)) {
          const img = this.add.image(b.x + b.w / 2, b.y + b.h, `room-${id}`).setOrigin(0.5, 1);
          img.setScale(Math.min(b.w / img.width, b.h / img.height));
          if (status === 'lost') img.setTint(0x555a70);
          this.imgLayer.add(img);
          continue;
        }
        const ctx = { g, b, u, lw, night, status, v };
        DRAW[id](ctx);
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
    }

    // ------------------------------------------------------------------ per-frame

    update(time, deltaMs) {
      const v = this.view;
      if (!v || !this.boxes) return;
      const dt = Math.min(0.05, deltaMs / 1000);
      const sig = `${v.daylight}|${JSON.stringify(v.rooms)}|${v.dust}|${v.filter}|${v.sheltered}|${v.powerEmergency}`;
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
        const kind = v.repairs?.[id];
        const badge = this.badges[id];
        badge.setVisible(Boolean(kind));
        if (kind) {
          const rebuild = kind === 'rebuild';
          badge.disc.setFillStyle(rebuild ? 0x2c3863 : C.alert);
          badge.mark.setText(rebuild ? '+' : '!').setColor(rebuild ? '#f3f0e8' : '#2b0a00');
        }
      }

      // shield dome eases to its level
      const target = [0, 0.13, 0.22, 0.32][v.shield] ?? 0;
      this.shieldAlpha += (target - this.shieldAlpha) * Math.min(1, dt * 4);
      this.drawDome();
      this.updateParticles(dt, v);
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
      const speed = H * (0.5 + Math.min(0.6, Math.log10(times) * 0.15));
      const len = 14 * this.dpr;
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
        g.lineStyle(head * 1.1, C.particle, 0.5);
        g.lineBetween(p.x, p.y, p.x - p.dx * len, p.y - p.dy * len);
        g.fillStyle(C.particle, 0.35);
        g.fillCircle(p.x, p.y, head * 2.2);
        g.fillStyle(C.particle, 1);
        g.fillCircle(p.x, p.y, head * 1.3);
        g.fillStyle(C.spark, 1);
        g.fillCircle(p.x, p.y, head * 0.6);
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
      // Particles stream out of the Sun in a fan towards the base and the ground.
      // At night the Sun is below the horizon, so they come in from the top-left corner instead.
      const night = this.view && this.view.daylight === false;
      const s = !night && this.sunPos ? this.sunPos : { x: -this.scale.width * 0.15, y: -this.scale.height * 0.1, r: 0 };
      const a = (8 + Math.random() * 62) * Math.PI / 180; // between almost flat and steeply down
      const dx = Math.cos(a), dy = Math.sin(a);
      const d = s.r + (anywhere ? Math.random() * this.scale.width * 0.9 : 0);
      return { x: s.x + dx * d, y: s.y + dy * d, dx, dy, v: 0.75 + Math.random() * 0.5, checked: false };
    }

    // ------------------------------------------------------------------ effects

    flare(score) {
      // Only the Sun glows, once and softly (no full-screen flash, no shake).
      if (this.view && this.view.daylight === false) return;
      const big = score >= 400; // X class
      this.tweens.killTweensOf(this.flash);
      this.flash.setAlpha(0).setScale(1);
      this.tweens.add({
        targets: this.flash, alpha: big ? 0.8 : 0.5, scale: big ? 1.6 : 1.3,
        duration: this.reduced ? 400 : 260, ease: 'Quad.easeOut', yoyo: true, hold: 200,
        onComplete: () => this.flash.setAlpha(0).setScale(1),
      });
    }

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

const hullColor = (night) => (night ? C.hullNight : C.hull);
const windowColor = (ctx, on = true) => (!on || ctx.v?.powerEmergency ? C.windowOff : ctx.night ? C.windowNight : C.windowDay);

const DRAW = {
  solar({ g, b, u, lw, v }) {
    const n = 3;
    const pw = b.w / n;
    for (let i = 0; i < n; i++) {
      const x = b.x + i * pw + u * 0.6;
      const w = pw - u * 1.2;
      const top = b.y + b.h * 0.08;
      const bot = b.y + b.h * 0.62;
      g.lineStyle(lw, C.outline, 1);
      g.lineBetween(x + w / 2, bot, x + w / 2, b.y + b.h);
      const pts = [{ x: x + u * 0.8, y: top }, { x: x + w, y: top }, { x: x + w - u * 0.8, y: bot }, { x, y: bot }];
      g.fillStyle(v?.dust ? C.dust : C.panel, 1);
      g.fillPoints(pts, true);
      g.lineStyle(lw * 0.6, v?.dust ? 0x6f6148 : C.panelLine, 0.8);
      for (let k = 1; k < 3; k++) {
        const ty = top + ((bot - top) * k) / 3;
        g.lineBetween(x + u * 0.8 * (1 - k / 3), ty, x + w - u * 0.8 * (k / 3), ty);
      }
      g.lineBetween(x + w / 2 + u * 0.4, top, x + w / 2 - u * 0.4, bot);
      g.lineStyle(lw, C.outline, 1);
      g.strokePoints(pts, true);
    }
  },

  greenhouse({ g, b, u, lw, night, status }) {
    const cx = b.x + b.w / 2;
    const base = b.y + b.h;
    const rx = b.w / 2;
    const ry = b.h;
    g.fillStyle(hullColor(night), 1);
    g.fillRect(b.x, base - u * 1.6, b.w, u * 1.6);
    const pts = [];
    for (let i = 0; i <= 28; i++) {
      const a = Math.PI + (Math.PI * i) / 28;
      pts.push({ x: cx + Math.cos(a) * rx, y: base - u * 1.6 + Math.sin(a) * (ry - u * 1.6) });
    }
    g.fillStyle(C.glass, night ? 0.35 : 0.5);
    g.fillPoints(pts, true);
    if (status !== 'lost') {
      g.fillStyle(C.plant, 1);
      for (let i = 0; i < 5; i++) {
        const px = b.x + b.w * (0.18 + i * 0.16);
        g.fillEllipse(px, base - u * 2.6, u * 2.6, u * 3.4);
        g.fillEllipse(px + u * 0.6, base - u * 4, u * 1.8, u * 2.4);
      }
    }
    g.lineStyle(lw, C.outline, 1);
    g.strokePoints(pts, false);
    g.lineStyle(lw * 0.6, C.outline, 0.7);
    g.lineBetween(cx, base - ry, cx, base - u * 1.6);
    g.strokeRect(b.x, base - u * 1.6, b.w, u * 1.6);
  },

  hab(ctx) {
    const { g, b, u, lw, night } = ctx;
    const top = b.y + b.h * 0.18;
    const h = b.h * 0.7;
    g.fillStyle(0x8e93a8, 1);
    g.fillRect(b.x + u * 2, top + h, u * 1.2, b.h - h - (top - b.y));
    g.fillRect(b.x + b.w - u * 3.2, top + h, u * 1.2, b.h - h - (top - b.y));
    g.fillStyle(hullColor(night), 1);
    g.fillRoundedRect(b.x, top, b.w, h, h * 0.45);
    g.lineStyle(lw, C.outline, 1);
    g.strokeRoundedRect(b.x, top, b.w, h, h * 0.45);
    // hatch on top
    g.fillStyle(hullColor(night), 1);
    g.fillRoundedRect(b.x + b.w * 0.42, top - u * 2.2, b.w * 0.16, u * 2.6, u * 0.6);
    g.strokeRoundedRect(b.x + b.w * 0.42, top - u * 2.2, b.w * 0.16, u * 2.6, u * 0.6);
    // windows
    const wy = top + h * 0.42;
    for (let i = 0; i < 4; i++) {
      const wx = b.x + b.w * (0.2 + i * 0.2);
      g.fillStyle(windowColor(ctx, !ctx.v?.sheltered), 1);
      g.fillCircle(wx, wy, u * 1.5);
      g.lineStyle(lw * 0.7, C.outline, 1);
      g.strokeCircle(wx, wy, u * 1.5);
    }
    // stripe
    g.fillStyle(0xffbf3c, 0.9);
    g.fillRect(b.x + h * 0.3, top + h * 0.78, b.w - h * 0.6, u * 0.8);
  },

  lab(ctx) {
    const { g, b, u, lw, night } = ctx;
    const top = b.y + b.h * 0.38;
    const h = b.h * 0.62;
    g.fillStyle(hullColor(night), 1);
    g.fillRoundedRect(b.x, top, b.w, h, u * 2.2);
    g.lineStyle(lw, C.outline, 1);
    g.strokeRoundedRect(b.x, top, b.w, h, u * 2.2);
    // dish antenna
    const dx = b.x + b.w * 0.72;
    g.lineStyle(lw, C.outline, 1);
    g.lineBetween(dx, top, dx, b.y + b.h * 0.16);
    g.fillStyle(hullColor(night), 1);
    g.slice(dx, b.y + b.h * 0.14, u * 3.6, Math.PI * 0.85, Math.PI * 1.85, false);
    g.fillPath();
    g.strokePath();
    // windows (lit when the crew works)
    const working = !ctx.v?.sheltered && !ctx.v?.powerEmergency;
    for (let i = 0; i < 2; i++) {
      g.fillStyle(windowColor(ctx, working), 1);
      g.fillRoundedRect(b.x + b.w * (0.14 + i * 0.3), top + h * 0.28, b.w * 0.2, h * 0.36, u * 0.6);
    }
    g.fillStyle(0x8fe36b, 0.9);
    g.fillRect(b.x + u * 1.6, top + h * 0.8, b.w - u * 3.2, u * 0.7);
  },

  shelter(ctx) {
    const { g, b, u, lw, night } = ctx;
    const cx = b.x + b.w / 2;
    const base = b.y + b.h;
    const pts = [];
    for (let i = 0; i <= 28; i++) {
      const a = Math.PI + (Math.PI * i) / 28;
      pts.push({ x: cx + Math.cos(a) * (b.w / 2), y: base + Math.sin(a) * b.h });
    }
    g.fillStyle(night ? C.regolithNight : C.regolith, 1);
    g.fillPoints(pts, true);
    g.lineStyle(lw, C.outline, 1);
    g.strokePoints(pts, false);
    // regolith bags
    g.lineStyle(lw * 0.6, C.outline, 0.45);
    for (let r = 1; r <= 2; r++) {
      const yy = base - (b.h * r) / 3;
      g.lineBetween(cx - b.w * 0.42 * (1 - r * 0.22), yy, cx + b.w * 0.42 * (1 - r * 0.22), yy);
    }
    // door, glowing when the crew is inside
    const inside = ctx.v?.sheltered;
    g.fillStyle(inside ? C.windowNight : 0x252c4a, 1);
    g.fillRoundedRect(cx - u * 2.4, base - u * 5.6, u * 4.8, u * 5.6, { tl: u * 2.4, tr: u * 2.4, bl: 0, br: 0 });
    g.lineStyle(lw, C.outline, 1);
    g.strokeRoundedRect(cx - u * 2.4, base - u * 5.6, u * 4.8, u * 5.6, { tl: u * 2.4, tr: u * 2.4, bl: 0, br: 0 });
  },
};
