"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-gray-200">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6" style={{ color: '#171f3a' }} />
            <span className="font-bold text-xl" style={{ color: '#171f3a' }}>Amatic.ai</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/pricing"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4" suppressHydrationWarning>
          {!mounted || !isLoaded ? (
            <div className="flex items-center space-x-2">
              <Link 
                href="/sign-in"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors"
                style={{ backgroundColor: '#6366F1' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366F1'}
              >
                Get Started
              </Link>
            </div>
          ) : isSignedIn ? (
            <div className="flex items-center space-x-2">
              <Link 
                href="/dashboard"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Let&apos;s Learn
              </Link>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link 
                href="/sign-in"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors"
                style={{ backgroundColor: '#6366F1' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366F1'}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
