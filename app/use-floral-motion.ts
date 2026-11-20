"use client";

import { useEffect, useState, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { navigation } from "./site";

export function useFloralMotion(root: RefObject<HTMLDivElement | null>) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const site = root.current;
    if (!site) return;

    const sectionSelectors = navigation.map(({ href }) => href).concat("#bespoke");
    const sections = Array.from(site.querySelectorAll<HTMLElement>(sectionSelectors.join(",")));
    let currentSection: string | null = null;
    let headerFrame = 0;
    const syncHeader = () => {
      headerFrame = 0;
      site.dataset.scrolled = String(window.scrollY > 24);
      const viewport = document.documentElement;
      const pageEnd = viewport.scrollHeight - window.scrollY - innerHeight < 4;
      const visible = sections.findLast((node) => node.getBoundingClientRect().top <= innerHeight * 0.28);
      const next = pageEnd ? "#contacts" : visible ? `#${visible.id}` : null;
      if (next === currentSection) return;
      currentSection = next;
      setActiveSection(next);
    };
    const scheduleHeader = () => { if (!headerFrame) headerFrame = requestAnimationFrame(syncHeader); };
    syncHeader();
    window.addEventListener("scroll", scheduleHeader, { passive: true });
    window.addEventListener("resize", scheduleHeader);
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia(site);

    media.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
        desktop: "(min-width: 900px)",
        pointer: "(hover: hover) and (pointer: fine)",
      },
      (context) => {
        const { conditions } = context;
        if (!conditions?.motion) return;

        const select = gsap.utils.selector(site);
        const [hero] = select<HTMLElement>(".hero");
        if (!hero) return;

        const desktop = conditions.desktop;
        const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
        const light = connection?.saveData || (navigator.hardwareConcurrency || 8) <= 4;
        const lenis = !light ? new Lenis({ lerp: 0.105, anchors: true }) : null;
        const tick = (time: number) => lenis?.raf(time * 1000);
        let modalObserver: MutationObserver | undefined;
        if (lenis) {
          lenis.on("scroll", ScrollTrigger.update);
          gsap.ticker.add(tick);
          const syncModalScroll = () => {
            const modalOpen = Boolean(site.querySelector("dialog[open]"));
            if (modalOpen === lenis.isStopped) return;
            if (modalOpen) lenis.stop();
            else lenis.start();
          };
          modalObserver = new MutationObserver(syncModalScroll);
          modalObserver.observe(site, { attributes: true, subtree: true, attributeFilter: ["open"] });
          syncModalScroll();
        }

        const intro = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.72 } });
        if (window.scrollY < 24 && !window.location.hash) {
          intro
            .from(".site-header", { opacity: 0, duration: 0.52 }, 0)
            .from(".hero-line > span", { yPercent: 105, stagger: 0.09, clearProps: "transform" }, 0.13)
            .from(".hero-description", { opacity: 0, y: 9, clearProps: "all" }, 0.43)
            .from(".hero-cta", { opacity: 0, y: 9, clearProps: "all" }, 0.58)
            .from(".hero-scroll > span", { opacity: 0, clearProps: "opacity" }, 0.78);
        }

        if (!light) {
          site.dataset.cinematic = desktop ? "desktop" : "mobile";
          gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: () => `+=${Math.round(hero.offsetHeight * (desktop ? 0.86 : 0.62))}`,
              pin: true,
              scrub: desktop ? 0.65 : true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })
            .to(".hero-copy", { autoAlpha: 0, y: -22, duration: 0.31 }, 0)
            .to(".hero-controls", { autoAlpha: 0, duration: 0.24 }, 0)
            .to(".hero-media", { scale: desktop ? 1.3 : 1.18, duration: 0.92 }, 0)
            .to(".hero-wash", { opacity: 1, duration: 0.50 }, 0.41)
            .to(".hero-media", { opacity: 0, duration: 0.28 }, 0.62);
        }

        const [collectionHeading] = select<HTMLElement>("[data-collection-heading]");
        if (collectionHeading?.getBoundingClientRect().top >= innerHeight && !window.location.hash) {
          gsap.from(collectionHeading.children, {
            opacity: 0.15,
            y: 26,
            stagger: 0.12,
            duration: 0.8,
            ease: "power3.out",
            clearProps: "opacity,transform",
            scrollTrigger: { trigger: collectionHeading, start: "top 91%", once: true },
          });
        }

        const cards = select<HTMLElement>("[data-catalog-card]").filter((card) => card.getBoundingClientRect().top > innerHeight);
        if (cards.length) {
          gsap.set(cards, { opacity: 0.2, y: desktop ? 26 : 15 });
          ScrollTrigger.batch(cards, {
            start: "top 94%",
            interval: 0.09,
            batchMax: 3,
            once: true,
            onEnter: (batch) => {
              context.add(() => {
                gsap.to(batch, { opacity: 1, y: 0, duration: 0.74, stagger: 0.085, ease: "power3.out", clearProps: "opacity,transform" });
              });
            },
          });
        }

        const [studioCopy] = select<HTMLElement>("[data-studio-copy]");
        if (studioCopy?.getBoundingClientRect().top >= innerHeight && !window.location.hash) {
          const story = gsap.timeline({ scrollTrigger: { trigger: studioCopy, start: "top 87%", once: true } });
          story.from(studioCopy.querySelectorAll(".studio-line > span"), {
            yPercent: 105, duration: 0.82, stagger: 0.095, ease: "power3.out", clearProps: "transform",
          }).from(studioCopy.querySelectorAll(".studio-lead, .text-button"), {
            opacity: 0.2, y: 12, duration: 0.62, stagger: 0.08, ease: "power3.out", clearProps: "opacity,transform",
          }, 0.25);
        }

        select<HTMLElement>("[data-reveal]").forEach((element) => {
          // Keep deep links, restored scroll positions and visible content usable at startup.
          if (element.getBoundingClientRect().top < window.innerHeight) return;
          gsap.from(element, {
            opacity: 0.2,
            y: desktop ? 22 : 13,
            ease: "power3.out",
            duration: 0.78,
            clearProps: "all",
            scrollTrigger: { trigger: element, start: "top 92%", once: true },
          });
        });

        if (desktop && !light) {
          select<HTMLElement>("[data-parallax]").forEach((image) => {
            gsap.fromTo(image, { yPercent: -3 }, {
              yPercent: 3,
              ease: "none",
              scrollTrigger: {
                trigger: image.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            });
          });
        }

        const magnetic = conditions.pointer && !light ? select<HTMLElement>("[data-magnetic]") : [];
        const cleanPointer = magnetic.map((button) => {
          const target = button.querySelector<HTMLElement>(".button-contents");
          if (!target) return () => {};
          const x = gsap.quickTo(target, "x", { duration: 0.32, ease: "power3.out" });
          const y = gsap.quickTo(target, "y", { duration: 0.32, ease: "power3.out" });
          const move = (event: PointerEvent) => {
            const rect = button.getBoundingClientRect();
            x((event.clientX - rect.left - rect.width / 2) * 0.08);
            y((event.clientY - rect.top - rect.height / 2) * 0.11);
          };
          const reset = () => { x(0); y(0); };
          button.addEventListener("pointermove", move);
          button.addEventListener("pointerleave", reset);
          window.addEventListener("blur", reset);
          return () => {
            button.removeEventListener("pointermove", move);
            button.removeEventListener("pointerleave", reset);
            window.removeEventListener("blur", reset);
            x.tween.kill();
            y.tween.kill();
            gsap.set(target, { clearProps: "transform" });
          };
        });

        let active = true;
        const refresh = () => {
          if (!active) return;
          ScrollTrigger.refresh();
          scheduleHeader();
        };
        void document.fonts.ready.then(refresh);
        const frame = requestAnimationFrame(refresh);
        return () => {
          active = false;
          cancelAnimationFrame(frame);
          delete site.dataset.cinematic;
          gsap.ticker.remove(tick);
          modalObserver?.disconnect();
          lenis?.destroy();
          cleanPointer.forEach((cleanup) => cleanup());
        };
      },
    );

    return () => {
      window.removeEventListener("scroll", scheduleHeader);
      window.removeEventListener("resize", scheduleHeader);
      cancelAnimationFrame(headerFrame);
      media.revert();
    };
  }, [root]);

  return activeSection;
}
