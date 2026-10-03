import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  widthClass?: string;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  position = 'right',
  widthClass = 'max-w-md',
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scroll when open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-mono text-xs">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 ${
          position === 'right' ? 'right-0' : 'left-0'
        } flex max-w-full pointer-events-auto`}
      >
        <div
          className={`w-screen ${widthClass} bg-zinc-950 border-zinc-800 shadow-2xl flex flex-col justify-between ${
            position === 'right' ? 'border-l' : 'border-r'
          } animate-in ${
            position === 'right' ? 'slide-in-from-right' : 'slide-in-from-left'
          } duration-300`}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/80 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[11px] text-zinc-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              aria-label="Fechar gaveta lateral"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {children}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/50 text-[10px] text-zinc-500 flex items-center justify-between">
            <span>EGC Mobile Drawer</span>
            <span>ESC para fechar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
