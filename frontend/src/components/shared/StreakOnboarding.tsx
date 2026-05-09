import { useState, useEffect } from "react";
import { useBadgeUnlock } from "./BadgeSystem";

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const today = getTodayStr();
    const lastActive = localStorage.getItem("solv_last_active");
    const savedStreak = parseInt(localStorage.getItem("solv_streak") || "0", 10);

    if (!lastActive) {
      localStorage.setItem("solv_streak", "1");
      localStorage.setItem("solv_last_active", today);
      setStreak(1);
      setIsNew(true);
      return;
    }

    const diffDays = Math.round(
      (new Date(today).getTime() - new Date(lastActive).getTime()) / 86400000
    );

    if (diffDays === 0) {
      setStreak(savedStreak);
    } else if (diffDays === 1) {
      const newStreak = savedStreak + 1;
      localStorage.setItem("solv_streak", String(newStreak));
      localStorage.setItem("solv_last_active", today);
      setStreak(newStreak);
      setIsNew(true);
    } else {
      localStorage.setItem("solv_streak", "1");
      localStorage.setItem("solv_last_active", today);
      setStreak(1);
    }
  }, []);

  return { streak, isNew };
}

export function getStreakLevel(n: number) {
  if (n >= 30) return { emoji: "💎", color: "#a78bfa", label: "Légendaire" };
  if (n >= 7)  return { emoji: "🔥", color: "#ef4444", label: "En feu" };
  if (n >= 3)  return { emoji: "🔥", color: "#f97316", label: "Chaud" };
  return             { emoji: "🔥", color: "#fb923c", label: "Démarrage" };
}

export function StreakBadge() {
  const { streak, isNew } = useStreak();
  const unlock = useBadgeUnlock();
  const level = getStreakLevel(streak);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (isNew) {
      setPop(true);
      setTimeout(() => setPop(false), 600);
      if (streak >= 30) unlock('streak_30');
      else if (streak >= 7) unlock('streak_7');
      else if (streak >= 3) unlock('streak_3');
    }
  }, [isNew, streak, unlock]);

  return (
    <div style={{
      background: `${level.color}15`,
      border: `1px solid ${level.color}30`,
      borderRadius: 16, padding: "10px 14px", textAlign: "center",
      transform: pop ? "scale(1.15)" : "scale(1)",
      transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      position: "relative", cursor: "default",
    }}>
      {pop && (
        <div style={{
          position: "absolute", top: -20, right: 0,
          color: level.color, fontSize: 13, fontWeight: 900,
          animation: "floatUp 0.6s ease forwards",
        }}>+1</div>
      )}
      <p style={{ fontSize: 22 }}>{level.emoji}</p>
      <p style={{ color: level.color, fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{streak}</p>
      <p style={{ color: "#475569", fontSize: 9, letterSpacing: "0.08em", marginTop: 2 }}>
        JOUR{streak > 1 ? "S" : ""}
      </p>
    </div>
  );
}

export function StreakBadgeInline() {
  const { streak, isNew } = useStreak();
  const level = getStreakLevel(streak);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (isNew) { setPop(true); setTimeout(() => setPop(false), 600); }
  }, [isNew]);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      background: `${level.color}15`, border: `1px solid ${level.color}30`,
      borderRadius: 20, padding: "5px 10px",
      transform: pop ? "scale(1.12)" : "scale(1)",
      transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      position: "relative", cursor: "default",
    }}>
      {pop && (
        <div style={{
          position: "absolute", top: -16, right: 0,
          color: level.color, fontSize: 11, fontWeight: 900,
          animation: "floatUp 0.6s ease forwards",
        }}>+1</div>
      )}
      <span style={{ fontSize: 14 }}>{level.emoji}</span>
      <span style={{ fontSize: 13, fontWeight: 900, color: level.color, fontVariantNumeric: "tabular-nums" }}>{streak}</span>
    </div>
  );
}

const STEPS = [
  {
    icon: "👋", accent: "#6366f1",
    title: "Bienvenue sur Solv",
    subtitle: "Maîtrise ton argent en 30 secondes par jour.",
    description: "Solv analyse tes dépenses, prédit ton découvert et te donne des conseils concrets pour dépenser mieux.",
    highlight: null,
  },
  {
    icon: "📊", accent: "#22c55e",
    title: "Ton solde en direct",
    subtitle: "Vois immédiatement où tu en es.",
    description: "Le Dashboard affiche ton solde restant, ton rythme journalier, et une phrase personnalisée. Si tu files vers le découvert, Solv te prévient avant qu'il soit trop tard.",
    highlight: "Regarde la barre de progression — la ligne blanche c'est ton rythme idéal.",
  },
  {
    icon: "🎛️", accent: "#818cf8",
    title: "Simule tes économies",
    subtitle: "Et si tu réduisais Uber de 50% ?",
    description: "Le simulateur What-If te permet de jouer avec tes dépenses et voir en temps réel combien tu économiserais.",
    highlight: "Glisse le curseur Transport et regarde le solde changer instantanément.",
  },
  {
    icon: "👻", accent: "#a78bfa",
    title: "Chasse les abonnements fantômes",
    subtitle: "En moyenne 3 abonnements oubliés par personne.",
    description: "Solv détecte tes paiements récurrents et identifie ceux que tu n'utilises probablement plus.",
    highlight: "Annuler les abonnements à risque élevé peut te faire économiser +40€/mois.",
  },
  {
    icon: "🔥", accent: "#f97316",
    title: "Construis ton streak",
    subtitle: "7 jours de suite = tu maîtrises ton budget.",
    description: "Chaque jour que tu ouvres Solv, ton streak augmente. À 30 jours tu passes Légendaire 💎.",
    highlight: "Ton objectif : atteindre 7 jours sans interruption.",
  },
];

interface OnboardingProps { onFinish: () => void; }

export function OnboardingTutorial({ onFinish }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [exiting, setExit] = useState(false);

  const goTo = (next: number) => {
    setExit(true);
    setTimeout(() => { setStep(next); setExit(false); }, 200);
  };

  const goNext = () => step === STEPS.length - 1 ? onFinish() : goTo(step + 1);
  const goPrev = () => step > 0 && goTo(step - 1);

  const s = STEPS[step];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(8,8,16,0.92)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: `linear-gradient(135deg, ${s.accent}15, ${s.accent}05)`,
        border: `1px solid ${s.accent}30`,
        borderRadius: 28, padding: "32px 28px",
        transform: exiting ? "translateX(24px)" : "translateX(0)",
        opacity: exiting ? 0 : 1,
        transition: "all 0.2s ease",
        position: "relative",
      }}>
        <button onClick={onFinish} style={{
          position: "absolute", top: 18, right: 18,
          background: "rgba(255,255,255,0.07)", border: "none",
          color: "#475569", fontSize: 12, padding: "5px 12px",
          borderRadius: 20, cursor: "pointer", fontWeight: 600,
        }}>Passer →</button>

        <p style={{ color: s.accent, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
          {step + 1} / {STEPS.length}
        </p>

        <div style={{ fontSize: 52, marginBottom: 20 }}>{s.icon}</div>

        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 6 }}>{s.title}</h2>
        <p style={{ color: s.accent, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{s.subtitle}</p>
        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.65, marginBottom: 20 }}>{s.description}</p>

        {s.highlight && (
          <div style={{ background: `${s.accent}15`, border: `1px solid ${s.accent}25`, borderRadius: 14, padding: "12px 14px", marginBottom: 24 }}>
            <p style={{ color: s.accent, fontSize: 13, fontWeight: 600 }}>💡 {s.highlight}</p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => goTo(i)} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i === step ? s.accent : "rgba(255,255,255,0.12)",
              transition: "all 0.3s ease", cursor: "pointer",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button onClick={goPrev} style={{
              flex: 1, padding: 13, borderRadius: 14,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#64748b", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>← Retour</button>
          )}
          <button onClick={goNext} style={{
            flex: 2, padding: 13, borderRadius: 14,
            background: `linear-gradient(135deg, ${s.accent}, ${s.accent}bb)`,
            border: "none", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer",
            boxShadow: `0 4px 20px ${s.accent}44`,
          }}>
            {step === STEPS.length - 1 ? "C'est parti 🚀" : "Suivant →"}
          </button>
        </div>
      </div>
    </div>
  );
}
