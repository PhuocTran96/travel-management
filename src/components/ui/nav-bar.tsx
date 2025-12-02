'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, Search, TrendingUp, MapPin, DollarSign, CalendarDays } from 'lucide-react'

interface NavBarProps {
  currentPage: 'dashboard' | 'tours' | 'expenses'
  startDate?: string
  endDate?: string
  leaderName?: string
  onStartDateChange?: (value: string) => void
  onEndDateChange?: (value: string) => void
  onLeaderNameChange?: (value: string) => void
  onClearFilters?: () => void
  showFilters?: boolean
}

export function NavBar({
  currentPage,
  startDate = '',
  endDate = '',
  leaderName = '',
  onStartDateChange,
  onEndDateChange,
  onLeaderNameChange,
  onClearFilters,
  showFilters = true
}: NavBarProps) {
  const [leaderNames, setLeaderNames] = useState<string[]>([])
  const [showLeaderDropdown, setShowLeaderDropdown] = useState(false)

  // Fetch leader names for autocomplete
  useEffect(() => {
    const fetchLeaderNames = async () => {
      try {
        const response = await fetch('/api/customers')
        const data = await response.json()
        if (Array.isArray(data)) {
          const names = [...new Set(data.map((c: any) => c.name))].sort()
          setLeaderNames(names as string[])
        }
      } catch (error) {
        console.error('Error fetching leader names:', error)
      }
    }
    if (showFilters) {
      fetchLeaderNames()
    }
  }, [showFilters])

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Hamburger Menu + Calendar Button */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <a href="/" className={`flex items-center cursor-pointer ${currentPage === 'dashboard' ? 'text-blue-600 font-medium' : ''}`}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Dashboard
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/tours" className={`flex items-center cursor-pointer ${currentPage === 'tours' ? 'text-blue-600 font-medium' : ''}`}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Quản lý Đơn hàng
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/expenses" className={`flex items-center cursor-pointer ${currentPage === 'expenses' ? 'text-blue-600 font-medium' : ''}`}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Quản lý Chi phí
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Calendar Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => window.location.href = '/calendar'}
            >
              <CalendarDays className="h-5 w-5" />
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap">Từ ngày:</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange?.(e.target.value)}
                  className="w-40 h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap">Đến ngày:</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange?.(e.target.value)}
                  className="w-40 h-9"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={leaderName}
                  onChange={(e) => {
                    onLeaderNameChange?.(e.target.value)
                    setShowLeaderDropdown(true)
                  }}
                  onFocus={() => setShowLeaderDropdown(true)}
                  onBlur={() => setTimeout(() => setShowLeaderDropdown(false), 200)}
                  placeholder="Tìm theo tên..."
                  className="w-48 h-9 pl-9"
                />
                {showLeaderDropdown && leaderName && leaderNames.filter(name =>
                  name.toLowerCase().includes(leaderName.toLowerCase())
                ).length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                      {leaderNames
                        .filter(name => name.toLowerCase().includes(leaderName.toLowerCase()))
                        .slice(0, 10)
                        .map((name, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onMouseDown={() => {
                              onLeaderNameChange?.(name)
                              setShowLeaderDropdown(false)
                            }}
                          >
                            {name}
                          </div>
                        ))}
                    </div>
                  )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="h-9"
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
