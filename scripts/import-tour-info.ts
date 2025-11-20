import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting tour info import...')

  // Read CSV file
  const csvPath = path.join(process.cwd(), 'tour_info.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  // Parse CSV (skip header row)
  const lines = csvContent.split('\n').slice(1).filter(line => line.trim())

  console.log(`Found ${lines.length} rows to import`)

  // Clear existing data
  await prisma.tourInfo.deleteMany({})
  console.log('Cleared existing tour info data')

  // Parse and insert data
  let imported = 0
  for (const line of lines) {
    // Split by comma, but keep commas inside quotes
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
    const parts = line.split(regex).map(p => p.trim().replace(/^"|"$/g, ''))

    if (parts.length < 4) continue

    const [stt, tenTour, dichVu, gia, ghiChu] = parts

    try {
      await prisma.tourInfo.create({
        data: {
          stt: parseInt(stt),
          tenTour: tenTour.trim(),
          dichVu: dichVu.trim(),
          gia: gia.trim(),
          ghiChu: ghiChu?.trim() || null
        }
      })
      imported++
    } catch (error) {
      console.error(`Failed to import row: ${line}`, error)
    }
  }

  console.log(`Successfully imported ${imported} tour info records`)
}

main()
  .catch((e) => {
    console.error('Error during import:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
