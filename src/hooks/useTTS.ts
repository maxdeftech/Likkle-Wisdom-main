
import { useState, useCallback, useEffect } from 'react';

// Small helper so we never touch speechSynthesis when it's missing or unimplemented (e.g. Android WebView)
const getSynth = () => {
  if (typeof window === 'undefined') return null;
  const synth = (window as any).speechSynthesis;
  return synth && typeof synth.cancel === 'function' && typeof synth.speak === 'function'
    ? synth as SpeechSynthesis
    : null;
};

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);

  const stop = useCallback(() => {
    const synth = getSynth();
    if (!synth) {
      setIsSpeaking(false);
      setCurrentText(null);
      return;
    }
    synth.cancel();
    setIsSpeaking(false);
    setCurrentText(null);
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!text) return;

      const synth = getSynth();
      if (!synth) {
        // No TTS support on this platform — just no-op safely
        setIsSpeaking(false);
        setCurrentText(null);
        return;
      }

      stop();

      const utterance = new SpeechSynthesisUtterance(text);

      // Try to find a nice voice (optional)
      const voices = synth.getVoices();
      const preferredVoice =
        voices.find(v => v.lang.startsWith('en-GB')) || voices.find(v => v.lang.startsWith('en'));
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
      synth.speak(utterance);
    },
    [stop]
  );

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { speak, stop, isSpeaking, currentText };
};
