
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Feedback</h3>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
          Found a bug or have a suggestion? We'd love to hear from you to help improve the experience.
        </p>

        <div className="space-y-3">
          <a 
            href="mailto:support@example.com?subject=Bring%20Anything%20to%20Life%20Feedback"
            className="flex items-center justify-center w-full py-2 px-4 bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Send Email
          </a>
          <button 
            onClick={onClose}
            className="flex items-center justify-center w-full py-2 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
      
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose}></div>
    </div>
  );
};
