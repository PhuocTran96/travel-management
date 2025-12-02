import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const month = searchParams.get('month')
        const year = searchParams.get('year')

        if (!month || !year) {
            return NextResponse.json(
                { error: 'Month and year parameters are required' },
                { status: 400 }
            )
        }

        const monthNum = parseInt(month, 10)
        const yearNum = parseInt(year, 10)

        if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
            return NextResponse.json(
                { error: 'Invalid month or year' },
                { status: 400 }
            )
        }

        // Calculate start and end of the month
        const startOfMonth = new Date(yearNum, monthNum - 1, 1)
        const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999)

        // Fetch tours that have startDate or endDate within this month
        const tours = await db.tour.findMany({
            where: {
                OR: [
                    {
                        startDate: {
                            gte: startOfMonth,
                            lte: endOfMonth,
                        },
                    },
                    {
                        endDate: {
                            gte: startOfMonth,
                            lte: endOfMonth,
                        },
                    },
                    {
                        AND: [
                            { startDate: { lte: startOfMonth } },
                            { endDate: { gte: endOfMonth } },
                        ],
                    },
                ],
            },
            orderBy: {
                startDate: 'asc',
            },
            include: {
                bookings: {
                    select: {
                        id: true,
                    },
                },
            },
        })

        // Transform data to include booked guests count
        const toursWithBookings = tours.map((tour) => ({
            id: tour.id,
            name: tour.name,
            type: tour.type,
            status: tour.status,
            startDate: tour.startDate,
            endDate: tour.endDate,
            maxGuests: tour.maxGuests,
            bookedGuests: tour.bookings.length,
            price: tour.price,
        }))

        return NextResponse.json(toursWithBookings)
    } catch (error) {
        console.error('Error fetching calendar tours:', error)
        return NextResponse.json(
            { error: 'Failed to fetch calendar data' },
            { status: 500 }
        )
    }
}
