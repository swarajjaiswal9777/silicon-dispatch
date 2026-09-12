const CACHE_MS = 2 * 60 * 1000;
let cached = { key: '', expires: 0, payload: null };

const queries = {
  all: '(GPU OR CPU OR semiconductor OR "AI chip")',
  gpu: '(GPU OR Nvidia OR Radeon OR GeForce)',
  cpu: '(CPU OR processor OR Ryzen OR Intel)',
  ai: '("AI chip" OR accelerator OR inference OR datacenter)',
};

function classify(title = '') {
  const text = title.toLowerCase();
  if (/gpu|nvidia|geforce|radeon|graphics/.test(text)) return 'GPU';
  if (/cpu|processor|ryzen|intel core|xeon/.test(text)) return 'CPU';
  if (/ai|inference|accelerator|datacenter/.test(text)) return 'AI & Data';
  return 'Hardware';
}

export default async function handler(req, res) {
  const topic = typeof req.query.topic === 'string' && queries[req.query.topic] ? req.query.topic : 'all';
  const now = Date.now();
  if (cached.key === topic && cached.expires > now) return res.status(200).json({ ...cached.payload, cached: true });

  if (!process.env.NEWS_API_KEY) return res.status(503).json({ error: 'NEWS_API_KEY is not configured.' });

  const params = new URLSearchParams({ q: queries[topic], searchIn: 'title,description', language: 'en', sortBy: 'publishedAt', pageSize: '10' });
  try {
    const response = await fetch(`https://newsapi.org/v2/everything?${params}`, { headers: { 'X-Api-Key': process.env.NEWS_API_KEY } });
    const data = await response.json();
    if (!response.ok || data.status !== 'ok') throw new Error(data.message || 'News provider request failed');
    const payload = { articles: data.articles.filter((article) => article.title && article.url).map((article) => ({ title: article.title.replace(/\s*-\s*[^-]+$/, ''), description: article.description || '', source: article.source?.name || 'News source', publishedAt: article.publishedAt, url: article.url, image: article.urlToImage || null, category: classify(article.title) })), updatedAt: new Date().toISOString() };
    cached = { key: topic, expires: now + CACHE_MS, payload };
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({ error: 'Unable to retrieve the news feed.', detail: error.message });
  }
}
