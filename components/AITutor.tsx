import React, { useState, useRef, useEffect } from 'react';
import { getTutorResponse, connectLiveTutor, decode, decodeAudioData, encode } from '../services/gemini';
import { LiveServerMessage } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AITutorProps {
  onBack: () => void;
}

const AITutor: React.FC<AITutorProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi! I am your VocabVantage AI tutor. Ask me anything about SAT words, synonyms, or how to use a complex word in context!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Voice session refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      // Cleanup voice session on unmount
      if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
      }
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await getTutorResponse(messages, input);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I ran into an error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  /**
   * Initializes Gemini Live API session for voice tutoring.
   */
  const handleVoiceMode = async () => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      setIsLiveConnected(false);
      if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
      }
      return;
    }

    // Check for API Key
    if (!(window as any).aistudio?.hasSelectedApiKey?.()) {
      await (window as any).aistudio?.openSelectKey?.();
      // Proceed assuming success as per guidelines race condition rule
    }

    setIsVoiceMode(true);
    setIsTyping(true);

    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      sessionPromiseRef.current = connectLiveTutor({
        onopen: () => {
          setIsLiveConnected(true);
          setIsTyping(false);
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
            
            // Fixed: Use encode utility to safely convert audio bytes to base64
            const pcmBase64 = encode(new Uint8Array(int16.buffer));
            sessionPromiseRef.current?.then(session => {
              session.sendRealtimeInput({
                media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' }
              });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
            const base64 = message.serverContent.modelTurn.parts[0].inlineData.data;
            const nextStartTime = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64), outputCtx, 24000, 1);
            const source = outputCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputCtx.destination);
            source.addEventListener('ended', () => sourcesRef.current.delete(source));
            source.start(nextStartTime);
            nextStartTimeRef.current = nextStartTime + audioBuffer.duration;
            sourcesRef.current.add(source);
          }
          
          if (message.serverContent?.interrupted) {
            for (const source of sourcesRef.current) source.stop();
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
          }

          if (message.serverContent?.turnComplete) {
            // Future: sync text transcripts
          }
        },
        onerror: (e: any) => {
          console.error("Live Error", e);
          setIsLiveConnected(false);
          setIsVoiceMode(false);
        },
        onclose: () => {
          setIsLiveConnected(false);
          setIsVoiceMode(false);
        }
      });

    } catch (err) {
      console.error("Voice setup failed", err);
      setIsVoiceMode(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in duration-500">
      <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-xl">🤖</div>
          <div>
            <h2 className="font-bold">VocabVantage AI</h2>
            <p className="text-xs text-slate-400">Expert SAT Tutor • {isLiveConnected ? 'Live Connection Active' : 'Chat Mode'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Voice Mode Toggle */}
          <button 
            onClick={handleVoiceMode} 
            className={`p-2 rounded-full transition-all ${isVoiceMode ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            title="Voice Tutoring"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
          </button>
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {isVoiceMode && !isLiveConnected ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in">
             <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Initializing Neural Voice Link...</p>
          </div>
        ) : isVoiceMode ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in zoom-in-95">
             <div className="relative">
                <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center text-5xl animate-bounce">🎙️</div>
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-25"></div>
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Voice Mode Active</h3>
                <p className="text-slate-500 font-medium">The AI is listening. Speak to your tutor naturally.</p>
             </div>
             <button onClick={handleVoiceMode} className="px-8 py-3 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest">End Session</button>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 text-slate-400 italic">
                  AI is thinking...
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!isVoiceMode && (
        <div className="p-4 bg-white border-t border-slate-100 flex space-x-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default AITutor;