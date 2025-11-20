import { db } from '@/lib/db'

/**
 * Auto-update tour status based on current date (GMT+7 Vietnam timezone)
 * - If current date >= end date -> COMPLETED
 * - If current date >= start date -> ONGOING
 * - If current date < start date -> UPCOMING
 */
export async function updateTourStatuses() {
  try {
    // Get current date in GMT+7 (Vietnam timezone)
    const now = new Date()
    const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }))

    // Get all tours
    const tours = await db.tour.findMany()

    // Update each tour's status
    const updates = tours.map(async (tour) => {
      const startDate = new Date(tour.startDate)
      const endDate = new Date(tour.endDate)

      // Determine status based on current date (GMT+7)
      let newStatus = tour.status
      if (vietnamTime >= endDate) {
        newStatus = 'COMPLETED'
      } else if (vietnamTime >= startDate) {
        newStatus = 'ONGOING'
      } else {
        newStatus = 'UPCOMING'
      }

      // Update status in database if it changed
      if (newStatus !== tour.status) {
        await db.tour.update({
          where: { id: tour.id },
          data: { status: newStatus }
        })
      }
    })

    await Promise.all(updates)
  } catch (error) {
    console.error('Error updating tour statuses:', error)
  }
}
