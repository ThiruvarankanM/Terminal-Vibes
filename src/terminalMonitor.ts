import * as vscode from 'vscode';
import { getGlobalConfig, getCategoryConfig, CATEGORIES, getUserCategories } from './config';
import { SoundPlayer } from './soundPlayer';

// ANSI + OSC escape code remover
const ANSI_RE = /(\x9B|\x1B\[)[0-9;]*[ -/]*[@-~]|\x1B[()][AB012]|\x1B[DEHMNOVWXZ78]|\x1B\].*?\x07|\r/g;

function stripAnsi(raw: string): string {
  return raw.replace(ANSI_RE, '');
}

export class TerminalMonitor {
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly soundPlayer: SoundPlayer) {
    // Stream every chunk of terminal output and check against each category.
    this.disposables.push(
      vscode.window.onDidStartTerminalShellExecution(async event => {
        for await (const chunk of event.execution.read()) {
          this.checkText(chunk);
        }
      })
    );

    // Non-zero exit code → always trigger the Error / Crash category.
    this.disposables.push(
      vscode.window.onDidEndTerminalShellExecution(event => {
        if ((event.exitCode ?? 0) !== 0) {
          this.soundPlayer.playCategory('error');
        }
      })
    );
  }

  private checkText(raw: string): void {
    const global = getGlobalConfig();
    if (!global.enabled) { return; }

    const text = stripAnsi(raw).toLowerCase();

    // Built-in categories first.
    for (const cat of CATEGORIES) {
      const catCfg = getCategoryConfig(cat.id);
      if (!catCfg.enabled) { continue; }
      if (catCfg.keywords.some(kw => text.includes(kw.toLowerCase()))) {
        this.soundPlayer.playCategory(cat.id);
        return;
      }
    }

    // User-created categories next.
    for (const userCat of getUserCategories()) {
      if (!userCat.enabled) { continue; }
      if (userCat.keywords.some(kw => text.includes(kw.toLowerCase()))) {
        this.soundPlayer.playUserCategory(userCat);
        return;
      }
    }
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }
}
