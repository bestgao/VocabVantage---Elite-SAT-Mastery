
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { UserProgress, AppScreen, MasteryLevel, Word, WordStat } from './types';
import { GET_MASTER_CORE } from './database';
import { XP_PER_WORD_UPGRADE } from './constants';
import { STABLE_KEY, saveVault, BootResult, runPersistenceQA, INITIAL_PROGRESS, deepHydrate } from './persistence';
import { auth, db } from './firebase';
import { buildSmartReview, nextSRS, reviewQualityFromResult } from './services/adaptive';


import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';


import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import Dashboard from './components/Dashboard';
import Flashcards from './components/Flashcards';
import WordBank from './components/WordBank';
import StudySessionSetup from './components/StudySessionSetup';
import SessionSummary from './components/SessionSummary';
import GameHub from './components/GameHub';
import Quiz from './components/Quiz';
import DiagnosticAssessment, { DiagnosticResult } from './components/DiagnosticAssessment';
import {
  LogIn,
  User,
  CloudSync,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  Home,
  BookOpen,
  Gamepad2,
  LibraryBig,
  ClipboardList,
  ChevronRight
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

interface AppProps {
  bootData: BootResult;
}

const getLocalKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const toCloudProgressSummary = (p: UserProgress) => {
  const {
    wordMastery: _wordMastery,
    wordSRS: _wordSRS,
    wordStats: _wordStats,
    ...summary
  } = p;

  return summary;
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-red-600">
          <h1 className="text-2xl font-bold">Something went wrong.</h1>
          <pre className="mt-4 p-4 bg-slate-100 rounded overflow-auto">{this.state.error?.toString()}</pre>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Reset Application</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Titan Protocol V42-WORD-INTELLIGENCE
const App: React.FC<AppProps> = ({ bootData }) => {
  const [screen, setScreen] = useState<AppScreen | 'SUMMARY' | 'DIAGNOSTIC'>(AppScreen.DASHBOARD);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [sessionResults, setSessionResults] = useState({ mastered: 0, reviews: 0, xp: 0 });
  const [titanLibrary, setTitanLibrary] = useState<Word[]>([]);
  const [progress, setProgress] = useState<UserProgress>(bootData.progress);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const fullLibrary = useMemo(() => {
    const custom = progress.customWords || [];
    const seen = new Set(titanLibrary.map(w => w.term.toLowerCase()));
    const uniqueCustom = custom.filter(w => !seen.has(w.term.toLowerCase()));
    return [...titanLibrary, ...uniqueCustom];
  }, [titanLibrary, progress.customWords]);
  const [lastSavedAt, setLastSavedAt] = useState<number>(bootData.progress.updatedAt);
  const [celebration, setCelebration] = useState(false);
  
  const progressRef = useRef<UserProgress>(bootData.progress);
  const lastSeenRevisionRef = useRef<number>(bootData.progress.revision);
  const isDirtyRef = useRef(false);
  const debounceTimer = useRef<number | null>(null);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth State Changed:", firebaseUser ? "Logged In" : "Logged Out");
      
      if (firebaseUser) {
        // 1. Set user state IMMEDIATELY to trigger UI transition
        setUser(firebaseUser);
        setUserEmail(firebaseUser.email || firebaseUser.uid);
        
        // 2. Perform sync in background
        setSyncStatus('syncing');
        try {
          console.log("Starting background cloud sync...");
          const syncPromise = fetchFromCloud(firebaseUser.uid);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Sync Timeout")), 8000)
          );
          
          await Promise.race([syncPromise, timeoutPromise]).catch(err => {
            console.warn("Cloud sync timed out or failed, proceeding with local data", err);
          });
          
          console.log("Background cloud sync complete.");
          setSyncStatus('success');
          setIsInitialSyncDone(true);
          setTimeout(() => setSyncStatus('idle'), 2000);
        } catch (e) {
          console.error("Background sync failed", e);
          setSyncStatus('error');
          setIsInitialSyncDone(true);
        }
      } else {
        setUser(null);
        setUserEmail(null);
        setIsInitialSyncDone(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchFromCloud = async (uid: string) => {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    let cloudProgress = deepHydrate(INITIAL_PROGRESS, {});

    if (userDoc.exists()) {
      const data = userDoc.data();
      // Canonical cloud format: the complete UserProgress object lives in `progress`.
      // Backward compatibility: older accounts may still have progress fields at the root.
      cloudProgress = deepHydrate(INITIAL_PROGRESS, data.progress || data);
    }

    // Fetch legacy mastery subcollection for backward compatibility.
    const progressCollRef = collection(db, 'users', uid, 'progress');
    const progressSnap = await getDocs(progressCollRef);

    progressSnap.forEach((progressDoc) => {
      const level = progressDoc.data().level as MasteryLevel | undefined;
      if (typeof level === 'number') {
        cloudProgress.wordMastery[progressDoc.id] = level;
      }
    });

    // Fetch granular word stats and restore SRS scheduling data.
    const statsCollRef = collection(db, 'users', uid, 'wordStats');
    const statsSnap = await getDocs(statsCollRef);

    statsSnap.forEach((statsDoc) => {
      const data = statsDoc.data();
      const { srs, updatedAt, ...rawStatData } = data;

      // Older documents may contain a Firestore Timestamp here.
      const normalizedLastSeenAt =
        typeof rawStatData.lastSeenAt === 'number'
          ? rawStatData.lastSeenAt
          : rawStatData.lastSeenAt &&
              typeof rawStatData.lastSeenAt.toMillis === 'function'
            ? rawStatData.lastSeenAt.toMillis()
            : 0;

      const statData = {
        ...rawStatData,
        lastSeenAt: normalizedLastSeenAt
      };

      cloudProgress.wordStats[statsDoc.id] = statData as WordStat;

      if (typeof data.masteryLevel === 'number') {
        cloudProgress.wordMastery[statsDoc.id] = data.masteryLevel as MasteryLevel;
      }

      if (
        srs &&
        typeof srs.lastReviewed === 'string' &&
        typeof srs.nextReviewAt === 'string' &&
        typeof srs.intervalDays === 'number'
      ) {
        cloudProgress.wordSRS[statsDoc.id] = {
          lastReviewed: srs.lastReviewed,
          nextReviewAt: srs.nextReviewAt,
          intervalDays: srs.intervalDays
        };
      }
    });

    // Merge by revision so the newest valid state wins.
    if (cloudProgress.revision > progressRef.current.revision) {
      setProgress(cloudProgress);
      progressRef.current = cloudProgress;
      commit(cloudProgress, true);
    } else if (progressRef.current.revision > (cloudProgress.revision || 0)) {
      // Local may contain study completed while signed out/offline.
      // Push the lightweight summary plus granular word state in bounded batches.
      await syncToCloud(uid, progressRef.current);
      await syncGranularProgress(uid, progressRef.current);
    }
  };

  const commit = useCallback((p: UserProgress, force = false) => {
    const result = saveVault(p, lastSeenRevisionRef.current, force);
    if (result.success) {
      const raw = localStorage.getItem(STABLE_KEY);
      if (raw) {
        const disk = JSON.parse(raw);
        lastSeenRevisionRef.current = disk.revision;
        isDirtyRef.current = false;
        setLastSavedAt(disk.updatedAt);
        
        // Trigger Cloud Sync if logged in
        if (user) {
          syncToCloud(user.uid, disk);
        }
      }
    } else if (result.reason === 'STALE_MEMORY_COLLISION') {
      const raw = localStorage.getItem(STABLE_KEY);
      if (raw) {
        const disk = JSON.parse(raw);
        setProgress(disk);
        lastSeenRevisionRef.current = disk.revision;
        isDirtyRef.current = false;
      }
    }
  }, [user]);

  const syncGranularProgress = async (uid: string, p: UserProgress) => {
    const entries = Object.entries(p.wordStats);
    const CHUNK_SIZE = 400;

    for (let start = 0; start < entries.length; start += CHUNK_SIZE) {
      const batch = writeBatch(db);
      const chunk = entries.slice(start, start + CHUNK_SIZE);

      chunk.forEach(([wordId, stat]) => {
        const statRef = doc(db, 'users', uid, 'wordStats', wordId);
        const srs = p.wordSRS[wordId];

        batch.set(statRef, {
          ...stat,
          ...(srs ? { srs } : {}),
          updatedAt: Date.now()
        }, { merge: true });
      });

      await batch.commit();
    }
  };

  const syncToCloud = async (uid: string, p: UserProgress) => {
    setSyncStatus('syncing');

    try {
      const userDocRef = doc(db, 'users', uid);
      const progressSummary = toCloudProgressSummary(p);

      // Keep the main user document small. Per-word mastery, stats, and SRS
      // are stored only in their granular subcollections.
      // mergeFields intentionally replaces the whole `progress` map while
      // preserving unrelated account fields such as createdAt.
      await setDoc(userDocRef, {
        email: auth.currentUser?.email || userEmail || null,
        progress: progressSummary,
        lastActive: new Date().toISOString()
      }, {
        mergeFields: ['email', 'progress', 'lastActive']
      });

      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        console.warn('Cloud sync restricted: local data will be used for this session.');
      } else {
        console.error('Cloud sync failed', e);
      }
      setSyncStatus('error');
    }
  };

  const handleWordResult = useCallback(async (
    wordId: string,
    term: string,
    isCorrect: boolean,
    newLevel: MasteryLevel
  ) => {
    const prev = progressRef.current;
    const currentStat = prev.wordStats[wordId] || {
      wordId,
      term,
      attempts: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      lastResult: 'none',
      lastSeenAt: 0,
      masteryLevel: 0
    };

    const updatedStat: WordStat = {
      ...currentStat,
      attempts: currentStat.attempts + 1,
      correct: currentStat.correct + (isCorrect ? 1 : 0),
      wrong: currentStat.wrong + (isCorrect ? 0 : 1),
      streak: isCorrect ? currentStat.streak + 1 : 0,
      lastResult: isCorrect ? 'correct' : 'wrong',
      lastSeenAt: Date.now(),
      masteryLevel: newLevel
    };

    const confidence =
      !isCorrect ? 'low' :
      updatedStat.streak >= 3 ? 'high' :
      'medium';

    const quality = reviewQualityFromResult(isCorrect, confidence);
    const updatedSRS = nextSRS(prev.wordSRS[wordId], quality);

    const next: UserProgress = {
      ...prev,
      wordMastery: { ...prev.wordMastery, [wordId]: newLevel },
      wordStats: { ...prev.wordStats, [wordId]: updatedStat },
      wordSRS: { ...prev.wordSRS, [wordId]: updatedSRS },
      updatedAt: Date.now()
    };

    setProgress(next);
    progressRef.current = next;
    isDirtyRef.current = true;

    if (user) {
      try {
        const statRef = doc(db, 'users', user.uid, 'wordStats', wordId);

        // Only the word that changed is written. Mastery is already part of
        // WordStat, so new writes do not duplicate data in the legacy collection.
        await setDoc(statRef, {
          ...updatedStat,
          srs: updatedSRS,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        console.error('Failed to push changed word data', e);
      }
    }
  }, [user]);

  const handleForgotPassword = async () => {
    if (!loginEmail.trim()) {
      setLoginError('Enter your email address first, then click Forgot Password.');
      return;
    }

    try {
      setLoginError(null);
      await sendPasswordResetEmail(auth, loginEmail.trim());

      alert(
        `Password reset email sent to ${loginEmail.trim()}.\n\nCheck your inbox and spam folder.`
      );
    } catch (e: any) {
      console.error('Password reset error:', e);

      if (e.code === 'auth/invalid-email') {
        setLoginError('Please enter a valid email address.');
      } else {
        setLoginError(e.message || 'Unable to send password reset email.');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    
    setLoginError(null);
    setIsLoggingIn(true);
    console.log("Attempting login for:", loginEmail);
    
    try {
      if (!auth) {
        throw new Error("Firebase Auth not initialized. Check your API key.");
      }
      
      if (isSignUp) {
        console.log("Creating new account...");
        const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        const newUser = userCredential.user;
        
        // Initialize Firestore with default progress for new account
        const userDocRef = doc(db, 'users', newUser.uid);
        await setDoc(userDocRef, {
          email: loginEmail,
          progress: toCloudProgressSummary(INITIAL_PROGRESS),
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
        
        // Also reset local state to defaults for the new user
        setProgress(INITIAL_PROGRESS);
        progressRef.current = INITIAL_PROGRESS;
      } else {
        console.log("Signing in...");
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      }
      console.log("Auth call successful.");
    } catch (e: any) {
      console.error("Auth error:", e);
      setLoginError(e.message || "Authentication failed.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  useEffect(() => {
    setTitanLibrary(GET_MASTER_CORE());

    const flush = () => {
      if (isDirtyRef.current) {
        commit(progressRef.current, true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, [commit]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const updateProgress = useCallback((updater: (prev: UserProgress) => UserProgress, isCritical = false) => {
    setProgress(prev => {
      const next = updater(prev);
      isDirtyRef.current = true;

      if (isCritical) {
        commit(next, true);
      } else {
        if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
        debounceTimer.current = window.setTimeout(() => {
          commit(progressRef.current);
        }, 1500);
      }
      return next;
    });
  }, [commit]);

  const handleXP = useCallback((amount: number) => {
    const today = getLocalKey();
    updateProgress(prev => {
      const currentLedger = prev.activityLedger[today] || { date: today, mastered: 0, reviewed: 0, xpGained: 0 };
      return {
        ...prev,
        xp: prev.xp + amount,
        credits: prev.credits + Math.floor(amount / 10), // Conversion: 10XP = 1 Credit
        activityLedger: {
          ...prev.activityLedger,
          [today]: {
            ...currentLedger,
            xpGained: currentLedger.xpGained + amount
          }
        }
      };
    }, false);
  }, [updateProgress]);

  const handleWordUpdate = useCallback((id: string, newLevel: MasteryLevel, term: string, isCorrect: boolean = true) => {
    const today = getLocalKey();
    
    // 1. Record granular result
    handleWordResult(id, term, isCorrect, newLevel);

    updateProgress(prev => {
      const oldLevel = prev.wordMastery[id] || 0;
      const reachedMastery = newLevel === 3 && oldLevel < 3;
      const xpGained = newLevel > oldLevel ? (newLevel - oldLevel) * XP_PER_WORD_UPGRADE : 5;
      
      const currentLedger = prev.activityLedger[today] || { date: today, mastered: 0, reviewed: 0, xpGained: 0 };
      const oldDailyMastered = currentLedger.mastered;
      const newDailyMastered = oldDailyMastered + (reachedMastery ? 1 : 0);

      if (reachedMastery && oldDailyMastered < prev.dailyMasteryGoal && newDailyMastered >= prev.dailyMasteryGoal) {
        setCelebration(true);
      }

      setSessionResults(curr => ({
        mastered: curr.mastered + (reachedMastery ? 1 : 0),
        reviews: curr.reviews + 1,
        xp: curr.xp + xpGained
      }));

      return {
        ...prev,
        wordMastery: { ...prev.wordMastery, [id]: newLevel },
        xp: prev.xp + xpGained,
        credits: prev.credits + (reachedMastery ? 50 : 0),
        activityLedger: {
          ...prev.activityLedger,
          [today]: {
            ...currentLedger,
            mastered: newDailyMastered,
            reviewed: currentLedger.reviewed + 1,
            xpGained: currentLedger.xpGained + xpGained
          }
        }
      };
    }, false);
  }, [updateProgress]);

  const startSmartReview = useCallback((customWords?: Word[]) => {
    const smartWords = customWords || buildSmartReview(
      fullLibrary,
      progressRef.current,
      20
    );
    setSessionWords(smartWords);
    setScreen(AppScreen.LEARN);
  }, [fullLibrary]);

  const handleDiagnosticComplete = useCallback((result: DiagnosticResult) => {
    updateProgress(prev => ({
      ...prev,
      diagnosticScore: result.readinessScore,
      diagnosticEstimatedKnownWords: result.estimatedKnownWords,
      diagnosticCorrect: result.correct,
      diagnosticTotal: result.total,
      diagnosticWeakestDomain: result.weakestDomain,
      diagnosticCompletedAt: result.completedAt,
      recommendedDailyWords: result.recommendedDailyWords,
      dailyMasteryGoal: result.recommendedDailyWords
    }), true);
    setScreen(AppScreen.DASHBOARD);
  }, [updateProgress]);

  const mobileLearningStats = useMemo(() => {
    const now = Date.now();
    const dueWords = Object.values(progress.wordSRS || {}).filter(srs => {
      const dueAt = Date.parse(srs.nextReviewAt);
      return Number.isFinite(dueAt) && dueAt <= now;
    }).length;

    const mastered = Object.values(progress.wordMastery || {})
      .filter(level => level === 3).length;

    const weakWords = Object.values(progress.wordStats || {})
      .filter(stat => stat.wrong > 0)
      .sort((a, b) => {
        if (b.wrong !== a.wrong) return b.wrong - a.wrong;
        return a.correct - b.correct;
      })
      .slice(0, 3);

    let weeklyMastered = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      weeklyMastered += Number(progress.activityLedger?.[key]?.mastered || 0);
    }

    const weeklyGoal = Math.max(1, Number(progress.weeklyMasteryGoal || 50));
    const weeklyPercent = Math.min(100, Math.round((weeklyMastered / weeklyGoal) * 100));

    const recommendedCount = dueWords > 0 ? Math.min(dueWords, 20) : 20;
    const estimatedMinutes = Math.max(3, Math.ceil(recommendedCount * 0.4));

    return {
      dueWords,
      mastered,
      weakWords,
      weeklyMastered,
      weeklyGoal,
      weeklyPercent,
      estimatedMinutes
    };
  }, [progress]);

  const showMobileNav = [
    AppScreen.DASHBOARD,
    AppScreen.STUDY_SETUP,
    AppScreen.GAME_HUB,
    AppScreen.WORD_BANK,
    AppScreen.QUIZ
  ].includes(screen as AppScreen);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden relative">
      
      {/* Login Overlay - Highest Priority */}
      <AnimatePresence>
        {(!userEmail) && (
          <motion.div 
            key="login-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -100, scale: 1.1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[999999] bg-slate-950 flex items-center justify-center p-4 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl space-y-10 relative overflow-hidden border border-white/20"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-rose-600"></div>
              
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-black text-5xl shadow-2xl mx-auto rotate-6 animate-titan">V</div>
                <div className="space-y-2">
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Vocab<span className="text-indigo-600">Vantage</span></h2>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">SAT Vocabulary Mastery</p>
                </div>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">Learn the right words, review them at the right time, and keep your progress synced across devices.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {loginError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs font-bold animate-shake">
                    Warning: {loginError}
                  </div>
                )}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Email Address</label>
                  <div className="relative">
                    <User className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                    <input 
                      type="email" 
                      placeholder="student@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full pl-20 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-black text-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">
                    Password
                  </label>

                  <div className="relative">
                    <LogIn
                      className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300"
                      size={24}
                    />

                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full pl-20 pr-20 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-black text-xl text-slate-900"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>

                  {!isSignUp && (
                    <div className="text-right px-3">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    type="submit" 
                    disabled={isLoggingIn}
                    className="w-full py-7 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {isLoggingIn ? <Loader2 className="animate-spin" size={24} /> : <LogIn size={24} />}
                    {isLoggingIn ? 'Signing in...' : isSignUp ? 'Create Account' : 'Sign In'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      console.log("Entering Guest Mode...");
                      setUserEmail('guest_user');
                    }}
                    className="w-full py-6 bg-indigo-50 text-indigo-600 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] border border-indigo-100 hover:bg-indigo-100 transition-all"
                  >
                    Continue as Guest
                  </button>
                </div>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "New here? Create Account"}
                  </button>
                </div>
              </form>

              <div className="pt-8 border-t border-slate-50 text-center space-y-6">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Your progress can sync across devices</p>
                <button 
                  type="button"
                  onClick={() => {
                    setUserEmail('guest');
                  }}
                  className="text-[11px] text-indigo-600 font-black uppercase tracking-widest hover:text-indigo-800 transition-colors bg-indigo-50 px-6 py-3 rounded-xl border border-indigo-100"
                >
                  Continue as Guest (No Sync)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {celebration && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
          <div className="bg-white/90 backdrop-blur-3xl p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-indigo-200 text-center animate-in zoom-in-50 fade-in duration-500 pointer-events-auto max-w-sm w-full">
            <div className="text-6xl md:text-8xl mb-4 md:mb-6">&#127942;</div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Goal Achieved!</h2>
            <p className="text-indigo-600 font-bold mt-2 uppercase tracking-widest text-[10px] md:text-xs">You reached today's mastery goal</p>
            <button onClick={() => setCelebration(false)} className="mt-8 md:mt-10 w-full md:w-auto px-10 md:px-12 py-4 md:py-5 bg-slate-900 text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-black transition-all">Keep Learning</button>
          </div>
        </div>
      )}

      <nav className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 sticky top-0 z-50 h-16 md:h-24 shadow-2xl flex items-center px-4 md:px-6 border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center space-x-3 md:space-x-5 cursor-pointer group" onClick={() => setScreen(AppScreen.DASHBOARD)}>
            <div className="w-9 h-9 md:w-12 md:h-12 bg-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-xl transition-transform group-hover:rotate-12">V</div>
            <span className="font-black text-lg md:text-3xl tracking-tighter text-white group-hover:text-indigo-400 transition-colors">VocabVantage</span>
          </div>
          <div className="flex items-center space-x-4 md:space-x-8">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-xl border border-slate-800">
              {syncStatus === 'syncing' ? <Loader2 className="animate-spin text-indigo-400" size={14} /> : 
               syncStatus === 'success' ? <CheckCircle2 className="text-emerald-400" size={14} /> :
               syncStatus === 'error' ? <AlertTriangle className="text-rose-400" size={14} /> :
               <CloudSync className="text-slate-500" size={14} />}
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {syncStatus === 'syncing' ? 'Syncing' : syncStatus === 'success' ? 'Synced' : syncStatus === 'error' ? 'Sync Error' : 'Cloud Active'}
              </span>
            </div>
            <div className="flex flex-col items-end leading-tight text-white font-black">
               <div className="flex items-center gap-2 mb-1">
                 <User size={12} className="text-indigo-400" />
                 <span className="text-[10px] text-slate-400 truncate max-w-[150px] lowercase tracking-tight">
                   <span className="md:hidden">
                     {(!userEmail || userEmail === 'guest') ? 'Guest' : 'Signed in'}
                   </span>
                   <span className="hidden md:inline">
                     {(!userEmail || userEmail === 'guest') ? 'Guest Mode' : userEmail}
                   </span>
                 </span>
               </div>
               <span className="text-lg md:text-2xl">{progress.xp.toLocaleString()} <span className="text-[8px] md:text-[10px] text-slate-500 uppercase">XP</span></span>
               <div className="flex items-center gap-2">
                 <span className="text-indigo-400 text-[8px] md:text-[10px] uppercase tracking-widest">Rev {lastSeenRevisionRef.current}</span>
                 {(user && userEmail !== 'guest') ? (
                   <button onClick={handleLogout} className="p-1 bg-slate-900 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Logout / Switch User">
                     <LogOut size={12} />
                   </button>
                 ) : (
                   <button 
                     onClick={() => {
                       setUserEmail(null);
                     }} 
                     className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[8px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg animate-pulse" 
                     title="Login to Sync"
                   >
                     Login
                   </button>
                 )}
               </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto p-4 pb-28 md:p-12 w-full overflow-x-hidden">
        {screen === AppScreen.DASHBOARD && (
          <>
            <section className="md:hidden space-y-5 pb-24">
              <div className="pt-2">
                <p className="text-sm font-bold text-slate-400">Your SAT vocabulary plan</p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                  Ready for today's review?
                </h1>
              </div>

              <button
                onClick={() => setScreen('DIAGNOSTIC')}
                className="w-full bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">SAT Vocabulary Readiness</p>
                    {typeof progress.diagnosticScore === 'number' ? (
                      <>
                        <p className="text-4xl font-black text-slate-900 mt-1">{progress.diagnosticScore}<span className="text-lg text-slate-400">/100</span></p>
                        <p className="text-xs text-slate-500 mt-1">
                          ~{(progress.diagnosticEstimatedKnownWords || 0).toLocaleString()} words estimated | Focus: {progress.diagnosticWeakestDomain || 'General'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xl font-black text-slate-900 mt-1">Take your 5-minute placement test</p>
                        <p className="text-xs text-slate-500 mt-1">Get a personalized daily study plan.</p>
                      </>
                    )}
                  </div>
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </button>

              <button
                onClick={() => startSmartReview()}
                className="w-full text-left bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-[2rem] p-5 shadow-xl active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-100">
                      Smart Review
                    </p>
                    <p className="text-4xl font-black mt-2">
                      {mobileLearningStats.dueWords > 0
                        ? `${mobileLearningStats.dueWords} due`
                        : '20 recommended'}
                    </p>
                    <p className="text-sm text-indigo-100 mt-2">
                      Adaptive practice based on what you are most likely to forget.
                    </p>
                    <p className="text-xs font-bold text-indigo-100/90 mt-2">
                      About {mobileLearningStats.estimatedMinutes} min
                      {typeof progress.recommendedDailyWords === 'number' ? ` | Goal: ${progress.recommendedDailyWords} words/day` : ''}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                    <ChevronRight size={28} />
                  </div>
                </div>
                <div className="mt-4 bg-white text-indigo-700 rounded-2xl py-3.5 text-center font-black">
                  START REVIEW
                </div>
              </button>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <p className="text-2xl font-black text-slate-900">
                    {mobileLearningStats.mastered}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">
                    Mastered
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <p className="text-2xl font-black text-indigo-600">
                    {mobileLearningStats.dueWords}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">
                    Due Today
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <p className="text-2xl font-black text-orange-500">
                    {progress.streak}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">
                    Day Streak
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-black text-slate-900">Weekly goal</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {mobileLearningStats.weeklyMastered} of {mobileLearningStats.weeklyGoal} words mastered
                    </p>
                  </div>
                  <p className="text-sm font-black text-indigo-600">
                    {mobileLearningStats.weeklyPercent}%
                  </p>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${mobileLearningStats.weeklyPercent}%` }}
                  />
                </div>
              </div>

              {mobileLearningStats.weakWords.length > 0 && (
                <div className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-black text-slate-900">Words to strengthen</p>
                      <p className="text-xs text-slate-400 mt-1">Your most-missed words</p>
                    </div>
                    <button
                      onClick={() => setScreen(AppScreen.WORD_BANK)}
                      className="text-xs font-black text-indigo-600"
                    >
                      VIEW ALL
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {mobileLearningStats.weakWords.map(stat => (
                      <span
                        key={stat.wordId}
                        className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-sm font-bold"
                      >
                        {stat.term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-black text-slate-900 mb-3">Quick practice</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setScreen(AppScreen.STUDY_SETUP)}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-left"
                  >
                    <BookOpen className="text-indigo-600" size={24} />
                    <p className="font-black text-slate-900 mt-3">Customize</p>
                    <p className="text-xs text-slate-400 mt-1">Choose level & topic</p>
                  </button>
                  <button
                    onClick={() => setScreen(AppScreen.GAME_HUB)}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-left"
                  >
                    <Gamepad2 className="text-violet-600" size={24} />
                    <p className="font-black text-slate-900 mt-3">Play Games</p>
                    <p className="text-xs text-slate-400 mt-1">Practice for XP</p>
                  </button>
                </div>
              </div>
            </section>

            <div className="hidden md:block">
              <Dashboard 
                words={fullLibrary}
                progress={progress} 
                lastSavedAt={lastSavedAt}
                bootLog={bootData.logs}
                onNavigate={setScreen} 
                onUpdateGoal={(type, val) => updateProgress(prev => ({ ...prev, [type]: val }), true)}
                onQuickStart={startSmartReview}
                onReset={() => {
              if (window.confirm("Nuclear Reset? All data will be wiped.")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            onExport={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progress));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", `vault_v20_sentinel.json`);
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
                onRunQA={async () => {
                  const results = await runPersistenceQA();
                  alert(results.map(r => `[${r.status}] ${r.name}`).join('\n'));
                }}
              />
            </div>
          </>
        )}
        {screen === 'DIAGNOSTIC' && (
          <DiagnosticAssessment
            words={fullLibrary}
            onComplete={handleDiagnosticComplete}
            onBack={() => setScreen(AppScreen.DASHBOARD)}
          />
        )}
        {screen === AppScreen.LEARN && (
          <Flashcards 
            words={sessionWords} 
            currentMastery={progress.wordMastery} 
            onWordUpdate={handleWordUpdate} 
            onWordPropertyUpdate={(id, updates) => updateProgress(prev => ({
              ...prev,
              customWords: (prev.customWords || []).map(w => w.id === id ? { ...w, ...updates } : w)
            }), false)} 
            onBack={() => setScreen('SUMMARY')} 
          />
        )}
        {screen === AppScreen.GAME_HUB && (
          <GameHub 
            words={fullLibrary} 
            onBack={() => setScreen(AppScreen.DASHBOARD)} 
            onXP={handleXP}
            onNavigate={setScreen}
          />
        )}
        {screen === AppScreen.QUIZ && (
          <Quiz 
            words={fullLibrary} 
            onFinish={(score) => {
              handleXP(score * 10);
              setSessionResults({ mastered: 0, reviews: 10, xp: score * 10 });
              setScreen('SUMMARY');
            }} 
            onWordResult={(id, term, isCorrect) => {
              const currentLevel = progress.wordMastery[id] || 0;
              // Quiz doesn't automatically upgrade level, but records the attempt
              handleWordResult(id, term, isCorrect, currentLevel);
            }}
            onBack={() => setScreen(AppScreen.DASHBOARD)} 
          />
        )}
        {screen === 'SUMMARY' && <SessionSummary results={sessionResults} onContinue={() => setScreen(AppScreen.DASHBOARD)} />}
        {screen === AppScreen.WORD_BANK && (
          <WordBank 
            words={fullLibrary} 
            progress={progress.wordMastery} 
            onImport={(newWords) => {
              updateProgress(prev => ({
                ...prev,
                customWords: [...(prev.customWords || []), ...newWords]
              }), true);
            }} 
            onDelete={(ids) => {
              updateProgress(prev => ({
                ...prev,
                customWords: (prev.customWords || []).filter(w => !ids.includes(w.id))
              }), true);
            }} 
            onClose={() => setScreen(AppScreen.DASHBOARD)} 
          />
        )}
        {screen === AppScreen.STUDY_SETUP && (
          <StudySessionSetup 
            words={fullLibrary} 
            progress={progress.wordMastery} 
            lastConfig={progress.lastConfig} 
            onBack={() => setScreen(AppScreen.DASHBOARD)} 
            onStart={(w, cfg) => { 
              setSessionWords(w); 
              updateProgress(prev => ({ ...prev, lastConfig: cfg }), true);
              setScreen(AppScreen.LEARN); 
            }} 
          />
        )}
      </main>

      {showMobileNav && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-5 max-w-lg mx-auto">
            {[
              { id: AppScreen.DASHBOARD, label: 'Home', icon: Home },
              { id: AppScreen.STUDY_SETUP, label: 'Learn', icon: BookOpen },
              { id: AppScreen.GAME_HUB, label: 'Games', icon: Gamepad2 },
              { id: AppScreen.WORD_BANK, label: 'Words', icon: LibraryBig },
              { id: AppScreen.QUIZ, label: 'Quiz', icon: ClipboardList }
            ].map(item => {
              const Icon = item.icon;
              const active = screen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setScreen(item.id)}
                  className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-colors ${
                    active ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                  aria-label={item.label}
                >
                  <Icon size={21} strokeWidth={active ? 2.8 : 2} />
                  <span className="text-[10px] font-black">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
    </ErrorBoundary>
  );
};
export default App;

