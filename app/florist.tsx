"use client";

import Image from "next/image";
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Menu, Plus, Scan, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BouquetDialog, captureBouquetPhoto, type BouquetSelection } from "./bouquet-dialog";
import { ExperienceDialog, type DialogView } from "./experience-dialog";
import { HeroVisual } from "./hero-visual";
import { PetalCursor } from "./petal-cursor";
import { bespokePhoto, bouquets, gallery, navigation, studio, studioPhoto } from "./site";
import { useFloralMotion } from "./use-floral-motion";

function Brand() {
  return studio.logo ? (
    <img className="brand-image" src={studio.logo.src} width={studio.logo.width} height={studio.logo.height} alt={studio.name} />
  ) : <span className="brand-name">{studio.name}</span>;
}

function ButtonContents({ children }: { children: ReactNode }) {
  return <span className="button-contents">{children}</span>;
}

export function Florist() {
  const root = useRef<HTMLDivElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<DialogView | null>(null);
  const [selection, setSelection] = useState<BouquetSelection | null>(null);
  const activeSection = useFloralMotion(root);

  useEffect(() => {
    if (!menuOpen) return;
    menu.current?.querySelector<HTMLElement>("a")?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuToggle.current?.focus();
    };
    const narrow = window.matchMedia("(max-width: 899px)");
    const closeOnWide = () => { if (!narrow.matches) setMenuOpen(false); };
    narrow.addEventListener("change", closeOnWide);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      narrow.removeEventListener("change", closeOnWide);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  function order(id?: string) {
    if (menuOpen) menuToggle.current?.focus();
    setMenuOpen(false);
    setView({ kind: "order", id });
  }

  function openBouquet(index: number, opener: HTMLElement) {
    setSelection({ index, opener, origin: captureBouquetPhoto(bouquets[index].id) });
  }

  const hasContacts = studio.address || studio.phone || studio.email || studio.social.length > 0;

  return (
    <div className="florist" ref={root}>
      <a className="skip-link" href="#main">К содержанию</a>
      <header className="site-header" data-open={menuOpen}>
        <div className="site-header-inner">
          <a href="#top" className="brand" aria-label="Пять букетов, к началу страницы" onClick={() => setMenuOpen(false)}>
            <Brand />
          </a>
          <nav className="desktop-nav" aria-label="Главная навигация">
            {navigation.map((item) => <a key={item.href} href={item.href} aria-current={activeSection === item.href ? "location" : undefined}>{item.label}</a>)}
          </nav>
          <button type="button" className="button button--outline header-order" aria-current={activeSection === "#bespoke" ? "location" : undefined} data-magnetic onClick={() => order()}>
            <ButtonContents>Заказать букет <ArrowUpRight size={15} /></ButtonContents>
          </button>
          <button
            ref={menuToggle}
            type="button"
            className="icon-button menu-toggle"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        <nav className="mobile-nav" id="mobile-nav" ref={menu} aria-label="Мобильная навигация" hidden={!menuOpen}>
          {navigation.map((item) => <a key={item.href} href={item.href} aria-current={activeSection === item.href ? "location" : undefined} onClick={() => setMenuOpen(false)}>{item.label}<ArrowUpRight size={18} /></a>)}
          <button type="button" className="button button--cream" onClick={() => order()}>Заказать букет <ArrowRight size={18} /></button>
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        <div id="top" aria-hidden="true" />
        <section className="hero" aria-labelledby="hero-title">
          <HeroVisual />
          <div className="hero-shade" aria-hidden="true" />
          <div className="hero-wash" aria-hidden="true" />
          <div className="hero-copy">
            <h1 id="hero-title">
              <span className="sr-only">Цветы, у которых есть характер</span>
              <span className="hero-line" aria-hidden="true"><span>Цветы, у</span></span>
              <span className="hero-line" aria-hidden="true"><span>которых есть</span></span>
              <span className="hero-line" aria-hidden="true"><span>характер</span></span>
            </h1>
            <p className="hero-description">Авторские букеты и композиции, созданные с вниманием к каждой детали.</p>
            <a href="#collection" className="button button--cream hero-cta" data-magnetic>
              <ButtonContents>Смотреть коллекцию <ArrowRight size={19} /></ButtonContents>
            </a>
          </div>
          <a className="hero-controls hero-scroll" href="#collection">
            <span className="icon-button"><ArrowDown size={16} /></span>
            <span>Листайте вниз</span>
          </a>
        </section>

        <section className="collection" id="collection" aria-labelledby="collection-title" tabIndex={-1}>
          <div className="container collection-content">
            <header className="section-heading collection-heading" data-collection-heading>
              <h2 id="collection-title">Наша коллекция</h2>
              <p>Каждый букет — отдельная история</p>
            </header>
            <div className="catalog-grid">
              {bouquets.map((bouquet, index) => (
                <article
                  className="bouquet"
                  key={bouquet.id}
                  aria-labelledby={`bouquet-title-${bouquet.id}`}
                  style={{ "--bouquet-glow": bouquet.glow } as CSSProperties}
                  data-catalog-card
                >
                  <button
                    id={`bouquet-image-${bouquet.id}`}
                    className="bouquet-image media-frame"
                    type="button"
                    aria-label={`Рассмотреть «${bouquet.name}»`}
                    aria-haspopup="dialog"
                    onClick={(event) => openBouquet(index, event.currentTarget)}
                  >
                    <Image src={bouquet.image} alt={bouquet.alt} fill sizes="(max-width: 570px) 90vw, (max-width: 1099px) 43vw, (max-width: 1708px) 29vw, 485px" />
                    <span className="bouquet-look" aria-hidden="true">
                      <span>Рассмотреть</span><Scan size={17} />
                    </span>
                  </button>
                  <div className="bouquet-summary">
                    <div>
                      <p className="bouquet-category">{bouquet.category}</p>
                      <h3 id={`bouquet-title-${bouquet.id}`}>{bouquet.name}</h3>
                    </div>
                    <button type="button" className="text-button bouquet-more" aria-haspopup="dialog" aria-label={`Подробнее о букете «${bouquet.name}»`} onClick={(event) => openBouquet(index, event.currentTarget)}>
                      Подробнее <ArrowUpRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="studio-section" id="studio" aria-labelledby="studio-title" tabIndex={-1}>
          <div className="container studio-grid">
            <div className="studio-copy" data-studio-copy>
              <span className="studio-flourish" aria-hidden="true"><i /></span>
              <h2 id="studio-title">
                <span className="sr-only">Цветы — это наш язык</span>
                <span className="studio-line" aria-hidden="true"><span>Цветы —</span></span>
                <span className="studio-line" aria-hidden="true"><span>это наш</span></span>
                <span className="studio-line" aria-hidden="true"><span>язык</span></span>
              </h2>
              <p className="studio-lead">Мы создаём композиции, в которых каждый цветок становится частью особенной истории.</p>
              <a href="#gallery" className="text-button">Смотреть галерею <ArrowUpRight size={16} /></a>
            </div>
            <figure className="studio-figure" data-reveal>
              <div className="media-frame studio-image">
                <div className="parallax-image" data-parallax>
                  <Image src={studioPhoto.image} alt={studioPhoto.alt} fill sizes="(max-width: 700px) 89vw, (max-width: 1708px) 47vw, 810px" />
                </div>
              </div>
            </figure>
          </div>
        </section>

        <section className="gallery-section" id="gallery" aria-labelledby="gallery-title" tabIndex={-1}>
          <div className="container">
            <header className="section-heading" data-reveal>
              <h2 id="gallery-title">Галерея</h2>
            </header>
            <div className="gallery-grid">
              {gallery.map((photo, index) => (
                <button key={photo.image} className={`gallery-photo gallery-photo--${index + 1} media-frame`} type="button" onClick={() => setView({ kind: "gallery", index })} aria-haspopup="dialog" aria-label={`Открыть фото. ${photo.alt}`} data-reveal>
                  <span className="parallax-image" data-parallax={index % 2 === 0 ? "" : undefined}>
                    <Image src={photo.image} alt={photo.alt} fill sizes="(max-width: 700px) 48vw, (max-width: 1708px) 40vw, 620px" />
                  </span>
                  <span className="gallery-expand icon-button" aria-hidden="true"><Scan size={18} /></span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="delivery-section" id="delivery" aria-labelledby="delivery-title" tabIndex={-1}>
          <div className="container delivery-grid" data-reveal>
            <h2 id="delivery-title">Доставка<br />и оплата</h2>
            <div className="delivery-details">
              <details>
                <summary>Доставка <Plus size={19} /></summary>
                <p>{studio.delivery || "Зоны, сроки и стоимость доставки уточняются."}</p>
              </details>
              <details>
                <summary>Оплата <Plus size={19} /></summary>
                <p>{studio.payment || "Доступные способы оплаты уточняются."}</p>
              </details>
            </div>
          </div>
        </section>
        <section className="bespoke" id="bespoke" aria-labelledby="bespoke-title" tabIndex={-1}>
          <div className="bespoke-media" aria-hidden="true">
            <div className="parallax-image" data-parallax>
              <Image src={bespokePhoto.image} alt="" fill sizes="(max-width: 700px) 100vw, 70vw" />
            </div>
          </div>
          <div className="container bespoke-inner" data-reveal>
            <h2 id="bespoke-title">Ваша история<br /> начинается<br /> с цветов</h2>
            <p>Расскажите о своей идее — мы поможем воплотить её в цветочной композиции.</p>
            <button type="button" className="button button--cream" data-magnetic aria-haspopup="dialog" onClick={() => order()}>
              <ButtonContents>Обсудить букет <ArrowRight size={18} /></ButtonContents>
            </button>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contacts" aria-labelledby="contacts-title" tabIndex={-1}>
        <div className="container">
          <div className="footer-main">
            <div>
              <h2 id="contacts-title">Контакты</h2>
              <address>
                {studio.address && <p>{studio.address}</p>}
                {studio.phone && <a href={`tel:${studio.phone.replace(/[^+\d]/g, "")}`}>{studio.phone}</a>}
                {studio.email && <a href={`mailto:${studio.email}`}>{studio.email}</a>}
                {studio.social.map(({ label, href }) => <a key={href} href={href}>{label} <ArrowUpRight size={15} /></a>)}
              </address>
              {!hasContacts && <p>Контакты мастерской появятся здесь после подтверждения.</p>}
            </div>
            <a className="icon-button footer-top" href="#top" aria-label="К началу страницы"><ArrowUp size={20} /></a>
          </div>
          <div className="footer-bottom">
            <a href="#top" className="brand"><Brand /></a>
            <p>Цветочная мастерская</p>
          </div>
        </div>
      </footer>
      <PetalCursor />
      {selection && (
        <BouquetDialog selection={selection} onClose={(opener, orderName) => {
          setSelection(null);
          opener.focus({ preventScroll: true });
          if (orderName) order(orderName);
        }} />
      )}
      <ExperienceDialog view={view} setView={setView} />
    </div>
  );
}
