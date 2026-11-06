"use client";

import { DragEvent, useRef, useState } from "react";

const ACCEPT = ".pdf,.docx,.txt,.csv";

export function Dropzone({ onFiles, busy }: { onFiles: (files: File[]) => void; busy: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function drop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  }

  return (
    <div
      className={`drop ${over ? "over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <span className="up">
        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden><path d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <h3>{busy ? "Reading your results…" : "Drop your result sheet here"}</h3>
      <p>Upload one or more files. We’ll pull out course codes, units and grades — you can review everything afterwards.</p>
      <div className="types"><span>PDF</span><span>DOCX</span><span>TXT</span><span>CSV</span></div>
      <button type="button" className="btn btn-ink" style={{ marginTop: 10 }} disabled={busy} onClick={() => input.current?.click()}>
        Choose files
      </button>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
