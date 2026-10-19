# He Had 180+ Five-Star Reviews. His Website Was Hiding Them.

A-1 Auto Detailing had the hard part figured out before we ever touched the website. Levi Rench runs it out of Pleasant Hill, Iowa, he has 25 years of hands-on detailing behind him, and his customers had left him a 5.0 rating across 180+ Google reviews. People who found him loved him.

The problem was the finding. His website wasn't doing the work his reputation deserved, and the way people search for a detailer has changed. They still type "car detailing Des Moines" into Google, but more and more of them ask ChatGPT, or read the AI Overview at the top of Google and never scroll down.

This is the story of how we rebuilt [a-1autodetailing.net](https://www.a-1autodetailing.net/) from the ground up: a site that ranks, a booking flow that turns visits into appointments, and a structure AI assistants can read, trust, and recommend.

## Where A-1 started

The old site had the look of a lot of local service sites: dozens of near-identical pages, one for every combination of service and nearby town. Across the old domain there were roughly 56 URLs, many of them thin "service in city" pages with the same copy and a different town name swapped in.

Pages like that used to help. Today Google treats them as low value, and AI assistants have almost nothing to quote from them. Meanwhile the things that actually make A-1 worth choosing, the real prices, the real before-and-after photos, Levi's experience, the reviews, were buried or missing.

The goal was simple to say: make the website as good as the work.

![Before and after: A-1 Auto Detailing's old homepage compared with the new one Axeon built](/images/case-studies/a1/homepage-before-after.jpg)

*Same business, same phone number. Very different first impression.*

## Step 1: A new logo that works everywhere

A-1's old logo was a small blue-and-black card with the business name and phone number printed right on it. It looked fine on a magnet. Shrunk down to a website header, a browser tab, or a Google profile photo, it turned into an unreadable blue smudge.

So we designed Levi a new mark: a dual-action polisher, the tool behind every paint correction, inside a clean blue ring, with a little sparkle for the finish. No text, no phone number, nothing to go out of date. It reads as clearly on a shop sign as it does as a 16-pixel favicon.

![A-1 Auto Detailing's old business-card logo next to the new polisher logo Axeon designed, shown at four sizes](/images/case-studies/a1/logo-before-after.jpg)

*The phone number lives on the website now, where you can tap it.*

## Step 2: A site built around how detailing customers decide

Someone choosing a detailer wants three answers fast. What does it cost, is this guy any good, and how do I book? The new site answers all three above the fold, then backs them up.

- **Real starting prices, published.** Interior detailing from $200, exterior from $150, paint correction from $300, ceramic coating from $600, headlight restoration from $100, ozone odor treatment from $80. These come from Levi's own price list. We removed every invented number from the design draft instead of letting placeholder pricing go live.
- **Proof you can drag.** Interactive before-and-after sliders using real customer vehicles, plus a gallery of recent projects.
- **Reviews front and center.** Verbatim customer reviews and the live 5.0 rating, not a paraphrased testimonial block.
- **Six dedicated service pages**, each with what's included, the starting price, real job photos, and its own FAQ.

We also positioned A-1 the way Levi actually works: premium detailing by appointment at his Pleasant Hill location. Every line of copy, schema, and metadata says the same thing, because inconsistent descriptions confuse both customers and search engines.

![The new before-and-after page on A-1 Auto Detailing's website, with a drag slider comparing a dirty and a cleaned Honda Pilot cabin](/images/case-studies/a1/before-after-slider.jpg)

*Nothing sells detailing like a dirty floor mat turning into a clean one. Every photo is a real customer's car.*

## Step 3: SEO that doesn't throw away what already ranked

A redesign is the most common way small businesses lose their Google rankings. Old URLs die, the links pointing at them break, and years of search history vanish overnight.

So before launch we mapped every old URL, about 56 of them, and set up a permanent 301 redirect from each one to the most relevant new page. Anything Google or a customer had bookmarked still lands somewhere useful.

On top of that foundation:

- **Titles and headings that match real searches.** We ran a search sweep of what actually ranks in the Des Moines metro and paired "auto detailing," "car detailing," and "ceramic coating" with "Pleasant Hill" and "Des Moines" in titles and H1s.
- **Clean URLs and one canonical domain.** Every page resolves to a single address on www.a-1autodetailing.net, with no duplicate versions for Google to split its attention across.
- **Structured data on every page.** Local business schema with the address, hours, phone, services, prices, and rating, plus FAQ schema that mirrors the questions visible on the page.
- **Speed.** The site is fully static HTML. In our audit the largest content on the page loaded in roughly 0.3 to 0.8 seconds.
- **Guides that answer the questions people search.** Four guides, including what detailing costs, how often to detail a car, and paint correction versus ceramic coating. These are the searches that come before "book now," and they give Google more reasons to send people to A-1.

Instead of 56 thin pages, the site now has 18 pages that each have a real reason to exist.

## Step 4: A booking flow that turns visits into appointments

Traffic only matters if it becomes appointments. We built the site so booking is never more than one tap away.

- A quote request form in the hero and again at the bottom of the home page, asking only for what Levi needs: name, phone, vehicle, service, and notes.
- Every "book this" button on a service card pre-selects that service in the form, so the customer doesn't have to pick it twice.
- Tap-to-call phone links on every page for the customers who would rather just talk.
- Requests go straight to Levi. We're connecting instant text alerts so every new request buzzes his phone the moment it comes in.

No account to create, no long intake form, and the same few fields on every device.

## Step 5: Setting A-1 up to be recommended by AI

This is the part most local businesses don't know about yet.

According to [BrightLocal's 2026 Local Consumer Review Survey](https://www.brightlocal.com/research/local-consumer-review-survey/), 45% of consumers now use ChatGPT or other AI tools for local business recommendations, up from 6% a year earlier. When someone asks an AI "who's the best detailer near Pleasant Hill," the AI doesn't browse like a person. It reads pages quickly, pulls out direct statements it can quote, and cross-checks what other sites say about the business.

So we built A-1's site to be easy for AI to read and easy to quote:

- **A direct answer at the top of every service page and guide.** The price, the time it takes, and what's included, stated plainly in the first few lines, so an AI can lift a complete, accurate answer.
- **Question-style headings and visible FAQs** that match the FAQ schema word for word.
- **AI search crawlers explicitly allowed.** The site's robots.txt welcomes Googlebot, Bingbot, OpenAI's OAI-SearchBot, Claude-SearchBot, PerplexityBot, and Applebot. [OpenAI's own documentation](https://developers.openai.com/api/docs/bots) says sites that block OAI-SearchBot won't be shown in ChatGPT search answers.
- **An llms.txt file** that summarizes the business, its services, prices, and pages in plain language for AI systems that use it.
- **Entity links that confirm who A-1 is.** The schema connects the website to A-1's Google Business Profile, Yelp, Facebook, BBB, Nextdoor, and Greater Des Moines Partnership listings, so AI tools see one consistent business everywhere they look.
- **Instant indexing on Bing.** We added IndexNow, which pushes new and updated pages to Bing, the index behind Microsoft Copilot.

The finished site scored a perfect 100/100 on its SEO audit, with every major search and AI crawler able to reach and read every page.

## What's next for A-1

The rebuild is the foundation. What comes next:

- **Town-specific pages, done properly.** Instead of cloning copy across 42 city pages like the old site did, we'll add pages for the towns A-1 serves once each one has its own real photos and reviews to back it up.
- **Video.** Short walkthroughs of real jobs on the service pages.
- **Measurement.** We'll track rankings, calls, and quote requests, and update this post with real numbers once there's enough data to be honest about.

## What this means for your business

Most local businesses in Iowa are in A-1's old position: great work, happy customers, and a website that doesn't show either one to Google or to AI. The fix isn't more pages. It's the right pages, built so both search engines and AI assistants can understand exactly who you are, what you do, and what it costs.

If you run a detailing shop, see how we approach [websites for auto detailing businesses](/solutions/auto-detailing). For any other local business, our [pricing is published](/pricing), or you can [book a call](/book) and we'll look at where your site stands today.
