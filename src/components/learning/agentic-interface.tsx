"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Volume2, 
  Minimize, 
  Split,
  Maximize,
  MessageSquare,
  Palette,
  BookOpen,
  User
} from "lucide-react";
import { motion } from "framer-motion";
import { UserButton } from "@clerk/nextjs";

import { AmaticWrapper } from "./amatic-wrapper";
import { AgenticChat } from "./agentic-chat";

// Type for canvas elements
interface CanvasElement {
  id: string;
  type: string;
  [key: string]: unknown;
}

type ViewMode = 'split' | 'canvas' | 'chat';

export function AgenticInterface() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [elements, setElements] = useState<any[]>([]);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [sessionStats, setSessionStats] = useState({
    questionsAsked: 0,
    visualsCreated: 0,
    voiceInteractions: 0,
    topicsExplored: new Set<string>(),
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const handleElementsChange = useCallback((newElements: CanvasElement[]) => {
    setElements(newElements);
    
    if (newElements.length > elements.length) {
      setSessionStats(prev => ({
        ...prev,
        visualsCreated: prev.visualsCreated + 1
      }));
    }
  }, [elements.length]);

  const handleVisualExplanationRequest = useCallback((topic: string, _content: string) => {
    setCurrentTopic(topic);
    
    if (viewMode === 'chat') {
      setViewMode('split');
    }
    
    // Visual explanation will be rendered in the canvas
  }, [viewMode]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getViewModeIcon = (mode: ViewMode) => {
    switch (mode) {
      case 'split': return Split;
      case 'canvas': return Palette;
      case 'chat': return MessageSquare;
    }
  };

  const getViewModeLabel = (mode: ViewMode) => {
    switch (mode) {
      case 'split': return 'Split View';
      case 'canvas': return 'Canvas Focus';
      case 'chat': return 'Chat Focus';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-gray-200">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: '#6366F120' }}
            >
              <Sparkles className="h-6 w-6" style={{ color: '#6366F1' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Amatic.ai</h1>
              <p className="text-sm text-gray-500">AI-powered workspace</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Controls */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {(['split', 'canvas', 'chat'] as ViewMode[]).map((mode) => {
                const Icon = getViewModeIcon(mode);
                const isActive = viewMode === mode;
                
                return (
                  <Button
                    key={mode}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewModeChange(mode)}
                    className={`h-8 px-3 rounded-md ${
                      isActive 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{getViewModeLabel(mode)}</span>
                  </Button>
                );
              })}
            </div>

            {/* Fullscreen Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="border-gray-200"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>

            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="text-sm text-gray-600">
              Session Progress:
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <MessageSquare className="h-3 w-3 mr-1" />
                {sessionStats.questionsAsked} Questions
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                {sessionStats.visualsCreated} Visuals
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <BookOpen className="h-3 w-3 mr-1" />
                {sessionStats.topicsExplored.size} Topics
              </Badge>
            </div>
          </div>
          
          {currentTopic && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Current Topic:</span>
              <Badge 
                className="text-white"
                style={{ backgroundColor: '#6366F1' }}
              >
                {currentTopic}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-6">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="h-[calc(100vh-200px)]"
        >
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Chat Panel */}
              <div ref={chatRef} className="h-full">
                <AgenticChat 
                  onVisualExplanationRequest={handleVisualExplanationRequest}
                  className="h-full"
                />
              </div>
              
              {/* Canvas Panel */}
              <div ref={canvasRef} className="h-full">
                <AmaticWrapper
                  onElementsChange={handleElementsChange}
                  className="h-full"
                />
              </div>
            </div>
          )}

          {viewMode === 'canvas' && (
            <div className="h-full">
              <AmaticWrapper
                onElementsChange={handleElementsChange}
                className="h-full"
              />
            </div>
          )}

          {viewMode === 'chat' && (
            <div className="max-w-4xl mx-auto h-full">
              <AgenticChat 
                onVisualExplanationRequest={handleVisualExplanationRequest}
                className="h-full"
              />
            </div>
          )}
        </motion.div>
      </main>

      {/* Quick Actions Floating Panel */}
      <div className="fixed bottom-6 right-6 z-40">
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardContent className="p-3">
            <div className="flex flex-col space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-gray-700 hover:text-gray-900"
                onClick={() => {
                  setCurrentTopic("");
                  setElements([]);
                }}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                New Topic
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-gray-700 hover:text-gray-900"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Voice Settings
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-gray-700 hover:text-gray-900"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Help Overlay for first-time users */}
      {elements.length === 0 && sessionStats.questionsAsked === 0 && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="text-center space-y-4">
              <div 
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: '#6366F120' }}
              >
                <Sparkles className="h-8 w-8" style={{ color: '#6366F1' }} />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to Amatic.ai!
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Ask me anything and I&apos;ll help you with conversation and visual diagrams. 
                  I can assist with coding, business, creative projects, research, and any topic!
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat with AI assistant</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Draw and visualize concepts</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Volume2 className="h-4 w-4" />
                  <span>Listen to explanations</span>
                </div>
              </div>
              
              <Button
                onClick={() => setSessionStats(prev => ({ ...prev, questionsAsked: 1 }))}
                className="w-full text-white rounded-xl"
                style={{ backgroundColor: '#6366F1' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4F46E5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366F1'}
              >
                Get Started
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Keep backward compatibility alias
export { AgenticInterface as AgenticLearningInterface };
