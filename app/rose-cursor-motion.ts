export type CursorMotion = "idle" | "moving" | "fast";
export type FragmentAnchor = { x: number; y: number };

const fastEntry = 1150;
const fastExit = 710;
const recoveryDuration = 465;
const recoveryStagger = 26;
export const roseParticleLimit = 10;

const clamp = (min: number, max: number, value: number) => Math.min(max, Math.max(min, value));
const easeOut = (progress: number) => 1 - (1 - progress) ** 3;

export function createRoseMotion(anchors: readonly FragmentAnchor[], random = Math.random) {
  const fragments = anchors.map((anchor) => ({
    ...anchor,
    amount: 1,
    rebuildAt: 0,
    rebuildFrom: 1,
  }));
  const particles = Array.from({ length: roseParticleLimit }, () => ({
    fragment: 0,
    age: 0,
    life: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    spin: 0,
    phase: 0,
    opacity: 0,
    initialScale: 1,
    scale: 1,
  }));
  const pose = { x: 0, y: 0, tilt: 0, driftX: 0, driftY: 0, state: "idle" as CursorMotion };
  let pointerAt = -1;
  let advancedAt = -1;
  let vx = 0;
  let vy = 0;
  let nextRelease = 0;
  let nextFragment = 0;
  let pendingRecovery = false;

  function move(x: number, y: number, now: number) {
    if (pointerAt >= 0) {
      const seconds = clamp(0.008, 0.045, (now - pointerAt) / 1000);
      const dx = (x - pose.x) / seconds;
      const dy = (y - pose.y) / seconds;
      const limit = Math.max(1, Math.hypot(dx, dy) / 5500);
      const blend = 1 - Math.exp(-seconds / 0.035);
      vx += (dx / limit - vx) * blend;
      vy += (dy / limit - vy) * blend;
    }
    pose.x = x;
    pose.y = y;
    pointerAt = now;
  }

  function release(now: number, speed: number, size: number) {
    const particle = particles.find((candidate) => candidate.life === 0);
    if (!particle) return;
    for (let attempt = 0; attempt < fragments.length; attempt++) {
      const index = nextFragment;
      nextFragment = (index + 1) % fragments.length;
      const fragment = fragments[index];
      if (fragment.amount < 0.92) continue;

      const directionX = vx / speed;
      const directionY = vy / speed;
      const sideFlow = (random() - 0.5) * 29;
      const impulse = clamp(74, 225, speed * 0.082) * (0.79 + random() * 0.35);
      const lean = pose.tilt * Math.PI / 180;
      const cos = Math.cos(lean);
      const sin = Math.sin(lean);
      particle.fragment = index;
      particle.age = 0;
      particle.life = 0.56 + random() * 0.26;
      particle.x = pose.x + pose.driftX + (fragment.x * cos - fragment.y * sin) * size;
      particle.y = pose.y + pose.driftY + (fragment.x * sin + fragment.y * cos) * size;
      particle.vx = -directionX * impulse - directionY * sideFlow;
      particle.vy = -directionY * impulse + directionX * sideFlow + 10;
      particle.angle = pose.tilt;
      particle.spin = (random() - 0.5) * 225;
      particle.phase = random() * Math.PI * 2;
      particle.opacity = 1;
      particle.initialScale = particle.scale = size;
      fragment.amount = 0;
      fragment.rebuildAt = 0;
      pendingRecovery = true;
      nextRelease = now + clamp(32, 83, 101 - speed * 0.014);
      return;
    }
  }

  function advance(now: number, size = 1): boolean {
    if (pointerAt < 0) return false;
    const elapsed = advancedAt < 0 ? 16 : Math.max(0, now - advancedAt);
    const seconds = Math.min(0.045, elapsed / 1000);
    advancedAt = now;
    const silence = now - pointerAt;
    if (silence > 26) {
      const drag = Math.exp(-seconds / 0.033);
      vx *= drag;
      vy *= drag;
    }

    const speed = Math.hypot(vx, vy);
    const threshold = pose.state === "fast" ? fastExit : fastEntry;
    pose.state = speed > threshold && silence < 100 ? "fast" : speed > 22 && silence < 175 ? "moving" : "idle";
    const force = clamp(0, 1, speed / 1250);
    const blend = 1 - Math.exp(-seconds / 0.04);
    const divisor = Math.max(speed, 1);
    const roll = ((vx * 9 + vy * 3) / divisor) * force;
    const flutter = Math.sin(now / 36) * force * 1.35;
    pose.tilt += (roll + flutter - pose.tilt) * blend;
    pose.driftX += ((-vx / divisor) * 3.1 * force - pose.driftX) * blend;
    pose.driftY += ((-vy / divisor) * 3.1 * force - pose.driftY) * blend;

    if (pose.state === "fast") {
      for (const fragment of fragments) {
        if (fragment.rebuildAt) {
          fragment.rebuildAt = 0;
          pendingRecovery = true;
        }
      }
      if (now >= nextRelease) release(now, speed, size);
    } else if (pendingRecovery) {
      pendingRecovery = false;
      let delay = 0;
      for (const fragment of fragments) {
        if (fragment.amount < 1 && !fragment.rebuildAt) {
          fragment.rebuildFrom = fragment.amount;
          fragment.rebuildAt = now + delay;
          delay += recoveryStagger;
        }
      }
    }

    let animating = pose.state !== "idle";
    for (const fragment of fragments) {
      if (!fragment.rebuildAt) continue;
      const progress = clamp(0, 1, (now - fragment.rebuildAt) / recoveryDuration);
      fragment.amount = fragment.rebuildFrom + (1 - fragment.rebuildFrom) * easeOut(progress);
      if (progress === 1) fragment.rebuildAt = 0;
      else animating = true;
    }

    for (const particle of particles) {
      if (particle.life === 0) continue;
      particle.age += seconds;
      const progress = particle.age / particle.life;
      if (progress >= 1) {
        particle.life = 0;
        particle.opacity = 0;
        continue;
      }
      const drag = Math.exp(-seconds * 2.1);
      particle.vx *= drag;
      particle.vy = particle.vy * drag + 205 * seconds;
      particle.x += (particle.vx + Math.sin(particle.phase + particle.age * 12) * 8) * seconds;
      particle.y += particle.vy * seconds;
      particle.angle += particle.spin * seconds * (1 - progress * 0.42);
      particle.opacity = 1 - clamp(0, 1, (progress - 0.29) / 0.71) ** 1.6;
      particle.scale = particle.initialScale * (1 - progress * 0.12);
      animating = true;
    }

    if (!animating && Math.abs(pose.tilt) + Math.abs(pose.driftX) + Math.abs(pose.driftY) < 0.05) {
      pose.tilt = pose.driftX = pose.driftY = 0;
      vx = vy = 0;
      advancedAt = -1;
      return false;
    }
    return true;
  }

  function reset() {
    pointerAt = advancedAt = -1;
    nextRelease = nextFragment = 0;
    vx = vy = pose.tilt = pose.driftX = pose.driftY = 0;
    pose.state = "idle";
    pendingRecovery = false;
    for (const fragment of fragments) {
      fragment.amount = 1;
      fragment.rebuildAt = 0;
    }
    for (const particle of particles) particle.life = 0;
  }

  return { move, advance, reset, pose, fragments, particles };
}
