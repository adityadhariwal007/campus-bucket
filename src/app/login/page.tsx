"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { IconArrowRight, IconBucket } from "@tabler/icons-react";
import { useStore } from "@/components/store";
import { validateNewPassword } from "@/lib/account-ui";
import { loginDestination } from "@/lib/security";
import { supabase } from "@/lib/supabase";
import { ErrorMessage, Loading } from "@/components/ui";

export default function Login() {
  const { account, demo, demoLogin, signOut, ready } = useStore();
  const router = useRouter();
  const [signup, setSignup] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [forgot, setForgot] = useState(false),
    [recovery, setRecovery] = useState(false),
    [googleReady, setGoogleReady] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "PUT_YOUR_WEB_CLIENT_ID_HERE";

  useEffect(() => {
    if (!supabase) return;
    setRecovery(sessionStorage.getItem("campus-password-recovery") === "true");
    const urlError = new URLSearchParams(window.location.hash.slice(1)).get("error_description");
    if (urlError) setError("This reset link is invalid or expired. Request a new link below.");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        sessionStorage.setItem("campus-password-recovery", "true");
        setRecovery(true);
        setForgot(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const forward = useCallback(async () => {
    const next = new URLSearchParams(window.location.search).get("next");
    if (!supabase) {
      router.replace(loginDestination(false, next));
      return;
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Please sign in again to continue.");
    const { data: admin, error: roleError } = await supabase
      .from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    if (roleError) throw new Error("Could not check account access. Please try again.");
    router.replace(loginDestination(!!admin, next));
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (account?.admin && !demo && !recovery && sessionStorage.getItem("campus-password-recovery") !== "true") router.replace("/admin");
  }, [account?.admin, demo, recovery, router]);

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
        await forward();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [forward],
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
          width: Math.min(360, googleBtnRef.current.clientWidth || 360),
          logo_alignment: "left",
        });
        setGoogleReady(true);
      }
    } catch (e) {
      console.warn("Google Sign-In initialization notice:", e);
    }
  }, [clientId, handleCredentialResponse, signup, ready, account, forgot, recovery]);

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
      if (f.get("website")) throw new Error("Unable to submit this form.");
      const email = String(f.get("email")).trim(),
        password = String(f.get("password"));
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name: String(f.get("name")).trim(), website: String(f.get("website") || "") },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (error) throw error;
        if (data.session) await forward();
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
        await forward();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function recover(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || busy) return;
    const form = new FormData(e.currentTarget);
    setBusy(true); setError(""); setMessage("");
    try {
      if (form.get("website")) throw new Error("Unable to submit this form.");
      if (recovery) {
        const password = String(form.get("password"));
        validateNewPassword(password, String(form.get("confirm")));
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        sessionStorage.removeItem("campus-password-recovery");
        setRecovery(false);
        setMessage("Password updated. You can continue with your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(String(form.get("email")).trim(), { redirectTo: `${window.location.origin}/login` });
        if (error) throw error;
        setMessage("If this address has an account, a reset link is on its way. Open it in this browser.");
      }
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function googleFallback() {
    if (!supabase || busy) return;
    setBusy(true); setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/login` } });
      if (error) throw error;
    } catch (e) { setError((e as Error).message); setBusy(false); }
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
        {forgot || recovery ? (
          <form onSubmit={recover}>
            <label className="form-trap" aria-hidden="true">Leave blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <span className="eyebrow">YOUR ACCOUNT</span>
            <h2>{recovery ? "Choose a new password." : "Forgot your password?"}</h2>
            <p>{recovery ? "Enter your new password twice to save it." : "We'll email you a secure link to reset it."}</p>
            {recovery ? <>
              <label>New password<input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></label>
              <label>Confirm new password<input name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></label>
            </> : <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>}
            <button className="button primary full" disabled={busy}>{busy ? "Just a moment…" : recovery ? "Save new password" : "Send reset link"}</button>
            {!recovery && <button type="button" className="text-button" onClick={() => { setForgot(false); setError(""); setMessage(""); }}>Back to sign in</button>}
          </form>
        ) : account ? (
          <>
            <span className="eyebrow">GOOD TO SEE YOU</span>
            <h2>Hey, {account.name}.</h2>
            <p className="muted">{account.email}</p>
            <Link className="button primary full" href="/orders">
              My orders <IconArrowRight size={18} />
            </Link>
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
              {!googleReady && <button type="button" className="button secondary full" onClick={googleFallback} disabled={busy}>Continue with Google</button>}
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
                    router.replace("/orders");
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
                <label className="form-trap" aria-hidden="true">Leave blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
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
                {!signup && <button type="button" className="text-button" onClick={() => { setForgot(true); setError(""); setMessage(""); }}>Forgot password?</button>}
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
