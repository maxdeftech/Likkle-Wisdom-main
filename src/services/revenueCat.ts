
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';
import { Capacitor } from '@capacitor/core';

const API_KEY = (import.meta as any).env?.VITE_REVENUECAT_API_KEY || "test_faNbBjxTKlzslOKjswqEVzadXbH";

export const initializePurchases = async () => {
    try {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

        const platform = Capacitor.getPlatform();

        if (platform === 'ios' || platform === 'android') {
            await Purchases.configure({ apiKey: API_KEY });
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
    try {
        // Present paywall for current offering
        const { result } = await RevenueCatUI.presentPaywall();

        switch (result) {
            case PAYWALL_RESULT.PURCHASED:
            case PAYWALL_RESULT.RESTORED:
                return true;
            case PAYWALL_RESULT.NOT_PRESENTED:
            case PAYWALL_RESULT.ERROR:
            case PAYWALL_RESULT.CANCELLED:
            default:
                return false;
        }
    } catch (error) {
        console.error("Error presenting paywall:", error);
        return false;
    }
};
