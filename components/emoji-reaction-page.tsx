'use client'

import { useState, useEffect } from 'react'

const commonEmojis = ['😀', '😍', '🎉', '👍', '🔥', '❤️', '😂', '🤔', '👏', '🙌']

interface EmojiStats {
  window_stats: {
    total_emojis: number;
    emoji_counts: { [key: string]: number };
    dominant_emotion: string;
    dominant_count: number;
    result_emoji: string;
  };
}

export function EmojiReactionPage() {
  const [activeEmojis, setActiveEmojis] = useState<{ id: number; emoji: string; left: number }[]>([])
  const [resultEmoji, setResultEmoji] = useState<string>('😐')
  const [emojiStats, setEmojiStats] = useState<EmojiStats | null>(null)

  useEffect(() => {
    // Fetch stats from the Flask backend
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:5001/current-stats')
        const data = await response.json()
        if (data.status === 'success') {
          console.log('Received stats:', data.result)
          setEmojiStats(data.result)
          // Decode the Unicode emoji
          const decodedEmoji = decodeURIComponent(JSON.parse(`"${data.result.window_stats.result_emoji}"`))
          setResultEmoji(decodedEmoji)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }

    // Fetch initial stats and set up polling
    fetchStats()
    const pollInterval = setInterval(fetchStats, 2000) // Poll every 2 seconds

    const ws = new WebSocket('ws://localhost:3001')

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('Received WebSocket message:', data)

      if (data.type === 'emoji') {
        const newEmoji = {
          id: Date.now(),
          emoji: data.emoji,
          left: Math.random() * 80 + 10,
        }
        setActiveEmojis((prev) => [...prev, newEmoji])
      } else if (data.type === 'emotion_result') {
        console.log('Received emotion result:', data.stats)
        setEmojiStats(data.stats)
        // Decode the Unicode emoji
        const decodedEmoji = decodeURIComponent(JSON.parse(`"${data.stats.window_stats.result_emoji}"`))
        setResultEmoji(decodedEmoji)
      }
    }

    const timer = setInterval(() => {
      setActiveEmojis((prev) => prev.filter((emoji) => Date.now() - emoji.id < 3000))
    }, 100)

    return () => {
      clearInterval(timer)
      clearInterval(pollInterval)
      ws.close()
    }
  }, [])

  const handleEmojiClick = (emoji: string) => {
    const ws = new WebSocket('ws://localhost:3001')
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'emoji',
          userId: Math.random().toString(36).substr(2, 6),
          emoji: emoji,
          timestamp: new Date().getTime(),
        })
      )
      ws.close()
    }
  }

  const decodeEmojiCounts = (counts: { [key: string]: number }) => {
    return Object.entries(counts).reduce((acc, [emoji, count]) => {
      const decodedEmoji = decodeURIComponent(JSON.parse(`"${emoji}"`))
      acc[decodedEmoji] = count
      return acc
    }, {} as { [key: string]: number })
  }

  return (
    <div className="flex flex-col h-screen relative">
      {/* Dominant Emoji Display */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 p-4 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="text-6xl mb-2">{resultEmoji}</div>
          <div className="text-sm font-semibold">
            {emojiStats?.window_stats.dominant_emotion.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats Display */}
      <div className="absolute top-4 right-4 bg-white/90 p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-2">Emoji Stats</h3>
        {emojiStats && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(decodeEmojiCounts(emojiStats.window_stats.emoji_counts)).map(([emoji, count]) => (
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

      {/* Video placeholder */}
      <div className="flex-1 bg-gray-800 flex items-center justify-center text-white text-2xl">
        Random Video Placeholder
      </div>

      {/* Emoji reactions */}
      <div className="relative flex-1">
        {activeEmojis.map((emojiObj) => (
          <div
            key={emojiObj.id}
            className="absolute text-4xl animate-float"
            style={{
              left: `${emojiObj.left}%`,
              bottom: '0%',
              animation: 'float 3s ease-out',
            }}
          >
            {emojiObj.emoji}
          </div>
        ))}
      </div>

      {/* Emoji selector */}
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
  )
}