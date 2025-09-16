import React from 'react';
import ReactModal from 'react-modal';

interface ModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  widthClass?: string; // e.g., 'max-w-md'
}

const Modal: React.FC<ModalProps> = ({ isOpen, onRequestClose, children, widthClass = 'max-w-md' }) => {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      shouldCloseOnOverlayClick
      overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
      className={`bg-white dark:bg-gray-800 w-full ${widthClass} rounded-xl shadow-2xl outline-none max-h-[85vh] overflow-hidden flex flex-col`}
      bodyOpenClassName="overflow-hidden"
    >
      {children}
    </ReactModal>
  );
};

export default Modal;


