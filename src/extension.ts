import * as vscode from 'vscode';
import * as fs from 'fs';
import { SoundPlayer } from './soundPlayer';
import { TerminalMonitor } from './terminalMonitor';
import {
  getGlobalConfig,
  getCategoryConfig,
  updateCategoryConfig,
  resetCategoryKeywords,
  setEnabled,
  CATEGORIES,
  PRESET_SOUNDS,
  getUserCategories,
  saveUserCategory,
  updateUserCategory,
  deleteUserCategory,
  UserCategory,
} from './config';

let statusBarItem: vscode.StatusBarItem;
let monitor: TerminalMonitor | undefined;
let player: SoundPlayer | undefined;

export function activate(context: vscode.ExtensionContext): void {
  player = new SoundPlayer(context.extensionUri);
  monitor = new TerminalMonitor(player);

  // --- Status bar ---
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBarItem.command = 'soundOnError.selectSound';
  statusBarItem.tooltip = 'TerminalVibes — click to manage sound categories';
  updateStatusBar();
  statusBarItem.show();

  // Refresh status bar on config change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('soundOnError')) {
        updateStatusBar();
      }
    })
  );

  // --- Commands ---
  context.subscriptions.push(
    vscode.commands.registerCommand('soundOnError.toggle', async () => {
      const cfg = getGlobalConfig();
      await setEnabled(!cfg.enabled);
      const state = !cfg.enabled ? 'enabled' : 'disabled';
      vscode.window.showInformationMessage(`TerminalVibes ${state}.`);
      updateStatusBar();
    }),

    vscode.commands.registerCommand('soundOnError.selectSound', async () => {
      await showCategoryPicker();
    }),

    vscode.commands.registerCommand('soundOnError.setCustomSound', async (categoryId?: string) => {
      const uris = await vscode.window.showOpenDialog({
        title: 'Select Custom Sound File',
        filters: { 'Audio Files': ['mp3', 'wav', 'ogg', 'aiff', 'flac'] },
        canSelectMany: false,
      });
      if (!uris || uris.length === 0) { return; }

      const filePath = uris[0].fsPath;
      if (!fs.existsSync(filePath)) {
        vscode.window.showErrorMessage('TerminalVibes: selected file does not exist.');
        return;
      }
      const id = categoryId ?? 'error';
      await updateCategoryConfig(id, { sound: 'custom', customSoundPath: filePath });
      const catLabel = CATEGORIES.find(c => c.id === id)?.label ?? id;
      vscode.window.showInformationMessage(`TerminalVibes: custom sound set for "${catLabel}".`);
      updateStatusBar();
    }),

    vscode.commands.registerCommand('soundOnError.testSound', async () => {
      const cat = getCategoryConfig('error');
      await player!.playTest(cat.sound, cat.customSoundPath);
    }),

    vscode.commands.registerCommand('soundOnError.resetKeywords', async () => {
      const confirm = await vscode.window.showWarningMessage(
        'Reset ALL category keywords to defaults?',
        { modal: true },
        'Reset All'
      );
      if (confirm === 'Reset All') {
        for (const cat of CATEGORIES) {
          await resetCategoryKeywords(cat.id);
        }
        vscode.window.showInformationMessage('TerminalVibes: all category keywords reset to default.');
      }
    })
  );

  context.subscriptions.push(statusBarItem, monitor, player);
}

// ── Level 1: Category picker ──────────────────────────────────────────────────

async function showCategoryPicker(): Promise<void> {
  const global     = getGlobalConfig();
  const userCats   = getUserCategories();

  type BuiltinItem = vscode.QuickPickItem & { _catId: string };
  type UserItem    = vscode.QuickPickItem & { _userId: string };
  type ActionItem  = vscode.QuickPickItem & { _action: 'create' | 'disableAll' | 'enableAll' };
  type AnyItem     = BuiltinItem | UserItem | ActionItem;

  // ── Built-in categories ─────────────────────────────────────────────────
  const builtinItems: BuiltinItem[] = CATEGORIES.map(cat => {
    const catCfg = getCategoryConfig(cat.id);
    const soundLabel = catCfg.sound === 'custom'
      ? 'custom'
      : (PRESET_SOUNDS[catCfg.sound]?.label ?? catCfg.sound);
    const dot = catCfg.enabled ? '$(circle-filled)' : '$(circle-outline)';
    return {
      label:       `${cat.icon}  ${cat.label}`,
      description: `${dot}  ${soundLabel}`,
      detail:      catCfg.enabled ? undefined : 'disabled — click to configure',
      _catId:      cat.id,
    };
  });

  // ── User-created categories ─────────────────────────────────────────────
  const userItems: UserItem[] = userCats.map(uc => {
    const soundLabel = uc.sound === 'custom'
      ? 'custom'
      : (PRESET_SOUNDS[uc.sound]?.label ?? uc.sound);
    const dot = uc.enabled ? '$(circle-filled)' : '$(circle-outline)';
    return {
      label:       `${uc.icon}  ${uc.label}`,
      description: `${dot}  ${soundLabel}`,
      detail:      uc.enabled ? undefined : 'disabled — click to configure',
      _userId:     uc.id,
    };
  });

  const sep = (text = ''): vscode.QuickPickItem => ({
    label: text, kind: vscode.QuickPickItemKind.Separator,
  });

  const actionItems: ActionItem[] = [
    {
      label:       '$(add)  Create new category',
      description: 'Define your own keywords and sound',
      _action:     'create',
    },
    {
      label:       '$(bell-slash)  Disable All',
      description: 'Silence every sound event at once',
      _action:     'disableAll',
    },
    {
      label:       '$(bell)  Enable All',
      description: 'Re-enable all sound events at once',
      _action:     'enableAll',
    },
  ];

  const items: AnyItem[] = [
    ...builtinItems,
    ...(userItems.length > 0 ? [sep('My Categories') as AnyItem, ...userItems] : []),
    sep('Actions') as AnyItem,
    ...actionItems,
  ];

  const picked = await vscode.window.showQuickPick(items, {
    title:              `TerminalVibes — Sound Categories${global.enabled ? '' : '  ⚠ master OFF'}`,
    placeHolder:        'Select a category to configure, or create a new one',
    matchOnDescription: true,
  }) as AnyItem | undefined;

  if (!picked) { return; }

  if ('_action' in picked) {
    if (picked._action === 'create') {
      await showCreateCategoryFlow();
      return;
    }
    const enable = picked._action === 'enableAll';
    for (const cat of CATEGORIES) {
      await updateCategoryConfig(cat.id, { enabled: enable });
    }
    for (const uc of getUserCategories()) {
      await updateUserCategory(uc.id, { enabled: enable });
    }
    vscode.window.showInformationMessage(
      `TerminalVibes: all categories ${enable ? 'enabled' : 'disabled'}.`
    );
    updateStatusBar();
    return;
  }

  if ('_userId' in picked) {
    await showUserCategorySubMenu(picked._userId);
    return;
  }

  await showCategorySubMenu(picked._catId);
}

// ── Level 2: Per-category sub-menu ────────────────────────────────────────────

async function showCategorySubMenu(categoryId: string): Promise<void> {
  const cat    = CATEGORIES.find(c => c.id === categoryId)!;
  const catCfg = getCategoryConfig(categoryId);

  const currentSoundLabel = catCfg.sound === 'custom'
    ? `custom: ${catCfg.customSoundPath || 'not set'}`
    : (PRESET_SOUNDS[catCfg.sound]?.label ?? catCfg.sound);

  type SubItem = vscode.QuickPickItem & { _sub: 'toggle' | 'presets' | 'custom' };

  const items: SubItem[] = [
    {
      label:       catCfg.enabled
                     ? '$(circle-slash)  Disable this category'
                     : '$(check)  Enable this category',
      description: catCfg.enabled ? 'Turn off sound for this event' : 'Turn on sound for this event',
      _sub:        'toggle',
    },
    {
      label:       '$(music)  Pick from bundled sounds',
      description: `Current: ${currentSoundLabel}`,
      _sub:        'presets',
    },
    {
      label:       '$(folder-opened)  Pick from your PC',
      description: 'Choose any .mp3 / .wav / .ogg / .flac',
      _sub:        'custom',
    },
  ];

  const picked = await vscode.window.showQuickPick(items, {
    title:       `${cat.icon}  ${cat.label}`,
    placeHolder: 'What would you like to change?',
  }) as SubItem | undefined;

  if (!picked) { return; }

  if (picked._sub === 'toggle') {
    const next = !catCfg.enabled;
    await updateCategoryConfig(categoryId, { enabled: next });
    vscode.window.showInformationMessage(
      `TerminalVibes: "${cat.label}" ${next ? 'enabled' : 'disabled'}.`
    );
    updateStatusBar();
    return;
  }

  if (picked._sub === 'custom') {
    await vscode.commands.executeCommand('soundOnError.setCustomSound', categoryId);
    return;
  }

  // 'presets' — show full bundled sound list
  type PresetItem = vscode.QuickPickItem & { _id: string };

  const presetItems: PresetItem[] = Object.entries(PRESET_SOUNDS).map(([id, preset]) => ({
    label:       preset.label,
    description: id === catCfg.sound ? '$(check) active' : '',
    detail:      preset.file,
    _id:         id,
  }));

  const soundPick = await vscode.window.showQuickPick(presetItems, {
    title:              `${cat.label} — Pick a sound (${presetItems.length} presets)`,
    placeHolder:        'Type to filter…',
    matchOnDescription: true,
    matchOnDetail:      true,
  }) as PresetItem | undefined;

  if (!soundPick) { return; }

  await updateCategoryConfig(categoryId, { sound: soundPick._id });
  vscode.window.showInformationMessage(`"${cat.label}" will now play "${soundPick.label}".`);
  updateStatusBar();
  player!.playTest(soundPick._id);
}

// ── Create new category flow ──────────────────────────────────────────────────

const ICON_OPTIONS = [
  { label: '$(tag)         tag',           icon: '$(tag)'          },
  { label: '$(flame)       flame',          icon: '$(flame)'        },
  { label: '$(bug)         bug',            icon: '$(bug)'          },
  { label: '$(beaker)      beaker',         icon: '$(beaker)'       },
  { label: '$(cloud)       cloud',          icon: '$(cloud)'        },
  { label: '$(database)    database',       icon: '$(database)'     },
  { label: '$(gear)        gear',           icon: '$(gear)'         },
  { label: '$(heart)       heart',          icon: '$(heart)'        },
  { label: '$(info)        info',           icon: '$(info)'         },
  { label: '$(key)         key',            icon: '$(key)'          },
  { label: '$(lock)        lock',           icon: '$(lock)'         },
  { label: '$(megaphone)   megaphone',      icon: '$(megaphone)'    },
  { label: '$(person)      person',         icon: '$(person)'       },
  { label: '$(pulse)       pulse',          icon: '$(pulse)'        },
  { label: '$(shield)      shield',         icon: '$(shield)'       },
  { label: '$(star)        star',           icon: '$(star)'         },
  { label: '$(terminal)    terminal',       icon: '$(terminal)'     },
  { label: '$(zap)         zap',            icon: '$(zap)'          },
];

async function showCreateCategoryFlow(): Promise<void> {
  // Step 1: Name
  const name = await vscode.window.showInputBox({
    title:       'Create New Category — Step 1 of 4: Name',
    prompt:      'Give your category a name',
    placeHolder: 'e.g. Docker, Lint, Security…',
    validateInput: v => v.trim().length < 2 ? 'Name must be at least 2 characters' : undefined,
  });
  if (!name) { return; }

  // Step 2: Icon
  const iconPick = await vscode.window.showQuickPick(
    ICON_OPTIONS.map(o => ({ label: o.label, _icon: o.icon })),
    { title: 'Create New Category — Step 2 of 4: Icon', placeHolder: 'Pick an icon' }
  ) as (vscode.QuickPickItem & { _icon: string }) | undefined;
  if (!iconPick) { return; }

  // Step 3: Keywords
  const kwInput = await vscode.window.showInputBox({
    title:       'Create New Category — Step 3 of 4: Keywords',
    prompt:      'Enter trigger keywords, comma-separated (case-insensitive)',
    placeHolder: 'e.g. docker error, container failed, permission denied',
    validateInput: v => v.trim().length === 0 ? 'Enter at least one keyword' : undefined,
  });
  if (!kwInput) { return; }
  const keywords = kwInput.split(',').map(k => k.trim()).filter(Boolean);

  // Step 4: Sound
  type PresetItem = vscode.QuickPickItem & { _id: string };
  const presetItems: PresetItem[] = Object.entries(PRESET_SOUNDS).map(([id, preset]) => ({
    label: preset.label,
    detail: preset.file,
    _id:   id,
  }));
  const soundPick = await vscode.window.showQuickPick(presetItems, {
    title:       'Create New Category — Step 4 of 4: Sound',
    placeHolder: 'Type to filter and pick a sound…',
    matchOnDetail: true,
  }) as PresetItem | undefined;
  if (!soundPick) { return; }

  const newCat: UserCategory = {
    id:              `user_${Date.now()}`,
    label:           name.trim(),
    icon:            iconPick._icon,
    enabled:         true,
    sound:           soundPick._id,
    customSoundPath: '',
    keywords,
  };

  await saveUserCategory(newCat);
  updateStatusBar();
  vscode.window.showInformationMessage(
    `TerminalVibes: category "${newCat.label}" created with ${keywords.length} keyword(s).`
  );
  // Preview the chosen sound
  player!.playTest(soundPick._id);
}

// ── Level 2b: User-created category sub-menu ──────────────────────────────────

async function showUserCategorySubMenu(userId: string): Promise<void> {
  const uc = getUserCategories().find(c => c.id === userId);
  if (!uc) { return; }

  const currentSoundLabel = uc.sound === 'custom'
    ? `custom: ${uc.customSoundPath || 'not set'}`
    : (PRESET_SOUNDS[uc.sound]?.label ?? uc.sound);

  type SubItem = vscode.QuickPickItem & { _sub: 'toggle' | 'presets' | 'custom' | 'editKeywords' | 'rename' | 'delete' };

  const items: SubItem[] = [
    {
      label:       uc.enabled
                     ? '$(circle-slash)  Disable this category'
                     : '$(check)  Enable this category',
      description: uc.enabled ? 'Turn off sound for this event' : 'Turn on sound for this event',
      _sub:        'toggle',
    },
    {
      label:       '$(music)  Pick from bundled sounds',
      description: `Current: ${currentSoundLabel}`,
      _sub:        'presets',
    },
    {
      label:       '$(folder-opened)  Pick from your PC',
      description: 'Choose any .mp3 / .wav / .ogg / .flac',
      _sub:        'custom',
    },
    {
      label:       '$(edit)  Edit keywords',
      description: `${uc.keywords.length} keyword(s): ${uc.keywords.slice(0, 3).join(', ')}${uc.keywords.length > 3 ? '…' : ''}`,
      _sub:        'editKeywords',
    },
    {
      label:       '$(pencil)  Rename',
      description: `Current name: ${uc.label}`,
      _sub:        'rename',
    },
    {
      label:       '$(trash)  Delete this category',
      description: 'Permanently remove this custom category',
      _sub:        'delete',
    },
  ];

  const picked = await vscode.window.showQuickPick(items, {
    title:       `${uc.icon}  ${uc.label}  (custom)`,
    placeHolder: 'What would you like to change?',
  }) as SubItem | undefined;
  if (!picked) { return; }

  if (picked._sub === 'toggle') {
    await updateUserCategory(userId, { enabled: !uc.enabled });
    vscode.window.showInformationMessage(
      `TerminalVibes: "${uc.label}" ${!uc.enabled ? 'enabled' : 'disabled'}.`
    );
    updateStatusBar();
    return;
  }

  if (picked._sub === 'custom') {
    const uris = await vscode.window.showOpenDialog({
      title: 'Select Custom Sound File',
      filters: { 'Audio Files': ['mp3', 'wav', 'ogg', 'aiff', 'flac'] },
      canSelectMany: false,
    });
    if (!uris || uris.length === 0) { return; }
    await updateUserCategory(userId, { sound: 'custom', customSoundPath: uris[0].fsPath });
    vscode.window.showInformationMessage(`TerminalVibes: custom sound set for "${uc.label}".`);
    return;
  }

  if (picked._sub === 'editKeywords') {
    const current = uc.keywords.join(', ');
    const kwInput = await vscode.window.showInputBox({
      title:       `Edit Keywords — ${uc.label}`,
      prompt:      'Comma-separated keywords (replaces current list)',
      value:       current,
      validateInput: v => v.trim().length === 0 ? 'Enter at least one keyword' : undefined,
    });
    if (!kwInput) { return; }
    const keywords = kwInput.split(',').map(k => k.trim()).filter(Boolean);
    await updateUserCategory(userId, { keywords });
    vscode.window.showInformationMessage(`TerminalVibes: "${uc.label}" now has ${keywords.length} keyword(s).`);
    return;
  }

  if (picked._sub === 'rename') {
    const newName = await vscode.window.showInputBox({
      title:         `Rename — ${uc.label}`,
      prompt:        'New name for this category',
      value:         uc.label,
      validateInput: v => v.trim().length < 2 ? 'Name must be at least 2 characters' : undefined,
    });
    if (!newName) { return; }
    await updateUserCategory(userId, { label: newName.trim() });
    vscode.window.showInformationMessage(`TerminalVibes: category renamed to "${newName.trim()}".`);
    updateStatusBar();
    return;
  }

  if (picked._sub === 'delete') {
    const confirm = await vscode.window.showWarningMessage(
      `Delete category "${uc.label}"? This cannot be undone.`,
      { modal: true }, 'Delete'
    );
    if (confirm !== 'Delete') { return; }
    await deleteUserCategory(userId);
    vscode.window.showInformationMessage(`TerminalVibes: "${uc.label}" deleted.`);
    updateStatusBar();
    return;
  }

  // 'presets'
  type PresetItem = vscode.QuickPickItem & { _id: string };
  const presetItems: PresetItem[] = Object.entries(PRESET_SOUNDS).map(([id, preset]) => ({
    label:       preset.label,
    description: id === uc.sound ? '$(check) active' : '',
    detail:      preset.file,
    _id:         id,
  }));
  const soundPick = await vscode.window.showQuickPick(presetItems, {
    title:              `${uc.label} — Pick a sound`,
    placeHolder:        'Type to filter…',
    matchOnDescription: true,
    matchOnDetail:      true,
  }) as PresetItem | undefined;
  if (!soundPick) { return; }
  await updateUserCategory(userId, { sound: soundPick._id });
  vscode.window.showInformationMessage(`"${uc.label}" will now play "${soundPick.label}".`);
  updateStatusBar();
  player!.playTest(soundPick._id);
}

// ── Status bar ────────────────────────────────────────────────────────────────

function updateStatusBar(): void {
  const global    = getGlobalConfig();
  const userCats  = getUserCategories();
  const builtinOn = CATEGORIES.filter(cat => getCategoryConfig(cat.id).enabled).length;
  const userOn    = userCats.filter(uc => uc.enabled).length;
  const active    = builtinOn + userOn;
  const total     = CATEGORIES.length + userCats.length;

  const isDisabled = !global.enabled || active === 0;

  if (isDisabled) {
    statusBarItem.text            = '$(mute) Disabled';
    statusBarItem.color           = undefined;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    statusBarItem.tooltip         = 'TerminalVibes — disabled. Click to manage.';
  } else if (active === total) {
    statusBarItem.text            = '$(unmute) All active';
    statusBarItem.color           = '#4CAF82';
    statusBarItem.backgroundColor = undefined;
    statusBarItem.tooltip         = `TerminalVibes — all ${total} categories active. Click to manage.`;
  } else {
    statusBarItem.text            = `$(unmute) ${active}/${total} active`;
    statusBarItem.color           = '#4CAF82';
    statusBarItem.backgroundColor = undefined;
    statusBarItem.tooltip         = `TerminalVibes — ${active} of ${total} categories active. Click to manage.`;
  }
}

export function deactivate(): void {
  monitor?.dispose();
  player?.dispose();
}
