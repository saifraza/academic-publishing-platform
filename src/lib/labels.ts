/**
 * Human-readable labels for every enum. The admin UI and the public site both
 * read from here — enum constants are never shown to a user.
 */

export const ARTICLE_TYPE_LABELS: Record<string, string> = {
  RESEARCH: 'Original Research',
  REVIEW: 'Review Article',
  CASE_REPORT: 'Case Report',
  EDITORIAL: 'Editorial',
  LETTER: 'Letter to the Editor',
  SHORT_COMMUNICATION: 'Short Communication',
  COMMENTARY: 'Commentary',
  SYSTEMATIC_REVIEW: 'Systematic Review',
}

export const DESIGNATION_LABELS: Record<string, string> = {
  EDITOR_IN_CHIEF: 'Editor-in-Chief',
  ASSOCIATE_EDITOR: 'Associate Editor',
  SECTION_EDITOR: 'Section Editor',
  BOARD_MEMBER: 'Editorial Board Member',
  MANAGING_EDITOR: 'Managing Editor',
  COPY_EDITOR: 'Copy Editor',
  PRODUCTION_EDITOR: 'Production Editor',
  LANGUAGE_EDITOR: 'Language Editor',
  TECHNICAL_EDITOR: 'Technical Editor',
  ADVISORY_BOARD: 'Advisory Board',
}

/** Order the board is displayed in — seniority first. */
export const DESIGNATION_ORDER = [
  'EDITOR_IN_CHIEF',
  'MANAGING_EDITOR',
  'ASSOCIATE_EDITOR',
  'SECTION_EDITOR',
  'ADVISORY_BOARD',
  'BOARD_MEMBER',
  'PRODUCTION_EDITOR',
  'COPY_EDITOR',
  'LANGUAGE_EDITOR',
  'TECHNICAL_EDITOR',
]

export const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  BIMONTHLY: 'Bimonthly',
  QUARTERLY: 'Quarterly',
  TRIANNUAL: 'Three issues a year',
  BIANNUAL: 'Twice a year',
  ANNUAL: 'Annually',
  CONTINUOUS: 'Continuous publication',
}

export const PEER_REVIEW_LABELS: Record<string, string> = {
  SINGLE_BLIND: 'Single-blind peer review',
  DOUBLE_BLIND: 'Double-blind peer review',
  OPEN: 'Open peer review',
}

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_SCREENING: 'Under initial screening',
  UNDER_REVIEW: 'Under peer review',
  REVISION_REQUESTED: 'Revision requested',
  ACCEPTED: 'Accepted',
  REJECTED: 'Not accepted',
  WITHDRAWN: 'Withdrawn',
  PUBLISHED: 'Published',
}

export const LICENSE_LABELS: Record<string, { short: string; full: string; url: string }> = {
  CC_BY: {
    short: 'CC BY 4.0',
    full: 'Creative Commons Attribution 4.0 International',
    url: 'https://creativecommons.org/licenses/by/4.0/',
  },
  CC_BY_NC: {
    short: 'CC BY-NC 4.0',
    full: 'Creative Commons Attribution-NonCommercial 4.0 International',
    url: 'https://creativecommons.org/licenses/by-nc/4.0/',
  },
  CC_BY_SA: {
    short: 'CC BY-SA 4.0',
    full: 'Creative Commons Attribution-ShareAlike 4.0 International',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  CC_BY_NC_ND: {
    short: 'CC BY-NC-ND 4.0',
    full: 'Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International',
    url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
  },
  CC_BY_NC_SA: {
    short: 'CC BY-NC-SA 4.0',
    full: 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
  },
}
