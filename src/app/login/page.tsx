"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { IconArrowRight, IconBucket } from "@tabler/icons-react";
import { useStore } from "@/components/store";
import { safeNext } from "@/lib/security";
import { supabase } from "@/lib/supabase";
import { ErrorMessage, Loading } from "@/components/ui";

export default function Login() {
  const { account, demo, demoLogin, signOut, ready } = useStore();
  const router = useRouter();
  const [signup, setSignup] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "PUT_YOUR_WEB_CLIENT_ID_HERE";

  function forward() {
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(safeNext(next));
    router.refresh();
  }

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      setBusy(true);
      setError("");

      try {
        if (!supabase) throw new Error("Sign-in is unavailable. Please try again later.");
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });
        if (error) throw error;
        if (!data.session) throw new Error("Google sign-in did not create a session. Please try again.");
        forward();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router],
  );

  const initGoogle = useCallback(() => {
    if (typeof window === "undefined" || !window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
      });

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: "continue_with",
          shape: "pill",
          width: 360,
          logo_alignment: "left",
        });
      }
    } catch (e) {
      console.warn("Google Sign-In initialization notice:", e);
    }
  }, [clientId, handleCredentialResponse, signup]);

  useEffect(() => {
    initGoogle();
  }, [initGoogle]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    setMessage("");
    const f = new FormData(e.currentTarget);
    try {
      const email = String(f.get("email")).trim(),
        password = String(f.get("password"));
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: String(f.get("name")).trim() },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (error) throw error;
        if (data.session) forward();
        else
          setMessage(
            "Check your email to confirm your account, then come back and sign in.",
          );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        forward();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!ready)
    return (
      <div className="container page">
        <Loading />
      </div>
    );

  return (
    <div className="container auth-page">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={initGoogle}
        onError={() => setError("Google sign-in could not load. Please use email or try again.")}
      />
      <div className="auth-story">
        <span className="brand-icon">
          <IconBucket size={36} />
        </span>
        <h1>
          Your next chapter
          <br />
          starts here.
        </h1>
        <p>
          One account for your essentials, your orders,
          <br />
          and everything campus.
        </p>
        <div className="auth-photo" />
      </div>
      <div className="auth-form">
        {account ? (
          <>
            <span className="eyebrow">GOOD TO SEE YOU</span>
            <h2>Hey, {account.name}.</h2>
            <p className="muted">{account.email}</p>
            <Link className="button primary full" href="/orders">
              My orders <IconArrowRight size={18} />
            </Link>
            {account.admin && (
              <Link className="button secondary full" href="/admin">
                Open admin dashboard
              </Link>
            )}
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await signOut();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <span className="eyebrow">WELCOME TO THE BUCKET</span>
            <h2>
              {signup ? "Make yourself at home." : "Back for more good stuff?"}
            </h2>
            <p>
              {signup
                ? "Create an account to get campus ready."
                : "Sign in to track orders and keep shopping."}
            </p>

            <div className="google-auth-wrapper">
              <div
                ref={googleBtnRef}
                id="g_id_signin"
                className="google-signin-button"
                data-type="standard"
                data-shape="pill"
                data-theme="outline"
                data-text="continue_with"
                data-size="large"
                data-logo_alignment="left"
              />

              {clientId === "PUT_YOUR_WEB_CLIENT_ID_HERE" && (
                <p className="google-auth-hint">
                  To connect your real Google Client ID, update{" "}
                  <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in{" "}
                  <code>.env.local</code>.
                </p>
              )}
            </div>

            <div className="auth-separator">
              <span>{demo ? "or continue with demo" : "or with email"}</span>
            </div>

            {demo ? (
              <div className="demo-login">
                <div className="info-box">
                  <p>
                    <strong>You're in demo mode.</strong>
                    <br />
                    Explore the complete store with a sample account. Your cart,
                    orders, and admin edits stay in this browser. No password or
                    real account is created.
                  </p>
                </div>
                <button
                  className="button primary full"
                  onClick={() => {
                    demoLogin();
                    forward();
                  }}
                >
                  Explore with a demo account <IconArrowRight size={18} />
                </button>
                <p className="small muted">
                  Connect Supabase using the README to enable email signup and
                  login.
                </p>
              </div>
            ) : (
              <form onSubmit={submit}>
                {signup && (
                  <label>
                    Your name
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                    />
                  </label>
                )}
                <label>
                  Email address
                  <input
                    name="email"
                    maxLength={254}
                    type="email"
                    required
                    autoComplete="email"
                  />
                </label>
                <label>
                  Password
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete={signup ? "new-password" : "current-password"}
                  />
                  <small className="muted">At least 8 characters.</small>
                </label>
                <button className="button primary full" disabled={busy}>
                  {busy
                    ? "Just a moment…"
                    : signup
                      ? "Create account"
                      : "Sign in"}
                  <IconArrowRight size={18} />
                </button>
                <p className="small">
                  {signup ? "Already have an account?" : "New around here?"}{" "}
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => {
                      setSignup(!signup);
                      setError("");
                      setMessage("");
                    }}
                  >
                    {signup ? "Sign in" : "Create an account"}
                  </button>
                </p>
              </form>
            )}
          </>
        )}
        <ErrorMessage message={error} />
        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
