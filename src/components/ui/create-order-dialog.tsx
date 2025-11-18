'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown, Plus, Minus } from 'lucide-react'
import countries from 'world-countries'
import { cn } from '@/lib/utils'

interface TourInfo {
  id: string
  stt: number
  tenTour: string
  dichVu: string
  gia: string
  ghiChu: string | null
}

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateOrderDialog({ open, onOpenChange, onSuccess }: CreateOrderDialogProps) {
  const [currentStep, setCurrentStep] = useState<'customer' | 'tour' | 'review'>('customer')
  const [loading, setLoading] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)

  // Tour info from database
  const [tourInfoList, setTourInfoList] = useState<TourInfo[]>([])
  const [selectedTourName, setSelectedTourName] = useState('')

  // Service quantities: { serviceId: quantity }
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({})

  // Payment info
  const [discount, setDiscount] = useState(0) // Percentage
  const [paidAmount, setPaidAmount] = useState(0) // Amount paid

  // Guest details: { serviceId: [{ name: string, phone: string }] }
  const [guestDetails, setGuestDetails] = useState<Record<string, Array<{ name: string; phone: string }>>>({})
  const [showGuestDetailsDialog, setShowGuestDetailsDialog] = useState(false)

  // Customer data
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Website',
    address: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    title: '',
    country: '',
    dateOfBirth: undefined as Date | undefined
  })

  // Tour data
  const [tourData, setTourData] = useState({
    name: '',
    description: '',
    type: 'GROUP',
    maxGuests: 10,
    price: 0,
    startDate: '',
    endDate: '',
    status: 'UPCOMING'
  })

  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null)

  // Fetch tour info on mount
  useEffect(() => {
    async function fetchTourInfo() {
      try {
        const response = await fetch('/api/tour-info')
        const data = await response.json()
        // Ensure data is an array
        if (Array.isArray(data)) {
          setTourInfoList(data)
        } else {
          console.error('Tour info data is not an array:', data)
          setTourInfoList([])
        }
      } catch (error) {
        console.error('Error fetching tour info:', error)
        setTourInfoList([])
      }
    }
    fetchTourInfo()
  }, [])

  // Get unique tour names - ensure tourInfoList is array
  const uniqueTourNames = Array.isArray(tourInfoList)
    ? Array.from(new Set(tourInfoList.map(t => t.tenTour)))
    : []

  // Get available services for selected tour
  const availableServices = Array.isArray(tourInfoList)
    ? tourInfoList.filter(t => t.tenTour === selectedTourName)
    : []

  // Calculate total price from all selected services
  const calculateTotalPrice = () => {
    let total = 0
    Object.entries(serviceQuantities).forEach(([serviceId, quantity]) => {
      const service = tourInfoList.find(t => t.id === serviceId)
      if (service && service.gia !== 'Liên hệ') {
        const price = parseFloat(service.gia.replace(/,/g, ''))
        total += price * quantity
      }
    })
    return total
  }

  // Calculate total guests from all selected services
  const calculateTotalGuests = () => {
    return Object.values(serviceQuantities).reduce((sum, qty) => sum + qty, 0)
  }

  // Calculate final price after discount
  const calculateDiscountedPrice = () => {
    const total = calculateTotalPrice()
    return total - (total * discount / 100)
  }

  // Format number with thousand separators
  const formatNumber = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
    if (isNaN(num)) return ''
    return num.toLocaleString('vi-VN')
  }

  // Parse formatted number back to number
  const parseFormattedNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, '')) || 0
  }

  // Count total guests with details
  const countGuestsWithDetails = () => {
    let count = 1 // Leader (customer from step 1)
    Object.values(guestDetails).forEach(guests => {
      count += guests.filter(g => g.name.trim() !== '').length
    })
    return count
  }

  // Initialize guest details when moving to review step
  const initializeGuestDetails = () => {
    const details: Record<string, Array<{ name: string; phone: string }>> = {}
    Object.entries(serviceQuantities).forEach(([serviceId, qty]) => {
      details[serviceId] = Array.from({ length: qty }, () => ({ name: '', phone: '' }))
    })
    setGuestDetails(details)
  }

  // Update guest detail for a specific service and index
  const updateGuestDetail = (serviceId: string, index: number, field: 'name' | 'phone', value: string) => {
    setGuestDetails(prev => ({
      ...prev,
      [serviceId]: prev[serviceId].map((guest, i) =>
        i === index ? { ...guest, [field]: value } : guest
      )
    }))
  }

  // Update tour price and maxGuests when service quantities change
  useEffect(() => {
    const totalPrice = calculateTotalPrice()
    const totalGuests = calculateTotalGuests()
    setTourData(prev => ({
      ...prev,
      price: totalPrice,
      maxGuests: totalGuests
    }))
  }, [serviceQuantities])

  // Update service quantity
  const updateServiceQuantity = (serviceId: string, delta: number) => {
    setServiceQuantities(prev => {
      const currentQty = prev[serviceId] || 0
      const newQty = Math.max(0, currentQty + delta)

      if (newQty === 0) {
        const { [serviceId]: _, ...rest } = prev
        return rest
      }

      return { ...prev, [serviceId]: newQty }
    })
  }

  // Set service quantity manually
  const setServiceQuantity = (serviceId: string, quantity: number) => {
    const qty = Math.max(0, quantity)

    if (qty === 0) {
      setServiceQuantities(prev => {
        const { [serviceId]: _, ...rest } = prev
        return rest
      })
    } else {
      setServiceQuantities(prev => ({ ...prev, [serviceId]: qty }))
    }
  }

  const resetForm = () => {
    setCurrentStep('customer')
    setCustomerData({
      name: '',
      email: '',
      phone: '',
      source: 'Website',
      address: '',
      gender: 'MALE',
      title: '',
      country: '',
      dateOfBirth: undefined
    })
    setTourData({ name: '', description: '', type: 'GROUP', maxGuests: 10, price: 0, startDate: '', endDate: '', status: 'UPCOMING' })
    setSelectedTourName('')
    setServiceQuantities({})
    setDiscount(0)
    setPaidAmount(0)
    setGuestDetails({})
    setShowGuestDetailsDialog(false)
    setCreatedCustomerId(null)
  }

  const handleNextStep = () => {
    // Validate customer data
    if (!customerData.name || !customerData.phone) {
      alert('Vui lòng điền đầy đủ thông tin khách hàng')
      return
    }
    // Move to tour step without saving to DB
    setCurrentStep('tour')
  }

  const handleNextToReview = () => {
    // Validate tour data
    if (!selectedTourName || Object.keys(serviceQuantities).length === 0 || !tourData.startDate || !tourData.endDate) {
      alert('Vui lòng điền đầy đủ thông tin tour')
      return
    }
    // Initialize guest details
    initializeGuestDetails()
    // Move to review step
    setCurrentStep('review')
  }

  const handleCreateOrder = async () => {
    // Validate có ít nhất 1 dịch vụ được chọn
    if (Object.keys(serviceQuantities).length === 0) {
      alert('Vui lòng chọn ít nhất 1 dịch vụ')
      return
    }

    setLoading(true)
    try {
      // Step 1: Create customer
      const customerResponse = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customerData,
          dateOfBirth: customerData.dateOfBirth?.toISOString()
        })
      })

      const customerResult = await customerResponse.json()

      if (!customerResponse.ok) {
        alert('Lỗi tạo khách hàng: ' + (customerResult.error || 'Unknown error'))
        setLoading(false)
        return
      }

      const customerId = customerResult.id

      // Build tour name with selected services
      const selectedServices = Object.keys(serviceQuantities).map(serviceId => {
        const service = tourInfoList.find(t => t.id === serviceId)
        return service ? `${service.dichVu} (x${serviceQuantities[serviceId]})` : ''
      }).filter(Boolean).join(', ')

      const tourName = `${selectedTourName} - ${selectedServices}`

      // Step 2: Create tour
      const tourResponse = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tourData,
          name: tourName,
          price: parseFloat(tourData.price.toString()),
          maxGuests: parseInt(tourData.maxGuests.toString())
        })
      })

      const tourResult = await tourResponse.json()

      if (!tourResponse.ok) {
        alert('Lỗi tạo tour: ' + (tourResult.error || 'Unknown error'))
        setLoading(false)
        return
      }

      // Step 3: Create booking
      const finalPrice = calculateDiscountedPrice()
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
          tourId: tourResult.id,
          deposit: paidAmount,
          totalPrice: finalPrice,
          status: paidAmount >= finalPrice ? 'CONFIRMED' : 'PENDING',
          notes: tourData.description || ''
        })
      })

      const bookingResult = await bookingResponse.json()

      if (bookingResponse.ok) {
        alert('Tạo đơn hàng thành công!')
        resetForm()
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        alert('Lỗi tạo booking: ' + (bookingResult.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Lỗi kết nối server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Đơn Hàng Mới</DialogTitle>
          <DialogDescription>
            Tạo khách hàng, tour và booking trong một quy trình
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer" disabled={currentStep !== 'customer'}>
              1. Khách hàng
            </TabsTrigger>
            <TabsTrigger value="tour" disabled={currentStep !== 'tour'}>
              2. Tour
            </TabsTrigger>
            <TabsTrigger value="review" disabled={currentStep !== 'review'}>
              3. Xem lại
            </TabsTrigger>
          </TabsList>

          {/* Step 1: Customer */}
          <TabsContent value="customer" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên khách hàng *</Label>
              <Input
                id="name"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input
                id="phone"
                value={customerData.phone}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                placeholder="0912345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Nguồn</Label>
              <Select value={customerData.source} onValueChange={(value) => setCustomerData({ ...customerData, source: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Zalo">Zalo</SelectItem>
                  <SelectItem value="Referral">Giới thiệu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={customerData.address}
                onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                placeholder="Địa chỉ khách hàng"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Giới tính</Label>
              <Select value={customerData.gender} onValueChange={(value: 'MALE' | 'FEMALE') => setCustomerData({ ...customerData, gender: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Nam</SelectItem>
                  <SelectItem value="FEMALE">Nữ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Danh xưng</Label>
              <Input
                id="title"
                value={customerData.title}
                onChange={(e) => setCustomerData({ ...customerData, title: e.target.value })}
                placeholder="Ông, Bà, Anh, Chị..."
              />
            </div>

            <div className="space-y-2">
              <Label>Quốc gia</Label>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={countryOpen}
                    className="w-full justify-between"
                  >
                    {customerData.country
                      ? countries.find((country) => country.name.common === customerData.country)?.name.common
                      : "Chọn quốc gia..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Tìm quốc gia..." />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy quốc gia.</CommandEmpty>
                      <CommandGroup>
                        {countries.map((country) => (
                          <CommandItem
                            key={country.cca3}
                            value={country.name.common}
                            onSelect={(currentValue) => {
                              setCustomerData({ ...customerData, country: currentValue })
                              setCountryOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                customerData.country === country.name.common ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {country.name.common}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Ngày sinh</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={customerData.dateOfBirth ? customerData.dateOfBirth.getDate().toString() : ''}
                    onValueChange={(value) => {
                      const date = customerData.dateOfBirth || new Date()
                      date.setDate(parseInt(value))
                      setCustomerData({ ...customerData, dateOfBirth: new Date(date) })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Ngày" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select
                    value={customerData.dateOfBirth ? (customerData.dateOfBirth.getMonth() + 1).toString() : ''}
                    onValueChange={(value) => {
                      const date = customerData.dateOfBirth || new Date()
                      date.setMonth(parseInt(value) - 1)
                      setCustomerData({ ...customerData, dateOfBirth: new Date(date) })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tháng" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          T{month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select
                    value={customerData.dateOfBirth ? customerData.dateOfBirth.getFullYear().toString() : ''}
                    onValueChange={(value) => {
                      const date = customerData.dateOfBirth || new Date()
                      date.setFullYear(parseInt(value))
                      setCustomerData({ ...customerData, dateOfBirth: new Date(date) })
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Năm" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!customerData.name || !customerData.phone}
              >
                Tiếp theo →
              </Button>
            </div>
          </TabsContent>

          {/* Step 2: Tour */}
          <TabsContent value="tour" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="tourName">Tên Tour *</Label>
              <Select
                value={selectedTourName}
                onValueChange={(value) => {
                  setSelectedTourName(value)
                  setServiceQuantities({}) // Reset dịch vụ khi chọn tour mới
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tour..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTourNames.map((tourName) => (
                    <SelectItem key={tourName} value={tourName}>
                      {tourName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTourName && (
              <div className="space-y-2">
                <Label>Dịch vụ *</Label>
                <div className="border rounded-lg p-4 space-y-3 max-h-[300px] overflow-y-auto">
                  {availableServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Không có dịch vụ khả dụng</p>
                  ) : (
                    availableServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between gap-4 p-3 border rounded-md bg-muted/30">
                        <div className="flex-1">
                          <p className="font-medium">{service.dichVu}</p>
                          <p className="text-sm text-muted-foreground">
                            Giá: {service.gia}
                          </p>
                          {service.ghiChu && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {service.ghiChu}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateServiceQuantity(service.id, -1)}
                            disabled={!serviceQuantities[service.id]}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={serviceQuantities[service.id] || 0}
                            onChange={(e) => setServiceQuantity(service.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateServiceQuantity(service.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Hiển thị tổng tiền */}
                <div className="bg-primary/10 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Tổng tiền:</span>
                    <span className="text-lg font-bold">
                      {calculateTotalPrice().toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  {Object.keys(serviceQuantities).length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {Object.entries(serviceQuantities).map(([serviceId, qty]) => {
                        const service = tourInfoList.find(t => t.id === serviceId)
                        if (!service) return null
                        const price = service.gia === 'Liên hệ' ? 0 : parseFloat(service.gia.replace(/,/g, ''))
                        return (
                          <div key={serviceId} className="flex justify-between">
                            <span>{service.dichVu} x{qty}</span>
                            <span>{(price * qty).toLocaleString('vi-VN')} VNĐ</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả thêm</Label>
              <Textarea
                id="description"
                value={tourData.description}
                onChange={(e) => setTourData({ ...tourData, description: e.target.value })}
                placeholder="Mô tả chi tiết về tour..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Loại Tour *</Label>
                <Select value={tourData.type} onValueChange={(value) => setTourData({ ...tourData, type: value })}>
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
              <div className="space-y-2">
                <Label htmlFor="maxGuests">Tổng số khách *</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  value={tourData.maxGuests}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Giá (VNĐ) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={tourData.price}
                  onChange={(e) => setTourData({ ...tourData, price: parseFloat(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={tourData.startDate}
                  onChange={(e) => setTourData({ ...tourData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Ngày kết thúc *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={tourData.endDate}
                  onChange={(e) => setTourData({ ...tourData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('customer')}>
                ← Quay lại
              </Button>
              <Button
                onClick={handleNextToReview}
                disabled={!selectedTourName || Object.keys(serviceQuantities).length === 0 || !tourData.startDate || !tourData.endDate}
              >
                Tiếp theo →
              </Button>
            </div>
          </TabsContent>

          {/* Step 3: Review */}
          <TabsContent value="review" className="space-y-4 mt-4">
            {/* Tên tour */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Tên Tour</Label>
              <p className="text-base">{selectedTourName}</p>
            </div>

            {/* Dịch vụ đã chọn */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Dịch vụ đã chọn</Label>
              <div className="border rounded-lg p-4 space-y-2">
                {Object.entries(serviceQuantities).map(([serviceId, qty]) => {
                  const service = tourInfoList.find(t => t.id === serviceId)
                  if (!service) return null
                  return (
                    <div key={serviceId} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{service.dichVu}</p>
                        <p className="text-sm text-muted-foreground">Giá: {service.gia}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{qty} khách</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Guest details summary */}
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {countGuestsWithDetails()}/{calculateTotalGuests()} khách đã có thông tin
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Bao gồm trưởng nhóm: {customerData.name} - {customerData.phone}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGuestDetailsDialog(true)}
                    className="ml-2"
                  >
                    Bổ sung thông tin
                  </Button>
                </div>
              </div>
            </div>

            {/* Tóm tắt chi phí */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Tóm tắt chi phí</Label>
              <div className="border rounded-lg p-4 space-y-3">
                {/* Tổng chi phí tạm tính */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tổng chi phí tạm tính:</span>
                  <span className="font-semibold">{formatNumber(calculateTotalPrice())} VNĐ</span>
                </div>

                {/* Chiết khấu */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-muted-foreground">Chiết khấu:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-20 text-right"
                      min="0"
                      max="100"
                    />
                    <span>%</span>
                    <span className="text-red-500 ml-2">-{formatNumber(calculateTotalPrice() * discount / 100)} VNĐ</span>
                  </div>
                </div>

                {/* Tổng sau chiết khấu */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Tổng sau chiết khấu:</span>
                  <span className="font-bold text-lg">{formatNumber(calculateDiscountedPrice())} VNĐ</span>
                </div>

                {/* Khách đã thanh toán */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-muted-foreground">Khách đã thanh toán:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={paidAmount === 0 ? '' : formatNumber(paidAmount)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        setPaidAmount(value === '' ? 0 : parseInt(value))
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '') setPaidAmount(0)
                      }}
                      className="w-40 text-right"
                      placeholder="0"
                    />
                    <span>VNĐ</span>
                  </div>
                </div>

                {/* Còn lại */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Còn lại:</span>
                  <span className="font-bold text-lg text-orange-600">
                    {formatNumber(calculateDiscountedPrice() - paidAmount)} VNĐ
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('tour')}>
                ← Quay lại
              </Button>
              <Button
                onClick={handleCreateOrder}
                disabled={loading}
              >
                {loading ? 'Đang tạo...' : 'Hoàn thành'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Guest Details Dialog */}
      <Dialog open={showGuestDetailsDialog} onOpenChange={setShowGuestDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bổ sung thông tin khách</DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết cho từng khách tham gia tour
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Trưởng nhóm */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <Label className="text-base font-semibold text-green-900">Trưởng nhóm</Label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Tên</Label>
                  <Input value={customerData.name} disabled className="bg-muted" />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Số điện thoại</Label>
                  <Input value={customerData.phone} disabled className="bg-muted" />
                </div>
              </div>
            </div>

            {/* Guest details by service */}
            {Object.entries(serviceQuantities).map(([serviceId, qty]) => {
              const service = tourInfoList.find(t => t.id === serviceId)
              if (!service) return null

              return (
                <div key={serviceId} className="space-y-3">
                  <Label className="text-base font-semibold">{service.dichVu} ({qty} khách)</Label>
                  <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                    {Array.from({ length: qty }).map((_, index) => (
                      <div key={index} className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm font-medium mb-2">Khách #{index + 1}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Tên</Label>
                            <Input
                              value={guestDetails[serviceId]?.[index]?.name || ''}
                              onChange={(e) => updateGuestDetail(serviceId, index, 'name', e.target.value)}
                              placeholder="Nhập tên khách"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Số điện thoại</Label>
                            <Input
                              value={guestDetails[serviceId]?.[index]?.phone || ''}
                              onChange={(e) => updateGuestDetail(serviceId, index, 'phone', e.target.value)}
                              placeholder="Nhập số điện thoại"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowGuestDetailsDialog(false)}>
              Đóng
            </Button>
            <Button onClick={() => setShowGuestDetailsDialog(false)}>
              Lưu thông tin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
