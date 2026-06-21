---
type: signal
status: resolved
priority: high
sources: [postgres-analysis, support-triage]
frequency: 6
cohort: June 12, 2026
segments: [signup, unverified]
resolved_at: 2026-06-20
resolution: SMTP configured on Vercel production. Verification flow verified working: signup → email → confirm → verified=true → signin. 10 unverified users are test accounts or users who didn't click the link. Resend endpoint works.
created_at: 2026-06-20
---

# Email Verification Drop-off — 100% Abandon on June 12

## Observation
6 users signed up on June 12, 2026. NONE verified their email (0/6, 0% verification rate).
For comparison: June 10 had 7 signups with 7/7 verified (100%). Total unverified: 10 users across 4 dates.

## Evidence
- June 12: 6 signups, 0 verified — **CRITICAL**
- June 10: 7 signups, 7 verified (baseline: working)
- May 31: 1 signup, 0 verified
- May 27: 2 signups, 0 verified
- Total: 10 unverified users out of 22 (45% unverified rate)

## Possible Causes
- SMTP relay failure on June 12 (SendGrid throttle, IP block, DNS issue)
- Verification email landing in spam for certain providers
- Email template broken in some clients (Gmail, Outlook)
- Verification link click not resolving properly
- User confusion after signup (no clear "check your email" messaging)
- Rate limiting on verification endpoint blocking legitimate requests

## Suggested Next Action
1. Check SendGrid logs for June 12 delivery status
2. Test signup flow manually to see what user sees after form submit
3. Verify `POST /api/auth/resend-verification` works for unverified users
4. Add signup-to-verification funnel analytics
5. Consider auto-verifying dev-mode emails (dev@pequi.co, aldo's emails)
6. Add re-send verification link on sign-in page when user exists but unverified

## Timeline
- 2026-06-20 17:30: Signal created by postgres-analysis loop from DB audit
- 2026-06-20 17:31: Cross-referenced with support-triage — no support tickets for these users (they never logged in)

## Related
- Sources: [[psql: User table audit]]
- Tasks: [[TASK-001: Investigate email verification drop-off]]
- Signals: 
