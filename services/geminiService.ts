
import { HalalStatus, ScanResult, Language } from "../types";
import { Capacitor } from '@capacitor/core';

// ⚠️ تم التحديث: استخدام الرابط الرئيسي الثابت للمشروع
const VERCEL_PROJECT_URL = 'https://halal-al-scanner-2.vercel.app'; 

const getBaseUrl = () => {
  // إذا كان التطبيق يعمل على الهاتف (Native)، نستخدم رابط فيرسل الكامل
  if (Capacitor.isNativePlatform()) {
    // التأكد من عدم وجود / في النهاية
    return VERCEL_PROJECT_URL.replace(/\/$/, '');
  }
  // إذا كان يعمل على المتصفح، نستخدم الرابط النسبي العادي
  return '';
};

// Helper to downscale image if dimensions exceed limits (Client Side Processing)
const downscaleImageIfNeeded = (base64Str: string, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const width = img.width;
      const height = img.height;

      if (width <= maxWidth && height <= maxHeight) {
        resolve(base64Str);
        return;
      }

      const ratio = Math.min(maxWidth / width, maxHeight / height);
      const newWidth = Math.round(width * ratio);
      const newHeight = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const analyzeImage = async (
  base64Images: string[], 
  userId?: string,
  enhance: boolean = false,
  enableImageDownscaling: boolean = false,
  language: Language = 'ar'
): Promise<ScanResult> => {
  
  try {
    // 1. Client-Side Optimization (Resize/Process)
    const processedImages = await Promise.all(base64Images.map(async (img) => {
      let processed = img;
      if (enableImageDownscaling) {
        processed = await downscaleImageIfNeeded(processed, 1500, 1500);
      }
      return processed.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");
    }));

    // 2. Call our Secure Backend Proxy
    const baseUrl = getBaseUrl();
    console.log("Connecting to backend:", baseUrl || "Local/Relative");
    
    const response = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || 'anonymous',
            'x-language': language
        },
        body: JSON.stringify({
            images: processedImages
        })
    });

    if (!response.ok) {
        // Handle Timeout specifically
        if (response.status === 504) {
            throw new Error("TIMEOUT_ERROR");
        }

        const errData = await response.json().catch(() => ({}));
        
        if (errData.error === 'CONFIGURATION_ERROR') {
             throw new Error("CONFIGURATION_ERROR");
        }
        if (response.status === 403 && (errData.error === 'LIMIT_REACHED')) {
            throw new Error("LIMIT_REACHED"); 
        }
        throw new Error(errData.error || `Server Error: ${response.status}`);
    }

    const result = await response.json();
    return result as ScanResult;

  } catch (error: any) {
    console.error("Error analyzing image:", error);
    if (error.message === "LIMIT_REACHED") throw error;
    
    // Localize Error Messages based on requested language
    const isAr = language === 'ar';
    let userMessage = isAr ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "An unexpected error occurred. Please try again.";
    
    if (error.message === "CONFIGURATION_ERROR") {
        userMessage = isAr 
          ? "خطأ في الإعدادات: يرجى إضافة API_KEY في إعدادات Vercel." 
          : "Configuration Error: Please add API_KEY in Vercel settings.";
    }
    else if (error.message === "TIMEOUT_ERROR") {
        userMessage = isAr
          ? "استغرق الخادم وقتاً طويلاً في التحليل. يرجى المحاولة بصورة واحدة فقط أو بدقة أقل."
          : "Server timeout. Please try with fewer images or lower quality.";
    }
    else if (error.message.includes("Server Error") || error.message.includes("Failed to fetch")) {
        userMessage = isAr
          ? "خطأ في الاتصال بالخادم. يرجى التأكد من رفع التحديثات إلى Vercel (CORS)."
          : "Connection error. Ensure Vercel deployment is active.";
    }

    return {
      status: HalalStatus.NON_FOOD,
      reason: userMessage,
      ingredientsDetected: [],
      confidence: 0, 
    };
  }
};

export const analyzeText = async (
  text: string, 
  userId?: string,
  language: Language = 'ar'
): Promise<ScanResult> => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || 'anonymous',
            'x-language': language
        },
        body: JSON.stringify({
            text: text
        })
    });

    if (!response.ok) {
        if (response.status === 504) {
            throw new Error("TIMEOUT_ERROR");
        }

        const errData = await response.json().catch(() => ({}));

        if (errData.error === 'CONFIGURATION_ERROR') {
             throw new Error("CONFIGURATION_ERROR");
        }
        if (response.status === 403 && (errData.error === 'LIMIT_REACHED')) {
            throw new Error("LIMIT_REACHED"); 
        }
        throw new Error(errData.error || `Server Error: ${response.status}`);
    }

    const result = await response.json();
    return result as ScanResult;

  } catch (error: any) {
    console.error("Error analyzing text:", error);
    if (error.message === "LIMIT_REACHED") throw error;
    
    const isAr = language === 'ar';
    let userMessage = isAr ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "An unexpected error occurred. Please try again.";

    if (error.message === "CONFIGURATION_ERROR") {
         userMessage = isAr 
          ? "خطأ في الإعدادات: يرجى إضافة API_KEY في إعدادات Vercel." 
          : "Configuration Error: Please add API_KEY in Vercel settings.";
    }
    else if (error.message === "TIMEOUT_ERROR") {
        userMessage = isAr ? "استغرق الخادم وقتاً طويلاً. يرجى المحاولة مرة أخرى." : "Server timeout. Please try again.";
    }
    else if (error.message.includes("Server Error") || error.message.includes("Failed to fetch")) {
         userMessage = isAr ? "خطأ في الاتصال بالخادم." : "Server connection failed.";
    }

    return {
      status: HalalStatus.NON_FOOD,
      reason: userMessage,
      ingredientsDetected: [],
      confidence: 0, 
    };
  }
};
