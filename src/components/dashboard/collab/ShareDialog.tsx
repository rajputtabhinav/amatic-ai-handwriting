"use client";

import { useState, useCallback, useEffect } from 'react';
import { Copy, Check, Link2, Users, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: string | null;
}

export function ShareDialog({ isOpen, onClose, shareLink }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  
  // Reset copied state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);
  
  /**
   * Copy link to clipboard
   */
  const handleCopy = useCallback(async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [shareLink]);
  
  /**
   * Open link in new tab
   */
  const handleOpenLink = useCallback(() => {
    if (shareLink) {
      window.open(shareLink, '_blank');
    }
  }, [shareLink]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog - compact */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header - compact */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#6366F1]/10 rounded-md">
              <Users className="h-4 w-4 text-[#6366F1]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Share Collaboration</h3>
              <p className="text-xs text-gray-500">Invite others to edit together</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        {/* Content - compact */}
        <div className="p-3 space-y-3">
          {/* Info banner - compact */}
          <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-md border border-blue-100">
            <Link2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              <span className="font-medium">Encrypted.</span> Only people with this link can access.
            </p>
          </div>
          
          {/* Link input - compact */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">
              Share Link
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={shareLink || ''}
                readOnly
                className="flex-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600 font-mono truncate focus:outline-none focus:ring-1 focus:ring-[#6366F1]/30"
              />
              
              <Button
                onClick={handleCopy}
                size="sm"
                className={`h-7 px-2.5 text-xs transition-all duration-200 ${
                  copied 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-[#6366F1] hover:bg-[#4F46E5]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Open in new tab - compact */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenLink}
            className="w-full h-7 justify-center text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <ExternalLink className="h-3 w-3 mr-1.5" />
            Open in new tab
          </Button>
        </div>
        
        {/* Footer - compact */}
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>Max 16 users</span>
            <span>Expires in 24h</span>
          </div>
        </div>
      </div>
    </div>
  );
}

