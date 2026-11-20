"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Clipboard, Download, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { bouquets, gallery } from "./site";

export type DialogView =
  | { kind: "order"; id?: string }
  | { kind: "gallery"; index: number };

function OrderForm({ id }: { id?: string }) {
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const confirmed = useRef<HTMLHeadingElement>(null);
  const bouquetField = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (draft) confirmed.current?.focus();
  }, [draft]);

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    function field(name: string) { return String(data.get(name) ?? "").trim(); }
    const date = field("date");
    const formattedDate = date
      ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeZone: "UTC" }).format(new Date(date))
      : "";
    const fields = [
      "Здравствуйте! Хочу обсудить букет.",
      `Букет: ${field("bouquet")}`,
      field("occasion") && `Повод: ${field("occasion")}`,
      formattedDate && `Дата: ${formattedDate}`,
      field("budget") && `Бюджет: ${field("budget")}`,
      field("note") && `Пожелания: ${field("note")}`,
    ].filter(Boolean);
    setCopied(false);
    setCopyStatus("");
    setDraft(fields.join("\n"));
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setCopyStatus("Текст скопирован.");
    } catch {
      draftRef.current?.focus();
      draftRef.current?.select();
      setCopyStatus("Текст выделен. Скопируйте его с помощью клавиатуры.");
    }
  }

  function save() {
    const url = URL.createObjectURL(new Blob([draft], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "Заявка на букет.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <form className="order-form" onSubmit={prepare} hidden={Boolean(draft)}>
        <p className="dialog-note">Демонстрационная форма. Черновик заявки можно скопировать или скачать.</p>
        <label>Букет
          <select ref={bouquetField} name="bouquet" defaultValue={id || "Индивидуальный букет"}>
            <option value="Индивидуальный букет">Индивидуальный букет</option>
            {bouquets.map((item) => <option value={item.name} key={item.id}>{item.name} (пример)</option>)}
          </select>
        </label>
        <label>Повод<input name="occasion" maxLength={80} placeholder="Например, день рождения" /></label>
        <div className="form-row">
          <label>Желаемая дата<input name="date" type="date" max="9999-12-31" /></label>
          <label>Бюджет<input name="budget" maxLength={60} placeholder="Ваш ориентир" /></label>
        </div>
        <label>Пожелания<textarea name="note" rows={3} maxLength={600} placeholder="Цвета, настроение, любимые цветы" /></label>
        <button className="button button--cream" type="submit">Подготовить заявку <ArrowRight size={17} /></button>
      </form>
      {draft && (
        <div className="draft">
          <h3 ref={confirmed} tabIndex={-1}>Черновик готов</h3>
          <textarea aria-label="Текст заявки" ref={draftRef} readOnly value={draft} rows={6} />
          <div className="dialog-actions">
            <button className="button button--cream" type="button" onClick={copy}>
              {copied ? <Check size={17} /> : <Clipboard size={17} />}{copied ? "Скопировано" : "Скопировать"}
            </button>
            <button className="button button--outline" type="button" onClick={save}><Download size={17} /> Скачать</button>
          </div>
          <button className="text-button" type="button" onClick={() => {
            setDraft("");
            requestAnimationFrame(() => bouquetField.current?.focus());
          }}><ArrowLeft size={16} /> Изменить данные</button>
          <p className="sr-only" role="status">{copyStatus}</p>
        </div>
      )}
    </>
  );
}

export function ExperienceDialog({ view, setView }: {
  view: DialogView | null;
  setView: (view: DialogView | null) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const kind = view?.kind;

  useEffect(() => {
    const panel = dialog.current;
    if (!kind || !panel) return;
    if (!panel.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      panel.showModal();
    }
    title.current?.focus();
  }, [kind]);

  function reset() {
    setView(null);
    returnFocus.current?.focus({ preventScroll: true });
  }

  function step(index: number) {
    setView({ kind: "gallery", index: (index + gallery.length) % gallery.length });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (view?.kind !== "gallery") return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      step(view.index + (event.key === "ArrowLeft" ? -1 : 1));
    }
  }

  const photo = view?.kind === "gallery" ? gallery[view.index] : undefined;

  return (
    <dialog
      ref={dialog}
      className={`experience-dialog experience-dialog--${kind ?? "order"}`}
      aria-labelledby="dialog-title"
      onClose={reset}
      onKeyDown={onKeyDown}
      data-lenis-prevent
      onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}
    >
      <div className="dialog-inner">
        <button type="button" className="icon-button dialog-close" aria-label="Закрыть" onClick={() => dialog.current?.close()}>
          <X size={21} />
        </button>
        {view?.kind === "order" && (
          <div className="order-panel">
            <h2 ref={title} id="dialog-title" tabIndex={-1}>Заявка на букет</h2>
            <OrderForm id={view.id} key={view.id || "individual"} />
          </div>
        )}
        {photo && view?.kind === "gallery" && (
          <div className="lightbox">
            <h2 id="dialog-title" ref={title} tabIndex={-1} className="sr-only">Галерея</h2>
            <Image src={photo.image} alt={photo.alt} width={1600} height={2000} sizes="(max-width: 700px) 92vw, 600px" />
            <div className="lightbox-controls">
              <button className="icon-button" type="button" aria-label="Предыдущее фото" onClick={() => step(view.index - 1)}><ArrowLeft size={19} /></button>
              <p aria-live="polite">{view.index + 1} / {gallery.length} <span className="sr-only">{photo.alt}</span></p>
              <button className="icon-button" type="button" aria-label="Следующее фото" onClick={() => step(view.index + 1)}><ArrowRight size={19} /></button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
