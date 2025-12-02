import React, { useState } from 'react';

interface OnboardingModalProps {
  onFinish: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onFinish }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col min-h-[500px] max-h-[90vh]">
        
        {/* Progress Bar */}
        <div className="flex gap-1 p-6 pb-0">
          {[0, 1, 2].map((idx) => (
             <div key={idx} className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${idx <= currentStep ? 'bg-emerald-500' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-grow p-6 flex flex-col items-center text-center justify-center">
           
           {currentStep === 0 && (
             <div className="animate-slide-up flex flex-col items-center">
               <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600 shadow-emerald-200 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                  </svg>
               </div>
               <h2 className="text-2xl font-bold text-gray-800 mb-3">ماسح الحلال الذكي</h2>
               <p className="text-gray-500 leading-relaxed max-w-xs">
                 أداة ذكية تساعدك على فحص المكونات الغذائية والتأكد من سلامتها الشرعية في ثوانٍ.
               </p>
             </div>
           )}

           {currentStep === 1 && (
             <div className="animate-slide-up flex flex-col items-center">
               <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600 shadow-blue-200 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
               </div>
               <h2 className="text-2xl font-bold text-gray-800 mb-3">كيفية الاستخدام</h2>
               <p className="text-gray-500 leading-relaxed mb-4 max-w-xs">
                 وجه الكاميرا نحو <strong className="text-gray-800">قائمة المكونات</strong> الخلفية.
               </p>
               <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                 </svg>
                 لا تصور الباركود أو اسم المنتج فقط
               </div>
             </div>
           )}

           {currentStep === 2 && (
             <div className="animate-slide-up flex flex-col items-center w-full">
               <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600 shadow-amber-200 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
                  </svg>
               </div>
               <h2 className="text-xl font-bold text-gray-800 mb-2">تنبيه وإخلاء مسؤولية</h2>
               <div className="text-right text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 w-full overflow-y-auto max-h-[220px] space-y-3 custom-scrollbar shadow-inner">
                  <p className="font-bold text-gray-900">يرجى قراءة التالي بعناية:</p>
                  <div className="flex gap-2 items-start">
                    <span className="text-amber-500 font-bold">1.</span>
                    <p>هذا التطبيق يستخدم الذكاء الاصطناعي، وهو <span className="font-bold text-red-600">يحتمل الخطأ والصواب</span>.</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-amber-500 font-bold">2.</span>
                    <p>النتائج للمساعدة فقط ولا تُعتبر فتوى شرعية أو بديلاً عن قراءة المكونات.</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-amber-500 font-bold">3.</span>
                    <p>أنت المسؤول الأول والأخير عن التحقق من حلال المنتج.</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-amber-500 font-bold">4.</span>
                    <p>في حال الشك، ابحث عن علامة "حلال" المعتمدة.</p>
                  </div>
               </div>
             </div>
           )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 mt-auto">
          <button 
            onClick={handleNext}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
                currentStep === 2 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'
            }`}
          >
            {currentStep === 2 ? (
                <>
                   <span>فهمت وأوافق</span>
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </>
            ) : (
                <>
                  <span>التالي</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 rotate-180">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                   </svg>
                </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};