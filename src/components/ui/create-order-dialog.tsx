'use client'

import { useState, useEffect, Fragment } from 'react'
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

  // Custom services
  const [customServices, setCustomServices] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([])

  // Edited prices for "Liên hệ" services: { serviceId: price }
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({})

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
    country: 'Vietnam',
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

  // Get available services for selected tour, filtered by tour type
  const availableServices = Array.isArray(tourInfoList)
    ? tourInfoList.filter(t => {
        if (t.tenTour !== selectedTourName) return false

        // Filter by tour type
        const dichVuLower = t.dichVu.toLowerCase()
        if (tourData.type === 'ONE_ON_ONE') {
          return dichVuLower.includes('1-1')
        } else if (tourData.type === 'PRIVATE') {
          return dichVuLower.includes('thiết kế riêng')
        } else if (tourData.type === 'GROUP') {
          return dichVuLower.includes('xe máy tự lái') ||
                 dichVuLower.includes('xe máy xế chở') ||
                 dichVuLower.includes('ô tô')
        }
        return false
      })
    : []

  // Calculate total price from all selected services (catalog + custom)
  const calculateTotalPrice = () => {
    let total = 0
    // Catalog services
    Object.entries(serviceQuantities).forEach(([serviceId, quantity]) => {
      const service = tourInfoList.find(t => t.id === serviceId)
      if (service) {
        let price = 0
        if (service.gia === 'Liên hệ') {
          // Use edited price if available
          price = editedPrices[serviceId] || 0
        } else {
          price = parseFloat(service.gia.replace(/,/g, ''))
        }
        total += price * quantity
      }
    })
    // Custom services
    customServices.forEach(service => {
      total += service.price * service.quantity
    })
    return total
  }

  // Calculate total guests from catalog services only (custom services are tour add-ons, not guest-based)
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
    let count = 0
    Object.values(guestDetails).forEach(guests => {
      count += guests.filter(g => g.name.trim() !== '').length
    })
    return count
  }

  // Initialize guest details when moving to review step (only for catalog services, not custom add-ons)
  const initializeGuestDetails = () => {
    const details: Record<string, Array<{ name: string; phone: string }>> = {}
    // Catalog services only - custom services are tour add-ons and don't need guest info
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
  }, [serviceQuantities, customServices])

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
      country: 'Vietnam',
      dateOfBirth: undefined
    })
    setTourData({ name: '', description: '', type: 'GROUP', maxGuests: 10, price: 0, startDate: '', endDate: '', status: 'UPCOMING' })
    setSelectedTourName('')
    setServiceQuantities({})
    setCustomServices([])
    setEditedPrices({})
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
    // Validate tour data - check both catalog and custom services
    const hasServices = Object.keys(serviceQuantities).length > 0 || customServices.filter(s => s.quantity > 0).length > 0
    if (!tourData.startDate || !tourData.endDate || !hasServices) {
      alert('Vui lòng điền đầy đủ thông tin tour và chọn ít nhất 1 dịch vụ')
      return
    }
    // Initialize guest details
    initializeGuestDetails()
    // Move to review step
    setCurrentStep('review')
  }

  const handleCreateOrder = async () => {
    // Validate có ít nhất 1 dịch vụ được chọn (catalog hoặc custom)
    if (Object.keys(serviceQuantities).length === 0 && customServices.filter(s => s.quantity > 0).length === 0) {
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

      // Build tour name with selected services (catalog + custom)
      const catalogServices = Object.keys(serviceQuantities).map(serviceId => {
        const service = tourInfoList.find(t => t.id === serviceId)
        return service ? `${service.dichVu} (x${serviceQuantities[serviceId]})` : ''
      }).filter(Boolean)

      const customServiceNames = customServices
        .filter(s => s.quantity > 0 && s.name.trim() !== '')
        .map(s => `${s.name} (x${s.quantity})`)

      const allServices = [...catalogServices, ...customServiceNames].join(', ')
      const tourName = selectedTourName ? `${selectedTourName} - ${allServices}` : allServices

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

      // Step 3: Create booking with guest details
      const finalPrice = calculateDiscountedPrice()

      // Prepare guest list: leader + all guest details
      const guestList: Array<{ name: string; phone: string; serviceId?: string }> = [
        // Add leader as first guest
        { name: customerData.name, phone: customerData.phone }
      ]

      // Add all guests from catalog services
      Object.entries(guestDetails).forEach(([serviceId, guests]) => {
        guests.forEach(guest => {
          if (guest.name.trim() !== '' || guest.phone.trim() !== '') {
            guestList.push({
              name: guest.name,
              phone: guest.phone,
              serviceId: serviceId
            })
          }
        })
      })

      // Prepare services list for saving
      const servicesList: Array<{
        serviceId?: string
        serviceName: string
        price: number
        quantity: number
        isCustom: boolean
      }> = []

      // Add catalog services
      Object.entries(serviceQuantities).forEach(([serviceId, quantity]) => {
        const service = tourInfoList.find(t => t.id === serviceId)
        if (service) {
          let price = 0
          if (service.gia === 'Liên hệ') {
            price = editedPrices[serviceId] || 0
          } else {
            price = parseFloat(service.gia.replace(/,/g, ''))
          }
          servicesList.push({
            serviceId: serviceId,
            serviceName: service.dichVu,
            price: price,
            quantity: quantity,
            isCustom: false
          })
        }
      })

      // Add custom services
      customServices.filter(s => s.quantity > 0 && s.name.trim() !== '').forEach(service => {
        servicesList.push({
          serviceName: service.name,
          price: service.price,
          quantity: service.quantity,
          isCustom: true
        })
      })

      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
          tourId: tourResult.id,
          deposit: paidAmount,
          totalPrice: finalPrice,
          status: paidAmount >= finalPrice ? 'CONFIRMED' : 'PENDING',
          notes: tourData.description || '',
          guests: guestList,
          services: servicesList
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
    <>
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogContent className="w-[98vw] sm:w-[90vw] max-w-[1100px] max-h-[90vh] overflow-y-auto">
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
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((monthName, index) => (
                        <SelectItem key={index + 1} value={(index + 1).toString()}>
                          {monthName}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tourName">Chọn tên Tour *</Label>
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
                  <SelectContent position="popper" className="max-h-[300px]">
                    {uniqueTourNames.map((tourName) => (
                      <SelectItem key={tourName} value={tourName}>
                        {tourName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={tourData.startDate}
                  onChange={(e) => setTourData({ ...tourData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Ngày kết thúc *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={tourData.endDate}
                  onChange={(e) => setTourData({ ...tourData, endDate: e.target.value })}
                />
              </div>
            </div>

            {selectedTourName && (
              <div className="space-y-4">
                {/* Catalog Services Section */}
                <div className="space-y-2">
                  <Label>Dịch vụ</Label>
                  <div className="border rounded-lg p-4 space-y-3 max-h-[400px] overflow-y-auto">
                    {/* Catalog services */}
                    {availableServices.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Không có dịch vụ khả dụng từ catalog</p>
                    ) : (
                      availableServices.map((service) => (
                      <div key={service.id} className="flex items-start justify-between gap-4 p-3 border rounded-md bg-muted/30">
                        <div className="flex-1">
                          <p className="font-medium">{service.dichVu}</p>
                          {service.gia === 'Liên hệ' ? (
                            <div className="mt-2">
                              <Label className="text-xs">Nhập giá (VNĐ)</Label>
                              <Input
                                type="text"
                                placeholder="Nhập giá..."
                                value={editedPrices[service.id] ? formatNumber(editedPrices[service.id]) : ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '')
                                  setEditedPrices(prev => ({
                                    ...prev,
                                    [service.id]: value === '' ? 0 : parseInt(value)
                                  }))
                                }}
                                className="mt-1"
                              />
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Giá: {service.gia}
                            </p>
                          )}
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
                            className="w-16 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            style={{ textAlign: 'center' }}
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const newQuantities = { ...serviceQuantities }
                              delete newQuantities[service.id]
                              setServiceQuantities(newQuantities)
                            }}
                          >
                            <Plus className="h-4 w-4 rotate-45" />
                          </Button>
                        </div>
                      </div>
                    ))
                    )}
                  </div>
                </div>

                {/* Custom Services Section - Separate from catalog */}
                <div className="space-y-2">
                  <Label>Dịch vụ bổ sung</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 space-y-3 bg-amber-50/30">
                    {customServices.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Chưa có dịch vụ bổ sung
                      </p>
                    ) : (
                      customServices.map((service) => (
                    <div key={service.id} className="flex items-start justify-between gap-4 p-3 border-2 border-dashed rounded-md bg-amber-50/50">
                      <div className="flex-1">
                        <Input
                          placeholder="Tên dịch vụ"
                          value={service.name}
                          onChange={(e) => {
                            setCustomServices(customServices.map(s =>
                              s.id === service.id ? { ...s, name: e.target.value } : s
                            ))
                          }}
                          className="mb-2"
                        />
                        <Input
                          type="text"
                          placeholder="Giá (VNĐ)"
                          value={service.price === 0 ? '' : formatNumber(service.price)}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            setCustomServices(customServices.map(s =>
                              s.id === service.id ? { ...s, price: value === '' ? 0 : parseInt(value) } : s
                            ))
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              setCustomServices(customServices.map(s =>
                                s.id === service.id ? { ...s, price: 0 } : s
                              ))
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setCustomServices(customServices.map(s =>
                              s.id === service.id ? { ...s, quantity: Math.max(0, s.quantity - 1) } : s
                            ))
                          }}
                          disabled={service.quantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          value={service.quantity || 0}
                          onChange={(e) => {
                            setCustomServices(customServices.map(s =>
                              s.id === service.id ? { ...s, quantity: parseInt(e.target.value) || 0 } : s
                            ))
                          }}
                          className="w-16 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          style={{ textAlign: 'center' }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setCustomServices(customServices.map(s =>
                              s.id === service.id ? { ...s, quantity: s.quantity + 1 } : s
                            ))
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setCustomServices(customServices.filter(s => s.id !== service.id))
                          }}
                        >
                          <Plus className="h-4 w-4 rotate-45" />
                        </Button>
                      </div>
                    </div>
                      ))
                    )}

                    {/* Nút thêm dịch vụ khác */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const newId = `custom-${Date.now()}`
                        setCustomServices([...customServices, { id: newId, name: '', price: 0, quantity: 0 }])
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm dịch vụ bổ sung
                    </Button>
                  </div>
                </div>

                {/* Tổng tiền và tổng số khách */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Tổng tiền</div>
                    <div className="text-xl font-bold">
                      {calculateTotalPrice().toLocaleString('vi-VN')} VNĐ
                    </div>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Tổng số khách</div>
                    <div className="text-xl font-bold">
                      {calculateTotalGuests()}
                    </div>
                  </div>
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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('customer')}>
                ← Quay lại
              </Button>
              <Button
                onClick={handleNextToReview}
                disabled={
                  !tourData.startDate ||
                  !tourData.endDate ||
                  (Object.keys(serviceQuantities).length === 0 && customServices.filter(s => s.quantity > 0).length === 0)
                }
              >
                Tiếp theo →
              </Button>
            </div>
          </TabsContent>

          {/* Step 3: Review */}
          <TabsContent value="review" className="space-y-4 mt-4">
            {/* Tên tour và Loại tour */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Tên Tour</Label>
                <p className="text-base">{selectedTourName}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Loại Tour</Label>
                <p className="text-base">
                  {tourData.type === 'GROUP' ? 'Tour ghép đoàn' : tourData.type === 'PRIVATE' ? 'Tour private' : 'Tour 1-1'}
                </p>
              </div>
            </div>

            {/* Dịch vụ đã chọn */}
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Dịch vụ đã chọn</Label>
              <div className="border rounded-lg p-4 space-y-2">
                {/* Catalog services */}
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
                {/* Custom services - Dịch vụ bổ sung */}
                {customServices.filter(s => s.quantity > 0).map((service) => (
                  <div key={service.id} className="flex justify-between items-center py-2 border-b last:border-b-0 bg-amber-50/30">
                    <div>
                      <p className="font-medium">{service.name} <span className="text-xs text-muted-foreground">(Dịch vụ bổ sung)</span></p>
                      <p className="text-sm text-muted-foreground">Giá: {formatNumber(service.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">SL: {service.quantity}</p>
                    </div>
                  </div>
                ))}
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

              {/* Tóm tắt thông tin khách hàng */}
              <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Label className="text-base font-semibold text-green-900 mb-3 block">Tóm tắt thông tin khách hàng</Label>
                <div className="space-y-2">
                  {/* Trưởng nhóm */}
                  <div className="text-sm">
                    <span className="font-medium text-green-900">Trưởng nhóm:</span>{' '}
                    <span className="text-green-800">{customerData.name} - {customerData.phone}</span>
                  </div>

                  {/* Catalog service guests */}
                  {Object.entries(serviceQuantities).map(([serviceId, qty]) => {
                    const service = tourInfoList.find(t => t.id === serviceId)
                    if (!service) return null
                    const guests = guestDetails[serviceId] || []
                    const filledGuests = guests.filter(g => g.name.trim() !== '')

                    return filledGuests.length > 0 ? (
                      <div key={serviceId} className="text-sm">
                        <span className="font-medium text-green-900">{service.dichVu}:</span>
                        <div className="ml-4 mt-1 space-y-1">
                          {filledGuests.map((guest, idx) => (
                            <div key={idx} className="text-green-800">
                              • {guest.name} - {guest.phone}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  })}
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
                      className="w-20 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setPaidAmount(calculateDiscountedPrice())}
                      title="Điền tổng sau chiết khấu"
                    >
                      Điền đủ
                    </Button>
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
    </Dialog>

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

          {/* Guest details by service - Catalog */}
          {Object.entries(serviceQuantities).map(([serviceId, qty]) => {
            const service = tourInfoList.find(t => t.id === serviceId)
            if (!service) return null

            return (
              <div key={serviceId} className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">{service.dichVu} ({qty} khách)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateGuestDetail(serviceId, 0, 'name', customerData.name)
                      updateGuestDetail(serviceId, 0, 'phone', customerData.phone)
                    }}
                    className="text-xs"
                  >
                    Trưởng nhóm sử dụng
                  </Button>
                </div>
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
    </>
  )
}
