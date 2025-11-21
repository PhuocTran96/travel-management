'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface EditExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: any
  tours: any[]
  onSuccess: () => void
}

export function EditExpenseDialog({ open, onOpenChange, expense, tours, onSuccess }: EditExpenseDialogProps) {
  const [formData, setFormData] = useState({
    tourId: '',
    type: 'TOUR_COST',
    amount: '',
    description: ''
  })

  useEffect(() => {
    if (expense) {
      setFormData({
        tourId: expense.tourId || '',
        type: expense.type || 'TOUR_COST',
        amount: expense.amount?.toString() || '',
        description: expense.description || ''
      })
    }
  }, [expense])

  const formatNumber = (value: string): string => {
    const num = parseFloat(value.replace(/,/g, ''))
    if (isNaN(num) || num === 0) return ''
    return num.toLocaleString('vi-VN')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tourId: formData.tourId,
          type: formData.type,
          amount: parseFloat(formData.amount.replace(/,/g, '')),
          description: formData.description
        }),
      })

      if (response.ok) {
        alert('Cập nhật chi phí thành công!')
        onSuccess()
        onOpenChange(false)
      } else {
        alert('Lỗi khi cập nhật chi phí')
      }
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('Lỗi kết nối server')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Chi phí</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin chi phí
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tour">Tour</Label>
            <Select value={formData.tourId} onValueChange={(value) => setFormData({ ...formData, tourId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn tour" />
              </SelectTrigger>
              <SelectContent>
                {tours.map((tour) => (
                  <SelectItem key={tour.id} value={tour.id}>
                    {tour.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tourType">Loại tour</Label>
            <Input
              value={tours.find(t => t.id === formData.tourId)?.type ?
                (tours.find(t => t.id === formData.tourId)?.type === 'GROUP' ? 'Tour ghép đoàn' :
                 tours.find(t => t.id === formData.tourId)?.type === 'PRIVATE' ? 'Tour private' :
                 tours.find(t => t.id === formData.tourId)?.type === 'ONE_ON_ONE' ? 'Tour 1-1' : '')
                : ''}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label htmlFor="type">Loại chi phí</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TOUR_COST">Chi phí tour</SelectItem>
                <SelectItem value="PARTNER">Chi phí đối tác</SelectItem>
                <SelectItem value="GUIDE">Chi phí HDV</SelectItem>
                <SelectItem value="STAFF">Chi phí nhân viên</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Số tiền (VNĐ)</Label>
            <Input
              id="amount"
              type="text"
              value={formatNumber(formData.amount)}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setFormData({ ...formData, amount: value })
              }}
              placeholder="Nhập số tiền..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chi tiết về chi phí..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit">
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
