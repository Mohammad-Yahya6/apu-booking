"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import Navbar from "../../components/Navbar";

type RoomType = "auditorium" | "classroom" | "discussion";

interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
}

const BUILDING_DATA: Record<string, { label: string; rooms: Room[] }> = {
  a: {
    label: "Block A",
    rooms: [
      { id: "a-aud-1", name: "Auditorium 1", type: "auditorium", capacity: 120 },
      { id: "a-aud-2", name: "Auditorium 2", type: "auditorium", capacity: 100 },
      { id: "a-cls-1", name: "Classroom A1", type: "classroom",  capacity: 40  },
      { id: "a-cls-2", name: "Classroom A2", type: "classroom",  capacity: 35  },
      { id: "a-cls-3", name: "Classroom A3", type: "classroom",  capacity: 35  },
    ],
  },
  b: {
    label: "Block B",
    rooms: [
      { id: "b-cls-1", name: "Classroom B1", type: "classroom", capacity: 40 },
      { id: "b-cls-2", name: "Classroom B2", type: "classroom", capacity: 40 },
      { id: "b-cls-3", name: "Classroom B3", type: "classroom", capacity: 35 },
      { id: "b-cls-4", name: "Classroom B4", type: "classroom", capacity: 35 },
    ],
  },
  c: {
    label: "Block C",
    rooms: [
      { id: "c-aud-3", name: "Auditorium 3", type: "auditorium", capacity: 100 },
      { id: "c-aud-4", name: "Auditorium 4", type: "auditorium", capacity: 100 },
      { id: "c-cls-1", name: "Classroom C1", type: "classroom",  capacity: 40  },
      { id: "c-cls-2", name: "Classroom C2", type: "classroom",  capacity: 40  },
      { id: "c-cls-3", name: "Classroom C3", type: "classroom",  capacity: 30  },
    ],
  },
  d: {
    label: "Block D",
    rooms: [
      { id: "d-aud-5", name: "Auditorium 5", type: "auditorium", capacity: 100 },
      { id: "d-aud-6", name: "Auditorium 6", type: "auditorium", capacity: 100 },
      { id: "d-aud-7", name: "Auditorium 7", type: "auditorium", capacity: 100 },
      { id: "d-cls-1", name: "Classroom D1", type: "classroom",  capacity: 40  },
      { id: "d-cls-2", name: "Classroom D2", type: "classroom",  capacity: 40  },
      { id: "d-cls-3", name: "Classroom D3", type: "classroom",  capacity: 35  },
      { id: "d-cls-4", name: "Classroom D4", type: "classroom",  capacity: 35  },
    ],
  },
  library: {
    label: "Library",
    rooms: Array.from({ length: 10 }, (_, i) => ({
      id: `lib-dr-${i + 1}`,
      name: `Discussion Room ${i + 1}`,
      type: "discussion" as RoomType,
      capacity: 10,
    })),
  },
};

const TYPE_IMAGE: Record<RoomType, string> = {
  auditorium: "/images/auditorium.jpg",
  classroom:  "/images/classroom.jpg",
  discussion: "/images/discussion.jpg",
};

const ROOM_MAP_FOR_EMAIL: Record<string, { name: string; building: string }> = {
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

const TIME_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];
const WEEK_HOURS = 50;

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  
  const monday = new Date(now);
  if (day === 0) {
    // Sunday — go to tomorrow (Monday)
    monday.setDate(now.getDate() + 1);
  } else if (day === 6) {
    // Saturday — go to day after tomorrow (Monday)
    monday.setDate(now.getDate() + 2);
  } else {
    // Weekday — go to this week's Monday
    monday.setDate(now.getDate() - (day - 1));
  }

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    from: monday.toISOString().split("T")[0],
    to:   friday.toISOString().split("T")[0],
  };
}

function availColor(pct: number) {
  if (pct >= 0.7) return { bg: "#7f1d1d", border: "#ef4444", text: "#fca5a5", label: "High demand" };
  if (pct >= 0.3) return { bg: "#713f12", border: "#eab308", text: "#fde047", label: "Moderate"    };
  return               { bg: "#14532d", border: "#22c55e", text: "#86efac", label: "Available"    };
}

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
  const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  function prev() { setViewed(v => v.month===0 ? {year:v.year-1,month:11} : {...v,month:v.month-1}); }
  function next() { setViewed(v => v.month===11 ? {year:v.year+1,month:0} : {...v,month:v.month+1}); }
  function isPast(day: number) { return new Date(viewed.year, viewed.month, day) < minDate; }
function isTooFar(day: number) {
  const d = new Date(viewed.year, viewed.month, day);
  const minDay = minDate.getDay();
  const limit = new Date(minDate);
  // always show 2 full weeks from the starting Monday
  const daysToAdd = minDay === 1 ? 13 : 14 - minDay; // 2 weeks from Monday
  limit.setDate(minDate.getDate() + daysToAdd);
  return d > limit;
}
  function isDisabled(day: number) {
    const d = new Date(viewed.year, viewed.month, day);
    return isPast(day) || isTooFar(day) || d.getDay()===0 || d.getDay()===6;
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
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={prev} style={{background:"none",border:"0.5px solid #232323",color:"#555",width:26,height:26,borderRadius:6,cursor:"pointer",fontSize:15,lineHeight:1}}>‹</button>
        <span style={{fontFamily:"var(--font-head)",fontSize:13,fontWeight:600,color:"#ccc"}}>{MONTHS[viewed.month]} {viewed.year}</span>
        <button onClick={next} style={{background:"none",border:"0.5px solid #232323",color:"#555",width:26,height:26,borderRadius:6,cursor:"pointer",fontSize:15,lineHeight:1}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:2}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",fontFamily:"var(--font-mono)",fontSize:9,color:"#2a2a2a",padding:"3px 0",letterSpacing:"0.08em"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((day,i)=>(
          <div key={i} onClick={()=>day&&select(day)} style={{
            textAlign:"center",padding:"6px 0",borderRadius:6,
            fontSize:12,fontFamily:"var(--font-body)",
            cursor:day&&!isDisabled(day)?"pointer":"default",
            color:!day?"transparent":isDisabled(day)?"#252525":isSelected(day)?"#fff":isToday(day)?"var(--blue)":"#777",
            background:day&&isSelected(day)?"var(--blue-dark)":"transparent",
            border:day&&isToday(day)&&!isSelected(day)?"0.5px solid #1d4ed855":"0.5px solid transparent",
            transition:"background 0.1s",
          }}
          onMouseEnter={e=>{if(day&&!isDisabled(day)&&!isSelected(day))(e.currentTarget as HTMLDivElement).style.background="#111";}}
          onMouseLeave={e=>{if(day&&!isSelected(day))(e.currentTarget as HTMLDivElement).style.background="transparent";}}
          >{day??""}</div>
        ))}
      </div>
    </div>
  );
}

export default function BuildingPage() {
  const { building } = useParams<{ building: string }>();
  const router = useRouter();
  const data = BUILDING_DATA[building];
const todayRaw = new Date();
const dayOfWeek = todayRaw.getDay(); // 0=Sun, 6=Sat

// If weekend, shift to next Monday
const todayAdj = new Date(todayRaw);
if (dayOfWeek === 6) todayAdj.setDate(todayRaw.getDate() + 2); // Sat → Mon
if (dayOfWeek === 0) todayAdj.setDate(todayRaw.getDate() + 1); // Sun → Mon

const today = todayAdj.toISOString().split("T")[0];

  const [weeklyHours, setWeeklyHours]         = useState<Record<string, number>>({});
  const [selected, setSelected]               = useState<Room | null>(null);
  const [date, setDate]                       = useState(today);
  const [selectedSlots, setSelectedSlots]     = useState<string[]>([]);
  const [purpose, setPurpose]                 = useState("");
  const [takenSlots, setTakenSlots]           = useState<{ start: string; end: string }[]>([]);
  const [userSlotsToday, setUserSlotsToday]   = useState(0);
  const [submitting, setSubmitting]           = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState(false);
  const [currentUser, setCurrentUser]         = useState<any>(null);
  const [search, setSearch]                   = useState("");
  const [typeFilter, setTypeFilter]           = useState<"all"|"auditorium"|"classroom"|"discussion">("all");
  const [slotsRefreshed, setSlotsRefreshed]   = useState(false);
  const [roomListCollapsed, setRoomListCollapsed] = useState(false);

  useEffect(() => {
    if (!data) return;
    const { from, to } = getWeekRange();
    (async () => {
      const { data: bookings } = await supabase
        .from("bookings").select("room_id, start_time, end_time")
        .in("room_id", data.rooms.map(r => r.id))
        .gte("date", from).lte("date", to).eq("status", "confirmed");
      const hours: Record<string, number> = {};
      for (const b of bookings ?? []) {
        const [sh, sm] = b.start_time.split(":").map(Number);
        const [eh, em] = b.end_time.split(":").map(Number);
        hours[b.room_id] = (hours[b.room_id] ?? 0) + (eh*60+em-sh*60-sm)/60;
      }
      setWeeklyHours(hours);
    })();

    const channel = supabase
      .channel(`building-${building}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"bookings" }, () => {
        (async () => {
          const { data: bookings } = await supabase
            .from("bookings").select("room_id, start_time, end_time")
            .in("room_id", data.rooms.map(r => r.id))
            .gte("date", from).lte("date", to).eq("status", "confirmed");
          const hours: Record<string, number> = {};
          for (const b of bookings ?? []) {
            const [sh, sm] = b.start_time.split(":").map(Number);
            const [eh, em] = b.end_time.split(":").map(Number);
            hours[b.room_id] = (hours[b.room_id] ?? 0) + (eh*60+em-sh*60-sm)/60;
          }
          setWeeklyHours(hours);
        })();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [building]);

  useEffect(() => {
    if (!selected || !date) return;

    async function fetchTaken() {
      const { data: rows } = await supabase
        .from("bookings").select("start_time, end_time")
        .eq("room_id", selected!.id).eq("date", date).eq("status", "confirmed");
      setTakenSlots((rows ?? []).map(r => ({ start: r.start_time.slice(0,5), end: r.end_time.slice(0,5) })));
    }

    fetchTaken();

    const channel = supabase
      .channel(`slots-${selected.id}-${date}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"bookings" }, () => {
        fetchTaken();
        setSelectedSlots(prev => prev.filter(slot => {
          const taken = takenSlots.some(t => slot >= t.start && slot < t.end);
          return !taken;
        }));
        setSlotsRefreshed(true);
        setTimeout(() => setSlotsRefreshed(false), 3000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selected, date]);

  useEffect(() => {
    if (!selected || !date) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rows } = await supabase
        .from("bookings").select("id")
        .eq("room_id", selected.id).eq("date", date)
        .eq("user_id", user.id).eq("status", "confirmed");
      setUserSlotsToday(rows?.length ?? 0);
    })();
  }, [selected, date]);

  function isSlotTaken(slot: string) {
    return takenSlots.some(t => slot >= t.start && slot < t.end);
  }

  async function handleConfirm() {
    if (!selected || !date || selectedSlots.length===0 || !purpose.trim()) {
      setError("Please select at least one time slot and fill in all fields."); return;
    }
    setSubmitting(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
if (!user) { router.push(`/auth/login?from=/buildings/${building}`); return; }

setCurrentUser(user);

    const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
      weekday:"long", day:"numeric", month:"long", year:"numeric"
    });

    for (const slot of selectedSlots) {
      const [sh, sm] = slot.split(":").map(Number);
      const endHour  = String(sh + 1).padStart(2, "0");
      const startTime = slot;
      const endTime   = `${endHour}:${String(sm).padStart(2, "0")}`;

      const { data: insertData, error: err } = await supabase.from("bookings").insert({
        room_id: selected.id, user_id: user.id, user_email: user.email,
        date, start_time: startTime, end_time: endTime,
        purpose: purpose.trim(), status: "confirmed",
      }).select().single();

      if (err) {
        setError(err.message.includes("no_overlap") ? "One of the slots is already taken." : err.message);
        setSubmitting(false); return;
      }

      const roomInfo = ROOM_MAP_FOR_EMAIL[selected.id] ?? { name: selected.name, building: "APU" };
      supabase.functions.invoke("send-booking-confirmation", {
        body: {
          booking: {
            id: insertData?.id ?? "N/A",
            roomName: selected.name, building: roomInfo.building,
            date: formattedDate, startTime, endTime,
            purpose: purpose.trim(), email: user.email,
            name: user.user_metadata?.full_name ?? user.email,
          },
        },
      });
    }

    setSuccess(true);
    setSubmitting(false);
  }

  const filteredRooms = data ? data.rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(search.toLowerCase());
    const matchesType   = typeFilter==="all" || room.type===typeFilter;
    return matchesSearch && matchesType;
  }) : [];

  if (!data) return <div style={{padding:40,color:"#555"}}>Building not found.</div>;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080808; --surface: #0e0e0e; --border: #141414; --border-mid: #232323;
          --text: #e4e4e4; --dim: #444; --muted: #1e1e1e;
          --blue: #3b82f6; --blue-dark: #1d4ed8;
          --font-head: 'Roboto', sans-serif;
          --font-body: 'Roboto', sans-serif;
          --font-mono: 'Roboto Mono', monospace;
        }
        html, body { background: var(--bg); color: var(--text); font-family: var(--font-body); min-height: 100vh; -webkit-font-smoothing: antialiased; }
        a { text-decoration: none; color: inherit; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }

        .page { max-width: 1100px; margin: 0 auto; padding: 48px 40px 80px; }
        .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; animation: fadeUp 0.4s ease both; }
        .page-title { font-family: var(--font-head); font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
        .btn-back { color: #888; font-size: 12px; padding: 5px 14px; background: #111; border: 0.5px solid #333; border-radius: 999px; cursor: pointer; font-family: 'Roboto', sans-serif; font-weight: 500; transition: opacity 0.15s; }
        .btn-back:hover { opacity: 0.75; }

        .cols { display: grid; grid-template-columns: 1fr 380px; gap: 20px; align-items: start; }

        .room-list { display: flex; flex-direction: column; gap: 10px; max-height: 825px; overflow-y: auto; padding-right: 4px; animation: fadeUp 0.4s ease 0.05s both; }
        .room-list::-webkit-scrollbar { width: 4px; }
        .room-list::-webkit-scrollbar-track { background: transparent; }
        .room-list::-webkit-scrollbar-thumb { background: var(--border-mid); border-radius: 2px; }

        .room-card { display: flex; align-items: center; gap: 16px; padding: 18px 20px; border-radius: 12px; border: 0.5px solid var(--border-mid); background: var(--surface); cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .room-card:hover  { border-color: #333; background: #111; }
        .room-card.active { border-color: var(--blue); background: #06111f; }
        .room-img  { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: var(--border-mid); }
        .room-info { flex: 1; min-width: 0; }
        .room-name { font-family: var(--font-head); font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 3px; }
        .room-cap  { font-size: 13px; color: var(--dim); font-family: var(--font-mono); }
        .avail-btn { flex-shrink: 0; font-family: var(--font-mono); font-size: 11px; font-weight: 500; letter-spacing: 0.06em; padding: 7px 16px; border-radius: 6px; border: 0.5px solid; white-space: nowrap; }

        .summary { border: 0.5px solid var(--border-mid); border-radius: 12px; background: var(--surface); padding: 28px; position: sticky; top: 80px; animation: fadeUp 0.4s ease 0.1s both; }
        .summary-title { font-family: var(--font-mono); font-size: 10px; font-weight: 600; color: var(--dim); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 16px; }
        .empty-state { text-align: center; padding: 32px 0; }
        .empty-text  { font-size: 13px; color: var(--dim); line-height: 1.6; }
        .selected-name { font-family: var(--font-head); font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
        .selected-sub  { font-size: 11px; color: var(--dim); margin-bottom: 16px; font-family: var(--font-mono); }
        .divider { height: 0.5px; background: var(--border-mid); margin: 14px 0; }
        .field { margin-bottom: 12px; }
        .field label { display: block; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.12em; color: var(--dim); text-transform: uppercase; margin-bottom: 6px; }
        .field input[type="text"] { width: 100%; background: var(--bg); border: 0.5px solid var(--border-mid); color: var(--text); font-size: 13px; padding: 8px 10px; border-radius: 8px; font-family: var(--font-body); outline: none; transition: border-color 0.15s; }
        .field input:focus { border-color: #1d4ed866; }
        .confirm-btn { width: 100%; padding: 13px; border-radius: 8px; border: none; background: var(--blue-dark); color: #fff; font-family: var(--font-body); font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; margin-top: 6px; }
        .confirm-btn:hover:not(:disabled) { background: var(--blue); }
        .confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .err { font-size: 12px; color: #f87171; margin-top: 8px; }
        .success-msg { text-align: center; padding: 24px 16px; }
        .legend { display: flex; gap: 16px; margin-top: 20px; justify-content: center; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 10px; color: var(--dim); }
        .legend-dot  { width: 6px; height: 6px; border-radius: 50%; }

        .collapse-btn { display: none; }

        @media (max-width: 700px) {
          .page { padding: 24px 16px 60px; }
          .page-header { margin-bottom: 16px; }
          .cols { grid-template-columns: 1fr; }
          .summary { position: static; }
          .room-list { max-height: none; }
          .collapse-btn {
            display: flex; width: 100%; margin-bottom: 10px;
            background: #0e0e0e; border: 0.5px solid #232323;
            color: #666; font-size: 13px; padding: 12px 16px;
            border-radius: 10px; cursor: pointer;
            font-family: 'Roboto', sans-serif;
            justify-content: space-between; align-items: center;
          }
        }
      `}</style>

      <Navbar />

      <main className="page">
        <div className="page-header">
          <button className="btn-back" onClick={() => router.push("/")}>← Campus map</button>
          <h1 className="page-title">{data.label}</h1>
        </div>

        {/* Search + filter */}
        <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",animation:"fadeUp 0.4s ease 0.02s both"}}>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms..."
            style={{flex:1,minWidth:160,background:"#0e0e0e",border:"0.5px solid #232323",color:"#e4e4e4",fontSize:13,padding:"9px 14px",borderRadius:8,fontFamily:"'Roboto',sans-serif",outline:"none"}}
            onFocus={e => e.target.style.borderColor="#1d4ed866"}
            onBlur={e => e.target.style.borderColor="#232323"}
          />
          {(["all","auditorium","classroom","discussion"] as const).map(type => (
            <button key={type} onClick={() => setTypeFilter(type)} style={{
              fontSize:12,padding:"8px 14px",borderRadius:8,cursor:"pointer",
              fontFamily:"'Roboto Mono',monospace",transition:"all 0.12s",
              border:typeFilter===type?"0.5px solid #3b82f6":"0.5px solid #232323",
              background:typeFilter===type?"#06111f":"#0e0e0e",
              color:typeFilter===type?"#3b82f6":"#444",
            }}>
              {type==="all"?"All":type.charAt(0).toUpperCase()+type.slice(1)}
            </button>
          ))}
        </div>

        <div className="cols">
          <div>
            {/* Mobile collapse toggle */}
            {selected && (
              <button
                className="collapse-btn"
                onClick={() => setRoomListCollapsed(c => !c)}
              >
                <span>{selected.name} — tap to change room</span>
                <span style={{fontSize:18,lineHeight:1}}>{roomListCollapsed ? "↓" : "↑"}</span>
              </button>
            )}

            <div
              className="room-list"
              style={{display: roomListCollapsed ? "none" : "flex"}}
            >
              {filteredRooms.length===0 ? (
                <div style={{textAlign:"center",padding:"40px 0",color:"#252525",fontSize:13}}>
                  No rooms match your search.
                </div>
              ) : filteredRooms.map(room => {
                const pct   = (weeklyHours[room.id] ?? 0) / WEEK_HOURS;
                const color = availColor(pct);
                return (
                  <div
                    key={room.id}
                    className={`room-card${selected?.id===room.id?" active":""}`}
                    onClick={() => {
                      setSelected(room);
                      setDate(today);
                      setSelectedSlots([]);
                      setPurpose("");
                      setError("");
                      setSuccess(false);
                      if (window.innerWidth < 700) {
                        setRoomListCollapsed(true);
                        setTimeout(() => {
                          document.getElementById("summary-panel")?.scrollIntoView({behavior:"smooth",block:"start"});
                        }, 100);
                      }
                    }}
                  >
                    <img src={TYPE_IMAGE[room.type]} alt={room.type} className="room-img"
                      onError={e => {(e.target as HTMLImageElement).style.opacity="0";}} />
                    <div className="room-info">
                      <div className="room-name">{room.name}</div>
                      <div className="room-cap">Capacity · {room.capacity}</div>
                    </div>
                    <div className="avail-btn" style={{background:color.bg,borderColor:color.border,color:color.text}}>
                      {color.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="summary" id="summary-panel">
            <div className="summary-title">Summary</div>
            {!selected ? (
              <div className="empty-state">
                <div className="empty-text">Select a room<br />to begin booking</div>
              </div>
            ) : success ? (
              <div className="success-msg">
                <div style={{fontSize:28,marginBottom:10}}>✓</div>
                <p style={{color:"#86efac",fontSize:15,fontWeight:500,marginBottom:8}}>Booking confirmed!</p>
                <p style={{color:"#444",fontSize:12,lineHeight:1.6}}>
                  A confirmation email with your QR code has been sent to{" "}
                  <span style={{color:"#888"}}>{currentUser?.email}</span>
                </p>
              </div>
            ) : (
              <>
                <div className="selected-name">{selected.name}</div>
                <div className="selected-sub">Capacity · {selected.capacity} · {selected.type}</div>
                <div className="divider" />
                <div className="field">
                  <label>Date</label>
                  <Calendar value={date} min={today} onChange={d => {setDate(d);setSelectedSlots([]);}} />
                </div>
                <div className="divider" />
                <div className="field">
                  <label>
                    Time slots{" "}
                    <span style={{color:"#333",fontWeight:400,textTransform:"none",letterSpacing:0}}>— max 2 hrs per day</span>
                  </label>
                  {slotsRefreshed && (
                    <div style={{fontSize:11,color:"#3b82f6",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:5,height:5,borderRadius:"50%",background:"#3b82f6",display:"inline-block"}} />
                      Availability just updated
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:4}}>
                    {TIME_SLOTS.slice(0,-1).map(slot => {
                      const [sh] = slot.split(":").map(Number);
                      const endLabel  = `${String(sh+1).padStart(2,"0")}:00`;
                      const isTaken   = isSlotTaken(slot);
                      const isSlotSel = selectedSlots.includes(slot);
                      const isDisabled = isTaken || (!isSlotSel && (selectedSlots.length>=2 || userSlotsToday>=2));
                      return (
                        <div key={slot}
                          onClick={() => {if(isDisabled)return;setSelectedSlots(prev=>prev.includes(slot)?prev.filter(s=>s!==slot):[...prev,slot]);}}
                          style={{
                            padding:"8px 6px",borderRadius:7,fontSize:11,
                            fontFamily:"'Roboto Mono',monospace",
                            cursor:isDisabled?"default":"pointer",
                            border:isSlotSel?"0.5px solid #3b82f6":"0.5px solid #232323",
                            background:isTaken?"#0d0d0d":isSlotSel?"#06111f":"#080808",
                            color:isTaken?"#252525":isSlotSel?"#3b82f6":isDisabled?"#252525":"#666",
                            transition:"all 0.12s",textAlign:"center" as const,
                          }}
                        >
                          {slot} – {endLabel}
                          {isTaken && <div style={{fontSize:9,color:"#2a2a2a",marginTop:2}}>taken</div>}
                        </div>
                      );
                    })}
                  </div>
                  {userSlotsToday>=2 && (
                    <div style={{fontSize:11,color:"#f87171",marginTop:8}}>
                      You've reached the 2-hour limit for this room today.
                    </div>
                  )}
                </div>
                <div className="divider" />
                <div className="field">
                  <label>Purpose</label>
                  <input type="text" value={purpose} placeholder="e.g. Group study..."
                    onChange={e => setPurpose(e.target.value)} />
                </div>
                {error && <div className="err">{error}</div>}
                <button className="confirm-btn" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? "Confirming..." : "Confirm booking"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="legend">
          {[
            {color:"#22c55e",label:"Available"},
            {color:"#eab308",label:"Moderate"},
            {color:"#ef4444",label:"High demand"},
          ].map(l => (
            <div key={l.label} className="legend-item">
              <span className="legend-dot" style={{background:l.color}} />
              {l.label}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}