import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';
import { Capacitor } from '@capacitor/core';

// Use production API key only. Set VITE_REVENUECAT_API_KEY in .env for release (Apple App Store / Google Play).
// Never ship with a Test Store key — App Review will reject. Get production keys from RevenueCat dashboard.
const API_KEY = (import.meta as any).env?.VITE_REVENUECAT_API_KEY as string | undefined;
const isDev = (import.meta as any).env?.DEV === true;

/** True after configure() has been called successfully on native (so paywall can be shown). */
let isConfigured = false;

export const initializePurchases = async () => {
    try {
        if (!API_KEY?.trim()) {
            if (Capacitor.getPlatform() !== 'web') console.warn('RevenueCat: Set VITE_REVENUECAT_API_KEY in .env so the paywall can load.');
            return;
        }
        if (API_KEY.startsWith('test_') && Capacitor.getPlatform() !== 'web') {
            console.warn('RevenueCat: Using a test key. Use your production key for App Store / Play Store release.');
        }
        await Purchases.setLogLevel({ level: isDev ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN });

        const platform = Capacitor.getPlatform();
        if (platform === 'ios' || platform === 'android') {
            await Purchases.configure({ apiKey: API_KEY });
            isConfigured = true;
        }
    } catch (error) {
        console.error("Error configuring RevenueCat:", error);
    }
};

export const checkPremiumStatus = async (): Promise<boolean> => {
    try {
        const { customerInfo } = await Purchases.getCustomerInfo();
        // Check if user has 'Maxwell Definitive Technologies Pro' entitlement
        if (typeof customerInfo.entitlements.active["Maxwell Definitive Technologies Pro"] !== "undefined") {
            return true;
        }
    } catch (e) {
        console.error("Error fetching customer info:", e);
    }
    return false;
};

export const presentPaywall = async (): Promise<boolean> => {
    const platform = Capacitor.getPlatform();
    if (platform !== 'ios' && platform !== 'android') {
        console.warn('RevenueCat paywall is only supported on iOS and Android.');
        return false;
    }
    if (!isConfigured) {
        console.warn('RevenueCat not configured yet. Call initializePurchases() first (e.g. on app launch).');
        return false;
    }
    try {
        const { result } = await RevenueCatUI.presentPaywall({
            displayCloseButton: true,
        });

        if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
            return true;
        }
        if (result === PAYWALL_RESULT.NOT_PRESENTED) {
            console.warn('RevenueCat paywall not presented (e.g. no offering in dashboard, or offline). Check RevenueCat dashboard has an Offering and a Paywall.');
        } else if (result === PAYWALL_RESULT.ERROR) {
            console.error('RevenueCat paywall error.');
        }
        return false;
    } catch (error) {
        console.error("Error presenting paywall:", error);
        return false;
    }
};
