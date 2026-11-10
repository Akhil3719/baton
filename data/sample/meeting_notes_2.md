# Architecture Alignment: Authentication & User Federation
**Date:** 2026-10-25  
**Attendees:** Alex Leaver, Morgan Stone, Jamie Dev, Priya Patel  
**Clearance:** Leads Only  

## 1. Auth Provider Decision (Unresolved)
The team held an extensive discussion regarding replacing legacy JWT session handling:
- **Option A (Clerk):** Jamie Dev strongly advocated for Clerk, noting turnkey user profile UI components, pre-built multi-factor authentication, and out-of-the-box organization switching.
- **Option B (Supabase Auth):** Alex Leaver preferred Supabase Auth because it natively integrates with PostgreSQL Row Level Security (RLS) policies without requiring external webhook synchronization.
- **Outcome:** The discussion remained completely unresolved with no consensus reached. Alex stated: "We will leave the final architectural choice between Clerk and Supabase Auth undecided for the incoming lead Morgan Stone to finalize."

## 2. API Gateway & Rate Limiting
Priya Patel reviewed Cloudflare Turnstile integration plans for login rate limiting. Agreed to implement standard 60 req/min threshold per IP.
