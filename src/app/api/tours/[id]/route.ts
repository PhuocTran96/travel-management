import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { id } = params

    const tour = await db.tour.update({
      where: { id },
      data: {
        status: data.status
      },
      include: {
        bookings: true,
        expenses: true
      }
    })

    return NextResponse.json(tour)
  } catch (error) {
    console.error('Error updating tour:', error)
    return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 })
  }
}