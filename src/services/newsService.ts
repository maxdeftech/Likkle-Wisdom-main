export interface JamaicaNewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  publishedAt?: string;
  category?: string;
  provider: 'NewsData' | 'NewsAPI' | 'GNews' | 'Currents' | 'Mediastack';
}

const DEFAULT_NEWSDATA_KEYS = ['pub_0cf0dc182a3a4ff3955c8d389ed6ecb6'];

const splitKeys = (value?: string) => (
  value?.split(',').map(key => key.trim()).filter(Boolean) ?? []
);

const getEnv = () => ((import.meta as any).env ?? {}) as Record<string, string | undefined>;

const getNewsDataKeys = () => {
  const env = getEnv();
  const keys = splitKeys(env.VITE_NEWSDATA_API_KEYS || env.VITE_NEWSDATA_API_KEY);
  return keys.length ? keys : DEFAULT_NEWSDATA_KEYS;
};

const getNewsApiKeys = () => {
  const env = getEnv();
  return splitKeys(env.VITE_NEWSAPI_API_KEYS || env.VITE_NEWSAPI_API_KEY);
};

const getGNewsKeys = () => {
  const env = getEnv();
  return splitKeys(env.VITE_GNEWS_API_KEYS || env.VITE_GNEWS_API_KEY);
};

const getCurrentsKeys = () => {
  const env = getEnv();
  return splitKeys(env.VITE_CURRENTS_API_KEYS || env.VITE_CURRENTS_API_KEY);
};

const getMediastackKeys = () => {
  const env = getEnv();
  return splitKeys(env.VITE_MEDIASTACK_API_KEYS || env.VITE_MEDIASTACK_API_KEY);
};

const withTimeout = async (url: string, init: RequestInit = {}, timeoutMs = 12000) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`News request failed with ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
};

const buildNewsDataUrls = (apiKey: string) => [
  new URLSearchParams({
    apikey: apiKey,
    q: 'jamaica',
    country: 'jm',
    language: 'en,es,fr',
    category: 'breaking,crime,entertainment,health,politics',
  }),
  new URLSearchParams({
    apikey: apiKey,
    qInTitle: 'jamaica',
    country: 'jm,gb,us,ca,mx',
    language: 'en,es,fr',
    category: 'breaking,crime,entertainment,health,politics',
  }),
  new URLSearchParams({
    apikey: apiKey,
    q: 'jamaican',
    country: 'jm,gb,us,ca,mx',
    language: 'en,es,fr',
    category: 'breaking,crime,entertainment,health,politics',
  }),
  new URLSearchParams({
    apikey: apiKey,
    q: 'jamaica tourism OR jamaica hotel OR jamaica resort',
    country: 'jm,gb,us,ca,mx',
    language: 'en,es,fr',
    category: 'business,top,entertainment',
  }),
].map(params => `https://newsdata.io/api/1/latest?${params.toString()}`);

const buildNewsApiUrls = (apiKey: string) => [
  'Jamaica OR Jamaican',
  'Jamaica hotel OR Jamaica resort OR Jamaica tourism',
].map(query => {
  const params = new URLSearchParams({
    q: query,
    language: 'en',
    sortBy: 'publishedAt',
    pageSize: '20',
    apiKey,
  });
  return `https://newsapi.org/v2/everything?${params.toString()}`;
});

const buildGNewsUrls = (apiKey: string) => [
  'Jamaica OR Jamaican',
  '"Jamaica hotel" OR "Jamaica resort" OR "Jamaica tourism"',
].map(query => {
  const params = new URLSearchParams({
    q: query,
    lang: 'en',
    max: '10',
    apikey: apiKey,
  });
  return `https://gnews.io/api/v4/search?${params.toString()}`;
});

const buildCurrentsUrls = () => [
  'Jamaica Jamaican',
  'Jamaica hotel resort tourism',
].map(keywords => {
  const params = new URLSearchParams({
    keywords,
    language: 'en',
  });
  return `https://api.currentsapi.services/v1/search?${params.toString()}`;
});

const buildMediastackUrls = (apiKey: string) => [
  'jamaica,jamaican',
  'jamaica hotel,jamaica resort,jamaica tourism',
].map(keywords => {
  const params = new URLSearchParams({
    access_key: apiKey,
    keywords,
    countries: 'jm,us,gb,ca',
    languages: 'en',
    limit: '20',
    sort: 'published_desc',
  });
  return `https://api.mediastack.com/v1/news?${params.toString()}`;
});

const articleKey = (article: Pick<JamaicaNewsArticle, 'title' | 'url'>) => (
  `${article.title.trim().toLowerCase()}|${article.url.trim().toLowerCase()}`
);

const isJamaicaRelated = (item: any) => {
  const countries = Array.isArray(item?.country) ? item.country.join(' ') : item?.country || '';
  const text = [
    item?.title,
    item?.description,
    item?.content,
    item?.source_name,
    item?.source?.name,
    countries,
  ].filter(Boolean).join(' ').toLowerCase();
  return /\bjamaica\b|\bjamaican\b/.test(text);
};

const inferCategory = (value?: string) => {
  const text = (value || '').toLowerCase();
  if (/hotel|resort|tourism|tourist|travel|visitor|hospitality|villa|airbnb/.test(text)) return 'hotels tourism';
  if (/crime|police|court|murder|shooting|robbery|arrest|gang/.test(text)) return 'crime';
  if (/politic|government|parliament|minister|election|policy/.test(text)) return 'politics';
  if (/health|hospital|doctor|disease|medical/.test(text)) return 'health';
  if (/entertainment|music|dancehall|reggae|film|festival|artist/.test(text)) return 'entertainment';
  return undefined;
};

const normalizeNewsData = (data: any): JamaicaNewsArticle[] => (
  Array.isArray(data?.results) ? data.results : []
).filter((item: any) => item?.title && item?.link && isJamaicaRelated(item)).map((item: any, index: number) => ({
  id: item.article_id || `newsdata-${index}-${item.link}`,
  title: item.title,
  description: item.description || item.content || 'Open the story for full details.',
  url: item.link,
  imageUrl: item.image_url || undefined,
  source: item.source_name || 'NewsData',
  publishedAt: item.pubDate || undefined,
  category: inferCategory(`${item.title} ${item.description} ${item.content}`) || (Array.isArray(item.category) ? item.category.join(', ') : item.category),
  provider: 'NewsData',
}));

const normalizeNewsApi = (data: any): JamaicaNewsArticle[] => (
  Array.isArray(data?.articles) ? data.articles : []
).filter((item: any) => item?.title && item?.url && isJamaicaRelated(item)).map((item: any, index: number) => ({
  id: `newsapi-${index}-${item.url}`,
  title: item.title,
  description: item.description || item.content || 'Open the story for full details.',
  url: item.url,
  imageUrl: item.urlToImage || undefined,
  source: item.source?.name || 'NewsAPI',
  publishedAt: item.publishedAt || undefined,
  category: inferCategory(`${item.title} ${item.description} ${item.content}`),
  provider: 'NewsAPI',
}));

const normalizeGNews = (data: any): JamaicaNewsArticle[] => (
  Array.isArray(data?.articles) ? data.articles : []
).filter((item: any) => item?.title && item?.url && isJamaicaRelated(item)).map((item: any, index: number) => ({
  id: `gnews-${index}-${item.url}`,
  title: item.title,
  description: item.description || item.content || 'Open the story for full details.',
  url: item.url,
  imageUrl: item.image || undefined,
  source: item.source?.name || 'GNews',
  publishedAt: item.publishedAt || undefined,
  category: inferCategory(`${item.title} ${item.description} ${item.content}`),
  provider: 'GNews',
}));

const normalizeCurrents = (data: any): JamaicaNewsArticle[] => (
  Array.isArray(data?.news) ? data.news : []
).filter((item: any) => item?.title && item?.url && isJamaicaRelated(item)).map((item: any, index: number) => ({
  id: item.id || `currents-${index}-${item.url}`,
  title: item.title,
  description: item.description || 'Open the story for full details.',
  url: item.url,
  imageUrl: item.image && item.image !== 'None' ? item.image : undefined,
  source: item.author || 'Currents',
  publishedAt: item.published || undefined,
  category: inferCategory(`${item.title} ${item.description} ${(item.category || []).join(' ')}`) || (Array.isArray(item.category) ? item.category.join(', ') : item.category),
  provider: 'Currents',
}));

const normalizeMediastack = (data: any): JamaicaNewsArticle[] => (
  Array.isArray(data?.data) ? data.data : []
).filter((item: any) => item?.title && item?.url && isJamaicaRelated(item)).map((item: any, index: number) => ({
  id: `mediastack-${index}-${item.url}`,
  title: item.title,
  description: item.description || 'Open the story for full details.',
  url: item.url,
  imageUrl: item.image || undefined,
  source: item.source || 'Mediastack',
  publishedAt: item.published_at || undefined,
  category: inferCategory(`${item.title} ${item.description} ${item.category}`) || item.category,
  provider: 'Mediastack',
}));

const fetchNewsData = async () => {
  const errors: unknown[] = [];
  for (const key of getNewsDataKeys()) {
    try {
      const results = await Promise.allSettled(buildNewsDataUrls(key).map(url => withTimeout(url)));
      return results.flatMap(result => result.status === 'fulfilled' ? normalizeNewsData(result.value) : []);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) throw errors[errors.length - 1];
  return [];
};

const fetchNewsApi = async () => {
  const keys = getNewsApiKeys();
  if (!keys.length) return [];
  for (const key of keys) {
    try {
      const results = await Promise.allSettled(buildNewsApiUrls(key).map(url => withTimeout(url)));
      return results.flatMap(result => result.status === 'fulfilled' ? normalizeNewsApi(result.value) : []);
    } catch (error) {
      console.warn('NewsAPI fetch failed', error);
    }
  }
  return [];
};

const fetchGNews = async () => {
  const keys = getGNewsKeys();
  if (!keys.length) return [];
  for (const key of keys) {
    try {
      const results = await Promise.allSettled(buildGNewsUrls(key).map(url => withTimeout(url)));
      return results.flatMap(result => result.status === 'fulfilled' ? normalizeGNews(result.value) : []);
    } catch (error) {
      console.warn('GNews fetch failed', error);
    }
  }
  return [];
};

const fetchCurrents = async () => {
  const keys = getCurrentsKeys();
  if (!keys.length) return [];
  for (const key of keys) {
    try {
      const results = await Promise.allSettled(buildCurrentsUrls().map(url => withTimeout(url, { headers: { Authorization: key } })));
      return results.flatMap(result => result.status === 'fulfilled' ? normalizeCurrents(result.value) : []);
    } catch (error) {
      console.warn('Currents fetch failed', error);
    }
  }
  return [];
};

const fetchMediastack = async () => {
  const keys = getMediastackKeys();
  if (!keys.length) return [];
  for (const key of keys) {
    try {
      const results = await Promise.allSettled(buildMediastackUrls(key).map(url => withTimeout(url)));
      return results.flatMap(result => result.status === 'fulfilled' ? normalizeMediastack(result.value) : []);
    } catch (error) {
      console.warn('Mediastack fetch failed', error);
    }
  }
  return [];
};

export const fetchJamaicaNews = async (): Promise<JamaicaNewsArticle[]> => {
  const results = await Promise.allSettled([fetchNewsData(), fetchNewsApi(), fetchGNews(), fetchCurrents(), fetchMediastack()]);
  const articles = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  const unique = new Map<string, JamaicaNewsArticle>();
  articles.forEach(article => {
    unique.set(articleKey(article), article);
  });
  return [...unique.values()].sort((a, b) => (
    new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
  ));
};
