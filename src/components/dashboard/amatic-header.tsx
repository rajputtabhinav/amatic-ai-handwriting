'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  Save, 
  Download, 
  Search, 
  HelpCircle, 
  Trash2, 
  Github, 
  Twitter,
  Users,
  Link2,
  Copy,
  Check,
  X,
  Share2,
  Lock
} from 'lucide-react';

interface AmaticHeaderProps {
  isCollaborating?: boolean;
  collaboratorCount?: number;
  onStartCollab?: () => void;
  onStopCollab?: () => void;
  onSave?: () => void;
  onExportImage?: () => void;
  onExportPDF?: () => void;
  onResetCanvas?: () => void;
  onHelp?: () => void;
  roomLink?: string;
}

export function AmaticHeader({
  isCollaborating = false,
  collaboratorCount = 0,
  onStartCollab,
  onStopCollab,
  onSave,
  onExportImage,
  onExportPDF,
  onResetCanvas,
  onHelp,
  roomLink = '',
}: AmaticHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showCollabDropdown, setShowCollabDropdown] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const collabRef = useRef<HTMLDivElement>(null);
  
  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (collabRef.current && !collabRef.current.contains(event.target as Node)) {
        setShowCollabDropdown(false);
      }
    };
    
    // Close on escape
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowMenu(false);
        setShowCollabDropdown(false);
        setShowShareDialog(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleCopyLink = async () => {
    if (roomLink) {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Left - Hamburger Menu */}
      <div className="absolute top-3 left-3 z-50">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:bg-white/10 [&>svg]:stroke-[#171f3a]"
            style={{
              background: showMenu 
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)'
                : 'rgba(26, 26, 46, 0.6)',
              boxShadow: showMenu 
                ? '0 0 0 1px rgba(139, 92, 246, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)'
                : '0 0 0 1px rgba(139, 92, 246, 0.2), 0 2px 8px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Menu size={18} stroke="#171f3a" strokeWidth={2} />
          </button>

          {/* Menu Dropdown */}
          {showMenu && (
            <div 
              className="absolute top-full mt-2 left-0 rounded-lg py-1 min-w-[200px] z-50"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
                boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.3), 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px rgba(139, 92, 246, 0.1)',
              }}
            >
              <button 
                onClick={() => { onSave?.(); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-3 rounded-md transition-colors"
              >
                <Save size={16} />
                <span>Save to...</span>
                <span className="ml-auto text-white/40 text-xs">Ctrl+S</span>
              </button>
              <button 
                onClick={() => { onExportImage?.(); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-3 rounded-md transition-colors"
              >
                <Download size={16} />
                <span>Export image...</span>
                <span className="ml-auto text-white/40 text-xs">Ctrl+Shift+E</span>
              </button>
              <button 
                onClick={() => { onExportPDF?.(); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-3 rounded-md transition-colors"
              >
                <Download size={16} />
                <span>Export as PDF...</span>
              </button>

              <div className="border-t border-white/10 my-1" />

              <button 
                className="w-full px-3 py-2 text-left text-sm text-violet-400 hover:bg-violet-500/20 flex items-center gap-3 rounded-md transition-colors"
              >
                <Search size={16} />
                <span>Command palette...</span>
                <span className="ml-auto text-white/40 text-xs">Ctrl+/</span>
              </button>
              <button 
                className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-3 rounded-md transition-colors"
              >
                <Search size={16} />
                <span>Find on canvas...</span>
                <span className="ml-auto text-white/40 text-xs">Ctrl+F</span>
              </button>
              <button 
                onClick={() => { onHelp?.(); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-3 rounded-md transition-colors"
              >
                <HelpCircle size={16} />
                <span>Help</span>
                <span className="ml-auto text-white/40 text-xs">?</span>
              </button>

              <div className="border-t border-white/10 my-1" />

              <button 
                onClick={() => { onResetCanvas?.(); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-3 rounded-md transition-colors"
              >
                <Trash2 size={16} />
                <span>Reset the canvas</span>
              </button>

              <div className="border-t border-white/10 my-1" />

              <div className="flex items-center gap-1 px-2 py-1">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-white/10 rounded-md transition-colors"
                >
                  <Github size={16} className="text-white/70" />
                </a>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-white/10 rounded-md transition-colors"
                >
                  <Twitter size={16} className="text-white/70" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right - Collaboration */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        {!isCollaborating ? (
          <div className="relative" ref={collabRef}>
            <button
              onClick={() => setShowCollabDropdown(!showCollabDropdown)}
              className="h-9 w-9 flex items-center justify-center rounded-lg transition-all hover:bg-white/10 [&>svg]:stroke-[#171f3a]"
              style={{
                background: showCollabDropdown
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)'
                  : 'rgba(26, 26, 46, 0.6)',
                boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.2), 0 2px 8px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(8px)',
              }}
              title="Live collaboration"
            >
              <Users size={16} stroke="#171f3a" strokeWidth={2} />
            </button>

            {showCollabDropdown && (
              <div 
                className="absolute top-full mt-2 right-0 rounded-lg p-4 min-w-[280px] z-50"
                style={{
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
                  boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.3), 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px rgba(139, 92, 246, 0.1)',
                }}
              >
                <div 
                  className="flex items-center gap-2 text-sm mb-4 p-2 rounded-lg"
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'rgba(52, 211, 153, 1)',
                  }}
                >
                  <Lock size={14} />
                  <span>Encrypted end-to-end</span>
                </div>
                <p className="text-sm text-white/70 mb-4">
                  Invite people to collaborate on your drawing in real-time.
                </p>
                <button
                  onClick={() => {
                    onStartCollab?.();
                    setShowCollabDropdown(false);
                  }}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(99, 102, 241, 1) 100%)',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                  }}
                >
                  Start session
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Online Users */}
            <div className="flex items-center -space-x-2">
              {Array.from({ length: Math.min(collaboratorCount, 3) }).map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ 
                    backgroundColor: ['#8B5CF6', '#ec4899', '#f59e0b', '#10b981'][i % 4],
                    border: '2px solid rgba(26, 26, 46, 0.8)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    zIndex: 10 - i 
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {collaboratorCount > 3 && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 text-xs font-medium"
                  style={{ 
                    background: 'rgba(139, 92, 246, 0.3)',
                    border: '2px solid rgba(26, 26, 46, 0.8)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    zIndex: 6 
                  }}
                >
                  +{collaboratorCount - 3}
                </div>
              )}
            </div>

            {/* Share Link Button */}
            <button
              onClick={() => setShowShareDialog(true)}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-white transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(99, 102, 241, 1) 100%)',
                boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.3), 0 2px 8px rgba(139, 92, 246, 0.3)',
              }}
              title="Share link"
            >
              <Share2 size={16} />
            </button>

            {/* Stop Collaboration */}
            <button
              onClick={onStopCollab}
              className="h-9 px-3 flex items-center gap-2 rounded-lg text-sm text-white/80 hover:text-white transition-colors"
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <X size={16} />
              <span>Stop</span>
            </button>
          </>
        )}
      </div>

      {/* Share Dialog */}
      {showShareDialog && (
        <>
          <div 
            className="fixed inset-0 z-50" 
            style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowShareDialog(false)}
          />
          <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl p-6 min-w-[400px] z-50"
            style={{ 
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
              boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.3), 0 25px 50px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Share link</h3>
              <button 
                onClick={() => setShowShareDialog(false)}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div 
              className="flex items-center gap-2 p-3 rounded-lg mb-4"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <Link2 size={16} className="text-white/40 flex-shrink-0" />
              <input
                type="text"
                value={roomLink || window.location.href}
                readOnly
                className="flex-1 bg-transparent text-sm text-white/80 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5',
                  copied 
                    ? 'text-emerald-400' 
                    : 'text-white'
                )}
                style={{
                  background: copied 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(99, 102, 241, 1) 100%)',
                  boxShadow: copied 
                    ? '0 0 0 1px rgba(16, 185, 129, 0.3)' 
                    : '0 2px 8px rgba(139, 92, 246, 0.3)',
                }}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy link
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-white/50">
              🔐 The link is encrypted end-to-end. Only people with this link can access the drawing.
            </p>
          </div>
        </>
      )}
    </>
  );
}
