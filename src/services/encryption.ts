
/**
 * Encryption Utility for Likkle Wisdom
 * Handles client-side encryption for sensitive user notes using Web Crypto API (AES-GCM).
 */

import { supabase } from './supabase';

const ENCRYPTION_KEY_PREFIX = 'likkle-wisdom-v1-';
const LEGACY_SALT = 'rum-and-wisdom-salt';

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const base64ToBytes = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));

const generateSalt = () => bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));

async function getUserSalt(userId: string, createIfMissing: boolean): Promise<string | null> {
    if (!supabase) return null;

    const { data } = await supabase
        .from('profiles')
        .select('encryption_salt')
        .eq('id', userId)
        .maybeSingle();

    if (data?.encryption_salt) return data.encryption_salt;
    if (!createIfMissing) return null;

    const salt = generateSalt();
    const { error } = await supabase
        .from('profiles')
        .update({ encryption_salt: salt })
        .eq('id', userId);

    if (error) {
        console.error('Encryption salt save failed:', error);
        return null;
    }

    return salt;
}

/**
 * Derives a deterministic cryptographic key from a user ID and per-user salt.
 * Existing legacy ciphertext can still be decrypted with the old constant salt fallback.
 */
async function getDerivedKey(userId: string, salt: string): Promise<CryptoKey | null> {
    if (!crypto?.subtle) return null;
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
            salt: encoder.encode(salt),
            iterations: 100000,
            hash: 'SHA-256',
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function decryptWithSalt(blob: string, userId: string, salt: string): Promise<string> {
    const key = await getDerivedKey(userId, salt);
    if (!key) return blob;
    const combined = base64ToBytes(blob);

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

export const EncryptionService = {
    /**
     * Encrypts a string of text.
     * Returns a base64 string containing the IV and the ciphertext.
     */
    async encrypt(text: string, userId: string): Promise<string> {
        if (!text || !userId) return text;
        try {
            const salt = await getUserSalt(userId, true);
            if (!salt) return text;

            const key = await getDerivedKey(userId, salt);
            if (!key) return text;
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

            return bytesToBase64(combined);
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
            const salt = await getUserSalt(userId, false);
            if (salt) return await decryptWithSalt(blob, userId, salt);
            return await decryptWithSalt(blob, userId, LEGACY_SALT);
        } catch (e) {
            try {
                return await decryptWithSalt(blob, userId, LEGACY_SALT);
            } catch {
                // If it fails, it might be plain text from before encryption was implemented.
                return blob;
            }
        }
    }
};
