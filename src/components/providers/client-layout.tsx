'use client'

import { MusicPlayerProvider } from '@/contexts/music-player-context'
import { ReactNode } from 'react'

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <MusicPlayerProvider>
      {children}
    </MusicPlayerProvider>
  )
}

export { MusicPlayer } from '@/components/ui/music-player'
