'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Users, Search, MapPin, DollarSign, Clock, TrendingUp, Plus, Pencil, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CreateOrderDialog } from '@/components/ui/create-order-dialog'
import { EditOrderDialog } from '@/components/ui/edit-order-dialog'
import { MusicPlayer } from '@/components/providers/client-layout'

export default function ToursPage() {
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTour, setSelectedTour] = useState(null)

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

  const handleEdit = (tour) => {
    setSelectedTour(tour)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (tourId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tour này? Tất cả booking và chi phí liên quan sẽ bị xóa.')) {
      return
    }

    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Xóa tour thành công!')
        fetchTours()
      } else {
        alert('Lỗi khi xóa tour')
      }
    } catch (error) {
      console.error('Error deleting tour:', error)
      alert('Lỗi kết nối server')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-100 via-green-50 to-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <img src="/logo.png" alt="Chân Trời Góc Bể Travel" className="h-16" />
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 animate-pulse">
                Hi, Thanh
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      className="rounded-full"
                      onClick={() => setIsCreateOrderDialogOpen(true)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tạo đơn hàng mới</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <MusicPlayer />
              <Button variant="outline">Đăng xuất</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Button variant="ghost" asChild>
              <a href="/">
                <TrendingUp className="w-4 h-4 mr-2" />
                Dashboard
              </a>
            </Button>
            <Button variant="ghost" className="text-blue-600">
              <MapPin className="w-4 h-4 mr-2" />
              Quản lý Đơn hàng
            </Button>
            <Button variant="ghost" asChild>
              <a href="/expenses">
                <DollarSign className="w-4 h-4 mr-2" />
                Quản lý Chi phí
              </a>
            </Button>
          </div>
        </div>
      </nav>

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

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(tour)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(tour.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa
                    </Button>
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

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={isCreateOrderDialogOpen}
        onOpenChange={setIsCreateOrderDialogOpen}
        onSuccess={fetchTours}
      />

      {/* Edit Order Dialog */}
      {selectedTour && (
        <EditOrderDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          tourId={selectedTour.id}
          onSuccess={fetchTours}
        />
      )}
    </div>
  )
}