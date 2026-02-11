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
        keywords: ['home', 'daily', 'main', 'today'],
        response: "Yuh can find daily vibes and today's wisdom on di Home tab. Jus' tap di home icon at di bottom!",
        action: { type: 'tab', value: 'home' }
    },
    {
        keywords: ['discover', 'explore', 'categories', 'search', 'find things', 'look for'],
        response: "Want to explore more? Di Discover page has all di categories and a powerful search fi find quotes, bible verses, and even friends!",
        action: { type: 'tab', value: 'discover' }
    },
    {
        keywords: ['bible', 'scripture', 'verse', 'holy', 'kjv', 'god', 'word'],
        response: "Lookin' fi Word & Powah? Go to di Bible tab to read scriptures in KJV and Patois. Yuh can bookmark yuh favorites too!",
        action: { type: 'tab', value: 'bible' }
    },
    {
        keywords: ['journal', 'book', 'notes', 'write thoughts', 'diary', 'likkle book'],
        response: "Capture yuh thoughts inna yuh Likkle Book (Journal). Every mickle makes a muckle! Tap di Journal icon at di bottom.",
        action: { type: 'tab', value: 'book' }
    },
    {
        keywords: ['profile', 'me', 'account', 'my page'],
        response: "Manage yuh profile, vibes, and connections on di Me tab. See yuh saved wisdom, journal entries, and more!",
        action: { type: 'tab', value: 'me' }
    },
    {
        keywords: ['dark mode', 'theme', 'appearance', 'light mode', 'color', 'night mode'],
        response: "Change di look! Yuh can toggle Dark Mode right from di Home page header — look fi di little sun/moon switch next to yuh avatar.",
        action: { type: 'setting', value: 'settings' }
    },
    {
        keywords: ['premium', 'upgrade', 'support', 'donate', 'pro', 'pay'],
        response: "Help di wisdom flow! Check out di support page to see how yuh can keep di app runnin'. Every likkle bit counts!",
        action: { type: 'setting', value: 'premium' }
    },
    {
        keywords: ['ai', 'brew', 'custom', 'mood', 'brewster', 'generate'],
        response: "Got a mood? Brewster di AI can brew custom wisdom for yuh. Tap di 'AI Wisdom' button on Home — choose yuh mood and let it brew!",
        action: { type: 'setting', value: 'ai' }
    },
    {
        keywords: ['message', 'chat', 'inbox', 'dm', 'text friend'],
        response: "Connect with other wise souls! Tap di message icon at di top right of Home to open yuh inbox.",
        action: { type: 'setting', value: 'messages' }
    },
    {
        keywords: ['help', 'navigate', 'how to', 'guide', 'what can you do'],
        response: "I'm Likkle Guide! I can help yuh find di Bible, Journal, Feed, AI Brewster, Messages, Friends, and more. What yuh lookin' for today?",
    },
    // --- NEW ENTRIES BELOW ---
    {
        keywords: ['feed', 'posts', 'community', 'share post', 'timeline'],
        response: "Di Feed is where di community share vibes! Post text, images, videos, scripture, or yuh own wisdom. Posts last 24 hours so share while it fresh!",
        action: { type: 'tab', value: 'feed' }
    },
    {
        keywords: ['friends', 'my friends', 'friend list', 'connections', 'people'],
        response: "Check yuh friends from di Friends icon in di bottom nav! Yuh can message dem, remove dem, or view dem profile from deh.",
        action: { type: 'setting', value: 'friends' }
    },
    {
        keywords: ['add friend', 'friend request', 'find people', 'invite'],
        response: "To add friends, go to Messages and tap di person+ icon. Search fi people and send dem a request! Dem have to accept before yuh can chat.",
        action: { type: 'setting', value: 'messages' }
    },
    {
        keywords: ['bookmark', 'favorite', 'save', 'cabinet', 'saved'],
        response: "All yuh saved quotes, verses, and iconic wisdom live inna yuh Cabinet on di Profile tab. Tap di heart on any quote fi save it!",
        action: { type: 'tab', value: 'me' }
    },
    {
        keywords: ['wisdom creator', 'create wisdom', 'pen wisdom', 'my wisdom', 'write wisdom'],
        response: "Pen yuh own wisdom! Go to yuh Profile, tap 'My Wisdom', and write in Patois with di English translation. Share yuh heart!",
        action: { type: 'setting', value: 'wisdom_creator' }
    },
    {
        keywords: ['journal entry', 'new entry', 'add journal', 'write journal'],
        response: "Open di Journal tab and tap di + button to add a new entry. Choose yuh mood and pour out yuh thoughts. It's encrypted for yuh eyes only!",
        action: { type: 'tab', value: 'book' }
    },
    {
        keywords: ['offline', 'no internet', 'signal', 'wifi', 'connection'],
        response: "No worries if yuh offline! Di app stash yuh wisdom locally so yuh can still read quotes, journal, and browse. It syncs back when yuh get signal.",
    },
    {
        keywords: ['notification', 'alerts', 'bell', 'updates'],
        response: "Notifications pop up at di top when yuh get new messages, friend requests, or when something important happen. Keep an eye out!",
    },
    {
        keywords: ['avatar', 'photo', 'picture', 'profile picture', 'change photo'],
        response: "Want fi change yuh look? Go to yuh Profile and tap yuh avatar photo. Yuh can upload a new picture or change yuh username from deh.",
        action: { type: 'tab', value: 'me' }
    },
    {
        keywords: ['privacy', 'terms', 'legal', 'data', 'policy'],
        response: "Yuh can check di Privacy Policy and Terms of Service from Settings. We take yuh data seriously — respect is key!",
        action: { type: 'setting', value: 'settings' }
    },
    {
        keywords: ['sign out', 'log out', 'logout', 'sign off', 'leave'],
        response: "Ready fi leave? Go to Settings from yuh Profile and scroll to di bottom — yuh'll see di 'Sign Out' button deh.",
        action: { type: 'setting', value: 'settings' }
    },
    {
        keywords: ['share', 'send quote', 'share verse', 'share wisdom'],
        response: "Yuh can share wisdom by posting it to di Feed! Go to Feed, tap di + button, and choose 'Scripture' or 'Wisdom' to share from yuh collection.",
        action: { type: 'tab', value: 'feed' }
    },
    {
        keywords: ['refresh', 'reload', 'new quotes', 'update'],
        response: "Pull down on di Home page fi refresh yuh daily content! Or go to Profile > Settings fi a full app refresh.",
    },
    {
        keywords: ['alerts', 'notifications', 'announcements', 'admin alerts', 'updates from admin'],
        response: "Stay updated with admin announcements! Tap di Alerts bell icon at di top of Home page to see all official notices from di team.",
        action: { type: 'setting', value: 'alerts' }
    },
    {
        keywords: ['patois', 'jamaican', 'dialect', 'creole', 'language'],
        response: "Likkle Wisdom celebrates Jamaican Patois — di language of di heart. Every quote comes with both Patois and English so everyone can vibe!",
    },
    {
        keywords: ['jamaica', 'island', 'caribbean', 'yard', 'irie'],
        response: "Big up yuhself! Dis app is inspired by di wisdom, culture, and spirit of Jamaica. One love from di team! 🇯🇲",
    },
    {
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'wah gwan', 'sup', 'yo'],
        response: "Wah gwan! 🤙 Welcome to Likkle Wisdom. Ask me anything about di app and I'll guide yuh through it!",
    },
    {
        keywords: ['thank', 'thanks', 'appreciate', 'bless', 'respect'],
        response: "Blessed! Any time yuh need help, jus' call pon me. Walk good! 🙏",
    },
    {
        keywords: ['bye', 'later', 'goodbye', 'see you', 'peace'],
        response: "Walk good! Remember — every day is a chance fi grow inna wisdom. Come back anytime! ✌️",
    },
    {
        keywords: ['swipe', 'navigate', 'gesture', 'move between'],
        response: "Yuh can swipe left or right on any page fi move between tabs! Swipe left fi go forward, swipe right fi go back. Di bottom nav updates automatically.",
    },
    {
        keywords: ['pin chat', 'pin', 'favorite chat'],
        response: "Long press on any chat in yuh inbox fi see options like Pin Chat, Delete Chat, and Remove Friend. Pinned chats always show at di top!",
        action: { type: 'setting', value: 'messages' }
    },
    {
        keywords: ['delete', 'remove', 'erase'],
        response: "Yuh can delete journal entries, wisdoms, or chats. Long press on a chat fi delete it, or tap di trash icon on yuh own posts and entries.",
    },
    {
        keywords: ['what is', 'about', 'app', 'likkle wisdom', 'this app', 'tell me about', 'overview', 'features'],
        response: "Likkle Wisdom is yuh daily dose of Jamaican culture and inspiration! 🇯🇲\n\n✨ FEATURES:\n• Daily Quotes & Wisdom in Patois\n• Full KJV Bible (read, listen, bookmark)\n• AI Wisdom Brewer fi custom vibes\n• Private Journal (encrypted)\n• Pen yuh own Patois proverbs\n• Community Feed (24hr posts)\n• Message friends\n• Highlight & note Bible verses\n• Offline mode fi on-the-go\n\nEvery feature celebrates di wisdom, culture, and irie vibes of Jamaica. One Love! 🌴",
    },
    {
        keywords: ['bug', 'broken', 'error', 'crash', 'not working', 'problem'],
        response: "Sorry fi di trouble! Try refreshing di app from Settings. If it keep up, try signing out and back in. We always working fi make tings better!",
        action: { type: 'setting', value: 'settings' }
    }
];

export const FALLBACK_RESPONSE = "I neva quite catch dat. Try asking me 'bout di Feed, Bible, Journal, Messages, Friends, AI Brewster, or how to navigate di app!";
