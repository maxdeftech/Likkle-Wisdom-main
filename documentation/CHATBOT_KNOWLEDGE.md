# Likkle Guide — AI Chatbot Hardcoded Knowledge

This document lists all **JSON-style / hardcoded** data used by the Likkle Guide chatbot (navigation assistant) in the app. The source of truth is `src/data/chatbot_knowledge.ts`.

---

## Data model

Each knowledge entry has:

| Field       | Type     | Description |
|------------|----------|-------------|
| `keywords` | string[] | Phrases that trigger this entry (user message is matched case-insensitively if it contains any keyword). |
| `response` | string   | The reply shown to the user. |
| `action`   | object?  | Optional. If present, a "Take me deh" button can open a tab, view, setting, or external URL. |

**Action types:**

- `tab` — Switch main tab: `home` \| `discover` \| `bible` \| `book` \| `me`
- `view` — App view (e.g. category results)
- `setting` — In-app action: `settings` \| `website` \| `mdt_website` \| `ai` \| `alerts` \| `wisdom_creator`
- `external` — Open URL in browser: `value` is the full URL

**Websites used:**

- **Likkle Wisdom:** `https://www.likklewisdom.com/`
- **Maxwell Definitive Technologies:** `https://maxdeftech.wixsite.com/mdt-ja`

---

## Fallback (no match)

When no keyword matches, the bot replies with:

```json
"I neva quite catch dat. Try asking me 'bout di Bible, Journal, Profile, AI Brewster, di Likkle Wisdom or Maxwell Definitive website, or how to navigate di app!"
```

---

## All knowledge entries (JSON-style)

```json
[
  {
    "keywords": ["home", "daily", "main", "today"],
    "response": "Yuh can find daily vibes and today's wisdom on di Home tab. Jus' tap di home icon at di bottom!",
    "action": { "type": "tab", "value": "home" }
  },
  {
    "keywords": ["discover", "explore", "categories", "search", "find things", "look for"],
    "response": "Want to explore more? Di Discover page has all di categories and a powerful search fi find quotes and bible verses.",
    "action": { "type": "tab", "value": "discover" }
  },
  {
    "keywords": ["bible", "scripture", "verse", "holy", "kjv", "god", "word"],
    "response": "Lookin' fi Word & Powah? Go to di Bible tab to read scriptures in KJV and Patois. Yuh can bookmark yuh favorites too!",
    "action": { "type": "tab", "value": "bible" }
  },
  {
    "keywords": ["journal", "book", "notes", "write thoughts", "diary", "likkle book"],
    "response": "Capture yuh thoughts inna yuh Likkle Book (Journal). Every mickle makes a muckle! Tap di Journal icon at di bottom.",
    "action": { "type": "tab", "value": "book" }
  },
  {
    "keywords": ["profile", "me", "account", "my page"],
    "response": "Manage yuh profile, vibes, and connections on di Me tab. See yuh saved wisdom, journal entries, and more!",
    "action": { "type": "tab", "value": "me" }
  },
  {
    "keywords": ["dark mode", "theme", "appearance", "light mode", "color", "night mode"],
    "response": "Change di look! Yuh can toggle Dark Mode right from di Home page header — look fi di little sun/moon switch next to yuh avatar.",
    "action": { "type": "setting", "value": "settings" }
  },
  {
    "keywords": ["likkle wisdom website", "likklewisdom", "likkle wisdom site", "visit likkle wisdom"],
    "response": "Check out di Likkle Wisdom website for more Jamaican Patois wisdom and affirmations! Tap below to open https://www.likklewisdom.com/",
    "action": { "type": "setting", "value": "website" }
  },
  {
    "keywords": ["website", "maxwell", "mdt", "maxwell definitive", "mdt website", "maxwell definitive technologies"],
    "response": "Want to see more from us? Maxwell Definitive Technologies — design, technology and intelligent solutions. Tap below to open our website! One love!",
    "action": { "type": "setting", "value": "mdt_website" }
  },
  {
    "keywords": ["ai", "brew", "custom", "mood", "brewster", "generate"],
    "response": "Got a mood? Brewster di AI can brew custom wisdom for yuh. Tap di 'AI Wisdom' button on Home — choose yuh mood and let it brew!",
    "action": { "type": "setting", "value": "ai" }
  },
  {
    "keywords": ["help", "navigate", "how to", "guide", "what can you do"],
    "response": "I'm Likkle Guide! I can help yuh find di Bible, Journal, Profile, AI Brewster, Settings, di Likkle Wisdom website (likklewisdom.com), di Maxwell Definitive Technologies website, and more. What yuh lookin' for today?"
  },
  {
    "keywords": ["bookmark", "favorite", "save", "cabinet", "saved"],
    "response": "All yuh saved quotes, verses, and iconic wisdom live inna yuh Cabinet on di Profile tab. Tap di heart on any quote fi save it!",
    "action": { "type": "tab", "value": "me" }
  },
  {
    "keywords": ["wisdom creator", "create wisdom", "pen wisdom", "my wisdom", "write wisdom"],
    "response": "Pen yuh own wisdom! Go to yuh Profile, tap 'My Wisdom', and write in Patois with di English translation. Share yuh heart!",
    "action": { "type": "setting", "value": "wisdom_creator" }
  },
  {
    "keywords": ["journal entry", "new entry", "add journal", "write journal"],
    "response": "Open di Journal tab and tap di + button to add a new entry. Choose yuh mood and pour out yuh thoughts. It's encrypted for yuh eyes only!",
    "action": { "type": "tab", "value": "book" }
  },
  {
    "keywords": ["offline", "no internet", "signal", "wifi", "connection"],
    "response": "No worries if yuh offline! Di app stash yuh wisdom locally so yuh can still read quotes, journal, and browse. It syncs back when yuh get signal."
  },
  {
    "keywords": ["notification", "alerts", "bell", "updates"],
    "response": "Notifications pop up at di top when something important happen. Tap di Alerts bell on Home fi see admin announcements. Keep an eye out!"
  },
  {
    "keywords": ["avatar", "photo", "picture", "profile picture", "change photo"],
    "response": "Want fi change yuh look? Go to yuh Profile and tap yuh avatar photo. Yuh can upload a new picture or change yuh username from deh.",
    "action": { "type": "tab", "value": "me" }
  },
  {
    "keywords": ["privacy", "terms", "legal", "data", "policy"],
    "response": "Yuh can check di Privacy Policy and Terms of Service from Settings. We take yuh data seriously — respect is key!",
    "action": { "type": "setting", "value": "settings" }
  },
  {
    "keywords": ["sign out", "log out", "logout", "sign off", "leave"],
    "response": "Ready fi leave? Go to Settings from yuh Profile and scroll to di bottom — yuh'll see di 'Sign Out' button deh.",
    "action": { "type": "setting", "value": "settings" }
  },
  {
    "keywords": ["share", "send quote", "share verse", "share wisdom"],
    "response": "Yuh can share wisdom by copying it and pasting into any app, or save it to yuh Cabinet on Profile. Tap di heart on any quote or verse fi save it!",
    "action": { "type": "tab", "value": "me" }
  },
  {
    "keywords": ["refresh", "reload", "new quotes", "update"],
    "response": "Pull down on di Home page fi refresh yuh daily content! Or go to Profile > Settings fi a full app refresh."
  },
  {
    "keywords": ["alerts", "notifications", "announcements", "admin alerts", "updates from admin"],
    "response": "Stay updated with admin announcements! Tap di Alerts bell icon at di top of Home page to see all official notices from di team.",
    "action": { "type": "setting", "value": "alerts" }
  },
  {
    "keywords": ["patois", "jamaican", "dialect", "creole", "language"],
    "response": "Likkle Wisdom celebrates Jamaican Patois — di language of di heart. Every quote comes with both Patois and English so everyone can vibe!"
  },
  {
    "keywords": ["jamaica", "island", "caribbean", "yard", "irie"],
    "response": "Big up yuhself! Dis app is inspired by di wisdom, culture, and spirit of Jamaica. One love from di team! 🇯🇲"
  },
  {
    "keywords": ["hello", "hi", "hey", "good morning", "good evening", "wah gwan", "sup", "yo"],
    "response": "Wah gwan! 🤙 Welcome to Likkle Wisdom. Ask me anything about di app and I'll guide yuh through it!"
  },
  {
    "keywords": ["thank", "thanks", "appreciate", "bless", "respect"],
    "response": "Blessed! Any time yuh need help, jus' call pon me. Walk good! 🙏"
  },
  {
    "keywords": ["bye", "later", "goodbye", "see you", "peace"],
    "response": "Walk good! Remember — every day is a chance fi grow inna wisdom. Come back anytime! ✌️"
  },
  {
    "keywords": ["swipe", "navigate", "gesture", "move between"],
    "response": "Yuh can swipe left or right on any page fi move between tabs! Swipe left fi go forward, swipe right fi go back. Di bottom nav updates automatically."
  },
  {
    "keywords": ["delete", "remove", "erase"],
    "response": "Yuh can delete journal entries and wisdoms from yuh Profile. Tap di trash icon on yuh own entries or My Wisdom items."
  },
  {
    "keywords": ["what is", "about", "app", "likkle wisdom", "this app", "tell me about", "overview", "features"],
    "response": "Likkle Wisdom is yuh daily dose of Jamaican culture and inspiration! 🇯🇲\n\n✨ FEATURES:\n• Daily Quotes & Wisdom in Patois\n• Full KJV Bible (read, listen, bookmark)\n• AI Wisdom Brewer fi custom vibes\n• Private Journal (encrypted)\n• Pen yuh own Patois proverbs\n• Saved wisdom cabinet on Profile\n• Highlight & note Bible verses\n• Offline mode fi on-the-go\n\nEvery feature celebrates di wisdom, culture, and irie vibes of Jamaica. One Love! 🌴"
  },
  {
    "keywords": ["bug", "broken", "error", "crash", "not working", "problem"],
    "response": "Sorry fi di trouble! Try refreshing di app from Settings. If it keep up, try signing out and back in. We always working fi make tings better!",
    "action": { "type": "setting", "value": "settings" }
  }
]
```

---

## Quick action buttons (UI-only)

When the chat is first opened, the user sees **6 quick action buttons** that send a fixed query (no separate JSON entry; they match the knowledge above):

| Button label  | Query sent                    |
|---------------|--------------------------------|
| About App     | What is Likkle Wisdom?         |
| Bible         | Show me the Bible              |
| AI Wisdom     | Generate custom wisdom         |
| Journal       | Open my journal                |
| Profile       | Open my profile                |
| Settings      | Open settings                  |

Defined in `src/components/NavigationChatbot.tsx` (inline array).

---

## Matching logic

- User input is lowercased and checked for **substring** match against each entry’s `keywords`.
- **First matching entry** wins; order in `CHATBOT_KNOWLEDGE` matters.
- If no entry matches, `FALLBACK_RESPONSE` is used.

---

## Where actions are handled

- **App.tsx** `handleBotNavigate(type, value)`:
  - `tab` → switch main tab
  - `setting` → `settings` (open Settings), `website` (open Likkle Wisdom), `mdt_website` (open Maxwell Definitive), `ai` (open AI Wisdom), `alerts` (open Alerts)
  - `external` → `window.open(value, '_blank')`

- **Settings** page also has two website buttons (all platforms):
  - **Visit Likkle Wisdom** → `https://www.likklewisdom.com/`
  - **Maxwell Definitive Technologies** → `https://maxdeftech.wixsite.com/mdt-ja`
