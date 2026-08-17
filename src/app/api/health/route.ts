import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return Response.json({ status: 'ok', database: 'connected' })
  } catch {
    return Response.json({ status: 'degraded', database: 'unreachable' }, { status: 503 })
  }
}
