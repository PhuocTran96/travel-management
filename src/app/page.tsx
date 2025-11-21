'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus } from 'lucide-react'
import { CreateOrderDialog } from '@/components/ui/create-order-dialog'
import { NavBar } from '@/components/ui/nav-bar'
import { MusicPlayer } from '@/components/providers/client-layout'

interface RecentBooking {
  id: string
  customerName: string
  tourName: string
  tourType: 'GROUP' | 'PRIVATE' | 'ONE_ON_ONE'
  totalPrice: number
  deposit: number
  status: string
}

interface UpcomingTour {
  id: string
  name: string
  startDate: string
  endDate: string
  maxGuests: number
  bookedGuests: number
  price: number
  type: 'GROUP' | 'PRIVATE' | 'ONE_ON_ONE'
}

interface CompletedTour {
  id: string
  name: string
  startDate: string
  endDate: string
  maxGuests: number
  bookedGuests: number
  totalPrice: number
  totalDeposit: number
  remainingAmount: number
}

export default function Home() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    grossProfit: 0,
    totalRevenue: 0,
    totalExpenses: 0
  })

  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [upcomingTours, setUpcomingTours] = useState<UpcomingTour[]>([])
  const [ongoingTours, setOngoingTours] = useState<UpcomingTour[]>([])
  const [completedTours, setCompletedTours] = useState<CompletedTour[]>([])
  const [tourStatus, setTourStatus] = useState({ upcoming: 0, ongoing: 0, completed: 0 })
  const [revenueByType, setRevenueByType] = useState({ group: 0, private: 0, oneOnOne: 0 })
  const [loading, setLoading] = useState(true)
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leaderName, setLeaderName] = useState('')

  // Helper function to normalize status
  const getDisplayStatus = (status: string) => {
    if (status === 'CONFIRMED') return 'Đã thanh toán đủ'
    if (status === 'PENDING') return 'Chưa thanh toán đủ'
    return status
  }

  const isFullyPaid = (status: string) => {
    return status === 'Đã thanh toán đủ' || status === 'CONFIRMED'
  }

  // Calculate days until tour starts (GMT+7)
  const getDaysUntilTour = (startDateISO: string) => {
    const now = new Date()
    const gmtPlus7Offset = 7 * 60 // GMT+7 in minutes
    const localOffset = now.getTimezoneOffset() // Local timezone offset in minutes
    const offsetDiff = gmtPlus7Offset + localOffset // Difference in minutes

    // Current time in GMT+7
    const nowGMT7 = new Date(now.getTime() + offsetDiff * 60 * 1000)

    // Tour start date
    const startDate = new Date(startDateISO)

    // Calculate difference in days
    const diffTime = startDate.getTime() - nowGMT7.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const formatDaysCountdown = (days: number) => {
    if (days === 1) return 'Ngày mai'
    if (days < 0) return `${Math.abs(days)} ngày trước`
    return `Còn ${days} ngày`
  }

  // Calculate days until tour ends (for ongoing tours)
  const getDaysUntilTourEnds = (endDateISO: string) => {
    const now = new Date()
    const gmtPlus7Offset = 7 * 60
    const localOffset = now.getTimezoneOffset()
    const offsetDiff = gmtPlus7Offset + localOffset

    const nowGMT7 = new Date(now.getTime() + offsetDiff * 60 * 1000)
    const endDate = new Date(endDateISO)

    const diffTime = endDate.getTime() - nowGMT7.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  useEffect(() => {
    fetchDashboardData()
  }, [startDate, endDate, leaderName])

  const fetchDashboardData = async () => {
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (leaderName) params.append('leaderName', leaderName)

      const response = await fetch(`/api/dashboard?${params.toString()}`)
      const data = await response.json()

      if (response.ok && data.stats) {
        setStats(data.stats)
        setRecentBookings(data.recentBookings || [])
        setUpcomingTours(data.upcomingTours || [])
        setOngoingTours(data.ongoingTours || [])
        setCompletedTours(data.completedTours || [])
        setTourStatus(data.tourStatus || { upcoming: 0, ongoing: 0, completed: 0 })
        setRevenueByType(data.revenueByType || { group: 0, private: 0, oneOnOne: 0 })
      } else {
        console.error('Failed to fetch dashboard data:', data.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
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
        currentPage="dashboard"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Khách hàng</CardTitle>
              <a href="/tours" className="text-xs text-blue-600 hover:underline">Chi tiết</a>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Đơn hàng</CardTitle>
              <a href="/tours" className="text-xs text-blue-600 hover:underline">Chi tiết</a>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lợi nhuận gộp</CardTitle>
              <a href="/expenses" className="text-xs text-blue-600 hover:underline">Chi tiết</a>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.grossProfit.toLocaleString()}đ</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
              <a href="/expenses" className="text-xs text-blue-600 hover:underline">Chi tiết</a>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}đ</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="bookings">Booking gần đây</TabsTrigger>
            <TabsTrigger value="tours">Tour sắp diễn ra</TabsTrigger>
            <TabsTrigger value="ongoing">Tour đang diễn ra</TabsTrigger>
            <TabsTrigger value="completed">Tour đã hoàn thành</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tour Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Tình trạng Tour</CardTitle>
                  <CardDescription>Thống kê tour theo trạng thái</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sắp diễn ra</span>
                    <Badge variant="secondary">{tourStatus.upcoming} tours</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Đang diễn ra</span>
                    <Badge variant="default">{tourStatus.ongoing} tours</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Hoàn thành</span>
                    <Badge variant="outline">{tourStatus.completed} tours</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Phân tích Doanh thu</CardTitle>
                  <CardDescription>Doanh thu theo loại tour</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tour ghép đoàn</span>
                    <span className="text-sm font-bold">{revenueByType.group.toLocaleString()}đ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tour private</span>
                    <span className="text-sm font-bold">{revenueByType.private.toLocaleString()}đ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tour 1-1</span>
                    <span className="text-sm font-bold">{revenueByType.oneOnOne.toLocaleString()}đ</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Booking gần đây</CardTitle>
                <CardDescription>Các booking được tạo gần đây</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentBookings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Chưa có booking nào</p>
                  ) : (
                    recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{booking.customerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.tourName} - {booking.tourType === 'GROUP' ? 'Tour ghép đoàn' : booking.tourType === 'PRIVATE' ? 'Tour private' : 'Tour 1-1'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="flex flex-col items-end">
                            <p className="text-xs text-muted-foreground">Chi phí sau chiết khấu</p>
                            <p className="font-medium">{booking.totalPrice.toLocaleString()}đ</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-xs text-muted-foreground">Khách đã thanh toán</p>
                            <p className="font-medium text-green-600">{booking.deposit.toLocaleString()}đ</p>
                          </div>
                          <Badge variant={isFullyPaid(booking.status) ? 'default' : 'secondary'}>
                            {getDisplayStatus(booking.status)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tours">
            <Card>
              <CardHeader>
                <CardTitle>Tour sắp diễn ra</CardTitle>
                <CardDescription>Các tour sẽ khởi hành trong thời gian tới</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingTours.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Chưa có tour nào sắp diễn ra</p>
                  ) : (
                    upcomingTours.map((tour) => {
                      const daysUntil = getDaysUntilTour(tour.startDate)
                      return (
                        <div key={tour.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{tour.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tour.startDate).toLocaleDateString('vi-VN')} - {new Date(tour.endDate).toLocaleDateString('vi-VN')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {tour.bookedGuests}/{tour.maxGuests} khách
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-lg ${daysUntil <= 3 ? 'text-red-600' : daysUntil <= 7 ? 'text-orange-600' : 'text-blue-600'}`}>
                              {formatDaysCountdown(daysUntil)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ongoing">
            <Card>
              <CardHeader>
                <CardTitle>Tour đang diễn ra</CardTitle>
                <CardDescription>Các tour đang trong thời gian diễn ra</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ongoingTours.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Chưa có tour nào đang diễn ra</p>
                  ) : (
                    ongoingTours.map((tour) => {
                      const daysUntilEnd = getDaysUntilTourEnds(tour.endDate)
                      return (
                        <div key={tour.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{tour.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tour.startDate).toLocaleDateString('vi-VN')} - {new Date(tour.endDate).toLocaleDateString('vi-VN')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {tour.bookedGuests}/{tour.maxGuests} khách
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-lg ${daysUntilEnd <= 3 ? 'text-red-600' : daysUntilEnd <= 7 ? 'text-orange-600' : 'text-blue-600'}`}>
                              {formatDaysCountdown(daysUntilEnd)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Tour đã hoàn thành</CardTitle>
                <CardDescription>Các tour đã hoàn thành và thông tin thanh toán</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedTours.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Chưa có tour nào đã hoàn thành</p>
                  ) : (
                    completedTours.map((tour) => {
                      return (
                        <div key={tour.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{tour.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(tour.startDate).toLocaleDateString('vi-VN')} - {new Date(tour.endDate).toLocaleDateString('vi-VN')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {tour.bookedGuests}/{tour.maxGuests} khách
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-lg ${tour.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {tour.remainingAmount > 0
                                ? `Thiếu ${tour.remainingAmount.toLocaleString()}đ`
                                : 'Đã thanh toán đủ'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {tour.totalDeposit.toLocaleString()}đ / {tour.totalPrice.toLocaleString()}đ
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
        )}
      </main>

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={isCreateOrderDialogOpen}
        onOpenChange={setIsCreateOrderDialogOpen}
        onSuccess={fetchDashboardData}
      />
    </div>
  )
}