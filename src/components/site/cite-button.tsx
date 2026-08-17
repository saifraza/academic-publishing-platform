'use client'

import { useState } from 'react'
import { Quote, X, Check, Copy } from 'lucide-react'
import { apa, mla, chicago, vancouver, bibtex, ris, type CitationInput } from '@/lib/citation'

const STYLES = ['APA', 'MLA', 'Chicago', 'Vancouver', 'BibTeX', 'RIS'] as const
type Style = (typeof STYLES)[number]

export function CiteButton({ citation, bibKey }: { citation: CitationInput; bibKey: string }) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<Style>('Vancouver')
  const [copied, setCopied] = useState(false)

  const rendered: Record<Style, string> = {
    APA: apa(citation),
    MLA: mla(citation),
    Chicago: chicago(citation),
    Vancouver: vancouver(citation),
    BibTeX: bibtex(citation, bibKey),
    RIS: ris(citation),
  }

  async function copy() {
    await navigator.clipboard.writeText(rendered[style])
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-sm border border-ink-300 px-4 py-2.5 text-[13.5px] font-medium text-ink-800 transition-colors hover:border-ink-900 hover:bg-paper-shade"
      >
        <Quote className="h-4 w-4" aria-hidden />
        Cite this article
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/40 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Cite this article"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-t-lg bg-white shadow-xl sm:rounded-lg">
            <div className="flex items-center justify-between border-b border-paper-line px-5 py-3.5">
              <h2 className="font-serif text-[1.1rem] font-semibold text-ink-900">
                Cite this article
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-sm p-1.5 text-ink-500 hover:bg-paper-shade hover:text-ink-900"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-paper-line px-5 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(s)}
                  className={`whitespace-nowrap rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    style === s
                      ? 'bg-ink-900 text-white'
                      : 'text-ink-600 hover:bg-paper-shade hover:text-ink-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="px-5 py-5">
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-sm bg-paper-shade p-4 font-mono text-[12.5px] leading-relaxed text-ink-800">
                {rendered[style]}
              </pre>
              <button
                type="button"
                onClick={copy}
                className="mt-4 inline-flex items-center gap-2 rounded-sm bg-ink-900 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-ink-800"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy {style} citation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
