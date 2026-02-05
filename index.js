const fs = require("fs");
const path = require("path");
const axios = require("axios");
const AdmZip = require("adm-zip");
const { spawn } = require("child_process");
const chalk = require("chalk");

// TEMP DIR
const TEMP = path.join(__dirname, ".tmp");

// CONFIG - CHANGE THIS IF THE REPO MOVED
const ZIP_URL = "https://github.com/itsguruu/GURUH/archive/refs/heads/main.zip";
const EXTRACT = path.join(TEMP, "GURUH-main");
const LOCAL_CFG = path.join(__dirname, "config.js");
const TARGET_CFG = path.join(EXTRACT, "config.js");

// HELPERS
const wait = ms => new Promise(r => setTimeout(r, ms));

// FETCH + EXTRACT WITH FULL ERROR HANDLING
async function fetchRepo() {
  try {
    if (fs.existsSync(TEMP)) {
      console.log(chalk.yellow("Cleaning cache..."));
      fs.rmSync(TEMP, { recursive: true, force: true });
    }

    fs.mkdirSync(TEMP, { recursive: true });

    const zipFile = path.join(TEMP, "repo.zip");
    console.log(chalk.blue("Downloading repo..."));

    const response = await axios({
      url: ZIP_URL,
      method: "GET",
      responseType: "arraybuffer", // safer than stream for error detection
      timeout: 60000,
      validateStatus: status => status < 500, // accept 4xx to log them
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText || 'Unknown error'}`);
    }

    fs.writeFileSync(zipFile, response.data);
    console.log(chalk.green("Download complete."));

    const zip = new AdmZip(zipFile);
    zip.extractAllTo(TEMP, true);
    console.log(chalk.green("Extraction complete."));

    fs.unlinkSync(zipFile);
  } catch (err) {
    console.error(chalk.red("Fetch failed:"), err.message);
    if (err.response) {
      console.error("HTTP status:", err.response.status);
      console.error("Response data:", err.response.data?.toString?.() || err.response.data);
    }
    process.exit(1);
  }
}

// MAKE COMMONJS + SPAWN
function launch() {
  if (!fs.existsSync(EXTRACT)) {
    console.error(chalk.red("No extracted folder."));
    process.exit(1);
  }

  // Remove "type": "module"
  const pkg = path.join(EXTRACT, "package.json");
  if (fs.existsSync(pkg)) {
    let data = JSON.parse(fs.readFileSync(pkg, "utf8"));
    if (data.type === "module") {
      delete data.type;
      fs.writeFileSync(pkg, JSON.stringify(data, null, 2));
      console.log(chalk.yellow("Removed type:module"));
    }
  }

  // Rename only entry point
  const original = path.join(EXTRACT, "index.js");
  const cjsEntry = path.join(EXTRACT, "index.cjs");

  if (fs.existsSync(original)) {
    fs.renameSync(original, cjsEntry);
    console.log(chalk.yellow("Renamed entry to .cjs"));
  } else {
    console.error(chalk.red("No index.js found."));
    process.exit(1);
  }

  // Apply config
  if (fs.existsSync(LOCAL_CFG)) {
    fs.copyFileSync(LOCAL_CFG, TARGET_CFG);
    console.log(chalk.green("Config applied"));
  }

  console.log(chalk.cyan("Spawning bot..."));

  const child = spawn("node", [cjsEntry], {
    cwd: EXTRACT,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" }
  });

  child.on("close", code => {
    console.log(`Bot exited with code ${code}`);
    process.exit(code); // downloader exits — frees memory
  });

  child.on("error", e => {
    console.error("Spawn failed:", e.message);
    process.exit(1);
  });
}

// RUN
(async () => {
  await fetchRepo();
  launch();
})();
