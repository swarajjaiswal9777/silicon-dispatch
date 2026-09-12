const themeButton = document.querySelector('.theme-toggle');
const form = document.querySelector('.signup-form');
const toast = document.querySelector('.toast');
const menuButton = document.querySelector('.menu-button');
const refreshButton = document.querySelector('#refresh-feed');
const feedStatus = document.querySelector('#feed-status');
const leadStory = document.querySelector('#lead-story');
const searchInput = document.querySelector('#headline-search');
const searchStatus = document.querySelector('#search-status');
const clearSearchButton = document.querySelector('#clear-search');
let currentTopic = 'all';
let latestStories = [];
let usingDemoFeed = true;

const fallbackStories = [
  { title: 'Nvidia’s next flagship is about more than frame rates', description: 'The Blackwell successor brings more memory, smarter scheduling, and a new ceiling for creators.', source: 'Silicon Dispatch', publishedAt: new Date().toISOString(), category: 'GPU', url: '#' },
  { title: 'TSMC lifts its outlook as advanced-node demand refuses to cool', description: 'Foundry demand remains the crucial signal in the semiconductor cycle.', source: 'Silicon Dispatch', publishedAt: new Date(Date.now() - 3600000).toISOString(), category: 'Markets', url: '#' },
  { title: 'AMD’s desktop roadmap has a new name—and a very clear target', description: 'A closer look at the next generation of desktop performance.', source: 'Silicon Dispatch', publishedAt: new Date(Date.now() - 7200000).toISOString(), category: 'CPU', url: '#' },
  { title: 'Custom silicon is becoming cloud computing’s secret weapon', description: 'The real race in AI hardware has moved to the data center.', source: 'Silicon Dispatch', publishedAt: new Date(Date.now() - 10800000).toISOString(), category: 'AI & Data', url: '#' },
  { title: 'The $20 billion question: can Intel’s foundry bet still pay off?', description: 'The industry is watching its turnaround strategy with unusual attention.', source: 'Silicon Dispatch', publishedAt: new Date(Date.now() - 14400000).toISOString(), category: 'Analysis', url: '#' },
  { title: 'Zen 6 isn’t chasing clocks. It’s changing the rules around them.', description: 'Architecture, efficiency, and software now matter as much as raw speed.', source: 'Silicon Dispatch', publishedAt: new Date(Date.now() - 18000000).toISOString(), category: 'CPU', url: '#' },
  { title: 'The real race in AI hardware has moved to the data center', description: 'Inference workloads are reshaping how chips are designed and bought.', source: 'Silicon Dispatch', publishedAt: new Date(Date.now() - 21600000).toISOString(), category: 'AI & Data', url: '#' },
];

function minutesSince(date) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(date)) / 60000));
  return minutes < 60 ? `${minutes} MIN AGO` : `${Math.floor(minutes / 60)}H AGO`;
}
function readTime(story) { return `${Math.max(3, Math.min(10, Math.ceil((story.description || story.title).length / 35)))} MIN READ`; }
function setText(id, value) { const node = document.querySelector(`#${id}`); if (node) node.textContent = value; }

function renderFeed(stories, cached = false) {
  const sourceItems = stories.length ? stories : fallbackStories;
  const items = Array.from({ length: 7 }, (_, index) => sourceItems[index] || sourceItems[index % sourceItems.length]);
  const lead = items[0];
  setText('lead-category', lead.category || 'HARDWARE');
  setText('lead-reading-time', readTime(lead));
  setText('lead-title', lead.title);
  setText('lead-description', lead.description || 'Read the latest reporting from the world of hardware.');
  setText('lead-source', `${lead.source || 'Silicon Dispatch'} · ${minutesSince(lead.publishedAt)}`);
  setText('lead-avatar', (lead.source || 'SD').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'SD');
  document.querySelector('#lead-link').href = lead.url || '#';
  document.querySelector('#lead-title').href = lead.url || '#';
  items.slice(1, 4).forEach((story, index) => {
    setText(`brief-${index + 1}`, story.title);
    document.querySelector(`#brief-${index + 1}`).href = story.url || '#';
  });
  items.slice(4, 7).forEach((story, index) => {
    const number = index + 1;
    setText(`card-${number}-category`, story.category || 'HARDWARE');
    setText(`card-${number}-time`, readTime(story));
    setText(`card-${number}-title`, story.title);
    setText(`card-${number}-source`, `${story.source || 'Silicon Dispatch'} · ${minutesSince(story.publishedAt)}`);
    document.querySelector(`#card-${number}-title`).href = story.url || '#';
  });
  const ticker = document.querySelector('#news-ticker');
  ticker.replaceChildren(...[...items, ...items].map((story) => {
    const item = document.createElement('span');
    const arrow = document.createElement('b');
    item.append(document.createTextNode(`${story.title} `), arrow);
    arrow.textContent = '↗';
    return item;
  }));
  setText('story-count', items.length);
  setText('updated-at', new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date()));
  feedStatus.textContent = cached ? 'DEMO FEED' : 'LIVE NOW';
}

function applySearch() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    renderFeed(latestStories, usingDemoFeed);
    searchStatus.textContent = 'Latest hardware headlines, refreshed automatically.';
    return;
  }
  const matches = latestStories.filter((story) => `${story.title} ${story.description || ''} ${story.source || ''} ${story.category || ''}`.toLowerCase().includes(query));
  if (!matches.length) {
    searchStatus.textContent = `No stories match “${searchInput.value.trim()}”. Try GPU, CPU, AMD, Intel, Nvidia, or AI.`;
    return;
  }
  renderFeed(matches, usingDemoFeed);
  searchStatus.textContent = `${matches.length} matching ${matches.length === 1 ? 'story' : 'stories'}.`;
}

async function loadNews(topic = currentTopic) {
  currentTopic = topic;
  leadStory.classList.add('is-loading');
  refreshButton.disabled = true;
  feedStatus.textContent = 'UPDATING';
  try {
    const response = await fetch(`/api/news?topic=${encodeURIComponent(topic)}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Feed unavailable');
    const payload = await response.json();
    latestStories = payload.articles;
    usingDemoFeed = false;
  } catch (error) {
    latestStories = fallbackStories;
    usingDemoFeed = true;
  } finally {
    applySearch();
    leadStory.classList.remove('is-loading');
    refreshButton.disabled = false;
  }
}

themeButton.addEventListener('click', () => { document.body.classList.toggle('dark'); themeButton.textContent = document.body.classList.contains('dark') ? '☀' : '◐'; });
form.addEventListener('submit', (event) => { event.preventDefault(); toast.classList.add('show'); form.reset(); window.setTimeout(() => toast.classList.remove('show'), 3600); });
menuButton.addEventListener('click', () => { const nav = document.querySelector('nav'); nav.classList.toggle('open'); if (nav.classList.contains('open')) Object.assign(nav.style, { display: 'flex', position: 'absolute', top: '75px', left: '0', right: '0', padding: '18px 20px', background: 'var(--paper)', borderBottom: '1px solid var(--rule)', zIndex: '5', justifyContent: 'space-around' }); else nav.removeAttribute('style'); });
refreshButton.addEventListener('click', () => loadNews());
document.querySelectorAll('.topic-button').forEach((button) => button.addEventListener('click', () => { document.querySelector('.topic-button.active').classList.remove('active'); button.classList.add('active'); loadNews(button.dataset.topic); }));
searchInput.addEventListener('input', applySearch);
clearSearchButton.addEventListener('click', () => { searchInput.value = ''; searchInput.focus(); applySearch(); });
searchInput.addEventListener('keydown', (event) => { if (event.key === 'Escape') { searchInput.value = ''; applySearch(); } });
loadNews();
window.setInterval(() => loadNews(), 5 * 60 * 1000);
