const axios = require('axios');

// ────────────────────────────────────────────────
// Fetch buffer from URL - improved timeout + better error logging
const getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'get',
      url,
      responseType: 'arraybuffer',
      timeout: 30000,                // added reasonable timeout (30s)
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'DNT': 1,
        'Upgrade-Insecure-Requests': 1,
        ...options.headers,
      },
      ...options,
    });
    return res.data;
  } catch (e) {
    console.error(`[getBuffer] Failed for ${url}:`, e.message);
    if (e.response) {
      console.error(`Status: ${e.response.status}, Data:`, e.response.data);
    }
    return null;   // return null instead of undefined → safer for callers
  }
};

// ────────────────────────────────────────────────
// Get group admins - safer & more readable
const getGroupAdmins = (participants = []) => {
  return (participants || [])
    .filter(p => p?.admin !== null)
    .map(p => p.id);
};

// ────────────────────────────────────────────────
// Random filename - improved randomness + safer extension handling
const getRandom = (ext = '') => {
  // Use more bits of randomness + pad to 6 digits
  const randomNum = Math.floor(Math.random() * 999999) + 1;
  const numStr = String(randomNum).padStart(6, '0');
  return ext ? `\( {numStr}. \){ext.replace(/^\./, '')}` : numStr;
};

// ────────────────────────────────────────────────
// Human-readable numbers - fixed variable name + safer handling
const h2k = (eco) => {
  if (typeof eco !== 'number' || isNaN(eco) || eco < 1000) return String(eco);

  const lyrik = ['', 'K', 'M', 'B', 'T', 'P', 'E'];
  const ma = Math.floor(Math.log10(Math.abs(eco)) / 3);
  if (ma === 0) return String(eco);

  const ppo = lyrik[ma] || '';
  const scale = Math.pow(10, ma * 3);
  const scaled = eco / scale;
  let formatt = scaled.toFixed(1);

  if (/\.0$/.test(formatt)) {
    formatt = formatt.replace(/\.0$/, '');
  }

  return formatt + ppo;
};

// ────────────────────────────────────────────────
// URL validation - more robust regex + strict check
const isUrl = (url) => {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ────────────────────────────────────────────────
// Pretty JSON - safe stringify
const Json = (string) => {
  try {
    return JSON.stringify(string, null, 2);
  } catch {
    return String(string);
  }
};

// ────────────────────────────────────────────────
// Runtime formatter - more compact & accurate
const runtime = (seconds = 0) => {
  seconds = Math.floor(Number(seconds) || 0);
  const d = Math.floor(seconds / 86400); seconds %= 86400;
  const h = Math.floor(seconds / 3600);  seconds %= 3600;
  const m = Math.floor(seconds / 60);   seconds %= 60;
  const s = seconds;

  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);

  return parts.join(' ');
};

// ────────────────────────────────────────────────
// Sleep - safer ms check
const sleep = async (ms) => {
  ms = Number(ms) || 0;
  if (ms <= 0) return;
  return new Promise(resolve => setTimeout(resolve, ms));
};

// ────────────────────────────────────────────────
// Fetch JSON - improved timeout + better error handling
const fetchJson = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      timeout: 20000,   // 20s timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...options.headers,
      },
      ...options,
    });
    return res.data;
  } catch (err) {
    console.error(`[fetchJson] Failed for ${url}:`, err.message);
    return null;   // return null instead of error object → safer
  }
};

module.exports = {
  getBuffer,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson
};
