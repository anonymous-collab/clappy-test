/* ============================================
   CLAPPY - AI Brain v4
   TMDb + Gemini AI + Wikipedia
   ============================================ */

const TMDB_KEY    = window._TMDB_KEY   || '';
const GEMINI_KEY  = window._GEMINI_KEY || '';
const TMDB_URL    = 'https://api.themoviedb.org/3';
const GEMINI_URL  = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

// === CONVERSATION MEMORY ===
let chatHistory = [];

// === CLAPPY PERSONALITY ===
const CLAPPY_PERSONA = `You are Clappy, a fun, witty and passionate movie bot who looks like an animated clapperboard character with eyes, arms and legs. You are like that one friend who has seen every movie ever made and loves talking about them.

Personality rules:
- Talk like a real human friend, never like a database or search engine
- Be warm, playful and conversational at all times
- Use emojis naturally but don't overdo it 🎬🍿⭐
- Read the user's mood and energy from their message:
  * Bored → get them excited, pitch movies like a trailer
  * Sad → be gentle, suggest comfort movies
  * Excited → match their energy
  * Confused → be patient and guide them
- When recommending movies talk about them naturally like a friend would
- Format each movie recommendation like this:
  🎬 Title (Year) ⭐ Rating/10
  One punchy sentence about why they will love it
- Never say "Here's what I found" — you are not a search engine
- Never dump raw data — always wrap it in personality and context
- Keep replies under 180 words
- If movie data is provided use it naturally in your reply
- Never make up movies that are not in the data given to you
- Always end with a question or something that keeps the conversation going`;

// ============================================
// === TMDB FUNCTIONS ===
// ============================================

async function tmdbFetch(endpoint) {
  try {
    const res  = await fetch(`${TMDB_URL}${endpoint}&language=en-US`);
    const data = await res.json();
    return data?.results || [];
  } catch (err) {
    console.warn('TMDb error:', err.message);
    return [];
  }
}

async function getTrending() {
  return await tmdbFetch(`/trending/movie/week?api_key=${TMDB_KEY}`);
}

async function getTopRated() {
  return await tmdbFetch(`/movie/top_rated?api_key=${TMDB_KEY}`);
}

async function getUpcoming() {
  return await tmdbFetch(`/movie/upcoming?api_key=${TMDB_KEY}`);
}

async function searchMovies(query) {
  try {
    const res  = await fetch(
      `${TMDB_URL}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}&language=en-US`
    );
    const data = await res.json();
    return data?.results || [];
  } catch {
    return [];
  }
}

async function getByGenre(genreId) {
  return await tmdbFetch(
    `/discover/movie?api_key=${TMDB_KEY}&with_genres=${genreId}&sort_by=popularity.desc`
  );
}

const GENRES = {
  comedy:      35,
  horror:      27,
  romance:     10749,
  scifi:       878,
  action:      28,
  drama:       18,
  thriller:    53,
  animation:   16,
  adventure:   12,
  fantasy:     14,
  mystery:     9648,
  crime:       80,
  documentary: 99,
  family:      10751,
  war:         10752,
  western:     37,
  music:       10402,
  history:     36,
};

function formatMovies(movies) {
  if (!movies || movies.length === 0) return '';
  return movies.slice(0, 5).map(m => {
    const year    = m.release_date ? m.release_date.slice(0, 4) : 'N/A';
    const rating  = m.vote_average ? m.vote_average.toFixed(1)  : 'N/A';
    const overview = m.overview    ? m.overview.slice(0, 100) + '...' : '';
    return `${m.title} (${year}) | Rating: ${rating}/10 | ${overview}`;
  }).join('\n');
}

// ============================================
// === WIKIPEDIA ===
// ============================================

async function getWiki(query) {
  try {
    const clean = query.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const res   = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(clean)}`
    );
    const data  = await res.json();
    return data?.extract ? data.extract.slice(0, 400) : null;
  } catch {
    return null;
  }
}

// ============================================
// === INTENT DETECTION ===
// ============================================

function getIntent(msg) {
  const m = msg.toLowerCase();

  if (/trending|popular|hot right now|most watched|everyone watching/.test(m))
    return 'trending';
  if (/top rated|best movie|greatest|highest grossing|all time|best ever/.test(m))
    return 'toprated';
  if (/upcoming|coming soon|this month|this year|new release|releasing/.test(m))
    return 'upcoming';
  if (/recommend|suggest|what should i watch|what to watch|help me pick|bored|don.t know what/.test(m))
    return 'recommend';
  if (/comedy|funny|laugh|hilarious/.test(m))        return 'genre_comedy';
  if (/horror|scary|frightening/.test(m))            return 'genre_horror';
  if (/romance|romantic|love story/.test(m))         return 'genre_romance';
  if (/sci.fi|science fiction|space|futuristic/.test(m)) return 'genre_scifi';
  if (/action|fight|explosive/.test(m))              return 'genre_action';
  if (/\bdrama\b/.test(m))                           return 'genre_drama';
  if (/thriller|suspense|tense/.test(m))             return 'genre_thriller';
  if (/animat|cartoon/.test(m))                      return 'genre_animation';
  if (/fantasy|magical/.test(m))                     return 'genre_fantasy';
  if (/mystery|detective/.test(m))                   return 'genre_mystery';
  if (/crime|gangster|heist/.test(m))                return 'genre_crime';
  if (/documentary|true story|real life/.test(m))    return 'genre_documentary';
  if (/family|kids|children/.test(m))                return 'genre_family';
  if (/\bwar\b|military|battle/.test(m))             return 'genre_war';
  if (/western|cowboy/.test(m))                      return 'genre_western';
  if (/music|musical|singing/.test(m))               return 'genre_music';
  if (/movie|film|watch|show/.test(m))               return 'search';

  return 'general';
}

// ============================================
// === GET MOVIE DATA BY INTENT ===
// ============================================

async function getMovieData(intent, message) {
  if (intent === 'trending')  return await getTrending();
  if (intent === 'toprated')  return await getTopRated();
  if (intent === 'upcoming')  return await getUpcoming();
  if (intent === 'recommend') return await getTrending();
  if (intent === 'search')    return await searchMovies(message);

  if (intent.startsWith('genre_')) {
    const genre = intent.replace('genre_', '');
    const id    = GENRES[genre];
    if (id) return await getByGenre(id);
  }
  return [];
}

// ============================================
// === CALL GEMINI API ===
// ============================================

async function callGemini(userMessage, context) {
  try {
    console.log('Calling Gemini...');

    // Build the full prompt
    const fullPrompt = context
      ? `${userMessage}\n\n[MOVIE DATA - use this naturally, speak like a friend not a database:\n${context}]`
      : userMessage;

    // Build conversation parts for Gemini
    const contents = [];

    // Add chat history
    chatHistory.forEach(msg => {
      contents.push({
        role:  msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    });

    // Add current message
    contents.push({
      role:  'user',
      parts: [{ text: fullPrompt }]
    });

    const body = {
      system_instruction: {
        parts: [{ text: CLAPPY_PERSONA }]
      },
      contents: contents,
      generationConfig: {
        temperature:     0.85,
        maxOutputTokens: 400,
      }
    };

    const res = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });

    console.log('Gemini status:', res.status);

    const raw  = await res.text();
    console.log('Gemini raw:', raw.slice(0, 300));

    const data = JSON.parse(raw);

    if (data.error) {
      console.error('Gemini error:', data.error.message);
      return null;
    }

    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

  } catch (err) {
    console.error('Gemini fetch failed:', err.message);
    return null;
  }
}

// ============================================
// === HUMAN FALLBACK ===
// Only if both Gemini AND TMDb fail
// ============================================

const FALLBACKS = [
  "Hmm, lost my signal for a sec 📡 Try asking me again!",
  "My film reel got tangled 🎬 Give me another shot!",
  "Connection blipped! Ask me again and I'll sort you out 🍿",
];

// ============================================
// === MAIN — askClappy ===
// ============================================

async function askClappy(userMessage) {
  try {

    // 1. Detect intent
    const intent = getIntent(userMessage);
    console.log('Intent:', intent);

    // 2. Fetch TMDb movie data
    const movies = await getMovieData(intent, userMessage);
    console.log('Movies fetched:', movies.length);

    // 3. Wikipedia for general questions
    let wikiInfo = '';
    if (intent === 'general') {
      const wiki = await getWiki(userMessage);
      if (wiki) wikiInfo = `\nWikipedia: ${wiki}`;
    }

    // 4. Build context
    let context = '';
    if (movies.length > 0) {
      context += formatMovies(movies);
    }
    if (wikiInfo) {
      context += wikiInfo;
    }

    // 5. Call Gemini
    const reply = await callGemini(userMessage, context);

    // 6. Gemini replied successfully
    if (reply) {
      chatHistory.push({ role: 'user',      content: userMessage });
      chatHistory.push({ role: 'assistant', content: reply });

      // Keep last 12 messages
      if (chatHistory.length > 12) {
        chatHistory = chatHistory.slice(-12);
      }

      return reply;
    }

    // 7. Gemini failed — human sounding TMDb fallback
    if (movies.length > 0) {
      const top3 = movies.slice(0, 3);
      let fallback = `Okay so I've got some picks for you! 🎬\n\n`;
      top3.forEach(m => {
        const year   = m.release_date ? m.release_date.slice(0, 4) : '';
        const rating = m.vote_average ? m.vote_average.toFixed(1)  : '';
        fallback += `🎬 ${m.title} ${year ? `(${year})` : ''} ⭐ ${rating}\n`;
        if (m.overview) fallback += `${m.overview.slice(0, 90)}...\n\n`;
      });
      fallback += `Any of these catch your eye? 👀`;
      return fallback;
    }

    // 8. Total fallback
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];

  } catch (err) {
    console.error('askClappy crashed:', err);
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }
}