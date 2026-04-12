import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ModalType = 'alert' | 'confirm';

interface ModalOptions {
  title: string;
  description?: string;
  cancelText?: string;
  confirmText?: string;
}

interface ModalState extends ModalOptions {
  isOpen: boolean;
  type: ModalType;
  resolve: (value: boolean) => void;
}

interface ModalContextType {
  alert: (options: ModalOptions | string) => Promise<boolean>;
  confirm: (options: ModalOptions | string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: 'alert',
    title: '',
    description: '',
    resolve: () => {},
  });

  const showModal = useCallback((type: ModalType, options: ModalOptions | string) => {
    return new Promise<boolean>((resolve) => {
      const modalOptions: ModalOptions = typeof options === 'string' 
        ? { title: options } 
        : options;

      setModal({
        ...modalOptions,
        isOpen: true,
        type,
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options: ModalOptions | string) => {
    return showModal('alert', options);
  }, [showModal]);

  const confirm = useCallback((options: ModalOptions | string) => {
    return showModal('confirm', options);
  }, [showModal]);

  const handleConfirm = () => {
    modal.resolve(true);
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    modal.resolve(false);
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{ alert, confirm }}>
      {children}
      <ModalRenderer 
        modal={modal} 
        onConfirm={handleConfirm} 
        onCancel={handleCancel} 
      />
    </ModalContext.Provider>
  );
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

function ModalRenderer({ 
  modal, 
  onConfirm, 
  onCancel 
}: { 
  modal: ModalState, 
  onConfirm: () => void, 
  onCancel: () => void 
}) {
  return (
    <AlertDialog open={modal.isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{modal.title}</AlertDialogTitle>
          {modal.description && (
            <AlertDialogDescription>
              {modal.description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-row justify-end gap-3 mt-6">
          {modal.type === 'confirm' && (
            <AlertDialogCancel 
              onClick={onCancel}
              className="px-6 py-2 min-w-[100px] border-neutral-300"
            >
              {modal.cancelText || '취소'}
            </AlertDialogCancel>
          )}
          <AlertDialogAction 
            onClick={onConfirm} 
            className="!bg-[#21358D] hover:!bg-[#1a2b72] !text-white font-bold px-6 py-2 min-w-[100px] border-none shadow-md"
          >
            {modal.confirmText || '확인'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
