
import React from 'react';

interface LegalViewProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
}

const LegalView: React.FC<LegalViewProps> = ({ type, onClose }) => {
  const todayDate = "March 10, 2025";
  const contactEmail = "maxwelldeftech@gmail.com";
  const appName = "Likkle Wisdom";

  const renderPrivacy = () => (
    <div className="space-y-6 text-white/80 leading-relaxed font-medium">
      <h1 className="text-3xl font-black text-white tracking-tight">Privacy Policy</h1>
      <p className="text-xs uppercase font-black text-primary/60 tracking-widest">Last updated: {todayDate}</p>
      
      <p>{appName} (“we”, “our”, or “us”) respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your information when you use the {appName} app or website.</p>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">1. Information We Collect</h2>
        <p>When you use {appName}, we may collect the following information:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Email address (used for account creation and login)</li>
          <li>Basic profile information (if you choose to provide it)</li>
          <li>Usage data (such as app interactions, pages viewed, and features used)</li>
          <li>Device and log information (IP address, browser type, operating system)</li>
        </ul>
        <p>We do not knowingly collect sensitive personal data.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Create and manage your account</li>
          <li>Authenticate users and prevent fraud</li>
          <li>Improve app features and user experience</li>
          <li>Communicate important updates or service-related messages</li>
          <li>Maintain security and platform integrity</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">3. How Your Information Is Stored</h2>
        <p>Your data is stored securely using industry-standard security practices. We take reasonable steps to protect your information from unauthorized access, loss, or misuse.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">4. Sharing Your Information</h2>
        <p>We do not sell your personal data. We may share your information only:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>With trusted service providers (such as authentication or hosting services)</li>
          <li>If required by law or legal process</li>
          <li>To protect the rights, safety, or property of {appName} or its users</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">5. Cookies & Tracking</h2>
        <p>{appName} may use cookies or similar technologies to keep you logged in, analyze app performance, and improve user experience. You can control cookies through your browser settings.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">6. Your Rights</h2>
        <p>You have the right to access your personal data, request correction or deletion of your data, and withdraw consent at any time. You may request account deletion by contacting us at {contactEmail}.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">7. Children’s Privacy</h2>
        <p>{appName} is not intended for children under the age of 13. We do not knowingly collect personal data from children.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">8. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Changes will be posted within the app or on our website.</p>
      </div>

      <div className="space-y-4 pb-12">
        <h2 className="text-xl font-black text-white">9. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, contact us at: <br/><span className="text-primary font-black">{contactEmail}</span></p>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="space-y-6 text-white/80 leading-relaxed font-medium">
      <h1 className="text-3xl font-black text-white tracking-tight">Terms & Conditions</h1>
      <p className="text-xs uppercase font-black text-primary/60 tracking-widest">Last updated: {todayDate}</p>
      
      <p>Welcome to {appName}. By accessing or using our app or website, you agree to these Terms & Conditions. If you do not agree, please do not use {appName}.</p>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">1. Use of the Service</h2>
        <p>{appName} is a platform designed to provide inspirational Jamaican cultural content, affirmations, and spiritual encouragement. You agree to use the platform lawfully and respectfully.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">2. User Accounts</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>You must provide a valid email address to create an account.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>You are responsible for all activity under your account.</li>
        </ul>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">3. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Use {appName} for unlawful purposes</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Post or share hateful, offensive, or misleading content</li>
          <li>Attempt to hack, disrupt, or misuse the platform</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these rules.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">4. Content Disclaimer</h2>
        <p>{appName} provides cultural and inspirational content for general guidance only. It is not a substitute for professional, medical, legal, or mental health advice.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">5. Intellectual Property</h2>
        <p>All content, branding, logos, and app features belong to {appName} or its licensors. You may not copy, distribute, or reuse content without permission.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">6. Termination</h2>
        <p>We reserve the right to suspend or terminate your access to {appName} at any time if you violate these Terms or misuse the platform. You may stop using {appName} at any time.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">7. Limitation of Liability</h2>
        <p>{appName} is provided “as is” without warranties of any kind. We are not liable for: service interruptions, data loss, or damages arising from use of the app.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">8. Changes to Terms</h2>
        <p>We may update these Terms & Conditions at any time. Continued use of {appName} means you accept the updated terms.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">9. Governing Law</h2>
        <p>These Terms are governed by the laws of Jamaica.</p>
      </div>

      <div className="space-y-4 pb-12">
        <h2 className="text-xl font-black text-white">10. Contact Information</h2>
        <p>For questions or concerns, contact us at: <br/><span className="text-primary font-black">{contactEmail}</span></p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full flex flex-col bg-background-dark p-6 animate-fade-in overflow-y-auto no-scrollbar">
      <header className="sticky top-0 z-50 flex items-center py-6 bg-background-dark/80 backdrop-blur-md mb-4">
        <button onClick={onClose} className="size-11 rounded-full glass flex items-center justify-center text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </header>
      <div className="flex-1">
        {type === 'privacy' ? renderPrivacy() : renderTerms()}
      </div>
    </div>
  );
};

export default LegalView;
