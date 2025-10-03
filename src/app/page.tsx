'use client';
import { useEffect, useState, useRef, useCallback } from "react";
import styles from "./page.module.css";

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [theme, setTheme] = useState<'default' | 'purple'>("purple");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to add a message to the chat
  const addMessage = (role: 'user' | 'bot', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Function to store food preference in Google Sheets
  const storeFoodPreference = async (foodItem: string) => {
    try {
      const response = await fetch("/api/store-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodItem,
          location: userLocation,
          timestamp: new Date().toISOString()
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log('Food preference stored:', data.message);
      } else {
        console.error('Failed to store food preference:', data.error);
      }
    } catch (error) {
      console.error('Error storing food preference:', error);
    }
  };

  // Function to send user message and get bot response
  const sendMessage = async (userMessage: string) => {
    // Add user message
    addMessage('user', userMessage);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      const data = await response.json();
      if (response.ok) {
        addMessage('bot', data.message);
        
        // Check if this is a food preference response
        if (data.isFoodResponse && data.foodItem) {
          // Store in Google Sheets
          storeFoodPreference(data.foodItem);
        }
      } else {
        addMessage('bot', "Sorry, I'm having trouble responding right now. Please try again.");
      }
    } catch (err) {
      console.error('Error sending message:', err);
      addMessage('bot', "Sorry, I'm having trouble connecting. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  // Function to get initial greeting message
  const fetchInitialMessage = useCallback((position?: GeolocationPosition) => {
    setLoading(true);
    setError("");
    
    // Check for location parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const locationParam = urlParams.get('location');
    
    let fetchUrl = "/api/generate-message";
    let requestBody = {};
    
    if (locationParam) {
      // Use location parameter
      fetchUrl += `?location=${locationParam}`;
    } else if (position) {
      // Use geolocation
      requestBody = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } else {
      setError("No location available");
      setLoading(false);
      return;
    }
    
    fetch(fetchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify(requestBody),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          addMessage('bot', data.message);
          // Store the location for later use
          setUserLocation(data.location || 'Unknown');
          // After the initial greeting, ask about favorite food
          setTimeout(() => {
            addMessage('bot', "By the way, what's your favorite food? I'm curious about local tastes!");
          }, 2000);
        } else {
          setError(data.error || "Failed to generate message.");
        }
      })
      .catch((error) => {
        console.error("Failed to connect to server:", error);
        setError("Failed to connect to server.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Check for location parameter in URL first
    const urlParams = new URLSearchParams(window.location.search);
    const locationParam = urlParams.get('location');
    
    if (locationParam) {
      // Use location parameter, no need for geolocation
      fetchInitialMessage();
    } else {
      // Use geolocation as fallback
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser.");
        setLoading(false);
        return;
      }

      // Function to get geolocation and fetch message
      const getGeoAndFetch = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchInitialMessage(position);
          },
          () => {
            setError("Unable to retrieve your location.");
            setLoading(false);
          }
        );
      };

      // Initial fetch
      getGeoAndFetch();
    }

    return () => {
      // No cleanup needed since we're not using intervals in this component
    };
  }, [fetchInitialMessage]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isTyping) {
      sendMessage(inputMessage.trim());
    }
  };

  return (
    <>
    <div className={styles.page}>
      <div className={
        theme === 'purple'
          ? `${styles.billboardContainer} ${styles['purple-theme']}`
          : styles.billboardContainer
      }>
        <div className={styles.billboard}>
          {/* Chat Interface */}
          <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
              <h2>BGE Energy Assistant</h2>
            </div>
            
            <div className={styles.chatMessages}>
              {loading && <div className={styles.loadingMessage}>Loading BGE Assistant...</div>}
              {error && <div className={styles.errorMessage}>{error}</div>}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.message} ${styles[message.role]}`}
                >
                  <div className={styles.messageContent}>
                    {message.content}
                  </div>
                  <div className={styles.messageTime}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className={`${styles.message} ${styles.bot}`}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className={styles.chatInput}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about energy savings, rebates, or home efficiency..."
                disabled={isTyping}
                className={styles.inputField}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className={styles.sendButton}
              >
                Send
              </button>
            </form>
          </div>
        </div>

      
        </div>

      {/* Theme Toggle Button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
        <button
          onClick={() => setTheme(theme === 'default' ? 'purple' : 'default')}
          style={{
            padding: '0.5rem 1.5rem',
            borderRadius: '1rem',
            border: 'none',
            background: theme === 'purple' ? '#7c3aed' : '#e0e0e0',
            color: theme === 'purple' ? '#fff' : '#333',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'background 0.2s, color 0.2s',
            marginBottom: '2rem',
          }}
          aria-pressed={theme === 'purple'}
        >
          {theme === 'purple' ? 'Switch to Light Theme' : 'Switch to BGE Theme'}
        </button>
      </div>
    </div>
    </>
  );
}
