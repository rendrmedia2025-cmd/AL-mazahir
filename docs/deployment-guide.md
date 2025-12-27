# Al Mazahir Trading - Deployment Guide

## Overview

This guide covers the complete deployment process for the Al Mazahir Trading platform, including environment setup, CI/CD pipeline configuration, and production deployment procedures.

## Environment Architecture

### Production Environment
- **Frontend & API**: Vercel (Next.js deployment)
- **Database**: Supabase (PostgreSQL)
- **CDN**: Vercel Edge Network
- **Monitoring**: Integrated monitoring services
- **Domain**: `https://almazahir.com`

### Staging Environment
- **Frontend & API**: Vercel Preview Deployments
- **Database**: Supabase Staging Project
- **Domain**: `https://staging.almazahir.com`

### Development Environment
- **Frontend & API**: Local Next.js server
- **Database**: Local Supabase (Docker) or Remote Development DB
- **Domain**: `http://localhost:3000`

## Prerequisites

### Required Accounts and Services
1. **GitHub Account**: Source code repository
2. **Vercel Account**: Frontend and API hosting
3. **Supabase Account**: Database and authentication
4. **Domain Registrar**: Custom domain management

### Required Tools
- **Node.js**: Version 18.x or higher
- **npm/yarn**: Package manager
- **Git**: Version control
- **Supabase CLI**: Database management
- **Vercel CLI**: Deployment management (optional)

## Initial Setup

### 1. Repository Setup

#### Clone Repository
```bash
git clone https://github.com/your-org/almazahir-trading.git
cd almazahir-trading
```

#### Install Dependencies
```bash
npm install
# or
yarn install
```

#### Environment Configuration
Create environment files for each environment:

**.env.local** (Development)
```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# External Services
WHATSAPP_BUSINESS_TOKEN=your-whatsapp-token
EMAIL_SERVICE_API_KEY=your-email-api-key

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_TESTIMONIALS=true

# Monitoring
MONITORING_API_KEY=your-monitoring-key
```

**.env.production** (Production)
```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key

# Authentication
NEXTAUTH_SECRET=your-secure-nextauth-secret
NEXTAUTH_URL=https://almazahir.com

# External Services
WHATSAPP_BUSINESS_TOKEN=your-prod-whatsapp-token
EMAIL_SERVICE_API_KEY=your-prod-email-api-key

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_TESTIMONIALS=true

# Monitoring
MONITORING_API_KEY=your-prod-monitoring-key
```

### 2. Database Setup

#### Supabase Project Creation
1. Create new Supabase project
2. Note the project URL and API keys
3. Configure authentication settings
4. Set up row-level security policies

#### Database Migration
```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Seed initial data (optional)
supabase db seed
```

#### Database Schema Verification
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies;
```

### 3. Vercel Deployment Setup

#### Project Configuration
1. Connect GitHub repository to Vercel
2. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

#### Environment Variables
Configure in Vercel dashboard:
- Production environment variables
- Preview environment variables
- Development environment variables

#### Domain Configuration
1. Add custom domain in Vercel
2. Configure DNS records:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

## CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/ci-cd.yml**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  test:
    name: Test and Build
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run type checking
        run: npm run type-check
        
      - name: Run unit tests
        run: npm run test
        
      - name: Run property-based tests
        run: npm run test:property
        
      - name: Build application
        run: npm run build
        
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: .next/
          
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Run security audit
        run: npm audit --audit-level high
        
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
          
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
          
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: ${{ secrets.VERCEL_ORG_ID }}
          
      - name: Run post-deployment tests
        run: |
          npm run test:e2e:production
          
      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: 'Production deployment successful!'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Deployment Scripts

**scripts/deploy.js**
```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

const environment = process.argv[2] || 'staging';

console.log(`🚀 Deploying to ${environment}...`);

// Pre-deployment checks
console.log('📋 Running pre-deployment checks...');
execSync('npm run lint', { stdio: 'inherit' });
execSync('npm run type-check', { stdio: 'inherit' });
execSync('npm run test', { stdio: 'inherit' });

// Build application
console.log('🔨 Building application...');
execSync('npm run build', { stdio: 'inherit' });

// Deploy based on environment
if (environment === 'production') {
  console.log('🌟 Deploying to production...');
  execSync('vercel --prod', { stdio: 'inherit' });
} else {
  console.log('🧪 Deploying to staging...');
  execSync('vercel', { stdio: 'inherit' });
}

// Post-deployment verification
console.log('✅ Running post-deployment verification...');
execSync(`npm run test:e2e:${environment}`, { stdio: 'inherit' });

console.log('🎉 Deployment completed successfully!');
```

## Deployment Procedures

### Development Deployment

#### Local Development
```bash
# Start development server
npm run dev

# Run with specific environment
NODE_ENV=development npm run dev

# Enable debug mode
DEBUG=* npm run dev
```

#### Feature Branch Deployment
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to GitHub (triggers preview deployment)
git push origin feature/new-feature
```

### Staging Deployment

#### Automatic Deployment
- Push to `develop` branch triggers automatic staging deployment
- Preview URL provided in GitHub PR comments
- Staging environment uses staging database

#### Manual Staging Deployment
```bash
# Deploy to staging
npm run deploy:staging

# Or using Vercel CLI
vercel --target staging
```

### Production Deployment

#### Pre-Production Checklist
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Database migrations tested
- [ ] Backup completed
- [ ] Rollback plan prepared

#### Production Deployment Process
```bash
# 1. Merge to main branch
git checkout main
git merge develop
git push origin main

# 2. Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 3. Automatic deployment triggered via GitHub Actions
# 4. Monitor deployment in Vercel dashboard
# 5. Verify deployment with smoke tests
```

#### Manual Production Deployment
```bash
# Deploy to production (if needed)
npm run deploy:production

# Or using Vercel CLI
vercel --prod
```

## Database Migrations

### Migration Process

#### Development Migrations
```bash
# Create new migration
supabase migration new add_new_feature

# Edit migration file
# supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql

# Apply migration locally
supabase db reset

# Test migration
npm run test:db
```

#### Production Migrations
```bash
# Apply to staging first
supabase db push --project-ref staging-project-ref

# Test staging thoroughly
npm run test:e2e:staging

# Apply to production
supabase db push --project-ref production-project-ref

# Verify production
npm run test:e2e:production
```

### Migration Best Practices
1. **Always test migrations in staging first**
2. **Create rollback migrations for destructive changes**
3. **Use transactions for complex migrations**
4. **Backup database before major migrations**
5. **Monitor performance impact of migrations**

## Monitoring and Health Checks

### Health Check Endpoints
- **Application Health**: `/api/health`
- **Database Health**: `/api/health/database`
- **External Services**: `/api/health/external`

### Monitoring Setup

#### Application Monitoring
```javascript
// lib/monitoring.js
export const healthCheck = async () => {
  const checks = {
    database: await checkDatabase(),
    api: await checkAPI(),
    external: await checkExternalServices()
  };
  
  return {
    status: Object.values(checks).every(c => c.healthy) ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  };
};
```

#### Alerting Configuration
```yaml
# monitoring/alerts.yml
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 0.05"
    severity: "critical"
    channels: ["email", "slack"]
    
  - name: "Slow Response Time"
    condition: "avg_response_time > 3000"
    severity: "warning"
    channels: ["slack"]
    
  - name: "Database Connection Issues"
    condition: "db_connection_errors > 0"
    severity: "critical"
    channels: ["email", "slack", "sms"]
```

## Rollback Procedures

### Automatic Rollback
```bash
# Rollback to previous deployment
vercel rollback

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Manual Rollback Process
1. **Identify Issue**: Determine the scope and impact
2. **Stop Traffic**: Use feature flags to disable problematic features
3. **Database Rollback**: If needed, restore from backup
4. **Code Rollback**: Revert to previous stable version
5. **Verification**: Confirm system stability
6. **Communication**: Notify stakeholders

### Rollback Script
```bash
#!/bin/bash
# scripts/rollback.sh

DEPLOYMENT_ID=$1

if [ -z "$DEPLOYMENT_ID" ]; then
  echo "Usage: ./rollback.sh <deployment-id>"
  exit 1
fi

echo "🔄 Rolling back to deployment: $DEPLOYMENT_ID"

# Rollback deployment
vercel rollback $DEPLOYMENT_ID

# Verify rollback
echo "✅ Verifying rollback..."
curl -f https://almazahir.com/api/health || exit 1

echo "🎉 Rollback completed successfully!"
```

## Security Considerations

### Deployment Security
- **Environment Variables**: Never commit secrets to repository
- **Access Control**: Limit deployment access to authorized personnel
- **Audit Logging**: Log all deployment activities
- **Vulnerability Scanning**: Regular security scans

### Production Security
- **HTTPS Only**: Enforce HTTPS for all traffic
- **Security Headers**: Implement security headers
- **Rate Limiting**: Protect against abuse
- **Input Validation**: Validate all user inputs

## Performance Optimization

### Build Optimization
```javascript
// next.config.js
module.exports = {
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif']
  },
  
  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  }
};
```

### Caching Strategy
- **Static Assets**: Long-term caching with versioning
- **API Responses**: Short-term caching with ISR
- **Database Queries**: Connection pooling and query optimization

## Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Check build logs
vercel logs

# Local build test
npm run build

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### Environment Variable Issues
```bash
# Verify environment variables
vercel env ls

# Add missing variables
vercel env add VARIABLE_NAME

# Pull environment variables locally
vercel env pull .env.local
```

#### Database Connection Issues
```bash
# Test database connection
supabase db ping

# Check connection string
echo $NEXT_PUBLIC_SUPABASE_URL

# Verify RLS policies
supabase db inspect
```

### Emergency Procedures
1. **System Down**: Immediate rollback to last known good deployment
2. **Database Issues**: Switch to read-only mode, restore from backup
3. **Security Breach**: Disable affected features, rotate secrets
4. **Performance Issues**: Enable caching, scale resources

## Maintenance

### Regular Maintenance Tasks
- **Weekly**: Review deployment logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and update deployment procedures

### Backup Procedures
- **Database**: Automated daily backups via Supabase
- **Code**: Git repository with multiple remotes
- **Configuration**: Environment variables backed up securely

---

*This deployment guide should be reviewed and updated with each major release or infrastructure change.*