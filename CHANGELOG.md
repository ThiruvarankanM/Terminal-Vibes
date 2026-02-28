# Changelog

All notable changes to **TerminalVibes** will be documented here.

## [0.1.1] - 2026-02-28

### Fixed
- Windows MP3 playback now uses ffplay (if available) with correct duration — no more 5 s cutoff
- WSL audio fallback via `powershell.exe` when PulseAudio/ALSA/ffplay are unavailable
- Status bar shows green `All active` / `X/Y active` and red `Disabled` state correctly
- Linux fallback chain extended with `mpg123`

### Changed
- Extension icon updated to neon terminal + sound waves design

## [0.1.0] - 2026-02-28

### Added
- 8 built-in sound categories: Error/Crash, Test Passed, Test Failed, Build Success, Build Failed, Deploy, Warning, Process Ready
- 44 bundled sound presets — 40 MP3 meme sounds + 4 synthesized WAV tones
- Custom category creation with user-defined keywords, icons, and sounds
- Master toggle to enable/disable all sounds at once
- Per-category enable/disable, keyword editing, and sound selection
- Custom sound file support (MP3, WAV, OGG, AIFF, FLAC) from any local path
- Volume control (0.1–1.0, effective on macOS)
- Cooldown setting to prevent sound spam (default 3 s)
- Dynamic status bar indicator — green speaker when active, red when disabled
- "Enable All / Disable All" bulk actions in the category picker
- Rename and delete support for user-created categories
