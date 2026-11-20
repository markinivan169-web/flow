"use client";

import Image from "next/image";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ArrowLeft, ArrowRight, ArrowUpRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { bouquets } from "./site";

type PhotoPosition = { rect: DOMRect; src: string; transform: string };

export function captureBouquetPhoto(id: string): PhotoPosition | undefined {
  const frame = document.getElementById(`bouquet-image-${id}`);
  const image = frame?.querySelector("img");
  if (!frame || !image?.naturalWidth) return;
  return {
    rect: frame.getBoundingClientRect(),
    src: image.currentSrc || image.src,
    transform: getComputedStyle(image).transform,
  };
}

export type BouquetSelection = {
  index: number;
  origin?: PhotoPosition;
  opener: HTMLElement;
};

function movePhoto(
  dialog: HTMLDialogElement,
  image: PhotoPosition,
  from: DOMRect,
  to: DOMRect,
  returning: boolean,
  onComplete: () => void,
  destinationSrc?: string,
) {
  const layer = document.createElement("div");
  layer.className = "bouquet-flight";
  layer.setAttribute("aria-hidden", "true");
  const clone = new window.Image();
  clone.src = image.src;
  clone.alt = "";
  layer.append(clone);
  dialog.append(layer);

  function place(rect: DOMRect) {
    Object.assign(layer.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
  }

  place(from);
  const first = Flip.getState(layer);
  place(to);
  const duration = returning ? 0.55 : 0.66;
  const ease = "power3.inOut";
  const flip = Flip.from(first, { scale: true, duration, ease });
  const animation = gsap.timeline({ onComplete: () => { layer.remove(); onComplete(); } });
  animation.add(flip, 0);
  if (image.transform !== "none") {
    animation.fromTo(clone, { transform: image.transform }, { scale: 1, duration, ease }, 0);
  }
  if (destinationSrc) {
    const destination = new window.Image();
    destination.src = destinationSrc;
    destination.alt = "";
    layer.append(destination);
    animation.fromTo(destination, { opacity: 0 }, { opacity: 1, duration: 0.24, ease: "power1.inOut" }, duration - 0.24);
  }

  return () => {
    animation.kill();
    layer.remove();
  };
}

export function BouquetDialog({ selection, onClose }: {
  selection: BouquetSelection;
  onClose: (opener: HTMLElement, orderName?: string) => void;
}) {
  const [index, setIndex] = useState(selection.index);
  const [zoomed, setZoomed] = useState(false);
  const [hasStepped, setHasStepped] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const photo = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const phase = useRef<"opening" | "ready" | "closing">("opening");
  const queuedClose = useRef(false);
  const orderName = useRef<string | undefined>(undefined);
  const cancelFlight = useRef<(() => void) | undefined>(undefined);
  const bouquet = bouquets[index];

  function isVisible(position?: PhotoPosition): position is PhotoPosition {
    return Boolean(position && position.rect.bottom > 80 && position.rect.top < innerHeight - 80);
  }

  function requestClose() {
    const panel = dialog.current;
    const frame = photo.current;
    if (!panel?.open || !frame || phase.current === "closing") return;
    if (phase.current === "opening") {
      queuedClose.current = true;
      return;
    }

    phase.current = "closing";
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || orderName.current) {
      panel.close();
      return;
    }

    const selectedCard = captureBouquetPhoto(bouquet.id);
    const originCard = index !== selection.index ? captureBouquetPhoto(bouquets[selection.index].id) : undefined;
    const target = isVisible(selectedCard) ? selectedCard : isVisible(originCard) ? originCard : undefined;
    panel.dataset.phase = target ? "returning" : "fading";
    if (target) {
      const actual = frame.querySelector("img");
      const image = {
        ...target,
        src: actual?.naturalWidth ? actual.currentSrc || actual.src : selectedCard?.src || target.src,
        transform: actual ? getComputedStyle(actual).transform : "none",
      };
      cancelFlight.current = movePhoto(panel, image, frame.getBoundingClientRect(), target.rect, true, () => panel.close(), target === originCard ? target.src : undefined);
    } else {
      const fade = gsap.to(panel, { opacity: 0, duration: 0.28, onComplete: () => panel.close() });
      cancelFlight.current = () => { fade.kill(); };
    }
  }

  useLayoutEffect(() => {
    const panel = dialog.current;
    const frame = photo.current;
    if (!panel || !frame) return;
    gsap.registerPlugin(Flip);
    if (!panel.open) panel.showModal();
    title.current?.focus({ preventScroll: true });

    const motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      phase.current = "ready";
      delete panel.dataset.phase;
      if (queuedClose.current) requestClose();
    };
    if (!motion || !selection.origin) {
      finish();
    } else {
      panel.dataset.phase = "opening";
      cancelFlight.current = movePhoto(panel, selection.origin, selection.origin.rect, frame.getBoundingClientRect(), false, finish);
    }

    return () => {
      cancelFlight.current?.();
    };
    // This dialog mounts for each new card opening. Subsequent photos share the same dialog.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  function step(offset: number) {
    if (phase.current !== "ready") return;
    setZoomed(false);
    setHasStepped(true);
    setIndex((current) => (current + offset + bouquets.length) % bouquets.length);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      step(event.key === "ArrowLeft" ? -1 : 1);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="bouquet-dialog"
      aria-labelledby="bouquet-dialog-title"
      data-lenis-prevent
      style={{ "--bouquet-glow": bouquet.glow } as CSSProperties}
      onClose={() => onClose(selection.opener, orderName.current)}
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onKeyDown={onKeyDown}
    >
      <div className="bouquet-dimmer" aria-hidden="true" />
      <div className="bouquet-view" onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}>
        <button type="button" className="icon-button bouquet-close" aria-label="Закрыть" onClick={requestClose}>
          <X size={22} />
        </button>
        <article className="bouquet-panel">
          <button
            type="button"
            ref={photo}
            className="detail-photo media-frame"
            aria-label={zoomed ? "Общий вид букета" : "Увеличить изображение букета"}
            aria-pressed={zoomed}
            data-zoomed={zoomed}
            data-switched={hasStepped}
            onClick={() => setZoomed(!zoomed)}
          >
            <span className="detail-photo-image" key={bouquet.id}>
              <Image
                fill
                src={bouquet.image}
                alt={bouquet.alt}
                sizes={zoomed ? "(max-width: 700px) 145vw, 1100px" : "(max-width: 700px) 90vw, (max-width: 1100px) 51vw, 620px"}
                loading="eager"
              />
            </span>
            <span className="detail-zoom icon-button" aria-hidden="true">{zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}</span>
          </button>
          <div className="bouquet-panel-copy">
            <div className="bouquet-panel-copy-inner" key={bouquet.id} data-switched={hasStepped}>
              <p className="bouquet-category">{bouquet.category}</p>
              <h2 ref={title} id="bouquet-dialog-title" tabIndex={-1}>{bouquet.name}</h2>
              <p className="bouquet-description">{bouquet.description}</p>
            </div>
            <button type="button" className="button button--cream" onClick={() => {
              orderName.current = bouquet.name;
              requestClose();
            }}>Заказать букет <ArrowUpRight size={17} /></button>
            <div className="bouquet-pagination">
              <div className="bouquet-pagination-buttons">
                <button className="icon-button" type="button" aria-label="Предыдущий букет" onClick={() => step(-1)}><ArrowLeft size={18} /></button>
                <button className="icon-button" type="button" aria-label="Следующий букет" onClick={() => step(1)}><ArrowRight size={18} /></button>
              </div>
              <p aria-live="polite">{index + 1} / {bouquets.length} <span className="sr-only">{bouquet.name}</span></p>
            </div>
          </div>
        </article>
      </div>
    </dialog>
  );
}
