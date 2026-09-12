# Silicon Dispatch

## Live news setup

The site automatically asks `/api/news` for fresh GPU, CPU, and AI-hardware coverage every five minutes. The included Vercel serverless route calls NewsAPI securely, so the provider key never reaches the browser.

> **Before a public launch:** NewsAPI's free Developer plan is limited to development and testing. Use a production-licensed NewsAPI plan or replace `api/news.js` with another provider that permits public production use.

1. Create a NewsAPI key at [newsapi.org](https://newsapi.org/).
2. In Vercel, add an environment variable named `NEWS_API_KEY` with that key.
3. Deploy this folder to Vercel. The `api/news.js` route is picked up automatically.

When opened as a static HTML file or without a key, the page keeps working with a clearly labelled demo feed. Public readers can use the topic chips, headline search, or **Refresh the briefing** to find and update stories.
