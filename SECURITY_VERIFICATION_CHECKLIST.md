# Security Verification Checklist

## ⚠️ URGENT: Exposed API Key Verification

### Status: **REQUIRES MANUAL VERIFICATION**

### Exposed Key Details
- **Service**: Google Gemini API
- **Exposed Key**: `AIzaSy-REDACTED-ROTATE-THIS-KEY`
- **Location**: Previously in `env.example` (now fixed)
- **Risk**: Key is in Git history and potentially accessible

### Verification Steps

#### ✅ Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the project associated with Amatic.ai
3. Navigate to **APIs & Services** > **Credentials**

#### ✅ Step 2: Locate the Exposed Key
1. Search for API key: `AIzaSy-REDACTED-ROTATE-THIS-KEY`
2. Check if the key still exists in the credentials list
3. Check the key's status (Active/Deleted)

#### ✅ Step 3: Revoke the Key
If the key still exists and is active:
1. Click on the key name to open details
2. Click **"Delete"** or **"Regenerate"**
3. Confirm the deletion
4. Document the revocation date and time

#### ✅ Step 4: Generate New Key (if needed)
If you're using Google Gemini API:
1. Click **"Create Credentials"** > **"API Key"**
2. Copy the new key immediately
3. Add to your `.env.local` file:
   ```bash
   GOOGLE_GEMINI_API_KEY=your_new_key_here
   ```
4. **DO NOT** commit this key to Git

#### ✅ Step 5: Verify No Unauthorized Usage
1. Check Google Cloud Console > **Billing** > **Reports**
2. Look for any unusual API usage between exposure date and revocation
3. Review API usage logs for suspicious activity
4. Document any findings

### Verification Checklist

- [ ] Logged into Google Cloud Console
- [ ] Located the exposed key in credentials
- [ ] Verified key status (Active/Deleted)
- [ ] Revoked/Deleted the exposed key (if active)
- [ ] Generated new key (if needed)
- [ ] Updated `.env.local` with new key
- [ ] Checked billing for unauthorized usage
- [ ] Reviewed API usage logs
- [ ] Documented completion date and findings

### Completion Documentation

**Verified By**: _________________  
**Date**: _________________  
**Key Status**: [ ] Revoked [ ] Already Deleted [ ] Not Found  
**Unauthorized Usage Detected**: [ ] Yes [ ] No  
**Notes**: 
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## Additional Security Verifications

### Database Backup Strategy (Issue #35)
- [ ] Supabase automatic backups enabled
- [ ] Backup retention period configured (minimum 7 days recommended)
- [ ] Point-in-time recovery tested
- [ ] Backup restoration procedure documented
- [ ] Disaster recovery plan created

### Environment Variable Validation (Issue #2)
- [ ] All production environment variables set
- [ ] No placeholder values in production
- [ ] Startup health checks implemented
- [ ] Environment validation tests passing

### Webhook Security (Issue #3)
- [ ] Razorpay webhook signature validation working
- [ ] User linking in subscription webhooks fixed
- [ ] Idempotency checks implemented
- [ ] Webhook error handling tested

### Rate Limiting (Issue #5)
- [ ] Redis deployed for production
- [ ] In-memory fallback removed
- [ ] Rate limiting tested under load
- [ ] Monitoring alerts configured

---

**Last Updated**: 2025-01-07  
**Next Review Date**: _________________

