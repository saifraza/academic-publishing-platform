import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { isDemo } from '@/lib/demo'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const OAI_BASE = `${SITE}/api/oai`
const PAGE_SIZE = 100

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function nowUtc(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function xml(body: string, request: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>${nowUtc()}</responseDate>
  ${request}
${body}
</OAI-PMH>`
}

function errorResponse(code: string, message: string, verb?: string) {
  const request = `<request>${OAI_BASE}</request>`
  const body = `  <error code="${code}">${esc(message)}</error>`
  return new Response(xml(body, request), {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}

/** OAI identifier: oai:<host>:<journalSlug>/<articleSlug> */
function oaiIdentifier(host: string, journalSlug: string, articleSlug: string) {
  return `oai:${host}:${journalSlug}/${articleSlug}`
}

type ArticleWithRelations = {
  slug: string
  title: string
  abstract: string
  keywords: string[]
  doi: string | null
  publishedAt: Date | null
  updatedAt: Date
  articleType: string
  authors: { fullName: string }[]
  journal: { slug: string; name: string; issnOnline: string | null; licenseType: string }
}

function recordHeader(host: string, a: ArticleWithRelations): string {
  return `      <header>
        <identifier>${oaiIdentifier(host, a.journal.slug, a.slug)}</identifier>
        <datestamp>${a.updatedAt.toISOString().slice(0, 10)}</datestamp>
        <setSpec>${esc(a.journal.slug)}</setSpec>
      </header>`
}

function dublinCore(a: ArticleWithRelations, publisherName: string): string {
  const url = `${SITE}/journals/${a.journal.slug}/articles/${a.slug}`
  const parts = [
    `          <dc:title>${esc(a.title)}</dc:title>`,
    ...a.authors.map((au) => `          <dc:creator>${esc(au.fullName)}</dc:creator>`),
    ...a.keywords.map((k) => `          <dc:subject>${esc(k)}</dc:subject>`),
    a.abstract ? `          <dc:description>${esc(a.abstract)}</dc:description>` : null,
    `          <dc:publisher>${esc(publisherName)}</dc:publisher>`,
    a.publishedAt
      ? `          <dc:date>${a.publishedAt.toISOString().slice(0, 10)}</dc:date>`
      : null,
    `          <dc:type>${esc(a.articleType.toLowerCase().replace(/_/g, ' '))}</dc:type>`,
    `          <dc:format>application/pdf</dc:format>`,
    a.doi ? `          <dc:identifier>https://doi.org/${esc(a.doi)}</dc:identifier>` : null,
    `          <dc:identifier>${esc(url)}</dc:identifier>`,
    `          <dc:source>${esc(a.journal.name)}${a.journal.issnOnline ? `; ISSN ${esc(a.journal.issnOnline)}` : ''}</dc:source>`,
    `          <dc:language>en</dc:language>`,
    `          <dc:rights>${esc(a.journal.licenseType.replace(/_/g, '-'))}</dc:rights>`,
  ].filter(Boolean)

  return `        <oai_dc:dc
          xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
          xmlns:dc="http://purl.org/dc/elements/1.1/"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
${parts.join('\n')}
        </oai_dc:dc>`
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const host = url.host
  const verb = url.searchParams.get('verb')
  const metadataPrefix = url.searchParams.get('metadataPrefix')
  const identifier = url.searchParams.get('identifier')
  const set = url.searchParams.get('set')
  const from = url.searchParams.get('from')
  const until = url.searchParams.get('until')
  const resumptionToken = url.searchParams.get('resumptionToken')

  if (!verb) return errorResponse('badVerb', 'The verb argument is missing')

  const publisherRecord = await db.publisher.findFirst({ select: { name: true } })
  const publisherName = publisherRecord?.name ?? 'Academic Publishing House'

  // Harvesters must not ingest fabricated sample records. Identify still
  // responds so the endpoint can be verified as wired up, but it says plainly
  // that this is a demo and no records are exposed.
  if (isDemo && verb !== 'Identify') {
    return errorResponse(
      'noRecordsMatch',
      'This is a demonstration deployment carrying invented sample data. No records are exposed for harvesting.',
    )
  }

  const requestTag = (attrs: string) => `<request${attrs}>${OAI_BASE}</request>`

  // ------------------------------------------------------------- Identify
  if (verb === 'Identify') {
    const publisher = await db.publisher.findFirst()
    const earliest = await db.article.findFirst({
      where: { isPublished: true },
      orderBy: { publishedAt: 'asc' },
      select: { publishedAt: true },
    })
    const body = `  <Identify>
    <repositoryName>${esc(publisher?.name ?? 'Academic Publishing House')}</repositoryName>
    <baseURL>${OAI_BASE}</baseURL>
    <protocolVersion>2.0</protocolVersion>
    <adminEmail>${esc(publisher?.email ?? 'editorial@example.com')}</adminEmail>
    <earliestDatestamp>${earliest?.publishedAt?.toISOString().slice(0, 10) ?? '2000-01-01'}</earliestDatestamp>
    <deletedRecord>no</deletedRecord>
    <granularity>YYYY-MM-DD</granularity>
  </Identify>`
    return new Response(xml(body, requestTag(' verb="Identify"')), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    })
  }

  // --------------------------------------------------- ListMetadataFormats
  if (verb === 'ListMetadataFormats') {
    const body = `  <ListMetadataFormats>
    <metadataFormat>
      <metadataPrefix>oai_dc</metadataPrefix>
      <schema>http://www.openarchives.org/OAI/2.0/oai_dc.xsd</schema>
      <metadataNamespace>http://www.openarchives.org/OAI/2.0/oai_dc/</metadataNamespace>
    </metadataFormat>
  </ListMetadataFormats>`
    return new Response(xml(body, requestTag(' verb="ListMetadataFormats"')), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    })
  }

  // ------------------------------------------------------------- ListSets
  if (verb === 'ListSets') {
    const journals = await db.journal.findMany({
      where: { isPublished: true },
      select: { slug: true, name: true },
      orderBy: { sortOrder: 'asc' },
    })
    const body = `  <ListSets>
${journals
  .map(
    (j) => `    <set>
      <setSpec>${esc(j.slug)}</setSpec>
      <setName>${esc(j.name)}</setName>
    </set>`,
  )
  .join('\n')}
  </ListSets>`
    return new Response(xml(body, requestTag(' verb="ListSets"')), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    })
  }

  // ------------------------------------------------------------- GetRecord
  if (verb === 'GetRecord') {
    if (!identifier) return errorResponse('badArgument', 'identifier is required')
    if (metadataPrefix && metadataPrefix !== 'oai_dc')
      return errorResponse('cannotDisseminateFormat', `Unsupported format: ${metadataPrefix}`)

    const match = identifier.match(/^oai:[^:]+:([^/]+)\/(.+)$/)
    if (!match) return errorResponse('idDoesNotExist', 'Malformed identifier')

    const [, journalSlug, articleSlug] = match
    const journal = await db.journal.findUnique({ where: { slug: journalSlug } })
    if (!journal) return errorResponse('idDoesNotExist', 'Unknown journal')

    const article = await db.article.findUnique({
      where: { journalId_slug: { journalId: journal.id, slug: articleSlug } },
      include: {
        authors: { orderBy: { order: 'asc' } },
        journal: { select: { slug: true, name: true, issnOnline: true, licenseType: true } },
      },
    })
    if (!article || !article.isPublished)
      return errorResponse('idDoesNotExist', 'Unknown record')

    const body = `  <GetRecord>
    <record>
${recordHeader(host, article)}
      <metadata>
${dublinCore(article, publisherName)}
      </metadata>
    </record>
  </GetRecord>`
    return new Response(
      xml(body, requestTag(` verb="GetRecord" identifier="${esc(identifier)}" metadataPrefix="oai_dc"`)),
      { headers: { 'Content-Type': 'text/xml; charset=utf-8' } },
    )
  }

  // ------------------------------------------ ListRecords / ListIdentifiers
  if (verb === 'ListRecords' || verb === 'ListIdentifiers') {
    if (!resumptionToken && !metadataPrefix)
      return errorResponse('badArgument', 'metadataPrefix is required')
    if (metadataPrefix && metadataPrefix !== 'oai_dc')
      return errorResponse('cannotDisseminateFormat', `Unsupported format: ${metadataPrefix}`)

    // Token encodes the offset and the original filters
    let offset = 0
    let effectiveSet = set
    let effectiveFrom = from
    let effectiveUntil = until
    if (resumptionToken) {
      try {
        const decoded = JSON.parse(Buffer.from(resumptionToken, 'base64').toString('utf-8'))
        offset = Number(decoded.o) || 0
        effectiveSet = decoded.s ?? null
        effectiveFrom = decoded.f ?? null
        effectiveUntil = decoded.u ?? null
      } catch {
        return errorResponse('badResumptionToken', 'The resumption token is invalid')
      }
    }

    const where: Record<string, unknown> = { isPublished: true }
    if (effectiveSet) where.journal = { slug: effectiveSet }
    if (effectiveFrom || effectiveUntil) {
      const range: Record<string, Date> = {}
      if (effectiveFrom) range.gte = new Date(effectiveFrom)
      if (effectiveUntil) range.lte = new Date(`${effectiveUntil}T23:59:59Z`)
      where.updatedAt = range
    }

    const total = await db.article.count({ where })
    const articles = await db.article.findMany({
      where,
      orderBy: { updatedAt: 'asc' },
      skip: offset,
      take: PAGE_SIZE,
      include: {
        authors: { orderBy: { order: 'asc' } },
        journal: { select: { slug: true, name: true, issnOnline: true, licenseType: true } },
      },
    })

    if (articles.length === 0)
      return errorResponse('noRecordsMatch', 'No records match the given criteria')

    const nextOffset = offset + articles.length
    const token =
      nextOffset < total
        ? Buffer.from(
            JSON.stringify({ o: nextOffset, s: effectiveSet, f: effectiveFrom, u: effectiveUntil }),
          ).toString('base64')
        : null

    const items = articles
      .map((a) =>
        verb === 'ListIdentifiers'
          ? recordHeader(host, a)
          : `    <record>
${recordHeader(host, a)}
      <metadata>
${dublinCore(a, publisherName)}
      </metadata>
    </record>`,
      )
      .join('\n')

    const tokenTag = token
      ? `\n    <resumptionToken completeListSize="${total}" cursor="${offset}">${token}</resumptionToken>`
      : `\n    <resumptionToken completeListSize="${total}" cursor="${offset}"></resumptionToken>`

    const body = `  <${verb}>
${items}${tokenTag}
  </${verb}>`

    return new Response(xml(body, requestTag(` verb="${verb}" metadataPrefix="oai_dc"`)), {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    })
  }

  return errorResponse('badVerb', `Unsupported verb: ${verb}`)
}
