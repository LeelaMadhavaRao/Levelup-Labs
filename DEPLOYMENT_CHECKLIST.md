# 🚀 Levelup-Labs - Deployment Checklist

Use this checklist before deploying to production.

---

## 📋 Pre-Deployment (Before Going Live)

### Database & Security
- [ ] All RLS policies are active
- [ ] Admin default password changed
- [ ] Service role key secured
- [ ] Database backups enabled
- [ ] Row security policies tested
- [ ] Users can't access others' data
- [ ] Admins can only manage their courses

### Environment Variables
- [ ] Production Supabase project created
- [ ] NEXT_PUBLIC_SUPABASE_URL set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set
- [ ] GEMINI_API_KEY in Supabase Secrets
- [ ] No keys in version control
- [ ] .env.local in .gitignore

### Code Quality
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] No console.log or debug statements
- [ ] All error handling implemented
- [ ] Form validation complete
- [ ] Input sanitization in place
- [ ] No hardcoded URLs or keys

### Frontend Testing
- [ ] Login/signup works
- [ ] Admin creation works
- [ ] Course creation works
- [ ] Quiz generation works
- [ ] Code submission works
- [ ] Leaderboard updates correctly
- [ ] Points awarded correctly
- [ ] Mobile responsive verified

### Performance
- [ ] Page load time < 3 seconds
- [ ] Database queries optimized
- [ ] Images optimized
- [ ] Code splitting verified
- [ ] No unused dependencies
- [ ] Bundle size acceptable

### Deployment Platforms

#### If Deploying to Vercel
- [ ] GitHub repo connected
- [ ] Environment variables added
- [ ] Build succeeds (`npm run build`)
- [ ] Deployment preview works
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active

#### If Deploying Elsewhere
- [ ] Node version matches (18+)
- [ ] Build script works
- [ ] Start script works
- [ ] Environment vars set in host
- [ ] Database accessible from host
- [ ] CORS configured if needed

---

## 🔐 Security Checklist

### API Keys & Secrets
- [ ] Gemini API key in Supabase Secrets only
- [ ] Anon key is truly public (safe)
- [ ] Service role key never in code
- [ ] No API keys in logs
- [ ] Rotation plan established

### Database Security
- [ ] All tables have RLS enabled
- [ ] Policies prevent unauthorized access
- [ ] Users isolated to their own data
- [ ] Admins can only modify their courses
- [ ] Service role permissions limited
- [ ] Public tables truly public only

### Code Security
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React sanitization)
- [ ] CSRF tokens if forms present
- [ ] Rate limiting on API calls
- [ ] Input validation on all forms
- [ ] Error messages don't leak info

### User Data
- [ ] Password hashing verified (Supabase Auth)
- [ ] Personal data protected
- [ ] Deleted accounts cleaned up
- [ ] Export user data functionality
- [ ] Privacy policy accessible
- [ ] Terms of service accessible

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] Admin can create course
- [ ] Admin can add modules/topics
- [ ] User can register for course
- [ ] User can watch video
- [ ] User can take quiz
- [ ] User can submit code
- [ ] Points awarded correctly
- [ ] Leaderboard ranks correctly
- [ ] Profile updates work

### Edge Case Testing
- [ ] User with no courses
- [ ] Course with no modules
- [ ] Quiz with no responses
- [ ] Zero points earned
- [ ] Deleted course handling
- [ ] Network error handling
- [ ] Concurrent submissions

### Security Testing
- [ ] Can't access admin without role
- [ ] Can't edit others' profiles
- [ ] Can't see others' solutions
- [ ] Can't modify own points
- [ ] RLS prevents unauthorized access
- [ ] API keys not exposed

### Performance Testing
- [ ] 100 users simultaneous
- [ ] 1000 courses in database
- [ ] Large code submissions
- [ ] Multiple concurrent quizzes
- [ ] Leaderboard with 10k users

---

## 🔄 Database Migrations

### Before First Deployment
- [ ] Run `001_initial_schema.sql`
- [ ] Verify 9 tables created
- [ ] Run `002_rls_policies.sql`
- [ ] Verify policies active
- [ ] Run `003_initial_admin.sql`
- [ ] Verify admin user created
- [ ] Test with sample data

### For Future Updates
- [ ] Create new migration file
- [ ] Name: `004_[feature_name].sql`
- [ ] Test in dev environment first
- [ ] Document changes
- [ ] Have rollback plan
- [ ] Deploy during low traffic

---

## 📊 Monitoring Setup

### Logs & Analytics
- [ ] Supabase logs accessible
- [ ] Error logging enabled
- [ ] Performance monitoring enabled
- [ ] User behavior analytics (optional)
- [ ] Crash reporting setup

### Alerts
- [ ] Database connection errors
- [ ] High API error rates
- [ ] Unusual traffic spikes
- [ ] Failed authentication attempts
- [ ] Server memory/CPU alerts

---

## 📱 Browser & Device Testing

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Mobile viewport (375px width)
- [ ] Tablet viewport (768px width)

### Features Tested
- [ ] Navigation works
- [ ] Forms are usable
- [ ] Code editor functional
- [ ] Leaderboard scrollable
- [ ] Dropdowns accessible
- [ ] Touch interactions work

---

## ♿ Accessibility Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient (WCAG AA)
- [ ] Form labels present
- [ ] Error messages clear
- [ ] Focus visible
- [ ] Images have alt text
- [ ] No auto-playing audio/video

---

## 📈 Performance Optimization

### Frontend
- [ ] Images compressed/optimized
- [ ] Code split by route
- [ ] Lazy loading implemented
- [ ] CSS minified
- [ ] JavaScript minified
- [ ] Unused CSS removed
- [ ] Bundle analysis done

### Backend
- [ ] Database indexes optimized
- [ ] Queries use indexes
- [ ] N+1 query problems fixed
- [ ] Caching implemented where needed
- [ ] Edge Functions fast
- [ ] No memory leaks

---

## 🚨 Deployment Runbook

### Pre-Deployment Checklist (Day Before)
1. [ ] All tests passing
2. [ ] Code reviewed
3. [ ] Database backup created
4. [ ] Deployment plan written
5. [ ] Rollback plan ready

### Deployment Day
1. [ ] Maintenance window scheduled
2. [ ] Team notified
3. [ ] Build verified
4. [ ] Environment vars checked
5. [ ] Database migrations ready

### During Deployment
1. [ ] Enable maintenance mode (optional)
2. [ ] Deploy code
3. [ ] Run database migrations
4. [ ] Verify deployment
5. [ ] Run smoke tests
6. [ ] Monitor error logs

### Post-Deployment (24 Hours)
1. [ ] Monitor error rates
2. [ ] Check performance metrics
3. [ ] Verify user features work
4. [ ] Monitor database performance
5. [ ] Check log files

### Rollback Plan (If Needed)
1. [ ] Revert to previous version
2. [ ] Restore database if needed
3. [ ] Clear any caches
4. [ ] Notify users
5. [ ] Document incident

---

## 📞 Incident Response

### During Outage
- [ ] Notify team immediately
- [ ] Check error logs
- [ ] Check Supabase status
- [ ] Determine root cause
- [ ] Implement fix or rollback
- [ ] Notify users if needed

### Post-Incident
- [ ] Document what happened
- [ ] Implement prevention
- [ ] Update monitoring/alerts
- [ ] Write postmortem
- [ ] Share learnings with team

---

## 🎉 Launch Day

### Final Checks
- [ ] All documentation complete
- [ ] Support team trained
- [ ] Admin password changed
- [ ] Terms & Privacy ready
- [ ] Contact info on site
- [ ] Feedback mechanism ready

### Marketing/Announcement
- [ ] Announce to users
- [ ] Share on social media
- [ ] Send email notification
- [ ] Update status page
- [ ] Prepare FAQ

### Monitoring
- [ ] Watch error dashboard
- [ ] Monitor user feedback
- [ ] Track signup rate
- [ ] Monitor performance
- [ ] Be ready to support

---

## 📅 Post-Launch (First Week)

- [ ] Daily error log review
- [ ] Daily performance check
- [ ] Monitor user feedback
- [ ] Fix critical bugs immediately
- [ ] Document found issues
- [ ] Plan hotfixes if needed
- [ ] Schedule follow-up review

---

## 📊 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---|
| Uptime | > 99.5% | Monitoring tool |
| Page Load | < 3s | Lighthouse |
| Error Rate | < 0.1% | Error logs |
| User Signups | > 10/day | Analytics |
| Course Completions | > 5/week | Database |
| API Response | < 200ms | Logs |

---

## 🔄 Maintenance Schedule

### Daily
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Review user feedback

### Weekly
- [ ] Database backup verification
- [ ] Security scanning
- [ ] Performance analysis
- [ ] Update dependencies (if needed)

### Monthly
- [ ] Full security audit
- [ ] Performance optimization
- [ ] User feedback review
- [ ] Plan new features

### Quarterly
- [ ] Database optimization
- [ ] Code refactoring
- [ ] Architecture review
- [ ] Roadmap planning

---

## 📋 Sign-Off

**Before deploying to production, please confirm:**

```
Prepared by: ________________
Reviewed by: ________________
Approved by: ________________
Date: ________________
Deployment URL: ________________
Rollback Plan: ________________ (reference)
```

---

## ⚠️ Critical Reminders

1. **Change admin password** - Default is admin123
2. **Verify RLS policies** - Users are isolated
3. **Test in production** - Even after deployment
4. **Have rollback plan** - Know how to revert
5. **Monitor first 24h** - Watch error logs
6. **Have support ready** - Be prepared for issues
7. **Document process** - For future deployments
8. **Keep backups** - Daily backup strategy

---

## 🎊 Deployment Completed!

Once deployment is successful:

1. ✅ Celebrate the launch!
2. ✅ Thank the team
3. ✅ Gather user feedback
4. ✅ Plan improvements
5. ✅ Schedule retrospective
6. ✅ Document lessons learned

---

**Status:** Ready for deployment ✅

**Last Updated:** [Date]
**Version:** 1.0
**Environment:** Production
