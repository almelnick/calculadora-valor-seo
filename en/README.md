# SEO Value Calculator

Free, open source tool to project **what a website's organic channel is worth**: visits,
orders or leads and the monthly value in three scenarios, plus the equivalent cost of
buying that same result in Google Ads.

**Try it live:** [alanmelnick.com/seo-tool-en](https://www.alanmelnick.com/seo-tool-en) ·
[Versión en español](../README.md)

## What it calculates

```
Search volume × CTR by position × AI Overviews adjustment × conversion rate × value
= SEO value / month
```

- **Two modes**: ecommerce (orders × average order value) and leads/services (leads × lead value).
- **Incremental mode**: if you already rank, it values only the traffic gained from moving
  up — not the whole channel. That's the difference between selling hype and an honest projection.
- **AI Overviews adjustment**: configurable discount (−15% to −40%) based on your keyword
  mix, because organic CTR drops on searches with an AI answer.
- **Three scenarios**: conservative (−40%), base and optimistic (+40%).
- **Ramp-up**: 12-month cumulative assuming the channel reaches 100% of its value in
  month 9 (linear ramp).
- **Equivalent Ads cost**: visits × CPC (ecommerce) or leads × CPL (services) —
  the replacement value of organic.
- **Share**: copy the projection as text or as a URL with the parameters included.

All amounts are in **USD**.

## Usage

It's a static site with no dependencies and no build step: open `en/index.html` in your
browser, or serve the `en/` folder with any static host (Vercel, Netlify, GitHub Pages).

```bash
git clone https://github.com/almelnick/calculadora-valor-seo.git
cd calculadora-valor-seo/en
open index.html
```

The `en/` folder is self-contained, so you can copy it into its own repository or deploy it on its own.

## Structure

| File | What it does |
|---|---|
| `index.html` | Full page: form + results panel |
| `app.js` | Pure logic (`calculateSEO`) + DOM wiring, vanilla JS |
| `styles.css` | Design tokens + styles, native CSS with no frameworks |

The calculation logic (`calculateSEO`) is decoupled from the DOM: you can import or copy
it to use the projection elsewhere.

## Assumptions and honesty

CTR by position comes from public industry curves (position 1 ≈ 27%, position 2 ≈ 15%,
etc.) and these are averages: your SERP may differ. The estimate is for reference only and
**is not a guarantee of results** — the full disclaimer is in the tool itself. If you want
the projection with your real data (Search Console, GA4, your Ads account),
[book a free diagnostic](https://www.alanmelnick.com/diagnostico).

## Author

**[Alan Melnick](https://www.alanmelnick.com)** — digital marketing consultant:
SEO, Google Ads, Meta Ads and growth marketing.
[LinkedIn](https://www.linkedin.com/in/almelnick/)

## License

[MIT](../LICENSE) — use it, modify it and share it freely. If you use it on your site,
a mention with a link is welcome.
