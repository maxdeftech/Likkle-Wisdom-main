
import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already standalone/installed
        const isNative = Capacitor.isNativePlatform();
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (isNative || isStandaloneMode) {
            setIsStandalone(true);
            return;
        }

        // Check if iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        const android = /android/.test(userAgent);
        setIsIOS(ios);

        if (ios || android) {
            // Show prompt for both IOS and Android immediately if not standalone
            // Delay slightly to not clash with splash screen immediately
            setTimeout(() => setShowPrompt(true), 3000);
        } else {
            // Desktop: Listen for beforeinstallprompt just in case
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setTimeout(() => setShowPrompt(true), 3000);
            });
        }
    }, []);

    const handleInstallClick = async () => {
        // Prioritize native install prompt (Android/Chrome/Desktop)
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setShowPrompt(false);
            }
        }
        // Fallback to manual instructions (iOS or if native prompt unavailable)
        else {
            setShowIOSInstructions(true);
        }
    };

    const handleMinimize = () => {
        setIsMinimized(true);
    };

    const handleMaximize = () => {
        setIsMinimized(false);
    };

    if (isStandalone) return null;
    if (!showPrompt && !showIOSInstructions && !isMinimized) return null;

    if (isMinimized) {
        return (
            <button
                onClick={handleMaximize}
                className="fixed bottom-24 right-4 z-[9999] size-14 rounded-full glass bg-white/10 border border-white/20 shadow-2xl flex items-center justify-center animate-bounce-slow"
                aria-label="Install App"
            >
                <span className="material-symbols-outlined text-white text-2xl">download</span>
                <span className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full animate-pulse"></span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-background-dark/95 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 jamaica-gradient opacity-10 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="size-16 rounded-2xl bg-gradient-to-br from-jamaican-gold to-primary flex items-center justify-center mb-4 shadow-lg">
                        <img src="/icons/icon-192x192.png" alt="Icon" className="w-full h-full object-cover rounded-2xl opacity-90" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        <span className="material-symbols-outlined text-3xl text-background-dark absolute" style={{ display: 'var(--icon-display, none)' }}>install_mobile</span>
                    </div>

                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Install Likkle Wisdom</h3>
                    <p className="text-white/60 text-xs mb-6 font-medium leading-relaxed">
                        Add to your Home Screen for full screen vibes, offline mode, and a better experience.
                    </p>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <button
                            onClick={handleMinimize}
                            className="py-3 px-4 rounded-xl glass border-white/10 text-white/50 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-colors"
                        >
                            Later
                        </button>
                        <button
                            onClick={handleInstallClick}
                            className="py-3 px-4 rounded-xl bg-primary text-background-dark text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            {isIOS || /android/.test(window.navigator.userAgent.toLowerCase()) ? 'Show How' : 'Install'}
                        </button>
                    </div>
                </div>
            </div>

            {showIOSInstructions && (
                <div
                    className="fixed inset-0 z-[10000] bg-black/90 flex flex-col justify-end pb-8 px-6 animate-fade-in backdrop-blur-sm"
                    onClick={() => setShowIOSInstructions(false)}
                >
                    <div className="flex flex-col items-center text-center text-white mb-8">
                        <span className="material-symbols-outlined text-5xl mb-4 text-jamaican-gold animate-bounce">
                            {isIOS ? 'ios_share' : 'more_vert'}
                        </span>
                        <h3 className="text-2xl font-black mb-2">{isIOS ? 'Tap Share' : 'Tap Menu'}</h3>
                        <p className="text-white/60 font-medium mb-8 max-w-[260px] leading-relaxed">
                            {isIOS ? (
                                <>Then scroll down and select <br /><span className="text-white font-bold">"Add to Home Screen"</span></>
                            ) : (
                                <>
                                    Select the <span className="text-white font-bold inline-flex items-center gap-1 mx-1 align-middle"><span className="material-symbols-outlined text-sm">more_vert</span> 3 dots</span>
                                    at the top right, then scroll down and select <span className="text-white font-bold">"Add to Home screen"</span> or <span className="text-white font-bold">"Install App"</span>
                                </>
                            )}
                        </p>
                        <div className="size-16 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center animate-pulse">
                            <span className="material-symbols-outlined text-3xl">add_box</span>
                        </div>
                    </div>
                    <div className="w-full flex justify-center animate-bounce-slow text-white/50">
                        <span className="material-symbols-outlined text-4xl">keyboard_arrow_down</span>
                    </div>
                    <button className="absolute top-8 right-8 text-white/50 p-4 active:scale-90 transition-transform">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    {isIOS && <div className="absolute inset-0 pointer-events-none border-[12px] border-primary/20 animate-pulse"></div>}
                </div>
            )}
        </div>
    );
};

export default PWAInstallPrompt;
