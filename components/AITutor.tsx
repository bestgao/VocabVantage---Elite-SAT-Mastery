import React, { useState, useRef, useEffect } from 'react';
import { getTutorResponse, connectLiveTutor, decode, decodeAudioData, encode } from '../services/gemini';
import { LiveServerMessage } from '@google/genai';

const AITutor: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [msgs, setMsgs] = useState<{ role: 'user' | 'model', text: string }[]>([{ role: 'model', text: 'Neural Tutor Online. Ask me any SAT question.' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoice, setIsVoice] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const sessionRef = useRef<Promise<any> | null>(null);
  
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const send = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = { role: 'user' as const, text: input };
    setMsgs(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);
    
    try { 
      const response = await getTutorResponse(msgs, currentInput);
      setMsgs(prev => [...prev, { role: 'model', text: response }]); 
    } catch (e) {
      setMsgs(prev => [...prev, { role: 'model', text: "Signal lost. Reconnecting..." }]);
    } finally { 
      setIsTyping(false); 
    }
  };

  const toggleVoice = async () => {
    if (isVoice) { 
      setIsVoice(false); 
      setIsLive(false); 
      sessionRef.current?.then(s => s.close()); 
      return; 
    }
    
    setIsVoice(true); 
    setIsTyping(true);
    nextStartTimeRef.current = 0;
    
    try {
      const inCtx = new AudioContext({ sampleRate: 16000 });
      const outCtx = new AudioContext({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      sessionRef.current = connectLiveTutor({
        onopen: () => {
          setIsLive(true); 
          setIsTyping(false);
          const src = inCtx.createMediaStreamSource(stream);
          const proc = inCtx.createScriptProcessor(4096, 1, 1);
          
          proc.onaudioprocess = (e) => {
            const data = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(data.length);
            for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
            
            sessionRef.current?.then(session => {
              session.sendRealtimeInput({ 
                media: { 
                  data: encode(new Uint8Array(int16.buffer)), 
                  mimeType: 'audio/pcm;rate=16000' 
                } 
              });
            });
          };
          
          src.connect(proc); 
          proc.connect(inCtx.destination);
        },
        onmessage: async (m: LiveServerMessage) => {
          const base64Audio = m.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
            const buf = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
            const src = outCtx.createBufferSource();
            src.buffer = buf;
            src.connect(outCtx.destination);
            src.addEventListener('ended', () => { sourcesRef.current.delete(src); });
            src.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buf.duration;
            sourcesRef.current.add(src);
          }

          if (m.serverContent?.interrupted) {
            for (const source of sourcesRef.current) { try { source.stop(); } catch (e) {} }
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }
        },
        onerror: (e) => { console.error('Neural Link Error:', e); setIsVoice(false); },
        onclose: () => { setIsVoice(false); setIsLive(false); }
      });
    } catch (err) { 
      setIsVoice(false); 
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-3xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
      <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
          <div><h2 className="font-black text-lg tracking-tight">Neural Tutor</h2><p className="text-[10px] text-slate-400 uppercase tracking-widest">{isLive ? 'Voice Connection Active' : 'Text Interface'}</p></div>
        </div>
        <div className="flex gap-4">
          <button onClick={toggleVoice} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isVoice ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>🎙️</button>
          <button onClick={onBack} className="w-12 h-12 bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center hover:text-white">✕</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50 no-scrollbar">
        {isVoice && !isLive ? <div className="text-center py-20 animate-pulse text-indigo-400 font-black uppercase text-xs tracking-widest">Handshaking...</div> : 
         isVoice ? <div className="text-center py-20 space-y-8"><div className="text-8xl animate-bounce">🎙️</div><p className="font-black text-slate-900 tracking-tight">Listening for Neural Input...</p></div> :
         msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-5 rounded-3xl ${m.role === 'user' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-800 shadow-sm'}`}>
              <p className="text-sm font-medium leading-relaxed">{m.text}</p>
            </div>
          </div>
        ))}
        {isTyping && !isVoice && <div className="text-[10px] text-indigo-400 font-black animate-pulse uppercase tracking-[0.3em]">Processing Logic...</div>}
      </div>
      {!isVoice && (
        <div className="p-6 bg-white border-t flex gap-3">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Query the tutor..." className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
          <button onClick={send} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">Send</button>
        </div>
      )}
    </div>
  );
};
export default AITutor;