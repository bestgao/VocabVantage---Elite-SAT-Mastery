
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { UserProgress, AppScreen, MasteryLevel, Word, WordStat } from './types';
import { GET_MASTER_CORE } from './database';
import { XP_PER_WORD_UPGRADE } from './constants';
import { STABLE_KEY, saveVault, BootResult, runPersistenceQA, INITIAL_PROGRESS, deepHydrate } from './persistence';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  writeBatch,
  increment,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import Dashboard from './components/Dashboard';
import Flashcards from './components/Flashcards';
import WordBank from './components/WordBank';
import StudySessionSetup from './components/StudySessionSetup';
import SessionSummary from './components/SessionSummary';
import GameHub from './components/GameHub';
import Quiz from './components/Quiz';
import { LogIn, User, CloudSync, AlertTriangle, CheckCircle2, Loader2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppProps {
  bootData: BootResult;
}

const getLocalKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
  const [screen, setScreen] = useState<AppScreen | 'SUMMARY'>(AppScreen.DASHBOARD);
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
    
    let cloudProgress = { ...INITIAL_PROGRESS };
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      // Use Neural Shield Deep Hydration to merge cloud data safely
      // This ensures no data is lost during app version upgrades
      cloudProgress = deepHydrate(INITIAL_PROGRESS, data.progress || data);
    }

    // Fetch word mastery subcollection (Legacy)
    const progressCollRef = collection(db, 'users', uid, 'progress');
    const progressSnap = await getDocs(progressCollRef);
    
    progressSnap.forEach((doc) => {
      cloudProgress.wordMastery[doc.id] = doc.data().level as MasteryLevel;
    });

    // Fetch granular word stats (New)
    const statsCollRef = collection(db, 'users', uid, 'wordStats');
    const statsSnap = await getDocs(statsCollRef);
    statsSnap.forEach((doc) => {
      cloudProgress.wordStats[doc.id] = doc.data() as WordStat;
      // Also update wordMastery for backward compatibility
      cloudProgress.wordMastery[doc.id] = doc.data().masteryLevel as MasteryLevel;
    });

    // Merge logic: If cloud is newer, update local
    if (cloudProgress.revision > progressRef.current.revision) {
      setProgress(cloudProgress);
      commit(cloudProgress, true);
    } else if (progressRef.current.revision > (cloudProgress.revision || 0)) {
      // Local is newer, push to cloud
      await syncToCloud(uid, progressRef.current);
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

  const syncToCloud = async (uid: string, p: UserProgress) => {
    setSyncStatus('syncing');
    try {
      const batch = writeBatch(db);
      
      // 1. Update general stats
      const userDocRef = doc(db, 'users', uid);
      const { wordMastery, ...generalStats } = p;
      batch.set(userDocRef, generalStats, { merge: true });

      // 2. Update word stats (Granular)
      Object.entries(p.wordStats).forEach(([wordId, stat]) => {
        const statDocRef = doc(db, 'users', uid, 'wordStats', wordId);
        batch.set(statDocRef, { ...stat, updatedAt: Date.now() }, { merge: true });
      });

      // 3. Legacy word mastery sync (for backward compatibility)
      Object.entries(p.wordMastery).forEach(([wordId, level]) => {
        const wordDocRef = doc(db, 'users', uid, 'progress', wordId);
        batch.set(wordDocRef, { level, updatedAt: Date.now() });
      });

      await batch.commit();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        console.warn("Cloud sync restricted: Local data will be used for this session.");
      } else {
        console.error("Cloud sync failed", e);
      }
      setSyncStatus('error');
    }
  };

  // Firestore Sync Logic
  useEffect(() => {
    if (userEmail && userEmail !== 'guest_user' && auth.currentUser) {
      const syncProgress = async () => {
        try {
          const userDoc = doc(db, "users", auth.currentUser!.uid);
          await setDoc(userDoc, {
            email: userEmail,
            progress: progress,
            lastActive: new Date().toISOString()
          }, { merge: true });
          console.log("Cloud Sync Successful");
        } catch (e: any) {
          if (e.code === 'permission-denied') {
            // Silently fail as the main syncToCloud handles the warning
          } else {
            console.error("Cloud Sync Failed:", e);
          }
        }
      };
      syncProgress();
    }
  }, [progress, userEmail]);
  const handleWordResult = useCallback(async (wordId: string, term: string, isCorrect: boolean, newLevel: MasteryLevel) => {
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

    const next: UserProgress = {
      ...prev,
      wordMastery: { ...prev.wordMastery, [wordId]: newLevel },
      wordStats: { ...prev.wordStats, [wordId]: updatedStat },
      updatedAt: Date.now()
    };

    setProgress(next);
    progressRef.current = next;
    isDirtyRef.current = true;

    // Background push to Firestore if logged in
    if (user) {
      try {
        const statRef = doc(db, 'users', user.uid, 'wordStats', wordId);
        await setDoc(statRef, {
          ...updatedStat,
          lastSeenAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.error("Failed to push granular word stat", e);
      }
    }
  }, [user]);

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
          progress: INITIAL_PROGRESS,
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

    window.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    
    return () => {
      window.removeEventListener('visibilitychange', flush);
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
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">Titan <span className="text-indigo-600">Sync</span></h2>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Neural Persistence Protocol</p>
                </div>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">Synchronize your 2,280-word mastery across all devices. Enter your email to establish a secure link.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {loginError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs font-bold animate-shake">
                    ⚠️ {loginError}
                  </div>
                )}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Email Address</label>
                  <div className="relative">
                    <User className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                    <input 
                      type="email" 
                      placeholder="commander@titan.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full pl-20 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-black text-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3">Password</label>
                  <div className="relative">
                    <LogIn className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full pl-20 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-black text-xl text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    type="submit" 
                    disabled={isLoggingIn}
                    className="w-full py-7 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {isLoggingIn ? <Loader2 className="animate-spin" size={24} /> : <LogIn size={24} />}
                    {isLoggingIn ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      console.log("Entering Guest Mode...");
                      setUserEmail('guest_user');
                    }}
                    className="w-full py-6 bg-indigo-50 text-indigo-600 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] border border-indigo-100 hover:bg-indigo-100 transition-all"
                  >
                    🚀 Continue as Guest
                  </button>
                </div>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "New Commander? Create Account"}
                  </button>
                </div>
              </form>

              <div className="pt-8 border-t border-slate-50 text-center space-y-6">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Cross-Platform Persistence Active</p>
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
            <div className="text-6xl md:text-8xl mb-4 md:mb-6">🏆</div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Goal Achieved!</h2>
            <p className="text-indigo-600 font-bold mt-2 uppercase tracking-widest text-[10px] md:text-xs">Daily Mastery Threshold Cleared</p>
            <button onClick={() => setCelebration(false)} className="mt-8 md:mt-10 w-full md:w-auto px-10 md:px-12 py-4 md:py-5 bg-slate-900 text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-black transition-all">Continue Excellence</button>
          </div>
        </div>
      )}

      <nav className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 sticky top-0 z-50 h-20 md:h-24 shadow-2xl flex items-center px-4 md:px-6 border-b border-indigo-500/20">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center space-x-3 md:space-x-5 cursor-pointer group" onClick={() => setScreen(AppScreen.DASHBOARD)}>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-xl transition-transform group-hover:rotate-12">V</div>
            <span className="font-black text-xl md:text-3xl tracking-tighter text-white group-hover:text-indigo-400 transition-colors">VocabVantage</span>
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
                   {(!userEmail || userEmail === 'guest') ? 'Guest Mode' : userEmail}
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

      <main className="flex-1 max-w-7xl mx-auto p-4 md:p-12 w-full overflow-x-hidden">
        {screen === AppScreen.DASHBOARD && (
          <Dashboard 
            words={fullLibrary}
            progress={progress} 
            lastSavedAt={lastSavedAt}
            bootLog={bootData.logs}
            onNavigate={setScreen} 
            onUpdateGoal={(type, val) => updateProgress(prev => ({ ...prev, [type]: val }), true)}
            onQuickStart={(customWords) => {
              setSessionWords(customWords || fullLibrary.sort(() => 0.5 - Math.random()).slice(0, 20));
              setScreen(AppScreen.LEARN);
            }} 
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
    </div>
    </ErrorBoundary>
  );
};
export default App;
