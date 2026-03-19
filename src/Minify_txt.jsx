import { useState, useCallback } from "react";

// ── Minifier logic ───────────────────────────────────────────────
const minifyHTML = (html) =>
  html.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();

const minifyCSS = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();

const minifyJS = (js) =>
  js
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\n+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*([=+\-*/%&|^!<>?:,;{}()[\]])\s*/g, "$1")
    .replace(/\n/g, "")
    .trim();

const MINIFIERS = { html: minifyHTML, css: minifyCSS, js: minifyJS };
const LABELS = { html: "HTML", css: "CSS", js: "JavaScript" };
const PLACEHOLDERS = {
  html: `<div class="container">\n  <h1>  Hello World  </h1>\n  <!-- comment -->\n</div>`,
  css: `.container {\n  display : flex ;\n  /* layout */\n  gap : 20px ;\n}`,
  js: `// greet user\nfunction greet( name ) {\n  return "Hello, " + name;\n}`,
};

// ── Theme tokens ─────────────────────────────────────────────────
const THEMES = {
  dark: {
    shell:        "#0a0c10",
    headerBg:     "#13151c",
    bodyBg:       "#0d0f17",
    border:       "#1e2130",
    taBg:         "#090b11",
    taBorder:     "#1a1d2b",
    tabRowBg:     "#0a0c10",
    titleColor:   "#e2e8f0",
    subtitleColor:"#4a5568",
    paneLabelClr: "#3d4259",
    charCountClr: "#2d3148",
    headerTitleC: "#3d4259",
    taTextColor:  "#94a3b8",
    taOutputClr:  "#a5f3a0",
    btnBg:        "rgba(255,255,255,0.05)",
    btnColor:     "#94a3b8",
    btnBorderClr: "#1e2130",
    tabInactiveC: "#4a5568",
    tabHoverC:    "#e2e8f0",
    actionHoverBg:"rgba(255,255,255,0.08)",
    actionHoverC: "#e2e8f0",
    scrollThumb:  "#2d2f3a",
    toggleBg:     "#1e2130",
    toggleKnob:   "#4a5568",
    icon:         "☀️",
    label:        "Light",
  },
  light: {
    shell:        "#f0f2f8",
    headerBg:     "#ffffff",
    bodyBg:       "#ffffff",
    border:       "#dde1ef",
    taBg:         "#f8f9fd",
    taBorder:     "#dde1ef",
    tabRowBg:     "#eef0f8",
    titleColor:   "#0f1117",
    subtitleColor:"#6b7280",
    paneLabelClr: "#9ca3af",
    charCountClr: "#c4c9d8",
    headerTitleC: "#c4c9d8",
    taTextColor:  "#374151",
    taOutputClr:  "#166534",
    btnBg:        "#f3f4f6",
    btnColor:     "#6b7280",
    btnBorderClr: "#dde1ef",
    tabInactiveC: "#9ca3af",
    tabHoverC:    "#111827",
    actionHoverBg:"#e5e7eb",
    actionHoverC: "#111827",
    scrollThumb:  "#c4c9d8",
    toggleBg:     "#e5e7eb",
    toggleKnob:   "#9ca3af",
    icon:         "🌙",
    label:        "Dark",
  },
};

// ── Savings badge ─────────────────────────────────────────────────
function SavingsBadge({ original, minified }) {
  if (!original || !minified) return null;
  const saved = original.length - minified.length;
  const pct = ((saved / original.length) * 100).toFixed(1);
  if (saved <= 0) return null;
  return (
    <span style={{
      display: "inline-block",
      background: "rgba(74,222,128,0.15)",
      color: "#4ade80",
      border: "1px solid rgba(74,222,128,0.3)",
      borderRadius: "20px",
      padding: "2px 10px",
      fontSize: "11px",
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: "0.03em",
    }}>
      ↓ {pct}% saved ({saved} chars)
    </span>
  );
}

// ── Copy button ───────────────────────────────────────────────────
function CopyButton({ text, t }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      disabled={!text}
      style={{
        padding: "7px 16px",
        fontSize: "11px",
        letterSpacing: "0.06em",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        background: copied ? "rgba(74,222,128,0.15)" : t.btnBg,
        color: copied ? "#4ade80" : t.btnColor,
        border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : t.btnBorderClr}`,
        borderRadius: "6px",
        cursor: text ? "pointer" : "not-allowed",
        transition: "all 0.2s",
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ── Theme toggle ──────────────────────────────────────────────────
function ThemeToggle({ isDark, onToggle, t }) {
  return (
    <button
      onClick={onToggle}
      title={`Switch to ${t.label} mode`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: t.toggleBg,
        border: `1px solid ${t.btnBorderClr}`,
        borderRadius: "20px",
        padding: "4px 12px 4px 6px",
        cursor: "pointer",
        transition: "all 0.25s",
      }}
    >
      {/* Track + knob */}
      <span style={{
        position: "relative",
        display: "inline-block",
        width: "32px",
        height: "18px",
        background: isDark ? "rgba(99,102,241,0.4)" : "#d1d5db",
        borderRadius: "9px",
        transition: "background 0.25s",
        flexShrink: 0,
      }}>
        <span style={{
          position: "absolute",
          top: "3px",
          left: isDark ? "17px" : "3px",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          background: isDark ? "#818cf8" : "#9ca3af",
          transition: "left 0.25s",
        }} />
      </span>
      <span style={{
        fontSize: "11px",
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 600,
        color: t.paneLabelClr,
        letterSpacing: "0.06em",
        userSelect: "none",
      }}>
        {t.icon} {t.label}
      </span>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function Minifier() {
  const [input,  setInput]  = useState("");
  const [output, setOutput] = useState("");
  const [type,   setType]   = useState("html");
  const [error,  setError]  = useState("");
  const [isDark, setIsDark] = useState(true);

  const t = isDark ? THEMES.light : THEMES.dark;

  const handleMinify = useCallback(() => {
    setError("");
    if (!input.trim()) { setError("Paste some code first."); return; }
    try { setOutput(MINIFIERS[type](input)); }
    catch (e) { setError("Could not minify: " + e.message); }
  }, [input, type]);

  const handleClear  = () => { setInput(""); setOutput(""); setError(""); };
  const switchType   = (k) => { setType(k); setOutput(""); setError(""); };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${t.shell}; transition: background 0.3s; }
    textarea { transition: border-color 0.2s, background 0.3s, color 0.3s; }
    textarea:focus { outline: none; border-color: rgba(99,102,241,0.6) !important; }
    textarea::-webkit-scrollbar { width: 6px; }
    textarea::-webkit-scrollbar-track { background: transparent; }
    textarea::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 3px; }
    .tab-btn { transition: all 0.2s !important; }
    .tab-btn:hover { color: ${t.tabHoverC} !important; }
    .minify-btn { transition: all 0.2s !important; }
    .minify-btn:hover { background: rgba(99,102,241,0.9) !important; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
    .minify-btn:active { transform: translateY(0) !important; }
    .action-btn { transition: all 0.2s !important; }
    .action-btn:hover { background: ${t.actionHoverBg} !important; color: ${t.actionHoverC} !important; }
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: t.shell, display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px 60px", fontFamily: "'JetBrains Mono', monospace", transition: "background 0.3s" }}>

        {/* Window chrome */}
        <div style={{ width: "100%", maxWidth: "980px", background: t.headerBg, border: `1px solid ${t.border}`, borderBottom: "none", borderRadius: "12px 12px 0 0", padding: "12px 18px", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.3s, border-color 0.3s" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f87171", opacity: 0.8 }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fbbf24", opacity: 0.8 }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#4ade80", opacity: 0.8 }} />
          <span style={{ marginLeft: "auto", fontSize: "11px", color: t.headerTitleC, letterSpacing: "0.1em" }}>minifier.dev</span>
        </div>

        {/* Body */}
        <div style={{ width: "100%", maxWidth: "980px", background: t.bodyBg, border: `1px solid ${t.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "36px 36px 40px", transition: "background 0.3s, border-color 0.3s" }}>

          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: t.titleColor, letterSpacing: "-0.02em", transition: "color 0.3s" }}>
                Code Minifier
              </h1>
              <p style={{ fontSize: "12px", color: t.subtitleColor, marginTop: "6px", letterSpacing: "0.04em", transition: "color 0.3s" }}>
                Strip whitespace, comments & bloat — instantly.
              </p>
            </div>
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark(d => !d)} t={t} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: t.tabRowBg, borderRadius: "8px", padding: "4px", width: "fit-content", border: `1px solid ${t.border}`, transition: "background 0.3s" }}>
            {Object.entries(LABELS).map(([k, v]) => (
              <button
                key={k}
                className="tab-btn"
                onClick={() => switchType(k)}
                style={{
                  padding: "6px 18px",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 600,
                  background: type === k ? "rgba(99,102,241,0.15)" : "transparent",
                  color: type === k ? "#818cf8" : t.tabInactiveC,
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 48px 1fr", alignItems: "start" }}>

            {/* Input */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", letterSpacing: "0.12em", color: t.paneLabelClr, fontWeight: 600 }}>INPUT</span>
                <span style={{ fontSize: "10px", color: t.charCountClr, letterSpacing: "0.05em" }}>{input.length} chars</span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PLACEHOLDERS[type]}
                spellCheck={false}
                style={{ width: "100%", height: "240px", background: t.taBg, border: `1px solid ${t.taBorder}`, borderRadius: "8px", padding: "14px", color: t.taTextColor, fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", lineHeight: "1.7", resize: "vertical" }}
              />
            </div>

            {/* Arrow */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "26px" }}>
              <button
                className="minify-btn"
                onClick={handleMinify}
                title={`Minify ${LABELS[type]}`}
                style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(99,102,241,0.7)", color: "#fff", border: "none", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >▶</button>
            </div>

            {/* Output */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", letterSpacing: "0.12em", color: t.paneLabelClr, fontWeight: 600 }}>OUTPUT</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <SavingsBadge original={input} minified={output} />
                  <span style={{ fontSize: "10px", color: t.charCountClr, letterSpacing: "0.05em" }}>{output.length} chars</span>
                </div>
              </div>
              <textarea
                value={output}
                readOnly
                placeholder="Minified output will appear here..."
                spellCheck={false}
                style={{ width: "100%", height: "240px", background: t.taBg, border: `1px solid ${t.taBorder}`, borderRadius: "8px", padding: "14px", color: output ? t.taOutputClr : t.charCountClr, fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", lineHeight: "1.7", resize: "vertical" }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginTop: "14px", padding: "10px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "6px", color: "#f87171", fontSize: "11px" }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
            <CopyButton text={output} t={t} />
            <button
              className="action-btn"
              onClick={handleClear}
              style={{ padding: "7px 16px", fontSize: "11px", letterSpacing: "0.06em", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, background: t.btnBg, color: t.btnColor, border: `1px solid ${t.btnBorderClr}`, borderRadius: "6px", cursor: "pointer" }}
            >
              Clear
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
