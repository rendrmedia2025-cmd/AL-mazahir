# Al Mazahir Trading - Incident Response Playbook

## Overview

This playbook provides step-by-step procedures for responding to incidents in the Al Mazahir Trading platform. It ensures consistent, effective incident response to minimize downtime and business impact.

## Incident Classification

### Severity Levels

#### Priority 1 (Critical)
**Response Time**: 15 minutes
**Examples**:
- Complete website outage
- Database unavailable
- Security breach or data leak
- Payment system failure
- Admin panel completely inaccessible

**Impact**: Complete business disruption, revenue loss, security risk

#### Priority 2 (High)
**Response Time**: 1 hour
**Examples**:
- Major functionality broken (lead submission fails)
- Significant performance degradation (>10 second load times)
- Admin panel partially accessible
- Email/WhatsApp integration failures
- Availability status not updating

**Impact**: Major business functionality impaired, user experience severely degraded

#### Priority 3 (Medium)
**Response Time**: 4 hours
**Examples**:
- Minor functionality issues
- Moderate performance issues (3-5 second load times)
- Non-critical features not working
- Cosmetic display issues
- Individual user account issues

**Impact**: Limited business impact, some users affected

#### Priority 4 (Low)
**Response Time**: 24 hours
**Examples**:
- Cosmetic issues
- Documentation errors
- Minor UI inconsistencies
- Non-urgent feature requests

**Impact**: Minimal or no business impact

## Incident Response Team

### Team Roles

#### Incident Commander (IC)
**Responsibilities**:
- Overall incident coordination
- Decision making authority
- Communication with stakeholders
- Resource allocation

**Primary**: System Administrator
**Backup**: DevOps Engineer

#### Technical Lead
**Responsibilities**:
- Technical investigation and resolution
- Implementation of fixes
- Technical communication to IC

**Primary**: Lead Developer
**Backup**: Senior Developer

#### Communications Lead
**Responsibilities**:
- Internal team communication
- Customer communication
- Status page updates
- Documentation

**Primary**: Business Owner
**Backup**: Project Manager

### Contact Information

#### On-Call Rotation
```
Week 1: Primary - John Doe (+966-5X-XXX-XXXX)
        Backup - Jane Smith (+966-5X-XXX-XXXY)

Week 2: Primary - Ahmed Al-Rashid (+966-5X-XXX-XXXZ)
        Backup - Sarah Johnson (+966-5X-XXX-XXXA)
```

#### Escalation Contacts
- **CEO**: +966-5X-XXX-XXXX
- **CTO**: +966-5X-XXX-XXXY
- **External Support**: support@vendor.com

## Incident Response Process

### Phase 1: Detection and Initial Response

#### 1.1 Incident Detection
**Automated Detection**:
- Monitoring alerts
- Health check failures
- Error rate spikes
- Performance degradation alerts

**Manual Detection**:
- User reports
- Team member observations
- Customer complaints
- Social media mentions

#### 1.2 Initial Assessment (5 minutes)
```bash
# Quick assessment checklist
□ Confirm incident is real (not false positive)
□ Determine initial severity level
□ Check if incident is ongoing
□ Identify affected systems/users
□ Gather initial evidence
```

#### 1.3 Incident Declaration
```bash
# Incident declaration script
./scripts/declare-incident.sh <severity> "<description>"

# Example:
./scripts/declare-incident.sh "critical" "Website completely down - 500 errors"
```

### Phase 2: Response and Mitigation

#### 2.1 Team Assembly (Within response time)
**For P1/P2 Incidents**:
1. Page on-call engineer immediately
2. Notify Incident Commander
3. Assemble response team
4. Create incident war room (Slack channel)

**For P3/P4 Incidents**:
1. Create incident ticket
2. Assign to appropriate team member
3. Set expected resolution time

#### 2.2 Initial Response Actions
```bash
# P1 Incident Response Checklist
□ Acknowledge incident in monitoring system
□ Create incident war room (#incident-YYYY-MM-DD-HH-MM)
□ Notify stakeholders
□ Begin investigation
□ Implement immediate mitigation if possible
□ Update status page
```

#### 2.3 Investigation Process
```bash
# Investigation checklist
□ Check system health dashboard
□ Review recent deployments
□ Check error logs
□ Verify external service status
□ Check database performance
□ Review security logs
□ Test affected functionality
```

### Phase 3: Resolution and Recovery

#### 3.1 Root Cause Analysis
```bash
# RCA Investigation Steps
1. Timeline reconstruction
2. Change analysis (code, config, infrastructure)
3. Log analysis
4. Performance metrics review
5. External dependency check
6. Security assessment
```

#### 3.2 Fix Implementation
```bash
# Fix implementation checklist
□ Identify root cause
□ Develop fix plan
□ Test fix in staging (if time permits)
□ Get approval from IC for P1/P2
□ Implement fix
□ Monitor for improvement
□ Verify fix effectiveness
```

#### 3.3 Recovery Verification
```bash
# Recovery verification steps
□ All affected systems operational
□ Performance metrics normal
□ Error rates back to baseline
□ User functionality restored
□ Monitoring alerts cleared
□ Stakeholder confirmation
```

### Phase 4: Post-Incident Activities

#### 4.1 Incident Closure
```bash
# Incident closure checklist
□ Confirm full resolution
□ Update incident status
□ Notify all stakeholders
□ Update status page
□ Close incident war room
□ Schedule post-incident review
```

#### 4.2 Post-Incident Review (PIR)
**Timeline**: Within 48 hours for P1/P2, within 1 week for P3/P4

**PIR Agenda**:
1. Incident timeline review
2. Response effectiveness analysis
3. Root cause confirmation
4. Impact assessment
5. Action items identification
6. Process improvement recommendations

## Incident Response Procedures by Type

### Website Outage (P1)

#### Immediate Actions (0-15 minutes)
```bash
# 1. Verify outage
curl -I https://almazahir.com
curl -I https://almazahir.com/api/health

# 2. Check Vercel status
curl -I https://vercel.com/api/status

# 3. Check DNS resolution
nslookup almazahir.com
dig almazahir.com

# 4. Check recent deployments
vercel logs --limit 50

# 5. Immediate mitigation
# If recent deployment caused issue:
vercel rollback
```

#### Investigation Steps
```bash
# Check application logs
vercel logs --since 1h

# Check database connectivity
npm run db:health-check

# Check external services
npm run external:health-check

# Review monitoring dashboards
# - Response times
# - Error rates
# - Traffic patterns
```

#### Resolution Actions
```bash
# If deployment issue:
vercel rollback <deployment-id>

# If database issue:
# Check Supabase dashboard
# Review connection pool
# Check for long-running queries

# If external service issue:
# Check service status pages
# Implement fallback mechanisms
# Contact service providers
```

### Database Issues (P1)

#### Immediate Actions
```bash
# 1. Check database status
supabase status

# 2. Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# 3. Check for blocking queries
psql $DATABASE_URL -c "
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  blocked_activity.query AS blocked_statement,
  blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
"

# 4. Check disk space and performance
psql $DATABASE_URL -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

#### Resolution Actions
```bash
# Kill blocking queries if necessary
psql $DATABASE_URL -c "SELECT pg_terminate_backend(<pid>);"

# Restart connection pool if needed
# (Contact Supabase support for managed instances)

# Optimize queries
# Review slow query log
# Add missing indexes
# Update table statistics
```

### Security Incidents (P1)

#### Immediate Actions
```bash
# 1. Assess scope of breach
# Check audit logs
npm run security:audit-review

# 2. Contain the incident
# Block suspicious IPs
npm run security:block-ip <ip-address>

# 3. Preserve evidence
# Backup current logs
npm run logs:backup

# 4. Notify security team
./scripts/notify-security-team.sh "Security incident detected"
```

#### Investigation Steps
```bash
# Review access logs
npm run security:access-review --since 24h

# Check for unauthorized changes
npm run security:change-review

# Analyze attack patterns
npm run security:pattern-analysis

# Check data integrity
npm run security:data-integrity-check
```

#### Resolution Actions
```bash
# Rotate compromised credentials
npm run security:rotate-credentials

# Apply security patches
npm run security:apply-patches

# Update security policies
npm run security:update-policies

# Notify affected users (if applicable)
npm run security:notify-users
```

### Performance Issues (P2)

#### Immediate Actions
```bash
# 1. Check current performance
curl -w "@curl-format.txt" -o /dev/null -s https://almazahir.com

# 2. Check resource utilization
# Review Vercel analytics
# Check database performance

# 3. Identify bottlenecks
npm run performance:analyze

# 4. Implement quick fixes
# Enable caching
# Optimize queries
# Scale resources if needed
```

#### Investigation Steps
```bash
# Analyze performance metrics
npm run performance:detailed-analysis

# Check for resource leaks
npm run performance:memory-analysis

# Review recent changes
git log --since="24 hours ago" --oneline

# Check external dependencies
npm run performance:dependency-check
```

## Communication Procedures

### Internal Communication

#### Incident War Room Setup
```bash
# Create Slack channel
/create #incident-2024-01-15-14-30

# Add team members
/invite @incident-commander @technical-lead @communications-lead

# Set channel topic
/topic "P1 Incident: Website outage - investigating"

# Pin important information
# - Incident ID
# - Status page link
# - Monitoring dashboard links
```

#### Status Updates
**Frequency**:
- P1: Every 15 minutes
- P2: Every 30 minutes
- P3: Every 2 hours
- P4: Daily

**Template**:
```
🚨 INCIDENT UPDATE - [Timestamp]
Incident ID: INC-2024-0115-001
Status: [Investigating/Mitigating/Resolved]
Impact: [Description of current impact]
Actions: [What we're doing now]
ETA: [Expected resolution time]
Next Update: [When next update will be provided]
```

### External Communication

#### Customer Communication
**Status Page Updates**:
- Update within 15 minutes of P1/P2 incidents
- Provide regular updates every 30 minutes
- Include impact description and ETA

**Email Notifications**:
- For incidents affecting >50% of users
- Include incident summary and resolution steps
- Provide contact information for questions

#### Stakeholder Communication
**Executive Summary Template**:
```
Subject: [P1/P2] Incident Summary - [Brief Description]

Incident: [Incident ID and description]
Start Time: [When incident began]
Resolution Time: [When incident was resolved]
Duration: [Total incident duration]
Impact: [Business impact description]
Root Cause: [Brief root cause]
Actions Taken: [Summary of resolution steps]
Prevention: [Steps to prevent recurrence]

Next Steps:
- Post-incident review scheduled for [date]
- Action items will be tracked and reported
```

## Tools and Resources

### Monitoring and Alerting Tools
- **System Health**: `/admin/monitoring/health`
- **Performance Metrics**: `/admin/monitoring/performance`
- **Error Logs**: `/admin/monitoring/errors`
- **Security Events**: `/admin/monitoring/security`

### Communication Tools
- **Slack**: Primary team communication
- **Email**: Stakeholder notifications
- **SMS**: Critical alert notifications
- **Status Page**: Customer communication

### Technical Tools
```bash
# Health check tools
curl -I https://almazahir.com/api/health
npm run health:full-check

# Performance analysis
npm run performance:analyze
npm run performance:web-vitals

# Database tools
supabase db inspect
psql $DATABASE_URL

# Log analysis
npm run logs:analyze --since 1h
npm run logs:search "error"

# Security tools
npm run security:scan
npm run security:audit
```

### Runbook Scripts
```bash
# Incident management
./scripts/declare-incident.sh
./scripts/update-incident.sh
./scripts/resolve-incident.sh

# Emergency procedures
./scripts/emergency-rollback.sh
./scripts/enable-maintenance-mode.sh
./scripts/scale-resources.sh

# Communication
./scripts/notify-team.sh
./scripts/update-status-page.sh
./scripts/send-stakeholder-update.sh
```

## Post-Incident Review Process

### PIR Meeting Agenda
1. **Incident Overview** (5 minutes)
   - Timeline and impact summary
   - Key metrics and business impact

2. **Timeline Review** (15 minutes)
   - Detailed incident timeline
   - Response actions and decisions
   - Communication effectiveness

3. **Root Cause Analysis** (15 minutes)
   - Technical root cause
   - Contributing factors
   - Why incident wasn't prevented

4. **Response Evaluation** (10 minutes)
   - What went well
   - What could be improved
   - Process gaps identified

5. **Action Items** (10 minutes)
   - Immediate fixes needed
   - Process improvements
   - Preventive measures
   - Ownership and timelines

6. **Follow-up** (5 minutes)
   - Action item tracking
   - Next review date
   - Documentation updates

### PIR Documentation Template
```markdown
# Post-Incident Review: [Incident ID]

## Incident Summary
- **Date**: [Date and time]
- **Duration**: [Total duration]
- **Severity**: [P1/P2/P3/P4]
- **Impact**: [Description of impact]

## Timeline
| Time | Event | Action Taken |
|------|-------|--------------|
| 14:30 | Alert triggered | Investigation started |
| 14:35 | Root cause identified | Fix implementation began |
| 14:50 | Fix deployed | Monitoring for recovery |
| 15:00 | Full recovery confirmed | Incident resolved |

## Root Cause
[Detailed explanation of what caused the incident]

## What Went Well
- [List of things that worked well during response]

## What Could Be Improved
- [List of areas for improvement]

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Fix monitoring gap | DevOps | 2024-01-20 | Open |
| Update runbook | SysAdmin | 2024-01-18 | Open |

## Lessons Learned
[Key takeaways and lessons learned]
```

## Continuous Improvement

### Regular Reviews
- **Monthly**: Review incident trends and patterns
- **Quarterly**: Update playbook and procedures
- **Annually**: Comprehensive incident response assessment

### Training and Drills
- **Monthly**: Team training on new procedures
- **Quarterly**: Incident response drills
- **Annually**: Full disaster recovery exercise

### Metrics and KPIs
- **MTTR**: Mean Time To Resolution
- **MTTD**: Mean Time To Detection
- **Incident Frequency**: Number of incidents per month
- **Customer Impact**: Duration and scope of customer impact

---

*This incident response playbook should be reviewed and updated quarterly to ensure it remains effective and current with system changes and lessons learned.*