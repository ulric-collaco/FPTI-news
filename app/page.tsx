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
      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Indian Regulatory News</h1>
        <p style={{ color: "#9fb2c8", marginTop: ".25rem" }}>
          Latest financial and tax regulation updates – refreshed on load.
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
        <div style={{ ...cardStyle, border: "1px solid #b14a4a", background: "#261313" }}>
          <div style={{ marginBottom: ".5rem" }}>Couldn’t load summaries.</div>
          <code style={{ color: "#ffb4b4" }}>{error}</code>
          <div style={{ marginTop: "0.75rem" }}>
            <button onClick={fetchNews} style={buttonStyle}>Retry</button>
          </div>
        </div>
      )}

      {!loading && !error && bullets.length > 0 && (
        <div style={cardStyle}>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", display: "grid", gap: ".6rem" }}>
            {bullets.map((b, i) => (
              <li key={i} style={{ lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: parseMarkdown(b) }} />
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && bullets.length === 0 && (
        <div style={cardStyle}>No summaries available right now.</div>
      )}

      <footer style={{ marginTop: "1.5rem", color: "#93a8be", fontSize: ".9rem" }}>
        Powered by Gemini via Vercel serverless function. Content may be imperfect.
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

  // Links: [text](url)
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#6aa1ff;text-decoration:underline">$1</a>');

  return html;
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
      <circle cx="12" cy="12" r="10" stroke="#2b3a55" strokeWidth="4" fill="none" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="#6aa1ff" strokeWidth="4" fill="none" />
    </svg>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #1e2a44",
  background: "#0f152b",
  borderRadius: 10,
  padding: "1rem",
  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
};

const buttonStyle: React.CSSProperties = {
  background: "#2c67ff",
  color: "#fff",
  border: 0,
  borderRadius: 8,
  padding: ".6rem .9rem",
  cursor: "pointer",
};
