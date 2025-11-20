'use client'

import { useMusicPlayer } from '@/contexts/music-player-context'
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useState } from 'react'

export function MusicPlayer() {
  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    isExpanded,
    togglePlay,
    setVolume,
    seek,
    nextSong,
    previousSong,
    toggleExpanded
  } = useMusicPlayer()

  const [isMuted, setIsMuted] = useState(false)
  const [prevVolume, setPrevVolume] = useState(volume)

  if (!currentSong) return null

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleVolumeToggle = () => {
    if (isMuted) {
      setVolume(prevVolume)
      setIsMuted(false)
    } else {
      setPrevVolume(volume)
      setVolume(0)
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleSeek = (value: number[]) => {
    seek(value[0])
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 text-white shadow-2xl border-t border-purple-700">
      {/* Expanded View */}
      {isExpanded && (
        <div className="px-6 py-4 border-b border-purple-700">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-6">
              {/* Album Art (Placeholder) */}
              <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-4xl">🎵</span>
              </div>

              {/* Song Info */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{currentSong.title}</h3>
                <p className="text-purple-200">{currentSong.artist}</p>
              </div>

              {/* Collapse Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpanded}
                className="text-white hover:bg-purple-800"
              >
                <ChevronDown className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mini Player / Controls */}
      <div className="px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            {/* Song Info (Mini) */}
            {!isExpanded && (
              <div className="flex items-center gap-4 min-w-[250px]">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded flex items-center justify-center shadow-md cursor-pointer" onClick={toggleExpanded}>
                  <span className="text-xl">🎵</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate text-sm">{currentSong.title}</h4>
                  <p className="text-xs text-purple-200 truncate">{currentSong.artist}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleExpanded}
                  className="text-white hover:bg-purple-800 h-8 w-8"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Center Controls */}
            <div className="flex-1 flex flex-col items-center gap-2">
              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={previousSong}
                  className="text-white hover:bg-purple-800 h-9 w-9"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>

                <Button
                  variant="default"
                  size="icon"
                  onClick={togglePlay}
                  className="bg-white text-purple-900 hover:bg-purple-100 h-10 w-10 rounded-full shadow-lg"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 fill-current" />
                  ) : (
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextSong}
                  className="text-white hover:bg-purple-800 h-9 w-9"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-2xl flex items-center gap-3">
                <span className="text-xs text-purple-200 w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={handleSeek}
                  className="flex-1 cursor-pointer"
                />
                <span className="text-xs text-purple-200 w-12">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 min-w-[180px] justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVolumeToggle}
                className="text-white hover:bg-purple-800 h-9 w-9"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={[volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
