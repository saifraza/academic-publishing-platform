import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const S3_ENDPOINT = process.env.S3_ENDPOINT
const S3_BUCKET = process.env.S3_BUCKET
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL

export const storageConfigured = Boolean(
  S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY,
)

const client = storageConfigured
  ? new S3Client({
      region: 'auto',
      endpoint: S3_ENDPOINT,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID!,
        secretAccessKey: S3_SECRET_ACCESS_KEY!,
      },
    })
  : null

/** Magic-byte signatures — never trust the browser-reported MIME type alone. */
const SIGNATURES: { ext: string; mime: string; bytes: number[] }[] = [
  { ext: 'pdf', mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  // DOCX/XLSX are ZIP containers
  { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', bytes: [0x50, 0x4b, 0x03, 0x04] },
  // Legacy .doc (OLE compound file)
  { ext: 'doc', mime: 'application/msword', bytes: [0xd0, 0xcf, 0x11, 0xe0] },
  { ext: 'png', mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: 'jpg', mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
]

export type UploadResult =
  | { ok: true; url: string; size: number; stored: 's3' | 'local' }
  | { ok: false; error: string }

export async function uploadFile(
  file: File,
  opts: { prefix: string; maxBytes?: number; allow?: string[] },
): Promise<UploadResult> {
  const maxBytes = opts.maxBytes ?? 25 * 1024 * 1024
  if (file.size === 0) return { ok: false, error: 'The file is empty.' }
  if (file.size > maxBytes)
    return {
      ok: false,
      error: `The file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${(maxBytes / 1024 / 1024).toFixed(0)} MB.`,
    }

  const buffer = Buffer.from(await file.arrayBuffer())
  const head = Array.from(buffer.subarray(0, 8))

  const match = SIGNATURES.find((sig) => sig.bytes.every((b, i) => head[i] === b))
  if (!match)
    return {
      ok: false,
      error: 'That file type is not accepted. Please upload a PDF or a Word document.',
    }
  if (opts.allow && !opts.allow.includes(match.ext))
    return {
      ok: false,
      error: `Only ${opts.allow.join(', ').toUpperCase()} files are accepted here.`,
    }

  const key = `${opts.prefix}/${randomUUID()}.${match.ext}`

  if (client && S3_BUCKET) {
    await client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: match.mime,
      }),
    )
    const base = S3_PUBLIC_URL?.replace(/\/$/, '') ?? `${S3_ENDPOINT}/${S3_BUCKET}`
    return { ok: true, url: `${base}/${key}`, size: file.size, stored: 's3' }
  }

  // Development fallback. Railway containers have an ephemeral filesystem, so
  // this path must not be relied on in production — configure S3/R2 there.
  const dir = path.join(process.cwd(), 'storage', opts.prefix)
  await mkdir(dir, { recursive: true })
  const filename = key.split('/').pop()!
  await writeFile(path.join(dir, filename), buffer)
  return { ok: true, url: `/api/files/${opts.prefix}/${filename}`, size: file.size, stored: 'local' }
}
