"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { api, ApiError, getToken, setToken } from "@/lib/api";
import { Logo } from "./Logo";
import { Cloud } from "./Doodles";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

type GoogleId = {
  initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const googleRef = useRef<HTMLDivElement>(null);
  const isSignup = mode === "signup";

  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleRef.current) return;
    const el = googleRef.current;
    const init = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setError("");
          try {
            const { access_token } = await api.google(credential);
            setToken(access_token);
            router.push("/dashboard");
          } catch (e) {
            setError(e instanceof ApiError ? e.message : "Google sign-in failed");
          }
        },
      });
      window.google.accounts.id.renderButton(el, { theme: "outline", size: "large", shape: "pill", width: 400, text: isSignup ? "signup_with" : "signin_with" });
    };
    if (window.google) return init();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [isSignup, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { access_token } = isSignup ? await api.register(email, password, name) : await api.login(email, password);
      setToken(access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <aside className="auth-art">
        <Logo />
        <h2 className="display">{isSignup ? "Start with\nyour results." : "Welcome\nback."}</h2>
        <p>{isSignup ? "Upload a result sheet, leave out the electives and see your CGPA in seconds." : "Pick up where you left off — your courses and CGPA are waiting."}</p>
        <Cloud className="hero-cloud" />
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <h1>{isSignup ? "Create your account" : "Log in"}</h1>
          <p className="sub">{isSignup ? "Free, and takes under a minute." : "Enter your details to continue."}</p>

          {error && <div className="error" role="alert">{error}</div>}

          <form onSubmit={onSubmit}>
            {isSignup && (
              <label className="field"><span>Full name</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Oyewole Caleb" />
              </label>
            )}
            <label className="field"><span>Email</span>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
            </label>
            <label className="field"><span>Password</span>
              <input className="input" type="password" required minLength={isSignup ? 8 : 1} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isSignup ? "new-password" : "current-password"} placeholder={isSignup ? "At least 8 characters" : "Your password"} />
            </label>
            <button className="btn btn-orange" disabled={busy}>{busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}</button>
          </form>

          {GOOGLE_CLIENT_ID && (
            <>
              <div className="divider">or</div>
              <div className="google-slot" ref={googleRef} />
            </>
          )}

          <p className="switch-link">
            {isSignup ? <>Already have an account? <Link href="/login">Log in</Link></> : <>New here? <Link href="/signup">Create an account</Link></>}
          </p>
        </div>
      </section>
    </main>
  );
}
