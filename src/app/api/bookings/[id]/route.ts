import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    const { id } = params

    const updateData: any = {}

    if (data.deposit !== undefined) updateData.deposit = parseFloat(data.deposit)
    if (data.totalPrice !== undefined) updateData.totalPrice = parseFloat(data.totalPrice)
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    // Update booking basic info
    const booking = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        tour: true
      }
    })

    // Update guests if provided
    if (data.guests && Array.isArray(data.guests)) {
      // Delete existing guests
      await db.guest.deleteMany({
        where: { bookingId: id }
      })

      // Create new guests
      await Promise.all(
        data.guests.map((guest: any) =>
          db.guest.create({
            data: {
              bookingId: id,
              name: guest.name,
              phone: guest.phone,
              serviceId: guest.serviceId || null
            }
          })
        )
      )
    }

    // Return updated booking with guests
    const updatedBooking = await db.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        tour: true,
        guests: true
      }
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Delete related guests first
    await db.guest.deleteMany({
      where: { bookingId: id }
    })

    // Delete the booking
    await db.booking.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Booking deleted successfully' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 })
  }
}
