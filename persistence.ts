
import { UserProgress } from './types';

export const STABLE_KEY = 'vv:vault_v20';
const SCHEMA_VERSION = 20;
const LEGACY_KEYS = ['vv:vault_v19', 'vv:snapshot_v18', 'vv:snapshot', 'vv_apex_vault_v15'];

export type BootStatus = 'BOOTING' | 'READY' | 'ERROR';
let GLOBAL_BOOT_STATUS: BootStatus = 'BOOTING';

export interface BootResult {
  progress: UserProgress;
  logs: string[];
  status: BootStatus;
}

const INITIAL_PROGRESS: UserProgress = {
  version: SCHEMA_VERSION,
  revision: 0,
  updatedAt: Date.now(),
  wordMastery: {},
  wordSRS: {},
  activityLedger: {},
  streak: 1,
  lastActive: new Date().toISOString(),
  xp: 0,
  credits: 100,
  inventory: { streakFreezes: 1, xpBoosters: 0 },
  dailyMasteryGoal: 10,
  weeklyMasteryGoal: 50,
  monthlyMasteryGoal: 200,
  quarterlyMasteryGoal: 500,
  annualMasteryGoal: 1500,
  milestonesClaimed: [],
  lastConfig: { levels: ['Core', 'Medium', 'Advanced'], freqs: ['High', 'Mid', 'Low'], masteries: [0, 1, 2] },
  customWords: []
};

/**
 * [V20] DEEP HYDRATE PROTOCOL
 * Explicitly handles 0, false, and NaN to prevent config resets.
 */
function deepHydrate(target: any, source: any): any {
  if (source === undefined || source === null) return target;

  if (typeof target === 'number') {
    return (typeof source === 'number' && !isNaN(source)) ? source : target;
  }
  if (typeof target === 'boolean') {
    return (typeof source === 'boolean') ? source : target;
  }
  if (typeof target === 'string') {
    return (typeof source === 'string') ? source : target;
  }
  if (Array.isArray(target)) {
    return Array.isArray(source) ? [...source] : [...target];
  }
  if (typeof target === 'object') {
    const result = { ...target };
    for (const key in target) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        result[key] = deepHydrate(target[key], source[key]);
      }
    }
    return result;
  }
  return source;
}

export const hydrateVault = (): BootResult => {
  const logs: string[] = [`[V20] Sentinel Boot: ${new Date().toISOString()}`];
  let master: UserProgress = JSON.parse(JSON.stringify(INITIAL_PROGRESS));

  const tryParse = (key: string): any | null => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const p = JSON.parse(raw);
      return p.progress || p;
    } catch (e) { return null; }
  };

  const current = tryParse(STABLE_KEY);
  if (current && current.version === SCHEMA_VERSION) {
    master = deepHydrate(INITIAL_PROGRESS, current);
    logs.push(`[V20] Hydration Successful. Rev: ${master.revision}`);
  } else {
    // Migration Logic
    for (const key of LEGACY_KEYS) {
      const legacy = tryParse(key);
      if (legacy && (legacy.xp > 0 || Object.keys(legacy.wordMastery || {}).length > 0)) {
        logs.push(`[MIGRATE] Recovered data from ${key}`);
        master = deepHydrate(master, legacy);
        master.revision = (legacy.revision || 0) + 1;
        break;
      }
    }
  }

  master.version = SCHEMA_VERSION;
  GLOBAL_BOOT_STATUS = 'READY';
  return { progress: master, logs, status: 'READY' };
};

/**
 * [V20] THE ATOMIC SAVE GATE
 * Exactly ONE callsite for localStorage.setItem
 */
export const saveVault = (memory: UserProgress, lastSeenRevision: number, force = false): { success: boolean; reason?: string } => {
  if (GLOBAL_BOOT_STATUS !== 'READY') return { success: false, reason: 'SYSTEM_NOT_READY' };

  const rawDisk = localStorage.getItem(STABLE_KEY);
  let disk: UserProgress | null = null;
  
  if (rawDisk) {
    try {
      disk = JSON.parse(rawDisk);
      
      // 1. STALE MEMORY CHECK (Multi-tab protection)
      if (disk && disk.revision > lastSeenRevision && !force) {
        return { success: false, reason: 'STALE_MEMORY_COLLISION' };
      }

      // 2. REGRESSION PROTECTION (XP Integrity)
      if (disk && memory.xp < disk.xp && !force) {
        return { success: false, reason: 'PROGRESS_REGRESSION_BLOCKED' };
      }
    } catch (e) {
      console.error("[V20] Disk corruption detected. Attempting overwrite.");
    }
  }

  // 3. ATOMIC REVISION ASSIGNMENT
  const final: UserProgress = {
    ...memory,
    version: SCHEMA_VERSION,
    revision: (disk?.revision || 0) + 1,
    updatedAt: Date.now()
  };

  try {
    // THE CALLSITE (ONE AND ONLY)
    localStorage.setItem(STABLE_KEY, JSON.stringify(final));
    return { success: true };
  } catch (e) {
    return { success: false, reason: 'STORAGE_QUOTA_EXCEEDED' };
  }
};

export const runPersistenceQA = async () => {
  const results: { status: 'PASS' | 'FAIL'; name: string }[] = [];
  
  // T1: Fresh
  localStorage.clear();
  const b1 = hydrateVault();
  results.push({ name: "T1: Fresh Install", status: b1.progress.dailyMasteryGoal === 10 ? 'PASS' : 'FAIL' });

  // T4: Stale Tab
  const mockDisk = { ...INITIAL_PROGRESS, revision: 100, xp: 5000 };
  localStorage.setItem(STABLE_KEY, JSON.stringify(mockDisk));
  const staleMem = { ...INITIAL_PROGRESS, revision: 5, xp: 100 };
  const res = saveVault(staleMem, 5);
  results.push({ name: "T4: Stale Tab Block", status: res.success === false ? 'PASS' : 'FAIL' });

  // T5: Goal Persistence
  GLOBAL_BOOT_STATUS = 'READY';
  const newGoal = { ...INITIAL_PROGRESS, dailyMasteryGoal: 88, revision: 101 };
  saveVault(newGoal, 100, true);
  const verify = JSON.parse(localStorage.getItem(STABLE_KEY)!);
  results.push({ name: "T5: Goal Persistence", status: verify.dailyMasteryGoal === 88 ? 'PASS' : 'FAIL' });

  return results;
};
