'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface EditTourDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tour: any
  onSuccess: () => void
}

export function EditTourDialog({ open, onOpenChange, tour, onSuccess }: EditTourDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'GROUP',
    status: 'UPCOMING',
    startDate: '',
    endDate: '',
    price: '',
    maxGuests: '',
    bookedGuests: ''
  })

  useEffect(() => {
    if (tour) {
      setFormData({
        name: tour.name || '',
        description: tour.description || '',
        type: tour.type || 'GROUP',
        status: tour.status || 'UPCOMING',
        startDate: tour.startDate ? new Date(tour.startDate).toISOString().split('T')[0] : '',
        endDate: tour.endDate ? new Date(tour.endDate).toISOString().split('T')[0] : '',
        price: tour.price?.toString() || '',
        maxGuests: tour.maxGuests?.toString() || '',
        bookedGuests: tour.bookedGuests?.toString() || ''
      })
    }
  }, [tour])

  const formatNumber = (value: string): string => {
    const num = parseFloat(value.replace(/,/g, ''))
    if (isNaN(num) || num === 0) return ''
    return num.toLocaleString('vi-VN')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/tours/${tour.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          status: formData.status,
          startDate: formData.startDate,
          endDate: formData.endDate,
          price: parseFloat(formData.price.replace(/,/g, '')),
          maxGuests: parseInt(formData.maxGuests),
          bookedGuests: parseInt(formData.bookedGuests)
        }),
      })

      if (response.ok) {
        alert('Cập nhật tour thành công!')
        onSuccess()
        onOpenChange(false)
      } else {
        alert('Lỗi khi cập nhật tour')
      }
    } catch (error) {
      console.error('Error updating tour:', error)
      alert('Lỗi kết nối server')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Tour</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin tour
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên tour</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Loại tour</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GROUP">Tour ghép đoàn</SelectItem>
                  <SelectItem value="PRIVATE">Tour private</SelectItem>
                  <SelectItem value="ONE_ON_ONE">Tour 1-1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPCOMING">Sắp diễn ra</SelectItem>
                  <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
                  <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Ngày bắt đầu</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">Ngày kết thúc</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="price">Giá (VNĐ)</Label>
            <Input
              id="price"
              type="text"
              value={formatNumber(formData.price)}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '')
                setFormData({ ...formData, price: value })
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxGuests">Số khách tối đa</Label>
              <Input
                id="maxGuests"
                type="number"
                value={formData.maxGuests}
                onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="bookedGuests">Số khách đã đặt</Label>
              <Input
                id="bookedGuests"
                type="number"
                value={formData.bookedGuests}
                onChange={(e) => setFormData({ ...formData, bookedGuests: e.target.value })}
                required
              />
            </div>
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
