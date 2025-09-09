"use client";

import React, { useState, useRef, useEffect } from "react";

type ChatMessage = { 
  role: "user" | "assistant"; 
  content: string;
  timestamp?: string;
};

type ChatBoxProps = {
  onSend?: (message: string) => Promise<string> | string | void;
  isLoading?: boolean;
  initialMessage?: string;
};

export default function ChatBox({ onSend, isLoading = false, initialMessage }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Add initial message if provided
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: initialMessage,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [initialMessage, messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || isLoading) return;
    
    setInput("");
    setLoading(true);
    
    // Add user message immediately
    const userMessage: ChatMessage = { 
      role: "user", 
      content: text,
      timestamp: new Date().toISOString()
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    try {
      let reply = "";
      if (onSend) {
        const result = await onSend(text);
        reply = typeof result === "string" ? result : "Sorry, I couldn't process your request.";
      } else {
        reply = "No response handler configured. Please upload a document first.";
      }
      
      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: "assistant", 
        content: reply,
        timestamp: new Date().toISOString()
      };
      setMessages([...nextMessages, assistantMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: "assistant", 
        content: "Sorry, there was an error processing your request. Please try again or upload a document first.",
        timestamp: new Date().toISOString()
      };
      setMessages([...nextMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages(initialMessage ? [{
      role: "assistant",
      content: initialMessage,
      timestamp: new Date().toISOString()
    }] : []);
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Chat with Document</h3>
        {messages.length > (initialMessage ? 1 : 0) && (
          <button
            onClick={clearChat}
            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && !initialMessage && (
          <div className="text-gray-500 text-sm text-center py-8">
            <div className="mb-2">💬</div>
            <p>Ask anything about your document...</p>
            <p className="text-xs mt-2">Upload a document first to start chatting</p>
          </div>
        )}
        
        {messages.map((message, idx) => (
          <div key={idx} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start space-x-2 max-w-[85%] ${
              message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                message.role === "user" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 text-gray-600"
              }`}>
                {message.role === "user" ? "U" : "AI"}
              </div>
              
              {/* Message bubble */}
              <div
                className={`px-4 py-2 rounded-lg break-words ${
                  message.role === "user" 
                    ? "bg-blue-600 text-white rounded-br-sm" 
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.timestamp && (
                  <div className={`text-xs mt-1 opacity-70 ${
                    message.role === "user" ? "text-blue-100" : "text-gray-500"
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-semibold">
                AI
              </div>
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Container */}
      <div className="p-4 border-t bg-gray-50 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question about the document..."
          disabled={loading || isLoading}
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleSend}
          disabled={loading || isLoading || !input.trim()}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sending</span>
            </div>
          ) : (
            "Send"
          )}
        </button>
      </div>
    </div>
  );
}
