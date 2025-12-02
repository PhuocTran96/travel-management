'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NavBar } from '@/components/ui/nav-bar'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MusicPlayer } from '@/components/providers/client-layout'
import { CreateOrderDialog } from '@/components/ui/create-order-dialog'

interface Tour {
    id: string
    name: string
    type: 'GROUP' | 'PRIVATE' | 'ONE_ON_ONE'
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED'
    startDate: string
    endDate: string
    maxGuests: number
    bookedGuests: number
    price: number
}

const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const MONTHS = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
]

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [tours, setTours] = useState<Tour[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTour, setSelectedTour] = useState<Tour | null>(null)
    const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string>('')  // For creating tours from calendar

    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    useEffect(() => {
        fetchTours()
    }, [currentMonth, currentYear])

    const fetchTours = async () => {
        try {
            setLoading(true)
            const response = await fetch(
                `/api/calendar?month=${currentMonth + 1}&year=${currentYear}`
            )
            const data = await response.json()
            if (response.ok) {
                setTours(data)
            } else {
                console.error('Failed to fetch tours:', data.error)
            }
        } catch (error) {
            console.error('Error fetching tours:', error)
        } finally {
            setLoading(false)
        }
    }

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay()
    }

    const getToursForDate = (date: Date) => {
        return tours.filter((tour) => {
            const tourStart = new Date(tour.startDate)
            const tourEnd = new Date(tour.endDate)
            const checkDate = new Date(date)

            // Normalize to start of day for comparison
            tourStart.setHours(0, 0, 0, 0)
            tourEnd.setHours(0, 0, 0, 0)
            checkDate.setHours(0, 0, 0, 0)

            return checkDate >= tourStart && checkDate <= tourEnd
        })
    }

    const getTourTypeColor = (type: string) => {
        switch (type) {
            case 'GROUP':
                return 'bg-green-500 hover:bg-green-600'
            case 'PRIVATE':
                return 'bg-blue-500 hover:bg-blue-600'
            case 'ONE_ON_ONE':
                return 'bg-pink-500 hover:bg-pink-600'
            default:
                return 'bg-gray-500 hover:bg-gray-600'
        }
    }

    const getTourTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'GROUP':
                return 'bg-green-100 text-green-800 border-green-300'
            case 'PRIVATE':
                return 'bg-blue-100 text-blue-800 border-blue-300'
            case 'ONE_ON_ONE':
                return 'bg-pink-100 text-pink-800 border-pink-300'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300'
        }
    }

    const getTourTypeLabel = (type: string) => {
        switch (type) {
            case 'GROUP':
                return 'Tour ghép đoàn'
            case 'PRIVATE':
                return 'Tour private'
            case 'ONE_ON_ONE':
                return 'Tour 1-1'
            default:
                return type
        }
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    }

    const handleCreateTourFromDate = (date: Date) => {
        // Format date as YYYY-MM-DD
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const formattedDate = `${year}-${month}-${day}`

        setSelectedDate(formattedDate)
        setIsCreateOrderDialogOpen(true)
    }

    const handleCreateTourSuccess = () => {
        fetchTours() // Refresh calendar data
    }

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear)
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
        const days: React.ReactElement[] = []

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="min-h-32 bg-gray-50 border border-gray-200" />
            )
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day)
            const dayTours = getToursForDate(date)
            const isTodayDate = isToday(date)

            days.push(
                <div
                    key={day}
                    className={`min-h-32 border border-gray-200 p-2 cursor-pointer ${isTodayDate ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-white'
                        } hover:bg-gray-100 transition-colors`}
                    onClick={() => handleCreateTourFromDate(date)}
                >
                    <div className={`text-sm font-semibold mb-2 ${isTodayDate ? 'text-blue-600' : 'text-gray-700'}`}>
                        {day}
                    </div>
                    <div className="space-y-1">
                        {dayTours.slice(0, 3).map((tour) => {
                            const isStartDate = new Date(tour.startDate).getDate() === day &&
                                new Date(tour.startDate).getMonth() === currentMonth
                            return (
                                <TooltipProvider key={tour.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`text-xs text-white px-2 py-1 rounded cursor-pointer truncate ${getTourTypeColor(tour.type)}`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedTour(tour)
                                                }}
                                            >
                                                {isStartDate && '🚀 '}{tour.name}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div className="text-sm">
                                                <p className="font-semibold">{tour.name}</p>
                                                <p>{getTourTypeLabel(tour.type)}</p>
                                                <p>{tour.bookedGuests}/{tour.maxGuests} khách</p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        })}
                        {dayTours.length > 3 && (
                            <div className="text-xs text-gray-500 px-2">
                                +{dayTours.length - 3} tour khác
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        return days
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
                                            onClick={() => {
                                                setSelectedDate('')
                                                setIsCreateOrderDialogOpen(true)
                                            }}
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
            <NavBar currentPage="dashboard" showFilters={false} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <CalendarIcon className="h-6 w-6" />
                                Lịch Tour
                            </CardTitle>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" onClick={goToToday}>
                                    Hôm nay
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="text-lg font-semibold min-w-[200px] text-center">
                                        {MONTHS[currentMonth]} {currentYear}
                                    </div>
                                    <Button variant="outline" size="icon" onClick={goToNextMonth}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex gap-4 mt-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                <span className="text-sm">Tour ghép đoàn</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                <span className="text-sm">Tour private</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-pink-500 rounded"></div>
                                <span className="text-sm">Tour 1-1</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                            </div>
                        ) : (
                            <>
                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
                                    {/* Day headers */}
                                    {DAYS_OF_WEEK.map((day) => (
                                        <div
                                            key={day}
                                            className="bg-gray-100 border-r border-b border-gray-200 p-2 text-center font-semibold text-sm"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                    {/* Calendar days */}
                                    {renderCalendarDays()}
                                </div>

                                {/* Selected Tour Details */}
                                {selectedTour && (
                                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-semibold mb-2">{selectedTour.name}</h3>
                                                <div className="space-y-1 text-sm">
                                                    <p>
                                                        <Badge className={getTourTypeBadgeColor(selectedTour.type)}>
                                                            {getTourTypeLabel(selectedTour.type)}
                                                        </Badge>
                                                    </p>
                                                    <p>
                                                        <strong>Thời gian:</strong>{' '}
                                                        {new Date(selectedTour.startDate).toLocaleDateString('vi-VN')} -{' '}
                                                        {new Date(selectedTour.endDate).toLocaleDateString('vi-VN')}
                                                    </p>
                                                    <p>
                                                        <strong>Khách:</strong> {selectedTour.bookedGuests}/{selectedTour.maxGuests}
                                                    </p>
                                                    <p>
                                                        <strong>Giá:</strong> {selectedTour.price.toLocaleString()}đ
                                                    </p>
                                                    <p>
                                                        <strong>Trạng thái:</strong>{' '}
                                                        <Badge variant={selectedTour.status === 'UPCOMING' ? 'secondary' : selectedTour.status === 'ONGOING' ? 'default' : 'outline'}>
                                                            {selectedTour.status === 'UPCOMING' ? 'Sắp diễn ra' : selectedTour.status === 'ONGOING' ? 'Đang diễn ra' : 'Hoàn thành'}
                                                        </Badge>
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedTour(null)}>
                                                Đóng
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Create Order Dialog */}
            <CreateOrderDialog
                open={isCreateOrderDialogOpen}
                onOpenChange={setIsCreateOrderDialogOpen}
                onSuccess={handleCreateTourSuccess}
                initialStartDate={selectedDate}
                initialEndDate={selectedDate}
            />
        </div>
    )
}
