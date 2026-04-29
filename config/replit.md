# GURU MD - WhatsApp Bot

## Overview

GURU MD is a feature-rich WhatsApp bot built on top of mainline `baileys` (the upstream WhiskeySockets/Baileys library, currently 7.0.0-rc.9 — migrated from the older `gifted-baileys` fork on 2026-04-25). It provides hundreds of commands across many plugins (downloaders, AI chat, anti-link, anti-delete, group management, sticker tools, status seen/react, etc.) and ships with a small Express-based web panel that lets the user paste a WhatsApp session ID to connect the bot.

## Tech Stack

- **Runtime**: Node.js 20
- **Entry point**: `index.cjs` (CommonJS)
- **Web framework**: Express (panel + status API on port 5000)
- **WhatsApp library**: `baileys` 7.0.0-rc.9 (mainline WhiskeySockets/Baileys; loaded from CommonJS via Node 20's `require(esm)` support)
- **Database**: Sequelize (SQLite by default at `./database.db`, optional Postgres via `DATABASE_URL`)
- **Plugins**: dropped-in JS files under `plugins/` that register commands via the global `cmd()` helper from `command.js`

## Project Layout

- `index.cjs` — main bot bootstrap, logging, web panel, plugin loader and Baileys connection
- `command.js` — exposes `global.cmd` and the prefix manager used by all plugins
- `config.js` — central config object (env var driven, with sensible defaults from `app.json`)
- `data/index.js` — message store / anti-delete settings / contacts / group metadata persistence (Sequelize models)
- `lib/` — shared helpers (database, anti-delete, group events, sticker utils, ffmpeg helpers, etc.)
- `plugins/` — individual command modules, auto-loaded at startup
- `sessions/` — persisted WhatsApp auth state (`creds.json` + key files)
- `app.json` — Heroku-style env var manifest, also used as the source of truth for config defaults

## Replit Setup

- A single workflow named **Start application** runs `node index.cjs` on port 5000 (webview output).
- Express binds to `0.0.0.0:5000` so the Replit preview proxy can reach it.
- Deployment is configured as **vm** (always-on) with `node index.cjs` so the WhatsApp socket stays connected.

### Files added during the Replit import

The original repository was missing two modules that `index.cjs` requires. Minimal, working implementations were created:

- `config.js` — env-driven config with defaults pulled from `app.json`
- `data/index.js` — Sequelize-backed implementations of `AntiDelDB`, `saveMessage`/`loadMessage`, `saveContact`/`getName`, `saveGroupMetadata`/`getGroupMetadata`, `saveMessageCount`/`getInactiveGroupMembers`/`getGroupMembersMessageCount`, plus the `setAnti`/`getAnti`/`getAllAntiDeleteSettings`/`initializeAntiDeleteSettings` helpers used by the anti-delete plugin

## Connecting the Bot

1. Open the web preview — the panel shows "Waiting for Session".
2. Generate a Baileys session ID (the panel links to `guru-pair.onrender.com`) and paste it into the input.
3. The server validates and writes `sessions/creds.json`, then auto-restarts to pick up the new credentials.

## Useful Env Vars

All keys are optional except `SESSION_ID` (which can also be supplied via the panel). See `app.json` and `config.js` for the full list. Common ones:

- `PREFIX` (default `.`), `MODE` (`public`/`private`/`inbox`/`group`)
- `OWNER_NAME`, `OWNER_NUMBER`, `BOT_NAME`
- `AUTO_STATUS_SEEN`, `AUTO_STATUS_REACT`, `AUTO_REACT`, `ALWAYS_ONLINE`
- `ANTI_LINK`, `ANTI_LINK_KICK`, `ANTI_BAD`, `ANTI_DEL_PATH`
- `DATABASE_URL` — set to a Postgres URL to use Postgres instead of the local SQLite file
