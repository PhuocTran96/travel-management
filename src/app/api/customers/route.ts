import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const customers = await db.customer.findMany({
      include: {
        bookings: {
          include: {
            tour: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Generate unique customer code
    const customerCount = await db.customer.count()
    const maKH = `KH${String(customerCount + 1).padStart(4, '0')}`
    
    const customer = await db.customer.create({
      data: {
        maKH,
        name: data.name,
        email: data.email,
        phone: data.phone,
        source: data.source,
        address: data.address
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}