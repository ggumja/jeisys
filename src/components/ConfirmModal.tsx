import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  type = 'danger',
  isLoading = false
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <AlertCircle className="w-8 h-8 text-red-600" />,
      bg: 'bg-red-50',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertCircle className="w-8 h-8 text-orange-500" />,
      bg: 'bg-orange-50',
      button: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    info: {
      icon: <AlertCircle className="w-8 h-8 text-blue-500" />,
      bg: 'bg-blue-50',
      button: 'bg-neutral-900 hover:bg-neutral-800 text-white',
    }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Body */}
      <div className="relative bg-white w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className={`mb-6 p-4 rounded-full ${config.bg}`}>
              {config.icon}
            </div>
            
            <h3 className="text-xl font-bold text-neutral-900 mb-2 leading-tight">
              {title}
            </h3>
            
            <p className="text-neutral-500 text-sm leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </div>
        </div>
        
        <div className="flex border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-4 text-sm font-bold text-neutral-500 hover:bg-neutral-50 transition-colors border-r border-neutral-100"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-6 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 ${config.button} disabled:opacity-50`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
