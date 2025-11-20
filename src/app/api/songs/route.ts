import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const musicDir = path.join(process.cwd(), 'public', 'music')

    // Check if music directory exists
    if (!fs.existsSync(musicDir)) {
      return NextResponse.json([])
    }

    // Read all files in music directory
    const files = fs.readdirSync(musicDir)

    // Filter only .mp3 files and create song objects
    const songs = files
      .filter(file => file.endsWith('.mp3'))
      .map((file, index) => {
        // Remove .mp3 extension and try to parse title/artist
        const nameWithoutExt = file.replace('.mp3', '')

        // Try to split by common patterns like " - " or use full name
        let title = nameWithoutExt
        let artist = 'Unknown Artist'

        // Pattern: "Artist - Title" or "Title (Artist)"
        if (nameWithoutExt.includes(' - ')) {
          const parts = nameWithoutExt.split(' - ')
          artist = parts[0].trim()
          title = parts[1].trim()
        } else if (nameWithoutExt.match(/\(([^)]+)\)$/)) {
          // Pattern: "Title (Artist/Album)"
          const match = nameWithoutExt.match(/^(.+?)\s*\(([^)]+)\)$/)
          if (match) {
            title = match[1].trim()
            artist = match[2].trim()
          }
        }

        return {
          id: (index + 1).toString(),
          title,
          artist,
          url: `/music/${encodeURIComponent(file)}`
        }
      })

    return NextResponse.json(songs)
  } catch (error) {
    console.error('Error fetching songs:', error)
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 })
  }
}
