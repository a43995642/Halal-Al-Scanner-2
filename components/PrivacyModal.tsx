
import React from 'react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface PrivacyModalProps {
  onClose: () => void;
  lang: Language;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose, lang }) => {
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.privacyTitle}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
           <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
             {t.privacyContent}
           </div>
        </div>
        
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
           <button 
             onClick={onClose}
             className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
           >
             {t.closeBtn}
           </button>
        </div>
      </div>
    </div>
  );
};
