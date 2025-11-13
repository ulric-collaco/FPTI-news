"use client";

import { useEffect, useMemo, useState } from "react";

type ApiResponse = { text: string };

export default function HomePage() {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      if (!res.ok) {
        const msg = await safeError(res);
        throw new Error(msg || `Request failed with ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      setText(data.text || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load summaries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bullets = useMemo(() => parseBullets(text), [text]);

  return (
    <div>
      <header style={{ marginBottom: "2.5rem", textAlign: "center", borderBottom: "1px solid #222", paddingBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "2.5rem", margin: 0, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Indian Regulatory News
        </h1>
        <p style={{ color: "#888", marginTop: ".75rem", fontSize: "0.95rem" }}>
          Latest financial and tax regulation updates
        </p>
      </header>

      {loading && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <Spinner />
            <span>Fetching latest regulatory summaries…</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div style={{ ...cardStyle, border: "1px solid #444", background: "#111" }}>
          <div style={{ marginBottom: ".5rem" }}>Couldn't load summaries.</div>
          <code style={{ color: "#aaa" }}>{error}</code>
          <div style={{ marginTop: "0.75rem" }}>
            <button onClick={fetchNews} style={buttonStyle}>Retry</button>
          </div>
        </div>
      )}

      {!loading && !error && bullets.length > 0 && (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {bullets.map((b, i) => {
            const url = extractUrl(b);
            return (
              <a
                key={i}
                href={url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...bulletCardStyle,
                  cursor: url ? "pointer" : "default",
                  textDecoration: "none",
                  color: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (url) {
                    e.currentTarget.style.borderColor = "#fff";
                    e.currentTarget.style.background = "#111";
                  }
                }}
                onMouseLeave={(e) => {
                  if (url) {
                    e.currentTarget.style.borderColor = "#222";
                    e.currentTarget.style.background = "#000";
                  }
                }}
                onClick={(e) => {
                  if (!url) e.preventDefault();
                }}
              >
                <div
                  style={{ lineHeight: 1.5 }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(b) }}
                />
              </a>
            );
          })}
        </div>
      )}

      {!loading && !error && bullets.length === 0 && (
        <div style={cardStyle}>No summaries available right now.</div>
      )}

      <footer style={{ marginTop: "2.5rem", color: "#555", fontSize: ".85rem", textAlign: "center", paddingTop: "1.5rem", borderTop: "1px solid #222" }}>
        Powered by Gemini AI · Data may be imperfect
      </footer>
    </div>
  );
}

function parseBullets(text: string): string[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const bulletLines = lines.filter((l) => /^[-•\u2022\*]/.test(l));
  if (bulletLines.length > 0) {
    return bulletLines.map((l) => l.replace(/^[-•\u2022\*]\s*/, "").trim());
  }

  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  return paragraphs;
}

function parseMarkdown(text: string): string {
  // Escape HTML first to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Inline code: `code`
  html = html.replace(/`(.+?)`/g, '<code style="background:#1a2332;padding:2px 6px;border-radius:4px;font-size:0.9em">$1</code>');

  // Links: [text](url) - make them more prominent without the URL showing
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<strong style="color:#fff">$1</strong>');

  return html;
}

function extractUrl(text: string): string | null {
  const match = text.match(/\[.+?\]\((.+?)\)/);
  return match ? match[1] : null;
}

async function safeError(res: Response): Promise<string | null> {
  try {
    const data = await res.json();
    return (data as any)?.error || null;
  } catch {
    try {
      return await res.text();
    } catch {
      return null;
    }
  }
}

function Spinner() {
  const size = 16;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ animation: "spin 1s linear infinite" as any }}
    >
      <circle cx="12" cy="12" r="10" stroke="#222" strokeWidth="4" fill="none" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="#fff" strokeWidth="4" fill="none" />
    </svg>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #222",
  background: "#000",
  borderRadius: 8,
  padding: "1.25rem",
  boxShadow: "none",
};

const bulletCardStyle: React.CSSProperties = {
  border: "1px solid #222",
  background: "#000",
  borderRadius: 8,
  padding: "1.25rem 1.5rem",
  boxShadow: "none",
  transition: "all 0.2s ease",
  display: "block",
};

const buttonStyle: React.CSSProperties = {
  background: "#fff",
  color: "#000",
  border: 0,
  borderRadius: 6,
  padding: ".65rem 1rem",
  cursor: "pointer",
  fontWeight: 600,
};
