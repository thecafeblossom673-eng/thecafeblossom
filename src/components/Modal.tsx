import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'alert' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'alert',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-full shrink-0 ${type === 'confirm' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
              {type === 'confirm' ? <HelpCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
            </div>
            <div className="pt-1 flex-1">
              <h3 className="font-serif text-lg font-bold text-foreground leading-none">{title}</h3>
              <p className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-muted/50 border-t border-border px-6 py-4 flex items-center justify-end gap-3 font-sans">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              else onClose();
            }}
            className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-sm ${
              type === 'confirm' 
                ? 'bg-primary hover:bg-primary/90' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
