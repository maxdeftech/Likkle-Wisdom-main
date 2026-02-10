export interface ChatKnowledge {
    keywords: string[];
    response: string;
    action?: {
        type: 'tab' | 'view' | 'setting' | 'external';
        value: string;
    };
}

export const CHATBOT_KNOWLEDGE: ChatKnowledge[] = [
    {
        keywords: ['home', 'daily', 'wisdom', 'main'],
        response: "Yuh can find daily vibes and today's wisdom on di Home tab. Jus' tap di home icon at di bottom!",
        action: { type: 'tab', value: 'home' }
    },
    {
        keywords: ['discover', 'explore', 'categories', 'search'],
        response: "Want to explore more? Di Discover tab is where all di categories and search tools live.",
        action: { type: 'tab', value: 'discover' }
    },
    {
        keywords: ['bible', 'scripture', 'verse', 'holy'],
        response: "Lookin' fi Word & Powah? Go to di Bible tab to read scriptures in KJV and Patois.",
        action: { type: 'tab', value: 'bible' }
    },
    {
        keywords: ['journal', 'book', 'notes', 'write'],
        response: "Capture yuh thoughts inna yuh Likkle Book (Journal). Every mickle makes a muckle!",
        action: { type: 'tab', value: 'book' }
    },
    {
        keywords: ['profile', 'me', 'account', 'settings'],
        response: "Manage yuh profile, vibes, and connections on di Me tab.",
        action: { type: 'tab', value: 'me' }
    },
    {
        keywords: ['dark mode', 'theme', 'appearance', 'light mode'],
        response: "Change di look inna Settings! Tap di gear icon on yuh Profile to toggle Dark Mode.",
        action: { type: 'setting', value: 'settings' }
    },
    {
        keywords: ['premium', 'upgrade', 'support', 'donate'],
        response: "Help di wisdom flow! Check out di support page to see how yuh can keep di app runnin'.",
        action: { type: 'setting', value: 'premium' }
    },
    {
        keywords: ['ai', 'brew', 'custom', 'mood'],
        response: "Got a mood? Brewster di AI can brew custom wisdom for yuh. Tap di 'AI Wisdom' button on Home!",
        action: { type: 'setting', value: 'ai' }
    },
    {
        keywords: ['message', 'chat', 'friends', 'inbox'],
        response: "Connect with other wise souls! Tap di message icon on Home or find friends on yuh Profile.",
        action: { type: 'setting', value: 'messages' }
    },
    {
        keywords: ['help', 'navigate', 'how to', 'guide'],
        response: "I'm Likkle Guide! I can help yuh find di Bible, Journal, AI Brewster, or help yuh upgrade. What yuh lookin' for today?",
    }
];

export const FALLBACK_RESPONSE = "I neva quite catch dat. Ask me 'bout di Bible, Journal, Messages, or how to upgrade!";
