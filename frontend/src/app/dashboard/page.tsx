"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, Cgpa, classify, clearToken, Course, getToken, User } from "@/lib/api";
import { Logo } from "@/components/Logo";
import { Dropzone } from "@/components/Dropzone";
import { CourseTable } from "@/components/CourseTable";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [cgpa, setCgpa] = useState<Cgpa | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; err?: boolean } | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [c, g] = await Promise.all([api.courses(), api.cgpa()]);
    setCourses(c);
    setCgpa(g);
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        setUser(await api.me());
        await refresh();
      } catch (e) {
        if (e instanceof ApiError && e.status !== 401) setNotice({ text: e.message, err: true });
      } finally {
        setReady(true);
      }
    })();
  }, [refresh, router]);

  async function upload(files: File[]) {
    setBusy(true);
    setNotice(null);
    try {
      const added = await api.upload(files);
      await refresh();
      const review = added.filter((c) => c.needs_review).length;
      setNotice({
        text: `Found ${added.length} course${added.length === 1 ? "" : "s"}${review ? ` — ${review} need a quick check` : ""}. Switch off any electives you don’t want counted.`,
      });
    } catch (e) {
      setNotice({ text: e instanceof Error ? e.message : "Upload failed", err: true });
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearToken();
    router.push("/");
  }

  if (!ready) return <div className="dash" />;

  const score = cgpa?.cgpa ?? 0;

  return (
    <div className="dash">
      <header className="dash-bar">
        <div className="wrap">
          <Logo />
          <div className="dash-user">
            <span>{user?.name || user?.email}</span>
            <button className="btn btn-outline btn-sm" onClick={logout}>Log out</button>
          </div>
        </div>
      </header>

      <main className="wrap dash-main">
        <div className="dash-grid">
          <section className="card score-card" aria-live="polite">
            <div className="lab">Your CGPA</div>
            <div className="num">{score.toFixed(2)}<small>/ 5.00</small></div>
            <span className="class">{cgpa && cgpa.courses_counted > 0 ? classify(score) : "No courses counted"}</span>
            <div className="stats">
              <div className="stat"><b>{cgpa?.total_units ?? 0}</b><span>Units</span></div>
              <div className="stat"><b>{cgpa?.courses_counted ?? 0}</b><span>Counted</span></div>
              <div className="stat"><b>{cgpa?.courses_excluded ?? 0}</b><span>Excluded</span></div>
            </div>
            {cgpa && cgpa.courses_needing_review > 0 && (
              <div className="notice" style={{ background: "rgba(255,255,255,.12)", color: "var(--white)" }}>
                {cgpa.courses_needing_review} course{cgpa.courses_needing_review === 1 ? "" : "s"} missing units or a grade — these aren’t counted yet.
              </div>
            )}
          </section>

          <div>
            <Dropzone onFiles={upload} busy={busy} />
            {notice && <div className={`notice ${notice.err ? "err" : ""}`} role="status">{notice.text}</div>}
          </div>
        </div>

        <CourseTable
          courses={courses}
          cgpa={cgpa}
          onChange={refresh}
          onError={(text) => setNotice({ text, err: true })}
        />
      </main>
    </div>
  );
}
