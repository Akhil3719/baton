# Sprint 14 Retrospective & Release Debrief
**Date:** 2026-10-18  
**Attendees:** Alex Leaver (Lead), Morgan Stone (Incoming Lead), Marcus Vance (DevOps)  
**Clearance:** Leads Only  

## 1. Production Deployment Pipeline Rollback
Marcus Vance reported that release tags on `release-v2.1` encountered severe cherry-pick drift during the October 16 hotfix.
Alex Leaver and Marcus decided to revert deployment triggers: 
"Production deployment was reverted back to track the `main` branch directly on AWS ECS. Do not push production tags to release-v2.1 anymore; all deploys now trigger directly off merges to main."

## 2. Infrastructure Health & Monitoring
- Datadog APM alerts were triggered twice due to unindexed queries on the memberships table.
- Marcus added a composite index on `(user_id, project_id)`.
- Average p99 latency dropped from 420ms to 48ms.

## 3. Database Migration Follow-up
Morgan asked why PostgreSQL was chosen over MongoDB in Issue #57. 
Alex noted that the team had simply wanted SQL relational foreign keys, but admitted no formal benchmarks or tradeoff documentations were ever written down.
