# 🖊️ Amatic.ai - AI Handwriting & Student SaaS Platform

Transform your digital text into beautiful, authentic handwriting with AI. Perfect for students, teachers, and professionals.

![Amatic.ai Banner](https://via.placeholder.com/800x400/6366f1/ffffff?text=Amatic.ai)

## ✨ Features

### 🎯 Core Features
- **AI Handwriting Generation**: Convert text to natural-looking handwriting in multiple styles
- **AI Chat Assistant**: ChatGPT-like AI for homework help and Q&A
- **🌟 Agentic Handwriting Answers**: Write questions on canvas and get AI answers in beautiful handwritten format
- **🧠 Multi-Model Support**: Choose from 11 AI models - 6 OpenAI (GPT-4o, o1, etc.) & 5 Anthropic (Claude 3.5 Sonnet, etc.)
- **🌍 Multi-Language Support**: 70+ beautiful fonts covering 50+ countries - Write in Arabic, Chinese, Japanese, Korean, Hindi, Thai, Hebrew, and more!
- **Multiple Export Formats**: Download as PDF or JPEG
- **Subscription Plans**: Flexible pricing from ₹299 to ₹3,999 - seven tiers to choose from
- **Referral System**: Earn money by referring friends
- **Clean UI**: Beautiful, professional interface

### 📱 User Dashboard
- Handwriting generator with style selection
- AI chat interface with usage tracking
- Referral management and earnings dashboard
- Profile and subscription management
- Usage analytics and limits

### 🔧 Admin Features
- User management
- Subscription tracking
- Payout management
- Revenue analytics
- API usage monitoring

## 🛠️ Tech Stack

### Frontend
- **Next.js 15.5** - React framework with App Router
- **React 19** - Latest React with improved performance
- **TypeScript 5** - Type safety
- **TailwindCSS 4** - Modern utility-first CSS
- **ShadCN UI** - Accessible component library
- **Framer Motion** - Smooth animations
- **Amatic Canvas** - Hand-drawn canvas engine

### Backend
- **Next.js API Routes** - Server-side logic
- **Clerk** - Authentication (OAuth + Email/Password)
- **Supabase** - PostgreSQL database with Row Level Security
- **Razorpay** - Payment processing for Indian market
- **OpenAI API** - GPT-4o, o1, and other models
- **Anthropic Claude** - Claude 3.5 Sonnet and other models
- **ElevenLabs** (Optional) - Voice synthesis
- **Upstash Redis** (Optional) - Rate limiting

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Git** - Version control

### Deployment
- **Vercel** - Frontend hosting
- **Supabase** - Database hosting

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Amatic.ai.git
   cd Amatic.ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # Supabase Database
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   
   # Razorpay Payments
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
   
   # OpenAI API
   OPENAI_API_KEY=sk-...
   ```

4. **Set up the database**
   - Create a new project in [Supabase](https://supabase.com)
   - Run the SQL schema from `src/lib/database/schema.sql` in the Supabase SQL editor

5. **Set up Clerk**
   - Create a new application in [Clerk](https://clerk.dev)
   - Configure OAuth providers (Google, GitHub)
   - Set redirect URLs:
     - Sign-in: `http://localhost:3000/sign-in`
     - Sign-up: `http://localhost:3000/sign-up`
     - After sign-in: `http://localhost:3000/dashboard`

6. **Set up Razorpay**
   - Create account at [Razorpay](https://razorpay.com)
   - Get API keys from the dashboard
   - Set up webhook endpoint: `http://localhost:3000/api/webhooks/razorpay`

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Amatic.ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes (sign-in, sign-up)
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Protected dashboard
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # React components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── sections/          # Landing page sections
│   │   └── ui/                # ShadCN UI components
│   ├── lib/                   # Utilities and configurations
│   │   ├── database/          # Database helpers and types
│   │   ├── razorpay.ts        # Payment processing
│   │   └── supabase.ts        # Database client
│   └── hooks/                 # Custom React hooks
├── public/                    # Static assets
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🔐 Authentication Flow

1. User signs up/in via Clerk
2. User data is synced to Supabase
3. Referral codes are auto-generated
4. Session management handled by Clerk

## 💳 Subscription Flow

1. User selects a plan
2. Razorpay subscription is created
3. Payment processing via Razorpay
4. Webhook updates subscription status
5. User access is updated based on plan

## 🎁 Referral System

1. Each user gets a unique referral code
2. New users can sign up with referral links
3. When referred user subscribes, referrer earns commission
4. Platform keeps ₹100, rest goes to referrer
5. Minimum withdrawal: ₹300

## 📊 Subscription Plans

All prices in Indian Rupees (INR) - Monthly billing

### Starter (₹299/month)
- 500 handwriting conversions
- 3 handwriting styles
- 50 AI chat messages/day
- 2GB cloud storage

### Basic (₹599/month)
- 1,500 handwriting conversions
- 5 handwriting styles
- 100 AI chat messages/day
- 5GB cloud storage
- Priority support

### Standard (₹999/month)
- 3,000 handwriting conversions
- 10 handwriting styles
- 250 AI chat messages/day
- 15GB cloud storage
- Batch processing
- Custom templates
- Priority support

### Professional (₹1,499/month)
- 6,000 handwriting conversions
- 15 handwriting styles
- 500 AI chat messages/day
- 30GB cloud storage
- Batch processing
- Custom templates
- Basic API access
- Phone support

### Business (₹1,999/month)
- 12,000 handwriting conversions
- 20+ handwriting styles
- 1,000 AI chat messages/day
- 100GB cloud storage
- Full API access
- Team management (5 members)
- Priority support
- Phone support

### Premium (₹2,999/month)
- 25,000 handwriting conversions
- 25+ handwriting styles
- Unlimited AI chat
- 250GB cloud storage
- Full API access
- Team management (15 members)
- Priority features
- Dedicated support

### Enterprise (₹3,999/month)
- Unlimited handwriting conversions
- All handwriting styles + Custom
- Unlimited AI chat
- Unlimited cloud storage
- Full API access
- Unlimited team members
- White-label option
- Custom integrations
- SLA guarantee
- Dedicated account manager

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set environment variables in Vercel dashboard**

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Database Migration

Run the SQL schema in your production Supabase instance:
```sql
-- Copy content from src/lib/database/schema.sql
```

## 🔧 API Endpoints

### Currently Implemented

#### Chat & AI
- `POST /api/chat` - Main chat endpoint for homework help
- `POST /api/chat/learning` - Learning assistant with canvas context
- `POST /api/canvas/answer-question` - Get AI answers in handwritten format
- `GET /api/chat` - API status check

#### Subscriptions
- `POST /api/subscriptions/create` - Create new subscription

#### Voice (Optional - requires ElevenLabs API key)
- `POST /api/voice/synthesize` - Text-to-speech conversion
- `POST /api/voice/transcribe` - Speech-to-text conversion

#### Webhooks
- `POST /api/webhooks/razorpay` - Razorpay payment webhooks

#### Health Check
- `GET /api/health` - API health status

### Planned for Future Releases
- User profile management APIs
- Subscription cancellation
- Handwriting generation history
- Referral earnings withdrawal
- Clerk webhook integration

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📈 Analytics & Monitoring

- **User Analytics**: Track user engagement and feature usage
- **Revenue Tracking**: Monitor subscription revenue and referral payouts
- **Performance Monitoring**: API response times and error rates
- **Usage Metrics**: Track handwriting generations and AI chat usage

## 🔒 Security

- **Authentication**: Secure OAuth with Clerk
- **Database**: Row Level Security (RLS) with Supabase
- **API Routes**: Protected with authentication middleware
- **Webhooks**: Signature verification for all webhooks
- **Environment Variables**: Sensitive data in environment variables

## 🌍 Internationalization

- **Languages**: English (default), Hindi (planned)
- **Currency**: INR (Indian Rupees)
- **Localization**: Date/time formatting for Indian timezone

## 📱 Mobile Support

- **Responsive Design**: Works on all device sizes
- **Progressive Web App**: PWA capabilities
- **Touch Optimized**: Mobile-friendly interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@Amatic.ai
- **Documentation**: [docs.Amatic.ai](https://docs.Amatic.ai)
- **Discord**: [Join our community](https://discord.gg/pensil)

## 🗺️ Roadmap

### Phase 1 - Foundation (Completed ✅)
- ✅ Core canvas with drawing tools
- ✅ AI chat assistant (OpenAI & Anthropic)
- ✅ Multi-model AI support (11 models)
- ✅ Subscription system with Razorpay
- ✅ Referral program infrastructure
- ✅ 70+ multilingual fonts
- ✅ Agentic handwriting answers

### Phase 2 - Enhancement (Q1 2025)
- 🔄 Complete handwriting generation feature
- 🔄 User dashboard with analytics
- 🔄 Referral earnings withdrawal
- 🔄 Usage tracking and limits enforcement
- 🔄 Batch processing
- 🔄 Custom templates

### Phase 3 - Expansion (Q2-Q3 2025)
- 📅 Mobile app (React Native)
- 📅 Public API for third-party integrations
- 📅 Teacher/Institute dashboards
- 📅 Advanced analytics
- 📅 Collaboration features
- 📅 Team workspaces

### Phase 4 - Enterprise (Q4 2025)
- 📅 Enterprise SSO integration
- 📅 White-label solutions
- 📅 Custom AI model training
- 📅 Global CDN deployment
- 📅 Advanced security features
- 📅 SLA guarantees

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Clerk](https://clerk.dev) - Authentication
- [Supabase](https://supabase.com) - Database
- [Razorpay](https://razorpay.com) - Payments
- [ShadCN UI](https://ui.shadcn.com) - UI components
- [Vercel](https://vercel.com) - Deployment

---

Made with ❤️ in India by the Amatic.ai team