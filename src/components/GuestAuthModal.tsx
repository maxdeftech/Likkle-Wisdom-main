import React from 'react';

interface GuestAuthModalProps {
  onClose: () => void;
  onSignUp: () => void;
}

const GuestAuthModal: React.FC<GuestAuthModalProps> = ({ onClose, onSignUp }) => (
  <div className="fixed inset-0 z-modal bg-background-dark/95 flex flex-col items-center justify-center p-8 backdrop-blur-xl animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="guest-modal-title" aria-describedby="guest-modal-desc">
    <div className="glass p-10 rounded-[3rem] w-full max-w-[340px] text-center border-white/10 shadow-2xl">
      <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6" aria-hidden="true">
        <span className="material-symbols-outlined text-4xl">person_add</span>
      </div>
      <h2 id="guest-modal-title" className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Join di Family!</h2>
      <p id="guest-modal-desc" className="text-white/50 text-xs font-bold mb-8 leading-relaxed">Guests can browse, but yuh need an account fi save wisdom, write inna journal, or use AI.</p>
      <div className="space-y-4">
        <button onClick={onSignUp} className="w-full bg-primary py-4 rounded-xl font-black text-[12px] uppercase text-background-dark shadow-xl active:scale-95 transition-all">Sign Up / Sign In</button>
        <button onClick={onClose} className="w-full glass py-4 rounded-xl font-black text-[10px] uppercase text-white/40 active:scale-95 transition-all" aria-label="Keep browsing as guest">Keep Browsin'</button>
      </div>
    </div>
  </div>
);

export default GuestAuthModal;
