/**
 * Demo mode.
 *
 * The seeded content is fabricated — invented articles, invented author names,
 * placeholder ISSNs and DOIs. This site is built to be indexed (Google Scholar
 * meta tags, OAI-PMH, sitemap), so a public demo carrying that data must not be
 * crawlable or harvestable, and must say plainly that it is not a real journal.
 *
 * Set DEMO_MODE=false once real content replaces the seed.
 */
export const isDemo = process.env.DEMO_MODE !== 'false'
