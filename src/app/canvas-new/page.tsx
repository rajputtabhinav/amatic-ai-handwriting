"use client";

/**
 * Canvas New Page - Redirect to main canvas
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CanvasNewPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Redirecting to canvas...</p>
    </div>
  );
}
