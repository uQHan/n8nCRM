'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '@/types';

interface ChatWidgetProps {
   sessionId?: string;
   onSessionChange?: (sessionId: string) => void;
}

export default function ChatWidget({ sessionId: initialSessionId, onSessionChange }: ChatWidgetProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [messages, setMessages] = useState<ChatMessage[]>([]);
   const [inputValue, setInputValue] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [sessionId, setSessionId] = useState<string>(initialSessionId || '');
   const [error, setError] = useState<string | null>(null);
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const backendBaseUrl = process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080';

   // Issue #16: Wrap in useCallback so they can be stable deps
   const createNewSession = useCallback(async () => {
      try {
         const res = await fetch(`${backendBaseUrl}/api/chat/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
         });
         if (!res.ok) throw new Error('Failed to create new chat session');
         const data = await res.json();

         setSessionId(data.id);
         setMessages([]);
         onSessionChange?.(data.id);
      } catch (err) {
         setError('Failed to create new chat session');
      }
   }, [backendBaseUrl, onSessionChange]);

   const loadChatHistory = useCallback(async (sid: string) => {
      if (!sid) return;

      try {
         const res = await fetch(`${backendBaseUrl}/api/chat/sessions/${sid}/messages`);
         if (!res.ok) throw new Error('Failed to load chat history');
         const data = await res.json();

         const normalized: ChatMessage[] = (data || []).map((m: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
         }));

         setMessages(normalized);
      } catch {
         // Failed to load history — not fatal
      }
   }, [backendBaseUrl]);

   // Issue #16: Fixed — proper dependency array
   useEffect(() => {
      if (!sessionId) {
         createNewSession();
      } else {
         loadChatHistory(sessionId);
      }
   }, [sessionId, createNewSession, loadChatHistory]);

   // Auto-scroll to latest message
   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages]);

   // Send message to n8n webhook
   const sendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || !sessionId) return;

      const userMessage: ChatMessage = {
         id: `msg_${Date.now()}`,
         role: 'user',
         content: inputValue,
         timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsLoading(true);
      setError(null);

      try {
         const response = await fetch(`${backendBaseUrl}/api/chat/sessions/${sessionId}/messages`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               content: inputValue,
            }),
         });

         if (!response.ok) {
            throw new Error('Failed to send message');
         }

         const data = await response.json();
         const assistantMessage: ChatMessage = {
            id: data.id,
            role: 'assistant',
            content: data.content || 'Unable to process your request',
            timestamp: data.timestamp || new Date().toISOString(),
         };

         setMessages(prev => [...prev, assistantMessage]);

      } catch (err) {
         setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
         setIsLoading(false);
      }
   };

   // Clear chat history
   const handleClearChat = async () => {
      try {
         if (sessionId) {
            await fetch(`${backendBaseUrl}/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
         }
         setMessages([]);
         await createNewSession();
      } catch {
         setError('Failed to clear chat');
      }
   };

   return (
      <>
         {/* Chat Widget Container */}
         <div className="fixed bottom-4 right-4 z-50 transition-all duration-300">
            {/* Chat Window */}
            {isOpen && (
               <div className="w-96 h-96 md:w-96 md:h-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 mb-3">
                  {/* Header */}
                  <div className="bg-linear-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                     <div>
                        <h3 className="font-bold text-lg">CRM AI Assistant</h3>
                        <p className="text-xs text-indigo-100">Powered by n8n</p>
                     </div>
                     <button
                        onClick={() => setIsOpen(false)}
                        className="text-white hover:bg-indigo-600 rounded-full p-1 transition"
                     >
                        <svg
                           className="w-5 h-5"
                           fill="none"
                           stroke="currentColor"
                           viewBox="0 0 24 24"
                        >
                           <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                           />
                        </svg>
                     </button>
                  </div>

                  {/* Messages Container */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                     {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center">
                           <div className="text-gray-500 dark:text-gray-400">
                              <p className="font-medium mb-2">Welcome to CRM Assistant</p>
                              <p className="text-sm">
                                 Ask me about your data, cleaning processes, or enrichment options.
                              </p>
                           </div>
                        </div>
                     ) : (
                        <>
                           {messages.map((message) => (
                              <div
                                 key={message.id}
                                 className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                              >
                                 <div
                                    className={`max-w-xs px-4 py-2 rounded-lg ${message.role === 'user'
                                          ? 'bg-indigo-600 text-white rounded-br-none'
                                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-none'
                                       }`}
                                 >
                                    <p className="text-sm whitespace-pre-wrap wrap-break-word">
                                       {message.content}
                                    </p>
                                    <span
                                       className={`text-xs mt-1 block ${message.role === 'user'
                                             ? 'text-indigo-100'
                                             : 'text-gray-400 dark:text-gray-500'
                                          }`}
                                    >
                                       {new Date(message.timestamp).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                       })}
                                    </span>
                                 </div>
                              </div>
                           ))}
                           {isLoading && (
                              <div className="flex justify-start">
                                 <div className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 rounded-bl-none">
                                    <div className="flex gap-1">
                                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                       <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                 </div>
                              </div>
                           )}
                           <div ref={messagesEndRef} />
                        </>
                     )}
                  </div>

                  {/* Error Display */}
                  {error && (
                     <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                     </div>
                  )}

                  {/* Input Area */}
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800 rounded-b-lg space-y-2">
                     <form onSubmit={sendMessage} className="flex gap-2">
                        <input
                           type="text"
                           value={inputValue}
                           onChange={(e) => setInputValue(e.target.value)}
                           placeholder="Type your question..."
                           disabled={isLoading}
                           className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
                        />
                        <button
                           type="submit"
                           disabled={isLoading || !inputValue.trim()}
                           className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                           <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                              />
                           </svg>
                        </button>
                     </form>
                     {messages.length > 0 && (
                        <button
                           onClick={handleClearChat}
                           className="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-1 transition"
                        >
                           Clear conversation
                        </button>
                     )}
                  </div>
               </div>
            )}

            {/* Issue #15: Fixed — toggle button only renders when !isOpen, so removed dead isOpen ternary */}
            {!isOpen && (
               <button
                  onClick={() => setIsOpen(true)}
                  className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-110"
                  title="Open chat"
               >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                     />
                  </svg>
               </button>
            )}
         </div>
      </>
   );
}
