"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import atlasData from "./rose-cursor-atlas.json";
import { createRoseMotion, roseParticleLimit } from "./rose-cursor-motion";
import { createRoseRenderer } from "./rose-cursor-render";
import "./petal-cursor.css";

const photoTargets = ".bouquet-image, .gallery-photo, .detail-photo, .lightbox img, .studio-image";
const actionTargets = 'a[href]:not([aria-disabled="true"]), button:not(:disabled):not([aria-disabled="true"]), summary';
const nativeTargets = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

type PointerPosition = { x: number; y: number };

export function PetalCursor() {
  const layer = useRef<HTMLDivElement>(null);
  const positioner = useRef<HTMLDivElement>(null);
  const driftLayer = useRef<HTMLDivElement>(null);
  const impactLayer = useRef<HTMLDivElement>(null);
  const bloom = useRef<HTMLCanvasElement>(null);
  const particleLayer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const surface = layer.current;
    const anchor = positioner.current;
    const drift = driftLayer.current;
    const impact = impactLayer.current;
    const rose = bloom.current;
    const pool = particleLayer.current;
    if (!surface || !anchor || !drift || !impact || !rose || !pool) return;

    const media = gsap.matchMedia();
    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const cursor = surface;
      const root = document.documentElement;
      const supportsTopLayer = typeof cursor.showPopover === "function";
      const setX = gsap.quickSetter(anchor, "x", "px");
      const setY = gsap.quickSetter(anchor, "y", "px");
      const setDriftX = gsap.quickSetter(drift, "x", "px");
      const setDriftY = gsap.quickSetter(drift, "y", "px");
      const setTilt = gsap.quickSetter(drift, "rotation", "deg");
      const click = gsap.timeline({ paused: true })
        .to(impact, { scaleX: 0.95, scaleY: 0.85, duration: 0.09, ease: "power2.out" })
        .to(impact, { scaleX: 1, scaleY: 1, duration: 0.24, ease: "sine.out" });

      const animation = createRoseMotion(atlasData.petals);
      let scene: ReturnType<typeof createRoseRenderer> | undefined;
      let modal = document.querySelector("dialog[open]");
      let position: PointerPosition | null = null;
      let targetFrame = 0;
      let motionFrame = 0;
      let size = 1;
      let visible = false;
      let active = true;

      function updateLayer() {
        if (!supportsTopLayer) return;
        if (cursor.matches(":popover-open")) cursor.hidePopover();
        if (visible && modal) cursor.showPopover();
      }

      function render(now: number) {
        motionFrame = 0;
        if (!visible || !scene) return;
        const stillAnimating = animation.advance(now, size);
        const { state, tilt, driftX, driftY } = animation.pose;
        if (cursor.dataset.motion !== state) cursor.dataset.motion = state;
        setDriftX(driftX);
        setDriftY(driftY);
        setTilt(tilt);
        scene.renderRose();
        scene.renderParticles();
        if (stillAnimating) motionFrame = requestAnimationFrame(render);
      }

      function hide() {
        if (!visible) return;
        visible = false;
        delete root.dataset.petalCursor;
        delete cursor.dataset.visible;
        delete cursor.dataset.motion;
        cancelAnimationFrame(motionFrame);
        motionFrame = 0;
        animation.reset();
        click.pause(0);
        updateLayer();
      }

      function forgetPointer() {
        position = null;
        hide();
      }

      function updateTarget(element: Element | null) {
        if (!scene || !element || !position || element.closest(nativeTargets) || (modal && !supportsTopLayer)) {
          hide();
          return;
        }
        const mode = element.closest(photoTargets) ? "photo" : element.closest(actionTargets) ? "action" : "rose";
        if (cursor.dataset.state !== mode) {
          size = mode === "photo" ? 1.12 : mode === "action" ? 0.92 : 1;
          cursor.dataset.state = mode;
        }
        if (visible) return;

        setX(position.x);
        setY(position.y);
        setDriftX(0);
        setDriftY(0);
        setTilt(0);
        animation.move(position.x, position.y, performance.now());
        scene.renderRose();
        scene.renderParticles();
        visible = true;
        cursor.dataset.visible = "true";
        cursor.dataset.motion = "idle";
        root.dataset.petalCursor = "true";
        updateLayer();
      }

      function move(event: PointerEvent) {
        if (event.pointerType !== "mouse") {
          forgetPointer();
          return;
        }
        const x = event.clientX;
        const y = event.clientY;
        const changed = !position || position.x !== x || position.y !== y;
        position = { x, y };
        const wasVisible = visible;
        updateTarget(event.target instanceof Element ? event.target : null);
        if (!visible || !wasVisible || !changed) return;

        setX(x);
        setY(y);
        animation.move(x, y, performance.now());
        if (!motionFrame) motionFrame = requestAnimationFrame(render);
      }

      function syncTarget() {
        targetFrame = 0;
        if (position) updateTarget(document.elementFromPoint(position.x, position.y));
      }

      function scheduleTarget() {
        if (position && !targetFrame) targetFrame = requestAnimationFrame(syncTarget);
      }

      function handlePress(event: PointerEvent) {
        if (event.pointerType !== "mouse") forgetPointer();
        else if (visible && event.button === 0) click.restart();
      }

      function handleExit(event: PointerEvent) {
        if (!event.relatedTarget) forgetPointer();
      }

      const atlas = new window.Image();
      atlas.src = "/media/rose-cursor/atlas.webp";
      void atlas.decode().then(() => {
        if (!active || !rose.getContext("2d")) return;
        scene = createRoseRenderer(rose, Array.from(pool.children) as HTMLElement[], atlas, atlasData, animation);
        scheduleTarget();
      }, () => {});

      // A manual popover keeps the decorative layer above a native modal.
      const modalObserver = new MutationObserver(() => {
        const current = document.querySelector("dialog[open]");
        if (current === modal) return;
        modal = current;
        updateLayer();
        scheduleTarget();
      });
      modalObserver.observe(document.body, { attributes: true, attributeFilter: ["open"], subtree: true });

      document.addEventListener("pointermove", move, { passive: true, capture: true });
      document.addEventListener("pointerdown", handlePress, { passive: true, capture: true });
      document.addEventListener("pointerout", handleExit, { passive: true });
      document.addEventListener("visibilitychange", forgetPointer);
      document.addEventListener("scroll", scheduleTarget, { passive: true, capture: true });
      window.addEventListener("resize", scheduleTarget);
      window.addEventListener("blur", forgetPointer);
      return () => {
        active = false;
        modalObserver.disconnect();
        document.removeEventListener("pointermove", move, true);
        document.removeEventListener("pointerdown", handlePress, true);
        document.removeEventListener("pointerout", handleExit);
        document.removeEventListener("visibilitychange", forgetPointer);
        document.removeEventListener("scroll", scheduleTarget, true);
        window.removeEventListener("resize", scheduleTarget);
        window.removeEventListener("blur", forgetPointer);
        cancelAnimationFrame(targetFrame);
        forgetPointer();
        click.kill();
      };
    });

    return () => media.revert();
  }, []);

  return (
    <div className="petal-cursor" ref={layer} popover="manual" aria-hidden="true">
      <div className="petal-cursor-origin" ref={positioner}>
        <div className="petal-cursor-origin" ref={driftLayer}>
          <div className="petal-cursor-origin" ref={impactLayer}>
            <canvas className="petal-cursor-rose" ref={bloom} width={150} height={150} />
          </div>
        </div>
      </div>
      <div ref={particleLayer}>
        {Array.from({ length: roseParticleLimit }, (_, index) => (
          <span className="petal-cursor-fragment" key={index} />
        ))}
      </div>
    </div>
  );
}

