# S-IT Hub: build the whole app (design and logic)

## 0. How to start

- Save this entire message as SPEC.md in the project root and re-read it at the start of every phase. Keep AGENTS.md short: it points to SPEC.md and repeats sections 2 and 3.
- I am a student. Explain every step in plain words. After each phase, tell me exactly how to test it, then stop and wait for my OK. I will switch you between Plan mode and Build mode myself. Start in Plan mode: reply with a plan of the phases in section 16 and any questions you really need answered, then wait.
- You can read and edit files and run commands. Do not assume tools exist: check node, git, java, adb and the Android SDK, and tell me exactly what to install.
- Detect the starting point and tell me which one you found.
  MODE A: the folder already holds an exported Figma Make project (a package.json and src/App.tsx). The design is LOCKED. Follow section 2.
  MODE B: the folder is empty or has no design. You build the design and the logic. Follow section 3.
- If your model can look at images, judge the design from screenshots. If it cannot, tell me, and rely on automated checks plus my review.

## 1. The product

PERSONALIZE (I fill these in before sending)

- HER_FIRST_NAME = [ilhem letaief]
- HOSPITAL_NAME = [Hôpital Universitaire Sahloul de Sousse]
- OUR_NAMES = [Ibrahim Ghaouar x Med yassine ben rjab]
- ACCENT_COLOR = #8B5CFF (Volt Violet). Replace with her favorite color if known.

S-IT Hub is a mobile app, a thank-you gift for HER_FIRST_NAME, IT manager of a public hospital in Tunisia (HOSPITAL_NAME), from her students (OUR_NAMES). Her job includes sending broken devices (PCs, printers, monitors) to outside repair companies, waiting for them to come back, and filling in paper forms.
The app answers one question every day: Which devices are away being fixed, which ones are late, and which papers go with them?
It tracks devices that are away and warns when one is late; sends a device to a company in 3 taps; turns photos of paper into clear, searchable documents; works offline; and has an assistant character called Hub who can do things inside the app for her and answer any question, by voice or text, in French, Arabic and English.
Another app, made by a classmate, records new problems and prints write-off papers. Do NOT build those. The only link is importing a CSV file of devices.
Data: invented data only. No patient information anywhere.

## 2. MODE A: the design is locked

1. Do not change layout, colors, fonts, spacing, icons, wording or animations in any screen or component file.
2. Allowed edits inside screen files, and only these: replace fake data with data from a hook; connect an existing button or gesture to a real function; add stable data-hub-id attributes to interactive elements; pass new values as props.
3. All new code goes in src/logic (data, services, hooks), src/native (phone features) and src/hub (assistant).
4. Before changing anything: run git init if needed, commit the project exactly as it is, tag it design-locked, and write DESIGN_LOCK.md repeating these rules.
5. Take baseline screenshots of every screen and state (dark and light, French and Arabic, online and offline, at 390 x 844) with Playwright into a folder called baseline. After every phase take the same screenshots and compare them pixel by pixel, with a small tolerance for font rendering. For any bigger difference: fix it, or show it to me.
6. If you think a visual change is needed, stop and ask. I will change the design in Figma Make and send you new code.
7. Audit first and report: the framework, bundler and styling; every screen and component; a table of every feature marked Works, Fake or Missing; where the fake data lives; and anything that blocks Capacitor (it needs a package.json, a build output folder and an index.html with a head tag). Fix only what blocks the build, with no visual change.

## 3. MODE B: build the design to this quality bar (in Mode A, never fall below it)

Ambition: the craft and personality of a top award-winning, personality-driven website: oversized confident type, one electric accent color on deep dark surfaces, motion that follows the finger and the scroll, playful details that make her smile. This describes a level of quality, not a look to copy. Invent an ORIGINAL identity. Do not imitate any real person, athlete, brand, website, logo, mascot or color scheme.
No performance budget. Target a flagship Android phone and use rich effects freely: WebGL and shaders, real-time 3D, blur, glow, particles, 120 fps springs, large assets. Never lower visual quality to save speed or battery. The Reduce motion switch exists only as an accessibility setting.
Bold but never noisy: it is used in a busy hospital, so clarity comes first.
Review loop (mandatory for every screen):

1. Build the design system first: tokens, type scale, and every component in every state, shown on a hidden page at /design.
2. Build the screen. Take Playwright screenshots at 390 x 844 in dark and light, French and Arabic.
3. Critique your own screenshots against this checklist: one clear focal point; hierarchy by size and weight; an 8 px grid; optical alignment; consistent radii; the type scale; text contrast of at least 4.5:1 (axe-core); touch targets of at least 48 px; Arabic fully mirrored; empty, loading and error states; motion timings that match the tokens; short, kind microcopy.
4. Fix, and repeat at least twice. Only then move on.
5. Record each round in docs/DESIGN_REVIEW.md with before and after screenshots and the checklist result.
6. At each milestone, show me the key screens and ask my opinion before continuing.
   Bundle fonts with the app (for example with the @fontsource packages), never from a CDN, so everything looks identical offline.

## 4. Tech stack

Use this in Mode B. In Mode A keep the existing stack and add only what is missing.

- React, TypeScript and Vite. Tailwind CSS. Motion (framer-motion) for springs and layout transitions; GSAP only where clearly better. Three.js through @react-three/fiber for Hub and the device illustrations (detailed SVG with lighting is an acceptable fallback).
- State: Zustand. Languages: i18next with fr, ar and en files and right-to-left support. Local database: IndexedDB through Dexie.
- Phone: Capacitor (current version), Android first. Official plugins for notifications, haptics, network, share, filesystem, preferences and status bar. Community plugins for the document scanner, text recognition and barcode scanning (ML Kit), speech recognition, text to speech and biometric login. Before adding any plugin, check that it exists, is maintained and works with this Capacitor version. If there are two good choices, ask me.
- Server: Supabase (Postgres, Auth, Storage, Edge Functions). AI: an AI model API (for example Claude) called only from an Edge Function, with the model name in an environment variable. Paper reading on the server: OCRmyPDF with Tesseract (French, Arabic, English).
- PDFs built inside the app (pdf-lib or jsPDF). Tests: Playwright, Vitest, axe-core.

## 5. Identity (original)

Name and mark

- Wordmark: S-IT HUB in a heavy, wide display type. A small solid dot in ACCENT_COLOR orbits the wordmark once on open, then docks in the top corner and becomes the sync indicator. The dot is the brand, and it is Hub's seed.
- Tagline (French): Chaque appareil. Chaque délai.
  Color (dark theme is the default)
- Ink 950 #07090F background; Ink 900 #0D1220 surface; Ink 800 #151B2E raised card; Ink 700 #222A42 hairlines.
- Text: Fog 100 #F3F5FB; secondary Fog 400 #A3ACC4.
- Accent: ACCENT_COLOR with a soft glow (blurred, 30% opacity) behind key elements.
- Status colors, always paired with an icon and a word: Late #FF4D5E, Critical #D7263D (slow pulse), Waiting or due soon #FFA63D, Done #34D399, Information #4DA3FF.
- Light theme: Paper #F7F5FF background, white cards, Ink 900 text, accent darkened until it keeps at least 4.5:1 contrast on white. It must feel as punchy as the dark theme, because hospital corridors are bright.
  Type
- Display: Bricolage Grotesque ExtraBold, tracking -3%, line height 0.9 to 1.0. Body and UI: Inter. Arabic: Readex Pro at matching weights.
- Scale: hero numeral 120, title 40, section 28, body 16, small 13, label 12 in capitals with +6% tracking.
  Shape and surface
- Cards radius 28, buttons fully rounded, chips radius 12, sheets 32 on the top corners, 1 px hairlines, faint film grain (4%), tab bar and top bars in blurred glass. Generous space, huge numerals, few boxes; let the type do the work.
  Imagery
- Soft-3D, matte device illustrations (printer, desktop PC, monitor, scanner, laptop) in one consistent three-quarter angle, dark body, thin accent rim light, made with real-time 3D or detailed SVG lighting. Use them on device cards, empty states and the hero of the Device page.
- Icons: one rounded line-icon set, 2 px strokes.
  Motion language (springs)
- Snap: 120 ms ease-out for taps and presses (scale to 0.96). Glide: 280 ms ease-in-out for screen changes, with shared-element transitions from a list card to its page. Spring: stiffness 300, damping 22 for swipes, drags and sheets. Big reveal: 600 to 800 ms, only for signature moments, at most once per screen. Lists stagger by 40 ms. Reduce motion: every movement becomes a 150 ms crossfade.

## 6. Hub, the assistant character (original)

- Look: a glowing, glass-like orb in the accent color, about 56 px on screen, with two small expressive eyes and no mouth. Arms, legs, wings and tools grow out of its body only when needed and melt back in, so it can walk, fly and carry things. Soft-3D, matte, thin rim light. Invent it from scratch: do not base Hub on any existing mascot, robot, animal or character.
- Moves (each a named, reusable state): idle breathing and blinking; hover with a gentle bob; wave; walk on two stubby legs along the tab bar and across cards; fly with a small spark trail; land on a card; peek in from a screen edge; point; carry a device card or a paper; hold up a magnifying glass; think; speak; shrug; thumbs-up; celebrate and dance; sleep; dizzy; bow.
- Where Hub appears: on every screen, in character with it: hatching on Open, sitting on the Today numeral and dancing at 00, peeking over the search bar, pointing at the status on the Device page, carrying the device on Send, flying the light bar on the Scanner, holding a magnifying glass on Papers, sleeping on the cloud when offline, dizzy on errors, bowing in the thank-you scene.
- Rules: Hub can be dragged anywhere; it never covers information or buttons; only one large Hub animation plays at a time; each lasts under 2 seconds unless Hub is doing a task. Hub energy setting: Playful (default), Quiet (small, still poses), Off (just the assistant button).
- Code: src/hub holds a Hub component with a state machine of the moves above and a small API: hub.play(move), hub.flyTo(dataHubId), hub.tap(dataHubId), hub.say(text, language), hub.sleep(), hub.wake(). Render it as a real-time 3D glass orb (transmission, glow) with limbs that grow from the body on springs, and flat eyes that blink and look toward the touch.

## 7. Signature moments (the wow)

1. Open: the wordmark builds from stretched letters into place (700 ms). The accent dot is Hub: it orbits once, hatches into the character, waves, then flies to the top-right corner and shrinks back into a dot. A greeting types in: Bonjour HER_FIRST_NAME (name in the accent color). Then a PIN pad with big keys that dip and glow on press, and a fingerprint button.
2. Today hero: a giant numeral shows how many devices are late (for example 02), counting up. While she scrolls, it shrinks into a sticky header (scroll-linked). Cards rise in with a stagger. Critical cards (Emergency, ICU, Operating Room) breathe with a slow rim glow (2.4 s). Never flash faster than 3 times a second.
3. Swipe cards: dragging right reveals full-bleed green (Returned); dragging left reveals the accent color (Remind company). The icon grows near the threshold, a ripple fires at the threshold, the card exits on a spring and the list closes the gap.
4. Send a device: a 3-step bottom sheet. On confirm, the device illustration flies along a curved path into the company chip with a short accent trail, and the return date lands like a rubber stamp with one small bounce. The toast says Envoyé, with 6 tiny particles, once.
5. Scanner transformation (the hero feature): a viewfinder with four breathing corner brackets that snap to the paper corners with a magnetic tick, then a shutter flash. The photo warps flat (400 ms), a light bar sweeps over it and the shadow disappears (500 ms), and the text sharpens from blur to crisp (300 ms). End on a draggable before and after slider. Then a Check before saving card slides up and the suggested fields type in one by one, each with a chip: Sure or Check this.
6. Hub the assistant: near-black full screen with Hub in the middle. Hub breathes and blinks when idle, leans in and ripples with her voice while listening, puts a hand to its chin and glows white while thinking, then speaks with a pulse and word-by-word captions. A language chip (FR, عربي, EN) with a sliding indicator switches by itself when she changes language. Answers fan up as cards. Actions show a Confirm card with huge Yes and No buttons.
7. Sync: when the connection returns, the orange dots on waiting items lift off and stream into the cloud icon, which morphs from grey-with-slash to green check with a small bounce. The toast says Tout est envoyé.
8. All clear: when nothing is late, the numeral becomes 00, a quiet burst of accent particles plays once, and the line reads: Rien en retard. Bravo.
9. Thank-you scene: long-press the wordmark. A full-screen dark scene: three lines of huge type fade in one by one: Merci, HER_FIRST_NAME. / Pour tout ce que vous nous avez appris. / OUR_NAMES. Hub drifts across, lands as a full stop, then bows.
10. Sound studio: each alert type is a card with an animated waveform and a Play button that really plays the sound.
11. Autopilot (Hub does it for her): when she asks for a job, Hub grows legs or wings as needed, flies to the right tab, taps it with a ripple, types into the search field letter by letter, walks along the list, points at the right card, opens it, carries it to the company chip, and stops at the Confirm card. A thin accent outline marks every element Hub touches. A big Stop button hands control back instantly. Example request: Envoie l'imprimante INV-0402 chez Nimbus Service.
12. Hub answers anything: Hub thinks, then answers any question in a clean card with a short spoken version; when unsure it shrugs and says so.

## 8. Screens (French is the main language)

Bottom glass tab bar: Today, Devices, Companies, Papers. A raised round center button opens two actions: Send a device and Scan a paper. A round Hub button floats on every screen.

1. Open and PIN (moment 1).
2. Today: the hero numeral, then three lists: Late (red), Critical places waiting (Emergency, ICU, Operating Room, dark red with a slow pulse), Coming back this week (blue). Card: device icon and name, inventory number, department tag, company name, days late or days left. Sort critical first, then most days late. Swipe right = Returned, swipe left = Remind company, tap = open, long press = quick menu (call the company, open its papers). Pull down to sync. A cloud icon shows sync: green check = all sent, orange with a number = waiting, grey with a slash = offline; tap it for details and Send now. States: normal, all clear, offline (grey banner: Hors ligne: tout est enregistré sur le téléphone).
3. Devices: search bar with typing, a mic and a barcode or QR scan; results update as she types and match inventory number, serial number, type, brand, department and company. Filter chips: status, department, company, Critical only. Rows: icon, name, inventory number, department, status chip. Import: choose a CSV with the columns inventory_no, serial_no, type, department, problem, reported_date; show a preview with counts of new and changed rows and ask before importing; never delete devices missing from the file.
4. Device page: hero with the device illustration, name, inventory number (for example INV-0402), serial number, department with a Critical badge, status chip. Tabs: History (every trip to a company with sent date, expected date, returned date, cost and result), Papers, Info (brand, model, purchase date and cost, notes). Sticky bottom action: Envoyer à une société, or Marquer comme retourné. Menu: print dispatch note, print reception sheet, share, edit. Version 2: a Keep or replace card that shows its reasons.
5. Send to company (3 steps with progress dots): devices (one or many); company and problem (companies suggested from device type and active contracts, each with its deadline in days and a chip: Sous garantie, Sous contrat or Hors contrat; describe the problem by typing or by mic; optional photo; hint: Do not write patient names); review with the expected return date. Buttons: Save and print dispatch note (main), Save only. Version 2: when a device from a Critical department leaves, offer to lend a spare from IT stock.
6. Mark returned: result chips (Réparé, Irréparable, Remplacé), optional cost, optional scan of the signed reception paper, success. If a spare was lent, ask whether to take it back.
7. Companies: cards with devices held, late count and a contract chip. Company page: contact person with one-tap Call, WhatsApp and Email; contracts (dates, deadline in days, covered device types, a warning chip when one ends in 30 days or less); devices held now; history; papers. Version 2: an on-time ring and a repeat-failure count; a Reminder button that writes a message listing the late devices in her language and opens WhatsApp or email with the text filled in (wa.me and mailto links, no paid service).
8. Papers: grid of page thumbnails, search that finds words inside papers and highlights them, category chips, filters by device, company and date. Viewer with pinch to zoom, swipe between pages, Share, Print, Delete with Undo. Badges: Sur le téléphone, Sauvegardé, Mots non lus.
9. Scanner flow (moment 5) and the Check before saving screen.
10. Assistant (Hub): idle, listening, thinking, answer, not sure, Autopilot, confirm, offline.
11. Alerts: an in-app banner, the Sound studio (moment 10) and the alert settings.
12. Offline and sync: a waiting-changes sheet, and a Check this device card showing two versions of a status side by side.
13. Settings: language (Français, العربية, English) that re-lays out the screen live, theme, text size, Hub energy, sounds, quiet hours, assistant on or off, sync, security (PIN or fingerprint, auto-lock), users and roles, import CSV, Demo mode (Load demo data, Reset, a Hub moves picker that plays any Hub move), and an About page with a thank-you message.
14. Optional Board view: columns In office, At company, Ready for pickup, Back in service; drag a card between columns with a snap.

## 9. Data and rules

Tables (every row has id made on the phone, created_at, updated_at, deleted_at):

- departments: name, criticality (critical or standard)
- devices: inventory_no, serial_no, type, brand, model, purchase_date, purchase_cost, department, status, notes
- companies: name, contact_person, phone, whatsapp, email
- contracts: company, start_date, end_date, covered_device_types, deadline_days
- trips (one row each time a device goes to a company): device, company, problem, sent_date, expected_return_date, returned_date, cost, result
- loans (version 2): spare_device, department, trip, start_date, end_date
- papers: type, pages, phone_file_path, cloud_url, text, text_language, device, trip, company, upload_status, words_status
- users: name, role (admin or read-only)
- waiting_list: what changed, when, tries, last_error
- history_log: who, what, when
  Statuses: In office, At company, Ready for pickup, Back in service. Formats: dates day/month/year, digits 0-9, money in Tunisian dinars (TND) with 3 decimals.
  Rules, no hidden magic:
- Expected return date = send date plus the contract deadline in business days (which days are the weekend is a setting).
- Overdue = today is later than the expected return date. Critical departments sort first.
- Keep or replace (version 2): suggest write-off when a device has 3 or more repairs, is older than 5 years, or has cost more than half its purchase price in repairs. The numbers are editable, the screen names the rule that fired, and she decides.
- Contract warning: 30 days before the end date.
- Papers made by the app: dispatch note (bon de sortie) and reception sheet (PV de réception), filled from the device and company records, one device or many in one note, signature and stamp areas left blank, French by default and Arabic as an option. Copy the layout and wording from my real forms (I will give you photos).
- File names: YYYY-MM-DD_Type_Company_Inventory.pdf, for example 2026-10-10_Invoice_CompanyX_INV-0402.pdf.

## 10. Offline and sync

- Every screen works with no internet. Every change is saved on the phone first, added to the waiting list, and marked with an orange dot. When the connection returns, a background job sends the waiting list in order, the server confirms, the dot disappears, and the app downloads other people's changes.
- Conflicts: for simple fields the newest change wins. For a device status, show the Check this device card with both versions and let her choose. Log every change in history_log.
- Files: photos and PDFs are saved on the phone first, uploaded in the background with progress and retries, and resume after a break. Wi-Fi only is a setting.
- Never delete on the phone until the server confirms; use deleted_at. Every delete has a few seconds to undo.
- Needs internet: AI answers, Arabic and handwriting reading, backup, other people's changes. Everything else works offline. The first start needs internet once, to log in and download data.

## 11. Scanner and papers

- Capture with a document-scanner plugin. On Android, Google's ML Kit Document Scanner finds the edges, turns the page upright and can remove shadows and stains on the phone, and it relies on Google Play services. Several pages become ONE PDF; she can add, delete, rotate and reorder pages. Modes after scanning: Clean (white background, dark sharp text, the default), Color (keeps blue stamps and signatures), Original. If the scanner's own clean-up is not enough, add your own step: raise contrast, flatten the background, sharpen the text. Always keep the original photo. If a photo is too dark or blurry, say so kindly and offer Try again.
- Read the words. On the phone, ML Kit Text Recognition reads French and English print with no internet, but it does NOT read Arabic. On the server when online, OCRmyPDF with Tesseract reads Arabic and weak handwriting and builds the final searchable PDF. Handwriting is best effort; never promise it. Until the words are read, show the tag Mots non lus. Store the text in the database so search works inside papers.
- Sort and name (the app suggests, she confirms): type (Invoice facture, Contract contrat or marché, Quote devis, Dispatch note bon de sortie, Reception sheet PV de réception, Warranty garantie, Other) from keyword rules in French, Arabic and English first, and the AI model only when the rules are unsure; also company, device (look for inventory numbers like INV-0402), date and amount. The Check before saving screen shows the page and the suggested fields, each labeled Sure or Check this. Never save guesses silently.

## 12. Hub's brain

- A Supabase Edge Function called hub receives her text, the language, a small app context (current screen, selected device) and the conversation. The AI model may only call these tools: search_devices, list_late_devices, list_devices_at_company, get_device_history, find_paper, get_company_info, draft_reminder_message, draft_monthly_summary, open_screen, start_send_to_company, start_mark_returned, change_setting. The server checks every call against this list. The app runs the calls.
- Anything that changes data (the start_ tools and change_setting) shows the Confirm card first. Searching, reading and opening screens need no confirmation. Autopilot (moment 11) drives the real screens through the data-hub-id attributes, using the animations that exist.
- Any answer about her data must come from tool results. Never invent device numbers, dates or amounts.
- Hub answers any question, general knowledge, how-to and writing help included, in the language she used. If unsure, it says so (the shrug). For medical or legal questions it gives general information and suggests asking a professional. It politely declines harmful requests.
- Speech to text: use the phone recognizer when it supports her language (French, Arabic and English at least); otherwise record a short clip and send it to a speech-to-text service when online. Detect the language automatically. She can tap the words on screen to fix them before they are sent. Text to speech: the phone voices (check which Arabic voice is available); captions follow word by word.
- Offline: simple commands still work on the phone (show late devices, open Emergency devices, scan a paper, open device INV-0402). For anything that needs the AI, say so and offer to keep the question and answer it when she is back online.
- Privacy and cost: send only the data a question needs. A Settings switch turns the assistant off. Add a rate limit and a monthly spending cap on the Edge Function. Log every action in history_log.

## 13. Notifications and sounds

Calm and friendly. Musical chimes and short spoken lines, never buzzers: hospital machines already beep, and she must never confuse an app sound with a medical alarm.

| Alert                  | When                                               | Sound                             | Spoken line                                  | Repeat                                     |
| ---------------------- | -------------------------------------------------- | --------------------------------- | -------------------------------------------- | ------------------------------------------ |
| Device late            | A company passes the return date                   | Two soft rising tones             | A device is late at Company X                | Once a day until handled                   |
| Critical place waiting | An Emergency, ICU or Operating Room device is away | Stronger three-note chime         | Attention: Emergency is waiting for a device | Up to 3 times, 10 minutes apart, then stop |
| Due tomorrow           | 1 day before the expected return                   | One soft chime                    | None                                         | Once                                       |
| Contract ending        | 30 days before the end date                        | Calm low chime                    | None                                         | Once                                       |
| Done                   | Returned, paper saved, upload finished             | Short bright pop plus a light tap | None                                         | Never                                      |
| Morning briefing       | 08:00, changeable                                  | Gentle short melody               | Play button reads a short summary            | Daily                                      |
| Sync problem           | Uploads keep failing                               | Quiet low tone                    | None                                         | Once                                       |

- Schedule reminders ON THE PHONE (local notifications) when a device is sent, so they work offline. Cancel or move them when the status changes.
- One Android notification channel per alert type, each with its own sound. After a channel is created only its name and description can change, so create a new channel when a sound changes.
- If the phone is on silent or Do Not Disturb, no sound plays. Still show the alert, and explain in Settings how to allow it.
- Action buttons: Open, Snooze until tomorrow, Remind company (version 2). Group by company. At most 5 alerts an hour; extra ones merge into one summary. Quiet hours default to 20:00 to 07:00, except critical places if she allows it.
- Sounds: write a script that generates the seven sounds as short WAV files (0.6 to 1.5 seconds, layered sine and FM tones with soft envelopes). Spoken lines are short recordings (2 to 4 seconds) in French, Arabic and English chosen by the app language, because a notification can only play a sound file. Use the tones as placeholders: I will give you recordings later; keep them in assets/sounds/fr, ar and en.
- Haptics match the sound: light tap for success, double tap for warnings, strong tap for critical. Settings: each alert on or off, its sound, volume, vibration, voice lines on or off, and a Test this sound button.

## 14. Security and privacy

- Log in with email and password the first time, then a PIN or fingerprint to reopen. Auto-lock after a time she picks. Two roles: admin (her) and read-only.
- Encrypt the phone data if possible and keep keys in secure storage. API keys live on the server only, never in the app.
- No patient data. Under every free-text field: Do not write patient names.
- Every cloud and AI feature has an off switch, because the hospital may not allow documents to leave its network.

## 15. Demo data (fake)

Settings, Demo mode: Load demo data and Reset.

- 6 departments: Emergency, ICU and Operating Room (critical), and Cardiology, Radiology, Administration.
- 40 devices (PCs, printers, monitors, scanners) with invented inventory and serial numbers, purchase dates between 2016 and 2025, and costs in TND.
- 3 invented companies (for example Nimbus Service, Zenith Repair, Kora Maintenance) with phone numbers, each with a contract and a deadline (5, 7 and 10 business days).
- 5 devices currently at companies, 2 of them late, and 1 of those from Emergency.
- 3 sample papers (generated images of invented invoices: one tilted with a shadow, one dark, one in Arabic) so the scanner can be demonstrated.
- Dates are relative to today so the demo always looks alive.

## 16. Phases (stop after each, tell me how to test it, wait for my OK)

In Mode B you build each screen to the section 3 quality bar and run the review loop. In Mode A you wire the existing screens and run the baseline comparison.

- Phase 0, Setup: check tools, SPEC.md and AGENTS.md, git, mode detection. Mode A: audit, design lock, baseline screenshots. Mode B: project scaffold, fonts, tokens, the /design page.
- Phase 1, Data: the Dexie database, services and hooks, seeded with demo data (in Mode A, exactly the fake data the screens show today, so nothing changes visually).
- Phase 2, Shell, Open and Today: tab bar, PIN, Today with moments 1, 2, 3 and 8, offline banner state, Hub base character (idle, wave, walk, fly).
- Phase 3, Lists: Devices, Device page, Companies and Papers, read-only, with the shared-element transitions.
- Phase 4, Android: wrap with Capacitor, run on a phone or emulator, check the screens against the baseline or the review checklist, and give me the exact commands to install the app on my phone.
- Phase 5, The vendor loop: Send to company, Mark returned, history, counts, swipe actions, all-clear, and the papers made by the app (dispatch note and reception sheet, shared through the phone share sheet).
- Phase 6, Alerts: local notifications, channels, generated sounds, quiet hours, snooze, morning briefing, haptics, the Sound studio.
- Phase 7, Scanner and Papers: section 11 in full, with moment 5.
- Phase 8, Hub: section 12 in full, with moments 6, 11 and 12, plus voice.
- Phase 9, Server and sync: Supabase, login, the waiting list, conflicts, background uploads, server reading of papers.
- Phase 10, Finish: light theme and Arabic right-to-left on every screen, the Board view, the thank-you scene (moment 9), the Demo mode, a final design review, and a one-page quick guide for her.

## 17. Done means

1. Airplane-mode test: offline, send a device, return another, scan a paper and print a dispatch note; online, everything arrives on the server once, with no duplicates.
2. A person who has never seen the app sends a device in under 30 seconds.
3. Arabic screens are mirrored and nothing is cut off.
4. Ten real photos through the scanner come out as readable pages, and the app says so honestly when one cannot.
5. Ten questions in each language to Hub get correct answers with nothing invented, and Autopilot completes a send-a-device request up to the Confirm card.
6. Reminders fire offline with the right sound.
7. axe-core reports no serious accessibility issues, and the Playwright flows pass.
8. Mode A: the screenshot comparison shows no visual change. Mode B: docs/DESIGN_REVIEW.md shows every screen passed the checklist.
9. The app installs and runs on a real Android phone.

## 18. Never do this

- No real hospital data and no patient information.
- No copying of any existing brand, person, website, logo or imagery.
- Hub never changes or sends anything without the Confirm card.
- No API key inside the app. No ads and no tracking.
- In Mode A, no visual change without asking me first.
- Do not rebuild the classmate's app (no problem reporting, no write-off papers).
- No text written directly inside screens; use the translation files.
