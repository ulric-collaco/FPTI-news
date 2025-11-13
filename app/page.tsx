"use client";

import { useEffect, useMemo, useState } from "react";

type NewsItem = {
  title: string;
  url: string;
  date?: string;
  parsedDate?: string;
  source: string;
  category: string;
};

type ActionItems = {
  affected: string[];
  deadlines: string[];
  actions: string[];
  relatedRegulations: string[];
  summary: string;
};

type ApiResponse = { 
  text: string;
  items?: NewsItem[];
};

export default function HomePage() {
  const [text, setText] = useState<string>("");
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [actionItems, setActionItems] = useState<Map<string, ActionItems>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [emailModalItem, setEmailModalItem] = useState<NewsItem | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [emailMessage, setEmailMessage] = useState<string>("");

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
      
      // If we have structured items, fetch action items for each
      if (data.items && data.items.length > 0) {
        setNewsItems(data.items);
        fetchActionItemsForNews(data.items);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load summaries.");
    } finally {
      setLoading(false);
    }
  };

  const fetchActionItemsForNews = async (items: NewsItem[]) => {
    const newActionItems = new Map<string, ActionItems>();
    
    // Fetch action items for each news item
    for (const item of items) {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            source: item.source,
            date: item.date,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          newActionItems.set(item.url, data.actionItems);
        }
      } catch (err) {
        console.error(`Failed to fetch action items for ${item.title}`, err);
      }
    }
    
    setActionItems(newActionItems);
  };

  const handleEmailMe = async () => {
    if (!emailModalItem || !userEmail) return;

    setEmailSending(true);
    setEmailMessage("");

    try {
      const actions = actionItems.get(emailModalItem.url);
      
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          regulation: {
            title: emailModalItem.title,
            url: emailModalItem.url,
            source: emailModalItem.source,
            date: emailModalItem.date,
          },
          actionItems: actions,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setEmailMessage("✅ Email sent successfully! Check your inbox.");
        setTimeout(() => {
          setEmailModalItem(null);
          setUserEmail("");
          setEmailMessage("");
        }, 2000);
      } else {
        setEmailMessage(`❌ ${data.error || "Failed to send email"}`);
      }
    } catch (err: any) {
      setEmailMessage(`❌ ${err.message || "Failed to send email"}`);
    } finally {
      setEmailSending(false);
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
          Latest financial and tax regulation updates • Last 14 days
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
            const newsItem = newsItems.find(item => item.url === url);
            const actions = url ? actionItems.get(url) : null;
            
            return (
              <div key={i} style={bulletCardStyle}>
                {/* Date badge */}
                {newsItem?.parsedDate && (
                  <div style={{ 
                    fontSize: "0.75rem", 
                    color: "#888", 
                    marginBottom: "0.5rem",
                    display: "inline-block",
                    background: "#111",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #222"
                  }}>
                    📅 {getRelativeTime(new Date(newsItem.parsedDate))}
                  </div>
                )}
                
                <a
                  href={url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                  }}
                >
                  <div
                    style={{ lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(b) }}
                  />
                </a>

                {/* Always show Email Me button */}
                <div style={{ borderTop: "1px solid #222", paddingTop: "1rem" }}>
                  <button
                    onClick={() => setEmailModalItem(newsItem || null)}
                    style={{
                      ...buttonStyle,
                      fontSize: "0.85rem",
                      padding: ".5rem .75rem",
                      background: "#007bff",
                    }}
                  >
                    📧 Email Me This
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && bullets.length === 0 && (
        <div style={cardStyle}>No summaries available right now.</div>
      )}

      {/* Email Modal */}
      {emailModalItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setEmailModalItem(null);
            setUserEmail("");
            setEmailMessage("");
          }}
        >
          <div
            style={{
              background: "#000",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "2rem",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem" }}>
              📧 Email This Regulation
            </h3>
            <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Enter your email to receive this regulation with action items
            </p>

            <input
              type="email"
              placeholder="your@email.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                border: "1px solid #333",
                borderRadius: "4px",
                background: "#111",
                color: "#fff",
                marginBottom: "1rem",
              }}
              disabled={emailSending}
            />

            {emailMessage && (
              <div
                style={{
                  padding: "0.75rem",
                  marginBottom: "1rem",
                  borderRadius: "4px",
                  background: emailMessage.includes("✅") ? "#1a4d1a" : "#4d1a1a",
                  color: "#fff",
                  fontSize: "0.9rem",
                }}
              >
                {emailMessage}
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                onClick={handleEmailMe}
                disabled={!userEmail || emailSending}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  opacity: !userEmail || emailSending ? 0.5 : 1,
                  cursor: !userEmail || emailSending ? "not-allowed" : "pointer",
                }}
              >
                {emailSending ? "Sending..." : "Send Email"}
              </button>
              <button
                onClick={() => {
                  setEmailModalItem(null);
                  setUserEmail("");
                  setEmailMessage("");
                }}
                style={{
                  ...buttonStyle,
                  flex: 1,
                  background: "#333",
                  color: "#fff",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ marginTop: "2.5rem", color: "#555", fontSize: ".85rem", textAlign: "center", paddingTop: "1.5rem", borderTop: "1px solid #222" }}>
        Powered by AI · Data may be imperfect
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

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return `${Math.floor(diffDays / 7)} week ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  
  return `Over a month ago`;
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
