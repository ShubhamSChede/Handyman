'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiContext } from '../utils/geminiContext';

export default function GeminiChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'model', content: 'Hi! I\'m Gemini. How can I help you with your service booking today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [genAI, setGenAI] = useState(null);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);
  const chatHistoryRef = useRef([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const key = 'AIzaSyBsf3E_SsFzNDL3RxVxSpTQpPpouourPpQ';
        const api = new GoogleGenerativeAI(key);
        setGenAI(api.getGenerativeModel({ model: "gemini-1.5-flash" }));
        setError(null);
      } catch (err) {
        console.error("Error initializing API:", err);
        setError("Failed to initialize chat service");
      }
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !genAI) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Update chat history with the user's message
      chatHistoryRef.current.push({ role: 'user', parts: userMessage });
      
      // Start a chat and include the context
      const chat = genAI.startChat({
        history: chatHistoryRef.current,
        generationConfig: {
          maxOutputTokens: 1000,
        },
        systemInstruction: geminiContext,
      });
      
      // Generate content based on the history and context
      const result = await chat.sendMessage(userMessage);
      const text = result.response.text();
      
      // Update chat history with the model's response
      chatHistoryRef.current.push({ role: 'model', parts: text });
      
      setMessages(prev => [...prev, { role: 'model', content: text }]);
    } catch (err) {
      console.error("Error generating content:", err);
      setMessages(prev => [
        ...prev, 
        { role: 'model', content: 'Sorry, I encountered an error processing your request.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-[350px] h-[650px] bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 z-50">
      {/* Chat header */}
      <div className="flex justify-between items-center p-3 border-b">
        <div className="font-semibold">
          <span className="flex items-center gap-2">
            <svg viewBox="0 0 32 32" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.5813 16L31.9999 29.8823L19.5813 16Z" fill="#8E75B2"/>
              <path d="M12.4187 16L0 29.8823L12.4187 16Z" fill="#EF5A28"/>
              <path d="M19.5813 16L12.4188 16L16.0001 2.11768L19.5813 16Z" fill="#876CB2"/>
              <path d="M12.4187 16L0 2.11768L12.4187 16Z" fill="#EA5B28"/>
              <path d="M19.5813 16L32 2.11768L19.5813 16Z" fill="#8E75B2"/>
              <path d="M19.5813 16L12.4188 16L16.0001 29.8823L19.5813 16Z" fill="#876CB2"/>
            </svg>
            Gemini
          </span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Error message if any */}
      {error && (
        <div className="bg-red-100 text-red-700 p-2 text-sm">
          {error}
        </div>
      )}
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`${
              message.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
            } p-2 rounded-lg max-w-[80%] break-words`}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="bg-gray-100 p-2 rounded-lg max-w-[80%] animate-pulse">
            Thinking...
          </div>
        )}
      </div>
      
      {/* Chat input */}
      <form onSubmit={handleSendMessage} className="border-t p-2 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none"
          disabled={isLoading || !genAI}
        />
        <button 
          type="submit" 
          className="bg-blue-500 text-white rounded-r-lg px-4 py-2 hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isLoading || !input.trim() || !genAI}
        >
          Send
        </button>
      </form>
    </div>
  );
}
