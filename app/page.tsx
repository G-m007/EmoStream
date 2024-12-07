"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const commonEmojis = ["🎉", "🔥", "❤️", "😂", "🤔", "👏", "🙌", "😔"];

interface EmojiStats {
  window_stats: {
    result_emoji: string;
    dominant_emotion: string;
    total_emojis: number;
    emoji_counts: { [key: string]: number };
  };
}

export default function EmojiReactionPage() {
  const [activeEmojis, setActiveEmojis] = useState<
    { id: number; emoji: string; left: number }[]
  >([]);
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  const userIdRef = useRef<string>(Math.random().toString(36).substring(7));
  const [resultEmoji, setResultEmoji] = useState<string>("😐");
  const [emojiStats, setEmojiStats] = useState<EmojiStats | null>(null);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket("ws://localhost:3000/ws");

    ws.onopen = () => {
      console.log("Connected to WebSocket");
      isConnectedRef.current = true;
      ws.send(
        JSON.stringify({
          type: "connect",
          userId: userIdRef.current,
        })
      );
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      isConnectedRef.current = false;
      wsRef.current = null;
      setTimeout(connectWebSocket, 2000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'emotion_result' && data.stats) {
          setEmojiStats(data.stats);
          setResultEmoji(data.stats.window_stats.result_emoji);
        } else if (data.type === 'emoji') {
          const newEmoji = {
            id: Date.now(),
            emoji: data.emoji,
            left: Math.random() * 80 + 10,
          };
          setActiveEmojis(prev => [...prev, newEmoji]);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      isConnectedRef.current = false;
    };

    wsRef.current = ws;
  }, []);

  const sendViaHttp = async (emoji: string) => {
    try {
      const response = await fetch("http://localhost:3000/emoji", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userIdRef.current,
          emoji: emoji,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send emoji");
      }
    } catch (error) {
      console.error("Error sending emoji:", error);
    }
  };

  const handleEmojiClick = useCallback((emoji: string) => {
    const newEmoji = {
      id: Date.now(),
      emoji,
      left: Math.random() * 80 + 10,
    };
    setActiveEmojis(prev => [...prev, newEmoji]);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: "emoji",
            userId: userIdRef.current,
            emoji,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.error("Error sending emoji:", error);
        sendViaHttp(emoji);
      }
    } else {
      sendViaHttp(emoji);
    }
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setActiveEmojis(prev => prev.filter(emoji => Date.now() - emoji.id < 3000));
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5001/current-stats');
        const data = await response.json();
        if (data.status === 'success') {
          setEmojiStats(data.result);
          setResultEmoji(data.result.window_stats.result_emoji);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    const interval = setInterval(fetchStats, 2000);
    fetchStats();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen relative">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 p-4 rounded-lg shadow-lg z-10">
        <div className="text-center">
          <div className="text-6xl mb-2">{resultEmoji}</div>
          {emojiStats && (
            <div className="text-sm font-semibold">
              {emojiStats.window_stats.dominant_emotion.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-white/90 p-4 rounded-lg shadow-lg z-10">
        <h3 className="text-lg font-bold mb-2">Emoji Stats</h3>
        {emojiStats && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(emojiStats.window_stats.emoji_counts).map(([emoji, count]) => (
                <div key={emoji} className="flex items-center space-x-2">
                  <span className="text-xl">{emoji}</span>
                  <span>× {count}</span>
                </div>
              ))}
            </div>
            <div className="text-sm mt-2">
              Total: {emojiStats.window_stats.total_emojis}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 bg-gray-800 flex items-center justify-center text-white text-2xl">
        Random Video Placeholder
      </div>

      <div className="relative flex-1">
        {activeEmojis.map((emojiObj) => (
          <div
            key={emojiObj.id}
            className="absolute text-4xl animate-float"
            style={{
              left: `${emojiObj.left}%`,
              bottom: "0%",
              animation: "float 3s ease-out",
            }}
          >
            {emojiObj.emoji}
          </div>
        ))}
      </div>

      <div className="flex justify-center space-x-4 p-4 bg-gray-100">
        {commonEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className="text-2xl hover:scale-125 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
