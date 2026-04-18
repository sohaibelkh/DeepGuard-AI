import React, { useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Bonjour ! Je suis votre assistant intelligent. Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post<{ answer: string }>('/chat/', {
        question: input
      }, {
        timeout: 60000 // 60 seconds for the first PDF analysis
      });
      
      const botMessage: Message = { role: 'bot', content: response.data.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Chat Error:', error);
      let content = 'Désolé, je ne peux pas répondre pour le moment. Veuillez vérifier que le serveur est bien lancé.';
      if (error.code === 'ECONNABORTED') {
        content = 'Le serveur met trop de temps à répondre. Cela arrive souvent lors du premier message car je dois analyser le document PDF. Veuillez réessayer dans quelques instants.';
      }
      const errorMessage: Message = { role: 'bot', content };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-slate-950/40 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      <header className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500/30 shadow-inner">
          <Bot className="h-6 w-6 text-sky-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100 tracking-tight">Assistant Intelligent</h2>
          <p className="text-xs text-slate-400 font-medium">Spécialiste de la création d'entreprise</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl shadow-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white rounded-tr-none border border-sky-500/30'
                  : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 opacity-60">
                {msg.role === 'user' ? (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Vous</span>
                    <User className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <Bot className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Assistant</span>
                  </>
                )}
              </div>
              <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 text-slate-200 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 shadow-sm flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
              <span className="text-sm font-medium animate-pulse">L'assistant réfléchit...</span>
            </div>
          </div>
        )}
      </div>

      <footer className="p-4 bg-slate-900/30 border-t border-slate-800/50 backdrop-blur-sm">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Posez votre question sur la création d'entreprise..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition-all shadow-inner"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-slate-950 font-bold p-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
