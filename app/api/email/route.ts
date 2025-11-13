import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface EmailRequest {
  email: string;
  regulation: {
    title: string;
    url: string;
    source: string;
    date?: string;
  };
  actionItems?: {
    affected: string[];
    deadlines: string[];
    actions: string[];
    relatedRegulations: string[];
    summary: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: EmailRequest = await request.json();
    
    if (!body.email || !body.regulation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[Email API] RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    // Generate email HTML
    const html = generateEmailHTML(body.regulation, body.actionItems);

    // Determine verified sender (prefer env, fallback to Resend onboarding)
    const from = process.env.RESEND_FROM || "FPTI News <onboarding@resend.dev>";

    // Send email
    const { data, error } = await resend.emails.send({
      from,
      to: body.email,
      subject: `📋 Regulation Update: ${body.regulation.title}`,
      html: html,
    });

    if (error) {
      console.error("[Email API] Resend error:", JSON.stringify(error, null, 2));
      const message = (error as any)?.message || (typeof error === 'string' ? error : "Failed to send email");
      return NextResponse.json({ error: message }, { status: 500 });
    }

    console.log(`[Email API] Email sent successfully to ${body.email}`);

    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
      emailId: data?.id,
    });
  } catch (error: any) {
    console.error("[Email API] Error:", error?.stack || error);
    return NextResponse.json({ error: error?.message || "Failed to send email" }, { status: 500 });
  }
}

function generateEmailHTML(
  regulation: EmailRequest["regulation"],
  actionItems?: EmailRequest["actionItems"]
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
      color: #1a1a1a;
    }
    .meta {
      color: #666;
      font-size: 14px;
    }
    .meta span {
      margin-right: 15px;
    }
    .section {
      margin: 25px 0;
      padding: 20px;
      background: #f9f9f9;
      border-left: 4px solid #4CAF50;
      border-radius: 4px;
    }
    .section h2 {
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #1a1a1a;
    }
    .section ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .section li {
      margin: 8px 0;
    }
    .summary {
      background: #e8f5e9;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
      font-style: italic;
    }
    .deadlines {
      background: #fff3cd;
      border-left-color: #ffc107;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #4CAF50;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 ${regulation.title}</h1>
      <div class="meta">
        <span>📌 <strong>${regulation.source}</strong></span>
        ${regulation.date ? `<span>📅 ${regulation.date}</span>` : ""}
      </div>
    </div>

    ${actionItems?.summary ? `
      <div class="summary">
        <strong>📊 Impact Summary:</strong> ${actionItems.summary}
      </div>
    ` : ""}

    ${actionItems?.affected && actionItems.affected.length > 0 ? `
      <div class="section">
        <h2>👥 Who's Affected</h2>
        <ul>
          ${actionItems.affected.map(item => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    ` : ""}

    ${actionItems?.deadlines && actionItems.deadlines.length > 0 ? `
      <div class="section deadlines">
        <h2>⏰ Deadlines & Important Dates</h2>
        <ul>
          ${actionItems.deadlines.map(item => `<li><strong>${item}</strong></li>`).join("")}
        </ul>
      </div>
    ` : ""}

    ${actionItems?.actions && actionItems.actions.length > 0 ? `
      <div class="section">
        <h2>✅ Action Steps Required</h2>
        <ul>
          ${actionItems.actions.map(item => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    ` : ""}

    ${actionItems?.relatedRegulations && actionItems.relatedRegulations.length > 0 ? `
      <div class="section">
        <h2>📚 Related Regulations</h2>
        <ul>
          ${actionItems.relatedRegulations.map(item => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    ` : ""}

    <a href="${regulation.url}" class="button" target="_blank">
      Read Full Official Notification →
    </a>

    <div class="footer">
      <p>This email was sent from <strong>FPTI News</strong></p>
      <p>Indian Financial & Tax Regulatory Updates Platform</p>
      <p style="margin-top: 10px;">
        <a href="http://localhost:3000" style="color: #4CAF50;">Visit FPTI News</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
