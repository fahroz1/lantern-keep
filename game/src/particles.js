// Lantern Keep — particles, floating text, and screen shake.
// Pure visual juice; nothing here affects gameplay.

export function createFx() {
  return {
    particles: [],
    texts: [],
    shake: 0,
    shakeX: 0,
    shakeY: 0,

    burst(x, y, color, n, speed) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (speed || 90) * (0.4 + Math.random() * 0.8);
        this.particles.push({
          x, y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - 20,
          life: 0.45 + Math.random() * 0.35,
          maxLife: 0.8,
          size: 2 + Math.random() * 3,
          color,
        });
      }
    },

    emberDrift(x, y) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 8,
        vy: -14 - Math.random() * 18,
        life: 1.2 + Math.random() * 0.8,
        maxLife: 2.0,
        size: 1.5 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#ffb347' : '#ff7b2f',
      });
    },

    floatText(x, y, text, color) {
      this.texts.push({ x, y, text, color: color || '#ffd166', life: 0.9, maxLife: 0.9 });
    },

    addShake(amount) {
      this.shake = Math.min(10, this.shake + amount);
    },

    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 30 * dt;
        p.vx *= 1 - dt * 1.5;
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.life -= dt;
        t.y -= 34 * dt;
        if (t.life <= 0) this.texts.splice(i, 1);
      }
      if (this.shake > 0) {
        this.shake = Math.max(0, this.shake - dt * 26);
        this.shakeX = (Math.random() - 0.5) * this.shake;
        this.shakeY = (Math.random() - 0.5) * this.shake;
      } else {
        this.shakeX = 0;
        this.shakeY = 0;
      }
    },
  };
}
