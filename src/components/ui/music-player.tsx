'use client'

import { useMusicPlayer } from '@/contexts/music-player-context'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    togglePlay
  } = useMusicPlayer()

  if (!currentSong) return null

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={togglePlay}
      className="rounded-full"
      title={isPlaying ? 'Pause music' : 'Play music'}
    >
      {isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
    </Button>
  )
}
