"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [email, setEmail]           = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl]   = useState("");
  const [initials, setInitials]     = useState("");
  const [userId, setUserId]         = useState("");

  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError]   = useState("");

  const [currentPw, setCurrentPw]   = useState("");
  const [newPw, setNewPw]           = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading]   = useState(false);
  const [pwSuccess, setPwSuccess]   = useState(false);
  const [pwError, setPwError]       = useState("");

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login?from=/profile"); return; }
      setUserId(user.id);
      setEmail(user.email ?? "");
      const name = user.user_metadata?.full_name ?? "";
      setDisplayName(name);
      setAvatarUrl(user.user_metadata?.avatar_url ?? "");
      const parts = name.trim().split(" ");
      setInitials(parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (parts[0]?.[0] ?? "?").toUpperCase()
      );
    })();
  }, []);

  async function saveName() {
    if (!displayName.trim()) { setNameError("Name cannot be empty."); return; }
    setNameLoading(true); setNameError(""); setNameSuccess(false);
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
    if (error) setNameError(error.message);
    else {
      setNameSuccess(true);
      const parts = displayName.trim().split(" ");
      setInitials(parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (parts[0]?.[0] ?? "?").toUpperCase()
      );
      setTimeout(() => setNameSuccess(false), 2500);
    }
    setNameLoading(false);
  }

  async function savePassword() {
    if (!currentPw || !newPw || !confirmPw) { setPwError("Please fill in all fields."); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords don't match."); return; }
    setPwLoading(true); setPwError(""); setPwSuccess(false);

    // re-authenticate first
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: currentPw });
    if (signInErr) { setPwError("Current password is incorrect."); setPwLoading(false); return; }

    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) setPwError(error.message);
    else {
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 2500);
    }
    setPwLoading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setAvatarError("Image must be under 2MB."); return; }
    setAvatarLoading(true); setAvatarError("");

    const ext = file.name.split(".").pop();
    const path = `avatars/${userId}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) { setAvatarError(uploadErr.message); setAvatarLoading(false); return; }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl + `?t=${Date.now()}`;
    await supabase.auth.updateUser({ data: { avatar_url: url } });
    setAvatarUrl(url);
    setAvatarLoading(false);
  }

  async function deleteAccount() {
    const confirmed = window.confirm("Are you sure? This will permanently delete your account and all bookings. This cannot be undone.");
    if (!confirmed) return;
    await supabase.from("bookings").delete().eq("user_id", userId);
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080808; --surface: #0e0e0e; --border: #141414; --border-mid: #232323;
          --text: #e4e4e4; --dim: #8a8a8a; --muted: #747474;
          --blue: #3b82f6; --blue-dark: #1d4ed8;
          --font-head: 'Roboto', sans-serif;
          --font-body: 'Roboto', sans-serif;
          --font-mono: 'Roboto Mono', monospace;
        }
        html, body { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; color: inherit; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .page { max-width: 640px; margin: 0 auto; padding: 52px 32px 80px; animation: fadeUp 0.4s ease both; }
        .eyebrow { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; color: var(--muted); text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .eyebrow::before { content:''; display:block; width:16px; height:0.5px; background:var(--blue-dark); }
        .page-title { font-family: var(--font-head); font-size: 30px; font-weight: 700; letter-spacing: -0.02em; color: #f0f0f0; margin-bottom: 32px; }

        .section { background: var(--surface); border: 0.5px solid var(--border-mid); border-radius: 12px; padding: 24px; margin-bottom: 14px; }
        .section-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.14em; color: var(--muted); text-transform: uppercase; margin-bottom: 20px; }

        .avatar-row { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
        .avatar-circle { width: 72px; height: 72px; border-radius: 50%; background: var(--blue-dark); border: 1.5px solid #2563eb; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #fff; flex-shrink: 0; position: relative; cursor: pointer; overflow: hidden; }
        .avatar-circle img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; border-radius: 50%; }
        .avatar-circle:hover .avatar-overlay { opacity: 1; }
        .avatar-meta-name { font-size: 16px; font-weight: 500; color: var(--text); margin-bottom: 3px; }
        .avatar-meta-email { font-size: 12px; color: var(--muted); font-family: var(--font-mono); margin-bottom: 10px; }
        .upload-btn { font-size: 12px; color: var(--blue); border: 0.5px solid #1d4ed855; background: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; transition: opacity 0.15s; font-family: var(--font-body); }
        .upload-btn:hover { opacity: 0.75; }

        .divider { height: 0.5px; background: var(--border-mid); margin: 18px 0; }

        .field { margin-bottom: 14px; }
        .field:last-of-type { margin-bottom: 0; }
        .field label { display: block; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.12em; color: var(--dim); text-transform: uppercase; margin-bottom: 7px; }
        .field-wrap { position: relative; }
        .field input { width: 100%; background: var(--bg); border: 0.5px solid var(--border-mid); color: var(--text); font-size: 13px; padding: 10px 14px; border-radius: 8px; font-family: var(--font-body); outline: none; transition: border-color 0.15s; }
        .field input::placeholder { color: #444; }
        .field input:focus { border-color: #1d4ed866; }
        .field input.has-toggle { padding-right: 40px; }
        .toggle-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #333; padding: 0; display: flex; align-items: center; transition: color 0.15s; }
        .toggle-eye:hover { color: #666; }
        .field-hint { font-size: 11px; color: #333; margin-top: 5px; font-family: var(--font-mono); }

        .save-btn { width: 100%; padding: 11px; border-radius: 8px; border: none; background: var(--blue-dark); color: #fff; font-family: var(--font-body); font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s; margin-top: 16px; }
        .save-btn:hover:not(:disabled) { background: var(--blue); }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .success-msg { font-size: 12px; color: #86efac; margin-top: 10px; text-align: center; }
        .error-msg   { font-size: 12px; color: #f87171; margin-top: 10px; }

        .danger-section { background: var(--surface); border: 0.5px solid #ef444422; border-radius: 12px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .danger-text strong { display: block; font-size: 14px; font-weight: 500; color: #888; margin-bottom: 3px; }
        .danger-text span { font-size: 12px; color: var(--muted); }
        .danger-btn { font-size: 12px; color: #f87171; border: 0.5px solid #ef444433; background: none; padding: 7px 16px; border-radius: 6px; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: opacity 0.15s; font-family: var(--font-body); }
        .danger-btn:hover { opacity: 0.75; }
      `}</style>

      <Navbar />

      <main className="page">
        <p className="eyebrow">Account</p>
        <h1 className="page-title">Edit profile</h1>

        {/* Avatar + display name */}
        <div className="section">
          <div className="section-label">Profile picture & name</div>

          <div className="avatar-row">
            <div className="avatar-circle" onClick={() => fileRef.current?.click()}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" />
                : initials
              }
              <div className="avatar-overlay">
                {avatarLoading
                  ? <span style={{ fontSize:11, color:"#fff" }}>...</span>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                }
              </div>
            </div>
            <div>
              <div className="avatar-meta-name">{displayName || "—"}</div>
              <div className="avatar-meta-email">{email}</div>
              <button className="upload-btn" onClick={() => fileRef.current?.click()}>
                {avatarLoading ? "Uploading..." : "Upload photo"}
              </button>
            </div>
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarUpload} />
          {avatarError && <div className="error-msg">{avatarError}</div>}

          <div className="divider" />

          <div className="field">
            <label>Display name</label>
            <input
              type="text" value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          {nameError   && <div className="error-msg">{nameError}</div>}
          {nameSuccess && <div className="success-msg">Name updated successfully.</div>}

          <button className="save-btn" onClick={saveName} disabled={nameLoading}>
            {nameLoading ? "Saving..." : "Save changes"}
          </button>
        </div>

        {/* Password */}
        <div className="section">
          <div className="section-label">Password</div>

          {(["current","new","confirm"] as const).map(which => {
            const value    = which==="current" ? currentPw : which==="new" ? newPw : confirmPw;
            const setValue = which==="current" ? setCurrentPw : which==="new" ? setNewPw : setConfirmPw;
            const show     = which==="current" ? showCurrent : which==="new" ? showNew : showConfirm;
            const setShow  = which==="current" ? setShowCurrent : which==="new" ? setShowNew : setShowConfirm;
            const label    = which==="current" ? "Current password" : which==="new" ? "New password" : "Confirm new password";
            return (
              <div className="field" key={which}>
                <label>{label}</label>
                <div className="field-wrap">
                  <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={which==="current" ? "Enter current password" : which==="new" ? "Min. 6 characters" : "Repeat new password"}
                    className="has-toggle"
                  />
                  <button className="toggle-eye" onClick={() => setShow(s => !s)} type="button">
                    {show
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                {which==="new" && <div className="field-hint">Min. 6 characters</div>}
              </div>
            );
          })}

          {pwError   && <div className="error-msg">{pwError}</div>}
          {pwSuccess && <div className="success-msg">Password updated successfully.</div>}

          <button className="save-btn" onClick={savePassword} disabled={pwLoading}>
            {pwLoading ? "Updating..." : "Update password"}
          </button>
        </div>

        {/* Danger zone */}
        <div className="danger-section">
          <div className="danger-text">
            <strong>Delete account</strong>
            <span>Permanently removes your account and all bookings.</span>
          </div>
          <button className="danger-btn" onClick={deleteAccount}>Delete account</button>
        </div>
      </main>
    </>
  );
}