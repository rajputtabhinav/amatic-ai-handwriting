// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import { ReadableStream, TransformStream, WritableStream } from 'stream/web';
import { MessageChannel, MessagePort } from 'worker_threads';

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

if (!global.ReadableStream) {
  global.ReadableStream = ReadableStream;
}

if (!global.WritableStream) {
  global.WritableStream = WritableStream;
}

if (!global.TransformStream) {
  global.TransformStream = TransformStream;
}

if (!global.MessageChannel) {
  global.MessageChannel = MessageChannel;
}

if (!global.MessagePort) {
  global.MessagePort = MessagePort;
}

if (!global.Request || !global.Response || !global.Headers) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const undici = require('undici');
  global.Headers = undici.Headers;
  global.Request = undici.Request;
  global.Response = undici.Response;
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  redirect: jest.fn(),
}));

// Mock Clerk
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => Promise.resolve({ userId: 'test-user-id' })),
  currentUser: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  })),
  clerkMiddleware: jest.fn((fn) => fn),
  createRouteMatcher: jest.fn(() => jest.fn()),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock';
process.env.CLERK_SECRET_KEY = 'sk_test_mock';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock_anon_key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock_service_role_key';
process.env.OPENAI_API_KEY = 'sk-mock';
process.env.RAZORPAY_KEY_ID = 'rzp_test_mock';
process.env.RAZORPAY_KEY_SECRET = 'mock_secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'mock_webhook_secret';
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_mock';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL = '/sign-in';
process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL = '/sign-up';

// Mock fetch globally
global.fetch = jest.fn();

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

