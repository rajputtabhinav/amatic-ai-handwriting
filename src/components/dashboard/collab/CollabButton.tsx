"use client";

import { useState, useCallback } from 'react';
import { Users, Link2, Loader2, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvasStore } from '@/stores/canvas-store';
import { ShareDialog } from './ShareDialog';

interface CollabButtonProps {
  className?: string;
}

export function CollabButton({ className }: CollabButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const {
    isCollaborating,
    collaborators,
    startCollaboration,
    stopCollaboration,
    setCollabError,
  } = useCanvasStore();
  
  const collaboratorCount = collaborators.size;
  
  /**
   * Start a new collaboration session
   */
  const handleStartCollab = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create collaboration room');
      }
      
      // Start collaboration in store
      startCollaboration(data.roomId, data.roomKey);
      
      // Show share dialog with link
      setShareLink(data.shareLink);
      setShowShareDialog(true);
      
      // Update URL without navigation
      const url = new URL(window.location.href);
      url.searchParams.set('room', data.roomId);
      url.hash = data.roomKey;
      window.history.pushState(null, '', url.toString());
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start collaboration';
      setError(message);
      setCollabError(message);
    } finally {
      setIsLoading(false);
    }
  }, [startCollaboration, setCollabError]);
  
  /**
   * Stop collaboration
   */
  const handleStopCollab = useCallback(() => {
    stopCollaboration();
    
    // Remove room from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    url.hash = '';
    window.history.pushState(null, '', url.toString());
    
    setShareLink(null);
  }, [stopCollaboration]);
  
  /**
   * Show share dialog for existing session
   */
  const handleShowShareLink = useCallback(() => {
    const { roomId, roomKey } = useCanvasStore.getState();
    if (roomId && roomKey) {
      const baseUrl = `${window.location.origin}/dashboard`;
      setShareLink(`${baseUrl}?room=${roomId}#${roomKey}`);
      setShowShareDialog(true);
    }
  }, []);
  
  return (
    <>
      <div className={`flex items-center gap-1 ${className}`}>
        {isCollaborating ? (
          // Active collaboration UI - compact with dark theme
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowShareLink}
              className="relative h-7 px-2 rounded-md transition-all [&>svg]:stroke-[#171f3a]"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#171f3a',
              }}
            >
              <Users className="h-3.5 w-3.5 mr-1" stroke="#171f3a" strokeWidth={2} />
              <span className="text-xs font-medium">
                {collaboratorCount + 1}
              </span>
              {collaboratorCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-violet-500 rounded-full animate-pulse" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowShareLink}
              className="h-7 w-7 p-0 hover:bg-white/10 rounded-md transition-all [&>svg]:stroke-[#171f3a]"
              title="Share link"
            >
              <Link2 className="h-3.5 w-3.5" stroke="#171f3a" strokeWidth={2} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStopCollab}
              className="h-7 w-7 p-0 hover:bg-red-500/20 rounded-md transition-all [&>svg]:stroke-[#ef4444]"
              title="Stop collaboration"
            >
              <X className="h-3.5 w-3.5" stroke="#ef4444" strokeWidth={2} />
            </Button>
          </>
        ) : (
          // Start collaboration button - compact with dark theme
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartCollab}
            disabled={isLoading}
            className="h-7 px-2.5 text-xs rounded-md transition-all [&>svg]:stroke-[#171f3a]"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#171f3a',
            }}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" stroke="#171f3a" strokeWidth={2} />
            ) : (
              <UserPlus className="h-3.5 w-3.5 mr-1" stroke="#171f3a" strokeWidth={2} />
            )}
            <span className="font-medium">Collab</span>
          </Button>
        )}
      </div>
      
      {/* Error display */}
      {error && (
        <div 
          className="absolute top-full left-0 mt-1 p-1.5 rounded text-xs max-w-xs"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'rgba(248, 113, 113, 1)',
          }}
        >
          {error}
        </div>
      )}
      
      {/* Share dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        shareLink={shareLink}
      />
    </>
  );
}

