# TerminalVibes

> **Your terminal just got a soundtrack.**

TerminalVibes watches your terminal output in real time and plays fun meme sounds the moment something interesting happens — errors, test failures, successful builds, deploys, and more. Eight smart categories, 44 bundled sounds, and full customisation.

---

## ✨ Features

- **8 smart sound categories** — each monitors a distinct set of terminal events:

  | # | Category | Default Trigger Examples | Default Sound |
  |---|----------|--------------------------|---------------|
  | 1 | 🔴 Error | `fatal error:`, `segmentation fault`, `panic:` | `error-classic` |
  | 2 | ✅ Test Pass | `tests passed`, `all tests passed`, `ok ---` | `anime-wow` |
  | 3 | ❌ Test Fail | `assertion failed`, `test suite failed`, `FAILED` | `tf-nemesis` |
  | 4 | 🏗️ Build OK | `build successful`, `compiled successfully` | `indian-song` |
  | 5 | 💥 Build Fail | `build failed`, `compilation error`, `exited with code` | `sad-violin` |
  | 6 | 🚀 Deploy | `deployment complete`, `successfully deployed` | `mystery-sound` |
  | 7 | ⚠️ Warning | `deprecation warning`, `memory usage high` | `spongebob-fail` |
  | 8 | 🟢 Ready | `server listening`, `connected to`, `ready in` | `hub-intro` |

- **44 bundled meme sounds** — no internet needed, everything ships with the extension
- **Unlimited custom categories** — build your own with a 4-step wizard (name → icon → keywords → sound)
- **Per-category sound control** — pick a different sound per category from the built-in library or your own files (`.mp3`, `.wav`, `.ogg`, `.flac`)
- **Status bar indicator** — shows live active count (`8/8 active`), click to open the full picker
- **Cooldown guard** — prevents sound spam when output floods
- **Volume control** — works natively on macOS

---

## 🚀 Quick Start

1. Install **TerminalVibes** from the VS Code Marketplace
2. Open any terminal — any command that produces matching output triggers a sound automatically
3. Click the **`🔊 8/8 active`** status bar item to customise categories

---

## 🎛️ Status Bar Picker

```
Click  →  Category list
            ├─ 🔴 Error          → Toggle / Change sound / Use PC sound
            ├─ ✅ Test Pass       → Toggle / Change sound / Use PC sound
            ├─ ...
            ├─ ➕ Create new category  (4-step wizard)
            └─ ⏸️ Disable All / ▶️ Enable All
```

---

## 🎵 Bundled Sound Presets (sample)

| ID | Vibe |
|----|------|
| `error-classic` | Classic "faah" error |
| `sad-violin` | Sad trombone violin mash |
| `tf-nemesis` | Dramatic nemesis reveal |
| `anime-wow` | Anime crowd reaction |
| `indian-song` | Bollywood celebration |
| `mystery-sound` | Suspense sting |
| `hub-intro` | Discord-style ready chime |
| `spongebob-fail` | SpongeBob trombone |
| `dun-dun-dun` | Dramatic dun dun dun |
| `windows-error` | Windows XP alert |
| *(34 more…)* | |

---

## ⚙️ Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `soundOnError.enabled` | boolean | `true` | Master toggle — silences all categories at once |
| `soundOnError.cooldown` | number | `3000` | Minimum ms between any two sounds (prevents spam) |
| `soundOnError.volume` | number | `1.0` | Volume 0.1–1.0 (effective on macOS) |
| `soundOnError.categories` | object | `{}` | Per-category overrides (managed via the status bar picker) |
| `soundOnError.userCategories` | array | `[]` | User-created custom categories |

> **Tip:** Use the status bar picker to configure everything visually — no need to edit JSON directly.

---

## 💬 Commands

| Command | Description |
|---------|-------------|
| `TerminalVibes: Toggle On/Off` | Master mute / unmute |
| `TerminalVibes: Sound Categories` | Open the category picker |
| `TerminalVibes: Set Custom Sound File` | Browse for a custom audio file |
| `TerminalVibes: Test Current Sound` | Play the active sound immediately |
| `TerminalVibes: Reset All Category Keywords to Default` | Restore factory keyword lists |

---

## 🛠️ Requirements

- VS Code **1.93+** (Shell Integration API)
- **macOS**: `afplay` (built-in) — supports volume control
- **Windows**: PowerShell `SoundPlayer` (built-in)
- **Linux**: `paplay`, `aplay`, or `ffplay` (install via your package manager)

---

## 🤝 Contributing

Issues and PRs welcome at [GitHub](https://github.com/ThiruvarankanM/Code-with-Meme).

---

## 📝 License

MIT © 2026 ThiruvarankanM
