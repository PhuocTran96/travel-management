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
import { Plus, Search, DollarSign, TrendingDown, Calendar, MapPin, Users, Pencil, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CreateOrderDialog } from '@/components/ui/create-order-dialog'
import { EditExpenseDialog } from '@/components/ui/edit-expense-dialog'
import { NavBar } from '@/components/ui/nav-bar'
import { MusicPlayer } from '@/components/providers/client-layout'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tourFilter, setTourFilter] = useState('all')

  // Calculate default date range (first day of current month to today in GMT+7)
  const getDefaultDateRange = () => {
    const now = new Date()
    const gmtPlus7Offset = 7 * 60 // GMT+7 in minutes
    const localOffset = now.getTimezoneOffset()
    const offsetDiff = gmtPlus7Offset + localOffset
    const nowGMT7 = new Date(now.getTime() + offsetDiff * 60 * 1000)

    // Get current year and month in GMT+7
    const year = nowGMT7.getUTCFullYear()
    const month = nowGMT7.getUTCMonth()
    const day = nowGMT7.getUTCDate()

    // First day of current month in GMT+7 (YYYY-MM-01)
    const firstDayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`

    // Today in GMT+7 (YYYY-MM-DD)
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    return { firstDay: firstDayStr, today: todayStr }
  }

  // Filter states for NavBar
  const defaultDates = getDefaultDateRange()
  const [startDate, setStartDate] = useState(defaultDates.firstDay)
  const [endDate, setEndDate] = useState(defaultDates.today)
  const [leaderName, setLeaderName] = useState('')

  const [expenseList, setExpenseList] = useState([{
    id: Date.now().toString(),
    tourId: '',
    type: 'TOUR_COST',
    amount: 0,
    description: ''
  }])

  // Format number with thousand separators
  const formatNumber = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
    if (isNaN(num) || num === 0) return ''
    return num.toLocaleString('vi-VN')
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [expensesRes, toursRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/tours')
      ])

      const expensesData = await expensesRes.json()
      const toursData = await toursRes.json()

      if (expensesRes.ok && Array.isArray(expensesData)) {
        setExpenses(expensesData)
      } else {
        console.error('Failed to fetch expenses:', expensesData.error || 'Unknown error')
        setExpenses([])
      }

      if (toursRes.ok && Array.isArray(toursData)) {
        setTours(toursData)
      } else {
        console.error('Failed to fetch tours:', toursData.error || 'Unknown error')
        setTours([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setExpenses([])
      setTours([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExpenses = async () => {
    try {
      // Validate all expenses
      const validExpenses = expenseList.filter(exp => exp.tourId && exp.amount > 0)
      if (validExpenses.length === 0) {
        alert('Vui lòng điền đầy đủ thông tin cho ít nhất 1 chi phí')
        return
      }

      // Create all expenses
      const promises = validExpenses.map(expense =>
        fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expense),
        })
      )

      const results = await Promise.all(promises)
      const allSuccess = results.every(res => res.ok)

      if (allSuccess) {
        alert(`Đã thêm thành công ${validExpenses.length} chi phí`)
        setIsCreateDialogOpen(false)
        setExpenseList([{
          id: Date.now().toString(),
          tourId: '',
          type: 'TOUR_COST',
          amount: 0,
          description: ''
        }])
        fetchData()
      } else {
        alert('Có lỗi khi thêm một số chi phí')
      }
    } catch (error) {
      console.error('Error creating expenses:', error)
      alert('Lỗi kết nối server')
    }
  }

  const addExpenseRow = () => {
    setExpenseList([...expenseList, {
      id: Date.now().toString(),
      tourId: '',
      type: 'TOUR_COST',
      amount: 0,
      description: ''
    }])
  }

  const removeExpenseRow = (id: string) => {
    if (expenseList.length > 1) {
      setExpenseList(expenseList.filter(exp => exp.id !== id))
    }
  }

  const updateExpense = (id: string, field: string, value: any) => {
    setExpenseList(expenseList.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    ))
  }

  const filteredExpenses = Array.isArray(expenses) ? expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.tour?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || expense.type === typeFilter
    const matchesTour = tourFilter === 'all' || expense.tourId === tourFilter

    // Filter by leader name from NavBar (search in tour's bookings)
    const matchesLeader = !leaderName ||
      expense.tour?.bookings?.some((booking: any) =>
        booking.customer?.name?.toLowerCase().includes(leaderName.toLowerCase())
      ) ||
      expense.tour?.name?.toLowerCase().includes(leaderName.toLowerCase())

    // Filter by date range from NavBar (based on expense creation date)
    const expenseDate = new Date(expense.createdAt)
    const matchesStartDate = !startDate || expenseDate >= new Date(startDate)
    const matchesEndDate = !endDate || expenseDate <= new Date(endDate)

    return matchesSearch && matchesType && matchesTour && matchesLeader && matchesStartDate && matchesEndDate
  }) : []

  const getTypeText = (type) => {
    switch (type) {
      case 'TOUR_COST': return 'Chi phí tour'
      case 'PARTNER': return 'Chi phí đối tác'
      case 'GUIDE': return 'Chi phí HDV'
      case 'STAFF': return 'Chi phí nhân viên'
      default: return type
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'TOUR_COST': return 'default'
      case 'PARTNER': return 'secondary'
      case 'GUIDE': return 'outline'
      case 'STAFF': return 'destructive'
      default: return 'outline'
    }
  }

  const handleEdit = (expense) => {
    setSelectedExpense(expense)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (expenseId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chi phí này?')) {
      return
    }

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Xóa chi phí thành công!')
        fetchData()
      } else {
        alert('Lỗi khi xóa chi phí')
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Lỗi kết nối server')
    }
  }

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const expensesByType = expenses.reduce((acc, expense) => {
    acc[expense.type] = (acc[expense.type] || 0) + expense.amount
    return acc
  }, {})

  const expensesByTour = expenses.reduce((acc, expense) => {
    if (!acc[expense.tourId]) {
      acc[expense.tourId] = {
        tourName: expense.tour.name,
        total: 0,
        count: 0
      }
    }
    acc[expense.tourId].total += expense.amount
    acc[expense.tourId].count += 1
    return acc
  }, {})

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
        currentPage="expenses"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Expense Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Chi phí</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Thêm Chi phí
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1100px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thêm Chi phí mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin chi phí cho tour. Có thể thêm nhiều chi phí cùng lúc.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {expenseList.map((expense, index) => (
                  <div key={expense.id} className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Chi phí #{index + 1}</h3>
                      {expenseList.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpenseRow(expense.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`tour-${expense.id}`}>Tour</Label>
                      <Select
                        value={expense.tourId}
                        onValueChange={(value) => updateExpense(expense.id, 'tourId', value)}
                      >
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
                      <Label htmlFor={`tourType-${expense.id}`}>Loại tour</Label>
                      <Input
                        value={tours.find(t => t.id === expense.tourId)?.type ?
                          (tours.find(t => t.id === expense.tourId)?.type === 'GROUP' ? 'Tour ghép đoàn' :
                           tours.find(t => t.id === expense.tourId)?.type === 'PRIVATE' ? 'Tour private' :
                           tours.find(t => t.id === expense.tourId)?.type === 'ONE_ON_ONE' ? 'Tour 1-1' : '')
                          : ''}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`type-${expense.id}`}>Loại chi phí</Label>
                      <Select
                        value={expense.type}
                        onValueChange={(value) => updateExpense(expense.id, 'type', value)}
                      >
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
                      <Label htmlFor={`amount-${expense.id}`}>Số tiền (VNĐ)</Label>
                      <Input
                        type="text"
                        value={formatNumber(expense.amount)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '')
                          updateExpense(expense.id, 'amount', value === '' ? 0 : parseInt(value))
                        }}
                        placeholder="Nhập số tiền..."
                      />
                    </div>
                    <div>
                      <Label htmlFor={`description-${expense.id}`}>Mô tả</Label>
                      <Textarea
                        value={expense.description}
                        onChange={(e) => updateExpense(expense.id, 'description', e.target.value)}
                        placeholder="Mô tả chi tiết về chi phí..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addExpenseRow}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm chi phí khác
                </Button>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false)
                  setExpenseList([{
                    id: Date.now().toString(),
                    tourId: '',
                    type: 'TOUR_COST',
                    amount: 0,
                    description: ''
                  }])
                }}>
                  Hủy
                </Button>
                <Button onClick={handleCreateExpenses}>
                  Thêm {expenseList.length} Chi phí
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Chi phí</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalExpenses.toLocaleString()}đ</div>
              <p className="text-xs text-muted-foreground">Tổng tất cả chi phí</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chi phí Tour</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(expensesByType.TOUR_COST || 0).toLocaleString()}đ</div>
              <p className="text-xs text-muted-foreground">Chi phí trực tiếp tour</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chi phí Đối tác</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(expensesByType.PARTNER || 0).toLocaleString()}đ</div>
              <p className="text-xs text-muted-foreground">Thanh toán đối tác</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chi phí Nhân sự</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((expensesByType.GUIDE || 0) + (expensesByType.STAFF || 0)).toLocaleString()}đ
              </div>
              <p className="text-xs text-muted-foreground">HDV và nhân viên</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo mô tả hoặc tour..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Lọc theo loại chi phí" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="TOUR_COST">Chi phí tour</SelectItem>
              <SelectItem value="PARTNER">Chi phí đối tác</SelectItem>
              <SelectItem value="GUIDE">Chi phí HDV</SelectItem>
              <SelectItem value="STAFF">Chi phí nhân viên</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tourFilter} onValueChange={setTourFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Lọc theo tour" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả tour</SelectItem>
              {tours.map((tour) => (
                <SelectItem key={tour.id} value={tour.id}>
                  {tour.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Danh sách Chi phí</TabsTrigger>
            <TabsTrigger value="summary">Báo cáo Tổng hợp</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <div className="grid gap-4">
              {filteredExpenses.map((expense) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="font-semibold text-lg">{expense.tour.name}</h3>
                          <Badge variant={getTypeColor(expense.type)}>
                            {getTypeText(expense.type)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-red-600">{expense.amount.toLocaleString()}đ</p>
                              <p className="text-xs text-gray-500">Số tiền</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm">{new Date(expense.createdAt).toLocaleDateString('vi-VN')}</p>
                              <p className="text-xs text-gray-500">Ngày tạo</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm">{expense.tour.type}</p>
                              <p className="text-xs text-gray-500">Loại tour</p>
                            </div>
                          </div>
                        </div>
                        
                        {expense.description && (
                          <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-600">{expense.description}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(expense)}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Sửa
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredExpenses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Không tìm thấy chi phí nào</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="summary">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expenses by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Chi phí theo Loại</CardTitle>
                  <CardDescription>Phân bổ chi phí theo từng loại</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(expensesByType).map(([type, amount]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getTypeColor(type)}>
                          {getTypeText(type)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{amount.toLocaleString()}đ</p>
                        <p className="text-xs text-gray-500">
                          {((amount / totalExpenses) * 100).toFixed(1)}% tổng chi phí
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Expenses by Tour */}
              <Card>
                <CardHeader>
                  <CardTitle>Chi phí theo Tour</CardTitle>
                  <CardDescription>Tổng chi phí cho từng tour</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(expensesByTour).map(([tourId, data]) => (
                    <div key={tourId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{data.tourName}</p>
                        <p className="text-xs text-gray-500">{data.count} khoản chi phí</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{data.total.toLocaleString()}đ</p>
                        <p className="text-xs text-gray-500">
                          {((data.total / totalExpenses) * 100).toFixed(1)}% tổng chi phí
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={isCreateOrderDialogOpen}
        onOpenChange={setIsCreateOrderDialogOpen}
        onSuccess={fetchData}
      />

      {/* Edit Expense Dialog */}
      {selectedExpense && (
        <EditExpenseDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          expense={selectedExpense}
          tours={tours}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}