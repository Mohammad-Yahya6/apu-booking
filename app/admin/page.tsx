"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Navbar from "../components/Navbar";

interface Booking {
  id: string;
  room_id: string;
  user_id: string;
  user_email: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: string;
  created_at: string;
}

const ROOM_MAP: Record<string, { name: string; building: string }> = {
  "a-aud-1": { name: "Auditorium 1", building: "Block A" },
  "a-aud-2": { name: "Auditorium 2", building: "Block A" },
  "a-cls-1": { name: "Classroom A1", building: "Block A" },
  "a-cls-2": { name: "Classroom A2", building: "Block A" },
  "a-cls-3": { name: "Classroom A3", building: "Block A" },
  "b-cls-1": { name: "Classroom B1", building: "Block B" },
  "b-cls-2": { name: "Classroom B2", building: "Block B" },
  "b-cls-3": { name: "Classroom B3", building: "Block B" },
  "b-cls-4": { name: "Classroom B4", building: "Block B" },
  "c-aud-3": { name: "Auditorium 3", building: "Block C" },
  "c-aud-4": { name: "Auditorium 4", building: "Block C" },
  "c-cls-1": { name: "Classroom C1", building: "Block C" },
  "c-cls-2": { name: "Classroom C2", building: "Block C" },
  "c-cls-3": { name: "Classroom C3", building: "Block C" },
  "d-aud-5": { name: "Auditorium 5", building: "Block D" },
  "d-aud-6": { name: "Auditorium 6", building: "Block D" },
  "d-aud-7": { name: "Auditorium 7", building: "Block D" },
  "d-cls-1": { name: "Classroom D1", building: "Block D" },
  "d-cls-2": { name: "Classroom D2", building: "Block D" },
  "d-cls-3": { name: "Classroom D3", building: "Block D" },
  "d-cls-4": { name: "Classroom D4", building: "Block D" },
  ...Object.fromEntries(Array.from({length:10},(_,i)=>([`lib-dr-${i+1}`,{name:`Discussion Room ${i+1}`,building:"Library"}]))),
};

const BUILDINGS = ["All", "Block A", "Block B", "Block C", "Block D", "Library"];

export default function AdminPage() {
  const router = useRouter();
  const [bookings, setBookings]             = useState<Booking[]>([]);
  const [loading, setLoading]               = useState(true);
  const [isAdmin, setIsAdmin]               = useState(false);
  const [tab, setTab]                       = useState<"upcoming"|"past">("upcoming");
  const [filterBuilding, setFilterBuilding] = useState("All");
  const [filterDate, setFilterDate]         = useState("");
  const [filterStatus, setFilterStatus]     = useState("all");
  const [cancelTarget, setCancelTarget]     = useState<Booking | null>(null);
  const [cancelReason, setCancelReason]     = useState("");
  const [cancelling, setCancelling]         = useState(false);
  const [cancelError, setCancelError]       = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login?from=/admin"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("is_admin").eq("id", user.id).single();
      if (!profile?.is_admin) { router.push("/"); return; }
      setIsAdmin(true);
      await fetchBookings();
    })();
  }, []);

  async function fetchBookings() {
    const { data } = await supabase
      .from("bookings").select("*")
      .order("date", { ascending: false })
      .order("start_time", { ascending: true });
    setBookings(data ?? []);
    setLoading(false);
  }

  async function handleCancel() {
    if (!cancelTarget || !cancelReason.trim()) { setCancelError("Please provide a reason."); return; }
    setCancelling(true); setCancelError("");

    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", cancelTarget.id);

    const room = ROOM_MAP[cancelTarget.room_id];
    const formattedDate = new Date(cancelTarget.date + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });

    await supabase.functions.invoke("send-cancellation-notice", {
      body: {
        data: {
          studentName: cancelTarget.user_email.split("@")[0],
          studentEmail: cancelTarget.user_email,
          roomName: room?.name ?? cancelTarget.room_id,
          building: room?.building ?? "",
          date: formattedDate,
          startTime: cancelTarget.start_time.slice(0,5),
          endTime: cancelTarget.end_time.slice(0,5),
          reason: cancelReason.trim(),
        },
      },
    });

    setCancelTarget(null);
    setCancelReason("");
    setCancelling(false);
    await fetchBookings();
  }

  function fmt(date: string) {
    return new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric"
    });
  }

  const today = new Date().toISOString().split("T")[0];
  const now   = new Date().toTimeString().slice(0,5);

  const upcomingBookings = bookings.filter(b =>
    b.status === "confirmed" &&
    (b.date > today || (b.date === today && b.end_time.slice(0,5) > now))
  );

  const pastBookings = bookings.filter(b =>
    b.status !== "confirmed" ||
    b.date < today ||
    (b.date === today && b.end_time.slice(0,5) <= now)
  );

  const activeList = tab === "upcoming" ? upcomingBookings : pastBookings;

  const filtered = activeList.filter(b => {
    const room = ROOM_MAP[b.room_id];
    const buildingMatch = filterBuilding === "All" || room?.building === filterBuilding;
    const dateMatch     = !filterDate || b.date === filterDate;
    const statusMatch   = filterStatus === "all" || b.status === filterStatus;
    return buildingMatch && dateMatch && statusMatch;
  });

  const stats = {
    total:     bookings.length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
  };

  if (!isAdmin && !loading) return null;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080808; --surface: #0e0e0e; --border: #141414; --border-mid: #232323;
          --text: #e4e4e4; --dim: #5c5c5c; --muted: #353535;
          --blue: #3b82f6; --blue-dark: #1d4ed8;
          --font-head: 'Roboto', sans-serif;
          --font-body: 'Roboto', sans-serif;
          --font-mono: 'Roboto Mono', monospace;
        }
        html, body { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; color: inherit; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes modalIn { from { opacity:0; transform:translateY(10px) scale(0.98); } to { opacity:1; transform:none; } }

        .page { max-width: 1100px; margin: 0 auto; padding: 48px 40px 80px; animation: fadeUp 0.4s ease both; }
        .eyebrow { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; color: var(--dim); text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .eyebrow::before { content:''; display:block; width:16px; height:0.5px; background:var(--blue-dark); }
        .page-title { font-family: var(--font-head); font-size: 30px; font-weight: 700; letter-spacing: -0.02em; color: #f0f0f0; margin-bottom: 28px; }

        .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 28px; }
        .stat { background: var(--surface); border: 0.5px solid var(--border-mid); border-radius: 8px; padding: 16px 20px; }
        .stat-val { font-size: 28px; font-weight: 700; font-family: var(--font-head); margin-bottom: 2px; }
        .stat-label { font-size: 9px; color: #444; letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--font-mono); }

        .filters { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .filter-select { background: var(--surface); border: 0.5px solid var(--border-mid); color: var(--text); font-size: 13px; padding: 8px 12px; border-radius: 8px; font-family: var(--font-body); outline: none; cursor: pointer; }
        .filter-input { background: var(--surface); border: 0.5px solid var(--border-mid); color: var(--text); font-size: 13px; padding: 8px 12px; border-radius: 8px; font-family: var(--font-body); outline: none; }
        .filter-input:focus, .filter-select:focus { border-color: #1d4ed866; }

        .results-label { font-family: var(--font-mono); font-size: 9px; color: #2a2a2a; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; }

        .table { width: 100%; border-collapse: collapse; }
        .table th { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #333; padding: 10px 14px; text-align: left; border-bottom: 0.5px solid var(--border-mid); }
        .table td { padding: 14px; border-bottom: 0.5px solid var(--border); font-size: 13px; color: #888; vertical-align: middle; }
        .table tr:hover td { background: #0d0d0d; }
        .table td.primary { color: #e4e4e4; font-weight: 500; }

        .badge { font-size: 10px; padding: 3px 10px; border-radius: 20px; font-family: var(--font-mono); white-space: nowrap; }
        .badge-confirmed { background: #0a2a18; border: 0.5px solid #22c55e44; color: #22c55e; }
        .badge-cancelled { background: #1a0808; border: 0.5px solid #ef444433; color: #f87171; }
        .badge-completed { background: #0d0d0d; border: 0.5px solid #333; color: #555; }

        .cancel-btn { font-size: 11px; color: #f87171; border: 0.5px solid #ef444433; background: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-family: var(--font-body); transition: opacity 0.15s; white-space: nowrap; }
        .cancel-btn:hover { opacity: 0.75; }

        .empty { text-align: center; padding: 60px 0; color: #252525; font-size: 13px; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(4px); }
        .modal { background: #0e0e0e; border: 0.5px solid #2a2a2a; border-radius: 14px; width: 100%; max-width: 460px; overflow: hidden; animation: modalIn 0.2s ease; }
        .modal-header { padding: 20px 24px 16px; border-bottom: 0.5px solid #1a1a1a; display: flex; align-items: flex-start; justify-content: space-between; }
        .modal-eyebrow { font-family: var(--font-mono); font-size: 9px; color: #2a2a2a; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 4px; }
        .modal-title { font-family: var(--font-head); font-size: 17px; font-weight: 700; color: #f0f0f0; }
        .modal-close { width: 28px; height: 28px; border-radius: 7px; background: #141414; border: 0.5px solid #222; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #555; font-size: 18px; line-height: 1; transition: color 0.15s; }
        .modal-close:hover { color: #999; }
        .modal-body { padding: 20px 24px; }
        .modal-footer { padding: 14px 24px 20px; border-top: 0.5px solid #1a1a1a; display: flex; gap: 8px; }

        .booking-summary { background: #080808; border: 0.5px solid #1a1a1a; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; font-size: 13px; color: #666; line-height: 1.8; }
        .booking-summary strong { color: #e4e4e4; }

        .reason-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.12em; color: #444; text-transform: uppercase; margin-bottom: 7px; display: block; }
        .reason-input { width: 100%; background: var(--bg); border: 0.5px solid var(--border-mid); color: var(--text); font-size: 13px; padding: 10px 14px; border-radius: 8px; font-family: var(--font-body); outline: none; resize: vertical; min-height: 80px; transition: border-color 0.15s; }
        .reason-input:focus { border-color: #ef444433; }
        .reason-input::placeholder { color: #2a2a2a; }

        .modal-btn { padding: 10px 16px; border-radius: 8px; font-size: 13px; font-family: var(--font-body); cursor: pointer; transition: opacity 0.15s; font-weight: 500; }
        .modal-btn:hover { opacity: 0.8; }
        .modal-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .modal-btn-discard { flex:1; background: none; border: 0.5px solid #232323; color: #444; }
        .modal-btn-cancel  { flex:2; background: #7f1d1d; border: none; color: #fca5a5; }

        .err { font-size: 12px; color: #f87171; margin-top: 8px; }
      `}</style>

      <Navbar />

      <main className="page">
        <p className="eyebrow">Admin</p>
        <h1 className="page-title">All bookings</h1>

        {/* Stats */}
        <div className="stats">
          <div className="stat">
            <div className="stat-val" style={{ color:"var(--blue)" }}>{stats.total}</div>
            <div className="stat-label">Total bookings</div>
          </div>
          <div className="stat">
            <div className="stat-val" style={{ color:"#22c55e" }}>{stats.confirmed}</div>
            <div className="stat-label">Confirmed</div>
          </div>
          <div className="stat">
            <div className="stat-val" style={{ color:"#f87171" }}>{stats.cancelled}</div>
            <div className="stat-label">Cancelled</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"0.5px solid #1a1a1a", marginBottom:24 }}>
          {(["upcoming","past"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontSize:13, padding:"8px 20px", background:"none",
              borderLeft:"none", borderRight:"none", borderTop:"none",
              borderBottom: tab === t ? "1.5px solid #3b82f6" : "1.5px solid transparent",
              color: tab === t ? "#3b82f6" : "#333",
              cursor:"pointer", fontFamily:"var(--font-body)",
              marginBottom:"-0.5px", transition:"color 0.15s",
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span style={{
                marginLeft:8, fontSize:10,
                background: tab === t ? "#1d4ed822" : "#1a1a1a",
                color: tab === t ? "#3b82f6" : "#333",
                padding:"1px 7px", borderRadius:10,
              }}>
                {t === "upcoming" ? upcomingBookings.length : pastBookings.length}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="filters">
          <select className="filter-select" value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)}>
            {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <input type="date" className="filter-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          {tab === "past" && (
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="confirmed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
          {(filterBuilding !== "All" || filterDate || filterStatus !== "all") && (
            <button
              onClick={() => { setFilterBuilding("All"); setFilterDate(""); setFilterStatus("all"); }}
              style={{ background:"none", border:"0.5px solid #232323", color:"#444", fontSize:12, padding:"8px 14px", borderRadius:8, cursor:"pointer", fontFamily:"var(--font-body)" }}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="results-label">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>

        {loading ? (
          <div className="empty">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No bookings found.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Building</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>User</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const room = ROOM_MAP[b.room_id];
                const isCompleted = tab === "past" && b.status === "confirmed";
                return (
                  <tr key={b.id}>
                    <td className="primary">{room?.name ?? b.room_id}</td>
                    <td>{room?.building}</td>
                    <td>{fmt(b.date)}</td>
                    <td style={{ fontFamily:"var(--font-mono)", fontSize:12 }}>
                      {b.start_time.slice(0,5)} – {b.end_time.slice(0,5)}
                    </td>
                    <td>{b.purpose}</td>
                    <td style={{ fontFamily:"var(--font-mono)", fontSize:11 }}>{b.user_email}</td>
                    <td>
                      <span className={`badge ${isCompleted ? "badge-completed" : b.status === "confirmed" ? "badge-confirmed" : "badge-cancelled"}`}>
                        {isCompleted ? "completed" : b.status}
                      </span>
                    </td>
                    <td>
                      {tab === "upcoming" && b.status === "confirmed" && (
                        <button className="cancel-btn" onClick={() => { setCancelTarget(b); setCancelReason(""); setCancelError(""); }}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>

      {/* Cancel Modal */}
      {cancelTarget && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setCancelTarget(null); }}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">Admin action</div>
                <div className="modal-title">Cancel booking</div>
              </div>
              <button className="modal-close" onClick={() => setCancelTarget(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="booking-summary">
                <strong>{ROOM_MAP[cancelTarget.room_id]?.name}</strong> · {ROOM_MAP[cancelTarget.room_id]?.building}<br />
                {fmt(cancelTarget.date)} · {cancelTarget.start_time.slice(0,5)} – {cancelTarget.end_time.slice(0,5)}<br />
                <span style={{ fontSize:12 }}>Booked by: {cancelTarget.user_email}</span>
              </div>

              <label className="reason-label">Reason for cancellation</label>
              <textarea
                className="reason-input"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Room required for university event, maintenance scheduled..."
              />
              <p style={{ fontSize:11, color:"#505050", marginTop:6, fontFamily:"var(--font-mono)" }}>
                An email will be sent to the student with this reason.
              </p>
              {cancelError && <div className="err">{cancelError}</div>}
            </div>

            <div className="modal-footer">
              <button className="modal-btn modal-btn-discard" onClick={() => setCancelTarget(null)}>Discard</button>
              <button className="modal-btn modal-btn-cancel" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? "Cancelling..." : "Cancel booking & notify student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}