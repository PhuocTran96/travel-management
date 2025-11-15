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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Users, Plus, Search, Phone, Mail, Facebook, Instagram, MapPin, DollarSign } from 'lucide-react'

export default function BookingPage() {
  const [bookings, setBookings] = useState([])
  const [customers, setCustomers] = useState([])
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [newBooking, setNewBooking] = useState({
    customerId: '',
    tourId: '',
    deposit: 0,
    totalPrice: 0,
    status: 'PENDING',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [bookingsRes, customersRes, toursRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/customers'),
        fetch('/api/tours')
      ])

      const bookingsData = await bookingsRes.json()
      const customersData = await customersRes.json()
      const toursData = await toursRes.json()

      setBookings(bookingsData)
      setCustomers(customersData)
      setTours(toursData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBooking = async () => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBooking),
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        setNewBooking({
          customerId: '',
          tourId: '',
          deposit: 0,
          totalPrice: 0,
          status: 'PENDING',
          notes: ''
        })
        fetchData()
      }
    } catch (error) {
      console.error('Error creating booking:', error)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customer.maKH.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'default'
      case 'PENDING': return 'secondary'
      case 'CANCELLED': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'Đã xác nhận'
      case 'PENDING': return 'Chờ xác nhận'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
    }
  }

  const getTourTypeText = (type) => {
    switch (type) {
      case 'GROUP': return 'Tour ghép đoàn'
      case 'PRIVATE': return 'Tour private'
      case 'ONE_ON_ONE': return 'Tour 1-1'
      default: return type
    }
  }

  const getSourceIcon = (source) => {
    switch (source.toLowerCase()) {
      case 'fb':
      case 'facebook':
        return <Facebook className="w-4 h-4" />
      case 'ig':
      case 'instagram':
        return <Instagram className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
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
              <h1 className="ml-4 text-2xl font-bold text-gray-900">Quản lý Booking</h1>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo Booking mới
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tạo Booking mới</DialogTitle>
                  <DialogDescription>
                    Thêm booking mới cho khách hàng
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer">Khách hàng</Label>
                    <Select value={newBooking.customerId} onValueChange={(value) => setNewBooking({...newBooking, customerId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khách hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.maKH} - {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tour">Tour</Label>
                    <Select value={newBooking.tourId} onValueChange={(value) => setNewBooking({...newBooking, tourId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tour" />
                      </SelectTrigger>
                      <SelectContent>
                        {tours.map((tour) => (
                          <SelectItem key={tour.id} value={tour.id}>
                            {tour.name} - {tour.price.toLocaleString()}đ
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deposit">Tiền cọc</Label>
                    <Input
                      type="number"
                      value={newBooking.deposit}
                      onChange={(e) => setNewBooking({...newBooking, deposit: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalPrice">Tổng tiền</Label>
                    <Input
                      type="number"
                      value={newBooking.totalPrice}
                      onChange={(e) => setNewBooking({...newBooking, totalPrice: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Trạng thái</Label>
                    <Select value={newBooking.status} onValueChange={(value) => setNewBooking({...newBooking, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Chờ xác nhận</SelectItem>
                        <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                        <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      value={newBooking.notes}
                      onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                      placeholder="Ghi chú về booking..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleCreateBooking}>
                    Tạo Booking
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
                placeholder="Tìm kiếm theo tên khách hàng, mã KH, hoặc tour..."
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
              <SelectItem value="PENDING">Chờ xác nhận</SelectItem>
              <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings List */}
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{booking.customer.name}</h3>
                        <p className="text-sm text-gray-500">Mã KH: {booking.customer.maKH}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {getSourceIcon(booking.customer.source)}
                        <span>{booking.customer.source}</span>
                      </div>
                      <Badge variant={getStatusColor(booking.status)}>
                        {getStatusText(booking.status)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{booking.tour.name}</p>
                          <p className="text-xs text-gray-500">{getTourTypeText(booking.tour.type)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm">{new Date(booking.tour.startDate).toLocaleDateString('vi-VN')}</p>
                          <p className="text-xs text-gray-500">Khởi hành</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-sm">{booking.customer.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{booking.totalPrice.toLocaleString()}đ</p>
                          <p className="text-xs text-gray-500">Đặt cọc: {booking.deposit.toLocaleString()}đ</p>
                        </div>
                      </div>
                    </div>
                    
                    {booking.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy booking nào</p>
          </div>
        )}
      </div>
    </div>
  )
}