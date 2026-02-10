
/**
 * Encryption Utility for Likkle Wisdom
 * Handles client-side encryption for sensitive user notes using Web Crypto API (AES-GCM).
 */

const ENCRYPTION_KEY_PREFIX = 'likkle-wisdom-v1-';

/**
 * Derives a deterministic cryptographic key from a user ID.
 * In a production app, this would ideally be derived from a user's password.
 */
async function getDerivedKey(userId: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(ENCRYPTION_KEY_PREFIX + userId),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('rum-and-wisdom-salt'), // Constant salt for deterministic derivation
            iterations: 100000,
            hash: 'SHA-256',
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export const EncryptionService = {
    /**
     * Encrypts a string of text.
     * Returns a base64 string containing the IV and the ciphertext.
     */
    async encrypt(text: string, userId: string): Promise<string> {
        if (!text || !userId) return text;
        try {
            const key = await getDerivedKey(userId);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encoder = new TextEncoder();
            const encodedText = encoder.encode(text);

            const ciphertext = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                encodedText
            );

            const combined = new Uint8Array(iv.length + ciphertext.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(ciphertext), iv.length);

            return btoa(String.fromCharCode(...combined));
        } catch (e) {
            console.error('Encryption failed:', e);
            return text;
        }
    },

    /**
     * Decrypts a base64 string.
     * If decryption fails (e.g. if the text was not encrypted), returns the original text.
     */
    async decrypt(blob: string, userId: string): Promise<string> {
        if (!blob || !userId || blob.length < 16) return blob;
        try {
            const key = await getDerivedKey(userId);
            const combined = new Uint8Array(
                atob(blob)
                    .split('')
                    .map((c) => c.charCodeAt(0))
            );

            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                ciphertext
            );

            return new TextDecoder().decode(decrypted);
        } catch (e) {
            // If it fails, it might be plain text from before encryption was implemented
            return blob;
        }
    }
};
