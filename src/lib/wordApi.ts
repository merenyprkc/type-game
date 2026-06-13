// src/lib/wordApi.ts
// Word and content fetching from various public APIs

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'tr' | 'en';
export type GameMode = 'time' | 'words' | 'quote' | 'code' | 'practice' | 'custom';

// ─── English Words via Datamuse API ───────────────────────────────────────────

const DATAMUSE_BASE = 'https://api.datamuse.com/words';


async function fetchEnglishWords(count: number, difficulty: Difficulty): Promise<string[]> {
  // Datamuse: fetch common English words, filter by length and frequency in JS
  const lengthRange: Record<Difficulty, [number, number]> = {
    easy:   [3, 5],
    medium: [4, 8],
    hard:   [7, 14],
  };
  const [minLen, maxLen] = lengthRange[difficulty];

  // Different topics for different difficulties
  const queries = difficulty === 'easy'
    ? ['common', 'home', 'food', 'daily']
    : difficulty === 'medium'
    ? ['work', 'science', 'nature', 'society']
    : ['literature', 'philosophy', 'technology'];

  try {
    const results = await Promise.all(
      queries.map(async topic => {
        const params = new URLSearchParams({ ml: topic, md: 'f', max: '100' });
        const resp = await fetch(`${DATAMUSE_BASE}?${params}`, {
          signal: AbortSignal.timeout(5000),
        });
        return resp.json() as Promise<Array<{ word: string; tags?: string[] }>>;
      })
    );

    const all = results.flat();
    const filtered = all
      .filter(w => {
        const len = w.word.length;
        if (len < minLen || len > maxLen) return false;
        if (!/^[a-z]+$/.test(w.word)) return false;
        return true;
      })
      .map(w => w.word.toLowerCase());

    const unique = [...new Set(filtered)];
    if (unique.length >= count) {
      return shuffleArray(unique).slice(0, count);
    }
  } catch {
    // fall through to static fallback
  }

  return getFallbackEnglish(count, difficulty);
}

// ─── Turkish Words via azer/most-common-turkish-words (GitHub) ──────────────

const TR_WORDS_URL =
  'https://raw.githubusercontent.com/azer/most-common-turkish-words/master/index.js';

let trWordCache: string[] | null = null;

async function loadTurkishWordPool(): Promise<string[]> {
  if (trWordCache) return trWordCache;
  try {
    const resp = await fetch(TR_WORDS_URL, { signal: AbortSignal.timeout(6000) });
    const text = await resp.text();
    const matches = text.match(/"([^"]+)"/g);
    if (matches && matches.length > 100) {
      trWordCache = matches
        .map(w => w.slice(1, -1))
        .filter(w => /^[a-züğışöçÜĞİŞÖÇ]+$/i.test(w)); // no spaces or punctuation
      return trWordCache;
    }
  } catch { /* fall through */ }
  return TR_FALLBACK;
}

async function fetchTurkishWords(count: number, difficulty: Difficulty): Promise<string[]> {
  const pool = await loadTurkishWordPool();

  const lengthRange: Record<Difficulty, [number, number]> = {
    easy:   [2, 5],
    medium: [4, 9],
    hard:   [7, 20],
  };
  const [minLen, maxLen] = lengthRange[difficulty];

  const filtered = pool.filter(w => w.length >= minLen && w.length <= maxLen);
  if (filtered.length >= count) {
    return shuffleArray(filtered).slice(0, count);
  }
  return shuffleArray([...TR_FALLBACK]).slice(0, count);
}

// Static fallback (used only when fetch fails)
const TR_FALLBACK = [
  'bir', 'bu', 'için', 'ben', 'çok', 'var', 'ile', 'ama', 'ne', 'her',
  'yıl', 'gün', 'yer', 'yol', 'su', 'ev', 'iş', 'el', 'göz', 'baş',
  'zaman', 'sonra', 'kadar', 'kendi', 'insan', 'değil', 'daha', 'gibi',
  'anne', 'baba', 'okul', 'kitap', 'masa', 'kapı', 'şehir', 'deniz',
  'dağ', 'ağaç', 'çiçek', 'köpek', 'kedi', 'araba', 'yemek', 'ekmek',
  'mavi', 'kırmızı', 'yeşil', 'sarı', 'siyah', 'beyaz', 'büyük', 'küçük',
  'yeni', 'eski', 'iyi', 'kötü', 'sıcak', 'soğuk', 'hızlı', 'yavaş',
  'bilgi', 'eğitim', 'kültür', 'sanat', 'müzik', 'tarih', 'ekonomi',
  'başarı', 'yetenek', 'beceri', 'kariyer', 'proje', 'strateji', 'hedef',
  'sürdürülebilirlik', 'küreselleşme', 'demokratikleşme', 'farkındalık',
  'karmaşıklık', 'yaratıcılık', 'yenilikçilik', 'verimlilik', 'özgünlük',
];

// ─── Quotes via Quotable API ─────────────────────────────────────────────────

interface QuotableResponse {
  _id: string;
  content: string;
  author: string;
  length: number;
}

export interface Quote {
  text: string;
  author: string;
}

export async function fetchQuote(language: Language = 'en'): Promise<Quote> {
  if (language === 'tr') {
    return getRandomTurkishQuote();
  }

  // Try ZenQuotes API (CORS-friendly, no cert issues)
  try {
    const resp = await fetch('https://zenquotes.io/api/random', { signal: AbortSignal.timeout(4000) });
    const data: Array<{ q: string; a: string }> = await resp.json();
    if (data && data[0] && data[0].q.length >= 60) {
      return { text: data[0].q, author: data[0].a };
    }
  } catch { /* next fallback */ }

  // Try quotable.io as secondary
  try {
    const resp = await fetch('https://api.quotable.io/quotes/random?minLength=80&maxLength=250', {
      signal: AbortSignal.timeout(4000),
    });
    const data: QuotableResponse[] = await resp.json();
    if (data && data[0]) {
      return { text: data[0].content, author: data[0].author };
    }
  } catch { /* fallback below */ }

  // Fallback to curated English quotes
  return getRandomEnglishQuote();
}

// Curated Turkish quotes
const TURKISH_QUOTES: Quote[] = [
  { text: "Bir millet eğitim ordusuna sahip olmadıkça muharebe meydanlarında ne kadar parlak zaferler elde ederse etsin, o zaferlerin kalıcı sonuçlar vermesi sınırlı kalır.", author: "Mustafa Kemal Atatürk" },
  { text: "Hayatta en hakiki mürşit ilimdir.", author: "Mustafa Kemal Atatürk" },
  { text: "Dünyayı bir kitap gibi düşünürsek, seyahat etmeyenler sadece bir sayfayı okumuş gibidir.", author: "Aziz Augustinus" },
  { text: "Bir insanı gerçekten tanımak istiyorsanız, ona bir az güç verin.", author: "Abraham Lincoln" },
  { text: "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.", author: "Robert Collier" },
  { text: "En büyük zafer, asla düşmemek değil, her düştüğümüzde kalkmaktır.", author: "Konfüçyüs" },
  { text: "Kendini bilen, başkalarını da anlar. Kendini yenen, başkalarını da yenebilir.", author: "Lao Tzu" },
  { text: "Bir kitap bin arkadaşa bedeldir.", author: "Türk Atasözü" },
  { text: "Okumak, insanı dolu bir adam; müzakere, hazır bir adam; yazmak ise doğru bir adam yapar.", author: "Francis Bacon" },
  { text: "Zaman, sonsuz bir deniz gibidir. Onun içinde ne kadar derin dalarsan o kadar çok şey öğrenirsin.", author: "Mevlana" },
  { text: "İnsan, umudunu yitirdiğinde her şeyini yitirmiş demektir. Umut, yaşamın en büyük gücüdür.", author: "Cemil Meriç" },
  { text: "Bir dil bir insan, iki dil iki insan.", author: "Türk Atasözü" },
];

function getRandomTurkishQuote(): Quote {
  return TURKISH_QUOTES[Math.floor(Math.random() * TURKISH_QUOTES.length)];
}

// Curated English fallback quotes
const ENGLISH_QUOTES: Quote[] = [
  { text: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.", author: "Steve Jobs" },
  { text: "In the middle of every difficulty lies opportunity. The measure of intelligence is the ability to change.", author: "Albert Einstein" },
  { text: "It does not matter how slowly you go as long as you do not stop. Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
  { text: "The future belongs to those who believe in the beauty of their dreams. Life is what happens to you while you are busy making other plans.", author: "Eleanor Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts. Never, never, never give up.", author: "Winston Churchill" },
  { text: "Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.", author: "Robert Frost" },
  { text: "Whether you think you can or you think you can't, you're right. Believe you can and you're halfway there.", author: "Henry Ford" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today. Nothing is impossible, the word itself says I'm possible.", author: "Franklin D. Roosevelt" },
  { text: "Be yourself; everyone else is already taken. You've got to be odd to be number one. A person who never made a mistake never tried anything new.", author: "Oscar Wilde" },
  { text: "In three words I can sum up everything I've learned about life: it goes on. The woods are lovely, dark, and deep, but I have promises to keep.", author: "Robert Frost" },
];

function getRandomEnglishQuote(): Quote {
  return ENGLISH_QUOTES[Math.floor(Math.random() * ENGLISH_QUOTES.length)];
}

// ─── Code Snippets ────────────────────────────────────────────────────────────

export interface CodeSnippet {
  code: string;
  language: string;
}

const CODE_SNIPPETS: CodeSnippet[] = [
  {
    language: 'JavaScript',
    code: `function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}`,
  },
  {
    language: 'JavaScript',
    code: `const fetchData = async (url) => {\n  const response = await fetch(url);\n  const data = await response.json();\n  return data;\n};`,
  },
  {
    language: 'TypeScript',
    code: `interface User {\n  id: string;\n  name: string;\n  email: string;\n  createdAt: Date;\n}`,
  },
  {
    language: 'Python',
    code: `def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]`,
  },
  {
    language: 'JavaScript',
    code: `const debounce = (fn, delay) => {\n  let timeout;\n  return (...args) => {\n    clearTimeout(timeout);\n    timeout = setTimeout(() => fn(...args), delay);\n  };\n};`,
  },
  {
    language: 'TypeScript',
    code: `function mergeSort<T>(arr: T[]): T[] {\n  if (arr.length <= 1) return arr;\n  const mid = Math.floor(arr.length / 2);\n  const left = mergeSort(arr.slice(0, mid));\n  const right = mergeSort(arr.slice(mid));\n  return merge(left, right);\n}`,
  },
  {
    language: 'CSS',
    code: `.container {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 0 1rem;\n}`,
  },
];

export function getRandomCodeSnippet(): CodeSnippet {
  return CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function fetchWords(
  count: number,
  language: Language,
  difficulty: Difficulty
): Promise<string[]> {
  if (language === 'en') {
    return fetchEnglishWords(count, difficulty);
  } else {
    return fetchTurkishWords(count, difficulty);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getFallbackEnglish(count: number, difficulty: Difficulty): string[] {
  const fallbacks: Record<Difficulty, string[]> = {
    easy: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when'],
    medium: ['about', 'above', 'across', 'after', 'again', 'against', 'along', 'already', 'also', 'always', 'among', 'another', 'around', 'away', 'because', 'before', 'behind', 'below', 'between', 'beyond', 'during', 'every', 'example', 'follow', 'found', 'great', 'hand', 'here', 'high', 'home', 'house', 'into', 'just', 'keep', 'know', 'large', 'last', 'later', 'learn', 'leave', 'letter', 'level', 'light', 'like', 'likely', 'little', 'long', 'look', 'made', 'make'],
    hard: ['abbreviation', 'accomplish', 'acknowledge', 'acquisition', 'administration', 'advertisement', 'agricultural', 'approximately', 'architecture', 'arrangement', 'association', 'automatically', 'bibliography', 'characteristics', 'circumstances', 'classification', 'collaboration', 'commemoration', 'communication', 'comprehensive', 'concentration', 'configuration', 'consequences', 'construction', 'contemporary', 'contribution', 'controversial', 'conversation', 'corporation', 'corresponding'],
  };
  return shuffleArray(fallbacks[difficulty]).slice(0, count);
}
