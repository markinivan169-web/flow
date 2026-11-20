"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function HeroVisual() {
  const video = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const inView = useRef(true);
  const [clip, setClip] = useState("");
  const [playing, setPlaying] = useState(false);
  const [showFrames, setShowFrames] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 700px)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const chooseClip = () => {
      setShowFrames(false);
      setPlaying(false);
      setUnavailable(false);
      const staticMedia = reducedMotion.matches || connection?.saveData;
      setClip(staticMedia ? "" : mobile.matches ? "/media/hero-mobile.mp4" : "/media/hero.mp4");
    };
    chooseClip();
    reducedMotion.addEventListener("change", chooseClip);
    mobile.addEventListener("change", chooseClip);
    return () => {
      reducedMotion.removeEventListener("change", chooseClip);
      mobile.removeEventListener("change", chooseClip);
    };
  }, []);

  useEffect(() => {
    const player = video.current;
    const hero = player?.closest(".hero");
    if (!player || !hero) return;

    const syncPlayback = () => {
      if (!inView.current || document.hidden) {
        player.pause();
      } else if (!userPaused.current && !player.ended) {
        void player.play().catch(() => {});
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView.current = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0.05 });
    observer.observe(hero);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, [clip]);

  function togglePlayback() {
    const player = video.current;
    if (!player) return;
    userPaused.current = !player.paused;
    if (userPaused.current) {
      player.pause();
    } else {
      if (player.ended) player.currentTime = 0;
      void player.play().catch(() => {});
    }
  }

  return (
    <>
      <div className="hero-media" aria-hidden="true">
        <picture className="hero-poster">
          <source media="(max-width: 700px)" srcSet="/media/hero-mobile-poster.webp" />
          <img src="/media/hero-poster.webp" alt="" width={1920} height={1080} fetchPriority="high" />
        </picture>
        {clip && (
          <video
            key={clip}
            ref={video}
            className={showFrames ? "is-playing" : ""}
            src={clip}
            autoPlay={!userPaused.current}
            muted
            playsInline
            preload="metadata"
            onPlaying={() => { setShowFrames(true); setPlaying(true); }}
            onPause={() => setPlaying(false)}
            onEnded={() => { setShowFrames(false); setPlaying(false); }}
            onError={() => { setShowFrames(false); setPlaying(false); setUnavailable(true); }}
            tabIndex={-1}
            disablePictureInPicture
            disableRemotePlayback
          />
        )}
      </div>
      <button
        type="button"
        className="hero-controls hero-video-control icon-button"
        hidden={!clip || unavailable}
        onClick={togglePlayback}
        aria-label={playing ? "Приостановить фоновое видео" : "Воспроизвести фоновое видео"}
      >
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </button>
    </>
  );
}
