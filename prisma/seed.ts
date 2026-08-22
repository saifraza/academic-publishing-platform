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
      name: 'The Seventhsky Publishers',
      shortName: 'Seventhsky',
      tagline: 'Open access research, peer reviewed.',
      about:
        'The Seventhsky Publishers is an independent open-access publisher of peer-reviewed scholarly journals, with its head office in Bhopal, India and a branch office in Regina, Canada.\n\nWe publish research that meets international standards of methodological rigour and ethical conduct, and we make every article freely available to read, download and reuse from the moment it is published. Every manuscript we publish has passed double-blind peer review, and our editorial and ethical policies follow the guidance of the Committee on Publication Ethics.',
      mission:
        'To remove the paywall between rigorous research and the people who need it — clinicians, teachers, policymakers and fellow researchers — particularly in regions where subscription access remains out of reach.',
      vision:
        'A scholarly record that is open by default, reviewed with care, and permanently preserved.',
      primaryColor: '#0a2540',
      addressLine1: '11 Idgah Hills',
      addressLine2: 'Head Office',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      country: 'India',
      postalCode: '462001',
      branchLabel: 'Branch Office',
      branchAddressLine1: '59 Cowburn Crescent',
      branchAddressLine2: '',
      branchCity: 'Regina',
      branchState: 'Saskatchewan',
      branchCountry: 'Canada',
      branchPostalCode: 'S4S 5R9',
      email: 'info@seventhskypublishers.com',
      phone: '+91 79872 26676',
      socials: {},
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
  // Journal 1 — Health and Nutrition
  // -------------------------------------------------------------------------
  console.log('Creating journals…')
  const health = await db.journal.create({
    data: {
      slug: 'contemporary-research-health-nutrition',
      name: 'Journal for Contemporary Research in Health and Nutrition',
      shortName: 'Health and Nutrition',
      abbreviation: 'J Contemp Res Health Nutr',
      email: 'editor.health@seventhskypublishers.com',
      issnOnline: null,
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
        'Nutrition Science',
        'Public Health',
        'Dietetics',
        'Community Nutrition',
        'Maternal and Child Health',
        'Food Science',
        'Epidemiology',
        'Health Promotion',
      ],
      description:
        'An international, open-access, double-blind peer-reviewed journal publishing clinical, community and translational research across health and nutrition.',
      aimsAndScope:
        'The Journal for Contemporary Research in Health and Nutrition publishes original research, systematic reviews, case reports and short communications across human nutrition, dietetics and public health.\n\nThe journal welcomes submissions in clinical and community nutrition, maternal and child health, nutritional epidemiology, food science, dietary assessment, health promotion and health services research. We are particularly interested in work that addresses questions arising in resource-constrained settings, and in studies that report negative or null findings where the methodology is sound.\n\nWe do not publish work that has been submitted elsewhere, and we do not consider manuscripts that fall outside health and nutrition.',
    },
  })

  // -------------------------------------------------------------------------
  // Journal 2 — Humanities
  // -------------------------------------------------------------------------
  const humanities = await db.journal.create({
    data: {
      slug: 'contemporary-research-humanities-social',
      name: 'Journal for Contemporary Research in Humanities and Social Perspective',
      shortName: 'Humanities and Social Perspective',
      abbreviation: 'J Contemp Res Humanit Soc Perspect',
      email: 'editor.humanities@seventhskypublishers.com',
      issnOnline: null,
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
        'The Journal for Contemporary Research in Humanities and Social Perspective publishes scholarly articles, review essays and critical commentary across the humanities and the interpretive social sciences.\n\nWe welcome work in literary studies, history, philosophy, sociology, anthropology, political theory, linguistics and social psychology. The journal has a particular interest in interdisciplinary scholarship, in work grounded in South Asian and Global South contexts, and in methodologically explicit qualitative research.\n\nWe publish in English. Submissions that are primarily quantitative and belong more properly to the empirical social sciences are usually declined at screening.',
    },
  })

  // -------------------------------------------------------------------------
  // Volumes, issues and articles
  // -------------------------------------------------------------------------
  console.log('Creating volumes, issues and articles…')

  const healthVol = await db.volume.create({
    data: { journalId: health.id, number: 2, year: 2026 },
  })
  const healthVol1 = await db.volume.create({
    data: { journalId: health.id, number: 1, year: 2025 },
  })

  const healthIssue2 = await db.issue.create({
    data: {
      volumeId: healthVol.id,
      number: 1,
      title: 'Volume 2, Issue 1',
      publishedAt: new Date('2026-03-15'),
      isPublished: true,
    },
  })
  const healthIssue1 = await db.issue.create({
    data: {
      volumeId: healthVol1.id,
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

  const healthIssue2Articles: SeedArticle[] = [
    {
      title:
        'Iron and folic acid supplementation adherence among pregnant women in rural Madhya Pradesh: a mixed-methods study',
      abstract:
        'Anaemia in pregnancy remains a leading contributor to maternal morbidity in central India, and adherence to iron and folic acid supplementation is persistently below programme targets. This mixed-methods study followed 486 pregnant women across fourteen rural health sub-centres over their second and third trimesters. Adherence was measured by pill count and verified against self-report, and 42 women took part in semi-structured interviews. Full adherence was achieved by 38.4% of participants. Gastrointestinal side effects, irregular supply at the sub-centre, and the belief that supplements cause a larger baby and a harder delivery were the three factors most strongly associated with discontinuation. Counselling delivered by an accredited social health activist at the point of dispensing was associated with substantially higher adherence. The findings suggest that supply reliability and structured counselling matter more than the number of contacts.',
      keywords: ['anaemia', 'iron and folic acid', 'maternal nutrition', 'adherence', 'mixed methods'],
      type: 'RESEARCH',
      authors: [
        { name: 'Priya Ramaswamy', aff: 'Department of Community Nutrition, Institute of Health Sciences', country: 'India', corresponding: true, orcid: '0000-0002-1825-0097' },
        { name: 'Arun Krishnan', aff: 'Department of Public Health, Institute of Health Sciences', country: 'India' },
        { name: 'Meera Nair', aff: 'Centre for Maternal and Child Health Research', country: 'India' },
      ],
      pageStart: 1,
      pageEnd: 14,
      doiSuffix: 'jcrhn.2026.001',
      featured: true,
      received: '2025-10-02',
      accepted: '2026-01-18',
      published: '2026-03-15',
    },
    {
      title:
        'Dietary diversity scores as a predictor of micronutrient adequacy in school-aged children: a systematic review and meta-analysis',
      abstract:
        'Dietary diversity scores are widely used as a low-cost proxy for micronutrient adequacy, but their predictive validity in school-aged children is contested. We searched five databases for studies published between 2010 and 2025 that reported both a dietary diversity score and a biochemical or intake-based measure of micronutrient adequacy in children aged 5 to 14 years. Thirty-one studies met the inclusion criteria and 22 provided data suitable for meta-analysis. Pooled correlation between dietary diversity and mean micronutrient adequacy ratio was moderate, and considerably stronger in populations with lower overall dietary quality. Heterogeneity was substantial and largely attributable to the recall period and the number of food groups used. Dietary diversity scores appear most useful as a screening tool in food-insecure populations and least useful where diets are already varied.',
      keywords: ['dietary diversity', 'micronutrient adequacy', 'school-aged children', 'meta-analysis', 'dietary assessment'],
      type: 'SYSTEMATIC_REVIEW',
      authors: [
        { name: 'Sanjay Menon', aff: 'Department of Dietetics, College of Allied Health Sciences', country: 'India', corresponding: true },
        { name: 'Fatima Sheikh', aff: 'Department of Dietetics, College of Allied Health Sciences', country: 'India' },
      ],
      pageStart: 15,
      pageEnd: 32,
      doiSuffix: 'jcrhn.2026.002',
      featured: true,
      received: '2025-08-14',
      accepted: '2026-01-22',
      published: '2026-03-15',
    },
    {
      title:
        'A school-based mid-morning snack intervention and its effect on anaemia in adolescent girls: a 24-month cluster randomised trial',
      abstract:
        'Adolescent anaemia is a persistent public health problem in India, and school-based interventions offer a route to reach girls who rarely attend health facilities. We randomised 412 girls aged 12 to 15 years across twelve government schools to receive either a fortified mid-morning snack on school days or standard nutrition education alone. The primary outcome was change in haemoglobin concentration at 24 months, assessed by staff blinded to allocation. Mean haemoglobin rose by 1.24 g/dL in the intervention arm compared with 0.31 g/dL in the control arm. The proportion classified as anaemic fell from 61.2% to 34.7% in the intervention arm. Acceptability was high and wastage was low once the snack was served during the existing break rather than after school. A fortified snack delivered within the school day materially reduced anaemia in this population.',
      keywords: ['adolescent anaemia', 'school feeding', 'food fortification', 'cluster randomised trial', 'public health nutrition'],
      type: 'RESEARCH',
      authors: [
        { name: 'Lakshmi Iyer', aff: 'Department of Public Health Nutrition', country: 'India', corresponding: true, orcid: '0000-0001-5109-3700' },
        { name: 'Rahul Deshpande', aff: 'Department of Community Medicine', country: 'India' },
        { name: 'Anita Joseph', aff: 'School Health Programme, District Health Office', country: 'India' },
      ],
      pageStart: 33,
      pageEnd: 47,
      doiSuffix: 'jcrhn.2026.003',
      received: '2025-09-30',
      accepted: '2026-02-01',
      published: '2026-03-15',
    },
    {
      title: 'Refeeding syndrome in a young adult with prolonged undiagnosed coeliac disease: a case report',
      abstract:
        'Refeeding syndrome is an underrecognised complication of nutritional rehabilitation and can be fatal if electrolyte shifts are not anticipated. This case report describes a 21-year-old man presenting with a two-year history of weight loss, diarrhoea and fatigue, subsequently diagnosed with coeliac disease. Nutritional support was commenced at the referring centre without electrolyte monitoring, and on day three he developed severe hypophosphataemia with peripheral oedema and confusion. Feeding was reduced, phosphate and thiamine were replaced, and he recovered fully over ten days. At six-month review he had regained 11 kg on a gluten-free diet with normal biochemistry. The case illustrates that the risk of refeeding syndrome is determined by the duration of undernutrition rather than by body mass index alone.',
      keywords: ['refeeding syndrome', 'coeliac disease', 'hypophosphataemia', 'case report', 'nutritional rehabilitation'],
      type: 'CASE_REPORT',
      authors: [
        { name: 'Vikram Sethi', aff: 'Department of Clinical Nutrition', country: 'India', corresponding: true },
      ],
      pageStart: 48,
      pageEnd: 55,
      doiSuffix: 'jcrhn.2026.004',
      received: '2025-11-11',
      accepted: '2026-02-05',
      published: '2026-03-15',
    },
    {
      title: 'Reporting standards in nutrition research: why we are asking authors for more',
      abstract:
        'This editorial sets out the journal’s position on reporting standards and explains the checklists we will require from the next issue onwards. We discuss the persistent under-reporting of dietary assessment methods and randomisation procedures in the nutrition literature, the consequences for evidence synthesis, and the practical steps authors can take before submission.',
      keywords: ['editorial', 'reporting standards', 'CONSORT', 'research integrity'],
      type: 'EDITORIAL',
      authors: [
        { name: 'Ashok Varghese', aff: 'Editor-in-Chief, Journal for Contemporary Research in Health and Nutrition', country: 'India', corresponding: true },
      ],
      pageStart: 56,
      pageEnd: 58,
      doiSuffix: 'jcrhn.2026.005',
      received: '2026-01-05',
      accepted: '2026-01-30',
      published: '2026-03-15',
    },
  ]

  const healthIssue1Articles: SeedArticle[] = [
    {
      title:
        'Prevalence of stunting and its household determinants among children under five in central India: a cross-sectional survey',
      abstract:
        'Stunting remains the most common form of undernutrition among Indian children under five, and district-level determinants are needed to target interventions. We surveyed 1,842 children aged 6 to 59 months across 24 randomly selected villages using WHO growth standards. Overall stunting prevalence was 33.7%, with severe stunting in 11.4%. Maternal education below secondary level, household food insecurity, absence of a toilet, and birth interval under 24 months were all independently associated with stunting after adjustment. Children in households receiving supplementary nutrition through an anganwadi centre had significantly lower odds of stunting. The findings indicate that water and sanitation and maternal education are as consequential as food intake in this population.',
      keywords: ['stunting', 'child undernutrition', 'prevalence', 'social determinants', 'India'],
      type: 'RESEARCH',
      authors: [
        { name: 'Neha Agarwal', aff: 'Department of Community Nutrition', country: 'India', corresponding: true },
        { name: 'Suresh Patil', aff: 'Department of Public Health', country: 'India' },
      ],
      pageStart: 61,
      pageEnd: 74,
      doiSuffix: 'jcrhn.2025.011',
      received: '2025-03-19',
      accepted: '2025-08-02',
      published: '2025-09-20',
    },
    {
      title:
        'Effect of a structured dietary counselling programme on glycaemic control in newly diagnosed type 2 diabetes: a randomised trial',
      abstract:
        'Dietary counselling is a cornerstone of type 2 diabetes management, but the intensity required to change outcomes is unclear in primary care settings. In this randomised trial, 164 adults with newly diagnosed type 2 diabetes received either structured counselling delivered by a dietitian over six sessions or standard advice at the point of diagnosis. HbA1c, weight and waist circumference were recorded at baseline, three and six months. The structured arm achieved a significantly greater reduction in HbA1c at three months, and the difference was sustained at six months, alongside a modest weight reduction. Attendance at all six sessions was the strongest predictor of response. Structured counselling delivered in primary care produced clinically meaningful improvements without medication escalation.',
      keywords: ['type 2 diabetes', 'dietary counselling', 'glycaemic control', 'randomised trial', 'primary care'],
      type: 'RESEARCH',
      authors: [
        { name: 'Imran Qureshi', aff: 'Department of Clinical Nutrition and Dietetics', country: 'India', corresponding: true, orcid: '0000-0003-4412-8890' },
        { name: 'Kavita Rao', aff: 'Department of Clinical Nutrition and Dietetics', country: 'India' },
        { name: 'Deepak Chandra', aff: 'Department of Endocrinology', country: 'India' },
      ],
      pageStart: 75,
      pageEnd: 88,
      doiSuffix: 'jcrhn.2025.012',
      received: '2025-02-27',
      accepted: '2025-07-30',
      published: '2025-09-20',
    },
    {
      title: 'Food fortification programmes in South Asia: current evidence and practical limits',
      abstract:
        'Large-scale food fortification has moved rapidly from pilot projects into national policy across South Asia. This review surveys current programmes covering salt, wheat flour, edible oil, milk and rice, and examines the evidence for each. We give particular attention to the practical constraints that determine whether a programme delivers: premix supply and cost, quality assurance at small and medium mills, the share of the target population reached through informal supply chains, and the regulatory capacity required for enforcement. We conclude that the principal barrier to impact is no longer technical feasibility but monitoring capacity and coverage of the informal sector, where the most nutritionally vulnerable households buy most of their food.',
      keywords: ['food fortification', 'micronutrients', 'South Asia', 'public health policy', 'review'],
      type: 'REVIEW',
      authors: [
        { name: 'Ravi Shankar', aff: 'Department of Food Science and Nutrition', country: 'India', corresponding: true },
        { name: 'Elena Fischer', aff: 'Department of Nutritional Sciences, University Hospital', country: 'Germany' },
      ],
      pageStart: 89,
      pageEnd: 106,
      doiSuffix: 'jcrhn.2025.013',
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

  await createArticles(health.id, healthIssue2.id, health.doiPrefix!, healthIssue2Articles)
  await createArticles(health.id, healthIssue1.id, health.doiPrefix!, healthIssue1Articles)
  await createArticles(humanities.id, humIssue.id, humanities.doiPrefix!, humanitiesArticles)

  // -------------------------------------------------------------------------
  // Editorial boards
  // -------------------------------------------------------------------------
  console.log('Creating editorial boards…')

  const healthBoard: [string, Designation, string, string][] = [
    ['Ashok Varghese', 'EDITOR_IN_CHIEF', 'Institute of Health Sciences', 'India'],
    ['Helena Marsh', 'ASSOCIATE_EDITOR', 'School of Food Science and Nutrition, University of Leeds', 'United Kingdom'],
    ['Priya Ramaswamy', 'SECTION_EDITOR', 'Department of Community Nutrition, Institute of Health Sciences', 'India'],
    ['Imran Qureshi', 'SECTION_EDITOR', 'Department of Clinical Nutrition and Dietetics', 'India'],
    ['Lakshmi Iyer', 'SECTION_EDITOR', 'Department of Public Health Nutrition', 'India'],
    ['Ravi Shankar', 'SECTION_EDITOR', 'Department of Food Science and Nutrition', 'India'],
    ['Chen Wei', 'BOARD_MEMBER', 'School of Public Health, Peking University', 'China'],
    ['Maria Santos', 'BOARD_MEMBER', 'Faculty of Public Health, University of São Paulo', 'Brazil'],
    ['Deepak Chandra', 'MANAGING_EDITOR', 'The Seventhsky Publishers', 'India'],
  ]

  const humBoard: [string, Designation, string, string][] = [
    ['Sunita Kaul', 'EDITOR_IN_CHIEF', 'Department of History, Central University', 'India'],
    ['Ananya Bhattacharya', 'ASSOCIATE_EDITOR', 'Department of History, Central University', 'India'],
    ['Gopal Subramanian', 'SECTION_EDITOR', 'Department of Philosophy, University College', 'India'],
    ['Thomas Abraham', 'SECTION_EDITOR', 'Department of Sociology, School of Social Sciences', 'India'],
    ['Amara Okonkwo', 'BOARD_MEMBER', 'Department of Literature, University of Ibadan', 'Nigeria'],
    ['James Whitfield', 'BOARD_MEMBER', 'School of Anthropology, University of Edinburgh', 'United Kingdom'],
  ]

  for (const [i, [fullName, designation, affiliation, country]] of healthBoard.entries()) {
    await db.editorialMember.create({
      data: { journalId: health.id, fullName, designation, affiliation, country, sortOrder: i },
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
      body: `<p>The Seventhsky Publishers follows the Core Practices of the Committee on Publication Ethics (COPE). This statement applies to every journal we publish and to every party involved in the act of publishing: authors, editors, reviewers and the publisher.</p>
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
      body: `<p>All journals published by The Seventhsky Publishers are fully open access. Every article is freely available to read, download and reuse from the moment of publication. There is no subscription, no embargo and no paywall.</p>
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
<p>A complete submission consists of the anonymised manuscript, a separate title page, a cover letter, and the signed copyright form. All figures and tables must be placed within the manuscript document. The cover letter and the copyright form are both required. Reporting checklists are required for trials, systematic reviews and observational studies.</p>`,
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

  for (const p of journalPageTemplates(health)) await db.page.create({ data: p })
  for (const p of journalPageTemplates(humanities)) await db.page.create({ data: p })

  // -------------------------------------------------------------------------
  // Announcements, sample submissions, reviewers
  // -------------------------------------------------------------------------
  console.log('Creating announcements and sample submissions…')

  await db.announcement.create({
    data: {
      title: 'Call for papers: special issue on nutrition in the first 1000 days',
      journalId: health.id,
      body: 'The Journal for Contemporary Research in Health and Nutrition invites submissions for a special issue examining nutrition interventions during pregnancy and the first two years of life. We are particularly interested in implementation studies and in trials that report where interventions did not work. Deadline for submissions: 30 November 2026.',
      publishedAt: new Date('2026-07-01'),
    },
  })

  await db.announcement.create({
    data: {
      title: 'Journal for Contemporary Research in Humanities and Social Perspective publishes its inaugural issue',
      journalId: humanities.id,
      body: 'We are pleased to announce the publication of the first issue of the Journal for Contemporary Research in Humanities and Social Perspective, comprising three research articles and an opening editorial. The journal is now open for submissions for Volume 1, Issue 2.',
      publishedAt: new Date('2026-06-30'),
    },
  })

  const reviewers = [
    { fullName: 'Nandini Raghavan', email: 'n.raghavan@example.test', affiliation: 'Department of Nutritional Biochemistry', country: 'India', expertise: ['Nutritional Biochemistry', 'Micronutrients'] },
    { fullName: 'Peter Lindqvist', email: 'p.lindqvist@example.test', affiliation: 'Department of Food Science and Nutrition, Malmö University', country: 'Sweden', expertise: ['Public Health Nutrition', 'Dietary Assessment'] },
    { fullName: 'Sarah Mensah', email: 's.mensah@example.test', affiliation: 'School of Social Sciences, University of Ghana', country: 'Ghana', expertise: ['Sociology', 'Qualitative Methods'] },
  ]
  for (const r of reviewers) await db.reviewer.create({ data: r })

  await db.submission.create({
    data: {
      trackingId: 'JCRHN-2026-0041',
      journalId: health.id,
      manuscriptTitle:
        'Vitamin D supplementation intervals in adolescents with low sun exposure: a pragmatic cluster trial',
      abstract:
        'A pragmatic cluster-randomised trial comparing six-monthly and three-monthly vitamin D supplementation in adolescents with low sun exposure across eighteen schools.',
      keywords: ['vitamin D', 'supplementation', 'adolescents', 'cluster trial'],
      articleType: 'RESEARCH',
      correspondingAuthorName: 'Rohit Malhotra',
      correspondingAuthorEmail: 'r.malhotra@example.test',
      correspondingAffiliation: 'Department of Public Health Nutrition',
      declarationAccepted: true,
      status: 'UNDER_REVIEW',
      internalNotes: 'Two reviewers invited on 12 July. One accepted, awaiting second response.',
      submittedAt: new Date('2026-07-08'),
    },
  })

  await db.submission.create({
    data: {
      trackingId: 'JCRHSP-2026-0012',
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
