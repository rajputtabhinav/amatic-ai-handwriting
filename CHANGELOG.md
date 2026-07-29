# Changelog

All notable changes to Amatic.ai will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite with 70%+ coverage
- CI/CD pipeline with GitHub Actions
- Database migration system
- Error tracking with Sentry integration
- Performance monitoring and Core Web Vitals tracking
- Security headers implementation
- Redis-based room storage for production scalability
- New API endpoints:
  - `/api/users/profile` - User profile management
  - `/api/subscriptions/cancel` - Subscription cancellation
  - `/api/referrals/withdraw` - Referral earnings withdrawal
  - `/api/webhooks/clerk` - Clerk webhook integration
- Modular canvas hooks for better code organization
- Loading states for better UX
- Code splitting and lazy loading optimizations

### Changed
- Replaced console.log with proper logger usage throughout codebase
- Improved TypeScript types (removed 'any' types)
- Enhanced middleware route protection
- Refactored large components into smaller, focused modules
- Updated error handling with user-friendly messages

### Fixed
- TypeScript compilation errors in canvas-drawing.tsx
- Null pointer exceptions in hover detection
- Dashboard route not protected by authentication
- Memory leak in room storage (now uses Redis)

### Security
- Added security headers (X-Frame-Options, CSP, etc.)
- Implemented webhook signature verification
- Enhanced rate limiting on critical endpoints
- Row Level Security policies enabled

## [1.0.0] - 2025-01-05

### Added
- Initial release of Amatic.ai platform
- AI-powered handwriting generation
- Multi-model AI support (11 models: 6 OpenAI + 5 Anthropic)
- 70+ multilingual fonts covering 50+ countries
- Real-time collaboration with Socket.io
- Canvas drawing with Amatic Canvas
- Voice conversation features with ElevenLabs
- Agentic handwriting answers
- 7-tier subscription system (₹299 - ₹3,999/month)
- Referral program with commission tracking
- Razorpay payment integration
- Clerk authentication with OAuth support
- Supabase database with RLS
- Dark mode support
- Responsive design for all devices

### Core Features
- Canvas with drawing tools (pen, eraser, shapes)
- AI chat assistant for homework help
- Visual AI generation (SVG and React/Framer Motion)
- Real-time collaboration with encrypted data
- Background customization
- Export to PDF and JPEG
- Usage tracking and limits
- Admin dashboard (planned)

### Tech Stack
- Next.js 15.5 with App Router
- React 19
- TypeScript 5
- TailwindCSS 4
- Supabase (PostgreSQL)
- Clerk (Authentication)
- Razorpay (Payments)
- Socket.io (Real-time)
- OpenAI & Anthropic APIs

## [0.1.0] - 2024-12-01

### Added
- Project initialization
- Basic project structure
- Development environment setup
- Core dependencies installation

---

## Release Notes

### Version 1.0.0 - Initial Public Release

This is the first public release of Amatic.ai, an AI-powered creative platform designed for students, educators, and professionals.

**Highlights:**
- 🎨 AI handwriting generation with 70+ fonts
- 🤖 Multi-model AI chat (GPT-4o, Claude 3.5, etc.)
- ✍️ Agentic handwriting answers
- 🌍 Support for 50+ languages
- 💰 Flexible subscription plans
- 🤝 Real-time collaboration
- 🎤 Voice conversation features

**What's Next:**
- Mobile app (React Native)
- Public API for integrations
- Teacher/Institute dashboards
- Advanced analytics
- Team workspaces
- White-label solutions

---

## Migration Guide

### Upgrading from 0.x to 1.0

No migration needed for new installations.

For existing users:
1. Run database migrations in order
2. Update environment variables (see env.example)
3. Clear browser cache
4. Restart the application

---

## Support

For questions or issues:
- GitHub Issues: https://github.com/your-org/pensil.io/issues
- Email: support@amatic.ai
- Discord: https://discord.gg/pensil

---

**Note**: This changelog is automatically updated with each release. For detailed commit history, see the [Git log](https://github.com/your-org/pensil.io/commits/main).

