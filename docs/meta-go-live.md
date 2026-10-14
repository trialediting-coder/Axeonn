# Facebook and Instagram: Meta App Review and go-live checklist (owner)

This is for the owner, not code. Slice 6 (Facebook and Instagram messages in the inbox on
AxeonCORE and AxeonGROWTH, reels on AxeonGROWTH) is built and tested offline, but it is
UNVERIFIED until Meta approves the app. How it works is in `docs/onboarding.md`, section
"Facebook and Instagram". Work top to bottom and tick each box. Until section F is done,
customer-facing copy keeps calling Facebook and Instagram messages "coming soon".

Plan on two to six weeks from the start of business verification to approval. Meta usually
reviews a submission within about 10 business days, and first submissions are often sent
back for gaps in the screencast.

## A. Business verification (start first; it gates Advanced Access)

- [ ] In Meta Business Suite (business.facebook.com) > Settings > Business info, confirm the
      legal name, address and phone of Axeon Studio exactly as on the LLC filing, and add the
      website `https://axeonstudio.co`.
- [ ] Settings > Brand safety > Domains: add `axeonstudio.co` and verify it with the DNS TXT
      record Meta shows (add it at the registrar; wait until it shows Verified).
- [ ] Settings > Security center (or Business info > Business verification) > Start
      verification. Upload the Iowa LLC certificate (or articles of organization) and a
      utility bill or bank statement with the same name and address. It can take a few days
      to a few weeks; Meta emails when it is done.

## B. Tech Provider status

The spec (`docs/superpowers/specs/2026-10-12-proof-lead-system-design.md`, slice 6) calls this a
"Meta Tech Provider App Review": Axeon's app reaches other businesses' pages and Instagram
accounts, so Meta treats it as a tech provider, not an app for Axeon's own page.

- [ ] When the App Dashboard asks (Settings > Basic, or the App Review page), choose that the
      app is used to access other businesses' data, and complete **Access Verification**
      for Axeon Studio once business verification (A) is done. Without it Meta does not grant
      Advanced Access to the page and Instagram permissions below.
- [ ] Keep the business portfolio that owns the app the same one that was verified in A.

## C. The app

- [ ] developers.facebook.com > My apps > Create app. Use case "Other", app type **Business**,
      linked to the Axeon business portfolio. Name it "Axeon Studio".
- [ ] App settings > Basic:
  - App icon (1024 x 1024 Axeon mark), category "Business and pages".
  - Privacy policy URL `https://axeonstudio.co/privacy` (section 5 describes the Facebook and
    Instagram data).
  - Terms of service URL `https://axeonstudio.co/terms`.
  - User data deletion: choose "Data deletion callback URL" and enter
    `https://axeonstudio.co/api/meta/data-deletion`.
  - Copy the App ID and App secret into Vercel as `META_APP_ID` and `META_APP_SECRET`
    (Production and Preview).
- [ ] Add products: **Messenger**, **Instagram** (Instagram API with Facebook Login),
      **Webhooks** and **Facebook Login for Business**.
- [ ] Facebook Login for Business > Settings:
  - Valid OAuth Redirect URIs: `https://app.axeonstudio.co/api/meta/callback`. This is
    `APP_URL` + `/api/meta/callback` and must match byte for byte. Add a preview host's
    `/api/meta/callback` too if you test on one.
  - Deauthorize callback URL: `https://axeonstudio.co/api/meta/deauthorize`.
  - Configurations > Create: login variation "General", access token "User access token",
    and exactly the nine permissions in section E. Copy the configuration id into Vercel as
    `META_LOGIN_CONFIG_ID` (optional, but a Business app normally needs it; without it the
    dialog sends a scope list instead).
- [ ] Webhooks, object **Page**: callback URL `https://axeonstudio.co/api/meta/webhook`,
      verify token = your `META_VERIFY_TOKEN`. Press Verify and save; this calls our GET
      handshake and must succeed (the env vars in D must be live first). Subscribe the
      fields `messages` and `messaging_postbacks`. Each connected page is also subscribed to
      those two fields automatically when it is connected.
- [ ] Webhooks, object **Instagram**: the same URL and token; subscribe `messages`.
- [ ] App settings > Advanced: turn on "Require App Secret". Every Graph call we make with a
      token carries `appsecret_proof`.

## D. Environment variables (Vercel, Production and Preview, then redeploy)

| Variable | Value | Notes |
| --- | --- | --- |
| `META_APP_ID` | From App settings > Basic | Needed with the next three; until all four are set every Meta route answers 503. |
| `META_APP_SECRET` | From App settings > Basic | Checks webhook signatures and Meta's `signed_request`. Never paste it anywhere but Vercel. |
| `META_VERIFY_TOKEN` | `openssl rand -hex 24` | The same value goes in both Webhooks objects in C. |
| `SECRETS_KEY` | `openssl rand -base64 32` | Seals page tokens (AES-256-GCM). Keep a copy in the password manager. Never change it once pages are connected: losing or rotating it means every client reconnects. |
| `META_LOGIN_CONFIG_ID` | The configuration id from C | Optional. |
| `BLOB_READ_WRITE_TOKEN` | Added by Vercel | Storage > Create > Blob, connect it to the project. Reels uploads answer 503 without it. |
| `META_PORTAL_LIVE` | leave unset | Set to `1` only in F, after approval. |
| `APP_URL` | `https://app.axeonstudio.co` | Already used by the app host; the login redirect is built from it. |
| `CRON_SECRET` | already set | The hourly reels cron (`/api/cron/social`, at :05) uses it. Hourly crons need Vercel Pro, which the 15-minute follow-up cron already requires. |
| `POSTGRES_URL` | already set | Tables `meta_pages`, `meta_messages`, `social_posts`, `meta_deletions` are created on first use. |

The code reads no other Meta-related variable (`grep process.env` over `lib/meta*.ts`,
`lib/social*.ts`, `lib/secretBox.ts`, `app/api/meta`, `app/api/cron/social`, the reels upload
route and `data/onboardingItems.ts`). Push alerts for DMs use slice 4's `WEB_PUSH_*` keys.

## E. End-to-end test in Development mode

- [ ] App roles > Roles: add yourself as Administrator and a second personal Facebook account
      as Tester. In Development mode only people with a role can log in, and only messages
      from people with a role reach the webhook.
- [ ] Create a test Facebook page, link a test Instagram professional account to it, and make
      your own account the page's admin. In the Instagram app, Settings > Messages and
      replies > Connected tools: turn on "Allow access to messages".
- [ ] Make a test onboarding on AxeonGROWTH. On its admin page press "Connect with Facebook",
      tick the test page, Save. Expected: back on the admin page with "Facebook and Instagram
      are connected. New messages will show up with your leads.", and the card lists the
      page with the Instagram username. (Some pages failing shows the "partial" notice and
      marks those pages as needing a reconnect.)

First live test, one per channel:

- [ ] **Messenger in:** from the Tester account, message the page. Expected within a minute:
      a contact in the client's PROOF inbox, a "Facebook message: …" timeline line and the
      client alert.
- [ ] **Instagram in:** from the Tester account, DM the Instagram account with a photo.
      Expected: a contact, an "Instagram message: …" timeline line, the alert.
- [ ] **Replies out:** reply to each from the inbox. Expected: the reply arrives in Messenger
      and in Instagram, and the contact moves to Contacted.
- [ ] **24-hour window:** in the Neon SQL editor, set that contact's last inbound
      `meta_messages.sent_at` back 25 hours and reply again. Expected: "Facebook only lets
      you reply within 24 hours of their last message." and nothing sent.
- [ ] **Reels (Instagram and Facebook):** on the admin Reels card, upload a short vertical
      MP4, caption it, tick both, schedule five minutes ahead. After the next hourly run (or
      `curl -H "Authorization: Bearer $CRON_SECRET" https://axeonstudio.co/api/cron/social`,
      run twice if Instagram is still processing): both posts show "Posted" and the reel is on
      the test Instagram and the page. The next day the Instagram row shows reach, and the
      client's PROOF Ads tab lists it under "Reels we posted for you".
- [ ] **Disconnect:** press Disconnect on the admin card. Expected: the card empties and a new
      DM no longer arrives.
- [ ] **Deauthorize:** reconnect, then remove the app from the connecting account's Facebook
      settings (Settings > Business integrations). Expected: the deauthorize callback removes
      the pages that account connected; the admin card empties.
- [ ] **Data deletion:** Meta has no button for this in Development mode, so sign a request
      yourself with the real app secret and post it (run locally; the secret is read from
      the environment and never typed into the command):

      ```bash
      SR=$(node -e "const c=require('crypto');const p=Buffer.from(JSON.stringify({algorithm:'HMAC-SHA256',issued_at:Math.floor(Date.now()/1000),user_id:'<your app-scoped id>'})).toString('base64url');console.log(c.createHmac('sha256',process.env.META_APP_SECRET).update(p).digest('base64url')+'.'+p)")
      curl -s -X POST --data-urlencode "signed_request=$SR" https://axeonstudio.co/api/meta/data-deletion
      ```

      Expected: `{"url":"https://axeonstudio.co/meta/deletion?code=…","confirmation_code":"…"}`.
      Opening the url shows "Done on …". A request signed with any other secret gets a 400.

## F. App Review submission (App Review > Requests > Request advanced access)

Request these nine permissions (they match `META_SCOPES` in `lib/meta.ts`), each with a
one-paragraph use description and a screencast:

| Permission | What to write | What the screencast must show |
| --- | --- | --- |
| `pages_show_list` | We list the pages the business owner chooses to connect so their customer messages reach their AxeonPROOF inbox. | Facebook Login dialog, choosing the page, our admin card listing it. |
| `pages_manage_metadata` | We subscribe the connected page to our webhook so new messages are delivered. | Same flow, then a message arriving. |
| `pages_read_engagement` | We read which Instagram account is linked to the page. | The card showing "Instagram @…". |
| `pages_messaging` | The business answers customers who messaged their page, from one inbox, within the 24-hour window. | A Messenger message arriving in PROOF, a reply typed in PROOF, the reply appearing in Messenger. |
| `instagram_basic` | We read the linked Instagram professional account's id and username. | The card showing the username. |
| `instagram_manage_messages` | Same as Messenger, for Instagram DMs. | An Instagram DM arriving in PROOF and the reply appearing in Instagram. |
| `instagram_content_publish` | Axeon posts reels the business approved to their Instagram. | Uploading and scheduling on the Reels card, then the reel live on Instagram. |
| `pages_manage_posts` | Axeon posts the same video to the business's Facebook page. | The same post live on the page. |
| `instagram_manage_insights` | We show the business how many people each reel reached. | The PROOF Ads tab "Reels we posted for you" with reach. |

- [ ] Record the screencast(s): 1080p, captions on, under 5 minutes each, with the test page.
      One video can cover all nine if each permission is clearly shown being used; Meta
      rejects videos that skip the login dialog or do not show the permission in use.
- [ ] Give reviewers test credentials: the Tester Facebook account with the test page, and an
      admin login for the app's admin limited to the test client (the CMS bearer token is not
      a login; create a dedicated admin account for review).
- [ ] Complete the Data Use Checkup and the data-handling questions: data is not sold, page
      tokens are encrypted at rest, the deletion and deauthorize callbacks are live.
- [ ] Submit.

## G. Go live

- [ ] When every permission shows Advanced Access, switch the app from Development to
      **Live** (top bar toggle).
- [ ] Set `META_PORTAL_LIVE=1` in Vercel and redeploy. CORE and GROWTH portals now show the
      optional step "Connect your Facebook page and Instagram". It never counts toward setup
      progress and never reopens a client who already finished setup; existing clients see
      it as an extra they can do any time (or connect them from their admin page).
- [ ] Flip the "coming soon" copy, and commit:
  - `data/pricingData.ts`: `'One inbox for every text, email and website chat, on your phone (Facebook and Instagram messages coming soon)'`
    becomes `'One inbox for every text, email, website chat, Facebook and Instagram message, on your phone'`.
  - `public/llms-full.txt`: `one inbox for every text, email and website chat, on your phone (Facebook and Instagram messages coming soon)`
    becomes `one inbox for every text, email, website chat, Facebook and Instagram message, on your phone`.
  - `content/brand-guardrails.md`: replace `chat; Facebook and Instagram messages are "coming soon" and must be\n  labeled that way, never promised as live; Google Business Messages`
    with `chat, Facebook and Instagram messages (live since <date>); Google Business Messages`.

  ```bash
  git add data/pricingData.ts public/llms-full.txt content/brand-guardrails.md
  git commit -m "copy: Facebook and Instagram messages are live in the inbox"
  ```

- [ ] In `docs/onboarding.md` ("Facebook and Instagram") and at the top of this file, replace
      "UNVERIFIED until Meta App Review approves" with "Approved by Meta on <date>".
- [ ] For the first real client: connect their page with them on the phone, ask them to send
      one test message from a personal account, and confirm it lands in their inbox.
