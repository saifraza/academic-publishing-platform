import { NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
}

/**
 * Serves files written by the development storage fallback. When S3 is
 * configured, uploads get absolute S3 URLs and never reach this route.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params

  // Reject anything that could escape the storage directory
  if (segments.some((s) => s.includes('..') || s.includes('/') || s.includes('\\'))) {
    return new Response('Not found', { status: 404 })
  }

  const root = path.join(process.cwd(), 'storage')
  const target = path.join(root, ...segments)
  if (!path.resolve(target).startsWith(path.resolve(root))) {
    return new Response('Not found', { status: 404 })
  }

  try {
    const data = await readFile(target)
    const ext = path.extname(target).toLowerCase()
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        'Content-Disposition': `inline; filename="${path.basename(target)}"`,
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
