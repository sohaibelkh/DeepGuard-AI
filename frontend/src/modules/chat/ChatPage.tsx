import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Loader2, Heart, Zap, Shield,
  Activity, ChevronRight, Sparkles, AlertCircle, Globe
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

// ── Types ────────────────────────────────────────────────────────────────────

type Lang = 'en' | 'fr' | 'ar' | 'auto';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  lang?: Lang;
}

// ── i18n strings ─────────────────────────────────────────────────────────────

const i18n: Record<Lang, {
  title: string;
  subtitle: string;
  welcome: string;
  placeholder: string;
  disclaimer: string;
  suggested_label: string;
  thinking: string;
  enter_hint: string;
  you: string;
  assistant: string;
  suggestions: { icon: any; text: string }[];
}> = {
  en: {
    title: 'CardioAI Assistant',
    subtitle: 'Cardiac AI · Powered by CardioAI Knowledge Base',
    welcome: "Hello! I'm CardioAI's Assistant 🩺\n\nI'm here to help you understand your ECG results, explain cardiac conditions, and guide you through the platform.\n\nHow can I help you today?",
    placeholder: 'Ask about ECG results, cardiac conditions, or platform features...',
    disclaimer: 'AI responses are for informational purposes only and do not constitute medical advice. Always consult a physician.',
    suggested_label: 'Suggested questions',
    thinking: 'Thinking...',
    enter_hint: 'Press Enter to send',
    you: 'You',
    assistant: 'Assistant',
    suggestions: [
      { icon: Heart,    text: 'What is Atrial Fibrillation?' },
      { icon: Activity, text: 'How does the ECG analysis work?' },
      { icon: Zap,      text: 'What models does CardioAI use?' },
      { icon: Shield,   text: 'What should I do if MI is detected?' },
    ],
  },
  fr: {
    title: 'Assistant IA CardioAI',
    subtitle: 'IA Cardiaque · Propulsé par la base de connaissances CardioAI',
    welcome: "Bonjour ! Je suis l'Assistant IA de CardioAI 🩺\n\nJe suis ici pour vous aider à comprendre vos résultats ECG, expliquer les conditions cardiaques et vous guider dans la plateforme.\n\nComment puis-je vous aider aujourd'hui ?",
    placeholder: 'Posez une question sur votre ECG, les maladies cardiaques ou la plateforme...',
    disclaimer: 'Les réponses de l\'IA sont à titre informatif uniquement et ne constituent pas un avis médical. Consultez toujours un médecin.',
    suggested_label: 'Questions suggérées',
    thinking: 'Réflexion en cours...',
    enter_hint: 'Appuyez sur Entrée pour envoyer',
    you: 'Vous',
    assistant: 'Assistant',
    suggestions: [
      { icon: Heart,    text: 'Qu\'est-ce que la fibrillation auriculaire ?' },
      { icon: Activity, text: 'Comment fonctionne l\'analyse ECG ?' },
      { icon: Zap,      text: 'Quels modèles IA utilise CardioAI ?' },
      { icon: Shield,   text: 'Que faire si un infarctus est détecté ?' },
    ],
  },
  ar: {
    title: 'مساعد CardioAI الذكي',
    subtitle: 'ذكاء اصطناعي قلبي · مدعوم بقاعدة معرفة CardioAI',
    welcome: "مرحباً! أنا مساعد الذكاء الاصطناعي من CardioAI 🩺\n\nأنا هنا لمساعدتك في فهم نتائج تخطيط القلب، وشرح الحالات القلبية، وإرشادك عبر المنصة.\n\nكيف يمكنني مساعدتك اليوم؟",
    placeholder: 'اسأل عن نتائج الـ ECG أو الأمراض القلبية أو ميزات المنصة...',
    disclaimer: 'إجابات الذكاء الاصطناعي لأغراض إعلامية فقط ولا تُشكّل مشورة طبية. استشر طبيبك دائماً.',
    suggested_label: 'أسئلة مقترحة',
    thinking: '...جارٍ التفكير',
    enter_hint: 'اضغط Enter للإرسال',
    you: 'أنت',
    assistant: 'المساعد',
    suggestions: [
      { icon: Heart,    text: 'ما هو الرجفان الأذيني؟' },
      { icon: Activity, text: 'كيف يعمل تحليل الـ ECG؟' },
      { icon: Zap,      text: 'ما هي نماذج الذكاء الاصطناعي التي يستخدمها CardioAI؟' },
      { icon: Shield,   text: 'ماذا أفعل إذا اكتُشف احتشاء عضلة القلب؟' },
    ],
  },
  auto: {
    title: 'CardioAI Assistant',
    subtitle: 'Auto-detect · Responds in your question\'s language',
    welcome: "Hello! I'm CardioAI's Assistant 🩺\n\nI automatically detect the language of your question and respond accordingly.\n\nFeel free to ask in English, French, or Arabic!",
    placeholder: 'Ask in English, French, or Arabic...',
    disclaimer: 'AI responses are for informational purposes only. Always consult a physician.',
    suggested_label: 'Quick questions',
    thinking: 'Thinking...',
    enter_hint: 'Press Enter to send',
    you: 'You',
    assistant: 'Assistant',
    suggestions: [
      { icon: Heart,    text: 'What is Atrial Fibrillation?' },
      { icon: Activity, text: 'Comment fonctionne l\'analyse ECG ?' },
      { icon: Zap,      text: 'ما هو الرجفان الأذيني؟' },
      { icon: Shield,   text: 'What should I do if MI is detected?' },
    ],
  },
};

// ── Language config ───────────────────────────────────────────────────────────

const LANGUAGES: { code: Lang; flag: string; label: string; short: string }[] = [
  { code: 'auto', flag: '🌐', label: 'Auto',    short: 'Auto' },
  { code: 'en',   flag: '🇬🇧', label: 'English', short: 'EN'   },
  { code: 'fr',   flag: '🇫🇷', label: 'Français', short: 'FR'  },
  { code: 'ar',   flag: '🇸🇦', label: 'العربية',  short: 'AR'  },
];

// ── Typing indicator ──────────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px' }}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{
        display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
        background: '#a5c422',
        animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
  </div>
);

// ── Message Bubble ────────────────────────────────────────────────────────────

const MessageBubble: React.FC<{ msg: Message; isLast: boolean; t: typeof i18n['en'] }> = ({ msg, isLast, t }) => {
  const isUser = msg.role === 'user';
  const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isRtl = msg.lang === 'ar' || (!msg.lang && /[\u0600-\u06FF]/.test(msg.content));

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 10,
      animation: isLast ? 'msgFadeUp 0.25s ease-out' : 'none',
    }}>
      {/* Avatar */}
      <div style={{
        flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
        background: isUser ? '#a5c422' : '#f0f4e8',
        border: isUser ? '2px solid #8ea31d' : '2px solid #d4e89a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser ? <User size={16} color="#fff" /> : <Bot size={16} color="#a5c422" />}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
        <div style={{
          padding: '11px 16px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          background: isUser ? '#a5c422' : '#ffffff',
          color: isUser ? '#fff' : '#1a1a1a',
          fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap',
          boxShadow: isUser ? '0 2px 12px rgba(165,196,34,0.25)' : '0 2px 12px rgba(0,0,0,0.07)',
          border: isUser ? 'none' : '1px solid #f0f0f0',
          direction: isRtl ? 'rtl' : 'ltr',
          textAlign: isRtl ? 'right' : 'left',
        }}>
          {msg.content}
        </div>
        <span style={{ fontSize: 10, color: '#bbb', padding: '0 4px' }}>{time}</span>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const ChatPage: React.FC = () => {
  const [lang, setLang] = useState<Lang>('en');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = i18n[lang];
  const isRtlUI = lang === 'ar';

  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: t.welcome, timestamp: new Date(), lang }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset chat when language changes
  const handleLangChange = (newLang: Lang) => {
    setLang(newLang);
    setShowLangMenu(false);
    setMessages([{ role: 'bot', content: i18n[newLang].welcome, timestamp: new Date(), lang: newLang }]);
    setInput('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    const userMsg: Message = { role: 'user', content: question, timestamp: new Date(), lang };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    inputRef.current?.focus();

    try {
      const response = await apiClient.post<{ answer: string }>(
        '/chat/',
        { question, language: lang },
        { timeout: 60000 }
      );
      const botMsg: Message = { role: 'bot', content: response.data.answer, timestamp: new Date(), lang };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      let msg = 'Sorry, I could not reach the server. Please make sure the backend is running.';
      if (err.code === 'ECONNABORTED') msg = 'The server is taking too long. Please try again in a moment.';
      else if (err.response?.status === 503) msg = 'The AI assistant requires a GROQ_API_KEY in backend/.env to function.';
      setMessages(prev => [...prev, { role: 'bot', content: msg, timestamp: new Date(), lang }]);
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = messages.length === 1;
  const currentLangInfo = LANGUAGES.find(l => l.code === lang)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 8rem)', fontFamily: 'inherit', direction: isRtlUI ? 'rtl' : 'ltr' }}>

      <style>{`
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes msgFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes menuFade {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .chat-scroll::-webkit-scrollbar { width: 5px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 10px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: #ccc; }
        .lang-btn:hover { background: #f5f5f5 !important; }
        .suggest-btn:hover { border-color: #a5c422 !important; background: #f9fced !important; }
        .send-btn:hover:not(:disabled) { background: #8ea31d !important; transform: scale(1.05); }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px',
        background: '#fff', borderBottom: '1px solid #f0f0f0',
        borderRadius: '12px 12px 0 0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        flexDirection: isRtlUI ? 'row-reverse' : 'row',
      }}>
        {/* Bot icon */}
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #a5c422 0%, #7da318 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(165,196,34,0.35)',
        }}>
          <Bot size={22} color="#fff" />
        </div>

        {/* Title */}
        <div style={{ flex: 1, textAlign: isRtlUI ? 'right' : 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isRtlUI ? 'row-reverse' : 'row' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{t.title}</h2>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#f0f8d6', color: '#6b9a10', fontSize: 10, fontWeight: 700,
              padding: '2px 8px', borderRadius: 20, border: '1px solid #d4e89a', letterSpacing: '0.05em',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a5c422', display: 'inline-block' }} />
              ONLINE
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#888', marginTop: 1 }}>{t.subtitle}</p>
        </div>

        {/* RAG badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#bbb', fontSize: 11 }}>
          <Sparkles size={13} color="#a5c422" />
          <span>RAG · Groq</span>
        </div>

        {/* ── Language Switcher ── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setShowLangMenu(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 10,
              border: '1.5px solid #e8e8e8', background: '#fafafa',
              cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#333',
              transition: 'all 0.15s',
            }}
            className="lang-btn"
          >
            <Globe size={14} color="#a5c422" />
            <span>{currentLangInfo.flag}</span>
            <span>{currentLangInfo.short}</span>
            <span style={{ fontSize: 9, color: '#bbb', marginLeft: 2 }}>▾</span>
          </button>

          {showLangMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)',
              right: isRtlUI ? 'auto' : 0, left: isRtlUI ? 0 : 'auto',
              background: '#fff', border: '1px solid #ebebeb', borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100,
              minWidth: 160, overflow: 'hidden',
              animation: 'menuFade 0.15s ease-out',
            }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  onClick={() => handleLangChange(l.code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 16px',
                    background: lang === l.code ? '#f9fced' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: 13, color: lang === l.code ? '#6b9a10' : '#333',
                    fontWeight: lang === l.code ? 700 : 400,
                    borderLeft: lang === l.code ? '3px solid #a5c422' : '3px solid transparent',
                    transition: 'background 0.1s',
                  }}
                  className="lang-btn"
                >
                  <span style={{ fontSize: 18 }}>{l.flag}</span>
                  <span>{l.label}</span>
                  {l.code === 'auto' && <span style={{ fontSize: 10, color: '#999', marginLeft: 'auto' }}>🤖</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        className="chat-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px', background: '#fafaf8', display: 'flex', flexDirection: 'column', gap: 16 }}
        onClick={() => setShowLangMenu(false)}
      >
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} msg={msg} isLast={idx === messages.length - 1} t={t} />
        ))}

        {/* Suggestions */}
        {showSuggestions && (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 11, color: '#aaa', marginBottom: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: isRtlUI ? 'right' : 'left' }}>
              {t.suggested_label}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {t.suggestions.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="suggest-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', background: '#fff',
                    border: '1px solid #ebebeb', borderRadius: 10,
                    cursor: 'pointer', textAlign: isRtlUI ? 'right' : 'left',
                    fontSize: 12, color: '#333', fontWeight: 500,
                    transition: 'all 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    flexDirection: isRtlUI ? 'row-reverse' : 'row',
                    direction: isRtlUI ? 'rtl' : 'ltr',
                  }}
                >
                  <Icon size={14} color="#a5c422" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{text}</span>
                  <ChevronRight size={12} color="#ccc" style={{ transform: isRtlUI ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Typing */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexDirection: isRtlUI ? 'row-reverse' : 'row', animation: 'msgFadeUp 0.2s ease-out' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0f4e8', border: '2px solid #d4e89a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={16} color="#a5c422" />
            </div>
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: isRtlUI ? '18px 18px 18px 4px' : '18px 18px 18px 4px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <TypingIndicator />
            </div>
            <span style={{ fontSize: 12, color: '#bbb', alignSelf: 'center' }}>{t.thinking}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Disclaimer ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 24px', background: '#fffbec',
        borderTop: '1px solid #fde68a', fontSize: 11, color: '#92710a',
        flexDirection: isRtlUI ? 'row-reverse' : 'row',
        textAlign: isRtlUI ? 'right' : 'left',
        direction: isRtlUI ? 'rtl' : 'ltr',
      }}>
        <AlertCircle size={12} color="#f59e0b" style={{ flexShrink: 0 }} />
        <span>{t.disclaimer}</span>
      </div>

      {/* ── Input ── */}
      <div style={{
        padding: '14px 24px 16px', background: '#fff',
        borderTop: '1px solid #f0f0f0', borderRadius: '0 0 12px 12px',
      }}
        onClick={() => setShowLangMenu(false)}
      >
        <div style={{ display: 'flex', gap: 10, flexDirection: isRtlUI ? 'row-reverse' : 'row' }}>
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={t.placeholder}
            disabled={loading}
            dir={isRtlUI ? 'rtl' : 'auto'}
            style={{
              flex: 1, padding: '12px 18px', borderRadius: 12,
              border: '1.5px solid #e8e8e8', background: '#fafafa',
              fontSize: 14, color: '#1a1a1a', outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s', fontFamily: 'inherit',
              textAlign: isRtlUI ? 'right' : 'left',
            }}
            onFocus={e => { e.target.style.borderColor = '#a5c422'; e.target.style.boxShadow = '0 0 0 3px rgba(165,196,34,0.15)'; e.target.style.background = '#fff'; }}
            onBlur={e => { e.target.style.borderColor = '#e8e8e8'; e.target.style.boxShadow = 'none'; e.target.style.background = '#fafafa'; }}
          />
          <button
            id="chat-send-btn"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="send-btn"
            style={{
              width: 46, height: 46, borderRadius: 12, flexShrink: 0,
              background: loading || !input.trim() ? '#f0f0f0' : '#a5c422',
              border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              boxShadow: loading || !input.trim() ? 'none' : '0 4px 12px rgba(165,196,34,0.35)',
            }}
          >
            {loading
              ? <Loader2 size={18} color="#999" style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={18} color={input.trim() ? '#fff' : '#bbb'} />
            }
          </button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 11, color: '#bbb', textAlign: 'center' }}>
          <kbd style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontFamily: 'monospace' }}>Enter</kbd>
          {' '}{t.enter_hint.replace('Press Enter to send', '').replace('Appuyez sur Entrée pour envoyer', '').trim() || 'to send'}
        </p>
      </div>
    </div>
  );
};
