# Likkle Wisdom – Data for Flutter App

This folder contains JSON data extracted from the Likkle Wisdom project for use in the Flutter app.

## Files

### `likkle_wisdom_content.json`
All **quotes**, **wisdoms**, **iconic quotes**, and **Jamaican Bible scriptures** (KJV + Patois) from the app.

- **quotes** – 80 Jamaican Patois quotes with English translation (categories: Wisdom, Motivation, Peace, Affirmations).
- **iconicQuotes** – 15 quotes from Jamaican legends (Bob Marley, Marcus Garvey, Miss Lou, Usain Bolt, Shelly-Ann Fraser-Pryce).
- **bibleAffirmations** – 20 Bible verses with KJV text and Patois translation (Word & Powah).
- **categories** – Category definitions (id, name, description, icon, color).
- **moods** – Mood options for AI wisdom (Peace, Hustle, Joy, Healing).

Use this file to seed your Flutter app’s local content or assets.

### `kjv_bible.json`
**Full King James Version (KJV) Bible** – all **66 books**, every chapter and verse.

Structure:
```json
{
  "translation": "KJV",
  "books": [
    {
      "book": "Genesis",
      "chapters": [
        {
          "chapter": "1",
          "verses": [
            { "verse": "1", "text": "In the beginning God created..." },
            { "verse": "2", "text": "..." }
          ]
        }
      ]
    }
  ]
}
```

- Source: [aruljohn/Bible-kjv](https://github.com/aruljohn/Bible-kjv) (MIT).
- File size is ~5 MB; in Flutter you can load it as an asset and parse by book/chapter, or split by book for smaller bundles.

## Regenerating data

- **Quotes/content**: Manually update `likkle_wisdom_content.json` or re-export from `src/constants.ts`.
- **KJV Bible**: From project root, run:
  ```bash
  node scripts/fetch_kjv_bible.js
  ```
  Requires network access; fetches all 66 books from GitHub and overwrites `data/kjv_bible.json`.
