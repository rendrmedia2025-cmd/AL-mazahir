# Al Mazahir Trading - Troubleshooting Guide

## Quick Reference

### Emergency Contacts
- **System Administrator**: admin@almazahir.com
- **Technical Support**: tech-support@almazahir.com
- **Emergency Hotline**: +966-XXX-XXXX

### System Status
- **Health Check**: `/admin/monitoring/health`
- **Performance Metrics**: `/admin/monitoring/performance`
- **Error Logs**: `/admin/monitoring/errors`

## Common Issues and Solutions

### Authentication Issues

#### Problem: Cannot Login to Admin Panel
**Symptoms**: Login page shows error, credentials rejected
**Immediate Actions**:
1. Verify credentials are correct (check caps lock)
2. Clear browser cache and cookies
3. Try incognito/private browsing mode
4. Check if account is active in user management

**Advanced Troubleshooting**:
1. Check browser console for JavaScript errors
2. Verify network connectivity
3. Test from different device/network
4. Check if IP is blocked in security settings

**Resolution Steps**:
```bash
# Check user status in database
SELECT id, email, is_active, last_login FROM admin_profiles WHERE email = 'user@example.com';

# Reset user session if needed
DELETE FROM auth.sessions WHERE user_id = 'user-id';
```

#### Problem: Session Expires Too Quickly
**Symptoms**: Frequent logouts, session timeout errors
**Solution**:
1. Check session timeout settings in admin panel
2. Verify browser is not blocking cookies
3. Ensure stable internet connection
4. Contact admin to adjust session duration

### Availability Management Issues

#### Problem: Status Updates Not Reflecting on Website
**Symptoms**: Admin shows updated status, website shows old status
**Immediate Actions**:
1. Wait 5 minutes for ISR cache refresh
2. Check if update was saved successfully
3. Verify category is active
4. Clear browser cache

**Advanced Troubleshooting**:
1. Check ISR revalidation logs
2. Verify API endpoint responses
3. Test direct API calls
4. Check CDN cache status

**Resolution Steps**:
```bash
# Force ISR revalidation
curl -X POST "https://your-domain.com/api/revalidate?secret=your-secret&path=/api/availability"

# Check availability API directly
curl "https://your-domain.com/api/availability"
```

#### Problem: Bulk Operations Failing
**Symptoms**: Some categories update, others don't
**Solution**:
1. Check individual category permissions
2. Verify all selected categories exist
3. Look for validation errors in logs
4. Try updating categories individually

### Lead Management Issues

#### Problem: Leads Not Appearing in Admin Panel
**Symptoms**: Form submissions successful, no leads in admin
**Immediate Actions**:
1. Check form submission logs
2. Verify database connectivity
3. Check email notifications
4. Review lead filters and date ranges

**Advanced Troubleshooting**:
1. Check database lead table directly
2. Verify API endpoint functionality
3. Test form submission manually
4. Check for JavaScript errors

**Resolution Steps**:
```sql
-- Check recent leads in database
SELECT * FROM enhanced_leads ORDER BY created_at DESC LIMIT 10;

-- Check for failed submissions
SELECT * FROM audit_log WHERE action = 'lead_submission_failed' ORDER BY created_at DESC;
```

#### Problem: Export Functionality Not Working
**Symptoms**: Export button doesn't work, empty files downloaded
**Solution**:
1. Ensure leads are selected for export
2. Check browser popup blockers
3. Try different export format (CSV vs Excel)
4. Clear browser cache and retry

### Performance Issues

#### Problem: Admin Panel Loading Slowly
**Symptoms**: Pages take long to load, timeouts
**Immediate Actions**:
1. Check internet connection speed
2. Close unnecessary browser tabs
3. Clear browser cache
4. Try different browser

**Advanced Troubleshooting**:
1. Check server resource usage
2. Monitor database query performance
3. Review API response times
4. Check CDN performance

**Performance Monitoring**:
```bash
# Check server resources
top -p $(pgrep node)

# Monitor database connections
SELECT count(*) FROM pg_stat_activity;

# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s "https://your-domain.com/api/admin/dashboard-stats"
```

#### Problem: Website Performance Degraded
**Symptoms**: Slow page loads, poor Lighthouse scores
**Solution**:
1. Check Core Web Vitals in monitoring
2. Review recent changes
3. Check for JavaScript errors
4. Monitor server resources

### Content Management Issues

#### Problem: Content Updates Not Saving
**Symptoms**: Changes revert after saving
**Immediate Actions**:
1. Check for validation errors
2. Verify user permissions
3. Ensure required fields are filled
4. Try saving smaller changes

**Advanced Troubleshooting**:
1. Check browser console for errors
2. Verify API endpoints are responding
3. Check database write permissions
4. Review audit logs for failed updates

### Feature Flag Issues

#### Problem: Feature Flags Not Working
**Symptoms**: Features not enabling/disabling as expected
**Solution**:
1. Check flag configuration
2. Verify user is in target audience
3. Clear application cache
4. Check flag evaluation logs

#### Problem: Gradual Rollout Not Working
**Symptoms**: All users see feature or none do
**Solution**:
1. Verify percentage settings
2. Check user segmentation logic
3. Review flag evaluation code
4. Test with different user accounts

### Monitoring and Alerts

#### Problem: Alerts Not Firing
**Symptoms**: Issues occurring but no notifications
**Solution**:
1. Check alert configuration
2. Verify notification channels
3. Test alert conditions manually
4. Check alert service status

#### Problem: False Positive Alerts
**Symptoms**: Too many unnecessary alerts
**Solution**:
1. Adjust alert thresholds
2. Add alert conditions
3. Implement alert suppression
4. Review alert logic

### Database Issues

#### Problem: Database Connection Errors
**Symptoms**: "Database unavailable" errors
**Immediate Actions**:
1. Check Supabase dashboard status
2. Verify connection strings
3. Check network connectivity
4. Review connection pool settings

**Resolution Steps**:
```bash
# Test database connectivity
psql "postgresql://user:pass@host:port/db" -c "SELECT 1;"

# Check connection pool status
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

#### Problem: Slow Database Queries
**Symptoms**: Timeouts, slow admin panel
**Solution**:
1. Check query performance in logs
2. Review database indexes
3. Optimize slow queries
4. Consider query caching

### Security Issues

#### Problem: Suspicious Activity Detected
**Symptoms**: Security alerts, unusual login patterns
**Immediate Actions**:
1. Check security logs
2. Review recent user activity
3. Check for failed login attempts
4. Verify IP addresses

**Security Response**:
```sql
-- Check recent failed logins
SELECT * FROM audit_log WHERE action = 'login_failed' ORDER BY created_at DESC;

-- Review suspicious IP addresses
SELECT ip_address, count(*) FROM audit_log 
WHERE created_at > NOW() - INTERVAL '24 hours' 
GROUP BY ip_address ORDER BY count DESC;
```

#### Problem: Rate Limiting Issues
**Symptoms**: API calls being blocked
**Solution**:
1. Check rate limit configuration
2. Review API usage patterns
3. Implement proper retry logic
4. Consider increasing limits

## Diagnostic Tools

### Health Check Script
```bash
#!/bin/bash
# health-check.sh
echo "Checking system health..."

# Check website availability
curl -f https://your-domain.com/ || echo "Website down"

# Check admin panel
curl -f https://your-domain.com/admin/login || echo "Admin panel down"

# Check API endpoints
curl -f https://your-domain.com/api/availability || echo "Availability API down"

# Check database
psql $DATABASE_URL -c "SELECT 1;" || echo "Database connection failed"

echo "Health check complete"
```

### Performance Test Script
```bash
#!/bin/bash
# performance-test.sh
echo "Running performance tests..."

# Test page load times
curl -w "Total time: %{time_total}s\n" -o /dev/null -s https://your-domain.com/

# Test API response times
curl -w "API response: %{time_total}s\n" -o /dev/null -s https://your-domain.com/api/availability

echo "Performance test complete"
```

### Log Analysis Commands
```bash
# Check error logs
tail -f /var/log/app/error.log

# Search for specific errors
grep -i "error" /var/log/app/app.log | tail -20

# Monitor real-time logs
journalctl -u your-app -f
```

## Escalation Procedures

### Level 1: Self-Service
1. Check this troubleshooting guide
2. Review system status page
3. Try basic troubleshooting steps
4. Check recent changes

### Level 2: Technical Support
Contact when:
- Basic troubleshooting doesn't resolve issue
- System-wide problems detected
- Data integrity concerns
- Security incidents

**Information to Provide**:
- Detailed problem description
- Steps already attempted
- Error messages and screenshots
- User account and timestamp
- Browser and device information

### Level 3: Emergency Response
Contact emergency hotline for:
- Complete system outage
- Security breaches
- Data loss incidents
- Critical business impact

## Prevention and Maintenance

### Daily Checks
- [ ] Review system health dashboard
- [ ] Check for new alerts
- [ ] Verify backup completion
- [ ] Monitor performance metrics

### Weekly Tasks
- [ ] Review security logs
- [ ] Check database performance
- [ ] Update availability status
- [ ] Export lead data backup

### Monthly Tasks
- [ ] Review user access permissions
- [ ] Update system documentation
- [ ] Performance optimization review
- [ ] Security audit

### Best Practices
1. **Regular Backups**: Ensure automated backups are working
2. **Monitor Alerts**: Don't ignore system alerts
3. **Update Documentation**: Keep troubleshooting steps current
4. **Test Procedures**: Regularly test backup and recovery procedures
5. **Security Reviews**: Conduct regular security assessments

---

*For issues not covered in this guide, contact technical support with detailed information about the problem.*