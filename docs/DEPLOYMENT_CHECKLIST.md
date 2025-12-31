# Deployment Checklist

Use this checklist before deploying Gear AI CoPilot to production.

## Pre-Deployment

### Code Quality

- [ ] All TypeScript errors resolved (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console.log statements in production code
- [ ] All TODO/FIXME comments addressed or tracked in issues
- [ ] Code has been peer reviewed
- [ ] Security scan completed (CodeQL or similar)

### Testing

- [ ] All unit tests pass (`npm test`)
- [ ] Integration tests pass (when implemented)
- [ ] Manual testing completed on:
  - [ ] iOS simulator/device
  - [ ] Android emulator/device
  - [ ] Web browsers (Chrome, Safari, Firefox)
- [ ] Accessibility testing completed
- [ ] Performance testing completed

### Environment Configuration

- [ ] Production environment variables configured
- [ ] API keys rotated and secured
- [ ] Database connection strings updated
- [ ] CORS origins configured correctly
- [ ] Rate limiting configured
- [ ] No sensitive data in source code
- [ ] `.env.production` template up to date

### Database

- [ ] All migrations tested on staging
- [ ] RLS (Row Level Security) policies enabled
- [ ] Database indexes optimized
- [ ] Backup strategy in place
- [ ] Connection pooling configured

### Third-Party Services

#### Firebase

- [ ] Production project created
- [ ] Authentication providers configured
- [ ] Security rules updated
- [ ] Analytics enabled
- [ ] Quota limits reviewed

#### Supabase

- [ ] Production project created
- [ ] Database migrated
- [ ] Storage buckets configured
- [ ] RLS policies enabled
- [ ] API rate limits configured
- [ ] Monitoring enabled

#### Stripe (if subscriptions enabled)

- [ ] Live mode keys configured
- [ ] Products and prices created
- [ ] Webhook endpoints configured
- [ ] Webhook signatures verified
- [ ] Test payments completed

#### OpenAI (if AI chat enabled)

- [ ] Production API key configured
- [ ] Usage limits set
- [ ] Rate limiting configured
- [ ] Cost monitoring enabled

### Security

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Content Security Policy (CSP) configured
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Input validation on all forms
- [ ] SQL injection prevention verified
- [ ] Dependency vulnerability scan completed
- [ ] Secrets not committed to repository
- [ ] API endpoints rate limited

### Monitoring & Analytics

- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring enabled
- [ ] Analytics configured (Mixpanel/GA)
- [ ] Uptime monitoring configured
- [ ] Log aggregation configured
- [ ] Alerts configured for critical errors

### Legal & Compliance

- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Cookie consent banner (if EU traffic)
- [ ] GDPR compliance verified
- [ ] CCPA compliance verified
- [ ] Age verification (13+ COPPA compliance)

### Documentation

- [ ] README.md updated
- [ ] API documentation current
- [ ] Deployment guide updated
- [ ] Environment setup documented
- [ ] Troubleshooting guide available
- [ ] Changelog updated

## Deployment Steps

### Web Deployment (Vercel/Netlify)

1. **Build Verification**
   ```bash
   npm run build
   # Verify dist/ directory created successfully
   ```

2. **Deploy to Staging**
   ```bash
   # Vercel
   vercel --prod=false
   
   # Netlify
   netlify deploy
   ```

3. **Test Staging Environment**
   - [ ] All pages load correctly
   - [ ] API calls successful
   - [ ] Authentication works
   - [ ] No console errors
   - [ ] Analytics tracking works

4. **Deploy to Production**
   ```bash
   # Vercel
   vercel --prod
   
   # Netlify
   netlify deploy --prod
   ```

5. **Verify Production**
   - [ ] Health check endpoint responds
   - [ ] Critical user flows work
   - [ ] Error tracking receives events
   - [ ] Analytics receives events

### Mobile Deployment (iOS/Android)

#### iOS App Store

1. **Prepare Build**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Pre-Submission Checklist**
   - [ ] App Store Connect account ready
   - [ ] Bundle ID registered
   - [ ] Provisioning profiles configured
   - [ ] App icons (all sizes)
   - [ ] Screenshots (all required sizes)
   - [ ] App description and keywords
   - [ ] Privacy Policy URL
   - [ ] Support URL
   - [ ] Age rating completed

3. **Submit to App Store**
   ```bash
   eas submit --platform ios --latest
   ```

4. **Post-Submission**
   - [ ] Monitor review status
   - [ ] Respond to Apple's questions promptly
   - [ ] Test downloaded app from TestFlight

#### Android Play Store

1. **Prepare Build**
   ```bash
   eas build --platform android --profile production
   ```

2. **Pre-Submission Checklist**
   - [ ] Google Play Console account ready
   - [ ] App signing key generated and secured
   - [ ] Application ID registered
   - [ ] App icons (all sizes)
   - [ ] Screenshots (all required sizes)
   - [ ] Feature graphic
   - [ ] App description and keywords
   - [ ] Privacy Policy URL
   - [ ] Content rating completed

3. **Submit to Play Store**
   ```bash
   eas submit --platform android --latest
   ```

4. **Post-Submission**
   - [ ] Monitor review status
   - [ ] Address any policy violations
   - [ ] Test downloaded app from Play Store

## Post-Deployment

### Immediate (First Hour)

- [ ] Monitor error tracking dashboard
- [ ] Check server logs for issues
- [ ] Monitor response times
- [ ] Verify analytics data flowing
- [ ] Check user feedback channels
- [ ] Test critical user flows in production

### First Day

- [ ] Review error rate metrics
- [ ] Monitor user engagement
- [ ] Check for performance regressions
- [ ] Review user feedback
- [ ] Monitor API usage and costs
- [ ] Verify backup systems working

### First Week

- [ ] Analyze user behavior patterns
- [ ] Review crash reports
- [ ] Monitor conversion funnel
- [ ] Check subscription sign-ups
- [ ] Gather user feedback
- [ ] Plan hotfix releases if needed

## Rollback Plan

If critical issues are discovered:

### Web

1. **Immediate Rollback**
   ```bash
   # Vercel - revert to previous deployment
   vercel rollback
   
   # Netlify - restore from deployment history
   netlify deploy --prod --dir=dist
   ```

2. **Communicate**
   - [ ] Notify users via status page
   - [ ] Update social media
   - [ ] Email affected users (if applicable)

### Mobile

1. **Critical Issues**
   - Submit emergency update to app stores
   - Use Expo Updates for immediate fixes (if configured)
   - Consider temporary removal if severe

2. **Communicate**
   - [ ] Update app store description with known issues
   - [ ] Push notification to users (if severe)
   - [ ] Social media announcement

## Emergency Contacts

- **DevOps Lead**: [Name/Email]
- **Backend Engineer**: [Name/Email]
- **Database Admin**: [Name/Email]
- **Security Contact**: [Name/Email]
- **On-Call Engineer**: [Phone/Pager]

## Service Status Pages

- Supabase: https://status.supabase.com
- Vercel: https://www.vercel-status.com
- Firebase: https://status.firebase.google.com
- Stripe: https://status.stripe.com
- OpenAI: https://status.openai.com

## Notes

- Keep this checklist updated as deployment process evolves
- Document any issues encountered during deployment
- Review and improve process after each deployment

---

**Last Updated**: December 31, 2024  
**Version**: 1.0.0
