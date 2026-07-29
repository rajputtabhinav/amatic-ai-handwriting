import { SignIn } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-6 w-6" style={{ color: '#171f3a' }} />
          <span className="font-bold text-xl" style={{ color: '#171f3a' }}>Amatic.ai</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back to Amatic.ai
            </h1>
            <p className="mt-2 text-gray-600">
              Sign in to access your AI-powered creative tools
            </p>
          </div>
          <SignIn 
            fallbackRedirectUrl="/"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-xl border-0 bg-white rounded-2xl",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "rounded-xl border-gray-200 hover:bg-gray-50",
                formButtonPrimary: "bg-[#6366F1] hover:bg-[#4F46E5] rounded-xl",
                footerActionLink: "text-[#6366F1] hover:text-[#4F46E5]",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
