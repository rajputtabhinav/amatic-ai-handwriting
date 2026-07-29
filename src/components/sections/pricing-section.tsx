"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function PricingSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="container px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center space-y-6"
        >
          {/* Free Platform Message */}
          <div className="inline-block">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span>100% FREE TO USE</span>
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Free AI Platform
          </h2>
          
          <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
            Amatic.ai is completely free for everyone.
            Access all premium features without any cost!
          </p>

          {/* Feature Card */}
          <Card className="max-w-2xl mx-auto border-2 border-indigo-200 shadow-2xl">
            <CardHeader className="text-center bg-gradient-to-br from-purple-50 to-indigo-50 pb-8 pt-8">
              <div className="mb-4">
                <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  FREE
                </div>
                <div className="text-gray-600 font-medium mt-2">Forever & Always</div>
              </div>
              <CardTitle className="text-2xl font-bold">Everything Included</CardTitle>
              <CardDescription className="text-base mt-2">
                Full access to all premium features with no limitations
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-8">
              <ul className="space-y-4">
                {[
                  "Unlimited AI conversations with GPT-4o",
                  "Real-time voice conversation with AI teacher",
                  "16-color hand-drawn notes on canvas",
                  "Voice Activity Detection (auto-listening)",
                  "ElevenLabs professional voices (<100ms)",
                  "Unlimited handwriting styles",
                  "Canvas with advanced drawing tools",
                  "Wavy underlines & marker highlights",
                  "Animated typing effects",
                  "Multi-language support",
                  "Export to PDF & images",
                  "Cloud storage & sync",
                  "All future updates & features"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Check className="h-4 w-4 text-indigo-600 font-bold" />
                      </div>
                    </div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href="/sign-up" className="block mt-8">
                <Button 
                  className="w-full text-white rounded-xl text-lg py-6 font-bold shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: '#6366F1' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366F1'}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Started Free
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-bold text-gray-900 mb-1">For Everyone</h3>
              <p className="text-sm text-gray-600">Work smarter with AI-powered visual tools</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">👨‍🏫</div>
              <h3 className="font-bold text-gray-900 mb-1">For Teachers</h3>
              <p className="text-sm text-gray-600">Enhance teaching with AI assistance</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌟</div>
              <h3 className="font-bold text-gray-900 mb-1">No Limits</h3>
              <p className="text-sm text-gray-600">All features, no restrictions, forever free</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex items-center justify-center flex-wrap gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-indigo-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-indigo-500" />
              No hidden costs
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-indigo-500" />
              Cancel anytime (it&apos;s free!)
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
