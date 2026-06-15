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
        response: "Want to explore more? Di Discover page has all di categories and a powerful search fi find quotes and bible verses.",
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
        keywords: ['likkle wisdom website', 'likklewisdom', 'likkle wisdom site', 'visit likkle wisdom'],
        response: "Check out di Likkle Wisdom website for more Jamaican Patois wisdom and affirmations! Tap below to open https://www.likklewisdom.com/",
        action: { type: 'setting', value: 'website' }
    },
    {
        keywords: ['website', 'maxwell', 'mdt', 'maxwell definitive', 'mdt website', 'maxwell definitive technologies'],
        response: "Want to see more from us? Maxwell Definitive Technologies — design, technology and intelligent solutions. Tap below to open our website! One love!",
        action: { type: 'setting', value: 'mdt_website' }
    },
    {
        keywords: ['ai', 'brew', 'custom', 'mood', 'brewster', 'generate'],
        response: "Got a mood? Brewster di AI can brew custom wisdom for yuh. Tap di 'AI Wisdom' button on Home — choose yuh mood and let it brew!",
        action: { type: 'setting', value: 'ai' }
    },
    {
        keywords: ['help', 'navigate', 'how to', 'guide', 'what can you do'],
        response: "I'm Likkle Guide! I can help yuh find di Bible, Journal, Profile, AI Brewster, Settings, di Likkle Wisdom website (likklewisdom.com), di Maxwell Definitive Technologies website, and more. What yuh lookin' for today?",
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
        response: "Notifications pop up at di top when something important happen. Tap di Alerts bell on Home fi see admin announcements. Keep an eye out!",
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
        response: "Yuh can share wisdom by copying it and pasting into any app, or save it to yuh Cabinet on Profile. Tap di heart on any quote or verse fi save it!",
        action: { type: 'tab', value: 'me' }
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
        keywords: ['delete', 'remove', 'erase'],
        response: "Yuh can delete journal entries and wisdoms from yuh Profile. Tap di trash icon on yuh own entries or My Wisdom items.",
    },
    {
        keywords: ['travel', 'trip', 'jamaica trip', 'flight', 'vacation', 'holiday'],
        response: "Likkle Wisdom has a full Travel suite fi Jamaica! It includes Maps (25+ curated places with GPS), Aviation Routes (flights to Kingston & Montego Bay), Financial Planner (AI budget planning with PDF export), and Trip Planner (day-by-day itinerary with map routes). Tap below fi check it out!",
        action: { type: 'tab', value: 'travel' }
    },
    {
        keywords: ['map', 'places', 'destination', 'location', 'gps', 'where to go'],
        response: "Di Maps module has 25+ curated Jamaican places with real GPS coordinates — beaches, waterfalls, restaurants, and more. Filter by category and get an AI destination guide fi any place!",
        action: { type: 'tab', value: 'travel' }
    },
    {
        keywords: ['flight', 'aviation', 'airline', 'fly', 'airport', 'route'],
        response: "Check out Aviation Routes fi international flights to Kingston (KIN) and Montego Bay (MBJ). See airlines, tap routes fi details, and find booking links!",
        action: { type: 'tab', value: 'travel' }
    },
    {
        keywords: ['budget', 'cost', 'financial', 'savings', 'money', 'planner', 'expense'],
        response: "Di Financial Planner helps yuh budget fi yuh Jamaica trip! Get AI-powered cost breakdowns, savings goal tracking, and export everything as a professional PDF.",
        action: { type: 'tab', value: 'travel' }
    },
    {
        keywords: ['itinerary', 'trip plan', 'stops', 'day by day', 'schedule trip'],
        response: "Build yuh dream Jamaica trip with di Trip Planner! Add stops day by day, see routes on di map, and let AI suggest improvements. Export yuh plan as a PDF too!",
        action: { type: 'tab', value: 'travel' }
    },
    {
        keywords: ['pdf', 'export', 'download', 'print', 'report'],
        response: "Yuh can export professional PDFs from di Financial Planner and Trip Planner! They come with colour-coded sections, tables, and proper formatting — named LikkleWisdom_Date_Module.pdf.",
        action: { type: 'tab', value: 'travel' }
    },
    {
        keywords: ['likkle guide', 'guide page', 'ai chat', 'chat page', 'full chat', 'assistant'],
        response: "Want a full conversation with me? Open di Likkle Guide page fi a dedicated chat experience — ask about any app feature or Jamaica travel!",
        action: { type: 'tab', value: 'guide' }
    },
    {
        keywords: ['install', 'pwa', 'download app', 'add to home'],
        response: "Yuh can install Likkle Wisdom as an app on any device! Look fi di download icon — it works offline too once installed.",
    },
    {
        keywords: ['what is', 'about', 'app', 'likkle wisdom', 'this app', 'tell me about', 'overview', 'features'],
        response: "Likkle Wisdom is yuh daily dose of Jamaican culture, inspiration, and travel!\n\nFEATURES:\n- Daily Quotes and Wisdom in Patois\n- Full KJV Bible (read, bookmark, search)\n- AI Wisdom Brewer fi custom vibes\n- Private Encrypted Journal\n- Pen yuh own Patois proverbs\n- Saved wisdom cabinet on Profile\n- Jamaica Travel Suite (Maps, Aviation, Budget Planner, Trip Planner)\n- AI Destination Guides and Trip AI\n- Professional PDF Export\n- Likkle Guide AI Assistant\n- PWA installable on any device\n- Offline mode\n\nEvery feature celebrates di wisdom, culture, and irie vibes of Jamaica. One Love!",
    },
    {
        keywords: ['bug', 'broken', 'error', 'crash', 'not working', 'problem'],
        response: "Sorry fi di trouble! Try refreshing di app from Settings. If it keep up, try signing out and back in. We always working fi make tings better!",
        action: { type: 'setting', value: 'settings' }
    }
];

export const FALLBACK_RESPONSE = "I neva quite catch dat. Try asking me 'bout di Bible, Journal, Profile, AI Brewster, di Likkle Wisdom or Maxwell Definitive website, or how to navigate di app!";
