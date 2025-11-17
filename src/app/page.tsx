'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, DollarSign, TrendingUp, MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react'

export default function Home() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalTours: 0,
    totalBookings: 0,
    totalRevenue: 0
  })

  const [recentBookings, setRecentBookings] = useState([])
  const [upcomingTours, setUpcomingTours] = useState([])
  const [tourStatus, setTourStatus] = useState({ upcoming: 0, ongoing: 0, completed: 0 })
  const [revenueByType, setRevenueByType] = useState({ group: 0, private: 0, oneOnOne: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const data = await response.json()

      if (response.ok && data.stats) {
        setStats(data.stats)
        setRecentBookings(data.recentBookings || [])
        setUpcomingTours(data.upcomingTours || [])
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Hệ thống Quản lý Du lịch</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">Đăng xuất</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Button variant="ghost" className="text-blue-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="ghost" asChild>
              <a href="/booking">
                <Calendar className="w-4 h-4 mr-2" />
                Quản lý Booking
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <a href="/tours">
                <MapPin className="w-4 h-4 mr-2" />
                Quản lý Tour
              </a>
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
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">+20% so với tháng trước</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Tour</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTours}</div>
              <p className="text-xs text-muted-foreground">+5 tour mới</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Booking</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">+12% so với tháng trước</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}đ</div>
              <p className="text-xs text-muted-foreground">+18% so với tháng trước</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="bookings">Booking gần đây</TabsTrigger>
            <TabsTrigger value="tours">Tour sắp diễn ra</TabsTrigger>
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
                            <p className="text-sm text-muted-foreground">{booking.tourName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{booking.totalPrice.toLocaleString()}đ</p>
                          <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                            {booking.status}
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
                    upcomingTours.map((tour) => (
                      <div key={tour.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{tour.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tour.startDate} - {tour.endDate}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {tour.bookedGuests}/{tour.maxGuests} khách
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{tour.price.toLocaleString()}đ</p>
                          <Badge variant="outline">{tour.type}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </>
        )}
      </main>
    </div>
  )
}