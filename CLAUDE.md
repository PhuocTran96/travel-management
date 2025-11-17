# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Travel Management System** (Hệ thống Quản lý Du lịch) built with Next.js 15, TypeScript, Prisma ORM, and SQLite. The application manages tour bookings, customers, tours, and expenses for a travel business.

**Key Features:**
- Customer management (with unique customer codes)
- Tour management (GROUP, PRIVATE, ONE_ON_ONE types)
- Booking management with deposit tracking
- Expense tracking (tour costs, partners, guides, staff)
- Real-time WebSocket communication via Socket.IO
- Dashboard with statistics and analytics

## Development Commands

### Core Development
```bash
# Development with auto-reload (uses nodemon + tsx)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

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
- Socket.IO server runs on the same port at `/api/socketio`
- Socket handlers are defined in [src/lib/socket.ts](src/lib/socket.ts)
- Development uses `nodemon` to watch for changes and restart the server

### Database Architecture
**Database:** SQLite (located at `prisma/db/custom.db`)
**ORM:** Prisma with schema at [prisma/schema.prisma](prisma/schema.prisma)

**Core Models:**
- `Customer`: Customers with auto-generated unique codes (`KH0001`, `KH0002`, etc.)
- `Tour`: Tours with type (GROUP/PRIVATE/ONE_ON_ONE), capacity, dates, and status
- `Booking`: Links customers to tours with deposit and payment tracking
- `Expense`: Tour-related expenses categorized by type (TOUR_COST, PARTNER, GUIDE, STAFF)

**Database Client:** Singleton pattern in [src/lib/db.ts](src/lib/db.ts) to prevent connection exhaustion in development.

### API Structure
All API routes follow Next.js App Router conventions in `src/app/api/`:
- `/api/customers` - Customer CRUD operations
- `/api/tours` - Tour management with bookings/expenses included
- `/api/bookings` - Booking operations
- `/api/expenses` - Expense tracking
- `/api/dashboard` - Aggregated statistics

Each route exports `GET`, `POST`, `PUT`, `DELETE` as needed and uses Prisma for data access.

### Frontend Architecture
**Framework:** Next.js 15 with App Router (all routes in `src/app/`)
**UI Components:** shadcn/ui components in `src/compoments/ui/` (note: "compoments" is intentionally misspelled)
**Styling:** Tailwind CSS 4 with custom configuration
**State Management:** React hooks and local component state
**Forms:** React Hook Form with Zod validation

**Import Aliases:**
- `@/components` → `src/compoments` (note the misspelling)
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/app` → `src/app`

### Key Pages
- `/` - Dashboard with statistics and overview
- `/booking` - Booking management interface
- `/tours` - Tour listing and management
- `/expenses` - Expense tracking

## Important Notes

### Path Inconsistency
The components directory is intentionally named `compoments` (missing an 'o'). This is reflected in:
- Folder: `src/compoments/`
- Config: `compoments.json`
- Import paths: `@/components/ui/*` (aliased correctly in tsconfig)

When working with UI components, use the import alias `@/components/ui/...` which resolves to `src/compoments/ui/...`.

### Development Mode
- Development uses **nodemon** + **tsx** for hot reload (not Next.js built-in HMR)
- Webpack watch is disabled in favor of nodemon
- Server restarts on changes to `server.ts`, `src/**/*.ts`, `src/**/*.tsx`
- Logs are written to `dev.log` and `server.log`

### Environment Configuration
Database connection is configured via `DATABASE_URL` environment variable.
Default: `file:./db/custom.db` (relative to `prisma/schema.prisma`, resolves to `prisma/db/custom.db`)

### TypeScript & Linting
- TypeScript build errors are **ignored** during builds (`ignoreBuildErrors: true`)
- ESLint errors are **ignored** during builds (`ignoreDuringBuilds: true`)
- Most linting rules are disabled in [eslint.config.mjs](eslint.config.mjs)
- Prefer const usage is disabled

## Working with Database

After modifying [prisma/schema.prisma](prisma/schema.prisma):
1. Generate Prisma Client: `npm run db:generate`
2. Push changes to database: `npm run db:push` (no migrations)
   OR create migration: `npm run db:migrate`

The Prisma Client is imported as `db` from `@/lib/db`.

## Socket.IO Integration

WebSocket endpoint: `ws://localhost:3000/api/socketio`

Example usage in [examples/websocket/page.tsx](examples/websocket/page.tsx)

Socket setup in [src/lib/socket.ts](src/lib/socket.ts) - currently implements echo functionality.

## Tech Stack Summary

- **Runtime:** Node.js with tsx
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Database:** SQLite via Prisma ORM
- **Styling:** Tailwind CSS 4
- **UI Library:** shadcn/ui (Radix UI primitives)
- **Forms:** React Hook Form + Zod
- **Real-time:** Socket.IO
- **Icons:** Lucide React
