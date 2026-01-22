
import React, { useState, useEffect, useRef } from 'react';
import { Dialect, TranslationResult, HistoryItem, TranslationMode, DIALECT_CATEGORIES, UserProfile, AtlasItem } from './types';
import { translateText, generateSpeech } from './services/geminiService';
import { playAudio } from './utils/audioUtils';

const ATLAS_DATA: AtlasItem[] = [
  {
    name: '川渝话',
    region: '成都/重庆/自贡',
    description: '巴蜀之言，以幽默豪爽著称。成都话温婉（女娃子说话像撒娇），重庆话硬朗（像吵架），自贡话则是恐龙之乡的独特腔调，卷舌音极重。',
    classicPhrase: '你抓子嘛',
    classicMeaning: '你想干什么',
    features: ['儿化音', '变调频繁', '语气助词多'],
    history: '湖广填四川后形成的独特官话系统，包容性极强。'
  },
  {
    name: '粤语',
    region: '广州/香港',
    description: '保留古汉语九声六调，是极具韵律感的语言，被称为“南金之音”。广州话更传统，香港话则常混入英文。',
    classicPhrase: '好中意你',
    classicMeaning: '很喜欢你',
    features: ['九声六调', '保留入声', '古雅词汇'],
    history: '源自秦汉时期的中原雅言，由南迁的中原人带入岭南。'
  },
  {
    name: '吴语',
    region: '上海/苏州',
    description: '吴侬软语，以软糯著称。上海话融合了开埠后的海派文化，苏州话则保留了更多的园林雅致。',
    classicPhrase: '阿拉去白相',
    classicMeaning: '我们去玩',
    features: ['全浊音', '连读变调', '软糯细腻'],
    history: '江南水乡孕育的千年古音。'
  },
  {
    name: '闽南语',
    region: '闽南/台湾',
    description: '被称为“古汉语活化石”，词汇与语法中保留了大量的唐宋特征。',
    classicPhrase: '爱拼才会赢',
    classicMeaning: '努力打拼才会成功',
    features: ['十五音', '文白异读', '古汉语底层'],
    history: '河洛迁徙至闽，落地生根形成的古音。'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'translate' | 'history' | 'discover' | 'profile'>('translate');
  const [inputText, setInputText] = useState('');
  const [selectedDialect, setSelectedDialect] = useState<Dialect>(Dialect.CANTONESE_GZ);
  const [mode, setMode] = useState<TranslationMode>(TranslationMode.TO_DIALECT);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [selectedAtlas, setSelectedAtlas] = useState<AtlasItem | null>(null);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    nickname: '乡音守护人',
    hometown: '四川成都',
    bio: '寻根乡土，话出精彩。',
    joinedDate: '2025.05.20',
    dialectPreference: '四川话',
    identityVerified: true,
    avatar: '🏮'
  });

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('huaxiazi_v6_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedProfile = localStorage.getItem('huaxiazi_v6_profile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'zh-CN';
      recognitionRef.current.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
      };
      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const saveToHistory = (res: TranslationResult, original: string) => {
    const newItem: HistoryItem = { ...res, id: crypto.randomUUID(), originalText: original, timestamp: Date.now(), mode };
    const updated = [newItem, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('huaxiazi_v6_history', JSON.stringify(updated));
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const translation = await translateText(inputText, selectedDialect, mode);
      setResult(translation);
      saveToHistory(translation, inputText);
    } catch (e) {
      console.error(e);
      setCopyToast("翻译遇到了点阻碍");
      setTimeout(() => setCopyToast(null), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (!text) return;
    setAudioLoading(true);
    try {
      const base64Audio = await generateSpeech(text, selectedDialect);
      await playAudio(base64Audio);
    } catch (e) {
      console.error(e);
      setCopyToast("语音失败，请检查网络");
      setTimeout(() => setCopyToast(null), 3000);
    } finally {
      setAudioLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast('已收纳');
      setTimeout(() => setCopyToast(null), 1500);
    } catch (err) {
      console.error('复制失败', err);
    }
  };

  const startVoice = () => {
    if (!recognitionRef.current) return;
    setInputText(''); 
    setIsRecording(true);
    recognitionRef.current.start();
  };

  const renderTranslateTab = () => (
    <div className="space-y-4 animate-in fade-in duration-700 pb-36">
      <div className="bg-white rounded-[1.8rem] shadow-xl shadow-red-900/5 border border-slate-50 overflow-hidden">
        <div className="px-5 py-4 bg-red-50/10 flex items-center justify-between border-b border-red-50/20">
          <div className="flex bg-white/80 p-0.5 rounded-xl border border-red-50 shadow-sm">
            <button 
              onClick={() => { setMode(TranslationMode.TO_DIALECT); setResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${mode === TranslationMode.TO_DIALECT ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}
            >
              中 → 方
            </button>
            <button 
              onClick={() => { setMode(TranslationMode.TO_MANDARIN); setResult(null); }}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${mode === TranslationMode.TO_MANDARIN ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}
            >
              方 → 中
            </button>
          </div>
          
          <select 
            value={selectedDialect}
            onChange={(e) => setSelectedDialect(e.target.value as Dialect)}
            className="text-[9px] font-black bg-white border border-red-50 rounded-lg px-2 py-1.5 text-red-700 outline-none"
          >
            {Object.entries(DIALECT_CATEGORIES).map(([cat, ds]) => (
              <optgroup label={cat} key={cat} className="text-slate-400 font-bold bg-slate-50">
                {ds.map(d => <option key={d} value={d} className="text-red-700 font-black">{d}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="p-6">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRecording ? "正在采集乡音..." : "输入普通话或长按识别..."}
            className="w-full h-24 text-sm font-bold border-none focus:ring-0 outline-none resize-none placeholder:text-slate-200 text-slate-800 bg-transparent leading-relaxed"
          />
          <div className="flex items-center justify-between mt-4">
            <button 
              onClick={isRecording ? () => recognitionRef.current?.stop() : startVoice}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-md ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-50 text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button
              onClick={handleTranslate}
              disabled={loading || !inputText.trim()}
              className={`px-10 py-2.5 rounded-xl font-black text-xs text-white shadow-xl transition-all active:scale-95 flex items-center space-x-2 ${loading || !inputText.trim() ? 'bg-slate-200 shadow-none' : 'bg-red-600 shadow-red-100'}`}
            >
              {loading && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
              <span>{loading ? "识别中" : "开启匣子"}</span>
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-[1.8rem] shadow-xl p-6 border border-red-50/50 animate-in slide-in-from-bottom-6 duration-500">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 cursor-pointer group" onClick={() => copyToClipboard(result.translatedText)}>
              <div className="flex items-center space-x-2 mb-1.5">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">{result.dialectName}</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight break-words">{result.translatedText}</h2>
              <div 
                className="inline-flex items-center space-x-1 text-[10px] font-bold text-red-600/50 mt-1.5 italic hover:text-red-600 transition-colors"
                onClick={(e) => { e.stopPropagation(); copyToClipboard(result.phonetic); }}
              >
                <span>{result.phonetic}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
            </div>
            <button 
              onClick={() => handleSpeak(result.translatedText)}
              disabled={audioLoading}
              className="ml-4 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg active:scale-90"
            >
              {audioLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
            </button>
          </div>
          <div className="pt-6 border-t border-slate-50">
            <h4 className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-3">详尽解析</h4>
            <div className="bg-red-50/5 p-4 rounded-xl border border-red-50/20">
              <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{result.meaning}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDiscoverTab = () => (
    <div className="space-y-4 pb-36 animate-in zoom-in-95 duration-700">
      <div className="relative h-40 bg-slate-900 rounded-[1.8rem] overflow-hidden shadow-2xl group">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1547983371-44754c5e3f5d?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-red-900/60 to-transparent"></div>
        <div className="absolute bottom-5 left-6 text-white">
          <h3 className="text-base font-black tracking-tight">中华乡音图谱</h3>
          <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mt-1 opacity-70">Interactive Atlas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ATLAS_DATA.map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedAtlas(item)}
            className="bg-white p-5 rounded-[1.5rem] border border-slate-50 hover:border-red-100 hover:shadow-xl hover:shadow-red-500/5 transition-all cursor-pointer group"
          >
            <p className="text-[8px] font-black text-slate-300 mb-1 uppercase tracking-widest group-hover:text-red-400 transition-colors">{item.region}</p>
            <h4 className="text-sm font-black text-slate-800 group-hover:text-red-600 transition-colors">{item.name}</h4>
            <p className="text-[9px] font-bold text-slate-400 mt-1 line-clamp-1">{item.description}</p>
          </div>
        ))}
      </div>

      {selectedAtlas && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSelectedAtlas(null)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <div className="h-24 bg-gradient-to-br from-red-600 to-red-800 p-6 flex items-end">
              <h3 className="text-xl font-black text-white">{selectedAtlas.name} · {selectedAtlas.region}</h3>
            </div>
            <div className="p-6 space-y-4">
              <section>
                <p className="text-[8px] font-black text-slate-300 uppercase mb-1.5 tracking-widest">简介</p>
                <p className="text-xs text-slate-600 leading-relaxed font-bold">{selectedAtlas.description}</p>
              </section>
              <section className="bg-red-50/20 p-4 rounded-xl border border-red-50">
                <p className="text-[8px] font-black text-red-400 uppercase mb-2 tracking-widest">代表金句</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black text-red-600">{selectedAtlas.classicPhrase}</p>
                    <p className="text-[9px] text-slate-400 font-bold italic">释义：{selectedAtlas.classicMeaning}</p>
                  </div>
                  <button onClick={() => handleSpeak(selectedAtlas.classicPhrase)} className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  </button>
                </div>
              </section>
              <section>
                <p className="text-[8px] font-black text-slate-300 uppercase mb-2 tracking-widest">语言特征</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAtlas.features.map((f, i) => (
                    <span key={i} className="text-[8px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{f}</span>
                  ))}
                </div>
              </section>
              <button onClick={() => setSelectedAtlas(null)} className="w-full py-3 mt-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl active:scale-95 transition-all">返回地图</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-3 animate-in slide-in-from-right-4 duration-500 pb-36">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">拾遗录</h3>
        <button onClick={() => { setHistory([]); localStorage.removeItem('huaxiazi_v6_history'); }} className="text-[8px] font-black text-slate-300 hover:text-red-600 transition-colors">清空记录</button>
      </div>
      {history.length === 0 ? (
        <div className="flex flex-col items-center py-32 opacity-20">
          <span className="text-[3rem] grayscale">🏮</span>
          <span className="font-black text-[9px] uppercase tracking-widest mt-4">暂无乡音留存</span>
        </div>
      ) : (
        history.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-50 flex items-center justify-between group cursor-pointer hover:border-red-100 transition-all" onClick={() => { setResult(item); setMode(item.mode); setActiveTab('translate'); window.scrollTo(0,0); }}>
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center space-x-1.5 mb-1">
                <span className="text-[7px] font-black text-red-600 px-1.5 py-0.5 bg-red-50 rounded-md">{item.dialectName.split(' ')[0]}</span>
                <span className="text-[9px] text-slate-300 truncate font-bold">{item.originalText}</span>
              </div>
              <p className="text-sm font-black text-slate-800 truncate tracking-tight">{item.translatedText}</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-200 group-hover:bg-red-600 group-hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-4 animate-in slide-in-from-bottom-6 duration-700 pb-36">
      <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-red-900/5 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center text-3xl font-black shadow-xl shadow-red-100 mb-4 transform hover:scale-105 transition-transform">
          {userProfile.avatar}
        </div>
        <input 
          className="text-lg font-black text-slate-900 bg-transparent border-none text-center focus:ring-0 w-full mb-1"
          value={userProfile.nickname}
          onChange={e => setUserProfile({...userProfile, nickname: e.target.value})}
        />
        <div className="flex items-center space-x-1 text-[8px] font-black text-red-600/60 uppercase tracking-[0.3em]">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
           <span>实名方言守护者</span>
        </div>
      </div>

      <div className="bg-white rounded-[1.8rem] shadow-sm border border-slate-50 overflow-hidden divide-y divide-slate-50">
        {[
          { label: '故乡归属', value: userProfile.hometown, field: 'hometown' },
          { label: '方言偏好', value: userProfile.dialectPreference, field: 'dialectPreference' },
          { label: '守护宣言', value: userProfile.bio, field: 'bio' }
        ].map((item, idx) => (
          <div key={idx} className="px-6 py-4 flex flex-col hover:bg-red-50/5 transition-all">
            <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1">{item.label}</span>
            <input 
              className="text-[11px] font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0"
              value={item.value as string}
              onChange={e => {
                const updated = {...userProfile, [item.field]: e.target.value};
                setUserProfile(updated);
                localStorage.setItem('huaxiazi_v6_profile', JSON.stringify(updated));
              }}
            />
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[1.5rem] p-5 text-white flex justify-between items-center group cursor-pointer shadow-lg active:scale-[0.98] transition-all">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-xs font-black">!</div>
            <p className="text-[9px] font-black uppercase tracking-widest">关于我们与乡音保护</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center font-sans selection:bg-red-100 selection:text-red-700">
      {copyToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 px-5 py-2 bg-slate-900 text-white text-[8px] font-black rounded-full shadow-2xl z-[120] animate-in slide-in-from-top-2">
          {copyToast}
        </div>
      )}

      <header className="w-full max-w-md pt-8 pb-4 px-8 flex items-center justify-between sticky top-0 bg-[#FDFDFD]/90 backdrop-blur-2xl z-50">
        <div className="group cursor-pointer">
          <h1 className="text-xl font-[1000] text-slate-900 tracking-tighter group-hover:text-red-600 transition-colors">话匣子</h1>
          <div className="flex items-center space-x-1">
            <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse"></div>
            <p className="text-[8px] font-black text-red-600 uppercase tracking-[0.4em] opacity-80">Greater China AI</p>
          </div>
        </div>
        <button onClick={() => setActiveTab('profile')} className="w-9 h-9 rounded-xl bg-white border border-red-50 shadow-lg flex items-center justify-center text-red-600 hover:scale-110 active:scale-95 transition-all">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
        </button>
      </header>

      <main className="w-full max-w-md px-6 flex-1 mt-2">
        {activeTab === 'translate' && renderTranslateTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'discover' && renderDiscoverTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[70%] max-w-xs bg-slate-900/95 backdrop-blur-3xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] rounded-full p-1.5 flex items-center justify-between z-50 border border-white/5">
        {[
          { id: 'translate', n: '翻译', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
          { id: 'discover', n: '图鉴', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
          { id: 'history', n: '拾遗', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { id: 'profile', n: '我的', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center py-1.5 transition-all duration-300 group ${activeTab === tab.id ? 'text-red-500' : 'text-slate-500 hover:text-slate-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 mb-1 transition-transform group-active:scale-75 ${activeTab === tab.id ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} /></svg>
            <span className="text-[7px] font-black uppercase tracking-[0.15em]">{tab.n}</span>
          </button>
        ))}
      </nav>
      <div className="h-14 w-full safe-bottom"></div>
    </div>
  );
};

export default App;
