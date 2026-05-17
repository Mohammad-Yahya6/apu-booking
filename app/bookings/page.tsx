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
}

const ROOM_MAP: Record<string, { name: string; building: string; siblings: string[] }> = {
  "a-aud-1": { name: "Auditorium 1", building: "Block A", siblings: ["a-aud-1","a-aud-2","a-cls-1","a-cls-2","a-cls-3"] },
  "a-aud-2": { name: "Auditorium 2", building: "Block A", siblings: ["a-aud-1","a-aud-2","a-cls-1","a-cls-2","a-cls-3"] },
  "a-cls-1": { name: "Classroom A1", building: "Block A", siblings: ["a-aud-1","a-aud-2","a-cls-1","a-cls-2","a-cls-3"] },
  "a-cls-2": { name: "Classroom A2", building: "Block A", siblings: ["a-aud-1","a-aud-2","a-cls-1","a-cls-2","a-cls-3"] },
  "a-cls-3": { name: "Classroom A3", building: "Block A", siblings: ["a-aud-1","a-aud-2","a-cls-1","a-cls-2","a-cls-3"] },
  "b-cls-1": { name: "Classroom B1", building: "Block B", siblings: ["b-cls-1","b-cls-2","b-cls-3","b-cls-4"] },
  "b-cls-2": { name: "Classroom B2", building: "Block B", siblings: ["b-cls-1","b-cls-2","b-cls-3","b-cls-4"] },
  "b-cls-3": { name: "Classroom B3", building: "Block B", siblings: ["b-cls-1","b-cls-2","b-cls-3","b-cls-4"] },
  "b-cls-4": { name: "Classroom B4", building: "Block B", siblings: ["b-cls-1","b-cls-2","b-cls-3","b-cls-4"] },
  "c-aud-3": { name: "Auditorium 3", building: "Block C", siblings: ["c-aud-3","c-aud-4","c-cls-1","c-cls-2","c-cls-3"] },
  "c-aud-4": { name: "Auditorium 4", building: "Block C", siblings: ["c-aud-3","c-aud-4","c-cls-1","c-cls-2","c-cls-3"] },
  "c-cls-1": { name: "Classroom C1", building: "Block C", siblings: ["c-aud-3","c-aud-4","c-cls-1","c-cls-2","c-cls-3"] },
  "c-cls-2": { name: "Classroom C2", building: "Block C", siblings: ["c-aud-3","c-aud-4","c-cls-1","c-cls-2","c-cls-3"] },
  "c-cls-3": { name: "Classroom C3", building: "Block C", siblings: ["c-aud-3","c-aud-4","c-cls-1","c-cls-2","c-cls-3"] },
  "d-aud-5": { name: "Auditorium 5", building: "Block D", siblings: ["d-aud-5","d-aud-6","d-aud-7","d-cls-1","d-cls-2","d-cls-3","d-cls-4"] },
  "d-aud-6": { name: "Auditorium 6", building: "Block D", siblings: ["d-aud-5","d-aud-6","d-aud-7","d-cls-1","d-cls-2","d-cls-3","d-cls-4"] },
  "d-aud-7": { name: "Auditorium 7", building: "Block D", siblings: ["d-aud-5","d-aud-6","d-aud-7","d-cls-1","d-cls-2","d-cls-3","d-cls-4"] },
  "d-cls-1": { name: "Classroom D1", building: "Block D", siblings: ["d-aud-5","d-aud-6","d-aud-7","d-cls-1","d-cls-2","d-cls-3","d-cls-4"] },
  "d-cls-2": { name: "Classroom D2", building: "Block D", siblings: ["d-aud-5","d-aud-6","d-aud-7","d-cls-1","d-cls-2","d-cls-3","d-cls-4"] },
  "d-cls-3": { name: "Classroom D3", building: "Block D", siblings: ["d-aud-5","d-aud-6","d-aud-7","d-cls-1","d-cls-2","d-cls-3","d-cls-4"] },
  "d-cls-4": { name: "Classroom D4", building: "Block D", siblings: ["d-aud-5","d-aud-6","d-aud-7","d-cls-1","d-cls-2","d-cls-3","d-cls-4"] },
  ...Object.fromEntries(Array.from({length:10},(_,i)=>([`lib-dr-${i+1}`,{name:`Discussion Room ${i+1}`,building:"Library",siblings:Array.from({length:10},(_,j)=>`lib-dr-${j+1}`)}]))),
};

const TIME_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];

function Calendar({ value, min, onChange }: { value: string; min: string; onChange: (d: string) => void }) {
  const minDate = new Date(min + "T00:00:00");
  const [viewed, setViewed] = useState(() => {
    const d = value ? new Date(value + "T00:00:00") : minDate;
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const selected = value ? new Date(value + "T00:00:00") : null;
  const firstDay = new Date(viewed.year, viewed.month, 1).getDay();
  const daysInMonth = new Date(viewed.year, viewed.month + 1, 0).getDate();
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  function isPast(day: number) { return new Date(viewed.year, viewed.month, day) < minDate; }
  function isTooFar(day: number) {
    const d = new Date(viewed.year, viewed.month, day);
    const limit = new Date(minDate);
    limit.setDate(minDate.getDate() + (14 - minDate.getDay()));
    return d > limit;
  }
  function isDisabled(day: number) {
    const d = new Date(viewed.year, viewed.month, day);
    return isPast(day) || isTooFar(day) || d.getDay() === 0 || d.getDay() === 6;
  }
  function isSelected(day: number) {
    return selected?.getFullYear()===viewed.year && selected?.getMonth()===viewed.month && selected?.getDate()===day;
  }
  function isToday(day: number) {
    return minDate.getFullYear()===viewed.year && minDate.getMonth()===viewed.month && minDate.getDate()===day;
  }
  function select(day: number) {
    if (isDisabled(day)) return;
    onChange(`${viewed.year}-${String(viewed.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`);
  }

  const cells: (number|null)[] = [];
  for (let i=0;i<firstDay;i++) cells.push(null);
  for (let d=1;d<=daysInMonth;d++) cells.push(d);

  return (
    <div style={{width:"100%"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <button onClick={()=>setViewed(v=>v.month===0?{year:v.year-1,month:11}:{...v,month:v.month-1})} style={{background:"none",border:"0.5px solid #232323",color:"#555",width:24,height:24,borderRadius:6,cursor:"pointer",fontSize:14}}>‹</button>
        <span style={{fontFamily:"'Roboto',sans-serif",fontSize:12,fontWeight:600,color:"#ccc"}}>{MONTHS[viewed.month]} {viewed.year}</span>
        <button onClick={()=>setViewed(v=>v.month===11?{year:v.year+1,month:0}:{...v,month:v.month+1})} style={{background:"none",border:"0.5px solid #232323",color:"#555",width:24,height:24,borderRadius:6,cursor:"pointer",fontSize:14}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:2}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:9,color:"#252525",padding:"2px 0",letterSpacing:"0.08em",fontFamily:"'Roboto Mono',monospace"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((day,i)=>(
          <div key={i} onClick={()=>day&&select(day)} style={{
            textAlign:"center",padding:"5px 0",borderRadius:5,fontSize:11,fontFamily:"'Roboto',sans-serif",
            cursor:day&&!isDisabled(day)?"pointer":"default",
            color:!day?"transparent":isDisabled(day)?"#252525":isSelected(day)?"#fff":isToday(day)?"#3b82f6":"#666",
            background:day&&isSelected(day)?"#1d4ed8":"transparent",
            border:day&&isToday(day)&&!isSelected(day)?"0.5px solid #1d4ed855":"0.5px solid transparent",
          }}
          onMouseEnter={e=>{if(day&&!isDisabled(day)&&!isSelected(day))(e.currentTarget as HTMLDivElement).style.background="#111";}}
          onMouseLeave={e=>{if(day&&!isSelected(day))(e.currentTarget as HTMLDivElement).style.background="transparent";}}
          >{day??""}</div>
        ))}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const [tab, setTab]                         = useState<"upcoming"|"past"|"cancelled">("upcoming");
  const [bookings, setBookings]               = useState<Booking[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [checking, setChecking]               = useState(true);
  const [editing, setEditing]                 = useState<Booking | null>(null);
  const [editDate, setEditDate]               = useState("");
  const [editSlot, setEditSlot]               = useState("");
  const [editTakenSlots, setEditTakenSlots]   = useState<{ start: string; end: string }[]>([]);
  const [editUserSlots, setEditUserSlots]     = useState(0);
  const [saving, setSaving]                   = useState(false);
  const [cancelling, setCancelling]           = useState(false);
  const [error, setError]                     = useState("");
  const [cancelError, setCancelError]         = useState("");

  const today = new Date().toISOString().split("T")[0];
  const now   = new Date().toTimeString().slice(0,5);

  useEffect(() => {
    fetchBookings();
    const channel = supabase.channel("my-bookings")
      .on("postgres_changes", { event:"*", schema:"public", table:"bookings" }, fetchBookings)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchBookings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login?from=/bookings"); return; }
    const { data } = await supabase
      .from("bookings").select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    setBookings(data ?? []);
    setLoading(false);
    setChecking(false);
  }

  function openEdit(b: Booking) {
    setEditing(b);
    setEditSlot(b.start_time.slice(0,5));
    setEditDate(b.date);
    setError(""); setCancelError("");

    (async () => {
      const { data: rows } = await supabase
        .from("bookings").select("start_time, end_time")
        .eq("room_id", b.room_id).eq("date", b.date).eq("status", "confirmed");
      setEditTakenSlots((rows ?? []).map(r => ({ start: r.start_time.slice(0,5), end: r.end_time.slice(0,5) })));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userRows } = await supabase
        .from("bookings").select("id")
        .eq("room_id", b.room_id).eq("date", b.date)
        .eq("user_id", user.id).eq("status", "confirmed");
      setEditUserSlots(userRows?.length ?? 0);
    })();
  }

  async function saveEdit() {
    if (!editDate || !editSlot) { setError("Please select a time slot."); return; }
    setSaving(true); setError("");

    const [sh, sm] = editSlot.split(":").map(Number);
    const endTime = `${String(sh+1).padStart(2,"0")}:${String(sm).padStart(2,"0")}`;

    const { error: err } = await supabase.from("bookings").update({
      date: editDate,
      start_time: editSlot,
      end_time: endTime,
    }).eq("id", editing!.id);

    if (err) setError(err.message.includes("no_overlap") ? "That slot is already taken." : err.message);
    else { setEditing(null); fetchBookings(); }
    setSaving(false);
  }

  async function cancelBooking() {
    setCancelling(true);
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", editing!.id);
    setEditing(null); fetchBookings();
    setCancelling(false);
  }

  function fmt(date: string) {
    return new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
      weekday:"short", day:"numeric", month:"short", year:"numeric"
    });
  }

  const upcoming  = bookings.filter(b => b.status==="confirmed" && (b.date > today || (b.date===today && b.end_time.slice(0,5) > now)));
  const past      = bookings.filter(b => b.status==="confirmed" && (b.date < today || (b.date===today && b.end_time.slice(0,5) <= now)));
  const cancelled = bookings.filter(b => b.status==="cancelled");
  const displayed = tab==="upcoming" ? upcoming : tab==="past" ? past : cancelled;

  function groupByWeek(items: Booking[]) {
    const startOfToday = new Date(today + "T00:00:00");
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(startOfToday.getDate() + (7 - startOfToday.getDay()));
    const thisWeek: Booking[] = [];
    const later: Booking[] = [];
    items.forEach(b => {
      const d = new Date(b.date + "T00:00:00");
      d <= endOfWeek ? thisWeek.push(b) : later.push(b);
    });
    return { thisWeek, later };
  }

  const { thisWeek, later } = tab==="upcoming" ? groupByWeek(upcoming) : { thisWeek: displayed, later: [] };

  function BookingCard({ b }: { b: Booking }) {
    const room = ROOM_MAP[b.room_id];
    const isPast = b.date < today || (b.date===today && b.end_time.slice(0,5) <= now);
    const isUpcoming = b.status==="confirmed" && !isPast;

    return (
      <div style={{ background:"#0e0e0e", border:`0.5px solid ${isUpcoming?"#1e1e1e":"#2a1a1a"}`, borderRadius:10, padding:"20px 24px", display:"flex", alignItems:"center", gap:18, opacity:isUpcoming?1:0.6 }}>
        <div style={{ width:48, height:48, borderRadius:"50%", background:isUpcoming?"#141414":"#1a0a0a", border:`0.5px solid ${isUpcoming?"#222":"#3a1a1a"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isUpcoming?"#3b82f6":"#ef4444"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:16, fontWeight:500, color:"#e4e4e4", marginBottom:5, fontFamily:"'Roboto',sans-serif" }}>
            {room?.name ?? b.room_id} · {room?.building}
          </div>
          <div style={{ fontSize:13, color:"#666", display:"flex", gap:12, flexWrap:"wrap", fontFamily:"'Roboto Mono',monospace" }}>
            <span>{fmt(b.date)}</span>
            <span>{b.start_time.slice(0,5)} – {b.end_time.slice(0,5)}</span>
          </div>
        </div>
        {isUpcoming && (
          <button onClick={() => openEdit(b)} style={{ fontSize:13, color:"#3b82f6", border:"0.5px solid #1d4ed855", background:"none", padding:"8px 18px", borderRadius:6, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Roboto',sans-serif" }}>
            Edit
          </button>
        )}
        {!isUpcoming && (
          <span style={{ fontSize:10, padding:"4px 12px", borderRadius:20, background:"#1a0808", border:"0.5px solid #ef444433", color:"#f87171", fontFamily:"'Roboto Mono',monospace", whiteSpace:"nowrap" }}>
            {b.status==="cancelled" ? "Cancelled" : "Completed"}
          </span>
        )}
      </div>
    );
  }

  function Section({ label, items }: { label: string; items: Booking[] }) {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:9, color:"#252525", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10, fontFamily:"'Roboto Mono',monospace" }}>{label}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {items.map(b => <BookingCard key={b.id} b={b} />)}
        </div>
      </div>
    );
  }

  if (checking) return null;

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
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes modalIn { from { opacity:0; transform:translateY(12px) scale(0.98); } to { opacity:1; transform:none; } }

        .page { max-width: 1000px; margin: 0 auto; padding: 52px 48px 80px; }
        .eyebrow { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.14em; color: var(--dim); text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .eyebrow::before { content:''; display:block; width:16px; height:0.5px; background:var(--blue-dark); }
        .page-title { font-family: var(--font-head); font-size: 32px; font-weight: 700; letter-spacing: -0.02em; color: #f0f0f0; margin-bottom: 28px; animation: fadeUp 0.4s ease both; }

        .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 32px; animation: fadeUp 0.4s ease 0.05s both; }
        .stat { background: #0d0d0d; border: 0.5px solid #1a1a1a; border-radius: 8px; padding: 14px 16px; }
        .stat-val { font-size: 32px; font-weight: 700; font-family: var(--font-head); margin-bottom: 4px; }
        .stat-label { font-size: 10px; color: #444; letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--font-mono); }

        .tabs { display: flex; border-bottom: 0.5px solid #1a1a1a; margin-bottom: 28px; animation: fadeUp 0.4s ease 0.08s both; }
        .tab { font-size: 13px; padding: 8px 20px; color: #333; border-bottom: 1.5px solid transparent; margin-bottom: -0.5px; cursor: pointer; font-family: var(--font-body); background: none; border-left: none; border-right: none; border-top: none; transition: color 0.15s; }
        .tab.active { color: var(--blue); border-bottom-color: var(--blue); }
        .tab:hover:not(.active) { color: #666; }

        .empty { text-align: center; padding: 60px 0; color: #252525; font-size: 13px; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(4px); }
        .modal { background: #0e0e0e; border: 0.5px solid #2a2a2a; border-radius: 14px; width: 100%; max-width: 440px; overflow: hidden; animation: modalIn 0.2s ease; }
        .modal-header { padding: 20px 22px 16px; border-bottom: 0.5px solid #1a1a1a; display: flex; align-items: flex-start; justify-content: space-between; }
        .modal-eyebrow { font-family: var(--font-mono); font-size: 9px; color: #2a2a2a; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 4px; }
        .modal-title { font-family: var(--font-head); font-size: 17px; font-weight: 700; color: #f0f0f0; }
        .modal-close { width: 28px; height: 28px; border-radius: 7px; background: #141414; border: 0.5px solid #222; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #555; font-size: 16px; transition: color 0.15s; }
        .modal-close:hover { color: #999; }
        .modal-body { padding: 20px 22px; max-height: 65vh; overflow-y: auto; }
        .modal-body::-webkit-scrollbar { width: 4px; }
        .modal-body::-webkit-scrollbar-thumb { background: #232323; border-radius: 2px; }
        .modal-footer { padding: 14px 22px 20px; border-top: 0.5px solid #1a1a1a; display: flex; gap: 8px; }

        .field { margin-bottom: 16px; }
        .field label { display: block; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.12em; color: #333; text-transform: uppercase; margin-bottom: 8px; }
        .divider { height: 0.5px; background: #1a1a1a; margin: 14px 0; }

        .modal-btn { padding: 10px 16px; border-radius: 8px; font-size: 13px; font-family: var(--font-body); cursor: pointer; transition: opacity 0.15s; font-weight: 500; }
        .modal-btn:hover { opacity: 0.8; }
        .modal-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .modal-btn-discard  { flex:1; background: none; border: 0.5px solid #232323; color: #444; }
        .modal-btn-save     { flex:2; background: var(--blue-dark); border: none; color: #fff; }
        .modal-btn-cancel   { flex:1; background: none; border: 0.5px solid #ef444433; color: #f87171; }

        .err { font-size: 12px; color: #f87171; margin-top: 8px; }
      `}</style>

      <Navbar />

      <main className="page">
        <p className="eyebrow">Overview</p>
        <h1 className="page-title">My bookings</h1>

        <div className="stats">
          <div className="stat">
            <div className="stat-val" style={{ color:"var(--blue)" }}>{upcoming.length}</div>
            <div className="stat-label">Upcoming</div>
          </div>
          <div className="stat">
            <div className="stat-val" style={{ color:"#e4e4e4" }}>{bookings.filter(b=>b.status==="confirmed").length}</div>
            <div className="stat-label">Total booked</div>
          </div>
          <div className="stat">
            <div className="stat-val" style={{ color:"#e4e4e4" }}>
              {bookings.filter(b=>b.status==="confirmed").reduce((acc,b)=>{
                const [sh,sm]=b.start_time.split(":").map(Number);
                const [eh,em]=b.end_time.split(":").map(Number);
                return acc+(eh*60+em-sh*60-sm)/60;
              },0).toFixed(0)}h
            </div>
            <div className="stat-label">Hours booked</div>
          </div>
        </div>

        <div className="tabs">
          {(["upcoming","past","cancelled"] as const).map(t => (
            <button key={t} className={`tab${tab===t?" active":""}`} onClick={()=>setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
              {t==="upcoming" && upcoming.length>0 && (
                <span style={{ marginLeft:6, fontSize:10, background:"#1d4ed822", color:"var(--blue)", padding:"1px 6px", borderRadius:10 }}>
                  {upcoming.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty">Loading...</div>
        ) : tab==="upcoming" ? (
          thisWeek.length===0 && later.length===0 ? (
            <div className="empty">No upcoming bookings. <a href="/" style={{color:"var(--blue)"}}>Book a room →</a></div>
          ) : (
            <>
              <Section label="This week" items={thisWeek} />
              <Section label="Later" items={later} />
            </>
          )
        ) : displayed.length===0 ? (
          <div className="empty">No {tab} bookings.</div>
        ) : (
          <Section label={tab} items={displayed} />
        )}
      </main>

      {/* Edit Modal */}
      {editing && (
        <div className="overlay" onClick={e => { if (e.target===e.currentTarget) setEditing(null); }}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">Editing booking</div>
                <div className="modal-title">{ROOM_MAP[editing.room_id]?.name} · {ROOM_MAP[editing.room_id]?.building}</div>
              </div>
              <button className="modal-close" onClick={() => setEditing(null)}>×</button>
            </div>

            <div className="modal-body">
              {/* Room — read only */}
              <div style={{ background:"#080808", border:"0.5px solid #1a1a1a", borderRadius:8, padding:"12px 16px", marginBottom:16 }}>
                <div style={{ fontSize:9, color:"#333", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:4, fontFamily:"var(--font-mono)" }}>Room</div>
                <div style={{ fontSize:15, fontWeight:500, color:"#e4e4e4", fontFamily:"var(--font-head)" }}>
                  {ROOM_MAP[editing.room_id]?.name} · {ROOM_MAP[editing.room_id]?.building}
                </div>
              </div>

              <div className="divider" />

              {/* Calendar */}
              <div className="field">
                <label>Date</label>
                <div style={{ background:"#080808", border:"0.5px solid #1e1e1e", borderRadius:8, padding:"12px 14px" }}>
                  <Calendar
                    value={editDate}
                    min={today}
                    onChange={async d => {
                      setEditDate(d);
                      setEditSlot("");
                      const { data: rows } = await supabase
                        .from("bookings").select("start_time, end_time")
                        .eq("room_id", editing.room_id).eq("date", d).eq("status", "confirmed");
                      setEditTakenSlots((rows ?? []).map(r => ({ start: r.start_time.slice(0,5), end: r.end_time.slice(0,5) })));
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;
                      const { data: userRows } = await supabase
                        .from("bookings").select("id")
                        .eq("room_id", editing.room_id).eq("date", d)
                        .eq("user_id", user.id).eq("status", "confirmed");
                      setEditUserSlots(userRows?.length ?? 0);
                    }}
                  />
                </div>
              </div>

              <div className="divider" />

              {/* Slot picker */}
              <div className="field">
                <label>
                  Time slot{" "}
                  <span style={{ color:"#333", fontWeight:400, textTransform:"none", letterSpacing:0 }}>— 1 hour</span>
                </label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:4 }}>
                  {TIME_SLOTS.map(slot => {
                    const [sh] = slot.split(":").map(Number);
                    const endLabel = `${String(sh+1).padStart(2,"0")}:00`;
                    const isCurrentSlot = slot === editing.start_time.slice(0,5) && editDate === editing.date;
                    const isTaken = editTakenSlots.some(t => slot >= t.start && slot < t.end && !isCurrentSlot);
                    const isSlotSel = slot === editSlot;
                    const isDisabled = isTaken || (!isSlotSel && !isCurrentSlot && editUserSlots >= 2 && editDate === editing.date);

                    return (
                      <div key={slot}
                        onClick={() => { if (isDisabled) return; setEditSlot(slot); }}
                        style={{
                          padding:"8px 6px", borderRadius:7, fontSize:11,
                          fontFamily:"'Roboto Mono',monospace",
                          cursor: isDisabled ? "default" : "pointer",
                          border: isSlotSel ? "0.5px solid #3b82f6" : isCurrentSlot && !isSlotSel ? "0.5px solid #333" : "0.5px solid #232323",
                          background: isTaken ? "#0d0d0d" : isSlotSel ? "#06111f" : "#080808",
                          color: isTaken ? "#252525" : isSlotSel ? "#3b82f6" : isDisabled ? "#252525" : isCurrentSlot ? "#555" : "#666",
                          transition:"all 0.12s", textAlign:"center" as const,
                        }}
                      >
                        {slot} – {endLabel}
                        {isTaken && <div style={{ fontSize:9, color:"#2a2a2a", marginTop:2 }}>taken</div>}
                        {isCurrentSlot && !isSlotSel && <div style={{ fontSize:9, color:"#444", marginTop:2 }}>current</div>}
                      </div>
                    );
                  })}
                </div>
                {editUserSlots >= 2 && editDate === editing.date && (
                  <div style={{ fontSize:11, color:"#f87171", marginTop:8 }}>
                    2-hour limit reached for this room on this date.
                  </div>
                )}
              </div>

              {error && <div className="err">{error}</div>}
            </div>

            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={cancelBooking} disabled={cancelling}>
                {cancelling ? "..." : "Cancel booking"}
              </button>
              <button className="modal-btn modal-btn-discard" onClick={() => setEditing(null)}>Discard</button>
              <button className="modal-btn modal-btn-save" onClick={saveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}