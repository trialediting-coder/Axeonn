# Working in this repo

Next.js 15 App Router site for Axeon Studio, plus the client portal (`/welcome`), AxeonPROOF (`/proof`, the client dashboard on app.axeonstudio.co) and the admin (`/admin`). Checks: `npm run lint` (tsc), `npm run test:onboarding`, `npm run build`.

## UI quality control (owner rule, 2026-10-12)

Every UI change is checked by eye before it is called done, not just type-checked. Render the changed screens and look at the screenshots at **phone (390px)** and **desktop (1400px)** widths, and fix what looks off before pushing. The owner catches these on their phone; catch them first.

How: a temporary page under `app/zz-*/page.tsx` that renders the component with realistic sample data, `npx next dev`, and Playwright screenshots (Chromium is at `/opt/pw-browsers/chromium`). Delete the temporary page, and `.next`, before committing.

Look for:
- **Alignment and centring.** Icons centred in their tiles and on the text beside them; nothing pinned to a corner by accident; columns that line up.
- **Size and proportion.** Icons and tap targets big enough on a phone (tiles about 48–56px, buttons at least 40px tall); nothing shrunk just to make it fit.
- **Floating or overhanging elements.** A tile hanging off a card edge works in a desktop grid and looks loose when cards stack one per row on a phone.
- **Overlap and clipping.** Fixed buttons, sticky bars and badges covering content; text cut off; horizontal scrolling at 390px.
- **Spacing.** Even gaps between stacked cards; no leftover space reserved for something that only exists on desktop.
- **Empty and full states.** Check before-launch empty states and a realistic month of data, plus long names and addresses.
- **Consistency.** Matches the surrounding dashboard (card style, radius, colours, type sizes).

Note which widths were checked in the PR description.
