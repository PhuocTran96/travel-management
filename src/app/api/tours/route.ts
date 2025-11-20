import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { updateTourStatuses } from '@/lib/tour-status'

export async function GET() {
  try {
    // Auto-update tour statuses based on current date (GMT+7)
    await updateTourStatuses()

    const tours = await db.tour.findMany({
      include: {
        bookings: true,
        expenses: true
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    // Calculate booked guests and financial data for each tour
    const toursWithBookings = tours.map(tour => ({
      ...tour,
      bookedGuests: tour.bookings.reduce((total, booking) => total + 1, 0),
      totalRevenue: tour.bookings.reduce((total, booking) => total + booking.totalPrice, 0),
      totalExpenses: tour.expenses.reduce((total, expense) => total + expense.amount, 0),
      profit: tour.bookings.reduce((total, booking) => total + booking.totalPrice, 0) -
              tour.expenses.reduce((total, expense) => total + expense.amount, 0)
    }))

    return NextResponse.json(toursWithBookings)
  } catch (error) {
    console.error('Error fetching tours:', error)
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const tour = await db.tour.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        maxGuests: data.maxGuests,
        price: data.price,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || 'UPCOMING'
      }
    })

    return NextResponse.json(tour)
  } catch (error) {
    console.error('Error creating tour:', error)
    return NextResponse.json({ error: 'Failed to create tour' }, { status: 500 })
  }
}