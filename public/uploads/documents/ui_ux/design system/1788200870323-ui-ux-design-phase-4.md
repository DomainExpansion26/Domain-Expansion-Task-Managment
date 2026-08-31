# TechGuild - UI/UX Design Phase 4 Tasks
## Step-by-Step Work Breakdown for Community & Insights

**Document Version:** 1.0
**Date:** 2026-08-20
**File:** ui-ux-design-phase-4.md
**Role:** UI/UX Designer
**Phase:** 4 (Community & Insights) - 8 Weeks
**Prerequisite:** Phase 3 complete

**TechGuild is a Product/SaaS Platform parented by Domain Expansion Company.**

---

## Overview

Phase 4 UI/UX transforms TechGuild from a work platform into a verified community. Design work covers: Guild Hall (social platform with AI-verified posts), AI feedback verification status UI, per-skill reputation display, rank-up progress dashboard, three analytics dashboards (party, client, platform), and public profile page.

**Design System:** Liquid Glass (dark mode primary, #0A0A0A background, Tech Blue #3399FF accent, glassmorphic panels with backdrop-blur 20-30%, light mode supported for public pages)

**Mobile-First:** All screens designed at 375px width first, then scaled to 768px tablet and 1280px+ desktop. Optimized for 4G connections from Bangalore, Mumbai, Delhi.

---

## Week 1: Guild Hall Post Creation and Feed Layout

### Task P4-UI-1.1: Guild Hall Post Creation Flow

**Screens to design:**
1. Post creation sheet (mobile: bottom sheet, desktop: modal)
2. Text input with formatting toolbar
3. Image upload with preview and reorder
4. Code snippet editor with language selector
5. Skill tag selector (searchable dropdown)
6. Visibility selector (public, followers, private)
7. Post preview before publish
8. AI verification status badge on published post
9. Post creation success state
10. Error states (network failure, content too long, invalid media)

**Design considerations:**
- Post creation accessed via floating action button (FAB) on mobile, bottom-right, 56px diameter, Tech Blue
- Bottom sheet slides up from bottom with spring animation (300ms, ease-out)
- Text input auto-expands as user types, max height 40% of viewport
- Formatting toolbar: bold, italic, code block, link, quote (glassmorphic, appears when text selected)
- Image upload: drag and drop on desktop, tap to select on mobile, max 4 images
- Image preview: 2x2 grid on mobile, horizontal scroll on desktop
- Code snippet: monospace font (JetBrains Mono), syntax highlighting, language dropdown (top 20 languages)
- Skill tags: pill-shaped, Tech Blue background, max 5 tags, searchable from skill database
- Visibility selector: three radio options with icons (globe for public, people for followers, lock for private)
- AI verification badge: small checkmark icon next to author name on published post, shown when author has verified work history in tagged skills (this is a credential display, not a quality rating)
- Post preview: shows exactly how post will appear in feed
- Success state: post appears in feed with subtle fade-in animation (200ms)
- Error states: clear error message with retry button, no jarring red, use amber for warnings

**Motion specs:**
- Bottom sheet slide-up: 300ms, cubic-bezier(0.16, 1, 0.3, 1)
- Image upload progress: circular spinner, 24px, Tech Blue
- Tag add animation: scale from 0.8 to 1.0 with fade-in, 150ms
- Publish button: loading state with spinner, success state with checkmark, 200ms transitions
- Error shake: horizontal shake, 200ms, only on validation errors

**Mobile behavior (375px):**
- Bottom sheet takes 90% of screen height
- Keyboard appears above text input (not covering it)
- Image upload uses native camera/gallery picker
- Code snippet editor is scrollable with syntax highlighting
- Tags wrap to multiple lines if needed

**Accessibility:**
- All form fields have associated labels (sr-only for visual minimalism)
- Error messages announced via aria-live="polite"
- Keyboard navigation: Tab through fields, Enter to publish, Escape to cancel
- Color contrast: minimum 4.5:1 for text, 3:1 for large text and UI components
- Touch targets: minimum 44px for all interactive elements
- Screen reader: announce AI verification badge as "verified author in [skill]"

**Acceptance Criteria:**
- [ ] All 10 screens designed (mobile 375px + desktop 1280px)
- [ ] Post creation works in under 3 taps from feed
- [ ] All input types validated with clear error states
- [ ] AI verification badge displayed correctly on published posts
- [ ] Motion specs documented in Figma
- [ ] WCAG 2.1 AA compliance verified
- [ ] 44px touch targets on all interactive elements

**Deliverables:** Post creation Figma frames, motion spec documentation, component library updates

---

### Task P4-UI-1.2: Guild Hall Feed Layout

**Screens to design:**
1. Feed main view (infinite scroll)
2. Post card (compact view in feed)
3. Post detail view (expanded)
4. Feed empty state (no posts yet)
5. Feed loading state (skeleton cards)
6. Feed error state (network failure)
7. Feed filter bar (all, following, by skill)
8. Feed search bar
9. Trending topics sidebar (desktop only)

**Post card design (in feed):**
- Author row: avatar (40px), name, handle, AI verification badge (if applicable), timestamp, post visibility icon
- Content: text (max 4 lines in feed, tap to expand), image grid (1 image full width, 2 images side by side, 3+ in grid), code snippet (first 5 lines with "show more")
- Skill tags: pill-shaped, below content, horizontally scrollable on mobile
- Interaction bar: like (heart icon), comment (speech bubble), repost (arrows), save (bookmark), share
- Engagement counts: shown next to each interaction icon
- Glassmorphic card: background rgba(255,255,255,0.05), border 1px rgba(255,255,255,0.1), border-radius 16px

**Feed layout:**
- Mobile (375px): single column, 16px padding, cards stacked with 12px gap
- Tablet (768px): single column centered, max-width 600px
- Desktop (1280px+): two columns, feed (max-width 600px) centered, trending topics sidebar (280px) on right
- FAB for post creation: bottom-right, 56px, 16px from edges

**Filter bar:**
- Mobile: horizontal scrollable tabs at top (All, Following, My Skills, Trending)
- Desktop: vertical sidebar on left (240px)
- Active tab: Tech Blue underline (mobile) or Tech Blue background (desktop)
- Filter transition: fade-out old posts (150ms), fade-in new posts (150ms)

**Infinite scroll:**
- Load 20 posts per page
- Show loading skeleton cards (3 cards) at bottom while loading
- When no more posts: show "You are all caught up" message
- Pull-to-refresh on mobile (native gesture)

**Motion specs:**
- New posts fade-in: 200ms, translateY from 10px to 0
- Like animation: heart scales from 1.0 to 1.3 to 1.0, color fill, 300ms
- Skeleton shimmer: left-to-right gradient sweep, 1.5s loop
- Pull-to-refresh: spinner appears, rotation continuous, release at 60px drag

**Mobile behavior (375px):**
- Cards take full width minus 32px padding
- Images: 1 image full width, 2 images side by side, 3+ images 2x2 grid with "+N" overlay
- Interaction bar: icons only (no labels) to save space, 48px touch targets
- Timestamp: relative ("2h", "1d"), tap for absolute time tooltip

**Accessibility:**
- Feed is a landmark region with aria-label="Guild Hall feed"
- Each post card is an article with aria-label containing author name and first line
- Like button: aria-pressed="true/false", aria-label="Like post by [author]"
- Infinite scroll: announce "Loading more posts" via aria-live="polite"
- Images: alt text required on upload, auto-generated if not provided
- Code snippets: wrapped in <pre><code> with language attribute for screen readers

**Acceptance Criteria:**
- [ ] All 9 screens designed (mobile + desktop)
- [ ] Feed loads in under 1.5 seconds on 4G (design uses skeleton loading)
- [ ] Post cards are scannable and not overwhelming
- [ ] Filter bar accessible and intuitive
- [ ] Infinite scroll works with pull-to-refresh on mobile
- [ ] WCAG 2.1 AA compliance
- [ ] Trending topics sidebar only on desktop (hidden on mobile)

**Deliverables:** Feed Figma frames, post card component, skeleton loading components

---

### Task P4-UI-1.3: Empty States and Onboarding

**Screens to design:**
1. Guild Hall first-visit empty state (no posts, no follows)
2. Feed with no posts from followed members
3. Feed with no posts in selected skill filter
4. Search with no results
5. Guild Hall onboarding tooltip sequence (3 tooltips)

**Empty state design:**
- Illustration: custom glassmorphic illustration (not stock), 120px, centered
- Headline: clear and friendly ("Your feed is quiet. Let us fix that.")
- Subtext: actionable guidance ("Follow members in your skills to see their posts here.")
- CTA button: primary action ("Discover members" or "Create your first post")
- Background: subtle gradient, not flat

**Onboarding tooltips:**
1. First tooltip: points to FAB, "Share your work with the community"
2. Second tooltip: points to filter bar, "Filter by skills you care about"
3. Third tooltip: points to search, "Find members and topics"
- Tooltips: glassmorphic, Tech Blue border, dismissible, "Got it" button
- Sequence: show on first Guild Hall visit, never again

**Motion specs:**
- Empty state illustration: gentle float animation (translateY 4px, 3s loop, ease-in-out)
- CTA button: standard hover/press states
- Onboarding tooltip: fade-in 200ms, pulse on target element (box-shadow animation)

**Acceptance Criteria:**
- [ ] All 5 screens designed
- [ ] Empty states are encouraging, not dead ends
- [ ] Onboarding tooltips appear only once per member
- [ ] Illustrations are custom and on-brand
- [ ] Mobile and desktop variants designed

**Deliverables:** Empty state Figma frames, onboarding tooltip components, custom illustrations

---

## Week 2: Social Graph UI, Threaded Comments, Moderation Tools

### Task P4-UI-2.1: Social Graph UI

**Screens to design:**
1. Member profile card (compact, in feed and search)
2. Member profile page (full, in Guild Hall context)
3. Follow button states (not following, following, requested, blocked)
4. Following list (members I follow)
5. Followers list (members following me)
6. Endorsement flow (endorse a member for a skill)
7. Endorsement received notification
8. Mention notification
9. Blocked members list

**Member profile page (Guild Hall context):**
- Header: avatar (80px), display name, handle, city, AI verification badge
- Bio: max 280 characters
- Skill ranks: horizontal scroll of skill rank chips (skill name + rank, e.g., "Next.js - B")
- Stats: posts count, followers count, following count
- Action buttons: Follow/Following, Message (if connected), Endorse
- Tabs: Posts, Replies, Endorsements, Media
- Posts tab: grid of member's posts (same card design as feed)

**Follow button states:**
- Not following: Tech Blue solid button, "Follow"
- Following: glassmorphic outline button, "Following", hover shows "Unfollow" in red
- Requested (for private accounts): disabled button, "Requested"
- Blocked: hidden follow button, "Blocked" label

**Endorsement flow:**
1. Tap "Endorse" on member profile
2. Bottom sheet appears with skill selector
3. Select skill (searchable, only skills the member has declared)
4. Optional: add a note (max 200 characters)
5. Tap "Endorse" to confirm
6. Success toast: "Endorsed [member] for [skill]"
7. Member receives notification

**Notification design:**
- Notification card: avatar, action text ("endorsed you for Next.js"), timestamp
- Tap notification: navigate to endorsement detail
- Unread indicator: Tech Blue dot, 8px, top-right of notification
- Notification list: grouped by day (Today, Yesterday, This Week, Earlier)

**Motion specs:**
- Follow button: color transition 200ms, scale on press 0.95
- Endorsement bottom sheet: slide-up 300ms, same as post creation
- Notification slide-in: translateX from 100% to 0, 300ms
- Skill rank chips: staggered fade-in on profile load, 50ms delay per chip

**Mobile behavior (375px):**
- Profile header: avatar and info stacked vertically, action buttons full width
- Skill ranks: horizontal scroll, snap to each chip
- Tabs: horizontal scrollable, sticky at top on scroll
- Posts grid: 1 column on mobile (not 2 or 3)
- Endorsement bottom sheet: 80% screen height

**Accessibility:**
- Follow button: aria-pressed, aria-label="Follow [member name]"
- Notifications: aria-live="polite" for new notifications
- Skill rank chips: aria-label="[skill name], rank [rank]"
- Blocked members: screen reader announces "blocked" status
- Tab navigation: arrow keys to switch tabs, Enter to select

**Acceptance Criteria:**
- [ ] All 9 screens designed (mobile + desktop)
- [ ] Follow button states clear and distinct
- [ ] Endorsement flow takes under 5 taps
- [ ] Notifications clear and actionable
- [ ] Skill ranks visible at a glance
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Social graph Figma frames, follow button component, notification components

---

### Task P4-UI-2.2: Threaded Comments

**Screens to design:**
1. Comment input (inline, below post)
2. Comment card (single comment)
3. Reply thread (nested comments, up to 5 levels)
4. Comment actions (like, reply, report)
5. Comment moderation indicator (hidden by moderator)
6. Load more replies button
7. Comment editing (within 15 minutes)
8. Comment deletion confirmation

**Comment card design:**
- Author row: avatar (32px), name, handle, timestamp
- Content: text, max width 100% of container
- Actions: like (with count), reply, report (in overflow menu)
- Reply indentation: each level indented by 24px on desktop, 16px on mobile
- Max depth: 5 levels, deeper replies flatten to level 5
- Collapsed threads: tap to collapse, show "[N] replies" text

**Comment input:**
- Inline text input below post, auto-focuses on tap
- Expands as user types, max height 200px
- Submit button: appears when text is entered, Tech Blue
- Cancel button: discards comment with confirmation if text exists
- Mention support: type @ to trigger member mention dropdown
- Character count: shown when approaching 280 character limit

**Threaded layout:**
```
[Comment 1]
  [Reply to 1]
    [Reply to reply]
      [Reply]
        [Reply]
          [Reply] (flattened at depth 5)
[Comment 2]
```

**Mobile behavior (375px):**
- Comments take full width minus indentation
- Indentation: 16px per level (less than desktop to save space)
- Reply: tap reply icon, input appears below target comment
- Collapse/expand: tap chevron icon or anywhere on comment header
- Long comments: truncate with "Read more" tap to expand

**Motion specs:**
- New comment: fade-in + translateY 10px to 0, 200ms
- Like animation: heart scale 1.0 to 1.3 to 1.0, 300ms
- Thread collapse: height transition 200ms, chevron rotates 90 degrees
- Reply input expand: height auto, 200ms

**Accessibility:**
- Comments are a list with proper heading levels
- Reply button: aria-label="Reply to [author name]"
- Thread depth: indicated via aria-level attribute
- Collapsed threads: aria-expanded="false" on toggle
- Mention dropdown: keyboard navigable, Escape to close

**Acceptance Criteria:**
- [ ] All 8 screens designed (mobile + desktop)
- [ ] Threaded comments work up to 5 levels
- [ ] Collapse and expand threads works
- [ ] Comment input is accessible and fast
- [ ] Mention dropdown works
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Comment Figma frames, comment input component, thread visualization

---

### Task P4-UI-2.3: Moderation Tools

**Screens to design:**
1. Report flow (report a post or comment)
2. Report reason selector
3. Report submitted confirmation
4. Moderation queue (community manager view)
5. Post detail in moderation context
6. Moderation actions (pin, hide, dismiss report)
7. Moderation audit log
8. Auto-hidden post indicator

**Report flow:**
1. Tap overflow menu on post or comment
2. Select "Report"
3. Bottom sheet appears with reason selector
4. Reasons: Spam, Harassment, Misinformation, Off-topic, Other
5. Optional: add description (max 500 characters)
6. Tap "Submit Report"
7. Confirmation: "Report submitted. Our team will review it."
8. Reporter cannot see outcome (privacy protection)

**Moderation queue (community manager view):**
- Queue: list of reported posts/comments sorted by report count and recency
- Each item: post preview, report count, report reasons, time of first report
- Filter bar: by reason, by status (pending, actioned, dismissed)
- Actions per item: View detail, Pin, Hide, Dismiss reports, Escalate
- Batch actions: select multiple, bulk hide or dismiss

**Post detail in moderation:**
- Full post with all comments visible
- Report reasons listed in sidebar (desktop) or bottom sheet (mobile)
- Reporter information: hidden (reporter privacy)
- Moderation actions: prominent action bar at bottom

**Moderation actions:**
- Pin: post appears at top of feed, pinned indicator shown
- Hide: post removed from feed, "Hidden by moderator" shown to author
- Dismiss: reports marked as reviewed, no action taken, post stays visible
- Escalate: send to senior moderator for review

**Auto-hidden indicator:**
- When a post is auto-hidden (3+ reports in 1 hour), shows "Under community review" badge
- Post is hidden from feed but visible to author with explanation
- Community manager sees it in queue with "Auto-hidden" flag

**Motion specs:**
- Report bottom sheet: slide-up 300ms
- Queue item expand: height transition 200ms
- Action confirmation: toast notification, slide-down from top, 300ms
- Batch select: checkbox animation, scale 0.8 to 1.0, 150ms

**Mobile behavior (375px):**
- Moderation queue: single column, full width
- Actions: bottom action bar with large touch targets
- Post detail: full screen, scrollable
- Report flow: same bottom sheet as post creation

**Accessibility:**
- Report reasons: radio buttons with labels, keyboard navigable
- Moderation queue: table semantics with proper headers
- Actions: clearly labeled buttons with aria-labels
- Status indicators: color is not the only indicator (icon + text + color)

**Acceptance Criteria:**
- [ ] All 8 screens designed (mobile + desktop)
- [ ] Report flow takes under 5 taps
- [ ] Moderation queue is scannable and efficient
- [ ] All actions have confirmation feedback
- [ ] Reporter privacy maintained (no identifying info shown)
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Moderation Figma frames, report flow component, moderation queue design

---

## Week 3: AI Feedback Verification UI and Reputation Display

### Task P4-UI-3.1: AI Feedback Verification Status UI

**Screens to design:**
1. Feedback received list (with verification status badges)
2. Feedback detail (with verification status)
3. Excluded feedback explanation (generic, no internal details)
4. Appeal flow for excluded feedback
5. Appeal status tracking
6. Verification pending state
7. Verification confirmed state

**Feedback list design:**
- List of feedback items received (ratings, reviews, endorsements)
- Each item: source member (avatar, name), feedback type, date, verification status badge
- Verification status badges:
  - Pending: amber clock icon, "Under verification"
  - Verified: green checkmark, "Verified"
  - Excluded: gray x icon, "Could not verify"
- Filter by status: All, Verified, Pending, Excluded
- Sort by: Date (newest), Date (oldest), Value (highest)

**Feedback detail:**
- Full feedback text or rating value
- Quest context: quest title, value, date completed (if feedback is from a quest)
- Verification status: prominent badge at top
- For excluded feedback: generic explanation card
- Appeal button: if feedback is excluded, "Appeal this decision" button

**Excluded feedback explanation:**
- Card with amber border
- Text: "This feedback could not be verified through our verification process. It has been excluded from your reputation calculation."
- No mention of which signal failed (proprietary)
- No mention of internal verification method
- Appeal button: "If you believe this is an error, you can appeal."

**Appeal flow:**
1. Tap "Appeal this decision"
2. Bottom sheet with text input: "Tell us why this feedback should be counted"
3. Max 500 characters
4. Optional: attach evidence (screenshot of payment, communication log)
5. Tap "Submit Appeal"
6. Confirmation: "Appeal submitted. Our team will review within 72 hours."
7. Appeal status: Pending, Under Review, Approved, Denied

**Appeal status tracking:**
- List of submitted appeals with status
- Status changes: notification sent to member
- Approved: feedback moves to verified, reputation recalculated
- Denied: feedback stays excluded, member can see denial reason (generic)

**Motion specs:**
- Verification badge: fade-in 200ms when status changes
- Appeal bottom sheet: slide-up 300ms
- Status transition: smooth color transition 300ms
- Appeal submission: loading spinner, success checkmark, 300ms

**Mobile behavior (375px):**
- Feedback list: single column, full width
- Filter bar: horizontal scrollable tabs
- Feedback detail: full screen
- Appeal bottom sheet: 80% screen height

**Accessibility:**
- Verification badges: aria-label="Verification status: [status]"
- Color is not the only indicator: icon + text + color
- Appeal text input: label "Appeal reason", max length announced
- Status changes: aria-live="polite" announcement
- Screen reader: verification status read before feedback content

**Acceptance Criteria:**
- [ ] All 7 screens designed (mobile + desktop)
- [ ] Verification status clear at a glance
- [ ] Excluded feedback shows generic explanation (no internal details)
- [ ] Appeal flow takes under 5 taps
- [ ] Appeal status tracking works
- [ ] No proprietary verification details exposed in UI
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Feedback verification Figma frames, verification badge components, appeal flow

---

### Task P4-UI-3.2: Per-Skill Reputation Display

**Screens to design:**
1. Reputation overview (all skills)
2. Single skill reputation detail
3. Reputation history timeline
4. Reputation breakdown by source
5. Skill rank card (compact, for use in various contexts)
6. Reputation decay warning
7. New skill added state (no reputation yet)

**Reputation overview:**
- Header: "My Reputation" with overall summary (top rank, total skills, total quests)
- Skill list: sorted by reputation value (descending)
- Each skill row: skill name, rank chip, reputation value, feedback count, trend arrow (up/down/stable)
- Rank chips: color-coded (F=gray, E=light blue, D=blue, C=Tech Blue, B=green, B+=teal, A=gold, A+=purple)
- Tap skill row: navigate to skill detail
- Empty state: "You have not earned reputation in any skill yet. Complete a quest to start building reputation."

**Single skill reputation detail:**
- Header: skill name, current rank chip, reputation value
- Progress bar: visual representation of progress to next rank
- Stats grid: feedback count, quest count, total value (in rupees), last activity date
- Reputation breakdown: pie chart of feedback sources (quest completions, endorsements, reviews)
- History timeline: line chart of reputation value over time (last 90 days)
- Rank history: list of rank changes with dates
- "View rank progress" button: navigate to rank-up progress dashboard

**Reputation history timeline:**
- Line chart: x-axis is time (last 90 days), y-axis is reputation value
- Annotations: rank change events marked on the chart
- Zoom: pinch to zoom on mobile, scroll to zoom on desktop
- Date range selector: 30 days, 90 days, 1 year
- Tap on data point: tooltip with date, value, and any events

**Reputation breakdown:**
- Pie chart: segments for each feedback source type
- Legend: source type, count, percentage
- Tap segment: filter to show only that source type
- Values shown in rupees

**Skill rank card (compact):**
- Used in: member profile, post author row, search results, leaderboard
- Design: skill name + rank chip in a single row
- Size: 32px height, auto width
- Color: rank-based background

**Reputation decay warning:**
- Banner: appears on skill detail when decay is active or imminent
- Amber background, warning icon
- Text: "Your reputation in [skill] is decaying due to inactivity. Complete a quest in this skill to stop decay."
- CTA: "Find quests in [skill]"

**New skill state:**
- Card: "You have added [skill] to your profile. Complete a quest to start building reputation."
- Rank chip: "F" (starting rank) in gray
- CTA: "Find quests in [skill]"

**Motion specs:**
- Rank chip: color transition 300ms when rank changes
- Progress bar: animated fill, 500ms on load
- Timeline chart: line draws from left to right, 800ms
- Pie chart: segments expand from center, staggered 50ms
- Decay warning: slide-down from top, 300ms

**Mobile behavior (375px):**
- Skill list: single column, full width
- Skill detail: tabs for Overview, History, Breakdown
- Charts: responsive, maintain aspect ratio
- Timeline: horizontal pan and zoom
- Rank chips: horizontal scroll if multiple skills

**Accessibility:**
- Rank chips: aria-label="[skill name], rank [rank]"
- Charts: data tables provided as alternative (screen reader accessible)
- Progress bar: aria-valuenow, aria-valuemin, aria-valuemax
- Color is not the only indicator: rank letters always shown (F, E, D, C, B, B+, A, A+)
- Decay warning: aria-live="polite" for announcement

**Acceptance Criteria:**
- [ ] All 7 screens designed (mobile + desktop)
- [ ] Reputation is clear and not overwhelming
- [ ] Charts work on mobile (375px)
- [ ] Rank chips color-coded but not color-only
- [ ] Decay warning is clear and actionable
- [ ] New skill state is welcoming
- [ ] WCAG 2.1 AA compliance
- [ ] Data tables provided for all charts (screen reader accessible)

**Deliverables:** Reputation Figma frames, rank chip component, chart components with data table alternatives

---

## Week 4: Rank-Up Progress Dashboard

### Task P4-UI-4.1: Rank-Up Progress Dashboard

**Screens to design:**
1. Rank progress overview (per skill)
2. Signal breakdown (member-friendly labels)
3. Actionable suggestions
4. Rank-up celebration animation
5. Rank-down notification
6. Human review pending state (for B+ rank-ups)
7. Rank-up approved notification

**Rank progress overview:**
- Header: skill name, current rank, next rank, progress percentage
- Progress bar: large, prominent, shows progress to next rank
- Breakdown: list of areas to improve, each with current vs needed value
- Each area: label, current value, needed value, progress bar (mini)
- Overall: "You are 72% of the way to rank B"

**Signal breakdown (member-friendly):**
- NOT showing internal signal names or weights
- Member-friendly labels:
  - "Completed quests" (not "verified feedback count")
  - "Total quest value" (not "reputation value")
  - "Client satisfaction" (not "communication quality score")
  - "Peer endorsements" (not "endorsement count")
  - "Years of experience" (not "account age")
  - "Response speed" (not "response time average")
  - "Dispute-free record" (not "dispute rate")
- Each label: current value, needed value, progress bar
- Color: green if met, amber if close (within 20%), gray if far

**Actionable suggestions:**
- Below each area that needs improvement
- Text: "Complete 2 more quests to meet the requirement"
- Text: "Increase total quest value by Rs 3,50,000"
- CTA: "Find quests in [skill]" button
- Suggestions are specific and actionable

**Rank-up celebration:**
- Triggered when rank-up is applied (for auto-applied ranks below B)
- Full-screen overlay: rank-up animation
- Animation: old rank chip transforms into new rank chip, particles, confetti
- Duration: 3 seconds
- Dismiss: tap anywhere or auto-dismiss after 5 seconds
- Text: "Congratulations! You are now rank [new rank] in [skill]"

**Rank-down notification:**
- Notification: "Your rank in [skill] has changed to [new rank]"
- No celebration, just informational
- Link to reputation detail for context
- Amber background, not red (not punitive)

**Human review pending state:**
- Shown when member qualifies for B+ rank-up but it is pending review
- Card: "You qualify for rank [B+]. Our team is reviewing your progress."
- Estimated time: "Review typically takes 48 hours"
- Status: pending, under review, approved, denied
- If denied: "Your rank-up is under further review. Keep building your reputation."

**Rank-up approved notification:**
- Push notification and in-app notification
- "Congratulations! You are now rank [B+] in [skill]"
- Celebration animation on next app open
- Rank chip updates across all UI

**Motion specs:**
- Progress bar fill: animated from current to target, 800ms, ease-out
- Rank-up celebration: particles burst (CSS animation), rank chip scale 1.0 to 1.5 to 1.0, 1.5s
- Confetti: CSS animation, falls from top, 3s duration
- Rank-down: subtle fade of old rank to new rank, 300ms
- Human review pending: pulsing amber indicator, 2s loop

**Mobile behavior (375px):**
- Progress dashboard: single column, full width
- Signal breakdown: stacked cards
- Celebration: full screen overlay
- Notifications: standard notification card

**Accessibility:**
- Progress bar: aria-valuenow, aria-valuemin, aria-valuemax, aria-label
- Rank-up celebration: can be dismissed with Escape, aria-live="assertive" announcement
- "Skip celebration" option for reduced motion users
- Respects prefers-reduced-motion: no particles, no confetti, simple text announcement
- Signal breakdown: screen reader reads "Current: X, Needed: Y, Status: met/not met"

**Acceptance Criteria:**
- [ ] All 7 screens designed (mobile + desktop)
- [ ] Progress is clear and motivating
- [ ] Suggestions are actionable and specific
- [ ] Celebration is delightful but skippable
- [ ] Rank-down is informational, not punitive
- [ ] Human review pending state is clear
- [ ] No internal signal names or weights exposed
- [ ] WCAG 2.1 AA compliance
- [ ] Reduced motion preference respected

**Deliverables:** Rank progress Figma frames, celebration animation spec, notification designs

---

## Week 5: Analytics Dashboards (Party, Client, Platform)

### Task P4-UI-5.1: Party Analytics Dashboard

**Screens to design:**
1. Party analytics overview
2. Earnings chart (time series)
3. Reputation trends chart
4. Quest completion rate
5. Response time trends
6. Client repeat rate
7. Skill breakdown
8. Date range selector
9. CSV export button
10. Scheduled report configuration
11. Empty state (new member, no data)

**Party analytics overview:**
- Header: "Your Analytics" with date range selector
- Summary cards: 5 key metrics in a grid
  - Total earnings (large number, rupees, trend arrow)
  - Quest completion rate (percentage, trend arrow)
  - Average response time (hours, trend arrow)
  - Client repeat rate (percentage, trend arrow)
  - Active skills (count)
- Charts below summary cards
- Each chart: title, chart, description/insight

**Summary card design:**
- Glassmorphic card, 16px border-radius
- Metric label: small, muted text
- Metric value: large, bold (28px on mobile, 32px on desktop)
- Trend arrow: green up, red down, gray stable
- Trend percentage: small text next to arrow
- Period comparison: "vs previous period"

**Earnings chart:**
- Type: line chart with area fill
- X-axis: time (daily for 30-day range, weekly for 90-day, monthly for 1-year)
- Y-axis: rupees (Indian formatting: Rs 1,00,000 not Rs 100,000)
- Tooltip: date, earnings value, quest count
- Color: Tech Blue line, semi-transparent fill
- Responsive: maintains readability at 375px

**Reputation trends chart:**
- Type: multi-line chart (one line per skill, max 5 skills shown)
- X-axis: time
- Y-axis: reputation value
- Legend: skill name with color indicator
- Filter: select which skills to show
- Tooltip: date, skill, reputation value, rank at that time

**Quest completion rate:**
- Type: donut chart
- Segments: Completed, In Progress, Cancelled, Disputed
- Center: completion rate percentage
- Legend: count and percentage per segment
- Tooltip: count and percentage

**Response time trends:**
- Type: bar chart
- X-axis: time (weekly buckets)
- Y-axis: hours
- Color: Tech Blue bars
- Benchmark line: platform average response time
- Tooltip: week, average response time, benchmark

**Client repeat rate:**
- Type: horizontal bar chart
- Segments: One-time clients, Repeat clients (2+ quests)
- Center: repeat rate percentage
- Tooltip: count and percentage
- Insight text: "45% of your clients have hired you more than once"

**Skill breakdown:**
- Type: stacked bar chart or treemap
- Segments: each skill, sized by earnings
- Tooltip: skill, earnings, quest count, rank
- Color: one color per skill
- Tap: navigate to skill reputation detail

**Date range selector:**
- Preset options: Last 7 days, Last 30 days, Last 90 days, Last 1 year, Custom
- Custom: two date pickers (from, to)
- Mobile: bottom sheet with preset options
- Desktop: dropdown with custom option

**CSV export:**
- Button: "Export CSV" with download icon
- Export: downloads CSV with all chart data
- Loading state: spinner with "Generating export..."
- Success: browser download triggered

**Scheduled report:**
- Button: "Schedule Report" with calendar icon
- Configuration: frequency (daily, weekly, monthly), email address, metrics to include
- Manage: list of scheduled reports with edit/delete

**Empty state:**
- Illustration: same custom style as Guild Hall empty states
- Text: "You have not completed any quests yet. Once you do, your analytics will appear here."
- CTA: "Find quests"

**Motion specs:**
- Chart load: line draws from left to right, 800ms
- Bar chart: bars grow from bottom, staggered 50ms
- Donut chart: segments expand from center, staggered 50ms
- Number count-up: summary values count up from 0, 1s
- Card hover (desktop): subtle lift, shadow increase, 200ms

**Mobile behavior (375px):**
- Summary cards: 2-column grid (was 5-column on desktop)
- Charts: full width, maintain aspect ratio
- Date selector: bottom sheet
- Skill breakdown: simplified to horizontal bar chart (treemap too complex on mobile)
- All charts: touch to see tooltip, horizontal pan if needed

**Accessibility:**
- All charts have data table alternatives (toggle button "View as table")
- Summary cards: semantic markup, screen reader reads "Total earnings: Rs 4,50,000, up 12% from previous period"
- Trend arrows: text alternative ("up 12%", "down 5%", "stable")
- Color is not the only indicator: patterns, labels, text
- Date selector: keyboard navigable, Escape to close

**Acceptance Criteria:**
- [ ] All 11 screens designed (mobile + desktop)
- [ ] Charts render correctly on 375px
- [ ] Date range filtering works
- [ ] CSV export button designed
- [ ] Scheduled report configuration designed
- [ ] Indian number formatting (rupees, lakhs)
- [ ] Data tables provided for all charts
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Party analytics Figma frames, chart components, data table alternatives

---

### Task P4-UI-5.2: Client Analytics Dashboard

**Screens to design:**
1. Client analytics overview
2. Spending chart (time series)
3. Hiring success rate
4. Time-to-hire trends
5. Quest outcomes
6. Party retention
7. Top parties hired
8. Date range selector (same as party)
9. CSV export (same as party)
10. Scheduled report (same as party)

**Client analytics overview:**
- Header: "Your Analytics" with date range selector
- Summary cards: 5 key metrics
  - Total spending (rupees, trend arrow)
  - Hiring success rate (percentage of quests that resulted in satisfactory completion)
  - Average time-to-hire (hours from quest posted to accepted)
  - Party retention rate (percentage of parties hired more than once)
  - Active quests (count)

**Spending chart:**
- Type: line chart with area fill
- X-axis: time
- Y-axis: rupees
- Tooltip: date, spending, quest count
- Color: Tech Blue

**Hiring success rate:**
- Type: donut chart
- Segments: Successful, Cancelled, Disputed, Ongoing
- Center: success rate percentage
- Tooltip: count and percentage

**Time-to-hire trends:**
- Type: bar chart
- X-axis: time (weekly)
- Y-axis: hours
- Benchmark: platform average
- Tooltip: week, average time-to-hire, benchmark

**Quest outcomes:**
- Type: stacked bar chart
- X-axis: time (monthly)
- Segments: Completed, Cancelled, Disputed
- Tooltip: month, count per outcome

**Party retention:**
- Type: donut chart
- Segments: One-time parties, Repeat parties
- Center: retention rate
- Insight: "You have hired 12 unique parties. 5 of them more than once."

**Top parties hired:**
- Type: list/table
- Columns: Party name, quests hired, total spent, last hired date, current rank
- Sort: by quest count, by total spent, by recency
- Tap: navigate to party profile (if public)

**Motion specs:**
- Same chart animations as party dashboard
- Number count-up for summary cards
- Table row hover (desktop): subtle highlight

**Mobile behavior (375px):**
- Summary cards: 2-column grid
- Charts: full width
- Top parties: card list (not table)

**Accessibility:**
- Same as party dashboard: data tables, semantic markup, color not only indicator
- Table: proper table semantics with headers

**Acceptance Criteria:**
- [ ] All 10 screens designed (mobile + desktop)
- [ ] Charts render correctly on 375px
- [ ] Indian number formatting
- [ ] Data tables for all charts
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Client analytics Figma frames, chart components, top parties table

---

### Task P4-UI-5.3: Platform Analytics Dashboard (Admin)

**Screens to design:**
1. Platform analytics overview
2. GMV chart (gross marketplace value)
3. Active members chart
4. Quest funnel (posted, accepted, completed, paid)
5. Reputation distribution
6. Geographic distribution (city breakdown)
7. Real-time metrics panel
8. Date range selector
9. CSV export
10. Admin navigation and access control

**Platform analytics overview:**
- Header: "Platform Analytics" with admin badge
- Summary cards: GMV (today, this week, this month), Active members, New signups, Active quests, Live calls
- Real-time panel: live updating numbers (active members, live calls, active quests)
- Charts below summary

**Real-time metrics panel:**
- Glassmorphic card, prominent at top of dashboard
- Metrics: Active members (online now), Live calls, Active quests, Posts today
- Numbers update every 60 seconds with subtle pulse animation
- Green pulse dot: "Live" indicator
- Geographic breakdown: active members by city (Bangalore, Mumbai, Delhi, Other)

**GMV chart:**
- Type: line chart with area fill
- X-axis: time (daily for 30-day, weekly for 90-day, monthly for 1-year)
- Y-axis: rupees (in crores for platform-level)
- Tooltip: date, GMV, quest count, average quest value
- Comparison: previous period overlay (dashed line)

**Active members chart:**
- Type: line chart
- Lines: Daily active members, Weekly active members, Monthly active members
- Tooltip: date, DAU, WAU, MAU
- Color: one per metric

**Quest funnel:**
- Type: funnel chart
- Stages: Posted, Accepted, In Progress, Completed, Paid
- Each stage: count and conversion rate from previous stage
- Overall: posted-to-paid conversion rate
- Tooltip: stage, count, conversion rate

**Reputation distribution:**
- Type: stacked bar chart
- X-axis: skill (top 10 skills by member count)
- Segments: rank distribution (F, E, D, C, B, B+, A, A+)
- Tooltip: skill, rank, member count
- Filter: select specific skills

**Geographic distribution:**
- Type: bar chart and map view (toggle)
- Bar chart: cities on x-axis (Bangalore, Mumbai, Delhi, Chennai, Hyderabad, Pune, Kolkata, Other), member count on y-axis
- Map view: India map with city markers sized by member count
- Tooltip: city, member count, GMV, quest count
- Default: bar chart (map view is desktop-only due to complexity)

**Admin navigation:**
- Sidebar: Platform Analytics, Moderation Queue, Rank Review Queue, Members, Quests, Reports, Settings
- Admin badge: visible in header
- Access control: admin-only routes redirect non-admins

**Motion specs:**
- Real-time metrics: number updates with subtle scale pulse (1.0 to 1.05 to 1.0), 300ms
- Live indicator: green dot pulse, 2s loop
- Chart animations: same as other dashboards
- Funnel chart: stages fill from top to bottom, staggered 100ms
- Map markers: scale-in on load, staggered 50ms

**Mobile behavior (375px):**
- Admin dashboard: designed for desktop first (admin typically on desktop)
- Mobile: simplified view with key metrics only
- Real-time panel: full width
- Charts: full width, one per screen (scrollable)
- Map view: not available on mobile, bar chart only

**Accessibility:**
- Data tables for all charts
- Real-time updates: aria-live="polite" for number changes
- Admin navigation: keyboard navigable, Escape to close menus
- Map view: table alternative with city, member count, GMV
- Funnel: ordered list semantic for screen readers

**Acceptance Criteria:**
- [ ] All 10 screens designed (desktop primary, mobile simplified)
- [ ] Real-time metrics update every 60 seconds
- [ ] Geographic data shows correct city breakdown
- [ ] Quest funnel shows conversion rates
- [ ] Admin-only access enforced in design
- [ ] Indian number formatting (crores for platform-level)
- [ ] Data tables for all charts
- [ ] WCAG 2.1 AA compliance

**Deliverables:** Platform analytics Figma frames, real-time panel component, funnel chart, geographic visualization

---

## Week 6: Public Profile Page Design

### Task P4-UI-6.1: Public Profile Page

**Screens to design:**
1. Public profile page (full design)
2. Public profile with minimal data (new member)
3. Public profile with rich data (experienced member)
4. Profile section visibility toggles (member settings)
5. Share profile flow
6. Open Graph preview
7. 404 profile not found
8. 410 profile deleted/unavailable
9. Public profile in light mode (public pages default to light mode for SEO and shareability)

**Public profile page design:**
- URL: techguild.com/p/[handle]
- Default theme: light mode (for SEO, shareability, and broader accessibility)
- Layout: centered, max-width 800px
- Header: avatar (120px), display name, handle, city, years active, AI verification badge
- Bio: max 280 characters
- Skill ranks: horizontal grid of rank chips (only public skills shown)
- Stats: quest count, years active, member since
- Public posts: latest 5 Guild Hall posts (if member has opted to show posts publicly)
- Contact: "Hire [member]" CTA button (links to quest creation or member contact)
- Footer: "Verified on TechGuild" with link to platform

**Profile with minimal data (new member):**
- Header: avatar, name, handle, city
- Skill ranks: "F" rank chips for declared skills (no verified reputation yet)
- Stats: "Member since [date]", "0 quests completed"
- CTA: "This member is new to TechGuild. [member] has not completed any quests yet."
- No posts section

**Profile with rich data (experienced member):**
- Header: avatar, name, handle, city, years active, AI verification badge
- Bio: well-written summary
- Skill ranks: multiple skills with high ranks (B, B+, A, A+)
- Stats: "127 quests completed", "3 years active", "Member since 2023"
- Public posts: latest 5 posts showing expertise
- Endorsements: "Endorsed by 23 members" with avatars
- CTA: "Hire [member]" prominent

**Profile section visibility toggles (member settings):**
- Settings page: "Public Profile" section
- Toggles for each section: Skill ranks, Years active, Quest count, City, Bio, Public posts, Endorsements
- Preview: live preview of public profile as toggles change
- Note: "Some information is always public: your handle, display name, and avatar"
- Save: persists visibility settings

**Share profile flow:**
- Share button: on public profile page and in member settings
- Share sheet: Copy link, Share to WhatsApp, Share to X (Twitter), Share to LinkedIn, Share to Email
- Copy link: copies URL to clipboard, toast "Link copied"
- Native share: uses Web Share API on mobile if available
- QR code: option to generate QR code for the profile (desktop)

**Open Graph preview:**
- Title: "[Display Name] - TechGuild"
- Description: "[Rank] in [top skill]. [N] quests completed. Based in [city]."
- Image: dynamically generated OG image with member avatar, name, top skill rank, quest count
- OG image design: 1200x630px, TechGuild branded, glassmorphic aesthetic, member data overlaid
- Preview: shown in share sheet

**404 profile not found:**
- Illustration: magnifying glass with question mark
- Text: "Profile not found. This handle does not exist on TechGuild."
- CTA: "Back to TechGuild"

**410 profile deleted/unavailable:**
- Illustration: broken link or archive icon
- Text: "This profile is no longer available."
- No explanation of why (privacy)
- CTA: "Back to TechGuild"

**Motion specs:**
- Profile load: staggered fade-in of sections (header, skills, stats, posts), 100ms delay per section
- Skill rank chips: scale-in with stagger, 50ms delay per chip
- Share sheet: slide-up 300ms
- QR code: fade-in 200ms
- Toggle animation: smooth slide, 200ms

**Mobile behavior (375px):**
- Profile: single column, full width
- Avatar: 80px (smaller than desktop)
- Skill ranks: 2-column grid (horizontal scroll on mobile)
- Stats: 3-column grid
- Posts: single column
- CTA: full width, sticky at bottom
- Share: native share sheet on mobile

**Accessibility:**
- Public profile: semantic HTML (article, header, main)
- Skill rank chips: aria-label="[skill name], rank [rank]"
- Toggles: aria-pressed, aria-label
- Share buttons: aria-label for each platform
- 404 and 410: proper HTTP status codes, semantic markup
- Color contrast: light mode meets WCAG 2.1 AA (minimum 4.5:1)

**Security and privacy:**
- No private data shown: no earnings, no client names, no contact info, no email
- Only verified data shown: skill ranks are from verified reputation only
- Member can toggle sections off in settings
- Public profile does not include Guild Hall activity unless member opts in
- No follow/mention buttons on public profile (must be logged in)

**Acceptance Criteria:**
- [ ] All 9 screens designed (mobile + desktop)
- [ ] Public profile defaults to light mode
- [ ] Private data never shown
- [ ] Section visibility toggles work
- [ ] Share flow works on mobile and desktop
- [ ] OG image generates correctly
- [ ] 404 and 410 pages designed
- [ ] WCAG 2.1 AA compliance (light mode)
- [ ] Loads in under 1 second on 4G (ISR)

**Deliverables:** Public profile Figma frames, OG image template, share flow, visibility settings

---

## Week 7: Analytics Email Reports and Polish

### Task P4-UI-7.1: Analytics Email Reports

**Screens to design:**
1. Email report template (party)
2. Email report template (client)
3. Scheduled report configuration UI
4. Report preview
5. Email client rendering tests (Gmail, Outlook, Apple Mail)

**Email report template (party):**
- Header: TechGuild logo, "Your Weekly Analytics Report"
- Greeting: "Hi [name], here is your weekly summary"
- Summary section: 5 key metrics with trend arrows
- Top insight: "You earned Rs 15,000 more than last week"
- Chart: simple earnings line chart (email-safe, PNG image)
- Skill breakdown: mini bar chart
- CTA: "View Full Dashboard" button linking to party analytics
- Footer: unsubscribe link, email preferences

**Email report template (client):**
- Same structure as party but with client metrics
- Summary: spending, hiring success, time-to-hire, party retention
- Top insight: "You hired 3 new parties this week"
- Chart: spending line chart
- Top parties: list of parties hired this week

**Scheduled report configuration:**
- Settings page: "Email Reports" section
- Frequency: daily, weekly, monthly (radio buttons)
- Day of week (for weekly): Monday, Tuesday, etc.
- Day of month (for monthly): 1st, 15th, etc.
- Time: time selector (in IST)
- Email: default to member email, option to add additional
- Metrics: checkboxes for which metrics to include
- Preview: "Preview Report" button shows sample email
- Manage: list of scheduled reports with edit/delete/pause

**Email design considerations:**
- Width: 600px max (email standard)
- Images: PNG, not SVG (email client compatibility)
- Charts: pre-rendered as PNG images, generated server-side
- Fonts: system fonts only (email client compatibility)
- Dark mode: supported via prefers-color-scheme in email clients that support it
- Mobile: responsive, stacks on small screens
- Accessibility: alt text on all images, semantic table layout, text alternative for charts

**Motion specs:**
- N/A for email (static)
- Configuration UI: same motion as other settings pages

**Mobile behavior (375px):**
- Email: responsive, single column on mobile
- Configuration: standard form layout

**Accessibility:**
- Email: alt text on all images, text-based summary before charts
- Configuration: standard form accessibility
- Unsubscribe: prominent, one-click

**Acceptance Criteria:**
- [ ] Email templates designed for party and client
- [ ] Renders correctly in Gmail, Outlook, Apple Mail
- [ ] Scheduled report configuration works
- [ ] Report preview available
- [ ] Mobile responsive
- [ ] Accessible (alt text, semantic markup)
- [ ] Unsubscribe link prominent

**Deliverables:** Email report templates (HTML), configuration UI, preview flow

---

### Task P4-UI-7.2: Cross-Dashboard Polish and Consistency

**Tasks:**
1. Audit all Phase 4 screens for design consistency
2. Verify color palette usage across all screens
3. Verify typography hierarchy across all screens
4. Verify spacing and layout grid consistency
5. Verify component usage (buttons, cards, inputs, badges)
6. Verify icon usage and consistency
7. Verify empty states across all screens
8. Verify loading states across all screens
9. Verify error states across all screens
10. Verify dark mode and light mode (public profile only)

**Consistency audit checklist:**
- [ ] All buttons use same component (primary, secondary, ghost, danger)
- [ ] All cards use same glassmorphic style and border-radius
- [ ] All inputs use same component with same validation states
- [ ] All badges use same component (verification, rank, status)
- [ ] All icons from same icon set (Lucide or Phosphor)
- [ ] All empty states use same layout structure (illustration, headline, subtext, CTA)
- [ ] All loading states use skeleton components (not spinners for content areas)
- [ ] All error states use same error component (icon, message, retry)
- [ ] Color palette: only defined colors used, no off-palette colors
- [ ] Typography: only defined type scale used (12, 14, 16, 18, 20, 24, 28, 32, 40px)
- [ ] Spacing: only defined spacing scale used (4, 8, 12, 16, 20, 24, 32, 40, 48px)
- [ ] Mobile: all screens work at 375px without horizontal scroll

**Acceptance Criteria:**
- [ ] All consistency audit items pass
- [ ] No off-palette colors
- [ ] No off-scale typography or spacing
- [ ] All components used correctly
- [ ] All states (empty, loading, error) designed for every screen

**Deliverables:** Consistency audit report, updated component library, fixed Figma frames

---

## Week 8: Responsive QA, Accessibility Audit, Final Polish

### Task P4-UI-8.1: Responsive QA at 375px

**Test all Phase 4 screens at 375px width:**

**Guild Hall:**
- [ ] Post creation bottom sheet fits and is usable
- [ ] Feed cards are readable and not cramped
- [ ] Post detail scrolls correctly
- [ ] Comments thread indentation does not overflow
- [ ] Social graph profile works
- [ ] Moderation queue works
- [ ] No horizontal scroll on any screen

**Reputation:**
- [ ] Reputation overview list is readable
- [ ] Skill detail tabs work
- [ ] Charts render correctly at 375px
- [ ] Rank progress dashboard is usable
- [ ] Celebration animation does not overflow

**Analytics:**
- [ ] Party dashboard charts render at 375px
- [ ] Client dashboard charts render at 375px
- [ ] Platform dashboard simplified mobile view works
- [ ] Date selector bottom sheet works
- [ ] CSV export triggers download
- [ ] Scheduled report configuration works

**Public Profile:**
- [ ] Public profile renders at 375px
- [ ] Skill rank grid wraps correctly
- [ ] Share sheet works
- [ ] OG image generates correctly

**Network testing:**
- [ ] All screens load in under 1.5 seconds on simulated 4G
- [ ] Skeleton loading states appear immediately
- [ ] No layout shift during load
- [ ] Images lazy load with blur-up placeholder

**Acceptance Criteria:**
- [ ] All screens pass 375px QA
- [ ] No horizontal scroll anywhere
- [ ] All interactive elements have 44px touch targets
- [ ] Load times under 1.5 seconds on 4G simulation

**Deliverables:** Responsive QA report, fixed Figma frames, mobile-specific adjustments

---

### Task P4-UI-8.2: Accessibility Audit (WCAG 2.1 AA)

**Audit all Phase 4 screens for WCAG 2.1 AA compliance:**

**Perceivable:**
- [ ] Color contrast: minimum 4.5:1 for text, 3:1 for large text and UI components
- [ ] All images have alt text
- [ ] All charts have data table alternatives
- [ ] Content is readable without color (color is not the only indicator)
- [ ] Text can be resized to 200% without loss of functionality

**Operable:**
- [ ] All interactive elements keyboard accessible
- [ ] Tab order is logical and visible
- [ ] No keyboard traps
- [ ] Skip to content link on all pages
- [ ] Touch targets minimum 44px
- [ ] No content that flashes more than 3 times per second

**Understandable:**
- [ ] Language attribute set on all pages
- [ ] Form labels are programmatically associated
- [ ] Error messages are clear and associated with form fields
- [ ] Instructions are clear and simple

**Reliable:**
- [ ] Valid HTML
- [ ] ARIA used correctly (not overused)
- [ ] Works with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Works with voice control software

**Specific checks:**
- [ ] Rank chips: not color-only (letter always shown)
- [ ] Verification badges: not color-only (icon + text + color)
- [ ] Charts: data tables provided
- [ ] Live updates: aria-live regions used
- [ ] Reduced motion: prefers-reduced-motion respected (no celebration animation, no particles)
- [ ] Focus management: modals and bottom sheets trap focus correctly
- [ ] Screen reader testing: all screens tested with NVDA or VoiceOver

**Acceptance Criteria:**
- [ ] All WCAG 2.1 AA criteria pass
- [ ] Screen reader testing completed for all major screens
- [ ] Keyboard-only testing completed for all screens
- [ ] Reduced motion preference tested
- [ ] No critical accessibility issues

**Deliverables:** Accessibility audit report, fixed Figma frames, accessibility documentation

---

### Task P4-UI-8.3: Final Polish and Handoff

**Tasks:**
1. Review all Figma frames for pixel-level polish
2. Ensure all motion specs are documented
3. Ensure all component states are documented (default, hover, active, disabled, error, loading)
4. Create design handoff documentation
5. Annotate all Figma frames with developer notes
6. Export all assets (icons, illustrations, OG image template)
7. Create prototype for key flows (post creation, feed browsing, reputation viewing, analytics, public profile)
8. Design review with engineering team

**Polish checklist:**
- [ ] Pixel-perfect alignment on all frames
- [ ] Consistent shadow and blur values
- [ ] Consistent border-radius (16px for cards, 12px for inputs, 8px for small elements)
- [ ] All icons aligned and sized consistently
- [ ] All text vertically centered in containers
- [ ] No orphaned or widowed text
- [ ] All illustrations on-brand and consistent style
- [ ] All empty states have custom illustrations (no stock)
- [ ] Loading skeletons match content layout
- [ ] Error states are clear and not punitive

**Handoff documentation:**
- [ ] Design system documentation (colors, typography, spacing, components)
- [ ] Motion spec documentation (durations, easings, triggers)
- [ ] Component documentation (props, states, variants)
- [ ] Flow documentation (key user journeys with annotated frames)
- [ ] Asset export guide (naming, formats, sizes)
- [ ] Accessibility notes per component
- [ ] Mobile-specific notes (what changes at 375px)

**Prototypes:**
- [ ] Guild Hall: post creation and feed browsing
- [ ] Reputation: viewing reputation and rank progress
- [ ] Analytics: party dashboard filtering and export
- [ ] Public profile: viewing and sharing

**Acceptance Criteria:**
- [ ] All Figma frames polished
- [ ] All documentation complete
- [ ] All prototypes functional
- [ ] Engineering design review completed
- [ ] No open design questions

**Deliverables:** Polished Figma file, design system documentation, handoff guide, prototypes

---

## Component Library Additions (Phase 4)

### New Components
1. **GuildPostCard** - post card for feed
2. **CommentThread** - threaded comment component
3. **SkillRankChip** - rank chip (color-coded, with letter)
4. **VerificationBadge** - AI verification badge for posts
5. **ReputationProgressBar** - progress bar for rank progress
6. **AnalyticsChart** - wrapper component for all chart types
7. **DataTable** - accessible data table for chart alternatives
8. **RealTimeMetric** - live updating metric display
9. **BottomSheet** - reusable bottom sheet for mobile
10. **CelebrationOverlay** - rank-up celebration animation
11. **DateRangeSelector** - date range picker
12. **CSVExportButton** - export button with loading state
13. **PublicProfileHeader** - public profile header
14. **ShareSheet** - native share sheet
15. **OGImageTemplate** - Open Graph image template
16. **ModerationQueue** - moderation queue table
17. **EndorsementFlow** - endorsement bottom sheet
18. **NotificationCard** - notification list item
19. **FeedFilterBar** - feed filter tabs
20. **EmptyState** - reusable empty state with illustration

### Updated Components
1. **Button** - add loading state and success state
2. **Card** - add glassmorphic variant for Guild Hall
3. **Avatar** - add AI verification badge option
4. **Badge** - add verification status and rank variants
5. **Toast** - add celebration variant

---

## Design Tokens Additions (Phase 4)

### Rank Colors
```
--rank-f: #6B7280 (gray)
--rank-e: #60A5FA (light blue)
--rank-d: #3B82F6 (blue)
--rank-c: #3399FF (Tech Blue)
--rank-b: #10B981 (green)
--rank-b-plus: #14B8A6 (teal)
--rank-a: #F59E0B (gold)
--rank-a-plus: #8B5CF6 (purple)
```

### Verification Status Colors
```
--status-pending: #F59E0B (amber)
--status-verified: #10B981 (green)
--status-excluded: #6B7280 (gray)
```

### Chart Colors
```
--chart-primary: #3399FF (Tech Blue)
--chart-secondary: #8B5CF6 (purple)
--chart-tertiary: #10B981 (green)
--chart-quaternary: #F59E0B (gold)
--chart-quinary: #EC4899 (pink)
```

---

## Definition of Done for Phase 4 UI/UX

- [ ] All screens designed at 375px (mobile) and 1280px (desktop)
- [ ] Guild Hall: post creation, feed, social graph, comments, moderation
- [ ] AI feedback verification: status display, appeal flow
- [ ] Per-skill reputation: overview, detail, history, breakdown
- [ ] Rank-up progress: dashboard, celebration, human review pending
- [ ] Party analytics: all 5 metrics, charts, export, scheduled reports
- [ ] Client analytics: all 5 metrics, charts, export, scheduled reports
- [ ] Platform analytics: overview, real-time, funnel, geographic, reputation distribution
- [ ] Public profile: full page, visibility settings, share flow, OG image, 404/410
- [ ] Email report templates: party and client
- [ ] All charts have data table alternatives for accessibility
- [ ] All screens pass 375px responsive QA (no horizontal scroll)
- [ ] All screens pass WCAG 2.1 AA accessibility audit
- [ ] Reduced motion preference respected on all animations
- [ ] Indian number formatting (rupees, lakhs, crores) used throughout
- [ ] No proprietary verification details exposed in UI
- [ ] All motion specs documented
- [ ] All components documented with states and variants
- [ ] Design handoff documentation complete
- [ ] Engineering design review completed
- [ ] Prototypes functional for key flows

---

*TechGuild is a Product/SaaS Platform parented by Domain Expansion Company.*
