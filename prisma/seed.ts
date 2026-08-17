import { PrismaClient, ArticleType, Designation } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const ADMIN_EMAIL = 'admin@publisher.test'
const ADMIN_PASSWORD = 'Publish!2026'

async function main() {
  // This seed deletes everything before inserting. It runs as part of the
  // release step, so it must refuse to touch a database that already has
  // content — otherwise every deploy would wipe the publisher's real work.
  const existing = await db.publisher.count()
  if (existing > 0 && process.env.FORCE_SEED !== 'true') {
    console.log(
      'Database already contains data — skipping seed. Set FORCE_SEED=true to overwrite it.',
    )
    return
  }

  console.log('Clearing existing data…')
  await db.reviewAssignment.deleteMany()
  await db.reviewer.deleteMany()
  await db.submission.deleteMany()
  await db.author.deleteMany()
  await db.article.deleteMany()
  await db.issue.deleteMany()
  await db.volume.deleteMany()
  await db.editorialMember.deleteMany()
  await db.page.deleteMany()
  await db.announcement.deleteMany()
  await db.contactMessage.deleteMany()
  await db.journal.deleteMany()
  await db.user.deleteMany()
  await db.publisher.deleteMany()

  // -------------------------------------------------------------------------
  // Publisher
  // -------------------------------------------------------------------------
  console.log('Creating publisher…')
  await db.publisher.create({
    data: {
      id: 'default',
      name: 'Meridian Academic Press',
      shortName: 'Meridian',
      tagline: 'Independent open-access scholarship, rigorously reviewed.',
      about:
        'Meridian Academic Press is an independent open-access publisher of peer-reviewed scholarly journals. We publish research that meets international standards of methodological rigour and ethical conduct, and we make every article freely available to read, download and reuse from the moment it is published.\n\nWe work with editorial boards drawn from active researchers in each field. Every manuscript we publish has passed double-blind peer review, and our editorial and ethical policies follow the guidance of the Committee on Publication Ethics.',
      mission:
        'To remove the paywall between rigorous research and the people who need it — clinicians, teachers, policymakers and fellow researchers — particularly in regions where subscription access remains out of reach.',
      vision:
        'A scholarly record that is open by default, reviewed with care, and permanently preserved.',
      primaryColor: '#0a2540',
      addressLine1: 'Meridian Academic Press',
      addressLine2: 'Editorial Office',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      country: 'India',
      postalCode: '462001',
      email: 'editorial@meridianpress.test',
      phone: '+91 98260 00000',
      socials: {
        linkedin: 'https://linkedin.com/company/example',
        twitter: 'https://twitter.com/example',
      },
    },
  })

  // -------------------------------------------------------------------------
  // Admin user
  // -------------------------------------------------------------------------
  console.log('Creating admin user…')
  await db.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      fullName: 'Publisher Administrator',
      role: 'SUPER_ADMIN',
    },
  })

  // -------------------------------------------------------------------------
  // Journal 1 — Dentistry
  // -------------------------------------------------------------------------
  console.log('Creating journals…')
  const dental = await db.journal.create({
    data: {
      slug: 'contemporary-dental-research',
      name: 'Journal of Contemporary Dental Research',
      shortName: 'Contemporary Dental Research',
      abbreviation: 'J Contemp Dent Res',
      issnOnline: '2583-0000',
      primaryColor: '#0f766e',
      frequency: 'QUARTERLY',
      peerReviewType: 'DOUBLE_BLIND',
      apcAmount: 0,
      apcCurrency: 'INR',
      licenseType: 'CC_BY',
      doiPrefix: '10.00000',
      foundedYear: 2024,
      isPublished: true,
      sortOrder: 1,
      subjectAreas: [
        'Oral Surgery',
        'Orthodontics',
        'Prosthodontics',
        'Endodontics',
        'Pediatric Dentistry',
        'Dental Public Health',
        'Periodontology',
        'Oral Pathology',
      ],
      description:
        'An international, open-access, double-blind peer-reviewed journal publishing clinical and translational research across the dental sciences.',
      aimsAndScope:
        'The Journal of Contemporary Dental Research publishes original research, systematic reviews, case reports and short communications across the full breadth of clinical and translational dentistry.\n\nThe journal welcomes submissions in oral and maxillofacial surgery, orthodontics, prosthodontics, endodontics, periodontology, paediatric dentistry, oral pathology, oral medicine and dental public health. We are particularly interested in work that addresses clinical questions arising in resource-constrained settings, and in studies that report negative or null findings where the methodology is sound.\n\nWe do not publish work that has been submitted elsewhere, and we do not consider manuscripts that fall outside the dental and craniofacial sciences.',
    },
  })

  // -------------------------------------------------------------------------
  // Journal 2 — Humanities
  // -------------------------------------------------------------------------
  const humanities = await db.journal.create({
    data: {
      slug: 'humanities-social-perspectives',
      name: 'International Review of Humanities and Social Perspectives',
      shortName: 'Humanities and Social Perspectives',
      abbreviation: 'Int Rev Humanit Soc Perspect',
      issnOnline: '2583-0001',
      primaryColor: '#7c3f00',
      frequency: 'BIANNUAL',
      peerReviewType: 'DOUBLE_BLIND',
      apcAmount: 0,
      apcCurrency: 'INR',
      licenseType: 'CC_BY_NC',
      doiPrefix: '10.00000',
      foundedYear: 2025,
      isPublished: true,
      sortOrder: 2,
      subjectAreas: [
        'Literature',
        'Sociology',
        'Philosophy',
        'History',
        'Political Science',
        'Anthropology',
        'Psychology',
        'Linguistics',
      ],
      description:
        'A biannual, open-access, peer-reviewed journal for scholarship across the humanities and the interpretive social sciences.',
      aimsAndScope:
        'The International Review of Humanities and Social Perspectives publishes scholarly articles, review essays and critical commentary across the humanities and the interpretive social sciences.\n\nWe welcome work in literary studies, history, philosophy, sociology, anthropology, political theory, linguistics and social psychology. The journal has a particular interest in interdisciplinary scholarship, in work grounded in South Asian and Global South contexts, and in methodologically explicit qualitative research.\n\nWe publish in English. Submissions that are primarily quantitative and belong more properly to the empirical social sciences are usually declined at screening.',
    },
  })

  // -------------------------------------------------------------------------
  // Volumes, issues and articles
  // -------------------------------------------------------------------------
  console.log('Creating volumes, issues and articles…')

  const dentalVol = await db.volume.create({
    data: { journalId: dental.id, number: 2, year: 2026 },
  })
  const dentalVol1 = await db.volume.create({
    data: { journalId: dental.id, number: 1, year: 2025 },
  })

  const dentalIssue2 = await db.issue.create({
    data: {
      volumeId: dentalVol.id,
      number: 1,
      title: 'Volume 2, Issue 1',
      publishedAt: new Date('2026-03-15'),
      isPublished: true,
    },
  })
  const dentalIssue1 = await db.issue.create({
    data: {
      volumeId: dentalVol1.id,
      number: 2,
      title: 'Volume 1, Issue 2',
      publishedAt: new Date('2025-09-20'),
      isPublished: true,
    },
  })

  const humVol = await db.volume.create({
    data: { journalId: humanities.id, number: 1, year: 2026 },
  })
  const humIssue = await db.issue.create({
    data: {
      volumeId: humVol.id,
      number: 1,
      title: 'Volume 1, Issue 1 — Inaugural Issue',
      publishedAt: new Date('2026-06-30'),
      isPublished: true,
    },
  })

  type SeedArticle = {
    title: string
    abstract: string
    keywords: string[]
    type: ArticleType
    authors: { name: string; aff: string; country: string; corresponding?: boolean; orcid?: string }[]
    pageStart: number
    pageEnd: number
    doiSuffix: string
    featured?: boolean
    received: string
    accepted: string
    published: string
  }

  const dentalIssue2Articles: SeedArticle[] = [
    {
      title:
        'Marginal bone loss around platform-switched implants at 36 months: a prospective cohort study',
      abstract:
        'Platform switching has been proposed as a means of limiting crestal bone resorption around dental implants, but medium-term evidence from routine clinical practice remains limited. This prospective cohort study followed 148 platform-switched implants placed in 96 patients across two centres over 36 months. Marginal bone level was measured radiographically at placement, 12, 24 and 36 months by two calibrated, blinded examiners. Mean marginal bone loss was 0.42 mm (SD 0.31) at 12 months, 0.61 mm (SD 0.38) at 24 months and 0.68 mm (SD 0.41) at 36 months. Implants placed in the posterior mandible showed significantly greater loss than those in the anterior maxilla. Smoking status and a history of treated periodontitis were both independently associated with greater bone loss. The results support platform switching as a stable configuration over the medium term, while confirming that patient-level risk factors continue to exert a measurable effect.',
      keywords: ['dental implants', 'platform switching', 'marginal bone loss', 'cohort study', 'osseointegration'],
      type: 'RESEARCH',
      authors: [
        { name: 'Priya Ramaswamy', aff: 'Department of Prosthodontics, Institute of Dental Sciences', country: 'India', corresponding: true, orcid: '0000-0002-1825-0097' },
        { name: 'Arun Krishnan', aff: 'Department of Periodontology, Institute of Dental Sciences', country: 'India' },
        { name: 'Meera Nair', aff: 'Centre for Oral Health Research', country: 'India' },
      ],
      pageStart: 1,
      pageEnd: 14,
      doiSuffix: 'jcdr.2026.001',
      featured: true,
      received: '2025-10-02',
      accepted: '2026-01-18',
      published: '2026-03-15',
    },
    {
      title:
        'Accuracy of intraoral scanning versus conventional impressions for full-arch rehabilitation: a systematic review and meta-analysis',
      abstract:
        'Digital workflows are increasingly replacing conventional impression techniques, but their accuracy in full-arch rehabilitation remains contested. We searched five databases for in vitro and in vivo studies comparing intraoral scanning with conventional impressions for full-arch cases published between 2015 and 2025. Twenty-eight studies met the inclusion criteria and 19 provided data suitable for meta-analysis. Pooled analysis showed no statistically significant difference in trueness between the two techniques for arches with fewer than six implants, but a significant advantage for conventional impressions in fully edentulous arches with widely distributed implants. Heterogeneity was substantial and largely attributable to scanner generation. The evidence supports intraoral scanning for most partial-arch indications while suggesting caution in complex full-arch cases.',
      keywords: ['intraoral scanning', 'digital dentistry', 'impression accuracy', 'meta-analysis', 'full-arch'],
      type: 'SYSTEMATIC_REVIEW',
      authors: [
        { name: 'Sanjay Menon', aff: 'Department of Prosthodontics, College of Dental Surgery', country: 'India', corresponding: true },
        { name: 'Fatima Sheikh', aff: 'Department of Prosthodontics, College of Dental Surgery', country: 'India' },
      ],
      pageStart: 15,
      pageEnd: 32,
      doiSuffix: 'jcdr.2026.002',
      featured: true,
      received: '2025-08-14',
      accepted: '2026-01-22',
      published: '2026-03-15',
    },
    {
      title:
        'Silver diamine fluoride for arresting caries in primary molars: a 24-month randomised controlled trial in a school-based programme',
      abstract:
        'Silver diamine fluoride offers a low-cost, non-invasive option for arresting dentine caries where restorative care is unavailable. We randomised 412 children aged 5 to 8 years attending twelve government schools to receive either biannual 38% silver diamine fluoride application or standard oral health education alone. The primary outcome was the proportion of active carious lesions arrested at 24 months, assessed by examiners blinded to allocation. Arrest was achieved in 71.3% of lesions in the intervention arm compared with 18.9% in the control arm. Parental acceptance of the resulting staining was high when it was explained in advance. The intervention was well tolerated with no adverse events. Silver diamine fluoride applied within a school-based programme substantially reduced untreated active caries in this population.',
      keywords: ['silver diamine fluoride', 'dental caries', 'paediatric dentistry', 'randomised controlled trial', 'public health'],
      type: 'RESEARCH',
      authors: [
        { name: 'Lakshmi Iyer', aff: 'Department of Pedodontics and Preventive Dentistry', country: 'India', corresponding: true, orcid: '0000-0001-5109-3700' },
        { name: 'Rahul Deshpande', aff: 'Department of Public Health Dentistry', country: 'India' },
        { name: 'Anita Joseph', aff: 'School Health Programme, District Health Office', country: 'India' },
      ],
      pageStart: 33,
      pageEnd: 47,
      doiSuffix: 'jcdr.2026.003',
      received: '2025-09-30',
      accepted: '2026-02-01',
      published: '2026-03-15',
    },
    {
      title: 'Management of a dens invaginatus type III with apical periodontitis using guided endodontic access',
      abstract:
        'Dens invaginatus type III presents a considerable endodontic challenge because of its complex internal anatomy and the difficulty of locating canal orifices without excessive tissue removal. This case report describes a 19-year-old male presenting with a symptomatic maxillary lateral incisor with a type III invagination and an associated periapical lesion. Cone-beam computed tomography was used to plan a three-dimensionally printed access guide. Guided access permitted conservative preparation, and the invagination and the main canal were treated separately. At 18-month review the patient was asymptomatic with radiographic evidence of periapical healing. Guided endodontic access is a practical adjunct in anatomically complex cases where conventional access risks perforation.',
      keywords: ['dens invaginatus', 'guided endodontics', 'cone-beam computed tomography', 'case report', 'apical periodontitis'],
      type: 'CASE_REPORT',
      authors: [
        { name: 'Vikram Sethi', aff: 'Department of Conservative Dentistry and Endodontics', country: 'India', corresponding: true },
      ],
      pageStart: 48,
      pageEnd: 55,
      doiSuffix: 'jcdr.2026.004',
      received: '2025-11-11',
      accepted: '2026-02-05',
      published: '2026-03-15',
    },
    {
      title: 'Reporting standards in dental research: why we are asking authors for more',
      abstract:
        'This editorial sets out the journal’s position on reporting standards and explains the checklists we will require from the next issue onwards. We discuss the persistent under-reporting of randomisation and blinding procedures in the dental literature, the consequences for evidence synthesis, and the practical steps authors can take before submission.',
      keywords: ['editorial', 'reporting standards', 'CONSORT', 'research integrity'],
      type: 'EDITORIAL',
      authors: [
        { name: 'Ashok Varghese', aff: 'Editor-in-Chief, Journal of Contemporary Dental Research', country: 'India', corresponding: true },
      ],
      pageStart: 56,
      pageEnd: 58,
      doiSuffix: 'jcdr.2026.005',
      received: '2026-01-05',
      accepted: '2026-01-30',
      published: '2026-03-15',
    },
  ]

  const dentalIssue1Articles: SeedArticle[] = [
    {
      title:
        'Prevalence and severity of molar incisor hypomineralisation among schoolchildren in central India: a cross-sectional survey',
      abstract:
        'Molar incisor hypomineralisation is an increasingly recognised developmental defect with significant treatment implications, yet prevalence data from central India are sparse. We examined 1,842 children aged 8 to 10 years across 24 randomly selected schools using European Academy of Paediatric Dentistry criteria. Overall prevalence was 13.7%, with severe defects in 4.1% of affected children. First permanent molars were involved in all cases and incisors in 61%. Children with molar incisor hypomineralisation reported significantly higher rates of dentine hypersensitivity and were more likely to have received a restoration or extraction. The findings indicate a substantial and largely unmet treatment need in this population.',
      keywords: ['molar incisor hypomineralisation', 'prevalence', 'epidemiology', 'paediatric dentistry', 'India'],
      type: 'RESEARCH',
      authors: [
        { name: 'Neha Agarwal', aff: 'Department of Pedodontics and Preventive Dentistry', country: 'India', corresponding: true },
        { name: 'Suresh Patil', aff: 'Department of Public Health Dentistry', country: 'India' },
      ],
      pageStart: 61,
      pageEnd: 74,
      doiSuffix: 'jcdr.2025.011',
      received: '2025-03-19',
      accepted: '2025-08-02',
      published: '2025-09-20',
    },
    {
      title:
        'Adjunctive photodynamic therapy in the non-surgical management of stage III periodontitis: a split-mouth randomised trial',
      abstract:
        'Antimicrobial photodynamic therapy has been proposed as an adjunct to scaling and root planing, but reported effect sizes vary widely. In this split-mouth randomised trial, 64 patients with stage III grade B periodontitis received scaling and root planing in all quadrants, with two randomly allocated quadrants additionally receiving photodynamic therapy. Probing pocket depth, clinical attachment level and bleeding on probing were recorded at baseline, three and six months. Adjunctive therapy produced a statistically significant additional reduction in probing pocket depth at three months, but the difference was no longer significant at six months. The clinical relevance of the short-term benefit is questionable and does not currently justify routine use.',
      keywords: ['photodynamic therapy', 'periodontitis', 'scaling and root planing', 'randomised trial', 'split-mouth'],
      type: 'RESEARCH',
      authors: [
        { name: 'Imran Qureshi', aff: 'Department of Periodontology', country: 'India', corresponding: true, orcid: '0000-0003-4412-8890' },
        { name: 'Kavita Rao', aff: 'Department of Periodontology', country: 'India' },
        { name: 'Deepak Chandra', aff: 'Department of Oral Microbiology', country: 'India' },
      ],
      pageStart: 75,
      pageEnd: 88,
      doiSuffix: 'jcdr.2025.012',
      received: '2025-02-27',
      accepted: '2025-07-30',
      published: '2025-09-20',
    },
    {
      title: 'Three-dimensional printing in oral and maxillofacial surgery: current applications and practical limits',
      abstract:
        'Additive manufacturing has moved rapidly from research settings into routine maxillofacial practice. This review surveys current applications across orthognathic planning, reconstruction, implantology and surgical guides, and examines the evidence for each. We give particular attention to the practical constraints that determine whether a unit can adopt these techniques: material certification, sterilisation protocols, in-house versus outsourced production, and the regulatory position on patient-specific devices. We conclude that the principal barrier to wider adoption is no longer printer cost but the absence of validated workflows and clear regulatory guidance in many jurisdictions.',
      keywords: ['three-dimensional printing', 'additive manufacturing', 'maxillofacial surgery', 'surgical guides', 'review'],
      type: 'REVIEW',
      authors: [
        { name: 'Ravi Shankar', aff: 'Department of Oral and Maxillofacial Surgery', country: 'India', corresponding: true },
        { name: 'Elena Fischer', aff: 'Department of Craniofacial Surgery, University Hospital', country: 'Germany' },
      ],
      pageStart: 89,
      pageEnd: 106,
      doiSuffix: 'jcdr.2025.013',
      received: '2025-01-15',
      accepted: '2025-07-11',
      published: '2025-09-20',
    },
  ]

  const humanitiesArticles: SeedArticle[] = [
    {
      title: 'Vernacular modernity and the small-town press in late colonial north India',
      abstract:
        'The historiography of the Indian public sphere has concentrated overwhelmingly on metropolitan print culture, leaving the dense network of small-town vernacular periodicals largely unexamined. Drawing on a corpus of fourteen Hindi and Urdu periodicals published between 1919 and 1947 in towns of fewer than fifty thousand inhabitants, this article argues that these publications constituted a distinct arena of political argument rather than a derivative provincial echo of metropolitan debate. Their editors negotiated between reformist vocabularies and local caste and commercial interests in ways that metropolitan periodicals could not. The article proposes that attention to this scale of publication complicates prevailing accounts of how nationalist sentiment was assembled.',
      keywords: ['print culture', 'colonial India', 'public sphere', 'vernacular periodicals', 'nationalism'],
      type: 'RESEARCH',
      authors: [
        { name: 'Ananya Bhattacharya', aff: 'Department of History, Central University', country: 'India', corresponding: true, orcid: '0000-0002-7788-1234' },
      ],
      pageStart: 1,
      pageEnd: 24,
      doiSuffix: 'irhsp.2026.001',
      featured: true,
      received: '2025-11-04',
      accepted: '2026-04-12',
      published: '2026-06-30',
    },
    {
      title: 'What counts as consent? Rethinking autonomy in ethnographic fieldwork with precarious communities',
      abstract:
        'Institutional ethics review treats informed consent as a discrete event, documented and archived at the point of entry into the field. This article argues that in fieldwork with communities under material or legal precarity, this model misdescribes what is actually happening and can leave participants less protected rather than more. Drawing on eighteen months of fieldwork with informal waste-pickers, and on the philosophical literature on relational autonomy, the article develops an account of consent as a continuing negotiation rather than a threshold crossed once. It concludes with concrete proposals for how review boards might assess such continuing consent without collapsing into procedural box-ticking.',
      keywords: ['research ethics', 'informed consent', 'ethnography', 'relational autonomy', 'precarity'],
      type: 'RESEARCH',
      authors: [
        { name: 'Thomas Abraham', aff: 'Department of Sociology, School of Social Sciences', country: 'India', corresponding: true },
        { name: 'Rukhsana Begum', aff: 'Centre for Urban Studies', country: 'India' },
      ],
      pageStart: 25,
      pageEnd: 46,
      doiSuffix: 'irhsp.2026.002',
      featured: true,
      received: '2025-12-01',
      accepted: '2026-04-20',
      published: '2026-06-30',
    },
    {
      title: 'Translation as argument: rendering philosophical terminology across Sanskrit and English',
      abstract:
        'Translators of classical Sanskrit philosophical texts routinely face terms for which no English equivalent carries the same argumentative weight. This essay examines four such terms and the divergent strategies adopted by major twentieth-century translators. It argues that the choice between transliteration, coinage and approximation is not a stylistic preference but itself a substantive philosophical commitment that shapes what the resulting text can be read as claiming. The essay closes by considering what this implies for the teaching of Indian philosophy in anglophone curricula.',
      keywords: ['translation studies', 'Sanskrit', 'philosophy', 'terminology', 'hermeneutics'],
      type: 'RESEARCH',
      authors: [
        { name: 'Gopal Subramanian', aff: 'Department of Philosophy, University College', country: 'India', corresponding: true },
      ],
      pageStart: 47,
      pageEnd: 68,
      doiSuffix: 'irhsp.2026.003',
      received: '2025-10-22',
      accepted: '2026-04-28',
      published: '2026-06-30',
    },
    {
      title: 'Opening a new journal: a note on scope, standards and what we will not publish',
      abstract:
        'The inaugural editorial sets out the intellectual scope of the journal, the review procedures we have adopted, and our reasoning in choosing them. It states plainly the categories of submission we will decline at screening and explains why.',
      keywords: ['editorial', 'scope', 'peer review', 'editorial policy'],
      type: 'EDITORIAL',
      authors: [
        { name: 'Sunita Kaul', aff: 'Editor-in-Chief, International Review of Humanities and Social Perspectives', country: 'India', corresponding: true },
      ],
      pageStart: 69,
      pageEnd: 72,
      doiSuffix: 'irhsp.2026.004',
      received: '2026-03-01',
      accepted: '2026-05-02',
      published: '2026-06-30',
    },
  ]

  async function createArticles(
    journalId: string,
    issueId: string,
    doiPrefix: string,
    articles: SeedArticle[],
  ) {
    for (const a of articles) {
      const slug = a.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 80)
        .replace(/-+$/, '')

      await db.article.create({
        data: {
          journalId,
          issueId,
          slug,
          title: a.title,
          abstract: a.abstract,
          keywords: a.keywords,
          articleType: a.type,
          pageStart: a.pageStart,
          pageEnd: a.pageEnd,
          doi: `${doiPrefix}/${a.doiSuffix}`,
          receivedAt: new Date(a.received),
          acceptedAt: new Date(a.accepted),
          publishedAt: new Date(a.published),
          isPublished: true,
          isFeatured: a.featured ?? false,
          viewCount: Math.floor(200 + a.pageStart * 37),
          downloadCount: Math.floor(60 + a.pageStart * 11),
          fundingStatement:
            'The authors received no specific funding for this work.',
          conflictOfInterest: 'The authors declare no conflict of interest.',
          dataAvailability:
            'The data supporting the findings of this study are available from the corresponding author on reasonable request.',
          authors: {
            create: a.authors.map((au, i) => ({
              fullName: au.name,
              affiliation: au.aff,
              country: au.country,
              orcid: au.orcid ?? null,
              isCorresponding: au.corresponding ?? false,
              order: i,
              email: au.corresponding ? 'corresponding@example.test' : null,
            })),
          },
        },
      })
    }
  }

  await createArticles(dental.id, dentalIssue2.id, dental.doiPrefix!, dentalIssue2Articles)
  await createArticles(dental.id, dentalIssue1.id, dental.doiPrefix!, dentalIssue1Articles)
  await createArticles(humanities.id, humIssue.id, humanities.doiPrefix!, humanitiesArticles)

  // -------------------------------------------------------------------------
  // Editorial boards
  // -------------------------------------------------------------------------
  console.log('Creating editorial boards…')

  const dentalBoard: [string, Designation, string, string][] = [
    ['Ashok Varghese', 'EDITOR_IN_CHIEF', 'Institute of Dental Sciences', 'India'],
    ['Helena Marsh', 'ASSOCIATE_EDITOR', 'Faculty of Dentistry, University of Leeds', 'United Kingdom'],
    ['Priya Ramaswamy', 'SECTION_EDITOR', 'Department of Prosthodontics, Institute of Dental Sciences', 'India'],
    ['Imran Qureshi', 'SECTION_EDITOR', 'Department of Periodontology', 'India'],
    ['Lakshmi Iyer', 'SECTION_EDITOR', 'Department of Pedodontics and Preventive Dentistry', 'India'],
    ['Ravi Shankar', 'SECTION_EDITOR', 'Department of Oral and Maxillofacial Surgery', 'India'],
    ['Chen Wei', 'BOARD_MEMBER', 'School of Stomatology, Peking University', 'China'],
    ['Maria Santos', 'BOARD_MEMBER', 'Faculty of Dentistry, University of São Paulo', 'Brazil'],
    ['Deepak Chandra', 'MANAGING_EDITOR', 'Meridian Academic Press', 'India'],
  ]

  const humBoard: [string, Designation, string, string][] = [
    ['Sunita Kaul', 'EDITOR_IN_CHIEF', 'Department of History, Central University', 'India'],
    ['Ananya Bhattacharya', 'ASSOCIATE_EDITOR', 'Department of History, Central University', 'India'],
    ['Gopal Subramanian', 'SECTION_EDITOR', 'Department of Philosophy, University College', 'India'],
    ['Thomas Abraham', 'SECTION_EDITOR', 'Department of Sociology, School of Social Sciences', 'India'],
    ['Amara Okonkwo', 'BOARD_MEMBER', 'Department of Literature, University of Ibadan', 'Nigeria'],
    ['James Whitfield', 'BOARD_MEMBER', 'School of Anthropology, University of Edinburgh', 'United Kingdom'],
  ]

  for (const [i, [fullName, designation, affiliation, country]] of dentalBoard.entries()) {
    await db.editorialMember.create({
      data: { journalId: dental.id, fullName, designation, affiliation, country, sortOrder: i },
    })
  }
  for (const [i, [fullName, designation, affiliation, country]] of humBoard.entries()) {
    await db.editorialMember.create({
      data: { journalId: humanities.id, fullName, designation, affiliation, country, sortOrder: i },
    })
  }

  // -------------------------------------------------------------------------
  // Policy pages — publisher level
  // -------------------------------------------------------------------------
  console.log('Creating policy pages…')

  const publisherPages = [
    {
      slug: 'publication-ethics',
      title: 'Publication Ethics and Malpractice Statement',
      navGroup: 'Ethics',
      body: `<p>Meridian Academic Press follows the Core Practices of the Committee on Publication Ethics (COPE). This statement applies to every journal we publish and to every party involved in the act of publishing: authors, editors, reviewers and the publisher.</p>
<h2>Authorship</h2>
<p>Authorship is limited to those who have made a substantial contribution to the conception, design, execution or interpretation of the reported study. All those who have made substantial contributions must be listed as co-authors. Those who participated in a lesser capacity should be acknowledged. The corresponding author is responsible for ensuring that all listed authors have approved the final manuscript and agreed to its submission.</p>
<h2>Plagiarism</h2>
<p>All submissions are screened using similarity-detection software before peer review. Manuscripts containing verbatim or lightly paraphrased material from other sources without attribution are rejected. Where plagiarism is detected after publication, the article is retracted and the authors' institutions are informed.</p>
<h2>Use of artificial intelligence</h2>
<p>Large language models and other generative tools may not be listed as authors, as they cannot take responsibility for the work. Authors who have used such tools in the preparation of a manuscript must disclose this in the methods or acknowledgements, stating which tool was used and for what purpose. Undisclosed use discovered after publication is treated as a breach of research integrity.</p>
<h2>Data fabrication and falsification</h2>
<p>Fabrication or falsification of data, images or results is research misconduct. Where an allegation is raised, we follow the relevant COPE flowchart, contact the corresponding author for an explanation, and where necessary refer the matter to the authors' institution.</p>
<h2>Duplicate and redundant publication</h2>
<p>Manuscripts must not be under consideration elsewhere. Submissions that substantially overlap with the authors' previously published work without clear acknowledgement are declined.</p>
<h2>Conflicts of interest</h2>
<p>All authors must declare any financial or non-financial interest that could be perceived to influence the reported work. Editors and reviewers must recuse themselves where such a conflict exists.</p>
<h2>Corrections and retractions</h2>
<p>Where an error materially affects the findings, we publish a correction linked bidirectionally to the original article. Where the findings are unreliable as a result of misconduct or honest error, we publish a retraction notice. Retracted articles are not removed; they remain available, clearly watermarked, so the scholarly record stays intact.</p>
<h2>Appeals and complaints</h2>
<p>Authors may appeal an editorial decision by writing to the Editor-in-Chief with a point-by-point response. Appeals are considered once. Complaints about editorial process should be addressed to the publisher at the editorial office.</p>
<h2>Research involving humans and animals</h2>
<p>Studies involving human participants must state the name of the approving ethics committee and the approval reference, and must confirm that informed consent was obtained. Studies involving animals must confirm compliance with the relevant national guidelines and institutional approval.</p>`,
    },
    {
      slug: 'peer-review-policy',
      title: 'Peer Review Policy',
      navGroup: 'Editorial Policies',
      body: `<p>Every research article we publish has undergone double-blind peer review. Author identities are concealed from reviewers and reviewer identities from authors.</p>
<h2>Process</h2>
<p>On receipt, a manuscript is checked by the editorial office for scope, completeness and similarity. Manuscripts that fall outside the journal's scope or fail to meet basic reporting requirements are returned without review, usually within ten working days.</p>
<p>Manuscripts passing screening are assigned to a handling editor, who invites at least two independent reviewers with relevant expertise. Reviewers are asked to comment on originality, methodological soundness, the validity of the conclusions and the clarity of presentation, and to make one of four recommendations: accept, minor revision, major revision, or reject.</p>
<p>The handling editor makes a decision on the basis of the reviews. Where reviewers disagree substantially, a third reviewer is invited. Revised manuscripts are usually returned to the original reviewers.</p>
<h2>Timelines</h2>
<p>We aim to return a first decision within eight weeks of submission. Reviewers are given three weeks to complete a review. These are targets, not guarantees; authors are notified if a manuscript is delayed.</p>
<h2>Reviewer conduct</h2>
<p>Reviewers must treat manuscripts as confidential, must not use unpublished material for their own purposes, and must decline an invitation where a conflict of interest exists.</p>`,
    },
    {
      slug: 'open-access-policy',
      title: 'Open Access Policy',
      navGroup: 'Editorial Policies',
      body: `<p>All journals published by Meridian Academic Press are fully open access. Every article is freely available to read, download and reuse from the moment of publication. There is no subscription, no embargo and no paywall.</p>
<h2>Licensing</h2>
<p>Articles are published under a Creative Commons licence, stated on each article page and on each journal's home page. Authors retain copyright in their work.</p>
<h2>Author charges</h2>
<p>Article processing charges, where they apply, are stated on each journal's publication charges page before submission. We do not levy submission fees, and no charge is ever made for a manuscript that is not accepted.</p>`,
    },
    {
      slug: 'copyright-and-licensing',
      title: 'Copyright and Licensing',
      navGroup: 'Editorial Policies',
      body: `<p>Authors retain copyright in articles published in our journals. On acceptance, authors grant the publisher a licence to publish, and the article is made available under the Creative Commons licence specified by the journal.</p>
<p>This means readers are free to share and adapt the work, subject to the conditions of the specific licence, provided appropriate credit is given to the original authors and the source.</p>
<p>Authors are free to deposit any version of their article — submitted, accepted or published — in an institutional or subject repository, or on a personal website, at any time and without embargo.</p>`,
    },
    {
      slug: 'archiving-and-preservation',
      title: 'Archiving and Preservation',
      navGroup: 'Editorial Policies',
      body: `<p>Published content is intended to remain permanently accessible. Every article receives a Digital Object Identifier, which resolves to the article page and continues to do so even if the article's location changes.</p>
<p>Full-text content and metadata are made available for harvesting through an OAI-PMH interface, and the complete corpus is backed up independently of the live site.</p>
<p>Should a journal cease publication, its content will remain available at the existing URLs.</p>`,
    },
    {
      slug: 'complaints-and-appeals',
      title: 'Complaints and Appeals',
      navGroup: 'Ethics',
      body: `<p>We take complaints seriously, whether they concern an editorial decision, the conduct of the review process, or the behaviour of anyone acting on behalf of the publisher.</p>
<h2>Appealing a decision</h2>
<p>Authors who believe a decision was reached in error may appeal to the Editor-in-Chief within thirty days, setting out specific grounds and responding point by point to the reviewers' comments. An appeal is not an opportunity to submit new data. Appeals are considered once, and the Editor-in-Chief's decision is final.</p>
<h2>Complaints about process</h2>
<p>Complaints about the conduct of the editorial process should be sent to the editorial office. We acknowledge complaints within five working days and aim to respond substantively within thirty days.</p>`,
    },
  ]

  for (const [i, p] of publisherPages.entries()) {
    await db.page.create({ data: { ...p, sortOrder: i, journalId: null } })
  }

  // Journal-level pages
  const journalPageTemplates = (j: { id: string; name: string; apcAmount: number; apcCurrency: string }) => [
    {
      journalId: j.id,
      slug: 'author-guidelines',
      title: 'Instructions for Authors',
      navGroup: 'For Authors',
      sortOrder: 0,
      body: `<p>Before submitting to ${j.name}, please read these instructions in full. Manuscripts that do not follow them are returned without review.</p>
<h2>Manuscript preparation</h2>
<p>Submit the manuscript as a single Word or PDF file, double spaced, with continuous line numbering and pages numbered. Use a standard 12-point serif typeface. Tables and figures may be embedded in the manuscript for review; source files are requested on acceptance.</p>
<h2>Structure</h2>
<p>Original research should follow the conventional structure: Title, Abstract, Keywords, Introduction, Materials and Methods, Results, Discussion, Conclusion, References. The abstract should be no more than 300 words and should be structured under the same headings. Provide between four and eight keywords.</p>
<h2>Title page</h2>
<p>Supply the title page as a separate file. It should carry the title, the full name and affiliation of every author, the ORCID identifier of each author where available, and the name, postal address, telephone number and email address of the corresponding author. Because review is double blind, the manuscript file itself must not contain any identifying information.</p>
<h2>References</h2>
<p>References should follow the Vancouver style, numbered consecutively in the order of first citation, with numerals in square brackets in the text. List all authors up to six; where there are more than six, list the first six followed by <em>et al</em>.</p>
<h2>Declarations</h2>
<p>Every submission must include statements on funding, conflicts of interest, ethical approval and data availability. Manuscripts reporting research on human participants must give the name of the approving committee and the approval number.</p>
<h2>What to submit</h2>
<p>A complete submission consists of the anonymised manuscript, a separate title page, a cover letter, and any supplementary material. Reporting checklists are required for trials, systematic reviews and observational studies.</p>`,
    },
    {
      journalId: j.id,
      slug: 'publication-charges',
      title: 'Article Processing Charges',
      navGroup: 'For Authors',
      sortOrder: 1,
      body:
        j.apcAmount === 0
          ? `<p><strong>${j.name} does not currently levy an article processing charge.</strong></p>
<p>There is no submission fee and no publication fee. Publication costs are met by the publisher during the journal's establishment period.</p>
<p>Should this change, the new charge will be published on this page and will apply only to manuscripts submitted after the date of the change. Manuscripts already under review will not be affected.</p>
<p>No charge of any kind is ever made for a manuscript that is not accepted, and the ability to pay plays no part in any editorial decision.</p>`
          : `<p>${j.name} levies an article processing charge of ${j.apcCurrency} ${j.apcAmount.toLocaleString()} on accepted manuscripts.</p>
<p>There is no submission fee. The charge is payable only after acceptance, and no charge is made for a manuscript that is not accepted. The ability to pay plays no part in any editorial decision — editorial and financial processes are kept entirely separate.</p>
<h2>Waivers</h2>
<p>Full or partial waivers are available to authors who lack access to funding. Requests should be made at the point of submission, in the cover letter, and are decided by the publisher rather than by the handling editor.</p>`,
    },
    {
      journalId: j.id,
      slug: 'peer-review-process',
      title: 'Peer Review Process',
      navGroup: 'About',
      sortOrder: 2,
      body: `<p>${j.name} operates double-blind peer review. The identities of authors and reviewers are concealed from one another throughout.</p>
<h2>What happens to your manuscript</h2>
<ol>
<li><strong>Submission and acknowledgement.</strong> You receive a tracking identifier immediately on submission. Use it to check progress at any time.</li>
<li><strong>Editorial screening.</strong> The editorial office checks scope, completeness, formatting and similarity. Roughly a third of submissions are returned at this stage, usually within ten working days.</li>
<li><strong>Reviewer assignment.</strong> The handling editor invites at least two independent reviewers with relevant subject expertise.</li>
<li><strong>Review.</strong> Reviewers are given three weeks. They assess originality, methodology, the validity of the conclusions and clarity.</li>
<li><strong>Decision.</strong> The handling editor decides: accept, minor revision, major revision, or reject. Where reviewers disagree substantially, a third opinion is sought.</li>
<li><strong>Revision.</strong> Revised manuscripts must be accompanied by a point-by-point response and are normally returned to the original reviewers.</li>
<li><strong>Acceptance and production.</strong> Accepted manuscripts are copyedited, typeset and proofed by the authors before publication. A DOI is registered on publication.</li>
</ol>
<p>We aim to return a first decision within eight weeks. Authors are notified if their manuscript is delayed beyond this.</p>`,
    },
    {
      journalId: j.id,
      slug: 'indexing',
      title: 'Indexing and Abstracting',
      navGroup: 'About',
      sortOrder: 3,
      body: `<p>${j.name} is a new journal and is building the consistent publication record required by the major indexing and abstracting services.</p>
<p>We publish complete, structured metadata for every article, register a DOI for each, and expose our full corpus for harvesting through an OAI-PMH interface, so that the journal is discoverable and ready for evaluation as soon as it becomes eligible.</p>
<p>We will list services here only once inclusion has actually been granted. We do not claim indexing we do not have, and we would encourage authors to be sceptical of any journal that does.</p>`,
    },
  ]

  for (const p of journalPageTemplates(dental)) await db.page.create({ data: p })
  for (const p of journalPageTemplates(humanities)) await db.page.create({ data: p })

  // -------------------------------------------------------------------------
  // Announcements, sample submissions, reviewers
  // -------------------------------------------------------------------------
  console.log('Creating announcements and sample submissions…')

  await db.announcement.create({
    data: {
      title: 'Call for papers: special issue on artificial intelligence in clinical dentistry',
      journalId: dental.id,
      body: 'The Journal of Contemporary Dental Research invites submissions for a special issue examining the clinical application and evaluation of machine learning methods in dentistry. We are particularly interested in prospective evaluations and in studies that report where these methods failed. Deadline for submissions: 30 November 2026.',
      publishedAt: new Date('2026-07-01'),
    },
  })

  await db.announcement.create({
    data: {
      title: 'International Review of Humanities and Social Perspectives publishes its inaugural issue',
      journalId: humanities.id,
      body: 'We are pleased to announce the publication of the first issue of the International Review of Humanities and Social Perspectives, comprising three research articles and an opening editorial. The journal is now open for submissions for Volume 1, Issue 2.',
      publishedAt: new Date('2026-06-30'),
    },
  })

  const reviewers = [
    { fullName: 'Nandini Raghavan', email: 'n.raghavan@example.test', affiliation: 'Department of Oral Pathology', country: 'India', expertise: ['Oral Pathology', 'Histology'] },
    { fullName: 'Peter Lindqvist', email: 'p.lindqvist@example.test', affiliation: 'Faculty of Odontology, Malmö University', country: 'Sweden', expertise: ['Periodontology', 'Implantology'] },
    { fullName: 'Sarah Mensah', email: 's.mensah@example.test', affiliation: 'School of Social Sciences, University of Ghana', country: 'Ghana', expertise: ['Sociology', 'Qualitative Methods'] },
  ]
  for (const r of reviewers) await db.reviewer.create({ data: r })

  await db.submission.create({
    data: {
      trackingId: 'JCDR-2026-0041',
      journalId: dental.id,
      manuscriptTitle:
        'Fluoride varnish application intervals in high-caries-risk adolescents: a pragmatic cluster trial',
      abstract:
        'A pragmatic cluster-randomised trial comparing six-monthly and three-monthly fluoride varnish application in adolescents identified as high caries risk across eighteen schools.',
      keywords: ['fluoride varnish', 'caries prevention', 'adolescents', 'cluster trial'],
      articleType: 'RESEARCH',
      correspondingAuthorName: 'Rohit Malhotra',
      correspondingAuthorEmail: 'r.malhotra@example.test',
      correspondingAffiliation: 'Department of Public Health Dentistry',
      declarationAccepted: true,
      status: 'UNDER_REVIEW',
      internalNotes: 'Two reviewers invited on 12 July. One accepted, awaiting second response.',
      submittedAt: new Date('2026-07-08'),
    },
  })

  await db.submission.create({
    data: {
      trackingId: 'IRHSP-2026-0012',
      journalId: humanities.id,
      manuscriptTitle: 'Memory, monument and municipal politics in three Deccan towns',
      abstract:
        'An examination of how municipal bodies in three Deccan towns have negotiated competing claims over commemorative space between 1992 and 2020.',
      keywords: ['public memory', 'urban politics', 'commemoration', 'Deccan'],
      articleType: 'RESEARCH',
      correspondingAuthorName: 'Farah Naqvi',
      correspondingAuthorEmail: 'f.naqvi@example.test',
      correspondingAffiliation: 'Department of Political Science',
      declarationAccepted: true,
      status: 'SUBMITTED',
      submittedAt: new Date('2026-08-02'),
    },
  })

  const counts = {
    journals: await db.journal.count(),
    articles: await db.article.count(),
    authors: await db.author.count(),
    board: await db.editorialMember.count(),
    pages: await db.page.count(),
    submissions: await db.submission.count(),
  }

  console.log('\n─────────────────────────────────────────────')
  console.log('  Seed complete')
  console.log('─────────────────────────────────────────────')
  console.log(`  Journals:          ${counts.journals}`)
  console.log(`  Articles:          ${counts.articles}`)
  console.log(`  Authors:           ${counts.authors}`)
  console.log(`  Editorial board:   ${counts.board}`)
  console.log(`  Pages:             ${counts.pages}`)
  console.log(`  Submissions:       ${counts.submissions}`)
  console.log('─────────────────────────────────────────────')
  console.log('  ADMIN LOGIN')
  console.log(`  Email:    ${ADMIN_EMAIL}`)
  console.log(`  Password: ${ADMIN_PASSWORD}`)
  console.log('─────────────────────────────────────────────\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
