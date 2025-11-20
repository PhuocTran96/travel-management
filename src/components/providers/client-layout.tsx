'use client'

import { MusicPlayerProvider } from '@/contexts/music-player-context'
import { MusicPlayer } from '@/components/ui/music-player'
import { ReactNode } from 'react'

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <MusicPlayerProvider>
      {children}
      <MusicPlayer />
    </MusicPlayerProvider>
  )
}
