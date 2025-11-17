'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar, Users, Plus, Search, MapPin, DollarSign, Clock, UserCheck } from 'lucide-react'

export default function ToursPage() {
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const [newTour, setNewTour] = useState({
    name: '',
    description: '',
    type: 'GROUP',
    maxGuests: 10,
    price: 0,
    startDate: '',
    endDate: '',
    status: 'UPCOMING'
  })

  useEffect(() => {
    fetchTours()
  }, [])

  const fetchTours = async () => {
    try {
      const response = await fetch('/api/tours')
      const data = await response.json()

      if (response.ok && Array.isArray(data)) {
        setTours(data)
      } else {
        console.error('Failed to fetch tours:', data.error || 'Unknown error')
        setTours([])
      }
    } catch (error) {
      console.error('Error fetching tours:', error)
      setTours([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTour = async () => {
    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTour),
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        setNewTour({
          name: '',
          description: '',
          type: 'GROUP',
          maxGuests: 10,
          price: 0,
          startDate: '',
          endDate: '',
          status: 'UPCOMING'
        })
        fetchTours()
      }
    } catch (error) {
      console.error('Error creating tour:', error)
    }
  }

  const handleUpdateTourStatus = async (tourId, newStatus) => {
    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTours()
      }
    } catch (error) {
      console.error('Error updating tour status:', error)
    }
  }

  const filteredTours = Array.isArray(tours) ? tours.filter(tour => {
    const matchesSearch = tour.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tour.status === statusFilter
    const matchesType = typeFilter === 'all' || tour.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  }) : []

  const getStatusColor = (status) => {
    switch (status) {
      case 'UPCOMING': return 'secondary'
      case 'ONGOING': return 'default'
      case 'COMPLETED': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'UPCOMING': return 'Sắp diễn ra'
      case 'ONGOING': return 'Đang diễn ra'
      case 'COMPLETED': return 'Hoàn thành'
      default: return status
    }
  }

  const getTypeText = (type) => {
    switch (type) {
      case 'GROUP': return 'Tour ghép đoàn'
      case 'PRIVATE': return 'Tour private'
      case 'ONE_ON_ONE': return 'Tour 1-1'
      default: return type
    }
  }

  const getAvailabilityColor = (booked, max) => {
    const percentage = (booked / max) * 100
    if (percentage >= 100) return 'destructive'
    if (percentage >= 80) return 'secondary'
    return 'default'
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => window.history.back()}>
                ← Quay lại
              </Button>
              <h1 className="ml-4 text-2xl font-bold text-gray-900">Quản lý Tour</h1>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo Tour mới
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tạo Tour mới</DialogTitle>
                  <DialogDescription>
                    Thêm tour mới vào hệ thống
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Tên tour</Label>
                    <Input
                      value={newTour.name}
                      onChange={(e) => setNewTour({...newTour, name: e.target.value})}
                      placeholder="Nhập tên tour..."
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      value={newTour.description}
                      onChange={(e) => setNewTour({...newTour, description: e.target.value})}
                      placeholder="Mô tả chi tiết về tour..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Loại tour</Label>
                    <Select value={newTour.type} onValueChange={(value) => setNewTour({...newTour, type: value})}>
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
                    <Label htmlFor="maxGuests">Số khách tối đa</Label>
                    <Input
                      type="number"
                      value={newTour.maxGuests}
                      onChange={(e) => setNewTour({...newTour, maxGuests: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Giá tour (VNĐ)</Label>
                    <Input
                      type="number"
                      value={newTour.price}
                      onChange={(e) => setNewTour({...newTour, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Trạng thái</Label>
                    <Select value={newTour.status} onValueChange={(value) => setNewTour({...newTour, status: value})}>
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
                  <div>
                    <Label htmlFor="startDate">Ngày bắt đầu</Label>
                    <Input
                      type="date"
                      value={newTour.startDate}
                      onChange={(e) => setNewTour({...newTour, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Ngày kết thúc</Label>
                    <Input
                      type="date"
                      value={newTour.endDate}
                      onChange={(e) => setNewTour({...newTour, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleCreateTour}>
                    Tạo Tour
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tên tour..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="UPCOMING">Sắp diễn ra</SelectItem>
              <SelectItem value="ONGOING">Đang diễn ra</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Lọc theo loại tour" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại tour</SelectItem>
              <SelectItem value="GROUP">Tour ghép đoàn</SelectItem>
              <SelectItem value="PRIVATE">Tour private</SelectItem>
              <SelectItem value="ONE_ON_ONE">Tour 1-1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tours Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map((tour) => (
            <Card key={tour.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tour.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getTypeText(tour.type)}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(tour.status)}>
                    {getStatusText(tour.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tour.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{tour.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(tour.startDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{new Date(tour.endDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {tour.bookedGuests}/{tour.maxGuests} khách
                      </span>
                    </div>
                    <Badge variant={getAvailabilityColor(tour.bookedGuests, tour.maxGuests)}>
                      {tour.maxGuests - tour.bookedGuests} chỗ trống
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold">{tour.price.toLocaleString()}đ</span>
                    </div>
                  </div>

                  {/* Progress bar for group tours */}
                  {tour.type === 'GROUP' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((tour.bookedGuests / tour.maxGuests) * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Financial summary */}
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Doanh thu:</span>
                      <span className="font-medium">{tour.totalRevenue?.toLocaleString() || 0}đ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Chi phí:</span>
                      <span className="font-medium">{tour.totalExpenses?.toLocaleString() || 0}đ</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span>Lợi nhuận:</span>
                      <span className={tour.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {tour.profit?.toLocaleString() || 0}đ
                      </span>
                    </div>
                  </div>

                  {/* Status update buttons */}
                  <div className="flex gap-2">
                    {tour.status === 'UPCOMING' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateTourStatus(tour.id, 'ONGOING')}
                        className="flex-1"
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Bắt đầu tour
                      </Button>
                    )}
                    {tour.status === 'ONGOING' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateTourStatus(tour.id, 'COMPLETED')}
                        className="flex-1"
                      >
                        Hoàn thành tour
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTours.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy tour nào</p>
          </div>
        )}
      </div>
    </div>
  )
}