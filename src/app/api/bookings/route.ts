import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const bookings = await db.booking.findMany({
      include: {
        customer: true,
        tour: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const booking = await db.booking.create({
      data: {
        customerId: data.customerId,
        tourId: data.tourId,
        deposit: data.deposit,
        totalPrice: data.totalPrice,
        status: data.status || 'PENDING',
        notes: data.notes
      },
      include: {
        customer: true,
        tour: true
      }
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
  }
}