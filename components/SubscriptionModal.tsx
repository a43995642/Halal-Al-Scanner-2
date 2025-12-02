import React, { useState } from 'react';

interface SubscriptionModalProps {
  onSubscribe: () => void;
  onClose: () => void;
  isLimitReached: boolean;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onSubscribe, onClose, isLimitReached }) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('lifetime');

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-slide-up relative flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full transition z-20 backdrop-blur-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 pb-10 text-center relative overflow-hidden shrink-0">
           {/* Background Pattern */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
           
           <div className="relative z-10 flex flex-col items-center">
             <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-amber-400">
                  <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.612-3.13 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z" clipRule="evenodd" />
                </svg>
             </div>
             <h2 className="text-2xl font-black text-white mb-2 leading-tight">
               {isLimitReached ? 'انتهت المحاولات المجانية' : 'افتح النسخة الاحترافية'}
             </h2>
             <p className="text-emerald-100 text-sm font-medium">
               احصل على وصول غير محدود ودقة أعلى
             </p>
           </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-grow bg-slate-50">
          <div className="p-6">
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 gap-3 mb-8">
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">سرعة ودقة مضاعفة</h4>
                  <p className="text-xs text-gray-500">استخدام نماذج ذكاء اصطناعي متقدمة</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                 <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">فحوصات لا محدودة</h4>
                  <p className="text-xs text-gray-500">لا قيود يومية على عدد الصور</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                 <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">دعم التطوير</h4>
                  <p className="text-xs text-gray-500">ساهم في تحسين التطبيق للمسلمين</p>
                </div>
              </div>
            </div>

            {/* Pricing Selection */}
            <h3 className="font-bold text-gray-900 mb-3 px-1">اختر الخطة المناسبة:</h3>
            <div className="space-y-3">
              {/* Monthly Plan */}
              <div 
                onClick={() => setSelectedPlan('monthly')}
                className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  selectedPlan === 'monthly' 
                    ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                    : 'border-gray-200 bg-white hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPlan === 'monthly' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                    {selectedPlan === 'monthly' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block">اشتراك شهري</span>
                    <span className="text-xs text-gray-500">يجدد تلقائياً، إلغاء في أي وقت</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 text-lg">9.99 ر.س</span>
                  <span className="text-xs text-gray-400 block">/ شهر</span>
                </div>
              </div>

              {/* Lifetime Plan */}
              <div 
                onClick={() => setSelectedPlan('lifetime')}
                className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between overflow-hidden ${
                  selectedPlan === 'lifetime' 
                    ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-400' 
                    : 'border-gray-200 bg-white hover:border-amber-200'
                }`}
              >
                {/* Badge */}
                <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                  أفضل قيمة (توفير 60%)
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPlan === 'lifetime' ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                     {selectedPlan === 'lifetime' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block pt-2">مدى الحياة</span>
                    <span className="text-xs text-gray-500">دفعة واحدة فقط، لا اشتراكات</span>
                  </div>
                </div>
                <div className="text-right pt-2">
                  <span className="text-xs text-gray-400 line-through block">120 ر.س</span>
                  <span className="font-bold text-amber-700 text-lg">49.99 ر.س</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer / CTA */}
        <div className="p-6 bg-white border-t border-gray-100 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
           <button 
              onClick={onSubscribe}
              className={`w-full py-4 font-black text-lg rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-white
                ${selectedPlan === 'lifetime' 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-amber-200' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                }`}
            >
              <span>
                {selectedPlan === 'lifetime' ? 'شراء مدى الحياة' : 'اشترك الآن'}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 opacity-90">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex justify-between items-center mt-4 text-[10px] text-gray-400 px-2">
              <button className="hover:text-gray-600 underline">استعادة المشتريات</button>
              <div className="space-x-2 space-x-reverse">
                <button className="hover:text-gray-600">الشروط</button>
                <span>•</span>
                <button className="hover:text-gray-600">الخصوصية</button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};
