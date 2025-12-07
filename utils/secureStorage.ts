

// Simple obfuscation utility to prevent casual tampering with localStorage

// Note: In a real banking app, you would use a backend. For a client-side app, this prevents 99% of users from cheating.


const SALT = "HALAL_SCAN_SECURE_";


export const secureStorage = {

setItem: (key: string, value: any) => {

try {

const stringValue = JSON.stringify(value);

// Encode to Base64 to make it unreadable to humans immediately

const encoded = btoa(encodeURIComponent(stringValue));

localStorage.setItem(`${SALT}${key}`, encoded);

} catch (e) {

console.warn("Storage write failed", e);

}

},


getItem: <T>(key: string, defaultValue: T): T => {

try {

const item = localStorage.getItem(`${SALT}${key}`);

if (!item) return defaultValue;

// Decode

const decoded = decodeURIComponent(atob(item));

return JSON.parse(decoded) as T;

} catch (e) {

console.warn("Storage read failed/tampered", e);

return defaultValue;

}

},


removeItem: (key: string) => {

localStorage.removeItem(`${SALT}${key}`);

}

};


