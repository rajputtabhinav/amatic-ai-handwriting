# Security Policy

## 🔒 Security Overview

Amatic.ai takes security seriously. This document outlines our security practices, known vulnerabilities, and how to report security issues.

## ✅ Implemented Security Measures

### 1. Authentication & Authorization
- **Clerk Authentication**: Enterprise-grade auth with OAuth support
- **Row-Level Security**: Supabase RLS policies enabled on all tables
- **Service Role Isolation**: Separate service role for backend operations
- **Protected API Routes**: Middleware-based authentication checks

### 2. Input Validation
- **Zod Validation**: Runtime type checking on all API inputs
- **Request Size Limits**: Enforced by Next.js (default 4MB)
- **SQL Injection Prevention**: Parameterized queries via Supabase client
- **XSS Protection**: React's built-in escaping + Content Security Policy

### 3. API Security
- **Rate Limiting**: 
  - Chat API: 30 requests/minute per user
  - Subscription API: 5 requests/minute per user
  - General API: 100 requests/minute per IP
- **Webhook Signature Verification**: HMAC-SHA256 for Razorpay webhooks
- **Request ID Tracking**: Unique IDs for request tracing
- **Error Sanitization**: Internal errors hidden in production

### 4. Data Protection
- **Environment Variables**: All secrets in environment variables
- **Database Encryption**: Supabase encrypts data at rest
- **HTTPS Only**: Enforced in production
- **Sensitive Data Filtering**: No sensitive data in logs

### 5. Dependency Security
- **npm audit**: Automated security scanning
- **Snyk**: CI/CD security scanning
- **Automated Updates**: Dependabot configured
- **Lock File**: package-lock.json committed

## 🚨 Critical Security Fixes

### Fixed in Latest Release

#### 1. Exposed API Key (CRITICAL)
**Status**: ✅ Fixed  
**Issue**: Google Gemini API key exposed in `env.example`  
**Fix**: Replaced with placeholder value  
**Action Required**: **IMMEDIATELY REVOKE THE EXPOSED KEY**

```bash
# Original exposed key (REVOKE THIS):
GOOGLE_GEMINI_API_KEY=AIzaSy-REDACTED-ROTATE-THIS-KEY

# Steps to revoke:
1. Go to Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Find the exposed key
4. Click "Delete" or "Regenerate"
5. Create a new key
6. Update your .env.local file
```

#### 2. Webhook Security
**Status**: ✅ Already Implemented  
**Location**: `src/lib/razorpay.ts` - `validateWebhookSignature()`  
**Protection**: HMAC-SHA256 signature verification

## 🔐 Security Best Practices

### For Developers

#### 1. Environment Variables
```bash
# ✅ Good - Use placeholder values in examples
OPENAI_API_KEY=your_openai_api_key_here

# ❌ Bad - Never commit real keys
OPENAI_API_KEY=sk-proj-abc123...
```

#### 2. API Route Security
```typescript
// ✅ Good - Use middleware
export const POST = createProtectedRoute(async (req, { userId }) => {
  const data = validateInput(schema, await req.json());
  // ... your logic
});

// ❌ Bad - No auth or validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  // ... direct usage without validation
}
```

#### 3. Database Queries
```typescript
// ✅ Good - Parameterized queries
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('clerk_user_id', userId);

// ❌ Bad - String concatenation (SQL injection risk)
const query = `SELECT * FROM users WHERE id = '${userId}'`;
```

#### 4. Error Handling
```typescript
// ✅ Good - Generic error in production
if (process.env.NODE_ENV === 'production') {
  return errorResponse('Internal server error', 500);
}

// ❌ Bad - Exposing internal details
return NextResponse.json({
  error: error.message,
  stack: error.stack,
  query: sqlQuery
}, { status: 500 });
```

### For Deployment

#### Required Environment Variables
```bash
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_***
CLERK_SECRET_KEY=sk_***

# Database
NEXT_PUBLIC_SUPABASE_URL=https://***.supabase.co
SUPABASE_SERVICE_ROLE_KEY=*** # NEVER expose publicly

# Payments
RAZORPAY_KEY_SECRET=*** # Server-side only
RAZORPAY_WEBHOOK_SECRET=*** # For signature verification

# AI APIs
OPENAI_API_KEY=sk-*** # Server-side only
```

#### Security Headers (Recommended)
Add to `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ];
}
```

## 🐛 Reporting Security Vulnerabilities

### DO NOT open public GitHub issues for security vulnerabilities

Instead, please report security issues privately:

1. **Email**: security@Amatic.ai (recommended)
2. **GitHub Security Advisories**: Use the "Security" tab
3. **Direct Message**: Contact maintainers on Discord

### What to Include

```
Subject: [SECURITY] Brief description

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information
```

### Response Timeline

- **Initial Response**: Within 24 hours
- **Triage**: Within 72 hours
- **Fix Timeline**: Based on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next release

## 🎯 Security Checklist

### Pre-Deployment
- [ ] All environment variables set correctly
- [ ] No hardcoded secrets in code
- [ ] Dependencies security scan passed
- [ ] Rate limiting configured
- [ ] Webhook signatures verified
- [ ] Error handling sanitizes sensitive data
- [ ] HTTPS enforced
- [ ] Security headers configured

### Post-Deployment
- [ ] Monitor error tracking (Sentry)
- [ ] Review access logs regularly
- [ ] Keep dependencies updated
- [ ] Regular security audits
- [ ] Backup strategy in place
- [ ] Incident response plan ready

## 📚 Security Resources

### Tools & Services
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

### Best Practices
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Clerk Security](https://clerk.dev/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🔄 Security Updates

### Version History

#### v1.0.1 (2025-01-16)
- ✅ Fixed exposed API key in env.example
- ✅ Added Zod validation for all API routes
- ✅ Implemented structured error handling
- ✅ Added security scanning to CI/CD
- ✅ Enhanced rate limiting

#### v1.0.0 (Initial Release)
- ✅ Clerk authentication
- ✅ Supabase RLS policies
- ✅ Razorpay webhook verification
- ✅ Basic rate limiting

## 📞 Contact

For security concerns:
- **Email**: security@Amatic.ai
- **Response Time**: 24 hours
- **PGP Key**: Available on request

---

**Last Updated**: 2025-01-16  
**Security Version**: 1.0.1

