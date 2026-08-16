# Production Deployment Guide - Domain Expansion Task Platform

This guide outlines how to deploy the Domain Expansion Task & Project Management Platform to production over HTTPS.

---

## 1. Cloud Deployment Options

### Option A: Vercel + Neon / Supabase / AWS RDS PostgreSQL (Recommended)
1. **Database Setup**:
   - Provision a PostgreSQL 15+ database on [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), or [AWS RDS](https://aws.amazon.com/rds/).
   - Copy the connection string: `postgresql://user:password@host/database?sslmode=require`.
2. **Deploy on Vercel**:
   - Import this repository to [Vercel](https://vercel.com).
   - Set the following Environment Variables in the Vercel Project Settings:
     - `DATABASE_URL`: Your PostgreSQL connection string.
     - `AUTH_SECRET`: A 32-character random secret key.
     - `JWT_SECRET`: A 32-character random secret key.
     - `NEXT_PUBLIC_APP_URL`: `https://tasks.domainexpansion.in`
     - `RESEND_API_KEY`: Your live key from [Resend](https://resend.com).
     - `EMAIL_FROM`: `Domain Expansion <notifications@domainexpansion.in>`
     - `GEMINI_API_KEY`: Your Google AI Studio key.
     - `ANTHROPIC_API_KEY`: Your Anthropic Claude key.
     - `OPENROUTER_API_KEY`: Your OpenRouter key.
3. **Run Prisma Migrations**:
   - In your deployment build command: `npx prisma db push --schema=prisma/schema.postgresql.prisma && npm run build`.

---

### Option B: 1-Command Docker Compose on VPS (DigitalOcean / AWS EC2 / Hetzner)
1. Clone this repository to your Linux server:
   ```bash
   git clone <repo-url> /var/www/domain-expansion-tasks
   cd /var/www/domain-expansion-tasks
   ```
2. Copy and customize the production environment file:
   ```bash
   cp .env.example .env
   nano .env
   ```
3. Start the application stack (PostgreSQL + Next.js):
   ```bash
   docker-compose up -d --build
   ```
4. Run database seed & migrations inside container:
   ```bash
   docker-compose exec app npx prisma db push
   docker-compose exec app node prisma/seed.js
   ```
5. Configure reverse proxy (Caddy or Nginx) for automated HTTPS on `tasks.domainexpansion.in`.

---

## 2. Setting Up Live Integrations

### Resend Email Verification:
1. Verify your sending domain `domainexpansion.in` at [resend.com/domains](https://resend.com/domains).
2. Add the DNS records (DKIM, SPF, MX).
3. Set `EMAIL_FROM="Domain Expansion <notifications@domainexpansion.in>"`.

### AI Provider Keys:
- Configure keys directly in the portal under **Settings &rarr; AI Providers** or set them in server environment variables.
