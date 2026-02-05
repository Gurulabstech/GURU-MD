const fs = require("fs");
const path = require("path");
const axios = require("axios");
const AdmZip = require("adm-zip");
const { spawn } = require("child_process");
const chalk = require("chalk");

// === TEMP DIRECTORY (much safer & simpler than 50 nested folders) ===
const TEMP_DIR = path.join(__dirname, ".guruh-temp");

// === GIT CONFIG ===
const DOWNLOAD_URL = "https://github.com/itsguruu/GURUH/archive/refs/heads/main.zip";
const EXTRACT_DIR = path.join(TEMP_DIR, "GURUH-main");
const LOCAL_SETTINGS = path.join(__dirname, "config.js");
const EXTRACTED_SETTINGS = path.join(EXTRACT_DIR, "config.js");

// === HELPERS ===
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// === MAIN LOGIC ===
async function downloadAndExtract() {
  try {
    // Clean previous installation if exists
    if (fs.existsSync(TEMP_DIR)) {
      console.log(chalk.yellow("🧹 Cleaning previous cache..."));
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    fs.mkdirSync(TEMP_DIR, { recursive: true });

    const zipPath = path.join(TEMP_DIR, "guruh.zip");
    console.log(chalk.blue("⬇️ Downloading GURU MD PREMIUM from GitHub..."));

    const response = await axios({
      url: DOWNLOAD_URL,
      method: "GET",
      responseType: "stream",
      timeout: 60000, // 60 seconds timeout
    });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(chalk.green("📦 ZIP download complete."));

    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(TEMP_DIR, /* overwrite */ true);
      console.log(chalk.green("📂 Extraction completed."));
    } catch (extractErr) {
      console.error(chalk.red("❌ Failed to extract ZIP:"), extractErr);
      throw extractErr;
    } finally {
      // Always clean zip file
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }
    }

    const pluginFolder = path.join(EXTRACT_DIR, "plugins");
    if (fs.existsSync(pluginFolder)) {
      console.log(chalk.green("✅ Plugins folder found."));
    } else {
      console.log(chalk.yellow("⚠️  Plugins folder not found in extracted archive."));
    }
  } catch (err) {
    console.error(chalk.red("❌ Download/Extract failed:"), err.message);
    throw err;
  }
}

async function applyLocalSettings() {
  if (!fs.existsSync(LOCAL_SETTINGS)) {
    console.log(chalk.yellow("⚠️ No local config.js found → skipping custom settings."));
    return;
  }

  try {
    // Make sure target directory exists
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });
    fs.copyFileSync(LOCAL_SETTINGS, EXTRACTED_SETTINGS);
    console.log(chalk.green("🛠️ Local config.js successfully applied (overwritten)."));
  } catch (err) {
    console.error(chalk.red("❌ Failed to apply local config.js:"), err.message);
  }

  await delay(400);
}

function startBot() {
  console.log(chalk.cyan("🚀 Launching GURU MD WhatsApp Bot..."));

  if (!fs.existsSync(EXTRACT_DIR)) {
    console.error(chalk.red("❌ Extracted directory not found. Cannot start bot."));
    return;
  }

  const entryPoint = path.join(EXTRACT_DIR, "index.js");

  if (!fs.existsSync(entryPoint)) {
    console.error(chalk.red("❌ index.js not found in extracted directory."));
    console.error(chalk.dim(`   Expected path: ${entryPoint}`));
    return;
  }

  const bot = spawn("node", [entryPoint], {
    cwd: EXTRACT_DIR,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  });

  bot.on("close", (code) => {
    console.log(chalk.red(`💥 Bot process terminated with exit code: ${code}`));
  });

  bot.on("error", (err) => {
    console.error(chalk.red("❌ Failed to spawn bot process:"), err.message);
  });
}

// === RUN ===
(async () => {
  try {
    await downloadAndExtract();
    await applyLocalSettings();
    startBot();
  } catch (err) {
    console.error(chalk.red("❌ Fatal error in main execution:"), err.message);
    process.exitCode = 1;
  }
})();
