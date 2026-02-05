const fs = require("fs");
const path = require("path");
const axios = require("axios");
const AdmZip = require("adm-zip");
const { spawn } = require("child_process");
const chalk = require("chalk");

// TEMP DIRECTORY
const TEMP_DIR = path.join(__dirname, ".guruh-temp");

// GIT CONFIG
const DOWNLOAD_URL = "https://github.com/itsguruu/GURUH/archive/refs/heads/main.zip";
const EXTRACT_DIR = path.join(TEMP_DIR, "GURUH-main");
const LOCAL_SETTINGS = path.join(__dirname, "config.js");
const EXTRACTED_SETTINGS = path.join(EXTRACT_DIR, "config.js");

// HELPERS
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// MAIN LOGIC ── DOWNLOAD + EXTRACT
async function downloadAndExtract() {
  try {
    if (fs.existsSync(TEMP_DIR)) {
      console.log(chalk.yellow("Cleaning cache..."));
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    fs.mkdirSync(TEMP_DIR, { recursive: true });

    const zipPath = path.join(TEMP_DIR, "guruh.zip");
    console.log(chalk.blue("Downloading repo..."));

    const response = await axios({
      url: DOWNLOAD_URL,
      method: "GET",
      responseType: "stream",
      timeout: 60000,
    });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(chalk.green("Download complete."));

    const zip = new AdmZip(zipPath);
    zip.extractAllTo(TEMP_DIR, true);
    console.log(chalk.green("Extraction complete."));

    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  } catch (err) {
    console.error(chalk.red("Download/Extract failed:"), err.message);
    throw err;
  }
}

// APPLY LOCAL CONFIG
async function applyLocalSettings() {
  if (!fs.existsSync(LOCAL_SETTINGS)) {
    console.log(chalk.yellow("No local config.js → skipping."));
    return;
  }

  try {
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });
    fs.copyFileSync(LOCAL_SETTINGS, EXTRACTED_SETTINGS);
    console.log(chalk.green("Local config applied."));
  } catch (err) {
    console.error(chalk.red("Config apply failed:"), err.message);
  }

  await delay(400);
}

// START BOT
function startBot() {
  console.log(chalk.cyan("Launching bot..."));

  if (!fs.existsSync(EXTRACT_DIR)) {
    console.error(chalk.red("Extracted folder missing."));
    return;
  }

  const original = path.join(EXTRACT_DIR, "index.js");
  const cjsEntry = path.join(EXTRACT_DIR, "index.cjs");

  if (!fs.existsSync(original)) {
    console.error(chalk.red("index.js not found in downloaded repo."));
    return;
  }

  // Only rename the entry point
  fs.renameSync(original, cjsEntry);
  console.log(chalk.yellow("Entry point renamed to index.cjs"));

  // Give Node a moment for GC
  setTimeout(() => {
    const bot = spawn("node", [cjsEntry], {
      cwd: EXTRACT_DIR,
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    });

    bot.on("close", (code) => {
      console.log(chalk.red(`Bot exited with code ${code}`));
      process.exit(code);  // <--- CRITICAL: downloader dies here → frees memory
    });

    bot.on("error", (err) => {
      console.error(chalk.red("Spawn failed:"), err.message);
      process.exit(1);
    });
  }, 500);
}

// RUN EVERYTHING
(async () => {
  try {
    await downloadAndExtract();
    await applyLocalSettings();
    startBot();
  } catch (err) {
    console.error(chalk.red("Fatal error:"), err.message);
    process.exit(1);
  }
})();
