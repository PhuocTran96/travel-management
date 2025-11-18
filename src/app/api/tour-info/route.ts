import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tourInfo = await db.tourInfo.findMany({
      orderBy: [
        { stt: 'asc' },
        { tenTour: 'asc' }
      ]
    })

    return NextResponse.json(tourInfo)
  } catch (error) {
    console.error('Error fetching tour info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tour info' },
      { status: 500 }
    )
  }
}
