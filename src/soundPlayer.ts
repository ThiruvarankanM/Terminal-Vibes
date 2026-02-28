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
    // Kill previous if still running
    this.activeProcess?.kill();

    const platform = os.platform();
    let cmd: string;
    let args: string[];

    if (platform === 'darwin') {
      const vol = Math.min(1, Math.max(0.1, volume));
      cmd = 'afplay';
      args = [filePath, '-v', String(vol)];
    } else if (platform === 'win32') {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.wav') {
        cmd = 'powershell';
        args = [
          '-NoProfile', '-NonInteractive', '-Command',
          `(New-Object Media.SoundPlayer '${filePath.replace(/'/g, "''")}').PlaySync()`,
        ];
      } else {
        cmd = 'powershell';
        args = [
          '-NoProfile', '-NonInteractive', '-Command',
          `$wmp = New-Object -ComObject WMPlayer.OCX; $wmp.URL = '${filePath.replace(/'/g, "''")}'; $wmp.controls.play(); Start-Sleep 5; $wmp.close()`,
        ];
      }
    } else {
      // Linux — try multiple backends
      cmd = 'sh';
      const escaped = filePath.replace(/'/g, "'\\''");
      args = [
        '-c',
        `paplay '${escaped}' 2>/dev/null || aplay '${escaped}' 2>/dev/null || ffplay -nodisp -autoexit '${escaped}' 2>/dev/null`,
      ];
    }

    this.activeProcess = cp.spawn(cmd, args, { stdio: 'ignore', detached: false });
    this.activeProcess.on('error', () => { /* silently ignore */ });
    this.activeProcess.unref();
  }

  dispose(): void {
    this.activeProcess?.kill();
  }
}
