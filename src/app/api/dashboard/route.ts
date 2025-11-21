import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { updateTourStatuses } from '@/lib/tour-status'

export async function GET(request: Request) {
  try {
    // Auto-update tour statuses based on current date (GMT+7)
    await updateTourStatuses()

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const leaderName = searchParams.get('leaderName')

    // Build date filter for tours (using endDate of tour)
    const dateFilter: any = {}
    if (startDate || endDate) {
      dateFilter.endDate = {}
      if (startDate) {
        dateFilter.endDate.gte = new Date(startDate)
      }
      if (endDate) {
        dateFilter.endDate.lte = new Date(endDate)
      }
    }

    // Get unique guest count from Guest table
    const allGuests = await db.guest.findMany({
      select: {
        name: true,
        phone: true
      }
    })

    // Count unique guests by name+phone combination
    const uniqueGuestsSet = new Set<string>()
    allGuests.forEach(guest => {
      const key = `${guest.name.toLowerCase().trim()}|${guest.phone.trim()}`
      uniqueGuestsSet.add(key)
    })
    const totalCustomers = uniqueGuestsSet.size

    const totalOrders = await db.tour.count(dateFilter.endDate ? { where: dateFilter } : {})

    // Get bookings with date and leader name filter
    const bookingWhere: any = {}
    if (dateFilter.endDate) {
      bookingWhere.tour = dateFilter
    }
    if (leaderName && leaderName.trim() !== '') {
      bookingWhere.customer = {
        name: {
          contains: leaderName,
          mode: 'insensitive'
        }
      }
    }

    const bookings = await db.booking.findMany({
      include: {
        tour: true,
        customer: true
      },
      where: Object.keys(bookingWhere).length > 0 ? bookingWhere : {}
    })

    // Calculate total revenue
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0)

    // Get all expenses for filtered tours
    const tourIds = bookings.map(b => b.tourId)
    const expenses = await db.expense.findMany({
      where: {
        tourId: { in: tourIds }
      }
    })
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Calculate gross profit
    const grossProfit = totalRevenue - totalExpenses

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
      tourType: booking.tour.type,
      totalPrice: booking.totalPrice,
      deposit: booking.deposit,
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
      startDate: tour.startDate.toISOString(),
      endDate: tour.endDate.toISOString(),
      maxGuests: tour.maxGuests,
      bookedGuests: tour.bookings.length,
      price: tour.price,
      type: tour.type
    }))

    // Get ongoing tours
    const ongoingTours = await db.tour.findMany({
      where: {
        status: 'ONGOING'
      },
      include: {
        bookings: true
      },
      orderBy: {
        endDate: 'asc'
      },
      take: 5
    })

    // Format ongoing tours
    const formattedOngoingTours = ongoingTours.map(tour => ({
      id: tour.id,
      name: tour.name,
      startDate: tour.startDate.toISOString(),
      endDate: tour.endDate.toISOString(),
      maxGuests: tour.maxGuests,
      bookedGuests: tour.bookings.length,
      price: tour.price,
      type: tour.type
    }))

    // Get completed tours
    const completedTours = await db.tour.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        bookings: true
      },
      orderBy: {
        endDate: 'desc'
      },
      take: 5
    })

    // Format completed tours with payment information
    const formattedCompletedTours = completedTours.map(tour => {
      const totalPrice = tour.bookings.reduce((sum, booking) => sum + booking.totalPrice, 0)
      const totalDeposit = tour.bookings.reduce((sum, booking) => sum + booking.deposit, 0)
      const remainingAmount = totalPrice - totalDeposit

      return {
        id: tour.id,
        name: tour.name,
        startDate: tour.startDate.toISOString(),
        endDate: tour.endDate.toISOString(),
        maxGuests: tour.maxGuests,
        bookedGuests: tour.bookings.length,
        totalPrice,
        totalDeposit,
        remainingAmount
      }
    })

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
        totalOrders,
        grossProfit,
        totalRevenue,
        totalExpenses
      },
      recentBookings: formattedRecentBookings,
      upcomingTours: formattedUpcomingTours,
      ongoingTours: formattedOngoingTours,
      completedTours: formattedCompletedTours,
      tourStatus,
      revenueByType
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}