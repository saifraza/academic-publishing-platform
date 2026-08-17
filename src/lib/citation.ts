/**
 * Citation string builders. Indexing services and readers both expect these
 * exact shapes — get the punctuation wrong and reference managers mis-parse.
 */

export type CitationAuthor = { fullName: string }

export type CitationInput = {
  title: string
  authors: CitationAuthor[]
  journalName: string
  journalAbbreviation?: string
  year: number | null
  volume?: number | null
  issue?: number | null
  pageStart?: number | null
  pageEnd?: number | null
  articleNumber?: string | null
  doi?: string | null
  url: string
}

/** "Sharma, R. K." -> surname + initials, the form most styles want. */
function surnameInitials(fullName: string): { surname: string; initials: string; given: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { surname: parts[0], initials: '', given: '' }
  const surname = parts[parts.length - 1]
  const given = parts.slice(0, -1).join(' ')
  const initials = parts
    .slice(0, -1)
    .map((p) => p[0]?.toUpperCase())
    .filter(Boolean)
    .join('')
  return { surname, initials, given }
}

function pages(c: CitationInput): string {
  if (c.pageStart && c.pageEnd) return `${c.pageStart}-${c.pageEnd}`
  if (c.pageStart) return `${c.pageStart}`
  if (c.articleNumber) return c.articleNumber
  return ''
}

export function apa(c: CitationInput): string {
  const names = c.authors.map((a) => {
    const { surname, initials } = surnameInitials(a.fullName)
    return initials ? `${surname}, ${initials.split('').join('. ')}.` : surname
  })
  let authorStr = names.join(', ')
  if (names.length > 1) {
    authorStr = names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1]
  }
  const vol = c.volume ? `, ${c.volume}` : ''
  const iss = c.issue ? `(${c.issue})` : ''
  const pg = pages(c) ? `, ${pages(c)}` : ''
  const doi = c.doi ? ` https://doi.org/${c.doi}` : ` ${c.url}`
  return `${authorStr} (${c.year ?? 'n.d.'}). ${c.title}. ${c.journalName}${vol}${iss}${pg}.${doi}`
}

export function mla(c: CitationInput): string {
  const names = c.authors.map((a, i) => {
    const { surname, given } = surnameInitials(a.fullName)
    return i === 0 ? `${surname}, ${given}` : a.fullName
  })
  let authorStr = names[0] ?? ''
  if (names.length === 2) authorStr = `${names[0]}, and ${names[1]}`
  if (names.length > 2) authorStr = `${names[0]}, et al`
  const vol = c.volume ? `, vol. ${c.volume}` : ''
  const iss = c.issue ? `, no. ${c.issue}` : ''
  const pg = pages(c) ? `, pp. ${pages(c)}` : ''
  const doi = c.doi ? `, https://doi.org/${c.doi}` : ''
  return `${authorStr}. "${c.title}." ${c.journalName}${vol}${iss}, ${c.year ?? 'n.d.'}${pg}${doi}.`
}

export function chicago(c: CitationInput): string {
  const names = c.authors.map((a, i) => {
    const { surname, given } = surnameInitials(a.fullName)
    return i === 0 ? `${surname}, ${given}` : a.fullName
  })
  let authorStr = names.join(', ')
  if (names.length > 1) authorStr = names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1]
  const vol = c.volume ? ` ${c.volume}` : ''
  const iss = c.issue ? `, no. ${c.issue}` : ''
  const pg = pages(c) ? `: ${pages(c)}` : ''
  const doi = c.doi ? ` https://doi.org/${c.doi}.` : ''
  return `${authorStr}. "${c.title}." ${c.journalName}${vol}${iss} (${c.year ?? 'n.d.'})${pg}.${doi}`
}

/** Vancouver — the style nearly every medical and dental journal uses. */
export function vancouver(c: CitationInput): string {
  const names = c.authors.slice(0, 6).map((a) => {
    const { surname, initials } = surnameInitials(a.fullName)
    return initials ? `${surname} ${initials}` : surname
  })
  const etAl = c.authors.length > 6 ? ', et al' : ''
  const journal = c.journalAbbreviation || c.journalName
  const vol = c.volume ? `;${c.volume}` : ''
  const iss = c.issue ? `(${c.issue})` : ''
  const pg = pages(c) ? `:${pages(c)}` : ''
  const doi = c.doi ? ` doi:${c.doi}` : ''
  return `${names.join(', ')}${etAl}. ${c.title}. ${journal}. ${c.year ?? ''}${vol}${iss}${pg}.${doi}`
}

export function bibtex(c: CitationInput, key: string): string {
  const authorStr = c.authors.map((a) => a.fullName).join(' and ')
  const lines = [
    `@article{${key},`,
    `  title   = {${c.title}},`,
    `  author  = {${authorStr}},`,
    `  journal = {${c.journalName}},`,
    c.year ? `  year    = {${c.year}},` : null,
    c.volume ? `  volume  = {${c.volume}},` : null,
    c.issue ? `  number  = {${c.issue}},` : null,
    pages(c) ? `  pages   = {${pages(c)}},` : null,
    c.doi ? `  doi     = {${c.doi}},` : null,
    `  url     = {${c.url}}`,
    `}`,
  ].filter(Boolean)
  return lines.join('\n')
}

export function ris(c: CitationInput): string {
  const lines = [
    'TY  - JOUR',
    ...c.authors.map((a) => `AU  - ${a.fullName}`),
    `TI  - ${c.title}`,
    `JO  - ${c.journalName}`,
    c.year ? `PY  - ${c.year}` : null,
    c.volume ? `VL  - ${c.volume}` : null,
    c.issue ? `IS  - ${c.issue}` : null,
    c.pageStart ? `SP  - ${c.pageStart}` : null,
    c.pageEnd ? `EP  - ${c.pageEnd}` : null,
    c.doi ? `DO  - ${c.doi}` : null,
    `UR  - ${c.url}`,
    'ER  -',
  ].filter(Boolean)
  return lines.join('\n')
}
