# Deploying to Vercel

1. Create a free MongoDB Atlas cluster (cloud.mongodb.com) -> Database Access: add a user -> Network Access: allow 0.0.0.0/0
   -> Connect -> Drivers -> copy the connection string (mongodb+srv://USER:PASS@cluster.../).
   (Or in Vercel: Storage / Marketplace -> MongoDB Atlas, which adds MONGODB_URI for you.)
2. Vercel -> your project -> Settings -> Environment Variables (apply to Production), add:
   MONGODB_URI      the connection string from step 1
   JWT_SECRET       a long random string:  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ADMIN_EMAIL      your admin login email
   ADMIN_PASSWORD   a strong password (used once, to create the admin account)
   SITE_URL         https://YOUR-PROJECT.vercel.app   (used for blog SEO / sitemap)
   Optional: OWNER_EMAIL, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM, OWNER_PHONE
3. Push this code to GitHub (Vercel redeploys) or Deployments -> ... -> Redeploy. Env vars only apply to NEW deployments.
4. Open the site, press Sign in, log in with ADMIN_EMAIL / ADMIN_PASSWORD.
Files are limited to 4MB each on Vercel (the admin page shrinks photos automatically).
