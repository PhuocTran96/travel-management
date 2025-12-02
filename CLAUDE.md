# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Travel Management System** (Hệ thống Quản lý Du lịch) built with Next.js 15, TypeScript, Prisma ORM, and MongoDB Atlas. The application manages tour bookings, customers, tours, and expenses for a travel business.

**Key Features:**
- Customer management (with unique customer codes)
- Tour management (GROUP, PRIVATE, ONE_ON_ONE types)
- Booking management with deposit tracking
- Expense tracking (tour costs, partners, guides, staff)
- Tour catalog integration with 64 pre-loaded tours and services
- Multi-step order creation workflow
- Real-time WebSocket communication via Socket.IO
- Dashboard with statistics and analytics
- **Calendar view** with visual tour scheduling and quick creation

## Development Commands

### Core Development
```bash
# Development with auto-reload (uses nodemon + tsx)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Start with database migration (for Railway)
npm run start:migrate

# Linting
npm run lint
```

### Database Commands
```bash
# Push schema changes to database without migrations
npm run db:push

# Generate Prisma Client (run after schema changes)
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Reset database (WARNING: deletes all data)
npm run db:reset
```

## Architecture

### Custom Server Setup
The application uses a **custom Next.js server** ([server.ts](server.ts)) that integrates Socket.IO for real-time communication:
- Next.js handles HTTP routes via `next/server`
- Socket.IO server runs on the same port (3000) at `/api/socketio`
- Socket handlers are defined in [src/lib/socket.ts](src/lib/socket.ts)
- Development uses `nodemon` to watch for changes and restart the server
- **Important**: Webpack watch is disabled in favor of nodemon-based hot reload

### Database Architecture
**Database:** MongoDB Atlas (cloud-hosted)
**ORM:** Prisma with schema at [prisma/schema.prisma](prisma/schema.prisma)

**Core Models:**
- `Customer`: Customers with auto-generated unique codes (`KH0001`, `KH0002`, etc.) including gender, title, country, and date of birth
- `Tour`: Tours with type (GROUP/PRIVATE/ONE_ON_ONE), capacity, dates, and status
- `Booking`: Links customers to tours with deposit and payment tracking
- `BookingService`: Stores service details per booking (price, quantity, isCustom) - enables editing of "Liên hệ" and custom service prices
- `Guest`: Individual guest information per booking (name, phone, serviceId)
- `Expense`: Tour-related expenses categorized by type (TOUR_COST, PARTNER, GUIDE, STAFF)
- `TourInfo`: Pre-loaded tour catalog with 64 tours/services, prices, and notes (imported from CSV)

**Database Client:** Singleton pattern in [src/lib/db.ts](src/lib/db.ts) to prevent connection exhaustion in development.

**MongoDB-Specific Patterns:**
- All IDs use `@id @default(auto()) @map("_id") @db.ObjectId`
- Foreign keys use `@db.ObjectId` type
- No migrations - use `prisma db push` instead

### API Structure
All API routes follow Next.js App Router conventions in `src/app/api/`:
- `/api/customers` - Customer CRUD operations with auto-generated maKH codes
- `/api/tours` - Tour management with bookings/expenses included
- `/api/bookings` - Booking operations
- `/api/expenses` - Expense tracking
- `/api/tour-info` - Tour catalog data for order creation
- `/api/dashboard` - Aggregated statistics
- `/api/calendar` - Calendar view data (tours by month/year)

Each route exports `GET`, `POST`, `PUT`, `DELETE` as needed and uses Prisma for data access.

### Frontend Architecture
**Framework:** Next.js 15 with App Router (all routes in `src/app/`)
**UI Components:** shadcn/ui components in `src/components/ui/` (IMPORTANT: use correct spelling "components", NOT "compoments")
**Styling:** Tailwind CSS 4 with custom configuration
**State Management:** React hooks and local component state
**Forms:** React Hook Form with Zod validation
**Music Player:** Custom HTML5 audio player with Context API for global state persistence across navigation

**Import Aliases:**
- `@/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/app` → `src/app`

### Key Pages
- `/` - Dashboard with statistics and overview
- `/tours` - Order management (Quản lý Đơn hàng) - displays all tours/bookings in **table format**
- `/expenses` - Expense tracking
- `/calendar` - **Calendar view** with Google Calendar-like interface for tour visualization and creation

## Calendar System

The calendar page ([src/app/calendar/page.tsx](src/app/calendar/page.tsx)) provides a visual month view of all tours with quick tour creation capability.

### Calendar Features

**Month View Display:**
- Google Calendar-like grid layout with 7 columns (Sunday to Saturday)
- Vietnamese day headers: CN, T2, T3, T4, T5, T6, T7
- Month/year display with navigation arrows
- "Hôm nay" (Today) button to jump to current month
- Today's date highlighted with blue background and ring

**Tour Visualization:**
- Tours displayed on their respective dates spanning from start to end date
- **Color coding by tour type:**
  - 🟢 **Green** - GROUP tours (Tour ghép đoàn)
  - 🔵 **Blue** - PRIVATE tours (Tour private)
  - 🟣 **Pink** - ONE_ON_ONE tours (Tour 1-1)
- Rocket emoji (🚀) marks tour start dates
- Up to 3 tours shown per day, with "+X tour khác" for overflow
- Hover tooltip shows tour details (name, type, guest count)

**Interactive Tour Creation:**
- **Click on any calendar date** → Opens CreateOrderDialog with pre-filled start/end dates
- **Header Plus button** → Opens CreateOrderDialog without pre-filled dates
- Event bubbling prevented on tour clicks (clicking tours shows details, not create dialog)
- Calendar auto-refreshes after successful tour creation

**Tour Details Panel:**
- Click on tour event to view details in expandable panel
- Shows: tour name, type badge, dates, guest count, price, status
- Close button to dismiss details

### Navigation Integration
- **Calendar button** in NavBar (CalendarDays icon) next to hamburger menu
- Matches header design across all pages (consistent with dashboard)
- Direct navigation to `/calendar` route

### API Endpoint

**GET `/api/calendar`** with query parameters:
- `month` (required) - Month number (1-12)
- `year` (required) - Year (e.g., 2025)

Returns array of tours:
```typescript
Array<{
  id: string
  name: string
  type: 'GROUP' | 'PRIVATE' | 'ONE_ON_ONE'
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED'
  startDate: string (ISO)
  endDate: string (ISO)
  maxGuests: number
  bookedGuests: number (from bookings count)
  price: number
}>
```

### CreateOrderDialog Integration

The CreateOrderDialog component ([src/components/ui/create-order-dialog.tsx](src/components/ui/create-order-dialog.tsx)) supports optional date pre-filling:

**Props:**
- `initialStartDate?: string` - Pre-fill start date (YYYY-MM-DD format)
- `initialEndDate?: string` - Pre-fill end date (YYYY-MM-DD format)

**Behavior:**
- When opened from calendar date click, dates are pre-filled based on clicked date
- When opened from header button, dates remain empty for manual entry
- useEffect Hook updates tour dates when dialog reopens with new initial dates

**Example Usage:**
```typescript
<CreateOrderDialog
  open={isCreateOrderDialogOpen}
  onOpenChange={setIsCreateOrderDialogOpen}
  onSuccess={handleCreateTourSuccess}
  initialStartDate="2025-12-15"
  initialEndDate="2025-12-15"
/>
```


## Order Management Page (`/tours`)
> **Note:** For a visual schedule view of tours, see the **[Calendar System](#calendar-system)** (`/calendar`).

The order management page ([src/app/tours/page.tsx](src/app/tours/page.tsx)) displays all tours in a table layout:

### Status Cards
Three clickable cards at the top of the page:
- **Sắp diễn ra** (Upcoming) - Blue badge, shows count of upcoming tours, click to filter
- **Đang diễn ra** (Ongoing) - Green badge, shows count of ongoing tours, click to filter
- **Đã hoàn thành** (Completed) - Gray badge, shows count of completed tours, click to filter
- Each card has large count on left and notification badge (rounded circle) on right

### Table Columns
| Column | Description |
|--------|-------------|
| Tên Tour | Tour name (truncated with `...` if too long, full name in tooltip) |
| Loại Tour | Tour type: "Tour ghép đoàn", "Tour private", "Tour 1-1" |
| Trưởng nhóm | Leader name from first booking's customer |
| SĐT | Leader's phone number |
| Start Date | Tour start date (DD-MM-YYYY format) |
| End Date | Tour end date (DD-MM-YYYY format) |
| Status | Badge: "Sắp diễn ra", "Đang diễn ra", "Hoàn thành" |
| Thanh toán | "Đủ" (green) or remaining amount in red (e.g., "4,500,000") |
| Thao tác | Edit and Delete buttons |

### Payment Calculation
```typescript
const totalPrice = tour.bookings.reduce((sum, b) => sum + b.totalPrice, 0)
const totalDeposit = tour.bookings.reduce((sum, b) => sum + b.deposit, 0)
const remaining = totalPrice - totalDeposit
// If remaining <= 0: "Đủ" (green)
// If remaining > 0: show remaining amount (red)
```

### Filters
- Search by tour name
- Filter by status (Tất cả / Sắp diễn ra / Đang diễn ra / Hoàn thành)
- Filter by tour type (Tất cả / Tour ghép đoàn / Tour private / Tour 1-1)
- NavBar filters: Date range (defaults to first day of current month to today GMT+7), Leader name
- **Export Excel button**: Downloads filtered data as CSV file with UTF-8 BOM encoding

**Page Branding:**
- All pages share consistent header with logo.png (h-16), gradient green background (from-green-100 via-green-50 to-white)
- **Logo is clickable** - navigates back to Dashboard (`/`)
- Header includes: "Hi, Thanh" greeting (gradient pink-purple, animated pulse), circular "Tạo đơn hàng" button (Plus icon), "Đăng xuất" button
- **NavBar Component** ([src/components/ui/nav-bar.tsx](src/components/ui/nav-bar.tsx)): Shared navigation with hamburger dropdown menu (☰) and integrated filters
- Favicon: icon.png

**Navigation (NavBar):**
- Hamburger menu (☰) with dropdown containing: Dashboard, Quản lý Đơn hàng, Quản lý Chi phí
- **Calendar button** (📅) next to hamburger menu - navigates to `/calendar` page
- Integrated filters in nav bar: Date range (Từ ngày, Đến ngày), Leader name search with autocomplete, Clear filters button
- Search input uses magnify icon instead of label

## Important Notes

### Component Structure
**IMPORTANT:** The components directory uses the CORRECT spelling:
- Folder: `src/components/` (NOT "compoments")
- Import paths: `@/components/ui/*`
- All UI components are in `src/components/ui/`
- Provider components are in `src/components/providers/`

### Development Mode
- Development uses **nodemon** + **tsx** for hot reload (not Next.js built-in HMR)
- Webpack watch is disabled in favor of nodemon
- Server restarts on changes to `server.ts`, `src/**/*.ts`, `src/**/*.tsx`
- Logs are written to `dev.log` and `server.log`

### Environment Configuration
Database connection is configured via `DATABASE_URL` environment variable in `.env`:
- MongoDB Atlas connection string format: `mongodb+srv://username:password@cluster.mongodb.net/database_name`
- The project uses MongoDB Atlas (not local MongoDB or SQLite)

### TypeScript & Linting
- TypeScript build errors are **ignored** during builds (`ignoreBuildErrors: true`)
- ESLint errors are **ignored** during builds (`ignoreDuringBuilds: true`)
- Most linting rules are disabled in [eslint.config.mjs](eslint.config.mjs)
- Prefer const usage is disabled

### Deployment (Railway)
- Configured via [railway.json](railway.json)
- Build command: `npm run build` (includes Prisma Client generation)
- Start command: `npm run start:migrate` (pushes schema then starts server)
- Uses MongoDB Atlas connection from environment variables
- No ephemeral storage issues (MongoDB is cloud-hosted)

## Working with Database

After modifying [prisma/schema.prisma](prisma/schema.prisma):
1. Generate Prisma Client: `npm run db:generate`
2. Push changes to database: `npm run db:push` (no migrations needed for MongoDB)

The Prisma Client is imported as `db` from `@/lib/db`.

**Important MongoDB Patterns:**
- Use `@db.ObjectId` for all ID fields and foreign keys
- Auto-generated IDs use `@id @default(auto()) @map("_id") @db.ObjectId`
- No need for migrations - MongoDB is schemaless, just push changes

## Multi-Step Order Creation Workflow

The [src/components/ui/create-order-dialog.tsx](src/components/ui/create-order-dialog.tsx) component implements a critical business workflow:

### Design Principles
1. **Three-step wizard**: Customer info → Tour selection → Review
2. **Single-column vertical layout** to prevent horizontal scroll
3. **Deferred persistence**: Only saves to database after completing ALL THREE steps
4. **Service quantity selection**: Show all services with +/- buttons and manual input for quantity
5. **Automatic calculations**: Total price, total guests, discount, remaining balance
6. **Simplified date picker**: 3 separate dropdowns (day/month/year) instead of full calendar
7. **Date Pre-filling**: Accepts `initialStartDate` and `initialEndDate` props to pre-populate tour dates (used by Calendar)

### Step 1: Customer Info
- Basic: Name, Email, Phone, Source, Address
- Enhanced:
  - Gender (dropdown: MALE/FEMALE)
  - Title (input: Ông, Bà, Anh, Chị...)
  - **Country**: Autocomplete with all world countries - **defaults to "Vietnam"**
  - **Date of Birth**: 3 separate dropdowns (day, **month as 3-letter abbreviations: Jan/Feb/Mar...**, year)

### Step 2: Tour Selection
- Fetches tour catalog from `/api/tour-info` (64 pre-loaded tours/services)
- User selects tour name → Tour type (GROUP/PRIVATE/ONE_ON_ONE) → **Services auto-filter based on tour type**

**Service Filtering Logic:**
- **Tour 1-1** (ONE_ON_ONE): Shows only services containing "1-1"
- **Tour private** (PRIVATE): Shows only services containing "Thiết kế riêng"
- **Tour ghép đoàn** (GROUP): Shows "Xe máy tự lái", "Xe máy xế chở", "Ô tô"

**Two Service Types:**
1. **Catalog Services** (Dịch vụ từ Catalog):
   - Shows filtered services from TourInfo database
   - Each service has +/- buttons and manual quantity input
   - **"Liên hệ" price services** (like "Ô tô"): Manual price input field displayed
   - Price is either from catalog or manually entered for "Liên hệ" services
   - Each quantity = 1 guest (counts toward guest tracking)

2. **Custom Services** (Dịch vụ bổ sung):
   - Separate section below catalog services
   - Dashed border with amber background for visual distinction
   - User can add unlimited custom services with name, price, quantity
   - **NOT saved to TourInfo database** (session-only, included in tour name when order created)
   - **Does NOT count toward guest tracking** (these are tour add-ons, not guest-based)

**Calculations:**
- **Tổng số khách** (Total guests): Sum of catalog service quantities ONLY (excludes custom services)
- **Tổng tiền** (Total price): Sum of (catalog services + custom services) × prices

### Step 3: Review (Xem lại)
**Tour Summary:**
- Displays tour name, tour type, and all selected services
- Catalog services show quantity as "X khách"
- Custom services show quantity as "SL: X" with "(Dịch vụ bổ sung)" label

**Guest Information Tracking:**
- Shows "X/Y khách đã có thông tin" (guests with details filled)
- **Only applies to catalog services** (custom services excluded)
- Leader (from step 1) is automatically counted as 1 guest with info
- "Bổ sung thông tin" button opens nested dialog to fill details for remaining guests
- Guest details dialog shows:
  - Leader info (read-only)
  - Input fields (name + phone) for each guest from **catalog services ONLY**
  - **Custom services do NOT appear in guest details dialog**

**Cost Summary (Tóm tắt chi phí):**
- Tổng chi phí tạm tính (total cost before discount)
- Chiết khấu (discount % - manual input)
- Tổng sau chiết khấu (total after discount)
- Khách đã thanh toán (amount paid - manual input with auto-formatting for numbers >1000)
  - **"Điền đủ" button** - auto-fills with "Tổng sau chiết khấu" amount for quick input
- Còn lại (remaining balance)

### Persistence Flow
```typescript
handleCreateOrder():
  1. POST /api/customers (creates customer with maKH auto-generation)
  2. POST /api/tours (creates tour with name format: "{tourName} - {service1} (x{qty1}), {service2} (x{qty2})")
  3. POST /api/bookings (creates booking with deposit, totalPrice after discount, status)
  4. Reset form and close dialog
```

**Critical**: Do NOT save after each step. All data must be saved atomically at the end after completing all 3 steps.

### Service Data Persistence (BookingService)
When creating or editing orders, service details are saved to `BookingService` collection:
```typescript
// Service data structure saved to DB
{
  serviceId: string | null,  // TourInfo ID (null for custom services)
  serviceName: string,       // Service display name
  price: number,             // Unit price (important for "Liên hệ" services)
  quantity: number,          // Number of guests/items
  isCustom: boolean          // true for custom add-on services
}
```

**Why BookingService exists:**
- "Liên hệ" services have no predefined price - user enters manually
- Custom services are completely user-defined
- Without storing prices, editing orders would lose pricing information

## Multi-Step Order Edit Workflow

The [src/components/ui/edit-order-dialog.tsx](src/components/ui/edit-order-dialog.tsx) mirrors the create workflow:

### Loading Data
1. Fetches tour data from `/api/tours/{id}` (includes bookings with services)
2. Loads services from `booking.services` array
3. Separates catalog services (has serviceId) from custom services (isCustom=true)
4. For "Liên hệ" services, loads stored price into `editedPrices` state

### Saving Changes
1. Updates customer via `/api/customers/{id}`
2. Updates tour via `/api/tours/{id}` (name includes services list)
3. Updates booking via `/api/bookings/{id}`:
   - Replaces all services (delete existing + create new)
   - Updates guests, deposit, totalPrice, status

## Tour Catalog System

The `TourInfo` collection contains 64 pre-loaded tour/service combinations imported from CSV:
- **Fields**: stt (order), tenTour (tour name), dichVu (service), gia (price - can be "Liên hệ"), ghiChu (notes)
- **Usage**: Powers cascading dropdowns and service filtering in order creation workflow
- **Data source**: `tour_info.csv` - can be re-imported using `npx tsx scripts/import-tour-info.ts`
- **Import script**: [scripts/import-tour-info.ts](scripts/import-tour-info.ts) - clears existing data and imports all 64 records

**Service Name Patterns for Filtering:**
- **ONE_ON_ONE services**: Contains "1-1" in dichVu field
- **PRIVATE services**: Contains "Thiết kế riêng" or "thiết kế riêng" in dichVu field
- **GROUP services**: Contains "Xe máy tự lái", "Xe máy xế chở", or "Ô tô" in dichVu field

**Price Handling:**
- Most services have numeric prices (with commas): "2,900,000"
- Some services (like "Ô tô") have "Liên hệ" as price → requires manual price input in UI

## Socket.IO Integration

WebSocket endpoint: `ws://localhost:3000/api/socketio`

Example usage in [examples/websocket/page.tsx](examples/websocket/page.tsx)

Socket setup in [src/lib/socket.ts](src/lib/socket.ts) - currently implements echo functionality.

## Tech Stack Summary

- **Runtime:** Node.js with tsx
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Database:** MongoDB Atlas via Prisma ORM
- **Styling:** Tailwind CSS 4
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Forms:** React Hook Form + Zod
- **Real-time:** Socket.IO
- **Icons:** Lucide React
- **Countries:** world-countries package
- **Music Player:** Custom HTML5 Audio with React Context
- **Deployment:** Railway.app

## Dashboard System

The dashboard ([src/app/page.tsx](src/app/page.tsx)) provides comprehensive analytics and tour management with real-time status updates.

### Dashboard Features

**Statistics Cards:**
- Tổng Khách hàng - Unique guests count (calculated from Guest table by name+phone) → Link to `/tours`
- Tổng Đơn hàng - Total tours count → Link to `/tours`
- Lợi nhuận gộp - Gross profit (revenue - expenses) → Link to `/expenses`
- Doanh thu - Total revenue from bookings → Link to `/expenses`
- Each card has "Chi tiết" link in top-right corner (no tooltip icons)

**Filters:**
- Integrated in NavBar component (not separate filter area)
- Date range filter (Từ ngày - Đến ngày)
- Leader name autocomplete filter with Search icon
- Clear filters button (Xóa bộ lọc)

### Dashboard Tabs

**1. Tổng quan (Overview):**
- Tình trạng Tour: Counts by status (UPCOMING, ONGOING, COMPLETED)
- Phân tích Doanh thu: Revenue breakdown by tour type (GROUP, PRIVATE, ONE_ON_ONE)

**2. Đơn hàng gần đây:**
- Displays 5 most recent bookings
- **Display Format:** "Tên trưởng nhóm - Tên Tour - Loại Tour"
  - Tour types displayed as: "Tour ghép đoàn", "Tour private", "Tour 1-1"
- **Payment Information (2 columns):**
  - Chi phí sau chiết khấu (totalPrice)
  - Khách đã thanh toán (deposit) - displayed in green
- **Status Badge:**
  - Auto-calculated: `paidAmount >= finalPrice ? 'Đã thanh toán đủ' : 'Chưa thanh toán đủ'`
  - Legacy status mapping: CONFIRMED → "Đã thanh toán đủ", PENDING → "Chưa thanh toán đủ"
  - Badge colors: "Đã thanh toán đủ" = default (blue), "Chưa thanh toán đủ" = secondary (gray)

**3. Tour sắp diễn ra:**
- Displays 5 upcoming tours (status: UPCOMING, startDate >= now)
- Sorted by startDate ascending (earliest tour first)
- **Countdown Display (GMT+7):**
  - "Ngày mai" for 1 day
  - "Còn X ngày" for X days
  - Color coding:
    - Red (≤ 3 days)
    - Orange (4-7 days)
    - Blue (> 7 days)

**4. Tour đang diễn ra:**
- Displays 5 ongoing tours (status: ONGOING)
- Sorted by endDate ascending (ending soonest first)
- **Countdown to End Date (GMT+7):**
  - Same format as "Tour sắp diễn ra"
  - Counts down days until tour completion

**5. Tour đã hoàn thành:**
- Displays 5 completed tours (status: COMPLETED)
- Sorted by endDate descending (most recently completed first)
- **Payment Status Display:**
  - If `remainingAmount > 0`: Red text "Thiếu Xđ"
  - If `remainingAmount <= 0`: Green text "Đã thanh toán đủ"
  - Shows payment ratio: `totalDeposit / totalPrice`
- **Payment Calculation:**
  - `totalPrice` = sum of all booking.totalPrice for the tour
  - `totalDeposit` = sum of all booking.deposit for the tour
  - `remainingAmount` = totalPrice - totalDeposit

### API Endpoint

**GET `/api/dashboard`** returns:
```typescript
{
  stats: {
    totalCustomers: number
    totalOrders: number
    grossProfit: number
    totalRevenue: number
    totalExpenses: number
  },
  recentBookings: Array<{
    id: string
    customerName: string
    tourName: string
    tourType: 'GROUP' | 'PRIVATE' | 'ONE_ON_ONE'
    totalPrice: number
    deposit: number
    status: string
  }>,
  upcomingTours: Array<{
    id: string
    name: string
    startDate: string (ISO)
    endDate: string (ISO)
    maxGuests: number
    bookedGuests: number
    price: number
    type: string
  }>,
  ongoingTours: Array<{...}>, // Same structure as upcomingTours
  completedTours: Array<{
    id: string
    name: string
    startDate: string (ISO)
    endDate: string (ISO)
    maxGuests: number
    bookedGuests: number
    totalPrice: number
    totalDeposit: number
    remainingAmount: number
  }>,
  tourStatus: { upcoming: number, ongoing: number, completed: number },
  revenueByType: { group: number, private: number, oneOnOne: number }
}
```

**Query Parameters:**
- `startDate` - Filter tours by end date >= startDate
- `endDate` - Filter tours by end date <= endDate
- `leaderName` - Filter by customer name (case-insensitive contains)

### Date Calculations (GMT+7)

All countdown calculations use GMT+7 timezone:
```typescript
const gmtPlus7Offset = 7 * 60 // minutes
const localOffset = now.getTimezoneOffset()
const offsetDiff = gmtPlus7Offset + localOffset
const nowGMT7 = new Date(now.getTime() + offsetDiff * 60 * 1000)
```

## Music Player System

The application includes a custom music player that persists across page navigation:

### Architecture
- **Context Provider:** [src/contexts/music-player-context.tsx](src/contexts/music-player-context.tsx) - Global state management
- **UI Component:** [src/components/ui/music-player.tsx](src/components/ui/music-player.tsx) - Player interface
- **Layout Integration:** [src/components/providers/client-layout.tsx](src/components/providers/client-layout.tsx) - Client-side wrapper

### Features
- **Persistent Playback:** Music continues when navigating between pages (thanks to React Context)
- **Two Display Modes:** Mini player (collapsed) and Expanded view
- **Controls:** Play/Pause, Next/Previous, Seek (progress bar), Volume slider with mute
- **LocalStorage:** Volume preference saved automatically
- **Auto-Next:** Automatically plays next song when current song ends
- **Responsive Design:** Fixed bottom bar with purple-pink gradient theme

### Music Files
- Location: `public/music/`
- Format: `.mp3` files
- Access: Direct URL path `/music/filename.mp3`
- **Auto-discovery:** Songs are automatically loaded via `/api/songs` endpoint

### Adding New Songs
1. Simply add `.mp3` files to `public/music/` folder
2. Commit to Git (files must be tracked)
3. Playlist will automatically update on next page load
4. No code changes needed!

### API Endpoint
- `GET /api/songs` - Returns list of all `.mp3` files in `public/music/`
- Auto-parses title/artist from filename patterns:
  - `Artist - Title.mp3`
  - `Title (Artist).mp3`
  - Falls back to filename as title

## Common Issues

### Port Already in Use (EADDRINUSE)
If you see "Port 3000 is already in use":
```bash
# Windows
netstat -ano | findstr :3000
taskkill //F //PID <pid>

# Unix/Mac
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Not Found
After schema changes, if you see "Module not found: Can't resolve '@prisma/client'":
1. Kill dev server
2. Run `npx prisma generate`
3. Restart dev server with `npm run dev`

### Dialog Horizontal Scroll
If forms in dialogs have horizontal scroll:
- Use single-column vertical layout (`space-y-4`) instead of grid
- Ensure dialog has sufficient width (`max-w-4xl`)
- Avoid 2-column grids in constrained spaces
