"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// Type for canvas elements
interface CanvasElement {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface AmaticWrapperProps {
  onElementsChange?: (elements: CanvasElement[]) => void;
  className?: string;
}

// Loading component
const LoadingCanvas = ({ className }: { className?: string }) => (
  <Card className={`bg-white border-gray-200 overflow-hidden h-full flex items-center justify-center ${className}`}>
    <div className="text-center space-y-4">
      <div 
        className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
        style={{ borderColor: '#6366F1' }}
      ></div>
      <p className="text-gray-600">Loading Visual Canvas...</p>
      <p className="text-sm text-gray-500">Setting up drawing tools...</p>
    </div>
  </Card>
);

// Dynamically import Amatic Canvas with no SSR
const AmaticCanvas = dynamic(
  () => import("./amatic-canvas").then(mod => ({ default: mod.AmaticCanvas })),
  {
    ssr: false,
    loading: () => <LoadingCanvas />,
  }
);

export function AmaticWrapper({ onElementsChange, className }: AmaticWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <LoadingCanvas className={className} />;
  }

  return (
    <AmaticCanvas
      onElementsChange={onElementsChange}
      className={className}
    />
  );
}
