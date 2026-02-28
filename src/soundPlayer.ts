import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { getGlobalConfig, getCategoryConfig, PRESET_SOUNDS, UserCategory } from './config';

export class SoundPlayer {
  private lastPlayedAt = 0;
  private activeProcess: cp.ChildProcess | null = null;

  constructor(private readonly extensionUri: vscode.Uri) {}

  /** Play the sound for a specific category, respecting cooldown and enabled flags. */
  async playCategory(categoryId: string): Promise<void> {
    const global = getGlobalConfig();
    if (!global.enabled) { return; }

    const now = Date.now();
    if (now - this.lastPlayedAt < global.cooldown) { return; }

    const cat = getCategoryConfig(categoryId);
    if (!cat.enabled) { return; }

    this.lastPlayedAt = now;
    const filePath = await this.resolveSoundPath(cat.sound, cat.customSoundPath);
    if (!filePath) { return; }
    this.spawnPlayer(filePath, global.volume);
  }

  /** Play the sound for a user-created category, respecting cooldown and enabled flags. */
  async playUserCategory(cat: UserCategory): Promise<void> {
    const global = getGlobalConfig();
    if (!global.enabled) { return; }

    const now = Date.now();
    if (now - this.lastPlayedAt < global.cooldown) { return; }

    if (!cat.enabled) { return; }

    this.lastPlayedAt = now;
    const filePath = await this.resolveSoundPath(cat.sound, cat.customSoundPath);
    if (!filePath) { return; }
    this.spawnPlayer(filePath, global.volume);
  }

  /** Force-play a specific sound (ignores cooldown — for test / preview). */
  async playTest(sound: string, customSoundPath?: string): Promise<void> {
    const global = getGlobalConfig();
    const filePath = await this.resolveSoundPath(sound, customSoundPath ?? '');
    if (!filePath) {
      vscode.window.showWarningMessage('TerminalVibes: sound file not found. Check your settings.');
      return;
    }
    this.spawnPlayer(filePath, global.volume);
  }

  private async resolveSoundPath(sound: string, customPath: string): Promise<string | null> {
    if (sound === 'custom') {
      if (!customPath || !fs.existsSync(customPath)) {
        vscode.window.showWarningMessage(
          'TerminalVibes: custom sound path is not set or file does not exist.',
          'Set Custom Sound'
        ).then(action => {
          if (action) { vscode.commands.executeCommand('soundOnError.setCustomSound'); }
        });
        return null;
      }
      return customPath;
    }

    const preset = PRESET_SOUNDS[sound];
    if (!preset) { return null; }

    const uri = vscode.Uri.joinPath(this.extensionUri, 'media', 'sounds', preset.file);
    const fsPath = uri.fsPath;

    if (!fs.existsSync(fsPath)) {
      vscode.window.showErrorMessage(
        `TerminalVibes: bundled sound "${preset.file}" not found.`
      );
      return null;
    }
    return fsPath;
  }

  private spawnPlayer(filePath: string, volume: number): void {
    this.activeProcess?.kill();

    const platform = os.platform();
    let cmd: string;
    let args: string[];

    if (platform === 'darwin') {
      // afplay is built-in on macOS and supports volume
      const vol = Math.min(1, Math.max(0.1, volume));
      cmd  = 'afplay';
      args = [filePath, '-v', String(vol)];

    } else if (platform === 'win32') {
      const safe = filePath.replace(/'/g, "''");
      const ext  = path.extname(filePath).toLowerCase();

      if (ext === '.wav') {
        // SoundPlayer is built-in and handles WAV reliably
        cmd  = 'powershell';
        args = [
          '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command',
          `(New-Object Media.SoundPlayer '${safe}').PlaySync()`,
        ];
      } else {
        // Try ffplay first (handles duration automatically, no truncation),
        // fall back to WMPlayer with a 10 s window (covers all bundled meme sounds)
        cmd  = 'powershell';
        args = [
          '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command',
          `$f=Get-Command ffplay -EA SilentlyContinue;` +
          `if($f){& ffplay -nodisp -autoexit -loglevel quiet '${safe}'}` +
          `else{$w=New-Object -ComObject WMPlayer.OCX;$w.URL='${safe}';$w.controls.play();Start-Sleep 10;$w.close()}`,
        ];
      }

    } else {
      // Linux & WSL
      const esc    = filePath.replace(/'/g, "'\\''");
      const isWsl  = this.detectWsl();

      // Native Linux audio: PulseAudio → ALSA → mpg123 → ffplay
      const nativeChain =
        `paplay '${esc}' 2>/dev/null` +
        ` || aplay '${esc}' 2>/dev/null` +
        ` || mpg123 -q '${esc}' 2>/dev/null` +
        ` || ffplay -nodisp -autoexit -loglevel quiet '${esc}' 2>/dev/null`;

      // WSL fallback: convert path with wslpath, pipe a PS script to powershell.exe via stdin.
      // Single-quoting the printf format keeps PowerShell's $w unexpanded by bash;
      // %s is replaced at runtime with the converted Windows path.
      const wslChain = isWsl
        ? ` || { _wp=$(wslpath -w '${esc}' 2>/dev/null) && [ -n "$_wp" ] &&` +
          ` printf '$w=New-Object -ComObject WMPlayer.OCX;$w.URL="%s";$w.controls.play();Start-Sleep 10;$w.close()' "$_wp"` +
          ` | powershell.exe -NoProfile -NonInteractive -Command - 2>/dev/null; }`
        : '';

      cmd  = 'sh';
      args = ['-c', nativeChain + wslChain];
    }

    this.activeProcess = cp.spawn(cmd, args, { stdio: 'ignore', detached: false });
    this.activeProcess.on('error', () => {});
    this.activeProcess.unref();
  }

  /** Returns true when running inside WSL (any version). */
  private detectWsl(): boolean {
    try {
      const v = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
      return v.includes('microsoft') || v.includes('wsl');
    } catch {
      return false;
    }
  }

  dispose(): void {
    this.activeProcess?.kill();
  }
}
