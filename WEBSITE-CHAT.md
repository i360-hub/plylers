# Website chat assistant

Set up 2026-10-06. Same message-taking pattern as the other Impact 360 client sites.

## What it does

The chat bubble on every page (except `/lp/*` ad pages) is an AI assistant. It answers
simple questions from a curated FAQ list, takes the visitor's need, address, name,
callback time and phone number, and saves a one-paragraph message to the contact.
Saving that message triggers an alert to staff. It never books, quotes a price, or
hands off to a live person.

## Pieces (sub-account `gmgznEWM6sm6aqWPghSP`)

| Piece | Name | ID |
| --- | --- | --- |
| Chat widget | Live chat - Plyler's assistant | `6ac55756c02b2c1d09f2a099` |
| AI agent | Plyler's Tree Service Website Chat (Auto-Pilot, Live chat only) | `4ralo9XDKHoTsJm4Q6KA` |
| Contact field | Chat Message (`contact.chat_message`) | `HSRJkEiZeKr9RyYmVNPl` |
| Knowledge base | Plyler's Tree Service - Website Chat (2026) | `xclAEpXhUrdoqZKexygw` |
| Alert workflow | ALERT - Website Chat Message to Staff Email | `6d02273b-bb06-4a55-a94a-f4f225a0f42a` |

The widget ID lives in `src/data/business.json` (`embeds.ghlChatWidgetId`) and the
embed is at the end of `<body>` in `src/layouts/BaseLayout.astro`.

## Rules that are easy to break

- **The knowledge base is FAQ-only. Do not crawl the website into it.** The site's
  call-tracking script swaps the phone number client-side, the crawler captures the
  swapped number, and the bot then gives visitors a tracking number. The 60 FAQs were
  curated from `src/data/faq.json` plus hours, phone, ownership and payment facts.
  If `faq.json` changes materially, update the matching FAQs by hand.
- **The only phone number the bot gives is (870) 245-7944.**
- **The chat is not on `/lp/*` pages** (`LandingLayout.astro`). Those pages carry a
  hardwired ads tracking number and a single call CTA; the bot would hand out the main
  number and break call attribution.
- The agent's "Save the chat message" action only writes to an empty field. The alert
  workflow clears the field after alerting (then holds 2 minutes so the clear cannot
  re-trigger it). Removing the clear step means only a contact's first chat ever alerts.
- A message is marked `URGENT` only when a tree is already down on a structure, across
  a road or driveway, or on power lines. A dead tree that is simply standing is not.

## Alert workflow

Contact Changed (Chat Message has changed) → wait 1 min → internal **email** alert →
clear Chat Message → hold 2 min. Allow re-entry is on. Alert recipients are set in
the workflow's notification step, not in this repo.

This account has no texting, so the alert is email only. Do not switch the step to
SMS: the workflow log reports "Success" for a text that is never delivered.

## Known limits

- A second request typed into the same chat thread after the first was saved produces
  a thinner saved message. The full transcript is always in the conversation.
- The agent emails a conversation summary 15 minutes after a chat goes quiet
  (minimum 3 messages).
