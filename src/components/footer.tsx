import Link from "next/link";
import { Sparkles, Mail, Twitter, Github, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6" style={{ color: '#171f3a' }} />
              <span className="font-bold text-xl text-white">Amatic.ai</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Transform your ideas into beautiful visuals with AI. 
              Perfect for professionals, creators, and teams.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="transition-colors hover:opacity-80"
                style={{ color: '#171f3a' }}
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="transition-colors hover:opacity-80"
                style={{ color: '#171f3a' }}
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="transition-colors hover:opacity-80"
                style={{ color: '#171f3a' }}
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="mailto:support@amatic.ai" 
                className="transition-colors hover:opacity-80"
                style={{ color: '#171f3a' }}
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Product</h3>
            <div className="space-y-2">
              <Link 
                href="#features" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                Features
              </Link>
              <Link 
                href="#pricing" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                Pricing
              </Link>
              <Link 
                href="/sign-up" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                Get Started
              </Link>
              <Link 
                href="#" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                API Documentation
              </Link>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Company</h3>
            <div className="space-y-2">
              <Link 
                href="#" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                About Us
              </Link>
              <Link 
                href="#" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                Blog
              </Link>
              <Link 
                href="#" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                Careers
              </Link>
              <Link 
                href="#" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Support</h3>
            <div className="space-y-2">
              <Link 
                href="#" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                Help Center
              </Link>
              <Link 
                href="#" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link 
                href="#" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                Terms of Service
              </Link>
              <Link 
                href="#" 
                className="block text-gray-400 transition-colors hover:text-white"
              >
                Refund Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 Amatic.ai. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-4 md:mt-0">
            Made with ❤️ in India
          </p>
        </div>
      </div>
    </footer>
  );
}
