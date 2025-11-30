'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Plus, Pencil, Trash2, Download } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CreateOrderDialog } from '@/components/ui/create-order-dialog'
import { EditOrderDialog } from '@/components/ui/edit-order-dialog'
import { NavBar } from '@/components/ui/nav-bar'
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

  // Calculate default date range (first day of current month to last day of current month in GMT+7)
  const getDefaultDateRange = () => {
    const now = new Date()
    const gmtPlus7Offset = 7 * 60 // GMT+7 in minutes
    const localOffset = now.getTimezoneOffset()
    const offsetDiff = gmtPlus7Offset + localOffset
    const nowGMT7 = new Date(now.getTime() + offsetDiff * 60 * 1000)

    // Get current year and month in GMT+7
    const year = nowGMT7.getUTCFullYear()
    const month = nowGMT7.getUTCMonth()

    // First day of current month in GMT+7 (YYYY-MM-01)
    const firstDayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`

    // Last day of current month in GMT+7 (YYYY-MM-DD)
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)) // 0th day of next month = last day of current month
    const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth.getUTCDate()).padStart(2, '0')}`

    return { firstDay: firstDayStr, lastDay: lastDayStr }
  }

  // Filter states for NavBar
  const defaultDates = getDefaultDateRange()
  const [startDate, setStartDate] = useState(defaultDates.firstDay)
  const [endDate, setEndDate] = useState(defaultDates.lastDay)
  const [leaderName, setLeaderName] = useState('')

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

    // Filter by leader name from NavBar
    const matchesLeader = !leaderName ||
      tour.bookings?.some((booking: any) =>
        booking.customer?.name?.toLowerCase().includes(leaderName.toLowerCase())
      )

    // Filter by date range from NavBar
    const tourEndDate = new Date(tour.endDate)
    const matchesStartDate = !startDate || tourEndDate >= new Date(startDate)
    const matchesEndDate = !endDate || tourEndDate <= new Date(endDate)

    return matchesSearch && matchesStatus && matchesType && matchesLeader && matchesStartDate && matchesEndDate
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  const getPaymentStatus = (tour) => {
    const totalPrice = tour.bookings?.reduce((sum, b) => sum + (b.totalPrice || 0), 0) || 0
    const totalDeposit = tour.bookings?.reduce((sum, b) => sum + (b.deposit || 0), 0) || 0
    const remaining = totalPrice - totalDeposit
    if (remaining <= 0) return { text: 'Đủ', color: 'text-green-600' }
    return { text: remaining.toLocaleString(), color: 'text-red-600' }
  }

  const getLeaderInfo = (tour) => {
    const firstBooking = tour.bookings?.[0]
    return {
      name: firstBooking?.customer?.name || '-',
      phone: firstBooking?.customer?.phone || '-'
    }
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

  const handleExportExcel = () => {
    // Create CSV content
    const headers = ['Tên Tour', 'Loại Tour', 'Trưởng nhóm', 'SĐT', 'Start Date', 'End Date', 'Status', 'Thanh toán']
    const rows = filteredTours.map(tour => {
      const leader = getLeaderInfo(tour)
      const payment = getPaymentStatus(tour)
      return [
        tour.name,
        getTypeText(tour.type),
        leader.name,
        leader.phone,
        formatDate(tour.startDate),
        formatDate(tour.endDate),
        getStatusText(tour.status),
        payment.text
      ]
    })

    // Convert to CSV
    const csvContent = [
      '\uFEFF' + headers.join(','), // BOM for UTF-8
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `danh-sach-don-hang-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
            <a href="/" className="flex items-center">
              <img src="/logo.png" alt="Chân Trời Góc Bể Travel" className="h-16 cursor-pointer" />
            </a>
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

      {/* Navigation + Filters */}
      <NavBar
        currentPage="tours"
        startDate={startDate}
        endDate={endDate}
        leaderName={leaderName}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onLeaderNameChange={setLeaderName}
        onClearFilters={() => {
          setStartDate('')
          setEndDate('')
          setLeaderName('')
        }}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('UPCOMING')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sắp diễn ra</p>
                  <p className="text-2xl font-bold mt-1">
                    {filteredTours.filter(t => t.status === 'UPCOMING').length}
                  </p>
                </div>
                <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {filteredTours.filter(t => t.status === 'UPCOMING').length}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('ONGOING')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Đang diễn ra</p>
                  <p className="text-2xl font-bold mt-1">
                    {filteredTours.filter(t => t.status === 'ONGOING').length}
                  </p>
                </div>
                <div className="bg-green-100 text-green-600 rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {filteredTours.filter(t => t.status === 'ONGOING').length}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('COMPLETED')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
                  <p className="text-2xl font-bold mt-1">
                    {filteredTours.filter(t => t.status === 'COMPLETED').length}
                  </p>
                </div>
                <div className="bg-gray-100 text-gray-600 rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {filteredTours.filter(t => t.status === 'COMPLETED').length}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
          <Button
            variant="outline"
            className="w-48"
            onClick={handleExportExcel}
          >
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
        </div>

        {/* Tours Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Tên Tour</TableHead>
                <TableHead>Loại Tour</TableHead>
                <TableHead>Trưởng nhóm</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTours.map((tour) => {
                const leader = getLeaderInfo(tour)
                const payment = getPaymentStatus(tour)
                return (
                  <TableRow key={tour.id}>
                    <TableCell className="font-medium max-w-[200px] truncate" title={tour.name}>
                      {tour.name}
                    </TableCell>
                    <TableCell>{getTypeText(tour.type)}</TableCell>
                    <TableCell>{leader.name}</TableCell>
                    <TableCell>{leader.phone}</TableCell>
                    <TableCell>{formatDate(tour.startDate)}</TableCell>
                    <TableCell>{formatDate(tour.endDate)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(tour.status)}>
                        {getStatusText(tour.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className={payment.color + ' font-medium'}>
                      {payment.text}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(tour)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(tour.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
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