"use client";

import { FormEvent, useMemo, useState } from "react";
import { api, Cgpa, Course } from "@/lib/api";

const GRADES = ["A", "B", "C", "D", "E", "F"];

function termKey(c: Course) {
  return `${c.session} ${c.semester}`.trim() || "Unspecified";
}

type Props = {
  courses: Course[];
  cgpa: Cgpa | null;
  onChange: () => Promise<void>;
  onError: (msg: string) => void;
};

export function CourseTable({ courses, cgpa, onChange, onError }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [prefix, setPrefix] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const groups = useMemo(() => {
    const m = new Map<string, Course[]>();
    courses.forEach((c) => {
      const k = termKey(c);
      m.set(k, [...(m.get(k) || []), c]);
    });
    return Array.from(m.entries());
  }, [courses]);

  async function run(fn: () => Promise<unknown>) {
    try {
      await fn();
      await onChange();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  const patch = (c: Course, p: Partial<Course>) => run(() => api.patchCourse(c.id, p));

  function toggleSelect(id: number) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function selectByPrefix() {
    const p = prefix.trim().toUpperCase();
    if (!p) return;
    setSelected(new Set(courses.filter((c) => c.code.startsWith(p)).map((c) => c.id)));
  }

  const bulk = (excluded: boolean) =>
    run(async () => {
      await api.bulkExclude(Array.from(selected), excluded);
      setSelected(new Set());
    });

  async function addCourse(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const form = e.currentTarget;
    const num = (k: string) => (f.get(k) ? Number(f.get(k)) : null);
    await run(async () => {
      await api.addCourse({
        code: String(f.get("code") || ""),
        title: String(f.get("title") || ""),
        units: num("units"),
        score: num("score"),
      });
      form.reset();
    });
  }

  return (
    <section className="card courses">
      <div className="courses-head">
        <h2>Your courses {courses.length > 0 && <span style={{ color: "var(--muted)", fontWeight: 500 }}>· {courses.length}</span>}</h2>
        <div className="toolbar">
          {selected.size > 0 && (
            <>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{selected.size} selected</span>
              <button className="btn btn-ink btn-sm" onClick={() => bulk(true)}>Exclude</button>
              <button className="btn btn-ghost btn-sm" onClick={() => bulk(false)}>Include</button>
            </>
          )}
          <input className="prefix" placeholder="Prefix e.g. GST" value={prefix} onChange={(e) => setPrefix(e.target.value)} onKeyDown={(e) => e.key === "Enter" && selectByPrefix()} aria-label="Select courses by code prefix" />
          <button className="btn btn-ghost btn-sm" onClick={selectByPrefix}>Select</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Close" : "+ Add course"}</button>
          {courses.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => confirm("Remove all courses?") && run(() => api.clearCourses())}>Clear all</button>
          )}
        </div>
      </div>

      {showAdd && (
        <form className="add-form" onSubmit={addCourse} style={{ borderTop: 0, borderBottom: "1px solid var(--line)" }}>
          <input className="input" name="code" placeholder="CSC 301" required />
          <input className="input" name="title" placeholder="Course title (optional)" />
          <input className="input" name="units" type="number" min={0} max={12} placeholder="Units" required />
          <input className="input" name="score" type="number" min={0} max={100} placeholder="Score" required />
          <button className="btn btn-orange btn-sm" style={{ height: 40 }}>Add</button>
        </form>
      )}

      {courses.length === 0 ? (
        <div className="empty">
          <h3>No courses yet</h3>
          <p>Upload a result sheet above, or add a course manually.</p>
        </div>
      ) : (
        groups.map(([term, rows]) => {
          const t = cgpa?.terms.find((x) => x.term === term);
          return (
            <div className="term-block" key={term}>
              <div className="term-title">
                {term}
                <span>{t ? `GPA ${t.gpa.toFixed(2)} · ${t.units} units` : "No counted courses"}</span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr><th style={{ width: 40 }} /><th>Count</th><th>Code</th><th>Title</th><th>Units</th><th>Score</th><th>Grade</th><th /><th /></tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c.id} className={c.excluded ? "excluded" : ""}>
                        <td className="keep"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} aria-label={`Select ${c.code}`} /></td>
                        <td className="keep">
                          <button className="switch" role="switch" aria-checked={!c.excluded} aria-label={`${c.excluded ? "Include" : "Exclude"} ${c.code}`} onClick={() => patch(c, { excluded: !c.excluded })} />
                        </td>
                        <td className="code">{c.code}</td>
                        <td className="title-cell" title={c.title}>{c.title || "—"}</td>
                        <td><input key={`u${c.id}-${c.units}`} className="cell-input" type="number" min={0} max={12} defaultValue={c.units ?? ""} aria-label={`${c.code} units`}
                          onBlur={(e) => { const v = e.target.value === "" ? null : Number(e.target.value); if (v !== c.units) patch(c, { units: v }); }} /></td>
                        <td><input key={`s${c.id}-${c.score}`} className="cell-input" type="number" min={0} max={100} defaultValue={c.score ?? ""} aria-label={`${c.code} score`}
                          onBlur={(e) => { const v = e.target.value === "" ? null : Number(e.target.value); if (v !== c.score) patch(c, { score: v }); }} /></td>
                        <td>
                          <select className="cell-input" style={{ width: 70 }} value={c.grade ?? ""} aria-label={`${c.code} grade`}
                            onChange={(e) => patch(c, { grade: e.target.value || null })}>
                            <option value="">—</option>
                            {GRADES.map((g) => <option key={g}>{g}</option>)}
                          </select>
                        </td>
                        <td className="keep">{c.needs_review && <span className="review">Check this</span>}</td>
                        <td className="keep" style={{ textAlign: "right" }}>
                          <button className="icon-btn" aria-label={`Delete ${c.code}`} onClick={() => run(() => api.deleteCourse(c.id))}>
                            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden><path d="M5 7h14M10 11v6m4-6v6M8 7l1-3h6l1 3m-9 0 1 13h8l1-13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
