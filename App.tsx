
import React, { useState, useEffect, useRef } from 'react';
import { Camera } from './components/Camera';
import { StatusBadge } from './components/StatusBadge';
import { SubscriptionModal } from './components/SubscriptionModal';
import { OnboardingModal } from './components/OnboardingModal';
import { PrivacyModal } from './components/PrivacyModal'; // Added Import
import { analyzeImage, analyzeText } from './services/geminiService';
import { ScanResult, ScanHistoryItem, HalalStatus, IngredientDetail, Language } from './types';
import { secureStorage } from './utils/secureStorage';
import { supabase } from './lib/supabase';
import { translations } from './utils/translations';

// Constants
const FREE_SCANS_LIMIT = 20; // UPDATED: Increased limit for testing
const MAX_IMAGES_PER_SCAN = 4; // Allow up to 4 images per scan

// Utility for Haptic Feedback
const vibrate = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

// Utility to compress images before sending to API or Sharing
const compressImage = (base64Str: string, maxWidth = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Resize if width is too large
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str); // Fallback if context fails
      }
    };
    img.onerror = () => resolve(base64Str); // Fallback if loading fails
  });
};

// Utility to convert Base64 to File for sharing
const dataURLtoFile = async (dataurl: string, filename: string): Promise<File> => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

// Helper to get ingredient styles based on status
const getIngredientStyle = (status: HalalStatus, isOverlay: boolean = false) => {
  if (isOverlay) {
    switch(status) {
      case HalalStatus.HARAM: 
        return "bg-red-700/95 border-red-600 text-white font-bold ring-2 ring-red-500/50 shadow-red-900/50";
      case HalalStatus.DOUBTFUL: 
        return "bg-amber-500/90 border-amber-400 text-white font-bold ring-2 ring-amber-500/50";
      default: 
        return "bg-white/20 border-white/20 text-white backdrop-blur-md";
    }
  } else {
    // Light mode list styles
    switch(status) {
      case HalalStatus.HARAM: 
        return "bg-red-700 text-white border-red-900 font-bold shadow-sm dark:border-red-600";
      case HalalStatus.DOUBTFUL: 
        return "bg-amber-50 text-amber-700 border-amber-200 font-bold dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700";
      default: 
        return "bg-white text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700";
    }
  }
};

// History Modal Component
const HistoryModal = ({ history, onClose, onLoadItem, lang }: { history: ScanHistoryItem[], onClose: () => void, onLoadItem: (item: ScanHistoryItem) => void, lang: Language }) => {
  const t = translations[lang];
  return (
    <div className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-slate-50 dark:bg-slate-950 rounded-t-3xl sm:rounded-2xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl animate-slide-up">
        <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             {t.historyTitle}
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-grow p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              <p>{t.noHistory}</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} onClick={() => onLoadItem(item)} className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 active:scale-[0.98] transition cursor-pointer flex justify-between items-center gap-3 hover:border-emerald-500/30">
                <div className="flex items-center gap-3 flex-grow overflow-hidden">
                   {item.thumbnail ? (
                     <img src={item.thumbnail} alt="Product" className="w-16 h-16 rounded-lg object-cover bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shrink-0" />
                   ) : (
                     <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-gray-400 dark:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                        </svg>
                     </div>
                   )}
                   <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            item.result.status === HalalStatus.HALAL ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                            item.result.status === HalalStatus.HARAM ? 'bg-red-700 text-white dark:bg-red-900' :
                            item.result.status === HalalStatus.DOUBTFUL ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {item.result.status === HalalStatus.HALAL ? t.statusHalal : 
                             item.result.status === HalalStatus.HARAM ? t.statusHaram : 
                             item.result.status === HalalStatus.DOUBTFUL ? t.statusDoubtful : t.statusNonFood}
                          </span>
                          {item.result.confidence !== undefined && (
                             <span className="text-[10px] bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                               {item.result.confidence}%
                             </span>
                          )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{item.result.reason}</p>
                   </div>
                </div>
                <div className="text-gray-300 dark:text-slate-700 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Text Input Modal
const TextInputModal = ({ onClose, onAnalyze, lang }: { onClose: () => void, onAnalyze: (text: string) => void, lang: Language }) => {
  const [text, setText] = useState('');
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
           <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-600">
               <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
             </svg>
             {t.manualInputTitle}
           </h3>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>
        <div className="p-4">
           <textarea
             className="w-full h-40 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none dark:text-white placeholder-gray-400"
             placeholder={t.manualInputPlaceholder}
             value={text}
             onChange={(e) => setText(e.target.value)}
             autoFocus
           />
           <p className="text-xs text-gray-500 mt-2">{t.manualInputHint}</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex gap-3">
           <button 
             onClick={() => onAnalyze(text)}
             disabled={!text.trim()}
             className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-900/10"
           >
             {t.analyzeTextBtn}
           </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  // CHANGED: Manage an array of images instead of a single string
  const [images, setImages] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false); 

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useLowQuality, setUseLowQuality] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // Onboarding & Terms
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false); // New Privacy State
  
  // History State
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Menu State for Mobile Header
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Subscription State (Supabase Integrated)
  const [isPremium, setIsPremium] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Language State
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('halalScannerLang')) {
      return localStorage.getItem('halalScannerLang') as Language;
    }
    return 'ar';
  });

  // Get current translation object
  const t = translations[language];

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check initial logic from inline script or localStorage
    if (typeof localStorage !== 'undefined' && localStorage.getItem('halalScannerTheme')) {
      return localStorage.getItem('halalScannerTheme') as 'light' | 'dark';
    }
    // Fallback to class check if script ran
    if (typeof window !== 'undefined' && document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    // Final fallback
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize: Load terms, History & Supabase Auth & PWA Prompt
  useEffect(() => {
    // PWA Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Terms / Onboarding
    const accepted = localStorage.getItem('halalScannerTermsAccepted');
    if (accepted !== 'true') {
      setShowOnboarding(true);
    }

    // History
    const savedHistory = localStorage.getItem('halalScannerHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // Data Migration: Convert old string[] ingredients to IngredientDetail[]
        const migratedHistory = parsedHistory.map((item: any) => {
             // Check if it's the old format (string array) and convert
             if (item.result?.ingredientsDetected?.length > 0 && typeof item.result.ingredientsDetected[0] === 'string') {
                 item.result.ingredientsDetected = item.result.ingredientsDetected.map((name: string) => ({
                     name: name,
                     status: HalalStatus.HALAL // Default for migrated data as we don't know the status
                 }));
             }
             return item;
        });

        setHistory(migratedHistory);
      } catch (e) {
        console.error("Failed to parse history");
      }
    }

    // Initialize Supabase Auth & Fetch Data
    const initSupabase = async () => {
      try {
        // 1. Get Session or Sign In Anonymously
        // Cast to any to bypass potential type definition issues with older/newer versions
        const authClient = supabase.auth as any;
        
        let session = null;
        if (typeof authClient.getSession === 'function') {
           const { data } = await authClient.getSession();
           session = data?.session;
        }

        let uid = session?.user?.id;

        if (!uid) {
          // Attempt Anonymous Sign-In
          if (typeof authClient.signInAnonymously === 'function') {
             const { data: anonData, error: anonError } = await authClient.signInAnonymously();
             if (anonError) {
                console.error("Auth Error:", anonError);
                // Fallback to local storage if auth fails (offline mode)
                const savedScanCount = secureStorage.getItem<number>('scanCount', 0);
                setScanCount(savedScanCount);
                return;
             }
             uid = anonData?.user?.id;
          } else {
             // Fallback if SDK doesn't support anonymous login
             console.warn("Anonymous sign-in not supported by this client.");
             const savedScanCount = secureStorage.getItem<number>('scanCount', 0);
             setScanCount(savedScanCount);
             return;
          }
        }

        if (uid) {
          setUserId(uid);
          // 2. Fetch User Stats from DB
          await fetchUserStats(uid);
        }
      } catch (err) {
        console.error("Supabase Init Failed:", err);
      }
    };

    // Load cached premium status immediately for UI responsiveness
    const cachedPremium = secureStorage.getItem<boolean>('isPremium', false);
    setIsPremium(cachedPremium);

    initSupabase();

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Fetch Stats Helper
  const fetchUserStats = async (uid: string) => {
      const { data, error } = await supabase
        .from('user_stats')
        .select('scan_count, is_premium')
        .eq('id', uid)
        .single();

      if (data) {
        setScanCount(data.scan_count);
        setIsPremium(data.is_premium);
        // Update local cache
        secureStorage.setItem('isPremium', data.is_premium);
      } else if (error && error.code === 'PGRST116') {
        // User has no stats row yet, will be created on first scan by backend
        setScanCount(0);
      }
  };

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('halalScannerTheme', theme);
  }, [theme]);

  // Language Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('lang', language);
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('halalScannerLang', language);
  }, [language]);

  const toggleTheme = () => {
    vibrate(20);
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    setIsMenuOpen(false);
  };

  const toggleLanguage = () => {
    vibrate(20);
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
    setIsMenuOpen(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setIsMenuOpen(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOnboardingFinish = () => {
    localStorage.setItem('halalScannerTermsAccepted', 'true');
    setShowOnboarding(false);
    vibrate(50);
  };

  const handleSubscribe = async () => {
    // 1. Check if we have a user
    if (!userId) {
       showToast(t.unexpectedError);
       return;
    }

    setIsUpgrading(true);
    
    try {
      // 2. Call the secure backend to upgrade
      const response = await fetch('/api/mock-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userId, plan: 'lifetime' })
      });

      if (!response.ok) {
        throw new Error('Upgrade failed');
      }

      // 3. If successful, update local state
      setIsPremium(true);
      secureStorage.setItem('isPremium', true); 
      setShowSubscriptionModal(false);
      showToast(t.activated);
      vibrate([50, 100, 50]);

    } catch (error) {
      console.error("Upgrade error", error);
      showToast(t.connectionError);
    } finally {
      setIsUpgrading(false);
    }
  };

  const saveToHistory = (scanResult: ScanResult, thumbnail?: string) => {
     // Create history item
     const newItem: ScanHistoryItem = {
       id: Date.now().toString(),
       date: Date.now(),
       result: scanResult,
       thumbnail
     };
     
     const updatedHistory = [newItem, ...history].slice(0, 30); // Keep last 30
     setHistory(updatedHistory);
     try {
        localStorage.setItem('halalScannerHistory', JSON.stringify(updatedHistory));
     } catch (e) {
        console.warn("Storage quota exceeded, trying without thumbnail", e);
        if (thumbnail) {
            const fallbackItem = { ...newItem, thumbnail: undefined };
            const fallbackHistory = [fallbackItem, ...history].slice(0, 30);
            setHistory(fallbackHistory);
            try {
                localStorage.setItem('halalScannerHistory', JSON.stringify(fallbackHistory));
            } catch (e2) {
                console.error("Storage still full");
            }
        }
     }
  };

  const loadHistoryItem = (item: ScanHistoryItem) => {
    setResult(item.result);
    // History usually stores only one thumbnail, so we set it as the only image
    setImages(item.thumbnail ? [item.thumbnail] : []);
    setShowHistory(false);
    setError(null);
    vibrate(20);
  };

  const handleShare = async () => {
    vibrate(20);
    if (!result) return;
    
    const statusLabel = result.status === HalalStatus.HALAL ? t.statusHalal : 
                         result.status === HalalStatus.HARAM ? t.statusHaram : 
                         result.status === HalalStatus.DOUBTFUL ? t.statusDoubtful : 
                         result.status === HalalStatus.NON_FOOD ? t.statusNonFood : t.statusUnknown;
    
    const confidenceStr = result.confidence ? `${result.confidence}%` : 'N/A';
    const ingredientsText = result.ingredientsDetected.map(i => i.name).join(', ');

    const shareText = `🔍 ${t.shareText}\n\n` +
      `${t.resultTitle} ${statusLabel}\n` +
      `${t.confidence}: ${confidenceStr}\n\n` +
      `📝 ${result.reason}\n\n` +
      `🥗 ${ingredientsText}\n\n` +
      `${t.appSubtitle}`;
    
    // Auto-copy text to clipboard as a fallback
    try {
      await navigator.clipboard.writeText(shareText);
      showToast(t.shareCopied);
    } catch (e) {
      console.warn("Clipboard access failed", e);
    }

    try {
      // 1. Check if sharing is supported
      if (!navigator.share) {
        alert(t.shareCopied);
        return;
      }

      const shareData: ShareData = {
        title: t.shareText,
        text: shareText, 
      };

      // 2. Prepare file sharing if image exists (Share the first one)
      if (images.length > 0 && navigator.canShare) {
        try {
          // Share the first image only to keep it simple
          const compressedForShare = await compressImage(images[0], 600, 0.6);
          const file = await dataURLtoFile(compressedForShare, 'halal-scan-result.jpg');
          const files = [file];
          
          if (navigator.canShare({ files })) {
             shareData.files = files;
          }
        } catch (e) {
          console.warn("Failed to create file for sharing", e);
        }
      }

      await navigator.share(shareData);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Share canceled by user');
        return;
      }
      console.error('Error sharing:', err);
      // Fallback message if sharing totally fails (though we copied to clipboard already)
      showToast(t.shareCopied);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    vibrate(20);
    if (e.target.files && e.target.files.length > 0) {
      if (!isPremium && scanCount >= FREE_SCANS_LIMIT) {
        setShowSubscriptionModal(true);
        e.target.value = ''; 
        return;
      }

      // Check limit
      const remainingSlots = MAX_IMAGES_PER_SCAN - images.length;
      if (remainingSlots <= 0) {
        showToast(`${t.maxImages} (${MAX_IMAGES_PER_SCAN})`);
        e.target.value = '';
        return;
      }
      
      const filesToProcess = Array.from(e.target.files).slice(0, remainingSlots) as File[];

      // Validate File Types
      const invalidFiles = filesToProcess.filter(file => !file.type.startsWith('image/'));
      if (invalidFiles.length > 0) {
         showToast(t.onlyImages);
         e.target.value = '';
         return;
      }

      setIsLoading(true); // Temporary loading state while reading files
      setError(null);
      setResult(null); // Clear previous result if adding more images to analyze again

      const newImages: string[] = [];

      for (const file of filesToProcess) {
         const reader = new FileReader();
         const promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
         });
         reader.readAsDataURL(file);
         newImages.push(await promise);
      }

      setImages(prev => [...prev, ...newImages]);
      setIsLoading(false);
      setProgress(0);
      vibrate(50);
      e.target.value = ''; // Reset input
    }
  };

  const handleCapture = (imageSrc: string) => {
    // If we've reached the limit, don't add more
    if (images.length >= MAX_IMAGES_PER_SCAN) {
       showToast(`${t.maxImages} (${MAX_IMAGES_PER_SCAN})`);
       return;
    }
    
    // Add image to list
    const newImages = [...images, imageSrc];
    setImages(newImages);
    
    // Auto-close camera if limit is reached
    if (newImages.length >= MAX_IMAGES_PER_SCAN) {
       setIsCameraOpen(false);
    }
    
    setResult(null); // Reset result if adding new image
    setError(null);
    setUseLowQuality(false);
    setProgress(0);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const openCamera = () => {
    vibrate(20);
    if (!isPremium && scanCount >= FREE_SCANS_LIMIT) {
      setShowSubscriptionModal(true);
      return;
    }
    if (images.length >= MAX_IMAGES_PER_SCAN) {
      showToast(`${t.maxImages}`);
      return;
    }
    setIsCameraOpen(true);
  };

  // Helper for text analysis (Manual Input)
  const handleAnalyzeText = async (text: string) => {
    vibrate(50);
    setShowTextModal(false);

    if (!isPremium && scanCount >= FREE_SCANS_LIMIT) {
      setShowSubscriptionModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setImages([]); // Clear images if text is used
    setProgress(20);

    try {
      if (progressInterval.current) clearInterval(progressInterval.current);
      progressInterval.current = setInterval(() => {
        setProgress(prev => (prev >= 90 ? 90 : prev + 5));
      }, 150);

      const scanResult = await analyzeText(text, userId || undefined, language);
      
      if (progressInterval.current) clearInterval(progressInterval.current);
      setProgress(100);

      if (scanResult.confidence === 0) {
         setError(scanResult.reason);
      } else {
         vibrate([50, 100]);
         setResult(scanResult);
         
         if (userId) await fetchUserStats(userId);
         else setScanCount(prev => prev + 1);

         saveToHistory(scanResult); // No thumbnail for text
      }
    } catch (err: any) {
       console.error("Text Analysis Error", err);
       if (progressInterval.current) clearInterval(progressInterval.current);
       let errorMessage = t.unexpectedError;
       if (err.message.includes("LIMIT_REACHED")) {
         setShowSubscriptionModal(true);
         errorMessage = t.limitReachedError;
       }
       setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    vibrate(50); // Tactile click feel
    
    // Strict Client Check (UI only)
    if (!isPremium && scanCount >= FREE_SCANS_LIMIT) {
      setShowSubscriptionModal(true);
      return;
    }

    if (images.length === 0) return;

    setIsLoading(true);
    setError(null);
    setProgress(5);
    
    try {
      const quality = useLowQuality ? 0.6 : 0.8;
      const width = useLowQuality ? 800 : 1024;
      
      // Compress all images
      const compressedImages = await Promise.all(
        images.map(img => compressImage(img, width, quality))
      );
      
      setProgress(30);
      
      setProgress(40);
      if (progressInterval.current) clearInterval(progressInterval.current);
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            if (progressInterval.current) clearInterval(progressInterval.current);
            return 90;
          }
          return prev + 2;
        });
      }, 200);

      // Pass array to service + userId + language
      const scanResult = await analyzeImage(compressedImages, userId || undefined, true, true, language);
      
      if (progressInterval.current) clearInterval(progressInterval.current);
      setProgress(100);
      
      if (scanResult.confidence === 0) {
         vibrate([100, 50, 100]); // Error vibration
         if (scanResult.reason.includes('image size') || scanResult.reason.includes('حجم الصورة')) {
           setUseLowQuality(true);
         }
         setError(scanResult.reason);
      } else {
         // Success!
         vibrate([50, 100]); 
         setResult(scanResult);
         
         // Refresh Stats from Server to get correct count
         if (userId) {
            await fetchUserStats(userId);
         } else {
           // Fallback for offline/no-auth
           setScanCount(prev => prev + 1);
         }

         // Save first image as thumbnail
         compressImage(compressedImages[0], 200, 0.6).then(thumb => {
             saveToHistory(scanResult, thumb);
         }).catch(() => {
             saveToHistory(scanResult);
         });
      }
    } catch (err: any) {
      console.error("Analysis Error:", err);
      vibrate([100, 50, 100]); // Error vibration
      if (progressInterval.current) clearInterval(progressInterval.current);
      
      let errorMessage = t.unexpectedError;
      if (err instanceof Error || (typeof err === 'object' && err !== null)) {
         const msg = (err.message || JSON.stringify(err)).toLowerCase();
         if (msg.includes('limit_reached')) {
             setShowSubscriptionModal(true);
             errorMessage = t.limitReachedError;
         }
         else if (msg.includes('network') || msg.includes('fetch')) errorMessage = t.connectionError;
         else if (msg.includes('413') || msg.includes('rpc')) {
             setUseLowQuality(true);
             errorMessage = t.imageTooLarge;
         }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetApp = () => {
    vibrate(20);
    setImages([]); // Clear all images
    setResult(null);
    setError(null);
    setIsCameraOpen(false);
    setProgress(0);
    if (progressInterval.current) clearInterval(progressInterval.current);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col transition-colors duration-300">
      {showOnboarding && <OnboardingModal onFinish={handleOnboardingFinish} lang={language} />}
      {showHistory && <HistoryModal history={history} onClose={() => setShowHistory(false)} onLoadItem={loadHistoryItem} lang={language} />}
      {showTextModal && <TextInputModal onClose={() => setShowTextModal(false)} onAnalyze={handleAnalyzeText} lang={language} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} lang={language} />}
      
      {showSubscriptionModal && (
        <SubscriptionModal 
          onSubscribe={handleSubscribe} 
          onClose={() => setShowSubscriptionModal(false)}
          isLimitReached={!isPremium && scanCount >= FREE_SCANS_LIMIT}
          lang={language}
        />
      )}
      
      {/* Loading Overlay for Upgrade */}
      {isUpgrading && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-gray-800 dark:text-white">{t.activating}</p>
           </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white px-6 py-3 rounded-full shadow-xl z-[80] animate-fade-in text-sm font-medium text-center min-w-[200px] backdrop-blur-sm border border-white/10">
          {toastMessage}
        </div>
      )}

      <header className="bg-emerald-600 dark:bg-emerald-800 text-white pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 px-6 shadow-lg rounded-b-3xl mb-8 sticky top-0 z-40 transition-colors duration-500">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {/* Title Section: Added Logo */}
          <div className="flex items-center gap-3 flex-1 min-w-0 pl-2">
            <img 
              src="./icon.png" 
              alt="App Logo" 
              className="w-12 h-12 rounded-xl shadow-md border border-white/10 object-cover bg-white/10" 
              onError={(e) => e.currentTarget.style.display = 'none'} 
            />
            <div className="min-w-0"> 
              <h1 className="text-2xl font-bold mb-0.5 whitespace-nowrap leading-tight">
                {t.appTitle}
              </h1>
              <p className="text-emerald-100 text-sm truncate opacity-90">{t.appSubtitle}</p>
            </div>
          </div>
          
          {/* Controls Section */}
          <div className="flex gap-2 items-center shrink-0">
             {/* Pro/Free Badge (Visible Always) */}
             {!isPremium ? (
               <div 
                 onClick={() => setShowSubscriptionModal(true)}
                 className="flex flex-col items-end justify-center cursor-pointer"
               >
                 <div className="bg-white/20 px-3 py-1 rounded-full border border-white/10 hover:bg-white/30 transition">
                   <span className="text-xs font-bold text-white whitespace-nowrap">
                      {Math.max(0, FREE_SCANS_LIMIT - scanCount)} {t.freeScansLeft}
                   </span>
                 </div>
               </div>
             ) : (
                <div className="flex flex-col items-end justify-center">
                  <div className="bg-amber-400 dark:bg-amber-500 text-amber-900 dark:text-amber-950 px-2 sm:px-3 py-1 rounded-full shadow-sm border border-amber-300 dark:border-amber-400 flex items-center gap-1.5">
                    <span className="font-black text-[10px] bg-white/20 px-1.5 rounded-[4px]">PRO</span>
                    {/* Compact badge on mobile */}
                    <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap hidden sm:inline">{t.proBadge}</span>
                  </div>
                </div>
             )}

             {/* History Button (Visible Always - Essential) */}
             <button 
               onClick={() => setShowHistory(true)} 
               className="bg-white/20 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/30 transition shrink-0"
               aria-label={t.history}
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </button>

             {/* Menu Dropdown Trigger (Replaces inline Lang/Theme/Help buttons on mobile to save space) */}
             <div className="relative" ref={menuRef}>
               <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="bg-white/20 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/30 transition shrink-0"
                  aria-label="Menu"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                  </svg>
               </button>

               {/* Dropdown Menu */}
               {isMenuOpen && (
                 <div className={`absolute top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl py-2 z-50 animate-fade-in border border-gray-100 dark:border-slate-700 ${language === 'ar' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}>
                    
                    {/* Install App Button (PWA) - Only if supported */}
                    {deferredPrompt && (
                      <button 
                        onClick={handleInstallClick}
                        className="w-full text-start px-4 py-3 flex items-center gap-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition border-b border-gray-100 dark:border-slate-700"
                      >
                         <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                         </div>
                         <span className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                            {language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
                         </span>
                      </button>
                    )}

                    {/* Language Switch */}
                    <button 
                      onClick={toggleLanguage}
                      className="w-full text-start px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        {language === 'ar' ? 'EN' : 'ع'}
                      </div>
                      <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                        {language === 'ar' ? 'English' : 'العربية'}
                      </span>
                    </button>

                    {/* Theme Switch */}
                    <button 
                      onClick={toggleTheme}
                      className="w-full text-start px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                         {theme === 'dark' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                            </svg>
                         ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                            </svg>
                         )}
                      </div>
                      <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                        {theme === 'dark' ? (language === 'ar' ? 'الوضع الفاتح' : 'Light Mode') : (language === 'ar' ? 'الوضع الداكن' : 'Dark Mode')}
                      </span>
                    </button>

                    <div className="h-px bg-gray-100 dark:bg-slate-700 my-1 mx-2"></div>

                    {/* How it works */}
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowOnboarding(true);
                      }}
                      className="w-full text-start px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                    >
                       <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                          </svg>
                       </div>
                       <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                          {t.howItWorks}
                       </span>
                    </button>
                 </div>
               )}
             </div>

          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 flex-grow w-full pb-[env(safe-area-inset-bottom)]">
        {isCameraOpen && (
          <Camera 
            onCapture={handleCapture} 
            onClose={() => setIsCameraOpen(false)} 
            lang={language}
          />
        )}

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 min-h-[400px] transition-all duration-300 mb-6 relative overflow-hidden flex flex-col border dark:border-slate-800">
          
          {images.length === 0 && !result && (
            <div className="flex flex-col items-center justify-center py-10 space-y-6 flex-grow">
              <div className="w-32 h-32 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-emerald-400 dark:text-emerald-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                
                {!isPremium && scanCount >= FREE_SCANS_LIMIT && (
                   <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg animate-bounce">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                     </svg>
                   </div>
                )}
              </div>

              <p className="text-gray-500 dark:text-gray-400 text-center font-medium">
                 {t.mainHint}
              </p>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button 
                  onClick={openCamera}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all active:scale-95 ${
                    !isPremium && scanCount >= FREE_SCANS_LIMIT 
                    ? 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-gray-600 grayscale' 
                    : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  <span className="font-bold">{t.btnCamera}</span>
                </button>
                <label className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                    !isPremium && scanCount >= FREE_SCANS_LIMIT 
                    ? 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-gray-600 grayscale' 
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                  }`}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    disabled={!isPremium && scanCount >= FREE_SCANS_LIMIT}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <span className="font-bold">{t.btnGallery}</span>
                </label>
              </div>

              {/* Text Input Option */}
               <button 
                  onClick={() => setShowTextModal(true)}
                  className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border transition-all active:scale-95 ${
                    !isPremium && scanCount >= FREE_SCANS_LIMIT 
                    ? 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-gray-600 grayscale' 
                    : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  <span className="font-bold">{t.btnManual}</span>
              </button>
            </div>
          )}

          {/* Content when Images are Selected */}
          {(images.length > 0 || result) && (
            <div className="animate-fade-in flex flex-col flex-grow">
              
              {/* Image Gallery / Preview */}
              {!result && (
                <div className="mb-6 space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t.selectedImages} ({images.length}/{MAX_IMAGES_PER_SCAN})</h3>
                     {images.length < MAX_IMAGES_PER_SCAN && (
                       <button onClick={resetApp} className="text-xs text-red-500 hover:text-red-700">{t.deleteAll}</button>
                     )}
                  </div>
                  
                  {/* Horizontal Scroll Gallery */}
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x hide-scrollbar">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-32 h-32 shrink-0 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-slate-700 group snap-center">
                        <img src={img} alt={`Capture ${idx + 1}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-90 hover:opacity-100 shadow-sm transition active:scale-90"
                          aria-label="Remove image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    {/* Add More Button (Placeholder in list) */}
                    {images.length < MAX_IMAGES_PER_SCAN && (
                      <button 
                        onClick={openCamera}
                        className="w-32 h-32 shrink-0 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition active:scale-95 snap-center"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                         </svg>
                         <span className="text-xs font-bold">{t.addImage}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Main Preview (Only shows the first image large if result is present, or scanning animation) */}
              {(result || isLoading) && (
                <div className={`relative rounded-xl overflow-hidden shadow-md mb-6 bg-gray-900 group shrink-0 flex items-center justify-center min-h-[250px]`}>
                  {/* Show preview context if images exist, else show placeholder for text scan */}
                  {images.length > 0 ? (
                      <img src={images[0]} alt="Preview" className="w-full h-full object-contain max-h-[400px]" />
                  ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-white/50">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 mb-4 opacity-30">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                         </svg>
                         <p className="text-sm">{t.analyzingText}</p>
                      </div>
                  )}
                  
                  {images.length > 1 && (
                     <div className={`absolute top-2 ${language === 'ar' ? 'left-2' : 'right-2'} bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md z-20`}>
                        + {images.length - 1} {t.moreImages}
                     </div>
                  )}

                  {/* Scanning Animation Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div className="absolute inset-0 bg-emerald-900/20"></div>
                      <div className="absolute w-full h-1 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] animate-scan top-0"></div>
                    </div>
                  )}

                  {/* Result Overlays */}
                  {result && !isLoading && (
                    <>
                       {/* Confidence Badge */}
                       {result.confidence !== undefined && (
                          <div className={`absolute top-2 ${language === 'ar' ? 'right-2' : 'left-2'} backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold border shadow-lg flex items-center gap-1.5 z-20 ${
                            result.confidence > 80 ? 'bg-emerald-500/80 border-emerald-400 text-white' : 
                            result.confidence > 50 ? 'bg-yellow-500/80 border-yellow-400 text-white' : 
                            'bg-red-500/80 border-red-400 text-white'
                          }`}>
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                             </svg>
                             <span>{t.confidence} {result.confidence}%</span>
                          </div>
                       )}

                       {/* Ingredients Overlay HUD */}
                       <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-12 z-20">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                             <p className="text-white/90 text-xs font-bold">{t.ingredientsDetected}</p>
                          </div>
                          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto custom-scrollbar">
                            {result.ingredientsDetected && result.ingredientsDetected.length > 0 ? (
                                result.ingredientsDetected.map((ing, idx) => (
                                  <span 
                                    key={idx} 
                                    className={`text-[10px] px-2.5 py-1 rounded-md border shadow-sm transition-all ${getIngredientStyle(ing.status, true)}`}
                                  >
                                    {ing.name}
                                  </span>
                                ))
                            ) : (
                               <span className="text-white/60 text-[10px] italic">{t.noIngredientsFound}</span>
                            )}
                          </div>
                       </div>
                    </>
                  )}

                  {!isLoading && !result && (
                    <button 
                      onClick={resetApp}
                      className={`absolute top-2 ${language === 'ar' ? 'left-2' : 'right-2'} bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm active:scale-90 transition`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Controls Area */}
              <div className="mt-auto space-y-3">
                {isLoading && (
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 animate-slide-up text-center">
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden relative mb-4">
                      <div className="absolute inset-0 w-full h-full bg-white/20 animate-pulse z-10"></div>
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out relative"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1 animate-pulse">{t.analyzingDeep}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[90%] mx-auto">
                       {t.analyzingDesc}
                    </p>
                  </div>
                )}

                {!isLoading && error && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-900/50 animate-slide-up">
                    <div className="flex gap-3">
                       <div className="mt-1 text-red-500 shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                       </div>
                       <div className="flex-grow">
                          <h4 className="text-sm font-bold text-red-800 dark:text-red-200 mb-1">{t.analysisFailed}</h4>
                          <p className="text-xs text-red-600 dark:text-red-300 mb-3 leading-relaxed">{error}</p>
                          <div className="flex gap-2">
                            {images.length > 0 && (
                                <button 
                                onClick={handleAnalyze}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-sm active:scale-95 transition"
                                >
                                {useLowQuality ? t.retryHighCompression : t.retry}
                                </button>
                            )}
                            <button 
                              onClick={resetApp}
                              className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs font-bold py-2.5 px-3 rounded-lg active:scale-95 transition"
                            >
                              {t.cancel}
                            </button>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {!isLoading && !error && !result && images.length > 0 && (
                   <button
                    onClick={handleAnalyze}
                    className="w-full py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    {t.scanImagesBtn} ({images.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Result State - Details Section */}
          {result && (
            <div className="animate-slide-up">
               {/* Header for Result View: Share & New Scan */}
               <div className="flex justify-between items-center mb-4 gap-2">
                 <button 
                   onClick={handleShare}
                   className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition border border-blue-100 dark:border-blue-900 shadow-sm bg-white dark:bg-slate-800"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                   {t.share}
                 </button>
                 <button onClick={resetApp} className="text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-1.5 rounded-lg transition border border-emerald-100 dark:border-emerald-900 shadow-sm bg-white dark:bg-slate-800">
                   {t.newScan}
                 </button>
               </div>

               <StatusBadge status={result.status} lang={language} />
               
               <div className="space-y-4">
                 <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                   <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">{t.resultTitle}</h3>
                   <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{result.reason}</p>
                 </div>

                 {/* Detailed List */}
                 {result.ingredientsDetected && result.ingredientsDetected.length > 0 && (
                   <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700">
                     <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">{t.ingredientsDetails}</h3>
                     <div className="flex flex-wrap gap-2">
                       {result.ingredientsDetected.map((ing, idx) => (
                         <span 
                            key={idx} 
                            className={`px-3 py-1.5 rounded-full text-sm shadow-sm border transition-colors ${getIngredientStyle(ing.status)}`}
                         >
                           {ing.name}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            </div>
          )}

        </div>
      </main>
      
      <footer className="text-center text-gray-400 dark:text-gray-500 text-xs pb-6 pt-4">
        <p className="mb-1">{t.footerDisclaimer1}</p>
        <p className="mb-3">{t.footerDisclaimer2}</p>
        <div className="flex justify-center gap-4 mt-4">
           <button 
            onClick={() => setShowPrivacy(true)}
            className="text-emerald-600 dark:text-emerald-500 underline hover:text-emerald-700 cursor-pointer bg-transparent border-none p-0"
           >
             {t.privacyPolicy}
           </button>
           <a href="#" className="text-emerald-600 dark:text-emerald-500 underline hover:text-emerald-700">{t.termsOfUse}</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
