#!/usr/bin/env node

/**
 * Infrastructure Validation Script
 * Validates that enterprise infrastructure components are properly configured
 * Requirements: 11.1, 12.3, 14.1
 */

const fs = require('fs')
const path = require('path')

function validateInfrastructure() {
  console.log('🔍 Validating Enterprise Infrastructure Foundation...')
  
  const results = {
    nextjsConfig: false,
    packageJson: false,
    envExample: false,
    middleware: false,
    logger: false,
    supabaseMiddleware: false,
    cicdPipeline: false,
    databaseMigration: false,
    lighthouseConfig: false,
    eslintSecurity: false,
    deploymentScripts: false,
    issues: []
  }
  
  // Check Next.js configuration
  try {
    const nextConfig = fs.readFileSync('next.config.ts', 'utf8')
    const hasEnterpriseGrade = nextConfig.toLowerCase().includes('enterprise-grade')
    const hasPoweredByHeader = nextConfig.includes('poweredByHeader: false')
    if (hasEnterpriseGrade && hasPoweredByHeader) {
      results.nextjsConfig = true
      console.log('✅ Next.js enterprise configuration')
    } else {
      results.issues.push('Next.js configuration missing enterprise features')
    }
  } catch (error) {
    results.issues.push('Next.js configuration file not found')
  }
  
  // Check package.json
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    if (packageJson.name === 'enterprise-dynamic-platform' && 
        packageJson.dependencies.winston && 
        packageJson.dependencies.bcrypt) {
      results.packageJson = true
      console.log('✅ Package.json enterprise dependencies')
    } else {
      results.issues.push('Package.json missing enterprise dependencies')
    }
  } catch (error) {
    results.issues.push('Package.json validation failed')
  }
  
  // Check environment configuration
  try {
    const envExample = fs.readFileSync('.env.local.example', 'utf8')
    if (envExample.includes('Enterprise Dynamic Platform') && 
        envExample.includes('JWT_SECRET') && 
        envExample.includes('SENTRY_DSN')) {
      results.envExample = true
      console.log('✅ Environment configuration template')
    } else {
      results.issues.push('Environment configuration incomplete')
    }
  } catch (error) {
    results.issues.push('Environment configuration file not found')
  }
  
  // Check middleware
  try {
    const middleware = fs.readFileSync('middleware.ts', 'utf8')
    if (middleware.includes('applyRateLimit') && 
        middleware.includes('applySecurityHeaders') && 
        middleware.includes('logSecurityEvent')) {
      results.middleware = true
      console.log('✅ Enterprise middleware with security features')
    } else {
      results.issues.push('Middleware missing enterprise security features')
    }
  } catch (error) {
    results.issues.push('Middleware file not found')
  }
  
  // Check logger
  try {
    const logger = fs.readFileSync('src/lib/logger.ts', 'utf8')
    if (logger.includes('EnterpriseLogger') && 
        logger.includes('sanitizeLogEntry') && 
        logger.includes('DailyRotateFile')) {
      results.logger = true
      console.log('✅ Enterprise logging system')
    } else {
      results.issues.push('Logger missing enterprise features')
    }
  } catch (error) {
    results.issues.push('Logger file not found')
  }
  
  // Check Supabase middleware
  try {
    const supabaseMiddleware = fs.readFileSync('src/lib/supabase/middleware.ts', 'utf8')
    if (supabaseMiddleware.includes('handleSessionSecurity') && 
        supabaseMiddleware.includes('checkSuspiciousActivity')) {
      results.supabaseMiddleware = true
      console.log('✅ Enhanced Supabase middleware')
    } else {
      results.issues.push('Supabase middleware missing security features')
    }
  } catch (error) {
    results.issues.push('Supabase middleware file not found')
  }
  
  // Check CI/CD pipeline
  try {
    const cicd = fs.readFileSync('.github/workflows/ci-cd.yml', 'utf8')
    if (cicd.includes('Enterprise CI/CD Pipeline') && 
        cicd.includes('security-scan') && 
        cicd.includes('performance-test')) {
      results.cicdPipeline = true
      console.log('✅ Enterprise CI/CD pipeline')
    } else {
      results.issues.push('CI/CD pipeline missing enterprise features')
    }
  } catch (error) {
    results.issues.push('CI/CD pipeline file not found')
  }
  
  // Check database migration
  try {
    const migration = fs.readFileSync('supabase/migrations/009_enterprise_infrastructure.sql', 'utf8')
    if (migration.includes('operational_areas') && 
        migration.includes('trust_indicators') && 
        migration.includes('security_events')) {
      results.databaseMigration = true
      console.log('✅ Enterprise database migration')
    } else {
      results.issues.push('Database migration missing enterprise tables')
    }
  } catch (error) {
    results.issues.push('Database migration file not found')
  }
  
  // Check Lighthouse configuration
  try {
    const lighthouse = fs.readFileSync('lighthouse.config.js', 'utf8')
    if (lighthouse.includes('Enterprise Performance Monitoring') && 
        lighthouse.includes('categories:performance')) {
      results.lighthouseConfig = true
      console.log('✅ Lighthouse performance configuration')
    } else {
      results.issues.push('Lighthouse configuration incomplete')
    }
  } catch (error) {
    results.issues.push('Lighthouse configuration file not found')
  }
  
  // Check ESLint security configuration
  try {
    const eslintSecurity = fs.readFileSync('.eslintrc.security.js', 'utf8')
    if (eslintSecurity.includes('plugin:security/recommended') && 
        eslintSecurity.includes('security/detect-object-injection')) {
      results.eslintSecurity = true
      console.log('✅ ESLint security configuration')
    } else {
      results.issues.push('ESLint security configuration incomplete')
    }
  } catch (error) {
    results.issues.push('ESLint security configuration file not found')
  }
  
  // Check deployment scripts
  const deploymentScripts = [
    'scripts/create-deployment-record.js',
    'scripts/setup-monitoring-alerts.js',
    'scripts/verify-monitoring.js'
  ]
  
  let scriptsFound = 0
  for (const script of deploymentScripts) {
    try {
      const content = fs.readFileSync(script, 'utf8')
      if (content.includes('Enterprise') || content.includes('Requirements:')) {
        scriptsFound++
      }
    } catch (error) {
      // Script not found
    }
  }
  
  if (scriptsFound === deploymentScripts.length) {
    results.deploymentScripts = true
    console.log('✅ Enterprise deployment scripts')
  } else {
    results.issues.push(`Only ${scriptsFound}/${deploymentScripts.length} deployment scripts found`)
  }
  
  // Generate report
  console.log('\n📊 Infrastructure Validation Report:')
  console.log('=====================================')
  
  const components = [
    { name: 'Next.js Configuration', status: results.nextjsConfig },
    { name: 'Package Dependencies', status: results.packageJson },
    { name: 'Environment Template', status: results.envExample },
    { name: 'Security Middleware', status: results.middleware },
    { name: 'Enterprise Logger', status: results.logger },
    { name: 'Supabase Middleware', status: results.supabaseMiddleware },
    { name: 'CI/CD Pipeline', status: results.cicdPipeline },
    { name: 'Database Migration', status: results.databaseMigration },
    { name: 'Performance Config', status: results.lighthouseConfig },
    { name: 'Security Linting', status: results.eslintSecurity },
    { name: 'Deployment Scripts', status: results.deploymentScripts }
  ]
  
  let passedCount = 0
  components.forEach(component => {
    const status = component.status ? '✅' : '❌'
    console.log(`${status} ${component.name}`)
    if (component.status) passedCount++
  })
  
  console.log(`\nScore: ${passedCount}/${components.length} components configured`)
  
  if (results.issues.length > 0) {
    console.log('\n⚠️  Issues Found:')
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`)
    })
  }
  
  if (passedCount >= 8) {
    console.log('\n🎉 Enterprise Infrastructure Foundation successfully configured!')
    console.log('Ready for enterprise-grade deployment and operations.')
    return true
  } else {
    console.log('\n❌ Infrastructure validation failed. Please address the issues above.')
    return false
  }
}

if (require.main === module) {
  const success = validateInfrastructure()
  process.exit(success ? 0 : 1)
}

module.exports = { validateInfrastructure }