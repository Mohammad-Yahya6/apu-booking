"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser]         = useState<User | null>(null);
  const [ready, setReady]       = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin]   = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      setReady(true);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles").select("is_admin").eq("id", user.id).single();
        setIsAdmin(profile?.is_admin ?? false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  function getInitials(user: User) {
    const name = user.user_metadata?.full_name as string | undefined;
    if (name) {
      const parts = name.trim().split(" ");
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return user.email?.[0].toUpperCase() ?? "?";
  }

  return (
    <>
      <style>{`
        .nav {
          position: sticky; top: 0; z-index: 50;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 68px;
          background: rgba(8,8,8,0.92);
          backdrop-filter: blur(14px);
          border-bottom: 0.5px solid #141414;
        }
        .logo { font-family: 'Roboto', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; text-decoration: none; color: #e4e4e4; }
        .logo span { color: #3b82f6; }
        .nav-links { display: flex; gap: 8px; align-items: center; min-height: 34px; }
        .btn { font-family: 'Roboto', sans-serif; font-size: 12.5px; font-weight: 500; padding: 6px 18px; border-radius: 999px; border: 0.5px solid transparent; transition: opacity 0.15s; white-space: nowrap; cursor: pointer; text-decoration: none; display: inline-block; background: none; }
        .btn:hover { opacity: 0.75; }
        .btn-ghost   { color: #444;    border-color: #232323; }
        .btn-outline { color: #3b82f6; border-color: #1d4ed866; }
        .btn-solid   { color: #fff;    background: #1d4ed8; border-color: #1d4ed8; }

        .avatar-wrap { position: relative; }
        .avatar { width: 38px; height: 38px; border-radius: 50%; background: #1d4ed8; border: 1.5px solid #2563eb; color: #fff; font-family: 'Roboto', sans-serif; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.15s; user-select: none; margin-right: 24px; }
        .avatar:hover { border-color: #3b82f6; }
        .avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

        .dropdown { position: absolute; top: calc(100% + 10px); right: 0; background: #0e0e0e; border: 0.5px solid #232323; border-radius: 10px; padding: 6px; min-width: 190px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); animation: dropIn 0.15s ease; }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .dropdown-email { font-family: 'Roboto Mono', monospace; font-size: 10px; color: #333; padding: 6px 10px 10px; border-bottom: 0.5px solid #1a1a1a; margin-bottom: 4px; word-break: break-all; }
        .dropdown-item { display: block; width: 100%; text-align: left; background: none; border: none; font-family: 'Roboto', sans-serif; font-size: 13px; color: #888; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.1s, color 0.1s; text-decoration: none; }
        .dropdown-item:hover { background: #141414; color: #e4e4e4; }
        .dropdown-item.danger { color: #f87171; }
        .dropdown-item.danger:hover { background: #1a0a0a; color: #f87171; }
        .dropdown-divider { height: 0.5px; background: #1a1a1a; margin: 4px 0; }

        @media (max-width: 700px) {
          .nav { padding: 0 16px; height: 54px; }
          .logo { font-size: 15px; }
          .btn { padding: 5px 12px; font-size: 11.5px; }
          .avatar { margin-right: 8px; }
        }
      `}</style>

      <nav className="nav">
<div style={{ display:"flex", alignItems:"center", gap:"28px" }}>
  <a href="/" className="logo">APU <span>bookings</span></a>
  <a href="/" style={{ fontFamily:"'Roboto',sans-serif", fontSize:"15px", color:"#aaa", textDecoration:"none", transition:"color 0.15s" }}
    onMouseEnter={e=>(e.currentTarget.style.color="#fff")}
    onMouseLeave={e=>(e.currentTarget.style.color="#aaa")}
  >Home</a>
  <a href="/bookings" style={{ fontFamily:"'Roboto',sans-serif", fontSize:"15px", color:"#aaa", textDecoration:"none", transition:"color 0.15s" }}
    onMouseEnter={e=>(e.currentTarget.style.color="#fff")}
    onMouseLeave={e=>(e.currentTarget.style.color="#aaa")}
  >My bookings</a>
</div>
        <div className="nav-links">
          {ready && (
            user ? (
              <div className="avatar-wrap">
                <div className="avatar" onClick={() => setMenuOpen(o => !o)}>
                  {user.user_metadata?.avatar_url
                    ? <img src={user.user_metadata.avatar_url} alt="avatar" />
                    : getInitials(user)
                  }
                </div>
                {menuOpen && (
                  <div className="dropdown">
                    <div className="dropdown-email">{user.email}</div>
                    {isAdmin && (
                      <a href="/admin" className="dropdown-item" onClick={() => setMenuOpen(false)}>Admin panel</a>
                    )}
                    <a href="/" className="dropdown-item" onClick={() => setMenuOpen(false)}>Home</a>
                    <a href="/bookings" className="dropdown-item" onClick={() => setMenuOpen(false)}>My bookings</a>
                    <a href="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>Edit profile</a>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={signOut}>Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a href="/auth/signup" className="btn btn-outline">Signup</a>
                <a href="/auth/login"  className="btn btn-solid">Login</a>
              </>
            )
          )}
        </div>
      </nav>
    </>
  );
}