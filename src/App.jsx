import { useState, useEffect } from "react";

const GOAL_ML = 2000;

function getToday() {
  return new Date().toISOString().split("T")[0];
}
function getMonthKey(d) { return d.slice(0, 7); }
function getMonthLabel(k) {
  const [y, m] = k.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("fr-CA", { month: "long", year: "numeric" });
}
function getDaysInMonth(k) {
  const [y, m] = k.split("-");
  const days = [], d = new Date(+y, +m - 1, 1);
  while (d.getMonth() === +m - 1) { days.push(d.toISOString().split("T")[0]); d.setDate(d.getDate() + 1); }
  return days;
}
function formatDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" });
}
function mlToLabel(ml) {
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)}L`;
  return `${ml}ml`;
}
function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });
}
function loadData() {
  try {
    const r = localStorage.getItem("watertracker_v1");
    return r ? JSON.parse(r) : { days: {} };
  } catch { return { days: {} }; }
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("home");
  const [ripple, setRipple] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(getMonthKey(getToday()));
  const [popup, setPopup] = useState(null); // { day, inputVal }

  const today = getToday();
  const todayMl = data.days[today] || 0;
  const todayPct = Math.min(todayMl / GOAL_ML, 1);

  useEffect(() => { localStorage.setItem("watertracker_v1", JSON.stringify(data)); }, [data]);

  function addMl(day, ml) {
    if (day === today) { setRipple(true); setTimeout(() => setRipple(false), 500); }
    setData(p => ({ ...p, days: { ...p.days, [day]: Math.max(0, (p.days[day] || 0) + ml) } }));
  }

  function openPopup(day) {
    if (day > today) return;
    setPopup({ day, inputVal: String(data.days[day] || 0) });
  }

  function savePopup() {
    const ml = Math.max(0, parseInt(popup.inputVal) || 0);
    setData(p => ({ ...p, days: { ...p.days, [popup.day]: ml } }));
    setPopup(null);
  }

  const last30 = getLast30Days();
  const daysWithData = last30.filter(d => data.days[d] !== undefined);
  const daysGoalMet = daysWithData.filter(d => (data.days[d] || 0) >= GOAL_ML).length;
  const streak = (() => {
    let s = 0;
    for (let i = last30.length - 1; i >= 0; i--) {
      if ((data.days[last30[i]] || 0) >= GOAL_ML) s++;
      else break;
    }
    return s;
  })();

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    return { key, label: d.toLocaleDateString("fr-CA", { weekday: "short" }).slice(0, 3), ml: data.days[key] || 0, met: (data.days[key] || 0) >= GOAL_ML };
  });

  const allMonths = (() => {
    const keys = new Set(Object.keys(data.days).map(getMonthKey));
    keys.add(getMonthKey(today));
    return Array.from(keys).sort().reverse();
  })();
  const monthDays = getDaysInMonth(historyMonth);
  const firstDOW = new Date(historyMonth + "-01T12:00:00").getDay();
  const monthTotal = monthDays.reduce((a, d) => a + (data.days[d] || 0), 0);
  const monthMet = monthDays.filter(d => (data.days[d] || 0) >= GOAL_ML).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Mono&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; overflow: hidden; background: #0a1a28; }
        @keyframes fillRipple { 0%{filter:brightness(1.4)} 100%{filter:brightness(1)} }
        button { cursor: pointer; }
        button:active { opacity: 0.7; }
        ::-webkit-scrollbar { display: none; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>

      <div style={{ height: "100dvh", width: "100%", background: "#0a1a28", color: "#c8e6f5", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", maxWidth: 440, margin: "0 auto", overflow: "hidden", position: "relative" }}>

        {/* Blobs */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(94,184,232,0.12) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(94,184,232,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

        {/* Popup */}
        {popup && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 32px" }} onClick={() => setPopup(null)}>
            <div style={{ background: "#0d2035", border: "1px solid rgba(94,184,232,0.2)", borderRadius: 20, padding: "24px 20px", width: "100%", display: "flex", flexDirection: "column", gap: 16 }} onClick={e => e.stopPropagation()}>
              <div>
                <p style={{ fontSize: 11, opacity: 0.4, fontFamily: "'DM Mono'", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>modifier</p>
                <p style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>{formatDate(popup.day)}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="number"
                  value={popup.inputVal}
                  onChange={e => setPopup(p => ({ ...p, inputVal: e.target.value }))}
                  style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(94,184,232,0.25)", borderRadius: 12, color: "#c8e6f5", fontSize: 28, fontWeight: 700, fontFamily: "'DM Sans'", padding: "10px 14px", textAlign: "center", outline: "none" }}
                  autoFocus
                />
                <span style={{ fontSize: 16, opacity: 0.5, fontFamily: "'DM Mono'" }}>ml</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[250, 500, 750, 1000].map(v => (
                  <button key={v} onClick={() => setPopup(p => ({ ...p, inputVal: String(v) }))} style={{ flex: 1, background: "rgba(94,184,232,0.1)", border: "1px solid rgba(94,184,232,0.2)", borderRadius: 10, color: "#c8e6f5", fontSize: 11, fontFamily: "'DM Mono'", padding: "8px 0" }}>{mlToLabel(v)}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPopup(null)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 12, color: "rgba(200,230,245,0.5)", fontSize: 14, fontWeight: 600, padding: "12px 0" }}>annuler</button>
                <button onClick={savePopup} style={{ flex: 2, background: "#5eb8e8", border: "none", borderRadius: 12, color: "#0a1a28", fontSize: 14, fontWeight: 700, padding: "12px 0" }}>enregistrer</button>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <div style={{ display: "flex", gap: 4, padding: "12px 14px 8px", flexShrink: 0, zIndex: 2, background: "#0a1a28" }}>
          {["home", "history"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ flex: 1, background: view === v ? "rgba(94,184,232,0.15)" : "rgba(255,255,255,0.04)", border: "none", color: view === v ? "#c8e6f5" : "rgba(200,230,245,0.35)", fontSize: 12, padding: "8px 0", borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 700 }}>
              {v === "home" ? "aujourd'hui" : "historique"}
            </button>
          ))}
        </div>

        {/* ── HOME ── */}
        {view === "home" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px 16px", gap: 10, zIndex: 1, overflow: "hidden" }}>

            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-1px" }}>hydra</h1>
              <p style={{ fontSize: 11, opacity: 0.4, fontFamily: "'DM Mono'" }}>objectif · 2 litres / jour</p>
            </div>

            {/* Glass */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 120, height: 145, border: "2px solid rgba(94,184,232,0.25)", borderRadius: "12px 12px 20px 20px", overflow: "hidden", position: "relative", background: "rgba(94,184,232,0.04)" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(180deg, rgba(94,184,232,0.6) 0%, rgba(30,100,180,0.8) 100%)", height: `${todayPct * 100}%`, transition: "height 0.5s cubic-bezier(0.34,1.56,0.64,1)", borderRadius: "0 0 18px 18px", ...(ripple ? { animation: "fillRipple 0.5s ease" } : {}) }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                  <span style={{ fontSize: 26, fontWeight: 700, color: "#fff", textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>{mlToLabel(todayMl)}</span>
                  <span style={{ fontSize: 11, opacity: 0.7, fontFamily: "'DM Mono'" }}>/ 2L</span>
                </div>
              </div>
              {todayPct >= 1 && <p style={{ marginTop: 6, fontSize: 12, color: "#5eb8e8" }}>objectif atteint 🎉</p>}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {[
                { ml: 250, label: "+250ml", sub: "petit verre", highlight: false },
                { ml: 500, label: "+500ml", sub: "grand verre", highlight: true },
                { ml: -250, label: "−250", sub: "corriger", dim: true },
              ].map(({ ml, label, sub, highlight, dim }) => (
                <button key={label} onClick={() => addMl(today, ml)} style={{ flex: 1, background: highlight ? "rgba(94,184,232,0.18)" : dim ? "rgba(255,255,255,0.04)" : "rgba(94,184,232,0.1)", border: `1px solid ${highlight ? "rgba(94,184,232,0.35)" : dim ? "rgba(255,255,255,0.08)" : "rgba(94,184,232,0.2)"}`, borderRadius: 14, padding: "12px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: "#c8e6f5" }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
                  <span style={{ fontSize: 10, opacity: 0.45, fontFamily: "'DM Mono'" }}>{sub}</span>
                </button>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, flexShrink: 0 }}>
              {[
                { val: streak, lbl: "jours de suite" },
                { val: daysGoalMet, lbl: "objectifs atteints" },
                { val: daysWithData.length > 0 ? mlToLabel(Math.round(daysWithData.reduce((a, d) => a + (data.days[d] || 0), 0) / daysWithData.length / 100) * 100) : "—", lbl: "moyenne / jour" },
              ].map(({ val, lbl }, i) => (
                <>
                  {i > 0 && <div key={`d${i}`} style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "10px 0" }} />}
                  <div key={lbl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 6px", gap: 3 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#5eb8e8" }}>{val}</span>
                    <span style={{ fontSize: 9, opacity: 0.4, fontFamily: "'DM Mono'", textTransform: "uppercase", letterSpacing: 0.8, textAlign: "center" }}>{lbl}</span>
                  </div>
                </>
              ))}
            </div>

            {/* 7 days */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "12px 14px 10px", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <p style={{ fontFamily: "'DM Mono'", fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, flexShrink: 0 }}>7 derniers jours</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 5, flex: 1, minHeight: 0 }}>
                {last7.map(d => (
                  <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", gap: 3 }}>
                    <div style={{ flex: 1, width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: 6, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                      <div style={{ width: "100%", borderRadius: 6, minHeight: 2, transition: "height 0.4s ease", height: `${Math.min(d.ml / GOAL_ML, 1) * 100}%`, background: d.met ? "#5eb8e8" : "#2a4a66", opacity: d.key === today ? 1 : 0.7 }} />
                    </div>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: d.met ? "#5eb8e8" : "rgba(255,255,255,0.1)", flexShrink: 0 }} />
                    <span style={{ fontSize: 9, opacity: 0.35, fontFamily: "'DM Mono'" }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {view === "history" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px 16px", gap: 10, zIndex: 1, overflow: "hidden" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <button onClick={() => { const i = allMonths.indexOf(historyMonth); if (i < allMonths.length - 1) setHistoryMonth(allMonths[i + 1]); }} style={{ background: "none", border: "none", color: "#5eb8e8", fontSize: 22, padding: "0 8px" }}>‹</button>
              <span style={{ fontSize: 15, fontWeight: 700, textTransform: "capitalize" }}>{getMonthLabel(historyMonth)}</span>
              <button onClick={() => { const i = allMonths.indexOf(historyMonth); if (i > 0) setHistoryMonth(allMonths[i - 1]); }} style={{ background: "none", border: "none", color: "#5eb8e8", fontSize: 22, padding: "0 8px" }}>›</button>
            </div>

            <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, flexShrink: 0 }}>
              {[
                { val: monthMet, lbl: "jours atteints" },
                { val: monthDays.filter(d => d <= today).length - monthMet, lbl: "jours manqués" },
                { val: mlToLabel(monthTotal), lbl: "total bu" },
              ].map(({ val, lbl }, i) => (
                <>
                  {i > 0 && <div key={`d${i}`} style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "10px 0" }} />}
                  <div key={lbl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 6px", gap: 3 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#5eb8e8" }}>{val}</span>
                    <span style={{ fontSize: 9, opacity: 0.4, fontFamily: "'DM Mono'", textTransform: "uppercase", letterSpacing: 0.8, textAlign: "center" }}>{lbl}</span>
                  </div>
                </>
              ))}
            </div>

            {/* Calendar cliquable */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "12px 10px", flexShrink: 0 }}>
              <p style={{ fontFamily: "'DM Mono'", fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>appuie sur un jour pour modifier</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                {["dim","lun","mar","mer","jeu","ven","sam"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 8, opacity: 0.3, fontFamily: "'DM Mono'", paddingBottom: 4 }}>{d}</div>
                ))}
                {Array.from({ length: firstDOW }).map((_, i) => <div key={`e${i}`} />)}
                {monthDays.map(day => {
                  const ml = data.days[day] || 0;
                  const hasData = data.days[day] !== undefined;
                  const met = ml >= GOAL_ML;
                  const isFuture = day > today;
                  return (
                    <button key={day} onClick={() => openPopup(day)} style={{ borderRadius: 7, padding: "4px 2px", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minHeight: 38, background: isFuture ? "transparent" : met ? "rgba(94,184,232,0.2)" : hasData ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", border: day === today ? "1px solid rgba(94,184,232,0.5)" : "1px solid transparent", opacity: isFuture ? 0.2 : 1, cursor: isFuture ? "default" : "pointer" }}>
                      <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.65, color: "#c8e6f5" }}>{+day.split("-")[2]}</span>
                      {!isFuture && hasData && <span style={{ width: 5, height: 5, borderRadius: "50%", background: met ? "#5eb8e8" : "#2a4a66" }} />}
                      {!isFuture && hasData && <span style={{ fontSize: 8, fontFamily: "'DM Mono'", opacity: 0.6, color: "#c8e6f5" }}>{mlToLabel(ml)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "10px 14px", flex: 1, overflowY: "auto", minHeight: 0 }}>
              <p style={{ fontFamily: "'DM Mono'", fontSize: 10, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>détail</p>
              {monthDays.filter(d => d <= today).reverse().map(day => {
                const ml = data.days[day] || 0;
                const hasData = data.days[day] !== undefined;
                const met = ml >= GOAL_ML;
                return (
                  <div key={day} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 12, width: 18, textAlign: "center" }}>{met ? "💧" : hasData ? "○" : "·"}</span>
                    <span style={{ flex: 1, fontSize: 11, opacity: 0.55, textTransform: "capitalize" }}>{formatDate(day)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono'", color: met ? "#5eb8e8" : hasData ? "rgba(200,230,245,0.4)" : "rgba(200,230,245,0.2)" }}>
                      {hasData ? mlToLabel(ml) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
