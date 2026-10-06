/**
 * Componente de Gaveta Lateral Deslizante (Sidebar Drawer) para o EGC.
 * Suporta abertura suave a partir da esquerda ou direita com backdrop translúcido,
 * altura máxima de 100vh/100dvh, rolagem vertical fluida (overflow-y: auto)
 * e padding-bottom generoso para exibição integral de todos os elementos.
 *
 * Autor: Marco Antônio Conceição
 * Regras: Decisão D2 (Autoria 100% humana) e Decisão D3 (Sem travessões unicode)
 */
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
  position = 'left',
  widthClass = 'max-w-md',
}) => {
  // Fecha a gaveta com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Evita rolagem do body quando a gaveta estiver aberta
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
      {/* Backdrop escuro translúcido com desfoque e foco */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in cursor-pointer"
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 ${
          position === 'right' ? 'right-0' : 'left-0'
        } flex max-w-full pointer-events-auto h-full max-h-[100dvh]`}
      >
        <div
          className={`w-screen ${widthClass} h-full max-h-[100dvh] bg-zinc-950 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col ${
            position === 'right' ? 'border-l' : 'border-r'
          } animate-in ${
            position === 'right' ? 'slide-in-from-right' : 'slide-in-from-left'
          } duration-300 ease-out`}
        >
          {/* Cabeçalho da Gaveta Lateral (Fixo no topo da gaveta) */}
          <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-10">
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
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800 transition active:scale-95 shrink-0"
              aria-label="Fechar gaveta lateral"
            >
              <X className="w-4 h-4 text-zinc-300" />
            </button>
          </div>

          {/* Corpo Rolável da Gaveta com altura elástica, scroll suave e padding inferior generoso */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pb-28 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900/50 touch-pan-y">
            {children}
          </div>

          {/* Rodapé da Gaveta (Fixo na base da gaveta) */}
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/90 text-[10px] text-zinc-400 flex items-center justify-between font-mono shrink-0">
            <span className="text-zinc-400">Centro de Comando EGC</span>
            <span className="text-zinc-500">ESC ou clique fora para fechar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
