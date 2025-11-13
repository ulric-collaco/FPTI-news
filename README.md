# FPTI News – Indian Regulatory Intelligence Platform

Real-time Indian financial and tax regulatory news with AI-powered action items. Scrapes official government sources (RBI, SEBI, CBIC, Income Tax) and provides actionable compliance insights.

## Overview
- **Next.js 14** (App Router) with TypeScript
- **Real data scraping** from official Indian regulatory sources
- **AI-powered action items** using Hugging Face Mixtral model
- **Email delivery** of regulations with action items (Resend API)
- **Smart date filtering** (last 14 days only)
- **15-minute caching** for optimal performance

## Features

✨ **Real Data Sources**
- Scrapes RBI, SEBI, CBIC, Income Tax Department
- Only shows regulations from last 14 days
- Auto-sorted by newest first

🤖 **AI Action Items**
- Who's affected (businesses, individuals, sectors)
- Compliance deadlines
- Specific action steps
- Related regulations

📧 **Email Delivery**
- "Email Me This" button on each regulation
- Beautifully formatted HTML emails
- Includes full action item analysis

🎨 **User Experience**
- Dark theme UI
- Relative date badges ("2 days ago")
- Expandable action items
- Mobile responsive

## Setup

### Prerequisites
- Node.js 18+ and npm
- Hugging Face API key (free)
- Resend API key (free tier: 100 emails/day)
- Gemini API key (optional, for fallback only)

### Environment Variables

Create `.env.local` in the project root:

```env
# Required: Hugging Face API for action item analysis
HUGGINGFACE_API_KEY=hf_your_key_here

# Required: Resend API for email sending
RESEND_API_KEY=re_your_key_here

# Optional: Gemini API (only used as fallback if scraping fails)
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL_ID=gemini-pro
```

### Installation

```bash
npm install
npm run dev
```

Visit http://localhost:3000

### Getting API Keys

1. **Hugging Face** (Required)
   - Sign up: https://huggingface.co/join
   - Get key: https://huggingface.co/settings/tokens
   - Free unlimited inference

2. **Resend** (Required for email feature)
   - Sign up: https://resend.com/signup
   - Get key: https://resend.com/api-keys
   - Free: 100 emails/day, 3,000/month

3. **Gemini** (Optional - fallback only)
   - Sign up: https://makersuite.google.com/app/apikey
   - Only needed if scraping fails

## Deployment

### GitHub Setup

1. **Create Repository**
   ```bash
   git add .
   git commit -m "Initial commit: Indian Regulatory Intelligence Platform"
   git branch -M main
   git remote add origin https://github.com/ulric-collaco/FPTI-news.git
   git push -u origin main
   ```

2. **Important:** `.env.local` is gitignored (contains secrets)
   - Use `.env.example` as reference
   - Never commit actual API keys

### Vercel Deployment

1. **Import Project**
   - Go to https://vercel.com/new
   - Import from GitHub: `ulric-collaco/FPTI-news`

2. **Configure Environment Variables**
   
   Add these in Vercel Dashboard → Settings → Environment Variables:
   
   **Required:**
   ```
   HUGGINGFACE_API_KEY=hf_your_key
   RESEND_API_KEY=re_your_key
   ```
   
   **Optional (fallback):**
   ```
   GEMINI_API_KEY=your_key
   GEMINI_MODEL_ID=gemini-pro
   ```

3. **Deploy Settings**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `https://your-project.vercel.app`

### Post-Deployment

- **Custom Domain:** Add in Vercel → Settings → Domains
- **Email Domain:** Verify your domain in Resend for custom sender
- **Monitor:** Check Vercel → Analytics & Logs for errors

## Architecture

### Data Collection
```
Official Sources → Web Scrapers → Date Filter (14 days) → Sort → Cache (15 min)
```

**Sources Scraped:**
- RBI Notifications
- SEBI Circulars
- CBIC GST
- Income Tax Notifications

### AI Analysis
```
Regulation Data → Hugging Face Mixtral → Extract Action Items → Cache
```

**Analysis Includes:**
- Affected parties
- Compliance deadlines
- Action steps
- Related regulations

### Email Delivery
```
User Request → Format HTML Email → Resend API → User Inbox
```

## File Structure

```
├── app/
│   ├── page.tsx              # Main UI with news feed
│   ├── layout.tsx            # Root layout
│   └── api/
│       ├── news/route.ts     # Scraping + fallback AI
│       ├── analyze/route.ts  # Action item analysis
│       └── email/route.ts    # Email sending
├── lib/
│   ├── scraper.ts           # Web scraping utilities
│   ├── data-sources.ts      # Source configurations
│   ├── date-utils.ts        # Date parsing & filtering
│   └── huggingface.ts       # AI analysis
└── .env.local               # API keys
```

## How to Use

1. **View Latest News**: Opens with regulations from last 14 days
2. **See Recency**: Date badges show "2 days ago", "Yesterday", etc.
3. **Get Action Items**: Click "Show Action Items ✨"
4. **Email Yourself**: Click "📧 Email Me This" in action items
5. **Receive Email**: Get formatted email with full analysis

## Troubleshooting

**No news showing:**
- Check if scrapers are working (see terminal logs)
- Some sites may block requests occasionally
- Gemini fallback will activate if scraping fails

**Action items not loading:**
- Verify `HUGGINGFACE_API_KEY` is set
- Check Hugging Face API status
- Fallback logic provides smart defaults

**Email not sending:**
- Verify `RESEND_API_KEY` is correct
- Check you haven't hit rate limit (100/day free)
- Default sender: `onboarding@resend.dev`

**Rate limits:**
- Scraping: Cached for 15 minutes
- Action items: Cached per regulation
- Emails: Free tier = 100/day

## Future Enhancements

- [ ] Database for historical regulations
- [ ] User profiles for personalized filtering
- [ ] State-specific regulations (Maharashtra, etc.)
- [ ] Email subscriptions (daily/weekly digests)
- [ ] Advanced search and filters
- [ ] Mobile app/PWA