import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get total counts
    const totalCustomers = await db.customer.count()
    const totalTours = await db.tour.count()
    const totalBookings = await db.booking.count()

    // Get total revenue from bookings
    const bookings = await db.booking.findMany()
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0)

    // Get recent bookings with customer and tour info
    const recentBookings = await db.booking.findMany({
      include: {
        customer: true,
        tour: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Format recent bookings
    const formattedRecentBookings = recentBookings.map(booking => ({
      id: booking.id,
      customerName: booking.customer.name,
      tourName: booking.tour.name,
      totalPrice: booking.totalPrice,
      status: booking.status
    }))

    // Get upcoming tours
    const upcomingTours = await db.tour.findMany({
      where: {
        status: 'UPCOMING',
        startDate: {
          gte: new Date()
        }
      },
      include: {
        bookings: true
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 5
    })

    // Format upcoming tours
    const formattedUpcomingTours = upcomingTours.map(tour => ({
      id: tour.id,
      name: tour.name,
      startDate: tour.startDate.toLocaleDateString('vi-VN'),
      endDate: tour.endDate.toLocaleDateString('vi-VN'),
      maxGuests: tour.maxGuests,
      bookedGuests: tour.bookings.length,
      price: tour.price,
      type: tour.type
    }))

    // Get tour status counts
    const tourStatus = {
      upcoming: await db.tour.count({ where: { status: 'UPCOMING' } }),
      ongoing: await db.tour.count({ where: { status: 'ONGOING' } }),
      completed: await db.tour.count({ where: { status: 'COMPLETED' } })
    }

    // Get revenue by tour type
    const tours = await db.tour.findMany({
      include: {
        bookings: true
      }
    })

    const revenueByType = {
      group: 0,
      private: 0,
      oneOnOne: 0
    }

    tours.forEach(tour => {
      const tourRevenue = tour.bookings.reduce((sum, booking) => sum + booking.totalPrice, 0)
      if (tour.type === 'GROUP') {
        revenueByType.group += tourRevenue
      } else if (tour.type === 'PRIVATE') {
        revenueByType.private += tourRevenue
      } else if (tour.type === 'ONE_ON_ONE') {
        revenueByType.oneOnOne += tourRevenue
      }
    })

    return NextResponse.json({
      stats: {
        totalCustomers,
        totalTours,
        totalBookings,
        totalRevenue
      },
      recentBookings: formattedRecentBookings,
      upcomingTours: formattedUpcomingTours,
      tourStatus,
      revenueByType
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}