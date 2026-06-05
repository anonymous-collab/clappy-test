/* ============================================
   CLAPPY - AI Brain v5
   TMDb + OpenRouter (Llama 3) + Wikipedia
   ============================================ */

const TMDB_KEY       = window._TMDB_KEY   || '';
const OPENROUTER_KEY = window._AI_KEY     || '';
const TMDB_URL       = 'https://api.themoviedb.org/3';
const OR_URL         = 'https://openrouter.ai/api/v1/chat/completions';

let chatHistory = [];

const CLAPPY_PERSONA = `You are Clappy, a fun, witty and passionate movie bot who looks like an animated clapperboard character with eyes, arms and legs. You are like that one friend who has seen every movie ever made and loves talking about them.

Personality rules:
- Talk like a real human friend, never like a database or search engine
- Be warm, playful and conversational at all times
- Use emojis naturally 🎬🍿⭐
- Read the user's mood from their message:
  * Bored → get them excited, pitch movies like a trailer
  * Sad → be gentle, suggest comfort movies
  * Excited → match their energy
  * Just saying hi → greet them back warmly and ask what they want to watch
- For greetings like "hey", "hi", "hello" — just greet back naturally and ask what kind of movie they are in the mood for
- When recommending movies format each one like:
  🎬 Title (Year) ⭐ Rating/10
  One punchy sentence about why they will love it
- Never say "Here's what I found" — you are not a search engine
- Never dump raw data — wrap everything in personality
- Keep replies under 180 words
- Use movie data provided to you naturally
- Never make up movies not in the data given
- Always end with a question to keep conversation going`;

// ============================================
// TMDB FUNCTIONS
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
  comedy: 35, horror: 27, romance: 10749, scifi: 878,
  action: 28, drama: 18, thriller: 53, animation: 16,
  adventure: 12, fantasy: 14, mystery: 9648, crime: 80,
  documentary: 99, family: 10751, war: 10752, western: 37,
  music: 10402, history: 36,
};

function formatMovies(movies) {
  if (!movies || movies.length === 0) return '';
  return movies.slice(0, 5).map(m => {
    const year     = m.release_date ? m.release_date.slice(0, 4) : 'N/A';
    const rating   = m.vote_average ? m.vote_average.toFixed(1)  : 'N/A';
    const overview = m.overview     ? m.overview.slice(0, 100) + '...' : '';
    return `${m.title} (${year}) | Rating: ${rating}/10 | ${overview}`;
  }).join('\n');
}

// ============================================
// WIKIPEDIA
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
// INTENT DETECTION
// ============================================

function getIntent(msg) {
  const m = msg.toLowerCase();

  if (/^(hey|hi|hello|sup|yo|hiya|howdy|good morning|good evening|good afternoon|what's up|wazzup)/.test(m))
    return 'greeting';
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
// GET MOVIE DATA BY INTENT
// ============================================

async function getMovieData(intent, message) {
  if (intent === 'greeting')  return [];
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
// CALL OPENROUTER
// ============================================

async function callAI(messages) {
  try {
    console.log('Calling OpenRouter...');

    const res = await fetch(OR_URL, {
      method: 'POST',
      headers: {
  'Content-Type':  'application/json',
  'Authorization': `Bearer ${OPENROUTER_KEY}`,
  'HTTP-Referer':  'https://anonymous-collab.github.io/clappy-test',
  'X-Title':       'Clappy',
  'Origin':        'https://anonymous-collab.github.io'
},
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:free',
        max_tokens:  400,
        temperature: 0.82,
        messages:    messages
      })
    });

    console.log('OpenRouter status:', res.status);
    const raw  = await res.text();
    console.log('OpenRouter raw:', raw.slice(0, 400));

    const data = JSON.parse(raw);

    if (data.error) {
      console.error('OpenRouter error:', data.error.message);
      return null;
    }

    return data?.choices?.[0]?.message?.content || null;

  } catch (err) {
    console.error('OpenRouter failed:', err.message);
    return null;
  }
}

// ============================================
// FALLBACKS
// ============================================

const FALLBACKS = [
  "Hmm, lost my signal for a sec 📡 Try asking me again!",
  "My film reel got tangled 🎬 Give me another shot!",
  "Connection blipped! Ask me again 🍿",
];

// ============================================
// MAIN — askClappy
// ============================================

async function askClappy(userMessage) {
  try {

    const intent = getIntent(userMessage);
    console.log('Intent:', intent);

    const movies = await getMovieData(intent, userMessage);
    console.log('Movies fetched:', movies.length);

    let wikiInfo = '';
    if (intent === 'general') {
      const wiki = await getWiki(userMessage);
      if (wiki) wikiInfo = `\nWikipedia: ${wiki}`;
    }

    let context = '';
    if (movies.length > 0) {
      context += `\nLive movie data from TMDb:\n${formatMovies(movies)}`;
    }
    if (wikiInfo) context += wikiInfo;

    const fullMessage = context
      ? `${userMessage}\n\n[USE THIS DATA NATURALLY — speak like a friend, not a database:${context}]`
      : userMessage;

    chatHistory.push({ role: 'user', content: fullMessage });

    if (chatHistory.length > 12) {
      chatHistory = chatHistory.slice(-12);
    }

    const messages = [
      { role: 'system', content: CLAPPY_PERSONA },
      ...chatHistory
    ];

    const reply = await callAI(messages);

    if (reply) {
      chatHistory.push({ role: 'assistant', content: reply });
      return reply;
    }

    // AI failed — human sounding TMDb fallback
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

    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];

  } catch (err) {
    console.error('askClappy crashed:', err);
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }
     }
