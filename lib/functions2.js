const fs = require('fs');
const axios = require('axios');
const path = './config.env';
const FormData = require("form-data");

// empiretourl (upload)
async function empiretourl(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);

  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));
  form.append("originalFileName", filePath.split(/[\\/]/).pop());

  try {
    const response = await axios.post(
      "https://api-rebix.zone.id/api/upload",
      form,
      {
        headers: { ...form.getHeaders() },
        timeout: 60000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (!response.data || !response.data.status) {
      throw new Error(`Upload failed: ${JSON.stringify(response.data)}`);
    }

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') throw new Error('Upload timed out');
    if (error.response) throw new Error(`API Error ${error.response.status}`);
    if (error.request) throw new Error('No response from server');
    throw error;
  }
}

// getBuffer, getGroupAdmins, h2k, isUrl, Json, runtime, sleep, fetchJson, saveConfig
// ... (copy them from your current file - they are fine)

// FIXED getRandom
const getRandom = (ext = '') => {
  return `\( {Math.floor(Math.random() * 1000000)} \){ext ? `.${ext}` : ''}`;
};

// Your extra utilities (formatJid, cleanNumber, isOwner, capitalize, etc.)
// ... keep them as they are

module.exports = {
  empiretourl,
  getBuffer,
  getGroupAdmins,
  getRandom,       // ← now fixed
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson,
  saveConfig,
  formatJid,
  cleanNumber,
  isOwner,
  capitalize,
  truncate,
  randomColor,
  formatBytes,
  randomDelay,
  isEmojiOnly,
  getCurrentTime,
  isRateLimited
  // add any other exports you have
};
