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
import { Plus, Search, DollarSign, TrendingDown, TrendingUp, Calendar, MapPin, Users } from 'lucide-react'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tourFilter, setTourFilter] = useState('all')

  const [newExpense, setNewExpense] = useState({
    tourId: '',
    type: 'TOUR_COST',
    amount: 0,
    description: ''
  })

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

  const handleCreateExpense = async () => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExpense),
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        setNewExpense({
          tourId: '',
          type: 'TOUR_COST',
          amount: 0,
          description: ''
        })
        fetchData()
      }
    } catch (error) {
      console.error('Error creating expense:', error)
    }
  }

  const filteredExpenses = Array.isArray(expenses) ? expenses.filter(expense => {
    const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.tour?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || expense.type === typeFilter
    const matchesTour = tourFilter === 'all' || expense.tourId === tourFilter
    return matchesSearch && matchesType && matchesTour
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => window.history.back()}>
                ← Quay lại
              </Button>
              <h1 className="ml-4 text-2xl font-bold text-gray-900">Quản lý Chi phí</h1>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm Chi phí
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Thêm Chi phí mới</DialogTitle>
                  <DialogDescription>
                    Nhập thông tin chi phí cho tour
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tour">Tour</Label>
                    <Select value={newExpense.tourId} onValueChange={(value) => setNewExpense({...newExpense, tourId: value})}>
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
                    <Label htmlFor="type">Loại chi phí</Label>
                    <Select value={newExpense.type} onValueChange={(value) => setNewExpense({...newExpense, type: value})}>
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
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                      placeholder="Nhập số tiền..."
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                      placeholder="Mô tả chi tiết về chi phí..."
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleCreateExpense}>
                    Thêm Chi phí
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
    </div>
  )
}