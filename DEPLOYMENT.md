# Deployment Guide

## Pre-Deployment Checklist

✅ All files cleaned up and organized
✅ `.env.example` created (no secrets)
✅ `.env.local` in gitignore (contains secrets)
✅ `LICENSE` added (MIT)
✅ `README.md` updated with full documentation
✅ `vercel.json` configured
✅ All changes staged for commit

## Step 1: Commit and Push to GitHub

```bash
# Commit all changes
git commit -m "feat: Complete Indian Regulatory Intelligence Platform

- Real-time scraping from RBI, SEBI, CBIC, Income Tax
- AI-powered action items using Hugging Face Mixtral
- Email delivery with Resend API
- Smart date filtering (last 14 days)
- Beautiful dark UI with expandable action items
- 15-minute caching for performance"

# Push to GitHub
git push origin main

# If you get conflicts, resolve with:
git pull origin main --rebase
# Fix any conflicts, then:
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub account
4. Find and import `ulric-collaco/FPTI-news`
5. Configure:
   - Framework: **Next.js** (auto-detected)
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build` (auto-detected)
6. Add Environment Variables (copy from your `.env.local`):
   ```
   HUGGINGFACE_API_KEY=hf_your_key_here
   RESEND_API_KEY=re_your_key_here
   GEMINI_API_KEY=your_gemini_key_here
   GEMINI_MODEL_ID=gemini-pro
   ```
7. Click "Deploy"
8. Wait 2-3 minutes
9. Done! 🎉

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? N
# - Project name: fpti-news
# - Directory: ./ (default)

# Add environment variables
vercel env add HUGGINGFACE_API_KEY
vercel env add RESEND_API_KEY
vercel env add GEMINI_API_KEY
vercel env add GEMINI_MODEL_ID

# Deploy to production
vercel --prod
```

## Step 3: Verify Deployment

1. **Test Homepage**
   - Visit your Vercel URL
   - Check if regulations load (may take 5-10 seconds first time)
   - Verify date badges appear

2. **Test Action Items**
   - Click "Show Action Items ✨" on any regulation
   - Verify AI analysis loads
   - Check all sections appear (affected, deadlines, actions)

3. **Test Email**
   - Click "📧 Email Me This"
   - Enter your email
   - Send and check inbox (including spam folder)

4. **Check Logs**
   - Vercel Dashboard → Your Project → Logs
   - Look for scraping success messages
   - Verify no errors

## Step 4: Post-Deployment Setup (Optional)

### Custom Domain

1. Vercel Dashboard → Settings → Domains
2. Add your domain (e.g., `fpti-news.com`)
3. Follow DNS configuration instructions
4. Wait for verification (5-30 minutes)

### Custom Email Domain (Resend)

1. Resend Dashboard → Domains
2. Add your domain
3. Add DNS records (MX, TXT, DKIM)
4. Verify domain
5. Update `app/api/email/route.ts`:
   ```typescript
   from: "FPTI News <notifications@yourdomain.com>"
   ```
6. Commit and push changes
7. Vercel will auto-deploy

### Enable Analytics

1. Vercel Dashboard → Analytics
2. Enable Web Analytics
3. View traffic, performance metrics

### Set Up Monitoring

1. Vercel Dashboard → Settings → Notifications
2. Configure email alerts for:
   - Build failures
   - Runtime errors
   - Performance issues

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies in `package.json`
- Verify TypeScript has no errors: `npm run build` locally

### Environment Variables Not Working
- Check spelling (case-sensitive)
- Redeploy after adding variables
- For changes, go to Settings → Environment Variables → Edit

### Scraping Not Working
- Some sites may block Vercel IPs
- Gemini fallback should activate automatically
- Check Function logs for errors

### Email Not Sending
- Verify Resend API key is correct
- Check rate limits (100/day free tier)
- Test with a different email address
- Check spam folder

### Rate Limits Hit
- Scraped data cached for 15 minutes
- Action items cached per regulation
- Consider upgrading Resend for more emails

## Success Metrics

After deployment, monitor:
- ✅ Regulations loading within 5 seconds
- ✅ 80%+ scraping success rate
- ✅ Action items loading for all regulations
- ✅ Emails delivering within 30 seconds
- ✅ No console errors in browser
- ✅ Mobile responsive (test on phone)

## Next Steps

1. Share URL with team/users
2. Gather feedback on action items accuracy
3. Monitor usage patterns
4. Consider Phase 2 features (database, user profiles)
5. Set up custom domain for professional look

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Resend Docs: https://resend.com/docs
- GitHub Issues: Create an issue in the repo
