import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const tour = await db.tour.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            customer: true,
            guests: true
          }
        },
        expenses: true
      }
    })

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
    }

    // Calculate financial data
    const totalRevenue = tour.bookings.reduce((sum, booking) => sum + booking.totalPrice, 0)
    const totalExpenses = tour.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const profit = totalRevenue - totalExpenses

    return NextResponse.json({
      ...tour,
      totalRevenue,
      totalExpenses,
      profit
    })
  } catch (error) {
    console.error('Error fetching tour:', error)
    return NextResponse.json({ error: 'Failed to fetch tour' }, { status: 500 })
  }
}

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { id } = params

    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.status !== undefined) updateData.status = data.status
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate)
    if (data.price !== undefined) updateData.price = parseFloat(data.price)
    if (data.maxGuests !== undefined) updateData.maxGuests = parseInt(data.maxGuests)
    if (data.bookedGuests !== undefined) updateData.bookedGuests = parseInt(data.bookedGuests)

    const tour = await db.tour.update({
      where: { id },
      data: updateData,
      include: {
        bookings: {
          include: {
            customer: true
          }
        },
        expenses: true
      }
    })

    // Recalculate financial data
    const totalRevenue = tour.bookings.reduce((sum, booking) => sum + booking.totalPrice, 0)
    const totalExpenses = tour.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const profit = totalRevenue - totalExpenses

    return NextResponse.json({
      ...tour,
      totalRevenue,
      totalExpenses,
      profit
    })
  } catch (error) {
    console.error('Error updating tour:', error)
    return NextResponse.json({ error: 'Failed to update tour' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Delete related bookings first
    await db.booking.deleteMany({
      where: { tourId: id }
    })

    // Delete related expenses
    await db.expense.deleteMany({
      where: { tourId: id }
    })

    // Delete the tour
    await db.tour.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Tour deleted successfully' })
  } catch (error) {
    console.error('Error deleting tour:', error)
    return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 })
  }
}