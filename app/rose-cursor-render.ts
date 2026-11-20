import type { createRoseMotion, FragmentAnchor } from "./rose-cursor-motion";

type Region = { sx: number; sy: number; sw: number; sh: number };
export type RoseAtlas = {
  density: number;
  full: Region;
  center: Region;
  petals: readonly (Region & FragmentAnchor)[];
};

type RoseMotion = ReturnType<typeof createRoseMotion>;

export function createRoseRenderer(
  canvas: HTMLCanvasElement,
  particleNodes: readonly HTMLElement[],
  atlas: HTMLImageElement,
  artwork: RoseAtlas,
  motion: RoseMotion,
) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");
  const ctx = context;
  const density = artwork.density;
  const lastAmounts = artwork.petals.map(() => -1);
  const currentRegions = particleNodes.map(() => -1);
  const image = `url("${atlas.src}")`;

  function draw(region: Region) {
    const { sx, sy, sw, sh } = region;
    const width = sw / density;
    const height = sh / density;
    ctx.drawImage(atlas, sx, sy, sw, sh, -width / 2, -height / 2, width, height);
  }

  function renderRose() {
    if (motion.fragments.every((piece, index) => piece.amount === lastAmounts[index])) return;
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const zoom = canvas.width / 50;
    ctx.setTransform(zoom, 0, 0, zoom, canvas.width / 2, canvas.height / 2);
    const assembled = motion.fragments.every((piece) => piece.amount === 1);
    draw(assembled ? artwork.full : artwork.center);

    motion.fragments.forEach(({ amount, x, y }, index) => {
      lastAmounts[index] = amount;
      if (assembled || amount !== 1) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalCompositeOperation = "lighter";
      draw(artwork.petals[index]);
      ctx.restore();
    });

    motion.fragments.forEach(({ amount, x, y }, index) => {
      if (amount === 0 || amount === 1) return;
      const spread = 0.7 + amount * 0.3;
      ctx.save();
      ctx.translate(x * spread, y * spread);
      ctx.rotate((index % 2 === 0 ? 0.22 : -0.22) * (1 - amount));
      const scale = 0.7 + amount * 0.3;
      ctx.scale(scale, scale);
      ctx.globalAlpha = amount;
      draw(artwork.petals[index]);
      ctx.restore();
    });
  }

  function renderParticles() {
    motion.particles.forEach((particle, index) => {
      const node = particleNodes[index];
      if (!particle.life) {
        if (node.style.opacity !== "0") node.style.opacity = "0";
        return;
      }

      if (currentRegions[index] !== particle.fragment) {
        const { sx, sy, sw, sh } = artwork.petals[particle.fragment];
        const width = sw / density;
        const height = sh / density;
        node.style.width = `${width}px`;
        node.style.height = `${height}px`;
        node.style.backgroundImage = image;
        node.style.backgroundSize = `${atlas.width / density}px ${atlas.height / density}px`;
        node.style.backgroundPosition = `${-sx / density}px ${-sy / density}px`;
        currentRegions[index] = particle.fragment;
      }

      node.style.opacity = String(particle.opacity);
      node.style.transform = `translate3d(${particle.x}px, ${particle.y}px, 0) translate(-50%, -50%) rotate(${particle.angle}deg) scale(${particle.scale})`;
    });
  }

  return { renderRose, renderParticles };
}
