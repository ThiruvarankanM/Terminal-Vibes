import * as vscode from 'vscode';

const SECTION = 'soundOnError';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface GlobalConfig {
  enabled: boolean;
  cooldown: number;
  volume: number;
}

export interface CategoryConfig {
  enabled: boolean;
  sound: string;           // preset ID or 'custom'
  customSoundPath: string;
  keywords: string[];
}

export interface CategoryMeta {
  id: string;
  label: string;
  icon: string;
  defaultSound: string;
  defaultKeywords: string[];
}

/** A category fully created and owned by the user. */
export interface UserCategory {
  id: string;              // 'user_<timestamp>'
  label: string;
  icon: string;
  enabled: boolean;
  sound: string;           // preset ID or 'custom'
  customSoundPath: string;
  keywords: string[];
}

export interface PresetSound {
  file: string;
  label: string;
}

// ── Category Definitions ──────────────────────────────────────────────────────

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'error',
    label: 'Error / Crash',
    icon: '$(error)',
    defaultSound: 'fahhhh',
    defaultKeywords: [
      'traceback', 'fatal:', 'panic:', 'segfault', 'core dumped',
      'cannot find path', 'no such file or directory', 'command not found',
      'not recognized as an internal or external command', 'because it does not exist',
      'uncaught exception', 'unhandled rejection', 'out of memory',
      'killed', 'abort trap', 'runtime error',
    ],
  },
  {
    id: 'testPass',
    label: 'Test Passed',
    icon: '$(pass-filled)',
    defaultSound: 'kids-yay',
    defaultKeywords: [
      'all tests passed', 'tests passed', 'test suite passed',
      '✓ passing', 'test run succeeded',
    ],
  },
  {
    id: 'testFail',
    label: 'Test Failed',
    icon: '$(testing-error-icon)',
    defaultSound: 'tf-nemesis',
    defaultKeywords: [
      'tests failed', 'test failed', 'test suite failed',
      'failing', 'assertion failed', 'expect received',
      '● failed', 'jest: failed',
    ],
  },
  {
    id: 'buildOk',
    label: 'Build Success',
    icon: '$(check)',
    defaultSound: 'indian-song',
    defaultKeywords: [
      'compiled successfully', 'build succeeded', 'build complete',
      'webpack compiled with no errors', 'bundled in', 'successfully compiled',
      'build finished',
    ],
  },
  {
    id: 'buildFail',
    label: 'Build Failed',
    icon: '$(circle-slash)',
    defaultSound: 'sad-violin',
    defaultKeywords: [
      'build failed', 'compilation failed', 'failed to compile',
      'webpack compiled with errors', 'tsc: error', 'build error',
    ],
  },
  {
    id: 'deploy',
    label: 'Deploy / Publish Done',
    icon: '$(rocket)',
    defaultSound: 'mystery-sound',
    defaultKeywords: [
      'successfully deployed', 'deployed to', 'published to npm',
      'release created', 'pipeline passed', 'workflow passed',
      'pushed to production', 'deployment complete',
    ],
  },
  {
    id: 'warning',
    label: 'Warning',
    icon: '$(warning)',
    defaultSound: 'spongebob-fail',
    defaultKeywords: [
      'deprecationwarning', 'deprecation warning', 'peer dependency',
      'experimental feature', '[warn]', '⚠ warning',
    ],
  },
  {
    id: 'ready',
    label: 'Process Ready',
    icon: '$(play-circle)',
    defaultSound: 'hub-intro',
    defaultKeywords: [
      'listening on port', 'server started', 'ready in',
      'running at http', 'started successfully', 'dev server running',
      'local:   http',
    ],
  },
];

// ── Preset Sounds ─────────────────────────────────────────────────────────────

// 44 bundled presets: 40 MP3 memes + 4 synthesized WAV tones.
export const PRESET_SOUNDS: Record<string, PresetSound> = {
  // ── Meme MP3s ────────────────────────────────────────────────────────────
  'fahhhh':               { file: 'fahhhhhhhhhhhhhh.mp3',                             label: '1. Fahhhhhhhhhhhhhh' },
  'vine-boom':            { file: 'vine-boom.mp3',                                    label: '2. Vine-Boom' },
  'emotional-damage':     { file: 'emotional-damage-meme.mp3',                        label: '3. Emotional-Damage' },
  'bruh':                 { file: 'error_CDOxCYm.mp3',                                label: '4. Error-Meme' },
  'spongebob-fail':       { file: 'spongebob-fail.mp3',                               label: '5. Spongebob-Fail' },
  'mlg-airhorn':          { file: 'mlg-airhorn.mp3',                                  label: '6. Mlg-Airhorn' },
  'dun-dun-dun':          { file: 'dun-dun-dun-sound-effect-brass_8nFBccR.mp3',       label: '7. Dun-Dun-Dun' },
  'sad-violin':           { file: 'downer_noise.mp3',                                 label: '8. Sad-Violin' },
  'undertaker-bell':      { file: 'undertakers-bell_2UwFCIe.mp3',                     label: '9. Undertakers-Bell' },
  'among-us':             { file: 'among-us-role-reveal-sound.mp3',                   label: '10. Among-Us-Role-Reveal' },
  'anime-wow':            { file: 'anime-wow-sound-effect.mp3',                       label: '11. Anime-Wow' },
  'anime-ahh':            { file: 'anime-ahh.mp3',                                    label: '12. Anime-Ahh' },
  'oh-my-god':            { file: 'oh-my-god-meme.mp3',                               label: '13. Oh-My-God' },
  'dexter-meme':          { file: 'dexter-meme.mp3',                                  label: '14. Dexter-Meme' },
  'rizz':                 { file: 'rizz-sound-effect.mp3',                            label: '15. Rizz-Sound-Effect' },
  'weeknd-rizz':          { file: 'the-weeknd-rizzz.mp3',                             label: '16. The-Weeknd-Rizz' },
  'hub-intro':            { file: 'hub-intro-sound.mp3',                              label: '17. Hub-Intro-Sound' },
  'discord-call':         { file: 'discord-call-sound.mp3',                           label: '18. Discord-Call' },
  'discord-leave':        { file: 'discord-leave-noise.mp3',                          label: '19. Discord-Leave' },
  'discord-notification': { file: 'discord-notification.mp3',                         label: '20. Discord-Notification' },
  'social-credit':        { file: '999-social-credit-siren.mp3',                      label: '21. Social-Credit-Siren' },
  'a-few-moments-later':  { file: 'a-few-moments-later-sponge-bob-sfx-fun.mp3',       label: '22. A-Few-Moments-Later' },
  'auughhh':              { file: 'auughhh.mp3',                                      label: '23. Auughhh' },
  'chicken-screaming':    { file: 'chicken-on-tree-screaming.mp3',                    label: '24. Chicken-On-Tree-Screaming' },
  'dry-fart':             { file: 'dry-fart.mp3',                                     label: '25. Dry-Fart' },
  'fart-reverb':          { file: 'fart-with-extra-reverb.mp3',                       label: '26. Fart-With-Extra-Reverb' },
  'gopgopgop':            { file: 'gopgopgop.mp3',                                    label: '27. Gop-Gop-Gop' },
  'heavenly-music':       { file: 'heavenly-music-gaming-sound-effect-hd-mp3cut.mp3', label: '28. Heavenly-Music' },
  'indian-song':          { file: 'indian-song.mp3',                                  label: '29. Indian-Song' },
  'kids-yay':             { file: 'kids-saying-yay-sound-effect_3.mp3',               label: '30. Kids-Saying-Yay' },
  'meme-credits':         { file: 'meme-de-creditos-finales.mp3',                     label: '31. Meme-De-Creditos' },
  'ngakak-laugh':         { file: 'ngakak-laugh-annoying.mp3',                        label: '32. Ngakak-Laugh' },
  'ny-video':             { file: 'ny-video-online-audio-converter.mp3',              label: '33. Ny-Video' },
  'romanceee':            { file: 'romanceeeeeeeeeeeeee.mp3',                         label: '34. Romanceeeeee' },
  'run-vine':             { file: 'run-vine-sound-effect.mp3',                        label: '35. Run-Vine' },
  'studio-awwww':         { file: 'studio-audience-awwww-sound-fx.mp3',               label: '36. Studio-Audience-Awwww' },
  'tf-nemesis':           { file: 'tf_nemesis.mp3',                                   label: '37. Tf-Nemesis' },
  'mystery-sound':        { file: 'tmpbxydyrz3.mp3',                                  label: '38. Mystery-Sound' },
  'phone-ringing':        { file: 'youre-phone-is-ringing.mp3',                       label: '39. Youre-Phone-Is-Ringing' },
  '1-108':                { file: '1-108.mp3',                                        label: '40. 1-108' },
  // ── Synthesized WAV tones ────────────────────────────────────────────────
  'error-classic':        { file: 'error-classic.wav',                                label: '41. Error-Classic' },
  'fail-trombone':        { file: 'fail-trombone.wav',                                label: '42. Fail-Trombone' },
  'windows-error':        { file: 'windows-error.wav',                                label: '43. Windows-Error' },
  'buzz-alert':           { file: 'buzz-alert.wav',                                   label: '44. Buzz-Alert' },
};

// ── Config Accessors ──────────────────────────────────────────────────────────

export function getGlobalConfig(): GlobalConfig {
  const cfg = vscode.workspace.getConfiguration(SECTION);
  return {
    enabled: cfg.get<boolean>('enabled', true),
    cooldown: cfg.get<number>('cooldown', 3000),
    volume:   cfg.get<number>('volume', 1.0),
  };
}

export function getCategoryConfig(id: string): CategoryConfig {
  const meta = CATEGORIES.find(c => c.id === id);
  if (!meta) { throw new Error(`Unknown category: ${id}`); }
  const all = vscode.workspace.getConfiguration(SECTION)
    .get<Record<string, Partial<CategoryConfig>>>('categories', {});
  const saved = all[id] ?? {};
  return {
    enabled:         saved.enabled         ?? true,
    sound:           saved.sound           ?? meta.defaultSound,
    customSoundPath: saved.customSoundPath ?? '',
    keywords:        saved.keywords        ?? [...meta.defaultKeywords],
  };
}

export async function updateCategoryConfig(id: string, patch: Partial<CategoryConfig>): Promise<void> {
  const cfg = vscode.workspace.getConfiguration(SECTION);
  const all = cfg.get<Record<string, Partial<CategoryConfig>>>('categories', {});
  all[id] = { ...(all[id] ?? {}), ...patch };
  await cfg.update('categories', all, vscode.ConfigurationTarget.Global);
}

export async function resetCategoryKeywords(id: string): Promise<void> {
  const meta = CATEGORIES.find(c => c.id === id);
  if (!meta) { return; }
  await updateCategoryConfig(id, { keywords: [...meta.defaultKeywords] });
}

export async function setEnabled(value: boolean): Promise<void> {
  await vscode.workspace.getConfiguration(SECTION)
    .update('enabled', value, vscode.ConfigurationTarget.Global);
}

// ── User-created categories ───────────────────────────────────────────────────

export function getUserCategories(): UserCategory[] {
  return vscode.workspace.getConfiguration(SECTION)
    .get<UserCategory[]>('userCategories', []);
}

export async function saveUserCategory(cat: UserCategory): Promise<void> {
  const all = getUserCategories();
  const idx = all.findIndex(c => c.id === cat.id);
  if (idx !== -1) {
    all[idx] = cat;
  } else {
    all.push(cat);
  }
  await vscode.workspace.getConfiguration(SECTION)
    .update('userCategories', all, vscode.ConfigurationTarget.Global);
}

export async function updateUserCategory(id: string, patch: Partial<UserCategory>): Promise<void> {
  const all = getUserCategories();
  const idx = all.findIndex(c => c.id === id);
  if (idx === -1) { return; }
  all[idx] = { ...all[idx], ...patch };
  await vscode.workspace.getConfiguration(SECTION)
    .update('userCategories', all, vscode.ConfigurationTarget.Global);
}

export async function deleteUserCategory(id: string): Promise<void> {
  const all = getUserCategories().filter(c => c.id !== id);
  await vscode.workspace.getConfiguration(SECTION)
    .update('userCategories', all, vscode.ConfigurationTarget.Global);
}
