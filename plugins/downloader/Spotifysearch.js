const fetch = require("node-fetch");
const { cmd } = require("../command");

cmd({
  pattern: "spotifysearch",
  alias: ["spotifysrch", "spsearch"],
  desc: "Search for Spotify tracks using a query.",
  react: '✅',
  category: 'tools',
  filename: __filename
}, async (conn, m, store, {
  from,
  args,
  reply
}) => {
  if (!args[0]) {
    return reply("🌸 What do you want to search on Spotify?\n\n*Usage Example:*\n.spotifysearch <query>");
  }

  const query = args.join(" ");
  await store.react('⌛');

  try {
    reply(`🔎 Searching Spotify for: *${query}*`);

    const response = await fetch(`https://apis-keith.vercel.app/search/spotify?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!data || !data.status || !data.result || data.result.length === 0) {
      await store.react('❌');
      return reply("❌ No results found for your query. Please try with a different keyword.");
    }

    // Get up to 7 random results
    const results = data.result.slice(0, 7).sort(() => Math.random() - 0.5);

    for (const track of results) {
      const message = `🎶 *Spotify Track Result*:\n\n`
        + `*• Title*: ${track.title}\n`
        + `*• Artist*: ${track.artist}\n`
        + `*• Album*: ${track.album}\n`
        + `*• Duration*: ${track.duration.formatted}\n`
        + `*• Release Date*: ${track.releaseDate}\n`
        + `*• URL*: ${track.url}\n`;

      reply(message);
    }

    await store.react('✅');
  } catch (error) {
    console.error("Error in SpotifySearch command:", error);
    await store.react('❌');
    reply("❌ An error occurred while searching Spotify. Please try again later.");
  }
});
