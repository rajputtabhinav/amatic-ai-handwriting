"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Save, 
  Download, 
  Command, 
  Search, 
  HelpCircle, 
  Trash2,
  Twitter,
  UserPlus,
  X
} from 'lucide-react';

interface HamburgerMenuProps {
  onSave?: () => void;
  onExportImage?: () => void;
  onExportPDF?: () => void;
  onResetCanvas?: () => void;
  onHelp?: () => void;
}

export function HamburgerMenu({
  onSave,
  onExportImage,
  onResetCanvas,
  onHelp,
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const menuItems = [
    { icon: Save, label: 'Save to...', action: onSave },
    { icon: Download, label: 'Export image...', shortcut: 'Ctrl+Shift+E', action: onExportImage },
    { divider: true },
    { icon: Command, label: 'Command palette', shortcut: 'Ctrl+/', action: () => {}, highlight: true },
    { icon: Search, label: 'Find on canvas', shortcut: 'Ctrl+F', action: () => {} },
    { icon: HelpCircle, label: 'Help', shortcut: '?', action: onHelp },
    { icon: Trash2, label: 'Reset the canvas', action: onResetCanvas },
  ];

  const externalLinks = [
    { icon: Twitter, label: 'Follow us', href: '#' },
    { icon: UserPlus, label: 'Sign up', href: '/sign-up', highlight: true },
  ];

  return (
    <div ref={menuRef} className="relative z-50">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-lg transition-all duration-200 hover:bg-white/10 [&>svg]:stroke-[#171f3a]"
        style={{
          background: isOpen 
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.3) 100%)'
            : 'transparent',
          boxShadow: isOpen 
            ? '0 0 0 1px rgba(139, 92, 246, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)'
            : 'none',
        }}
        title="Menu"
      >
        {isOpen ? (
          <X className="h-4 w-4" stroke="#171f3a" strokeWidth={2} />
        ) : (
          <Menu className="h-4 w-4" stroke="#171f3a" strokeWidth={2} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute top-12 left-0 w-64 rounded-lg py-2 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
            boxShadow: '0 0 0 1px rgba(139, 92, 246, 0.3), 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px rgba(139, 92, 246, 0.1)',
          }}
        >
          {/* Main Menu Items */}
          <div className="px-1">
            {menuItems.map((item, index) => (
              item.divider ? (
                <div key={index} className="my-2 border-t border-white/10" />
              ) : (
                <button
                  key={index}
                  onClick={() => {
                    item.action?.();
                    if (item.label !== 'Command palette') setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    item.highlight 
                      ? 'text-violet-400 hover:bg-violet-500/20' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </div>
                  {item.shortcut && (
                    <span className="text-xs text-white/40">{item.shortcut}</span>
                  )}
                </button>
              )
            ))}
          </div>

          {/* Divider */}
          <div className="my-2 border-t border-white/10" />

          {/* External Links */}
          <div className="px-1">
            {externalLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  link.highlight 
                    ? 'text-violet-400 hover:bg-violet-500/20' 
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </a>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}

