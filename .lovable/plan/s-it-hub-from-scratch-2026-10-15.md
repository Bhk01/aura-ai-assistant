# S-IT Hub — from scratch

## Starting point
**Mode B:** a fresh web app, with no Figma project or existing design to preserve.

The visual direction is an original, premium hospital IT companion: deep ink, electric violet, confident typography, polished loading choreography, clear device statuses and an expressive animated Hub. Airbnb is a quality reference, not a design to copy.

## Phases
Each phase ends with screenshots, a short explanation of what works, exact testing steps, and a pause for your OK.

0. **Design foundation:** preserve your brief as SPEC.md, set up bundled fonts, colors, motion, accessible controls and the hidden `/design` gallery. Review French/Arabic and dark/light at phone size. Include a first look at the loading animation and Hub.
1. **Demo data:** create the offline data layer, 40 invented devices, six departments, three companies, contracts and sample papers. Test deadline calculations and critical-first ordering.
2. **Open and Today:** animated welcome, demonstration PIN screen, glass navigation, live late-device counts, offline indicator, swipe interactions and Hub’s base movements. Real account security comes in phase 9.
3. **Lists and details:** searchable Devices, device history, Companies and Papers, with transitions and empty/error states.
4. **Android preparation:** assess native packaging, document required installations, and test on a phone or emulator when an Android environment is available.
5. **Repair workflow:** three-step sending, confirmation, returns, history and PDF documents. Use clearly labeled sample layouts until you provide your hospital form photos.
6. **Alerts and sounds:** musical sound studio, alert preferences, quiet hours and native notification/haptic integration where supported.
7. **Scanner and papers:** capture/import, page cleanup, original preservation, review suggested fields, PDFs and searchable text. Clearly distinguish browser demonstrations from verified Android scanning.
8. **Hub’s intelligence and voice:** connect a real LLM, multilingual two-way voice, grounded device tools, visible action confirmations, animated screen guidance and Stop. General answers must be honest about uncertainty.
9. **Accounts and sync:** enable Lovable Cloud for shared storage, login, permissions, backups, offline queues and conflict handling. Connect phase 8’s assistant here if Cloud setup is required earlier.
10. **Finish:** complete Arabic/light-theme coverage, board view, thank-you scene, demo controls, accessibility and workflow tests, and a short guide for ilhem.

## Design review
- Phone checks at **390 × 844**, plus desktop checks.
- Two review rounds per screen: hierarchy, alignment, contrast, touch targets, clipping, motion and RTL.
- Keep review evidence in `docs/DESIGN_REVIEW.md`.
- Meaningful loading, empty, error and offline states; no buttons that pretend a real action succeeded.

## Technical adaptations for Lovable
- Keep the existing **React + TypeScript + TanStack Start + Tailwind** app. Do not replace its router or scaffolding.
- Use local IndexedDB for the explicitly requested offline-first behavior; Lovable Cloud supplies shared online storage.
- App server operations use TanStack server functions/routes, not Supabase Edge Functions. Secrets and LLM calls remain server-side.
- Default thinking model: **OpenAI GPT-6 Astra** through Lovable’s AI service. Two-way voice: **GPT Live**, subject to workspace availability and permission. Model access and voice are tested before being described as working.
- Android packaging needs a compatible client bundle; the existing server-rendered app cannot simply be treated as a native bundle. Verify the approach in phase 4 before promising an installable APK.
- OCRmyPDF/Tesseract require a separate compatible processing service; they cannot run directly in Lovable’s edge server. Choose that service at the scanner phase, with any cost or access needs explained first.
- Native scanning, fingerprint, notifications and offline speech must be tested on Android, not inferred from a browser preview.

## Tools and later requirements
Node, Bun and Git are available. **Java, adb and a configured Android SDK are missing** in this workspace. For Android testing, you will need Android Studio with its SDK/platform tools and a compatible JDK; exact versions and steps will be supplied after plugin compatibility checks.

No Figma connection or API key is needed to approve the design foundation. Real form photos and an Android test device are needed in later phases.

## First approval
Approve this plan to begin **phase 0 only**. The AI and voice connection will be built and tested in its own phase, not presented as a working feature in the initial design preview.