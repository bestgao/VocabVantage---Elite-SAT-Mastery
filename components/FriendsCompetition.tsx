import React, { useEffect, useMemo, useState } from 'react';
import { Word } from '../types';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

interface Props {
  words: Word[];
  onBack: () => void;
  onXP: (amount: number, gameId?: string, score?: number) => void;
}

interface Member {
  id: string;
  displayName: string;
  totalScore: number;
  rounds: number;
  bestRound: number;
}

type Mode = 'lobby' | 'play' | 'results';

const makeCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

const shuffle = <T,>(items: T[]) => {
  const a = [...items];

  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
};

const FriendsCompetition: React.FC<Props> = ({
  words,
  onBack,
  onXP
}) => {
  const user = auth.currentUser;

  const [code, setCode] = useState('');
  const [name, setName] = useState(
    user?.displayName ||
      user?.email?.split('@')[0] ||
      'Player'
  );

  const [members, setMembers] = useState<Member[]>([]);
  const [mode, setMode] = useState<Mode>('lobby');
  const [roundWords, setRoundWords] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [message, setMessage] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const current = roundWords[index];

  const options = useMemo(() => {
    if (!current) return [];

    const distractors = shuffle(
      words.filter(
        w =>
          w.id !== current.id &&
          w.definition !== current.definition
      )
    )
      .slice(0, 3)
      .map(w => w.definition);

    return shuffle([current.definition, ...distractors]);
  }, [current?.id, words]);

  // Live leaderboard subscription.
  useEffect(() => {
    if (!code) {
      setMembers([]);
      return;
    }

    const normalized = code.trim().toUpperCase();
    const membersRef = collection(
      db,
      'competitions',
      normalized,
      'members'
    );

    const unsubscribe = onSnapshot(
      membersRef,
      snapshot => {
        const data = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Member, 'id'>)
        }));

        setMembers(
          data.sort((a, b) => {
            if (b.totalScore !== a.totalScore) {
              return b.totalScore - a.totalScore;
            }
            return b.bestRound - a.bestRound;
          })
        );
      },
      error => {
        console.error('Leaderboard listener failed:', error);
        setMessage(
          'Unable to load the leaderboard. Check your connection and Firestore permissions.'
        );
      }
    );

    return () => unsubscribe();
  }, [code]);

  const joinRoom = async (roomCode: string) => {
    if (!user) {
      setMessage('Sign in to compete with friends.');
      return;
    }

    const normalized = roomCode.trim().toUpperCase();

    if (normalized.length !== 6) {
      setMessage('Enter a valid 6-character competition code.');
      return;
    }

    setIsWorking(true);
    setMessage('');

    try {
      const roomRef = doc(db, 'competitions', normalized);
      const room = await getDoc(roomRef);

      if (!room.exists()) {
        setMessage('Competition code not found.');
        return;
      }

      const memberRef = doc(
        db,
        'competitions',
        normalized,
        'members',
        user.uid
      );

      const existingMember = await getDoc(memberRef);

      // IMPORTANT:
      // Existing scores are preserved when a player rejoins.
      if (existingMember.exists()) {
        await setDoc(
          memberRef,
          {
            displayName: name.trim() || 'Player',
            lastJoinedAt: serverTimestamp()
          },
          { merge: true }
        );
      } else {
        await setDoc(memberRef, {
          displayName: name.trim() || 'Player',
          totalScore: 0,
          rounds: 0,
          bestRound: 0,
          joinedAt: serverTimestamp(),
          lastJoinedAt: serverTimestamp()
        });
      }

      setCode(normalized);
      setMessage('Joined competition.');
    } catch (error) {
      console.error('Join competition failed:', error);
      setMessage(
        'Unable to join this competition. Check Firestore permissions and try again.'
      );
    } finally {
      setIsWorking(false);
    }
  };

  const createRoom = async () => {
    if (!user) {
      setMessage('Sign in to create a competition.');
      return;
    }

    setIsWorking(true);
    setMessage('');

    try {
      let roomCode = '';
      let roomRef;

      // Very small collision risk, but verify before creating.
      for (let attempt = 0; attempt < 5; attempt++) {
        roomCode = makeCode();
        roomRef = doc(db, 'competitions', roomCode);
        const existing = await getDoc(roomRef);

        if (!existing.exists()) {
          break;
        }

        roomCode = '';
      }

      if (!roomCode || !roomRef) {
        throw new Error(
          'Could not generate a unique competition code.'
        );
      }

      await setDoc(roomRef, {
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        status: 'active'
      });

      setCode(roomCode);

      const memberRef = doc(
        db,
        'competitions',
        roomCode,
        'members',
        user.uid
      );

      await setDoc(memberRef, {
        displayName: name.trim() || 'Player',
        totalScore: 0,
        rounds: 0,
        bestRound: 0,
        joinedAt: serverTimestamp(),
        lastJoinedAt: serverTimestamp()
      });

      setMessage('Competition created. Share the code with friends.');
    } catch (error) {
      console.error('Create competition failed:', error);
      setMessage(
        'Unable to create a competition. Check Firestore permissions and try again.'
      );
    } finally {
      setIsWorking(false);
    }
  };

  const startRound = () => {
    if (!code) {
      setMessage('Create or join a competition first.');
      return;
    }

    if (words.length < 4) {
      setMessage(
        'At least 4 vocabulary words are required to start a round.'
      );
      return;
    }

    const count = Math.min(10, words.length);

    setRoundWords(shuffle(words).slice(0, count));
    setIndex(0);
    setScore(0);
    setQuestionStartedAt(Date.now());
    setMode('play');
    setMessage('');
  };

  const saveFinalScore = async (finalScore: number) => {
    if (!user || !code) return;

    const memberRef = doc(
      db,
      'competitions',
      code,
      'members',
      user.uid
    );

    await runTransaction(db, async transaction => {
      const memberSnapshot = await transaction.get(memberRef);

      if (!memberSnapshot.exists()) {
        throw new Error('Competition membership no longer exists.');
      }

      const data = memberSnapshot.data();
      const previousTotal = Number(data.totalScore || 0);
      const previousRounds = Number(data.rounds || 0);
      const previousBest = Number(data.bestRound || 0);

      transaction.update(memberRef, {
        totalScore: previousTotal + finalScore,
        rounds: previousRounds + 1,
        bestRound: Math.max(previousBest, finalScore),
        lastPlayedAt: serverTimestamp()
      });
    });
  };

  const answer = async (choice: string) => {
    if (!current || isWorking) return;

    const correct = choice === current.definition;
    const elapsedSeconds = Math.max(
      1,
      (Date.now() - questionStartedAt) / 1000
    );

    const speedBonus = correct
      ? Math.max(0, Math.round(5 - elapsedSeconds / 15))
      : 0;

    const nextScore =
      score + (correct ? 10 + speedBonus : 0);

    setScore(nextScore);

    if (index < roundWords.length - 1) {
      setIndex(i => i + 1);
      setQuestionStartedAt(Date.now());
      return;
    }

    setIsWorking(true);

    try {
      await saveFinalScore(nextScore);
      onXP(
        Math.floor(nextScore / 2),
        'friends',
        nextScore
      );
      setMode('results');
    } catch (error) {
      console.error('Saving competition score failed:', error);
      setMessage(
        'Your round finished, but the score could not be saved. Please check your connection.'
      );
      setMode('results');
    } finally {
      setIsWorking(false);
    }
  };

  if (mode === 'play' && current) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl space-y-8">
        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
          <span>Friend Challenge</span>
          <span>
            {index + 1}/{roundWords.length}
          </span>
        </div>

        <div>
          <p className="text-sm text-indigo-500 font-black uppercase tracking-widest">
            Choose the best definition
          </p>

          <h2 className="text-5xl font-black mt-3">
            {current.term}
          </h2>
        </div>

        <div className="grid gap-3">
          {options.map((option, optionIndex) => (
            <button
              key={`${current.id}-${optionIndex}`}
              onClick={() => answer(option)}
              disabled={isWorking}
              className="p-5 text-left rounded-2xl border-2 border-slate-100 hover:border-indigo-500 font-semibold disabled:opacity-50 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>

        <p className="text-right text-sm font-black">
          Score: {score}
        </p>
      </div>
    );
  }

  if (mode === 'results') {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-[3rem] p-10 shadow-2xl space-y-8 text-center">
        <div className="text-6xl">🏆</div>

        <h2 className="text-4xl font-black">
          Round Complete
        </h2>

        <p className="text-6xl font-black text-indigo-600">
          {score}
        </p>

        {message && (
          <p className="text-sm font-bold text-amber-700">
            {message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={startRound}
            className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black"
          >
            PLAY AGAIN
          </button>

          <button
            onClick={() => setMode('lobby')}
            className="flex-1 py-5 bg-slate-100 rounded-2xl font-black"
          >
            LEADERBOARD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-4">
      <header className="text-center">
        <div className="text-6xl">🏆</div>

        <h2 className="text-4xl font-black mt-3">
          Friends Competition
        </h2>

        <p className="text-slate-500 mt-2">
          Create a private room, share the 6-character
          code, and compete in 10-question SAT
          vocabulary rounds.
        </p>
      </header>

      {!user && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-bold">
          You can browse this mode as a guest, but sign
          in to create, join, and save scores.
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl grid md:grid-cols-3 gap-4">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Display name"
          className="p-4 bg-slate-50 rounded-2xl border"
        />

        <input
          value={code}
          onChange={e =>
            setCode(
              e.target.value
                .replace(/[^a-z0-9]/gi, '')
                .toUpperCase()
                .slice(0, 6)
            )
          }
          placeholder="Room code"
          maxLength={6}
          className="p-4 bg-slate-50 rounded-2xl border font-black tracking-widest"
        />

        <div className="flex gap-2">
          <button
            onClick={() => joinRoom(code)}
            disabled={isWorking}
            className="flex-1 bg-slate-900 text-white rounded-2xl font-black disabled:opacity-50"
          >
            JOIN
          </button>

          <button
            onClick={createRoom}
            disabled={isWorking}
            className="flex-1 bg-indigo-600 text-white rounded-2xl font-black disabled:opacity-50"
          >
            CREATE
          </button>
        </div>
      </div>

      {message && (
        <p className="text-center font-bold text-indigo-600">
          {message}
        </p>
      )}

      {code && (
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-black">
            Share this code
          </p>

          <p className="text-4xl font-black tracking-[0.3em] mt-2">
            {code}
          </p>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-2xl font-black">
            Live Leaderboard
          </h3>

          {code && (
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              ● Live
            </span>
          )}
        </div>

        <div className="space-y-3">
          {members.length === 0 ? (
            <p className="text-slate-400">
              No players yet.
            </p>
          ) : (
            members.map((member, memberIndex) => (
              <div
                key={member.id}
                className="flex justify-between items-center p-4 rounded-2xl bg-slate-50"
              >
                <div className="font-black">
                  <span className="mr-3">
                    #{memberIndex + 1}
                  </span>
                  {member.displayName}
                </div>

                <div className="text-right">
                  <p className="font-black text-indigo-600">
                    {member.totalScore} pts
                  </p>

                  <p className="text-[10px] text-slate-400">
                    Best {member.bestRound} ·{' '}
                    {member.rounds} rounds
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={startRound}
        disabled={!code || !user || isWorking}
        className="w-full py-6 bg-indigo-600 disabled:bg-slate-300 text-white rounded-3xl font-black text-lg"
      >
        START 10-QUESTION ROUND
      </button>

      <button
        onClick={onBack}
        className="block mx-auto text-slate-400 font-black"
      >
        Back to Games
      </button>
    </div>
  );
};

export default FriendsCompetition;
