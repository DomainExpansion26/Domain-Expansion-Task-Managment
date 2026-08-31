# TechGuild - UI/UX Design Phase 5 Tasks
## Step-by-Step Work Breakdown for Monetization & Polish

**Document Version:** 1.0
**Date:** 2026-10-15
**File:** ui-ux-design-phase-5.md
**Role:** UI/UX Designer
**Phase:** 5 (Monetization & Polish) - 8 Weeks
**Prerequisite:** Phase 4 complete

**TechGuild is a Product/SaaS Platform parented by Domain Expansion Company.**

---

## Overview

Phase 5 UI/UX adds the monetization layer and polishes the entire platform for production launch. Design work covers: subscription plans page, billing dashboard, plan upgrade/downgrade flow, tax document center, premium feature indicators, security settings (2FA, sessions, password), and production polish (all screens reviewed, micro-interactions, dark/light mode QA).

**Design System:** Liquid Glass (dark mode primary, #0A0A0A background, Tech Blue #3399FF accent, glassmorphic panels with backdrop-blur 20-30%, light mode for public-facing pages)

**Mobile-First:** All screens designed at 375px width first, then scaled to 768px tablet and 1280px+ desktop. Optimized for 4G connections from Bangalore, Mumbai, Delhi.

**India-First:** Razorpay and UPI are primary payment methods. All prices in rupees. GST is the primary tax framework. Indian number formatting (Rs 1,00,000 not Rs 100,000).

---

## Week 1: Subscription Plans Page and Pricing

### Task P5-UI-1.1: Subscription Plans Page

**Screens to design:**
1. Plans landing page (marketing-style, for non-subscribers)
2. Plan comparison table (desktop)
3. Plan comparison cards (mobile, stacked)
4. Plan detail modal (feature breakdown per plan)
5. Free trial CTA and flow
6. FAQ section
7. Social proof section (testimonials, usage stats)

**Plans landing page design:**
- Header: "Choose Your Plan" with subtitle "Scale your work with TechGuild"
- Three plan cards: Free, Pro, Team
- Pro card highlighted as "Most Popular" with Tech Blue border
- Toggle: Monthly / Yearly (yearly shows "Save 17%" badge)
- All prices in rupees with Indian formatting
- Below cards: feature comparison table (desktop) or accordion (mobile)

**Plan card design (Pro example):**
- Glassmorphic card, 16px border-radius
- Plan name: "Pro" in large text (24px)
- Price: "Rs 999" with "/month" in smaller text
- Yearly price: "Rs 9,999/year" with "Save Rs 2,000" badge
- Tagline: "For serious freelancers and small parties"
- Feature list: 6-8 key features with checkmark icons
  - Unlimited active quests
  - Premium analytics (2-year history)
  - Custom report builder
  - API access
  - Priority withdrawal
  - Tax document generation (GST, TDS)
  - Email support (24-hour SLA)
  - Scheduled analytics reports
- CTA button: "Start 14-Day Free Trial" (Tech Blue, full width)
- Below CTA: "No credit card required for trial" (small text)

**Plan comparison table (desktop):**
- Columns: Feature, Free, Pro, Team
- Rows grouped by category: Quests, Analytics, Payments, Tax, Support
- Checkmarks (green) and X marks (gray) for each plan
- "Custom" for features with variable limits (e.g., team members)
- Sticky header row on scroll

**Plan comparison cards (mobile):**
- Stacked cards, one per plan
- Each card: plan name, price, top 5 features, CTA
- "Compare all features" link opens accordion with full comparison
- Horizontal swipe between plan cards

**Free trial flow:**
1. User clicks "Start 14-Day Free Trial" on Pro plan
2. Modal: "Start Your Pro Trial" with summary of what is included
3. "No credit card required" reassurance
4. Button: "Start Trial" (creates trial subscription)
5. Success: "Welcome to Pro! Your 14-day trial has started."
6. Banner: appears in app showing trial days remaining

**FAQ section:**
- Accordion with 8-10 common questions
- Questions: "Can I cancel anytime?", "What happens after my trial?", "Do you offer refunds?", "Can I switch plans?", "Is my payment secure?", "Do you support UPI?", "What tax documents do I get?", "Can I get an invoice for my company?"
- Answers: concise, with links to detailed docs

**Social proof section:**
- Stats: "10,000+ members", "Rs 50 crore+ in quests completed", "4.8/5 average rating"
- Testimonials: 3 member quotes with avatar, name, city, rank
- Logos: companies that use TechGuild (if available)

**Motion specs:**
- Plan card hover (desktop): subtle lift, border glow on highlighted plan, 200ms
- Monthly/yearly toggle: smooth slide transition, prices animate, 300ms
- Free trial modal: fade-in + scale from 0.95 to 1.0, 200ms
- Success state: checkmark draw animation, 500ms
- FAQ accordion: height transition, 300ms, chevron rotates 90 degrees
- Trial banner: slide-down from top, 300ms

**Mobile behavior (375px):**
- Plan cards: stacked vertically, full width
- Price: large, centered in card
- CTA: full width, 48px height
- Comparison: accordion, not table
- FAQ: accordion
- Social proof: horizontal scroll for testimonials

**Accessibility:**
- Plan cards: semantic article markup, heading hierarchy correct
- Comparison table: proper table semantics with headers, scope attributes
- Toggle: aria-pressed, aria-label="Switch between monthly and yearly billing"
- FAQ: proper heading levels, aria-expanded on accordion
- Prices: screen reader reads "Nine hundred ninety-nine rupees per month"
- Focus order: logical top-to-bottom, left-to-right

**Acceptance Criteria:**
- [ ] All 7 screens designed (mobile + desktop)
- [ ] Prices in rupees with Indian formatting
- [ ] Pro plan highlighted as most popular
- [ ] Monthly/yearly toggle works
- [ ] Free trial flow takes under 3 taps
- [ ] FAQ answers common questions
- [ ] Social proof builds trust
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Plans page Figma frames, plan card component, comparison table component

---

### Task P5-UI-1.2: Plan Detail and Feature Breakdown

**Screens to design:**
1. Plan detail modal (expanded feature list)
2. Feature category breakdown (Quests, Analytics, Payments, Tax, Support)
3. Plan limit visualization (what you get vs. what premium offers)
4. Custom plan inquiry (for large teams)

**Plan detail modal:**
- Full feature list for selected plan
- Organized by category with subheadings
- Each feature: icon, name, description, value/limit
- "Compare with other plans" link
- CTA: "Choose [Plan Name]"

**Feature category breakdown:**
- **Quests:** max active quests, quest posting, quest acceptance
- **Analytics:** history days, custom reports, API access, forecasting, benchmarking
- **Payments:** withdrawal priority, payment methods, refund processing
- **Tax:** GST invoices, TDS certificates, 1099-K, EU VAT
- **Support:** SLA hours, channels (email, chat, phone), dedicated account manager

**Plan limit visualization:**
- For free plan members: show current usage vs. limit
- Example: "You have 3 of 5 active quests used this month"
- Visual: progress bar showing usage
- CTA: "Upgrade to Pro for unlimited quests"
- Shown on dashboard when member approaches limit

**Custom plan inquiry:**
- For teams larger than 10 members
- Form: team size, expected usage, contact information
- "Contact Sales" CTA
- Redirects to contact form or scheduling link

**Motion specs:**
- Modal: fade-in + scale 0.95 to 1.0, 200ms
- Feature list: staggered fade-in, 50ms per item
- Progress bar: animated fill, 500ms

**Mobile behavior (375px):**
- Modal: full screen, not centered
- Feature list: single column
- Progress bar: full width

**Accessibility:**
- Modal: focus trap, Escape to close, aria-modal="true"
- Progress bar: aria-valuenow, aria-valuemin, aria-valuemax
- Form: proper labels, keyboard navigable

**Acceptance Criteria:**
- [ ] All 4 screens designed (mobile + desktop)
- [ ] Feature breakdown clear by category
- [ ] Limit visualization motivates upgrade
- [ ] Custom plan inquiry works
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Plan detail modal, feature breakdown component, limit visualization

---

## Week 2: Billing Dashboard and Payment Methods

### Task P5-UI-2.1: Billing Dashboard

**Screens to design:**
1. Billing dashboard overview
2. Current plan card (plan, status, next billing date)
3. Usage summary (current period usage)
4. Invoice history (list)
5. Invoice detail (line items, tax breakdown)
6. Invoice download
7. Payment method list
8. Add payment method flow
9. Billing address management
10. Billing email management

**Billing dashboard overview:**
- Header: "Billing & Subscription"
- Current plan card: prominent, shows plan name, status, next billing date, amount
- Usage summary: key metrics for current billing period (quests, analytics, API calls)
- Quick actions: Change Plan, Update Payment Method, Download Invoices
- Invoice history: table of recent invoices with download links
- Payment methods: list of saved payment methods

**Current plan card:**
- Glassmorphic card, prominent
- Plan name: large text with plan badge
- Status: "Active" (green), "Trial" (amber), "Past Due" (red), "Canceled" (gray)
- Next billing date: "Next charge: Rs 999 on Nov 15, 2026"
- Billing cycle: "Monthly" or "Yearly"
- Action buttons: "Change Plan", "Cancel Subscription"
- If trial: "Trial ends in X days. Add payment method to continue."

**Usage summary:**
- For current billing period
- Metrics: active quests used (X / unlimited), analytics reports generated, API calls (X / limit)
- Visual: progress bars for limited resources
- "Unlimited" shown for unlimited resources
- Reset date: "Resets on Nov 15, 2026"

**Invoice history (table):**
- Columns: Invoice Number, Date, Amount, Status, Download
- Status: Paid (green), Pending (amber), Failed (red), Refunded (gray)
- Each row: clickable to view detail
- Download: PDF icon, click to download
- Pagination: 10 invoices per page
- Filter: by date range, by status

**Invoice detail:**
- Invoice header: invoice number, date, status badge
- From: TechGuild details (name, address, GSTIN)
- To: Member details (name, address, GSTIN if provided)
- Line items: description, quantity, unit price, amount
- Tax breakdown: CGST, SGST, or IGST with rates and amounts
- Total: taxable amount + tax = total
- Payment details: payment method, transaction ID, paid date
- Download button: PDF download
- "Need help?" link to support

**Invoice PDF design:**
- A4 size, portrait
- TechGuild logo at top
- Invoice number and date
- From and To addresses
- Line items table
- Tax breakdown
- Total amount
- Payment status
- Footer: company details, GSTIN, CIN
- Professional, clean layout
- GST-compliant formatting

**Payment method list:**
- List of saved payment methods
- Each: type icon (UPI, card, netbanking), last4 or UPI ID, default badge, delete button
- "Add Payment Method" button
- Default payment method used for recurring charges

**Add payment method flow:**
1. Click "Add Payment Method"
2. Select type: UPI, Card, Net Banking (for Razorpay); Card, Apple Pay, Google Pay (for Stripe)
3. For UPI: enter UPI ID, verify, save
4. For Card: redirect to Razorpay/Stripe hosted page (PCI compliance)
5. For Net Banking: select bank, redirect to bank page
6. On success: payment method added, redirect back to billing dashboard
7. Option to set as default

**Billing address management:**
- Form: name, company (optional), address line 1, address line 2, city, state, pincode, country
- GSTIN field (optional, for India): shows below address if country is India
- VAT number field (optional, for EU): shows below address if country is EU
- "Save" button
- Used for invoice generation

**Billing email management:**
- Default: member's account email
- Option to add additional billing email (for finance team)
- All invoices sent to all billing emails
- "Add Billing Email" and "Remove" buttons

**Motion specs:**
- Current plan card: status badge color transition, 300ms
- Usage progress bars: animated fill, 500ms on load
- Invoice table row hover (desktop): subtle highlight, 150ms
- Payment method add: redirect to gateway, loading spinner, 200ms
- Download: spinner, then browser download triggers

**Mobile behavior (375px):**
- Billing dashboard: single column, stacked sections
- Current plan card: full width
- Invoice history: card list (not table)
- Invoice detail: full screen
- Payment methods: card list
- Add payment method: full screen flow

**Accessibility:**
- Invoice table: proper table semantics with headers
- Status badges: not color-only (icon + text + color)
- Forms: proper labels, error messages, keyboard navigable
- Download buttons: aria-label="Download invoice [number] as PDF"
- Payment method flow: focus management on redirect

**Acceptance Criteria:**
- [ ] All 10 screens designed (mobile + desktop)
- [ ] Current plan status clear at a glance
- [ ] Invoice history with download works
- [ ] Invoice detail shows tax breakdown
- [ ] Payment method add flow works (Razorpay and Stripe)
- [ ] Billing address form with GSTIN/VAT fields
- [ ] Billing email management
- [ ] All amounts in rupees with Indian formatting
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Billing dashboard Figma frames, invoice component, payment method component

---

### Task P5-UI-2.2: Payment Failure and Dunning UI

**Screens to design:**
1. Payment failure banner (in-app)
2. Payment failure email template
3. Update payment method prompt
4. Dunning email sequence (4 emails)
5. Subscription canceled screen
6. Payment recovered notification

**Payment failure banner:**
- Appears at top of app when subscription is past_due
- Amber background, warning icon
- Text: "Your last payment failed. Update your payment method to avoid losing access."
- CTA: "Update Payment Method" (links to billing dashboard)
- Dismissible for 24 hours (reappears after)
- Cannot be permanently dismissed until payment is resolved

**Update payment method prompt:**
- Modal triggered by banner CTA or billing dashboard
- Shows: failed payment amount, due date, retry schedule
- "Update Payment Method" button: redirects to payment method add flow
- "Retry Now" button: retries charge with existing payment method
- "Switch Plans" link: option to downgrade instead

**Dunning email sequence:**
1. **Day 0 - Payment Failed:**
   - Subject: "Action needed: Your TechGuild payment failed"
   - Body: payment amount, failure reason (generic), update link, retry schedule
   - CTA: "Update Payment Method"
2. **Day 1 - First Retry Failed:**
   - Subject: "Payment retry failed - please update your payment method"
   - Body: retry failed, next retry in 2 days, update link
   - CTA: "Update Payment Method"
3. **Day 5 - Final Notice:**
   - Subject: "Final notice: Update payment method to keep your Pro access"
   - Body: final retry in 2 days, will be downgraded to Free if failed
   - CTA: "Update Payment Method Now"
4. **Day 7 - Subscription Cancelled:**
   - Subject: "Your TechGuild Pro subscription has been cancelled"
   - Body: subscription cancelled, downgraded to Free, how to resubscribe
   - CTA: "Resubscribe to Pro"

**Payment recovered notification:**
- Triggered when dunning retry succeeds
- In-app notification: "Payment recovered! Your Pro subscription is active."
- Email: "Payment successful - your Pro subscription is active"
- Banner removed from app

**Subscription canceled screen:**
- Shown when member navigates to billing after cancellation
- "Your Pro subscription has been cancelled"
- "You have been downgraded to the Free plan"
- Summary of what changed (features lost)
- "Resubscribe" CTA
- "View Free Plan Features" link

**Motion specs:**
- Banner: slide-down from top, 300ms
- Modal: fade-in + scale 0.95 to 1.0, 200ms
- Notification: slide-in from right (desktop) or top (mobile), 300ms

**Mobile behavior (375px):**
- Banner: full width, dismissible with X
- Modal: full screen bottom sheet
- Emails: responsive, single column

**Accessibility:**
- Banner: aria-live="assertive" for important payment notice
- Modal: focus trap, Escape to close
- Emails: alt text on images, semantic markup, text-based summary
- Dismiss button: aria-label="Dismiss payment reminder for 24 hours"

**Acceptance Criteria:**
- [ ] All 6 screens designed (mobile + desktop)
- [ ] Payment failure banner prominent but not alarming
- [ ] Dunning email sequence clear and actionable
- [ ] Update payment method flow works
- [ ] Payment recovered notification positive
- [ ] Cancellation screen clear about what changed
- [ ] Email templates render in Gmail, Outlook, Apple Mail
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Dunning UI Figma frames, email templates (HTML), notification components

---

## Week 3: Premium Feature Indicators and Paywall Designs

### Task P5-UI-3.1: Premium Feature Indicators

**Screens to design:**
1. Premium feature lock icon (on locked features)
2. Premium feature tooltip (on hover/tap)
3. Premium badge (on features available in current plan)
4. Upgrade prompt inline (contextual)
5. Feature access banner (trial, grace period)
6. API access indicator (for premium API features)

**Premium feature lock icon:**
- Shown on features not available in member's current plan
- Lock icon (Lucide lock-closed) in Tech Blue
- Next to feature name or on feature button
- Tap/click: shows upgrade prompt
- Disabled state: feature is not interactive when locked

**Premium feature tooltip:**
- On hover (desktop) or tap (mobile) of lock icon
- Content: "Available on [Plan Name] plan"
- Feature description: what this feature does
- CTA: "Upgrade to [Plan Name]" (links to plans page)
- Glassmorphic tooltip, arrow pointing to lock icon

**Premium badge:**
- Shown on features that are available in current plan
- Small "PRO" or "TEAM" badge next to feature name
- Tech Blue background, white text
- Shows member what they are paying for (value perception)

**Upgrade prompt inline:**
- Contextual prompt when member tries to use a locked feature
- Example: member on Free plan tries to access 1-year analytics history
- Prompt: "1-year analytics history is available on Pro plan"
- CTA: "Upgrade to Pro" (links to plans page)
- "Maybe later" dismiss option
- Not blocking (member can navigate away)

**Feature access banner:**
- **Trial banner:** "You are on Pro trial. X days remaining. [Add Payment Method]"
- **Grace period banner:** "Your Pro subscription expired. You have X days of grace period left. [Renew Now]"
- **Expiring soon banner:** "Your Pro subscription renews on [date]. [Manage Subscription]"
- Banner: amber for trial and grace, blue for renewal reminder
- Dismissible for 24 hours (except grace period final 3 days)

**API access indicator:**
- For premium API features
- Shows API key management (for Pro and Team)
- Rate limit display: "X / Y requests used this hour"
- "Generate API Key" and "Revoke API Key" buttons
- Documentation link

**Motion specs:**
- Lock icon: subtle scale on hover, 150ms
- Tooltip: fade-in 200ms, fade-out 150ms
- Badge: static, no animation
- Upgrade prompt: slide-in from bottom (mobile) or fade-in (desktop), 200ms
- Banner: slide-down from top, 300ms

**Mobile behavior (375px):**
- Lock icon: tappable, shows bottom sheet instead of tooltip
- Tooltip: bottom sheet on mobile
- Upgrade prompt: bottom sheet
- Banner: full width, dismissible

**Accessibility:**
- Lock icon: aria-label="Locked feature: [feature name], available on [plan] plan"
- Tooltip: aria-describedby linking to tooltip content
- Badge: aria-label="[Plan name] feature"
- Banner: aria-live="polite"
- Upgrade prompt: focus management, Escape to dismiss

**Acceptance Criteria:**
- [ ] All 6 screens designed (mobile + desktop)
- [ ] Lock icons clear and not frustrating
- [ ] Tooltips explain what feature does and how to get it
- [ ] Upgrade prompts contextual and non-blocking
- [ ] Banners informative and dismissible
- [ ] API access management clear
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Premium indicator components, tooltip component, banner components, API access UI

---

### Task P5-UI-3.2: Paywall Modal

**Screens to design:**
1. Paywall modal (when member tries to access premium feature)
2. Paywall with plan comparison
3. Paywall with trial offer
4. Paywall with discount offer
5. Successful upgrade flow

**Paywall modal:**
- Triggered when member on Free plan tries to use a premium feature
- Modal: glassmorphic, centered (desktop), bottom sheet (mobile)
- Header: "Unlock [Feature Name]"
- Description: what the feature does and why it is valuable
- Plan options: Pro and Team cards with relevant features highlighted
- CTA: "Start 14-Day Free Trial" or "Upgrade Now"
- "Maybe later" dismiss option (not prominent)

**Paywall with plan comparison:**
- Shows Pro and Team side by side
- Highlights the feature that triggered the paywall
- Shows price and key benefits
- "Choose Pro" and "Choose Team" buttons

**Paywall with trial offer:**
- For members who have not used their trial yet
- "Start your 14-day free trial of Pro"
- "No credit card required"
- "Start Trial" button
- Lists what is included in trial

**Paywall with discount offer:**
- For members who have canceled or let subscription lapse
- "Welcome back! Get 20% off your first 3 months"
- "Claim Discount" button
- Shows discounted price

**Successful upgrade flow:**
1. Member selects plan and completes payment
2. Success screen: "Welcome to Pro!" with checkmark animation
3. Summary of what is now unlocked
4. "Continue to [Feature]" button (returns to where they were)
5. Confetti animation (optional, skippable for reduced motion)

**Motion specs:**
- Modal: fade-in + scale 0.95 to 1.0, 200ms
- Plan cards: staggered fade-in, 100ms delay
- Success checkmark: draw animation, 500ms
- Confetti: CSS animation, 3s, respects prefers-reduced-motion
- Button loading: spinner, 200ms

**Mobile behavior (375px):**
- Paywall: bottom sheet, 90% screen height
- Plan comparison: stacked cards, swipeable
- Success: full screen

**Accessibility:**
- Modal: focus trap, Escape to close, aria-modal="true"
- Plan cards: semantic markup, heading hierarchy
- Success: aria-live="assertive" for announcement
- Confetti: respects prefers-reduced-motion, text announcement alternative

**Acceptance Criteria:**
- [ ] All 5 screens designed (mobile + desktop)
- [ ] Paywall explains value clearly
- [ ] Trial offer prominent for eligible members
- [ ] Discount offer for returning members
- [ ] Success flow returns to original feature
- [ ] Reduced motion respected
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Paywall modal Figma frames, success animation, plan comparison component

---

## Week 4: Plan Upgrade/Downgrade Flow

### Task P5-UI-4.1: Plan Upgrade Flow

**Screens to design:**
1. Upgrade initiation (from billing dashboard or paywall)
2. Plan selection (choose new plan)
3. Billing cycle selection (monthly or yearly)
4. Proration preview (what you will be charged today)
5. Payment confirmation
6. Upgrade success
7. Upgrade from trial to paid

**Upgrade initiation:**
- From billing dashboard: "Change Plan" button
- From paywall: plan selection
- Shows current plan and available options
- "Upgrade" and "Downgrade" tabs or unified flow

**Plan selection:**
- Shows all plans with current plan highlighted
- Member selects new plan
- "Continue" button
- If upgrading: immediate change with proration
- If downgrading: change at period end

**Billing cycle selection:**
- Monthly vs. yearly toggle
- Shows price difference
- "Save 17%" badge for yearly
- Member can change from current cycle

**Proration preview:**
- Critical screen for trust
- Shows:
  - Current plan: name, remaining days, unused credit
  - New plan: name, cost for remaining period
  - Net charge today: new cost minus unused credit
  - Next billing date: when next full charge occurs
- Example: "You are upgrading from Free to Pro. Unused credit: Rs 0. New charge for remaining 15 days: Rs 500. Total due today: Rs 500. Next billing: Rs 999 on Nov 15, 2026."
- "Confirm Upgrade" button
- "Cancel" button

**Payment confirmation:**
- If payment method on file: show method, "Confirm" button
- If no payment method: redirect to add payment method, then return
- For UPI: show UPI ID, may require UPI PIN entry on app
- For card: redirect to Razorpay/Stripe hosted page

**Upgrade success:**
- "Upgrade Complete!" with checkmark
- Summary: new plan, next billing date, amount charged
- "New features unlocked" list
- "Continue" button (returns to dashboard or previous feature)

**Upgrade from trial to paid:**
- When trial is ending or member chooses to upgrade during trial
- "Your trial ends in X days. Add a payment method to continue on Pro."
- No charge today (trial continues)
- First charge on trial end date
- Clear messaging: "You will not be charged today. Your first payment of Rs 999 will be on [trial end date]."

**Motion specs:**
- Step transitions: slide left/right, 300ms
- Proration preview: number count-up animation, 500ms
- Payment: loading spinner, 200ms
- Success: checkmark draw, 500ms, optional confetti

**Mobile behavior (375px):**
- Full screen flow, step by step
- Proration: stacked cards, clear layout
- Payment: redirect to gateway, return to app

**Accessibility:**
- Multi-step flow: proper step indicator, aria-current="step"
- Proration: screen reader reads full breakdown
- Buttons: clear labels, "Confirm Upgrade" not just "Confirm"
- Success: aria-live="assertive"

**Acceptance Criteria:**
- [ ] All 7 screens designed (mobile + desktop)
- [ ] Proration preview clear and transparent
- [ ] Upgrade from trial has clear messaging about no immediate charge
- [ ] Payment flow works with Razorpay and Stripe
- [ ] Success returns to previous location
- [ ] All amounts in rupees
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Upgrade flow Figma frames, proration preview component, step indicator

---

### Task P5-UI-4.2: Plan Downgrade and Cancellation Flow

**Screens to design:**
1. Downgrade initiation
2. Downgrade confirmation (applies at period end)
3. Downgrade scheduled confirmation
4. Cancellation flow (multi-step)
5. Cancellation reason survey
6. Cancellation confirmation
7. Reactivation flow (for canceled subscriptions)

**Downgrade initiation:**
- From billing dashboard: "Change Plan" -> select lower plan
- Shows: "You are downgrading from Pro to Free"
- Clear messaging: "Your Pro access will continue until [current period end]. After that, you will be on the Free plan."

**Downgrade confirmation:**
- "Confirm Downgrade" screen
- Shows: current plan, new plan, effective date (period end)
- "What you will lose" list: features that will be locked
- "Confirm Downgrade" button
- "Keep Pro" button (cancel action)

**Downgrade scheduled confirmation:**
- "Downgrade Scheduled"
- "Your plan will change to Free on [date]"
- "You will keep Pro access until then"
- Option to "Cancel Downgrade" (revert to Pro)
- Calendar reminder suggestion

**Cancellation flow (multi-step):**
1. **Step 1: Cancellation Warning**
   - "Are you sure you want to cancel?"
   - List of features member will lose
   - "Keep Subscription" (primary) and "Continue Cancellation" (secondary)
2. **Step 2: Reason Survey**
   - "Why are you cancelling?" (optional but encouraged)
   - Radio options: Too expensive, Not using enough, Found alternative, Missing features, Technical issues, Other
   - Text field for additional feedback
   - "Submit and Continue" button
3. **Step 3: Offer (if applicable)**
   - Based on reason: offer discount (20% off 3 months), offer downgrade, offer extension
   - "Accept Offer" or "Continue Cancellation"
4. **Step 4: Final Confirmation**
   - "Confirm Cancellation"
   - Clear statement: "You will lose Pro access on [date]"
   - "Confirm Cancellation" button

**Cancellation reason survey:**
- Non-blocking (member can skip)
- Multiple choice with optional text field
- Used to improve product and retention
- Results aggregated for product team

**Cancellation confirmation:**
- "Subscription Canceled"
- "Your Pro access will end on [date]"
- "You will be downgraded to Free plan"
- Summary of what changes
- "Reactivate Anytime" button
- "Return to Dashboard" button

**Reactivation flow:**
- For canceled subscriptions (before or after period end)
- "Reactivate Pro" button on billing dashboard
- "Welcome back! Your Pro subscription has been reactivated."
- If before period end: no charge, original subscription continues
- If after period end: new subscription, charge immediately

**Motion specs:**
- Step transitions: slide left/right, 300ms
- Warning: subtle shake on "Continue Cancellation" to confirm intent, 200ms
- Confirmation: checkmark or info icon, 300ms
- Reactivation: positive animation, checkmark draw, 500ms

**Mobile behavior (375px):**
- Full screen flow, step by step
- Reason survey: radio buttons, text field
- Confirmation: full screen

**Accessibility:**
- Multi-step flow: step indicator, aria-current
- Warning: clear, not manipulative
- Survey: proper radio button semantics, keyboard navigable
- Confirmation: aria-live="assertive"
- "Keep Subscription" should be more prominent than "Continue Cancellation" (anti-dark-pattern)

**Anti-dark-pattern principles:**
- Cancellation must be as easy as subscription
- No hiding the cancel button
- No guilt-tripping language
- "Keep Subscription" is primary, "Continue Cancellation" is secondary (but not blocked)
- No more than 4 steps to cancel
- No phone calls required to cancel
- Reactivation is easy and prominent

**Acceptance Criteria:**
- [ ] All 7 screens designed (mobile + desktop)
- [ ] Downgrade applies at period end (clear messaging)
- [ ] Cancellation flow is max 4 steps
- [ ] Reason survey is optional
- [ ] Reactivation is easy
- [ ] Anti-dark-pattern principles followed
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Downgrade/cancellation Figma frames, reason survey component, reactivation flow

---

## Week 5: Tax Document Center

### Task P5-UI-5.1: Tax Document Center

**Screens to design:**
1. Tax document center overview
2. Document type filter (GST, TDS, 1099-K, VAT)
3. Document list (table)
4. Document detail view
5. Document download flow
6. Tax settings (GSTIN, VAT number, tax residency)
7. TDS summary dashboard
8. Empty state (no documents yet)

**Tax document center overview:**
- Header: "Tax Documents"
- Summary cards: total documents, total tax deducted, current financial year
- Filter bar: by document type, by year, by quarter
- Document list: table with download links
- "Download All" button (for accountants)
- Tax settings link

**Summary cards:**
- Total documents: count of all tax documents
- Total tax deducted: sum of all TDS deducted (in rupees)
- Current FY summary: GST paid, TDS deducted for current financial year
- Last updated: when documents were last generated

**Document type filter:**
- Tabs or dropdown: All, GST Invoices, TDS Certificates (Form 16A), 1099-K, VAT Invoices
- Each tab shows count of documents
- Active tab: Tech Blue underline

**Document list (table):**
- Columns: Document Number, Type, Period, Amount, Tax Amount, Download
- Type: icon + text (GST, TDS, 1099-K, VAT)
- Period: date range or quarter
- Amount: in rupees
- Tax Amount: in rupees (TDS or GST or VAT)
- Download: PDF icon, click to download
- Sortable by date, amount, type
- Pagination: 20 documents per page

**Document detail view:**
- Full document preview (embedded PDF or HTML)
- Document metadata: number, type, period, amount, tax amount
- Download button
- "Email to Accountant" button (sends PDF to specified email)
- Print button

**Document download flow:**
1. Click download icon on document
2. Loading spinner: "Preparing document..."
3. Browser download triggers
4. Success toast: "Document downloaded"
5. If download fails: error toast with retry button

**Tax settings:**
- **Tax Residency:** country selector (determines which tax documents are generated)
- **GSTIN (India):** text input with validation (15-character format), "Verify" button
- **VAT Number (EU):** text input with VIES validation, "Validate" button
- **PAN (India):** text input (for TDS purposes), "Verify" button
- **SSN/TIN (US):** text input (for 1099-K purposes), encrypted storage
- **Billing Address:** linked to billing address in billing dashboard
- All tax settings encrypted at rest

**TDS summary dashboard:**
- For Indian parties who have TDS deducted
- Current FY summary: gross earnings, TDS deducted, net earnings
- Quarterly breakdown: Q1, Q2, Q3, Q4 with amounts
- Form 16A download links per quarter
- Historical: previous FYs with download links
- Visual: bar chart showing TDS deducted per quarter

**Empty state:**
- Illustration: document with magnifying glass
- Text: "No tax documents yet"
- Subtext: "Your tax documents will appear here after your first subscription payment or quest earning."
- CTA: "View Plans" or "Find Quests" (depending on member type)

**Motion specs:**
- Summary cards: number count-up animation, 500ms
- Document list: row fade-in, staggered 30ms
- Filter transition: fade-out old, fade-in new, 200ms
- Download: spinner, then success checkmark, 300ms
- PDF preview: loading skeleton, then render, 300ms

**Mobile behavior (375px):**
- Tax center: single column
- Summary cards: 2-column grid
- Document list: card list (not table)
- Document detail: full screen
- TDS summary: simplified charts

**Accessibility:**
- Document table: proper table semantics with headers
- Download: aria-label="Download [document type] [number] as PDF"
- Tax settings: proper form labels, validation messages
- TDS chart: data table alternative
- Empty state: clear and helpful

**Acceptance Criteria:**
- [ ] All 8 screens designed (mobile + desktop)
- [ ] All tax document types supported (GST, TDS, 1099-K, VAT)
- [ ] Document list with filtering and sorting
- [ ] Document download works
- [ ] Tax settings with validation (GSTIN, VAT, PAN)
- [ ] TDS summary for Indian parties
- [ ] Empty state helpful
- [ ] All amounts in rupees with Indian formatting
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Tax center Figma frames, document table component, TDS summary dashboard

---

### Task P5-UI-5.2: Invoice and Form 16A PDF Templates

**Screens to design:**
1. GST invoice PDF template
2. Form 16A PDF template
3. 1099-K PDF template
4. EU VAT invoice PDF template
5. Subscription invoice PDF template (generic)

**GST invoice PDF template:**
- Size: A4 portrait
- Header: TechGuild logo, "Tax Invoice"
- Invoice details: number, date, place of supply
- From: TechGuild name, address, GSTIN
- To: Member name, address, GSTIN (if provided)
- Line items table: description, quantity, rate, amount
- Tax breakdown: CGST (9%), SGST (9%) for intra-state, or IGST (18%) for inter-state
- Total: taxable amount + total tax = total amount
- Amount in words: "Rupees one thousand only"
- Payment details: method, transaction ID
- Footer: company details, CIN, declaration
- Professional, clean layout, GST-compliant

**Form 16A PDF template:**
- Size: A4 portrait
- Header: "FORM NO. 16A", government format
- Part A: TDS certifier details (TechGuild), deductee details (member)
- Part B: TDS details per quarter
  - Section code (194O)
  - Gross amount paid
  - TDS rate
  - TDS amount
  - Challan details
- Summary: total gross, total TDS for quarter
- Government-mandated format
- Digital signature (if required)

**1099-K PDF template:**
- Size: Letter (US) portrait
- Header: "Form 1099-K", IRS format
- Payer details: TechGuild, address, TIN
- Recipient details: member name, address, TIN
- Payment details: gross amount, card/not reported, merchant category
- Filer details
- IRS-mandated format

**EU VAT invoice PDF template:**
- Size: A4 portrait
- Header: TechGuild logo, "VAT Invoice"
- Invoice details: number, date
- From: TechGuild name, address, VAT number
- To: Member name, address, VAT number (if provided)
- Line items: description, quantity, rate, amount
- VAT breakdown: rate, amount
- "Reverse Charge" notation (if B2B with valid VAT)
- Total: net amount + VAT = total
- Footer: company details

**Subscription invoice PDF (generic):**
- For non-Indian, non-EU members
- Size: A4 portrait
- Header: TechGuild logo, "Invoice"
- Invoice details: number, date
- From and To addresses
- Line items
- Total
- Payment status
- Footer

**Motion specs:**
- N/A (PDFs are static documents)
- PDF preview in app: loading skeleton, then render

**Mobile behavior (375px):**
- PDFs: A4/Letter size, readable on mobile with zoom
- PDF preview: full screen, pinch to zoom
- Download: triggers browser download

**Accessibility:**
- PDFs: tagged PDF for screen reader accessibility
- Text-based (not image-based) so screen readers can read
- Logical reading order
- Alt text on logo

**Acceptance Criteria:**
- [ ] All 5 PDF templates designed
- [ ] GST invoice is GST-compliant (all required fields)
- [ ] Form 16A follows government format
- [ ] 1099-K follows IRS format
- [   EU VAT invoice is EU-compliant
- [ ] PDFs are accessible (tagged, text-based)
- [ ] PDFs render correctly in browsers and PDF readers
- [ ] Professional, clean design

**Deliverables:** PDF template designs (HTML/CSS for Puppeteer), sample PDFs for review

---

## Week 6: Security Settings

### Task P5-UI-6.1: Two-Factor Authentication (2FA)

**Screens to design:**
1. Security settings overview
2. 2FA setup flow (enable)
3. 2FA verification (on login)
4. 2FA backup codes
5. 2FA disable flow
6. 2FA recovery flow (lost device)

**Security settings overview:**
- Header: "Security"
- Sections: Two-Factor Authentication, Password, Active Sessions, Login History
- Each section: status indicator (enabled/disabled), "Manage" button
- Overall security score: "Your account security: 75%" with recommendations

**2FA setup flow:**
1. Click "Enable 2FA"
2. Choose method: Authenticator App (recommended), SMS (India: OTP via SMS)
3. **Authenticator App:**
   a. Show QR code
   b. Member scans with Google Authenticator, Authy, or similar
   c. Member enters 6-digit code from app
   d. 2FA enabled
4. **SMS:**
   a. Enter phone number (or use existing)
   b. Receive OTP via SMS
   c. Enter OTP
   d. 2FA enabled
5. Generate backup codes (10 codes)
6. "Save backup codes in a safe place" warning
7. 2FA is now enabled

**2FA verification (on login):**
1. After password entry, if 2FA is enabled
2. Prompt: "Enter your 6-digit code"
3. For authenticator: enter code from app
4. For SMS: code sent to phone, enter received code
5. "Remember this device for 30 days" checkbox (optional)
6. "Verify" button
7. If incorrect: "Invalid code. Try again." (3 attempts, then account lock for 15 minutes)

**2FA backup codes:**
- Generated when 2FA is enabled
- 10 single-use codes
- Displayed once with "Save these codes" warning
- Option to download as text file
- Option to regenerate (invalidates old codes)
- Option to view remaining codes (requires 2FA verification)

**2FA disable flow:**
1. Click "Disable 2FA"
2. Require 2FA verification (enter current code)
3. Warning: "Disabling 2FA reduces your account security"
4. "Confirm Disable" button
5. 2FA disabled, backup codes invalidated

**2FA recovery flow (lost device):**
1. On login 2FA prompt: "Lost your device? Use backup code"
2. Enter one of the 10 backup codes
3. If valid: login granted, backup code consumed
4. Prompt: "You have used a backup code. Consider regenerating backup codes or setting up 2FA on a new device."
5. If no backup codes: "Contact support for account recovery" (manual process)

**Motion specs:**
- QR code: fade-in 200ms
- Code input: auto-focus, auto-advance to next digit
- Success: checkmark, 300ms
- Warning: subtle shake, 200ms

**Mobile behavior (375px):**
- QR code: centered, large enough to scan from another device
- Code input: 6 separate boxes, numeric keyboard
- Backup codes: scrollable list, download button

**Accessibility:**
- QR code: alt text with link to manual code entry
- Code input: proper input labels, numeric inputmode
- Backup codes: list semantics, copy button with aria-label
- Warning: aria-live="polite"

**Acceptance Criteria:**
- [ ] All 6 screens designed (mobile + desktop)
- [ ] 2FA setup works with authenticator app and SMS
- [ ] Backup codes generated and usable
- [   2FA verification on login works
- [ ] Recovery flow with backup codes works
- [ ] Disable flow requires verification
- [   WCAG 2.1 AA compliance

**Deliverables:** 2FA Figma frames, QR code component, code input component, backup codes UI

---

### Task P5-UI-6.2: Active Sessions and Password Management

**Screens to design:**
1. Active sessions list
2. Session detail
3. Revoke session
4. Change password flow
5. Password strength indicator
6. Login history
7. Security notifications

**Active sessions list:**
- Header: "Active Sessions"
- List of all active sessions (logged-in devices)
- Each session: device type, browser, location (city), IP address, last active time
- Current session: highlighted with "This device" badge
- "Revoke" button per session (except current)
- "Revoke All Other Sessions" button

**Session detail:**
- Expanded view of a session
- Device: "Chrome on Windows"
- Location: "Bangalore, India"
- IP address: "xxx.xxx.xxx.xxx"
- First login: timestamp
- Last active: timestamp
- "Revoke Session" button

**Revoke session:**
1. Click "Revoke" on a session
2. Confirmation: "Revoke this session? The device will be logged out."
3. "Confirm" button
4. Session revoked, device logged out
5. Security notification: "A session was revoked"

**Change password flow:**
1. Click "Change Password"
2. Enter current password
3. Enter new password
4. Confirm new password
5. Password strength indicator (real-time)
6. "Change Password" button
7. Success: "Password changed. You will need to log in again on other devices."
8. All other sessions revoked automatically

**Password strength indicator:**
- Real-time feedback as member types
- Visual: progress bar with color (red -> amber -> green)
- Text: "Weak", "Fair", "Good", "Strong"
- Criteria checklist: length (8+), uppercase, lowercase, number, special character
- Does not block submission but warns on weak password

**Login history:**
- List of recent login attempts (last 30 days)
- Each: timestamp, device, location, IP, status (success, failed)
- Failed logins: highlighted in amber
- Filter: by status, by date
- "Report Suspicious Activity" link

**Security notifications:**
- In-app and email notifications for security events:
  - New login from new device
  - Password changed
  - 2FA enabled/disabled
  - Session revoked
  - Failed login attempts (after 3 failures)
- Notification center: list of security notifications
- "Mark as read" and "Delete" options

**Motion specs:**
- Session revoke: slide-out animation, 200ms
- Password strength: color transition, 200ms
- Success: checkmark, 300ms
- Notification: slide-in, 300ms

**Mobile behavior (375px):**
- Sessions: card list
- Password change: full screen form
- Login history: card list
- Notifications: standard notification card

**Accessibility:**
- Sessions: list semantics with proper labels
- Password: proper input type, aria-describedby for strength indicator
- Strength indicator: aria-live="polite" for updates
- Login history: table semantics with headers
- Notifications: aria-live="polite"

**Acceptance Criteria:**
- [ ] All 7 screens designed (mobile + desktop)
- [ ] Active sessions list with revoke functionality
- [ ] Password change with strength indicator
- [ ] Login history with suspicious activity flagging
- [ ] Security notifications for all events
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Security settings Figma frames, session management UI, password strength component

---

## Week 7: Production Polish - All Screens Reviewed

### Task P5-UI-7.1: Cross-Phase Screen Audit

**Description:** Review ALL screens from Phases 1-5 for consistency, polish, and production readiness.

**Audit scope:**
- Phase 1: Authentication, onboarding, basic dashboard
- Phase 2: Marketplace, quests, chat, escrow, complaints
- Phase 3: Calls, video meetings, AI task management, communication quality, withdrawal
- Phase 4: Guild Hall, reputation, analytics, public profiles
- Phase 5: Subscription, billing, tax, security

**Audit checklist per screen:**
- [ ] Mobile (375px) layout correct, no horizontal scroll
- [ ] Tablet (768px) layout correct
- [ ] Desktop (1280px+) layout correct
- [ ] All interactive elements have 44px touch targets
- [ ] All text meets color contrast (4.5:1 minimum)
- [ ] All images have alt text
- [ ] All forms have proper labels and validation
- [ ] All modals have focus trap and Escape to close
- [ ] Loading states designed (skeletons, not just spinners)
- [ ] Empty states designed with illustration and CTA
- [ ] Error states designed with clear message and retry
- [ ] Success states designed with confirmation
- [ ] Dark mode correct (if applicable)
- [ ] Typography hierarchy correct
- [ ] Spacing consistent (4, 8, 12, 16, 20, 24, 32, 40, 48px scale)
- [ ] Color palette correct (only defined colors)
- [ ] Components used correctly (no custom one-offs)
- [ ] Micro-interactions defined and consistent
- [ ] Motion specs documented
- [ ] Accessibility annotations present

**Deliverables per screen:**
- Updated Figma frame if issues found
- Issue log with screenshots and descriptions
- Priority: Critical (must fix before launch), High (fix before launch), Medium (fix in first update), Low (nice to have)

**Acceptance Criteria:**
- [ ] All screens from Phases 1-5 audited
- [ ] All Critical and High issues fixed
- [ ] Issue log documented
- [ ] No inconsistencies in design system usage

**Deliverables:** Screen audit report, updated Figma frames, issue log

---

### Task P5-UI-7.2: Micro-Interactions Polish

**Description:** Define and polish micro-interactions across all screens for a premium feel.

**Micro-interactions to polish:**
1. **Button press:** scale to 0.95, 100ms, spring back
2. **Card hover (desktop):** subtle lift (translateY -2px), shadow increase, 200ms
3. **Input focus:** border color transition to Tech Blue, 200ms
4. **Input error:** border color to red, shake animation, 200ms
5. **Toast notification:** slide-in from top (mobile) or bottom-right (desktop), 300ms, auto-dismiss 4s
6. **Dropdown open:** fade-in + scale 0.95 to 1.0, 150ms
7. **Modal open:** fade-in backdrop + scale 0.95 to 1.0, 200ms
8. **Modal close:** fade-out + scale 1.0 to 0.95, 150ms
9. **Tab switch:** underline slide, 200ms
10. **Accordion expand:** height transition, 300ms, chevron rotate
11. **Skeleton loading:** shimmer effect (left-to-right gradient sweep), 1.5s loop
12. **Pull to refresh (mobile):** spinner appears, rotation continuous
13. **Infinite scroll load:** skeleton cards fade-in at bottom
14. **Like button:** heart scale 1.0 -> 1.3 -> 1.0, color fill, 300ms
15. **Checkbox toggle:** checkmark draw animation, 200ms
16. **Radio button select:** dot scale-in, 150ms
17. **Toggle switch:** knob slide, 200ms, color transition
18. **Progress bar fill:** animated from 0 to value, 500ms, ease-out
19. **Number count-up:** animate from 0 to value, 1s, for summary cards
20. **Chart load:** line draws left to right, 800ms; bars grow from bottom, staggered

**Reduced motion preferences:**
- All animations respect prefers-reduced-motion
- When reduced motion is preferred: no animations, instant transitions, no particles
- Text alternatives for informational animations (e.g., "Loading..." text instead of spinner)

**Acceptance Criteria:**
- [ ] All 20 micro-interactions defined and documented
- [ ] Motion specs in Figma for each
- [ ] Reduced motion alternatives documented
- [ ] Consistent across all screens
- [ ] No janky or jarring animations

**Deliverables:** Micro-interaction documentation, Figma prototypes with motion, reduced motion specs

---

### Task P5-UI-7.3: Dark/Light Mode QA

**Description:** Ensure dark mode (app) and light mode (public pages) both work correctly.

**Dark mode (app dashboard, member-facing):**
- Background: #0A0A0A (primary), #1A1A1A (secondary), #2A2A2A (tertiary)
- Text: #FFFFFF (primary), #A0A0A0 (secondary), #707070 (muted)
- Accent: Tech Blue #3399FF
- Glassmorphic panels: rgba(255,255,255,0.05) background, rgba(255,255,255,0.1) border
- All screens from Phases 1-5 designed in dark mode

**Light mode (public-facing pages):**
- Used for: public profiles, login/signup pages, plans page (marketing)
- Background: #FFFFFF (primary), #F5F5F5 (secondary), #EEEEEE (tertiary)
- Text: #0A0A0A (primary), #505050 (secondary), #808080 (muted)
- Accent: Tech Blue #3399FF
- Cards: #FFFFFF background, #E0E0E0 border, subtle shadow
- Reason: light mode is more shareable, SEO-friendly, and accessible for public content

**QA checklist (dark mode):**
- [ ] All text readable on dark background (4.5:1 contrast minimum)
- [ ] Glassmorphic panels have appropriate opacity (not too transparent, not too opaque)
- [ ] Shadows visible on dark background (use lighter shadow colors)
- [ ] Icons visible (not gray-on-gray)
- [ ] Charts readable (use bright colors on dark background)
- [ ] No pure black (#000000) for backgrounds (use #0A0A0A for depth)
- [ ] No pure white (#FFFFFF) for large areas (use #F0F0F0 for contrast reduction)
- [ ] Borders visible (rgba(255,255,255,0.1) minimum)
- [ ] Hover states visible (lighter background on hover)
- [ ] Focus indicators visible (Tech Blue outline)

**QA checklist (light mode):**
- [ ] All text readable on light background (4.5:1 contrast minimum)
- [ ] Cards have subtle shadow for depth
- [ ] Icons visible (dark icons on light background)
- [ ] Charts readable (use darker colors on light background)
- [ ] No harsh white (use #FAFAFA for large areas)
- [ ] Borders visible (#E0E0E0 minimum)
- [ ] Hover states visible (slightly darker background)
- [ ] Focus indicators visible (Tech Blue outline)

**Theme toggle (if applicable):**
- App defaults to dark mode
- Member can toggle to light mode in settings
- Preference stored in member profile
- Public pages always light mode (not affected by member preference)

**Acceptance Criteria:**
- [ ] Dark mode QA complete for all app screens
- [ ] Light mode QA complete for all public pages
- [ ] All contrast ratios meet WCAG 2.1 AA
- [ ] No readability issues in either mode
- [ ] Theme toggle works (if implemented)

**Deliverables:** Dark/light mode QA report, fixed Figma frames, theme documentation

---

## Week 8: Final Polish and Handoff

### Task P5-UI-8.1: Final Design Review and Handoff

**Tasks:**
1. Final review of all Phase 5 Figma frames
2. Cross-reference with backend API documentation
3. Ensure all screens have developer annotations
4. Export all new assets (icons, illustrations, PDF templates)
5. Update design system documentation
6. Create interactive prototypes for key flows
7. Engineering design review
8. Design sign-off

**Key flows to prototype:**
1. **Subscription flow:** Plans page -> select plan -> trial/upgrade -> payment -> success
2. **Billing management:** Dashboard -> change plan -> upgrade/downgrade -> confirmation
3. **Tax document download:** Tax center -> select document -> download
4. **2FA setup:** Security settings -> enable 2FA -> QR code -> verify -> backup codes
5. **Cancellation flow:** Billing -> cancel -> reason survey -> confirmation

**Design system updates:**
- New components: PlanCard, BillingDashboard, InvoiceTable, TaxDocumentList, PaywallModal, TwoFactorSetup, SessionManager, PasswordStrengthIndicator
- New tokens: plan colors, tax status colors, payment status colors
- Updated components: Button (loading state), Card (billing variant), Badge (plan badge)

**Handoff documentation:**
- [ ] Design system documentation updated
- [ ] Component documentation (props, states, variants)
- [ ] Motion spec documentation updated
- [ ] Flow documentation for key journeys
- [ ] Asset export guide
- [ ] Accessibility notes per component
- [ ] Dark/light mode documentation
- [ ] PDF template specifications
- [ ] Email template specifications

**Engineering review checklist:**
- [ ] All screens have developer annotations
- [ ] All API endpoints referenced in design match backend documentation
- [ ] All error states have corresponding API error handling
- [ ] All loading states have corresponding API loading states
- [ ] All form validations match backend validation rules
- [ ] All payment flows match Razorpay/Stripe integration
- [ ] All tax document formats match legal requirements

**Acceptance Criteria:**
- [ ] All Figma frames polished and annotated
- [ ] All documentation complete
- [ ] All prototypes functional
- [ ] Engineering design review completed
- [ ] Design sign-off from product, engineering, and design leads
- [ ] No open design questions

**Deliverables:** Final Figma file, updated design system, handoff documentation, prototypes, design sign-off

---

### Task P5-UI-8.2: Responsive and Accessibility Final QA

**Responsive QA (375px, 768px, 1280px):**
- [ ] All Phase 5 screens tested at 375px (no horizontal scroll)
- [ ] All Phase 5 screens tested at 768px (tablet layout correct)
- [ ] All Phase 5 screens tested at 1280px+ (desktop layout correct)
- [ ] All touch targets 44px minimum
- [ ] All text readable at 375px
- [ ] All forms usable at 375px (keyboard appears above input)
- [ ] All modals/bottom sheets fit at 375px
- [ ] All charts render at 375px

**Accessibility QA (WCAG 2.1 AA):**
- [ ] All Phase 5 screens pass color contrast check
- [ ] All Phase 5 screens pass keyboard navigation test
- [ ] All Phase 5 screens pass screen reader test (NVDA or VoiceOver)
- [ ] All forms have proper labels and error messages
- [ ] All modals have focus trap
- [ ] All animations respect prefers-reduced-motion
- [ ] All charts have data table alternatives
- [ ] All status indicators use icon + text + color (not color alone)
- [ ] All PDFs are tagged and accessible

**Network testing:**
- [ ] All screens load in under 1.5 seconds on simulated 4G
- [ ] Skeleton loading states appear immediately
- [ ] No layout shift during load
- [ ] Images lazy load with blur-up placeholder
- [ ] Payment redirects work on 4G

**Acceptance Criteria:**
- [ ] All responsive QA items pass
- [ ] All accessibility QA items pass
- [ ] All network testing items pass
- [ ] No critical issues remaining

**Deliverables:** Responsive QA report, accessibility QA report, network testing report, fixed Figma frames

---

## Component Library Additions (Phase 5)

### New Components
1. **PlanCard** - subscription plan card with pricing and features
2. **PlanComparisonTable** - feature comparison across plans
3. **BillingDashboard** - billing overview with plan and usage
4. **InvoiceTable** - invoice history table
5. **InvoiceDetail** - invoice with tax breakdown
6. **PaymentMethodList** - saved payment methods
7. **PaymentMethodAdd** - add payment method flow
8. **PremiumLockIcon** - lock icon for premium features
9. **PremiumTooltip** - tooltip explaining premium feature
10. **PremiumBadge** - badge showing plan level
11. **PaywallModal** - modal when accessing locked feature
12. **UpgradeFlow** - multi-step upgrade flow
13. **DowngradeFlow** - downgrade and cancellation flow
14. **ProrationPreview** - proration calculation display
15. **DunningBanner** - payment failure banner
16. **TaxDocumentCenter** - tax document list and download
17. **TaxSettings** - GSTIN, VAT, PAN settings form
18. **TDSSummary** - TDS summary dashboard
19. **TwoFactorSetup** - 2FA QR code and verification
20. **BackupCodes** - 2FA backup codes display
21. **ActiveSessions** - session list and revoke
22. **PasswordStrength** - password strength indicator
23. **LoginHistory** - login attempts history
24. **SecurityScore** - account security score
25. **TrialBanner** - free trial countdown banner

### Updated Components
1. **Button** - add loading, success, and danger states
2. **Badge** - add plan badge, payment status, tax status variants
3. **Banner** - add dunning, trial, grace period variants
4. **Modal** - add paywall variant with plan comparison
5. **Form** - add password strength indicator integration

---

## Design Tokens Additions (Phase 5)

### Plan Colors
```
--plan-free: #6B7280 (gray)
--plan-pro: #3399FF (Tech Blue)
--plan-team: #8B5CF6 (purple)
```

### Payment Status Colors
```
--payment-paid: #10B981 (green)
--payment-pending: #F59E0B (amber)
--payment-failed: #EF4444 (red)
--payment-refunded: #6B7280 (gray)
```

### Tax Status Colors
```
--tax-gst: #3399FF (Tech Blue)
--tax-tds: #F59E0B (amber)
--tax-1099k: #8B5CF6 (purple)
--tax-vat: #10B981 (green)
```

### Security Colors
```
--security-strong: #10B981 (green)
--security-good: #3399FF (Tech Blue)
--security-fair: #F59E0B (amber)
--security-weak: #EF4444 (red)
```

---

## Definition of Done for Phase 5 UI/UX

- [ ] All screens designed at 375px (mobile) and 1280px (desktop)
- [ ] Subscription plans page with comparison and trial flow
- [ ] Billing dashboard with plan, usage, invoices, payment methods
- [ ] Plan upgrade flow with proration preview
- [   Plan downgrade and cancellation flow (max 4 steps, anti-dark-pattern)
- [ ] Dunning UI (banners, emails, update payment method)
- [ ] Premium feature indicators (lock icons, tooltips, badges)
- [ ] Paywall modal with plan comparison and trial offer
- [ ] Tax document center (GST, TDS, 1099-K, VAT)
- [   PDF templates for all tax document types
- [ ] Security settings: 2FA, sessions, password, login history
- [ ] All screens from Phases 1-5 audited for consistency
- [ ] 20 micro-interactions defined and documented
- [ ] Dark mode QA complete for all app screens
- [ ] Light mode QA complete for all public pages
- [ ] All amounts in rupees with Indian formatting
- [ ] All screens pass 375px responsive QA
- [ ] All screens pass WCAG 2.1 AA accessibility audit
- [ ] Reduced motion preference respected
- [ ] Design system documentation updated
- [ ] All components documented
- [ ] Engineering design review completed
- [   Prototypes functional for key flows
- [ ] Design sign-off from all stakeholders

---

*TechGuild is a Product/SaaS Platform parented by Domain Expansion Company.*
