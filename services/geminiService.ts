
import { HalalStatus, ScanResult } from "../types";

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
  enableImageDownscaling: boolean = false
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
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || 'anonymous'
        },
        body: JSON.stringify({
            images: processedImages
        })
    });

    if (!response.ok) {
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
    
    let userMessage = "حدث خطأ غير متوقع. حاول مرة أخرى.";
    
    if (error.message === "CONFIGURATION_ERROR") {
        userMessage = "خطأ في الإعدادات: يرجى إضافة API_KEY في إعدادات Vercel.";
    }
    else if (error.message.includes("Server Error") || error.message.includes("Failed to fetch")) {
        userMessage = "خطأ في الاتصال بالخادم. تأكد من أن الـ Backend يعمل بشكل صحيح.";
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
  userId?: string
): Promise<ScanResult> => {
  try {
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId || 'anonymous'
        },
        body: JSON.stringify({
            text: text
        })
    });

    if (!response.ok) {
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
    
    let userMessage = "حدث خطأ غير متوقع. حاول مرة أخرى.";

    if (error.message === "CONFIGURATION_ERROR") {
        userMessage = "خطأ في الإعدادات: يرجى إضافة API_KEY في إعدادات Vercel.";
    }
    else if (error.message.includes("Server Error") || error.message.includes("Failed to fetch")) {
        userMessage = "خطأ في الاتصال بالخادم. تأكد من أن الـ Backend يعمل.";
    }

    return {
      status: HalalStatus.NON_FOOD,
      reason: userMessage,
      ingredientsDetected: [],
      confidence: 0, 
    };
  }
};
