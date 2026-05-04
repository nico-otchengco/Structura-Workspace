import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, ChevronDown } from 'lucide-react';
import '@/styles/style.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context: {
    organizationName: string;
    boards: { id: string; name: string; description: string | null }[];
    tasks: { title: string; status: string; priority: string; board: string; due_date: string | null }[];
    activities: { action: string; resource_type: string; user: string; created_at: string }[];
  };
}

export function AiAssistant({ isOpen, onClose, context }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hi! I'm your project assistant for ${context.organizationName}. I can help you with task statuses, board summaries, activity insights, and more. What would you like to know?` },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const buildSystemPrompt = () => {
    const boardsSummary = context.boards.map(b => `- ${b.name}${b.description ? `: ${b.description}` : ''}`).join('\n');
    const tasksSummary = context.tasks.map(t => `- [${t.status}] ${t.title} (${t.priority} priority, board: ${t.board}${t.due_date ? `, due: ${new Date(t.due_date).toLocaleDateString()}` : ''})`).join('\n');
    const activitiesSummary = context.activities.slice(0, 20).map(a => `- ${a.user} ${a.action} a ${a.resource_type} on ${new Date(a.created_at).toLocaleDateString()}`).join('\n');

    return `You are a helpful project management assistant for the organization "${context.organizationName}".

BOARDS:
${boardsSummary || 'No boards yet.'}

TASKS:
${tasksSummary || 'No tasks yet.'}

RECENT ACTIVITY:
${activitiesSummary || 'No recent activity.'}

Guidelines:
- Be concise and helpful
- Reference specific tasks, boards, and activities when relevant
- Format responses clearly using bullet points when listing multiple items
- Today's date is ${new Date().toLocaleDateString()}`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: userMessage },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatMessage = (content: string) =>
    content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: 600 }}>{line.slice(2, -2)}</p>;
      if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: 16, listStyleType: 'disc' }}>{line.slice(2)}</li>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i}>{line}</p>;
    });

  if (!isOpen) return null;

  return (
    <>
      <div className={`ai-root ${isMinimized ? 'minimized' : 'open'}`}>
        <div className="ai-header">
          <div className="ai-header-left">
            <div className="ai-header-icon"><Bot size={14} color="white" /></div>
            <div>
              <div className="ai-header-name">AI Assistant</div>
              {!isMinimized && (
                <div className="ai-header-status">
                  <div className="ai-header-dot" /> Online
                </div>
              )}
            </div>
          </div>
          <div className="ai-header-actions">
            <button className="ai-header-btn" onClick={() => setIsMinimized(!isMinimized)}>
              <ChevronDown size={13} style={{ transform: isMinimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            <button className="ai-header-btn" onClick={onClose}>
              <X size={13} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="ai-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`ai-msg-row ${msg.role}`}>
                  <div className={`ai-avatar ${msg.role}`}>
                    {msg.role === 'assistant' ? <Bot size={13} /> : <User size={13} />}
                  </div>
                  <div className={`ai-bubble ${msg.role}`}>
                    {formatMessage(msg.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="ai-msg-row">
                  <div className="ai-avatar assistant"><Bot size={13} /></div>
                  <div className="ai-typing">
                    <div className="ai-typing-dot" />
                    <div className="ai-typing-dot" />
                    <div className="ai-typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="ai-input-area">
              <div className="ai-input-row">
                <textarea
                  className="ai-textarea"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your project..."
                  rows={1}
                />
                <button className="ai-send" onClick={sendMessage} disabled={!input.trim() || loading}>
                  <Send size={14} />
                </button>
              </div>
              <div className="ai-hint">Enter to send · Shift+Enter for new line</div>
            </div>
          </>
        )}
      </div>
    </>
  );
}