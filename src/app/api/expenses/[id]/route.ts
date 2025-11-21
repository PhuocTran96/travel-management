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

    if (data.tourId !== undefined) updateData.tourId = data.tourId
    if (data.type !== undefined) updateData.type = data.type
    if (data.amount !== undefined) updateData.amount = parseFloat(data.amount)
    if (data.description !== undefined) updateData.description = data.description

    const expense = await db.expense.update({
      where: { id },
      data: updateData,
      include: {
        tour: true
      }
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await db.expense.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
