import React, { useEffect, useMemo, useState } from 'react';
import { Word } from '../types';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

interface Props { words: Word[]; onBack: () => void; onXP: (amount: number, gameId?: string, score?: number) => void; }
interface Member { id: string; displayName: string; totalScore: number; rounds: number; bestRound: number; }

type Mode = 'lobby' | 'play' | 'results';
const makeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const shuffle = <T,>(items: T[]) => {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

const FriendsCompetition: React.FC<Props> = ({ words, onBack, onXP }) => {
  const user = auth.currentUser;
  const [code, setCode] = useState('');
  const [name, setName] = useState(user?.displayName || user?.email?.split('@')[0] || 'Player');
  const [members, setMembers] = useState<Member[]>([]);
  const [mode, setMode] = useState<Mode>('lobby');
  const [roundWords, setRoundWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [message, setMessage] = useState('');

  const current = roundWords[index];
  const options = useMemo(() => {
    if (!current) return [];
    const distractors = shuffle(words.filter(w => w.id !== current.id && w.definition !== current.definition)).slice(0, 3).map(w => w.definition);
    return shuffle([current.definition, ...distractors]);
  }, [current?.id]);

  const refresh = async (roomCode = code) => {
    if (!roomCode) return;
    const snap = await getDocs(collection(db, 'competitions', roomCode, 'members'));
    const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Member, 'id'>) }));
    setMembers(data.sort((a, b) => b.totalScore - a.totalScore));
  };

  const joinRoom = async (roomCode: string) => {
    if (!user) { setMessage('Sign in to compete with friends.'); return; }
    const normalized = roomCode.trim().toUpperCase();
    const roomRef = doc(db, 'competitions', normalized);
    const room = await getDoc(roomRef);
    if (!room.exists()) { setMessage('Competition code not found.'); return; }
    await setDoc(doc(db, 'competitions', normalized, 'members', user.uid), {
      displayName: name || 'Player', totalScore: 0, rounds: 0, bestRound: 0, joinedAt: serverTimestamp()
    }, { merge: true });
    setCode(normalized); setMessage('Joined!'); await refresh(normalized);
  };

  const createRoom = async () => {
    if (!user) { setMessage('Sign in to create a competition.'); return; }
    const roomCode = makeCode();
    await setDoc(doc(db, 'competitions', roomCode), { ownerId: user.uid, createdAt: serverTimestamp(), status: 'active' });
    setCode(roomCode);
    await joinRoom(roomCode);
  };

  const startRound = () => {
    if (!code) { setMessage('Create or join a competition first.'); return; }
    setRoundWords(shuffle(words).slice(0, 10));
    setIndex(0); setScore(0); setStartedAt(Date.now()); setMode('play'); setMessage('');
  };

  const answer = async (choice: string) => {
    if (!current) return;
    const correct = choice === current.definition;
    const elapsed = Math.max(1, (Date.now() - startedAt) / 1000);
    const speedBonus = correct ? Math.max(0, Math.round(5 - elapsed / 15)) : 0;
    const nextScore = score + (correct ? 10 + speedBonus : 0);
    setScore(nextScore);
    if (index < roundWords.length - 1) { setIndex(i => i + 1); return; }

    if (user) {
      const memberRef = doc(db, 'competitions', code, 'members', user.uid);
      const member = await getDoc(memberRef);
      const prevBest = member.exists() ? Number(member.data().bestRound || 0) : 0;
      await updateDoc(memberRef, {
        totalScore: increment(nextScore), rounds: increment(1), bestRound: Math.max(prevBest, nextScore), lastPlayedAt: serverTimestamp()
      });
      await refresh();
    }
    onXP(Math.floor(nextScore / 2), 'friends', nextScore);
    setMode('results');
  };

  useEffect(() => { if (code) refresh(); }, [code]);

  if (mode === 'play' && current) return (
    <div className="max-w-2xl mx-auto bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl space-y-8">
      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400"><span>Friend Challenge</span><span>{index + 1}/10</span></div>
      <div><p className="text-sm text-indigo-500 font-black uppercase tracking-widest">Choose the best definition</p><h2 className="text-5xl font-black mt-3">{current.term}</h2></div>
      <div className="grid gap-3">{options.map((o, i) => <button key={i} onClick={() => answer(o)} className="p-5 text-left rounded-2xl border-2 border-slate-100 hover:border-indigo-500 font-semibold">{o}</button>)}</div>
      <p className="text-right text-sm font-black">Score: {score}</p>
    </div>
  );

  if (mode === 'results') return (
    <div className="max-w-3xl mx-auto bg-white rounded-[3rem] p-10 shadow-2xl space-y-8 text-center">
      <div className="text-6xl">🏆</div><h2 className="text-4xl font-black">Round Complete</h2><p className="text-6xl font-black text-indigo-600">{score}</p>
      <div className="flex gap-3"><button onClick={startRound} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black">PLAY AGAIN</button><button onClick={() => setMode('lobby')} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black">LEADERBOARD</button></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4">
      <header className="text-center"><div className="text-6xl">🏆</div><h2 className="text-4xl font-black mt-3">Friends Competition</h2><p className="text-slate-500 mt-2">Create a private room, share the 6-character code, and compete in 10-question SAT vocabulary rounds.</p></header>
      {!user && <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-bold">You can browse this mode as a guest, but sign in to create, join, and save scores.</div>}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl grid md:grid-cols-3 gap-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Display name" className="p-4 bg-slate-50 rounded-2xl border" />
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Room code" maxLength={6} className="p-4 bg-slate-50 rounded-2xl border font-black tracking-widest" />
        <div className="flex gap-2"><button onClick={() => joinRoom(code)} className="flex-1 bg-slate-900 text-white rounded-2xl font-black">JOIN</button><button onClick={createRoom} className="flex-1 bg-indigo-600 text-white rounded-2xl font-black">CREATE</button></div>
      </div>
      {message && <p className="text-center font-bold text-indigo-600">{message}</p>}
      {code && <div className="text-center"><p className="text-xs uppercase tracking-widest text-slate-400 font-black">Share this code</p><p className="text-4xl font-black tracking-[0.3em] mt-2">{code}</p></div>}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl"><div className="flex justify-between items-center mb-5"><h3 className="text-2xl font-black">Leaderboard</h3><button onClick={() => refresh()} className="text-xs font-black text-indigo-600">REFRESH</button></div>
        <div className="space-y-3">{members.length === 0 ? <p className="text-slate-400">No players yet.</p> : members.map((m, i) => <div key={m.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50"><div className="font-black"><span className="mr-3">#{i+1}</span>{m.displayName}</div><div className="text-right"><p className="font-black text-indigo-600">{m.totalScore} pts</p><p className="text-[10px] text-slate-400">Best {m.bestRound} · {m.rounds} rounds</p></div></div>)}</div>
      </div>
      <button onClick={startRound} disabled={!code} className="w-full py-6 bg-indigo-600 disabled:bg-slate-300 text-white rounded-3xl font-black text-lg">START 10-QUESTION ROUND</button>
      <button onClick={onBack} className="block mx-auto text-slate-400 font-black">Back to Games</button>
    </div>
  );
};
export default FriendsCompetition;
