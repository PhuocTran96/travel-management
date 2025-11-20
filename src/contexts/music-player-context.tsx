'use client'

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react'

interface Song {
  id: string
  title: string
  artist: string
  url: string
  cover?: string
}

interface MusicPlayerContextType {
  // Player state
  currentSong: Song | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  isExpanded: boolean

  // Player controls
  play: () => void
  pause: () => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  seek: (time: number) => void
  nextSong: () => void
  previousSong: () => void
  toggleExpanded: () => void

  // Playlist
  playlist: Song[]
  setPlaylist: (songs: Song[]) => void
  playSong: (song: Song) => void

  // Audio ref
  audioRef: React.RefObject<HTMLAudioElement>
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined)

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const [playlist, setPlaylist] = useState<Song[]>([])
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.7)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  // Load playlist from API
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await fetch('/api/songs')
        const songs = await response.json()
        if (Array.isArray(songs) && songs.length > 0) {
          setPlaylist(songs)

          // Restore previous song if exists
          const savedSongId = localStorage.getItem('music-player-currentSongId')
          const savedCurrentTime = localStorage.getItem('music-player-currentTime')

          if (savedSongId) {
            const savedSong = songs.find((s: Song) => s.id === savedSongId)
            if (savedSong) {
              setCurrentSong(savedSong)
              // Restore playback position after a short delay
              setTimeout(() => {
                if (audioRef.current && savedCurrentTime) {
                  audioRef.current.currentTime = parseFloat(savedCurrentTime)
                }
              }, 100)
            } else {
              setCurrentSong(songs[0])
            }
          } else {
            setCurrentSong(songs[0])
          }
        }
      } catch (error) {
        console.error('Failed to load playlist:', error)
      }
    }
    fetchPlaylist()
  }, [])

  // Load volume and play state from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('music-player-volume')
    if (savedVolume) {
      setVolumeState(parseFloat(savedVolume))
    }

    const savedIsPlaying = localStorage.getItem('music-player-isPlaying')
    if (savedIsPlaying === 'true') {
      setIsPlaying(true)
    }
  }, [])

  // Save play state to localStorage
  useEffect(() => {
    localStorage.setItem('music-player-isPlaying', isPlaying.toString())
  }, [isPlaying])

  // Save current time periodically
  useEffect(() => {
    if (currentSong) {
      localStorage.setItem('music-player-currentSongId', currentSong.id)
      localStorage.setItem('music-player-currentTime', currentTime.toString())
    }
  }, [currentTime, currentSong])

  // Update audio element volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Auto-play when song changes and isPlaying is true
  useEffect(() => {
    if (currentSong && isPlaying && audioRef.current) {
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Auto-play failed:', error)
          setIsPlaying(false)
        })
      }
    }
  }, [currentSong?.url])

  // Time update handler
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      nextSong()
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const play = () => {
    audioRef.current?.play()
    setIsPlaying(true)
  }

  const pause = () => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume)
    localStorage.setItem('music-player-volume', newVolume.toString())
  }

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const nextSong = () => {
    if (!currentSong) return
    const currentIndex = playlist.findIndex(s => s.id === currentSong.id)
    const nextIndex = (currentIndex + 1) % playlist.length
    playSong(playlist[nextIndex])
  }

  const previousSong = () => {
    if (!currentSong) return
    const currentIndex = playlist.findIndex(s => s.id === currentSong.id)
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
    playSong(playlist[prevIndex])
  }

  const playSong = (song: Song) => {
    setCurrentSong(song)
    setIsPlaying(true)
    // Audio will auto-play on src change via useEffect
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const value: MusicPlayerContextType = {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    isExpanded,
    play,
    pause,
    togglePlay,
    setVolume,
    seek,
    nextSong,
    previousSong,
    toggleExpanded,
    playlist,
    setPlaylist,
    playSong,
    audioRef
  }

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} src={currentSong?.url} />
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext)
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider')
  }
  return context
}
