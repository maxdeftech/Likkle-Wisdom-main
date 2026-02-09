
import { useState, useCallback, useEffect } from 'react';

export const useTTS = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentText, setCurrentText] = useState<string | null>(null);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setCurrentText(null);
    }, []);

    const speak = useCallback((text: string, onEnd?: () => void) => {
        if (!text) return;

        stop();

        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a nice voice (optional)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en-GB')) || voices.find(v => v.lang.startsWith('en'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            setCurrentText(null);
            if (onEnd) onEnd();
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            setCurrentText(null);
        };

        setCurrentText(text);
        window.speechSynthesis.speak(utterance);
    }, [stop]);

    useEffect(() => {
        return () => stop();
    }, [stop]);

    return { speak, stop, isSpeaking, currentText };
};
