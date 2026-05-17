"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  async function handleSignup() {
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    if (err) { setError(err.message); setLoading(false); }
    else setDone(true);
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080808; --surface: #0e0e0e; --border: #141414; --border-mid: #232323;
          --text: #e4e4e4; --dim: #444;
          --blue: #3b82f6; --blue-dark: #1d4ed8;
          --font-head: 'Roboto', sans-serif;
          --font-body: 'Roboto', sans-serif;
          --font-mono: 'Roboto Mono', monospace;
        }
        html, body { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; color: inherit; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        .nav { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; height: 54px; background: rgba(8,8,8,0.92); backdrop-filter: blur(14px); border-bottom: 0.5px solid var(--border); }
        .logo { font-family: var(--font-head); font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
        .logo span { color: var(--blue); }

        .wrap { min-height: calc(100vh - 54px); display: flex; align-items: center; justify-content: center; padding: 40px 24px; }

        .card { width: 100%; max-width: 400px; background: var(--surface); border: 0.5px solid var(--border-mid); border-radius: 16px; padding: 36px; animation: fadeUp 0.4s ease both; }

        .card-eyebrow { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; color: var(--dim); text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .card-eyebrow::before { content: ''; display: block; width: 16px; height: 0.5px; background: var(--blue-dark); }
        .card-title { font-family: var(--font-head); font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: #f0f0f0; margin-bottom: 28px; }

        .field { margin-bottom: 14px; }
        .field label { display: block; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.12em; color: var(--dim); text-transform: uppercase; margin-bottom: 6px; }
        .field input { width: 100%; background: var(--bg); border: 0.5px solid var(--border-mid); color: var(--text); font-size: 14px; padding: 11px 14px; border-radius: 8px; font-family: var(--font-body); outline: none; transition: border-color 0.15s; }
        .field input:focus { border-color: #1d4ed866; }
        .field input::placeholder { color: #2a2a2a; }

        .err { font-size: 12px; color: #f87171; margin-bottom: 12px; }

        .submit-btn { width: 100%; padding: 12px; border-radius: 8px; border: none; background: var(--blue-dark); color: #fff; font-family: var(--font-body); font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; margin-top: 4px; }
        .submit-btn:hover:not(:disabled) { background: var(--blue); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .divider { height: 0.5px; background: var(--border-mid); margin: 20px 0; }

        .footer-text { text-align: center; font-size: 13px; color: var(--dim); }
        .footer-link { color: var(--blue); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #1d4ed855; transition: text-decoration-color 0.15s; }
        .footer-link:hover { text-decoration-color: var(--blue); }

        .success { text-align: center; padding: 16px 0; }
        .success-icon { font-size: 32px; margin-bottom: 12px; }
        .success-title { font-family: var(--font-head); font-size: 18px; font-weight: 700; color: #f0f0f0; margin-bottom: 8px; }
        .success-text { font-size: 13px; color: var(--dim); line-height: 1.6; }
      `}</style>

      <nav className="nav">
        <a href="/" className="logo">APU <span>bookings</span></a>
      </nav>

      <div className="wrap">
        <div className="card">
          {done ? (
            <div className="success">
              <div className="success-icon">✉️</div>
              <div className="success-title">Check your email</div>
              <p className="success-text">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account then log in.</p>
            </div>
          ) : (
            <>
              <p className="card-eyebrow">Get started</p>
              <h1 className="card-title">Create an account</h1>

              <div className="field">
                <label>Full name</label>
                <input
                  type="text" value={name} placeholder="Your name"
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Email</label>
                <input
                  type="email" value={email} placeholder="you@example.com"
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Password</label>
                <input
                  type="password" value={password} placeholder="Min. 6 characters"
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSignup()}
                />
              </div>

              {error && <div className="err">{error}</div>}

              <button className="submit-btn" onClick={handleSignup} disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>

              <div className="divider" />

              <p className="footer-text">
                Already have an account?{" "}
                <a href="/auth/login" className="footer-link">Log in</a>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}