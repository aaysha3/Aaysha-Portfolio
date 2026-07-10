import React, { useEffect, useRef, useState, useCallback } from "react";
import { Mail, ArrowUpRight, ArrowDown, Sparkles } from "lucide-react";

// quick color palette - tweak these if the vibe ever needs to change
const colors = {
  bg: "#0A0E1A",
  panel: "#12172A",
  panelLight: "#1B2138", // not really using this one much anymore, keeping around
  coral: "#FF6B5B",
  magenta: "#C13584",
  violet: "#6C5CE7",
  gold: "#D4AF37",
  ivory: "#F5F1EC",
  ivoryDim: "rgba(245,241,236,0.6)",
};

const gradient = `linear-gradient(135deg, ${colors.coral} 0%, ${colors.magenta} 50%, ${colors.violet} 100%)`;

const codeSymbols = ["</>", "{ }", "( )", "=>", "#!", "[ ]", "&&", "://"];

// ---------- mouse tracking for the little glow that follows the cursor ----------
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function handleMove(e) {
      setPos({ x: e.clientX, y: e.clientY });
    }
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return pos;
}

// lerp towards target so the glow doesn't snap around
function useSmoothed(target, ease = 0.08) {
  const [val, setVal] = useState(target);
  const raf = useRef(null);
  const current = useRef(target);

  useEffect(() => {
    const tick = () => {
      current.current.x += (target.x - current.current.x) * ease;
      current.current.y += (target.y - current.current.y) * ease;
      setVal({ x: current.current.x, y: current.current.y });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.x, target.y]);

  return val;
}

function useOnScreen(opts) {
  const options = opts || { threshold: 0.2 };
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      obs.unobserve(el);
    }, options);

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, visible];
}

function useCountUp(target, visible, duration = 1400) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!visible) return;

    let start = null;
    let frame;

    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // cubic ease-out, feels less mechanical than linear
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [visible, target, duration]);

  return val;
}

// fades + slides an element up into view once it's on screen
function Reveal({ children, delay = 0, className = "", style = {} }) {
  const [ref, visible] = useOnScreen();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(28px)",
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MagneticButton({ children, href, style = {}, className = "", target, rel }) {
  const ref = useRef(null);
  const [t, setT] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setT({ x: x * 0.25, y: y * 0.25 });
  };

  return (
    <a
      ref={ref}
      href={href}
      target={target}
      rel={rel}
      onMouseMove={handleMove}
      onMouseLeave={() => setT({ x: 0, y: 0 })}
      className={className}
      style={{
        transform: `translate(${t.x}px, ${t.y}px)`,
        transition: "transform 0.15s ease-out",
        ...style,
      }}
    >
      {children}
    </a>
  );
}

// avatar circle with a few floating emoji "stickers" around it
function EmojiProfileImage({ src, alt }) {
  const stickers = [
    { emoji: "\u{1F469}\u200D\u{1F4BB}", top: "-6%", left: "-10%", dur: "6s", delay: "0s" },
    { emoji: "\u2728", top: "4%", left: "92%", dur: "5s", delay: "-1.5s" },
    { emoji: "\u{1F680}", top: "82%", left: "-8%", dur: "7s", delay: "-3s" },
    { emoji: "\u{1F4BB}", top: "88%", left: "88%", dur: "5.5s", delay: "-2s" },
  ];

  return (
    <div className="relative mx-auto" style={{ width: 220, height: 220 }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -8,
          borderRadius: "9999px",
          background: `conic-gradient(from 0deg, ${colors.coral}, ${colors.magenta}, ${colors.violet}, ${colors.coral})`,
          animation: "spinRing 6s linear infinite",
          filter: "blur(1px)",
        }}
      />
      <div
        className="absolute rounded-full overflow-hidden flex items-center justify-center"
        style={{ inset: 4, background: colors.panel, border: `3px solid ${colors.bg}` }}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" style={{ display: "block" }} />
        ) : (
          <span style={{ fontSize: "4rem" }}>{"\u{1F642}"}</span>
        )}
      </div>

      {stickers.map((s, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute select-none"
          style={{
            top: s.top,
            left: s.left,
            fontSize: "1.8rem",
            animation: `floatY ${s.dur} ease-in-out infinite`,
            animationDelay: s.delay,
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.4))",
          }}
        >
          {s.emoji}
        </span>
      ))}
    </div>
  );
}

function ShootingStars() {
  // random once on mount, don't want these re-rolling every render
  const [stars] = useState(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      arr.push({
        id: i,
        top: Math.random() * 55,
        left: Math.random() * 90,
        duration: 3.5 + Math.random() * 4.5,
        delay: Math.random() * 10,
        length: 100 + Math.random() * 90,
      });
    }
    return arr;
  });

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
      {stars.map((s) => (
        <span
          key={s.id}
          className="shooting-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.length}px`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function ProjectCard({ project, index }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  function handleMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (py - 0.5) * -10, y: (px - 0.5) * 10 });
    setGlow({ x: px * 100, y: py * 100 });
  }

  return (
    <Reveal delay={index * 0.12}>
      <div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="rounded-3xl p-8 h-full"
        style={{
          background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(193,53,132,0.18), transparent 60%), ${colors.panel}`,
          border: "1px solid rgba(245,241,236,0.08)",
          transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1)`,
          transition: "transform 0.25s ease-out, box-shadow 0.25s ease-out",
          boxShadow:
            tilt.x !== 0 || tilt.y !== 0
              ? "0 25px 50px -12px rgba(193,53,132,0.35)"
              : "0 10px 30px -15px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-start justify-between mb-6">
          <span className="text-xs tracking-widest uppercase" style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace" }}>
            {project.tag}
          </span>
          <ArrowUpRight size={20} style={{ color: colors.ivoryDim }} />
        </div>
        <h3 className="text-3xl mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: colors.ivory, fontWeight: 600 }}>
          {project.title}
        </h3>
        <p className="mb-6 leading-relaxed" style={{ color: colors.ivoryDim, fontSize: "0.95rem" }}>
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {project.stack.map((s) => (
            <span
              key={s}
              className="px-3 py-1 rounded-full text-xs"
              style={{ fontFamily: "'JetBrains Mono', monospace", border: "1px solid rgba(245,241,236,0.15)", color: colors.ivoryDim }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function SkillBar({ label, percent, index }) {
  const [ref, visible] = useOnScreen();

  return (
    <div ref={ref} className="mb-6">
      <div className="flex justify-between mb-2">
        <span style={{ color: colors.ivory, fontFamily: "'Space Grotesk', sans-serif" }}>{label}</span>
        <span style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>{percent}%</span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 6, background: "rgba(245,241,236,0.08)" }}>
        <div
          style={{
            height: "100%",
            width: visible ? `${percent}%` : "0%",
            background: gradient,
            borderRadius: 999,
            transition: `width 1.2s cubic-bezier(0.16,1,0.3,1) ${index * 0.1}s`,
          }}
        />
      </div>
    </div>
  );
}

function TimelineItem({ item, index, isLast }) {
  const [ref, visible] = useOnScreen();

  return (
    <div ref={ref} className="relative pl-12 pb-14" style={{ opacity: visible ? 1 : 0.3, transition: "opacity 0.6s ease" }}>
      {!isLast && (
        <div
          className="absolute left-[7px] top-4 w-px"
          style={{
            height: visible ? "calc(100% - 8px)" : "0%",
            background: `linear-gradient(${colors.magenta}, transparent)`,
            transition: "height 1s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}
        />
      )}
      <div
        className="absolute left-0 top-1 w-4 h-4 rounded-full"
        style={{
          background: visible ? gradient : "rgba(245,241,236,0.2)",
          boxShadow: visible ? "0 0 20px rgba(193,53,132,0.7)" : "none",
          transition: "all 0.5s ease",
        }}
      />
      <span className="text-xs tracking-widest uppercase" style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace" }}>
        {item.period}
      </span>
      <h4 className="text-2xl mt-1 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: colors.ivory, fontWeight: 600 }}>
        {item.role}
      </h4>
      <p style={{ color: colors.ivoryDim, fontSize: "0.95rem" }}>{item.company}</p>
      <p className="mt-2 max-w-xl leading-relaxed" style={{ color: colors.ivoryDim, fontSize: "0.9rem" }}>
        {item.desc}
      </p>
    </div>
  );
}

// ============================================================
// main component
// ============================================================

// To use a real photo: drop it in src/assets (e.g. src/assets/profile.jpg),
// import it up top, then point this at the import instead of null.
const PROFILE_IMAGE_SRC = null;

export default function DevPortfolio() {
  const rawMouse = useMousePosition();
  const smoothMouse = useSmoothed(rawMouse, 0.06);

  const [particles] = useState(() => {
    const list = [];
    for (let i = 0; i < 14; i++) {
      list.push({
        id: i,
        symbol: codeSymbols[i % codeSymbols.length],
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 14 + Math.random() * 12,
        delay: Math.random() * -20,
        size: 14 + Math.random() * 16,
      });
    }
    return list;
  });

  const [aboutRef, aboutVisible] = useOnScreen();

  const stats = [
    { label: "Years in B.Tech", value: 3, suffix: "+" },
    { label: "Certifications Earned", value: 3, suffix: "" },
    { label: "Major Projects", value: 2, suffix: "+" },
    { label: "Current CGPA", raw: "6.12" },
  ];

  const projects = [
    {
      tag: "Full Stack Frontend Project",
      title: "Portfolio Website",
      description:
        "A fully responsive personal portfolio built with modern HTML5, CSS3, and JavaScript, with clean UI/UX for showcasing projects and skills across devices, deployed on GitHub Pages.",
      stack: ["HTML", "CSS", "JavaScript", "GitHub Pages"],
    },
    {
      tag: "AI / ML Project",
      title: "DeepShield AI",
      description:
        "An AI-based image manipulation detection system that applies image processing and forensic analysis techniques to evaluate the authenticity of visual content and flag tampering.",
      stack: ["Python", "Machine Learning", "Image Processing", "Computer Vision"],
    },
  ];

  const skills = [
    { label: "Programming (Java, Python, JS, C)", percent: 78 },
    { label: "Web Development (HTML, CSS, JS, DOM)", percent: 80 },
    { label: "Databases (MySQL, MongoDB, SQL)", percent: 68 },
    { label: "Core CS (DSA, OOP, DBMS, OS)", percent: 74 },
    { label: "Git & Dev Tools", percent: 75 },
  ];

  const marqueeItems = ["Java", "Python", "JavaScript", "C", "HTML5", "CSS3", "MySQL", "MongoDB", "Git", "GitHub", "DSA", "OOP", "DBMS"];

  const timeline = [
    {
      period: "2023 — Present",
      role: "B.Tech in Software Engineering",
      company: "Techno Main Salt Lake (Techno India University), Kolkata",
      desc: "Pursuing a strong foundation in Data Structures & Algorithms, OOP, and full-stack web development. CGPA: 6.12 up to 5th semester.",
    },
    {
      period: "2022",
      role: "Higher Secondary (Class XII)",
      company: "De-Nobili School, Jharkhand",
      desc: "Completed with 72.2%.",
    },
    {
      period: "2020",
      role: "Secondary (Class X)",
      company: "Carmel School, Jharkhand",
      desc: "Completed with 78.1%.",
    },
  ];

  const certifications = [
    { title: "Getting Started with Artificial Intelligence", issuer: "IBM SkillsBuild", year: "2025" },
    { title: "Python Mastery: The Complete Web Programming Course", issuer: "Udemy", year: "2025" },
    { title: "Complete JavaScript, HTML5 & CSS3 from Zero to Expert", issuer: "Udemy", year: "2026" },
  ];

  const socials = [
    { mono: "GH", label: "GitHub", url: "https://github.com/aaysha3-cyber" },
    { mono: "IN", label: "LinkedIn", url: "https://www.linkedin.com/in/aaysha-agarwal-82b0a72a9/" },
    { mono: "X", label: "Twitter / X", url: "#" }, // haven't set this up yet
  ];

  const CONTACT_EMAIL = "aaysha2103@gmail.com";

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div style={{ background: colors.bg, color: colors.ivory, fontFamily: "'Inter', sans-serif", overflowX: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        @keyframes blobMove {
          0%, 100% { border-radius: 42% 58% 65% 35% / 45% 45% 55% 55%; }
          25% { border-radius: 58% 42% 35% 65% / 55% 65% 35% 45%; }
          50% { border-radius: 65% 35% 45% 55% / 35% 55% 45% 65%; }
          75% { border-radius: 35% 65% 55% 45% / 65% 35% 65% 35%; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(8deg); }
        }
        @keyframes spinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes marqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes bounceArrow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }

        .marquee-track { animation: marqueeLeft 26s linear infinite; }
        .marquee-track-rev { animation: marqueeRight 30s linear infinite; }
        .particle { animation: floatY var(--dur) ease-in-out infinite; animation-delay: var(--delay); }
        .gradient-text {
          background: linear-gradient(90deg, ${colors.coral}, ${colors.magenta}, ${colors.violet}, ${colors.coral});
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: shimmer 8s linear infinite;
        }
        .nav-link { position: relative; }
        .nav-link::after {
          content: ''; position: absolute; left: 0; bottom: -4px; width: 0; height: 1px;
          background: ${colors.gold}; transition: width 0.3s ease;
        }
        .nav-link:hover::after { width: 100%; }

        @media (prefers-reduced-motion: reduce) {
          .marquee-track, .marquee-track-rev, .particle, .gradient-text {
            animation: none !important;
          }
        }
      `}</style>

      <div
        aria-hidden
        style={{
          position: "fixed",
          left: smoothMouse.x - 300,
          top: smoothMouse.y - 300,
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(193,53,132,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
          transition: "opacity 0.3s",
        }}
      />

      <nav
        className="fixed top-0 left-0 w-full flex items-center justify-between px-8 md:px-16 py-6"
        style={{ zIndex: 50, backdropFilter: "blur(12px)", background: "rgba(10,14,26,0.6)" }}
      >
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "0.05em" }}>A.AGARWAL</span>
        <div className="hidden md:flex gap-8 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {["about", "skills", "projects", "education", "certifications", "contact"].map((s) => (
            <button
              key={s}
              onClick={() => scrollTo(s)}
              className="nav-link uppercase tracking-wider"
              style={{ color: colors.ivoryDim, background: "none", border: "none", cursor: "pointer" }}
            >
              {s}
            </button>
          ))}
        </div>
      </nav>

      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ zIndex: 2 }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            left: `calc(50% + ${(smoothMouse.x - (typeof window !== "undefined" ? window.innerWidth / 2 : 0)) * 0.06}px)`,
            top: `calc(45% + ${(smoothMouse.y - (typeof window !== "undefined" ? window.innerHeight / 2 : 0)) * 0.06}px)`,
            transform: "translate(-50%, -50%)",
            background: gradient,
            opacity: 0.35,
            filter: "blur(90px)",
            animation: "blobMove 12s ease-in-out infinite",
            zIndex: 0,
          }}
        />

        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            aria-hidden
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: `${p.top}%`,
              fontSize: p.size,
              color: "rgba(245,241,236,0.12)",
              fontFamily: "'JetBrains Mono', monospace",
              "--dur": `${p.duration}s`,
              "--delay": `${p.delay}s`,
              zIndex: 0,
              pointerEvents: "none",
            }}
          >
            {p.symbol}
          </div>
        ))}

        <div style={{ zIndex: 2 }}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{ border: "1px solid rgba(212,175,55,0.4)", fontFamily: "'JetBrains Mono', monospace" }}
          >
            <Sparkles size={14} style={{ color: colors.gold }} />
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.1em", color: colors.gold }}>AVAILABLE FOR NEW ROLES</span>
          </div>

          <div className="mb-8">
            <EmojiProfileImage src={PROFILE_IMAGE_SRC} alt="Aaysha Agarwal" />
          </div>

          <h1
            className="gradient-text"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(3rem, 10vw, 7rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            AAYSHA AGARWAL
          </h1>
          <p className="mt-6 max-w-xl mx-auto" style={{ color: colors.ivoryDim, fontSize: "clamp(1rem, 2vw, 1.35rem)", fontWeight: 300 }}>
            Aspiring Software Engineer exploring software development, AI, and cybersecurity.
          </p>
          <p className="mt-3" style={{ color: colors.ivoryDim, fontSize: "0.85rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>
            Dhanbad, Jharkhand
          </p>

          <div className="flex items-center justify-center gap-4 mt-10 flex-wrap">
            <MagneticButton
              href="#projects"
              className="px-8 py-4 rounded-full inline-flex items-center gap-2"
              style={{ background: gradient, color: "#0A0E1A", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
            >
              View My Work <ArrowUpRight size={18} />
            </MagneticButton>
            <MagneticButton
              href="#contact"
              className="px-8 py-4 rounded-full inline-flex items-center gap-2"
              style={{ border: "1px solid rgba(245,241,236,0.25)", color: colors.ivory, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
            >
              Get in Touch
            </MagneticButton>
          </div>
        </div>

        <div className="absolute bottom-10" style={{ animation: "bounceArrow 2s ease-in-out infinite", zIndex: 2 }}>
          <ArrowDown size={20} style={{ color: colors.ivoryDim }} />
        </div>
      </section>

      <div className="overflow-hidden py-4" style={{ background: colors.panel, borderTop: "1px solid rgba(245,241,236,0.08)", borderBottom: "1px solid rgba(245,241,236,0.08)" }}>
        <div className="marquee-track flex whitespace-nowrap" style={{ width: "200%" }}>
          {[0, 1].map((dupIdx) => (
            <div key={dupIdx} className="flex">
              {["BUILD", "SHIP", "ITERATE", "DEBUG", "REFACTOR", "DEPLOY", "REPEAT"].map((w, i) => (
                <span key={i} className="mx-6 flex items-center gap-6" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "1.5rem", color: colors.ivoryDim }}>
                  {w} <span style={{ color: colors.gold }}>✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section id="about" className="relative px-6 md:px-16 py-32" style={{ zIndex: 2 }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <Reveal>
            <span className="text-xs tracking-widest uppercase" style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace" }}>
              About
            </span>
            <h2 className="mt-4 mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.75rem)", fontWeight: 600, lineHeight: 1.15 }}>
              I'm building the foundation to become the engineer who ships things that work.
            </h2>
            <p style={{ color: colors.ivoryDim, lineHeight: 1.8 }}>
              I'm an aspiring software engineer pursuing a B.Tech in Software Engineering, with a strong foundation
              in Data Structures & Algorithms, Object-Oriented Programming, and full-stack web development. I'm
              drawn to software development, artificial intelligence, and cybersecurity, and I've built academic
              and personal projects ranging from responsive web apps to an AI-based image forensics system. I'm
              actively solving problems on LeetCode and maintaining my work on GitHub, always looking for the next
              thing to learn.
            </p>
          </Reveal>

          <div ref={aboutRef} className="grid grid-cols-2 gap-8">
            {stats.map((s, i) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const count = useCountUp(s.raw ? 0 : s.value, aboutVisible && !s.raw, 1600 + i * 200);
              return (
                <Reveal key={s.label} delay={i * 0.1}>
                  <div className="p-6 rounded-2xl" style={{ background: colors.panel, border: "1px solid rgba(245,241,236,0.06)" }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.5rem", fontWeight: 700, color: colors.ivory }}>
                      {s.raw ? s.raw : count.toLocaleString()}
                      {s.suffix}
                    </div>
                    <div style={{ color: colors.ivoryDim, fontSize: "0.85rem", marginTop: 4 }}>{s.label}</div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="skills" className="relative px-6 md:px-16 py-32" style={{ zIndex: 2, background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <span className="text-xs tracking-widest uppercase" style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace" }}>
              Skills
            </span>
            <h2 className="mt-4 mb-16" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.75rem)", fontWeight: 600 }}>
              Tools of the trade.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-2 mb-16">
            {skills.map((s, i) => (
              <SkillBar key={s.label} label={s.label} percent={s.percent} index={i} />
            ))}
          </div>
        </div>

        <div className="overflow-hidden py-2">
          <div className="marquee-track flex whitespace-nowrap" style={{ width: "200%" }}>
            {[0, 1].map((dupIdx) => (
              <div key={dupIdx} className="flex">
                {marqueeItems.map((item) => (
                  <span key={item} className="mx-4 px-6 py-3 rounded-full inline-block" style={{ border: "1px solid rgba(245,241,236,0.12)", fontFamily: "'JetBrains Mono', monospace", color: colors.ivoryDim }}>
                    {item}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="relative px-6 md:px-16 py-32" style={{ zIndex: 2 }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <span className="text-xs tracking-widest uppercase" style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace" }}>
              Selected Work
            </span>
            <h2 className="mt-4 mb-16" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.75rem)", fontWeight: 600 }}>
              Projects that shipped, scaled, and stuck around.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((p, i) => (
              <ProjectCard key={p.title} project={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section id="education" className="relative px-6 md:px-16 py-32" style={{ zIndex: 2, background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <span className="text-xs tracking-widest uppercase" style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace" }}>
              Education
            </span>
            <h2 className="mt-4 mb-16" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.75rem)", fontWeight: 600 }}>
              My academic path.
            </h2>
          </Reveal>

          <div>
            {timeline.map((item, i) => (
              <TimelineItem key={item.role} item={item} index={i} isLast={i === timeline.length - 1} />
            ))}
          </div>
        </div>
      </section>

      <section id="certifications" className="relative px-6 md:px-16 py-32" style={{ zIndex: 2 }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <span className="text-xs tracking-widest uppercase" style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace" }}>
              Certifications
            </span>
            <h2 className="mt-4 mb-16" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.75rem)", fontWeight: 600 }}>
              Always learning something new.
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {certifications.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.1}>
                <div className="p-6 rounded-2xl h-full" style={{ background: colors.panel, border: "1px solid rgba(245,241,236,0.06)" }}>
                  <span className="text-xs tracking-widest uppercase" style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace" }}>
                    {c.year}
                  </span>
                  <h4 className="mt-3 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: colors.ivory, fontWeight: 600, fontSize: "1.1rem", lineHeight: 1.3 }}>
                    {c.title}
                  </h4>
                  <p style={{ color: colors.ivoryDim, fontSize: "0.85rem" }}>{c.issuer}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2}>
            <p className="mt-10" style={{ color: colors.ivoryDim, fontSize: "0.9rem" }}>
              Also active on <span style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace" }}>LeetCode</span> solving
              arrays, strings, and core DSA problems, and on <span style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace" }}>GitHub</span> maintaining
              projects and version-control practice.
            </p>
          </Reveal>
        </div>
      </section>

      <section id="contact" className="relative px-6 md:px-16 py-40 text-center" style={{ zIndex: 2 }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            height: 400,
            background: gradient,
            opacity: 0.18,
            filter: "blur(100px)",
            animation: "pulseGlow 4s ease-in-out infinite",
          }}
        />
        <Reveal style={{ position: "relative" }}>
          <span className="text-xs tracking-widest uppercase" style={{ color: colors.gold, fontFamily: "'JetBrains Mono', monospace" }}>
            Contact
          </span>
          <h2 className="mt-4 mb-6 gradient-text" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2.2rem, 6vw, 4rem)", fontWeight: 700 }}>
            Let's build something great.
          </h2>
          <p className="max-w-md mx-auto mb-10" style={{ color: colors.ivoryDim }}>
            Seeking internship opportunities to apply my skills in real-world development environments.
            My inbox is always open.
          </p>
          <MagneticButton
            href={`mailto:${CONTACT_EMAIL}`}
            className="px-10 py-5 rounded-full inline-flex items-center gap-3 mb-14"
            style={{ background: gradient, color: "#0A0E1A", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: "1.1rem" }}
          >
            <Mail size={20} /> {CONTACT_EMAIL}
          </MagneticButton>

          <div className="flex items-center justify-center gap-6">
            {socials.map(({ mono, label, url }) => (
              <a
                key={label}
                href={url}
                target={url !== "#" ? "_blank" : undefined}
                rel={url !== "#" ? "noopener noreferrer" : undefined}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  border: "1px solid rgba(245,241,236,0.15)",
                  color: colors.ivoryDim,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.gold;
                  e.currentTarget.style.borderColor = colors.gold;
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.ivoryDim;
                  e.currentTarget.style.borderColor = "rgba(245,241,236,0.15)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                aria-label={label}
              >
                {mono}
              </a>
            ))}
          </div>
        </Reveal>
      </section>

      <footer className="px-6 md:px-16 py-8 text-center" style={{ borderTop: "1px solid rgba(245,241,236,0.08)", color: colors.ivoryDim, fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace" }}>
        © {new Date().getFullYear()} AAYSHA AGARWAL — DESIGNED & BUILT WITH CARE
      </footer>
    </div>
  );
}