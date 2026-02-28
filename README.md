# TerminalVibes

**Your terminal just got a soundtrack.**

TerminalVibes watches your terminal output in real time and plays meme sounds the moment something interesting happens — errors, test failures, successful builds, deploys, and more. Includes the iconic **faah** sound, vine boom, emotional damage, and 40+ other meme sound effects.

---

## Features

- **8 built-in sound categories** — Error, Test Pass, Test Fail, Build OK, Build Fail, Deploy, Warning, Process Ready
- **44 bundled meme sounds** — ships with the extension, no internet required
- **Custom categories** — create your own with a step-by-step wizard (name → icon → keywords → sound)
- **Per-category control** — toggle, change sounds, or load your own audio file (`.mp3`, `.wav`, `.ogg`, `.flac`)
- **Smart cooldown** — prevents sound spam when output floods the terminal
- **Status bar indicator** — live active count, click to open the category picker
- **Cross-platform** — macOS, Windows, and Linux

---

## Quick Start

1. Install **TerminalVibes** from the VS Code Marketplace
2. Open any terminal — matching output triggers sounds automatically
3. Click the status bar item (`🔊 All active`) to configure categories

---

## Category Picker

Click the status bar item to open the picker:

- Toggle individual categories on or off
- Change the sound for any category (from built-in library or a local file)
- Edit trigger keywords
- Create custom categories
- Enable All / Disable All

---

## Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `soundOnError.enabled` | boolean | `true` | Master toggle — silences everything at once |
| `soundOnError.cooldown` | number | `3000` | Minimum ms between any two sounds |
| `soundOnError.volume` | number | `1.0` | Volume (0.1–1.0). Effective on macOS only |
| `soundOnError.categories` | object | `{}` | Per-category overrides (managed via the picker) |
| `soundOnError.userCategories` | array | `[]` | User-created custom categories |

> Tip: Configure everything through the status bar picker — no need to edit JSON directly.

---

## Commands

| Command | Description |
|---|---|
| `TerminalVibes: Toggle On/Off` | Master mute / unmute |
| `TerminalVibes: Sound Categories` | Open the category picker |
| `TerminalVibes: Set Custom Sound File` | Browse for a custom audio file |
| `TerminalVibes: Test Current Sound` | Preview the active sound |
| `TerminalVibes: Reset All Category Keywords to Default` | Restore default keyword lists |

---

## Requirements

- VS Code **1.93+**
- **macOS** — `afplay` (built-in)
- **Windows** — PowerShell (built-in)
- **Linux** — `paplay`, `aplay`, or `ffplay` (at least one required)

---

## License

MIT © 2026 [ThiruvarankanM](https://github.com/ThiruvarankanM/Terminal-Vibes)
