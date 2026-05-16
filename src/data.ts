/* ============================================================================
 * BOLDR CUSTOMER INTELLIGENCE ENGINE — SEED DATA
 * Echelon 2026 · Boldr Challenge
 *
 * Drop this in as src/data.ts. It is the single source of truth for the app.
 * Tell Lovable: "Use src/data.ts for ALL content. Do not invent tickets,
 * specs, prices, or KB entries. Do not fetch anything live."
 *
 * RENDERING RULES (these fix the bugs in the current build):
 *  1. Render exactly ONE status badge per ticket — the `status` field.
 *     `isKnowledgeGap` and `requiresEscalation` are ATTRIBUTES, shown only
 *     inside the detail / AI panel — never as competing list pills.
 *  2. `classifyConfidence` = confidence in the lane + persona CLASSIFICATION.
 *     It is NOT confidence in an answer. A knowledge gap can have high
 *     classifyConfidence (the system is sure it's a gap).
 *  3. `kbMatchScore` only exists when `answeredByKb` is true. If a ticket is
 *     a knowledge gap, there is NO match score — show the red gap state.
 *  4. Every drafted reply / KB answer must trace to specs in this file.
 *     The watches use Miyota 9015 (Expedition) and 6T33 (Journey). Never 9039.
 *  5. Engraving 21–40 chars = SGD 40 everywhere (see kbConflicts — resolved).
 * ========================================================================== */

export type LaneNew =
  | 'Knowledge gap'
  | 'Servicing'
  | 'Product general'
  | 'Materials & safety'
  | 'Strap compatibility'
  | 'Order status'
  | 'Engraving';

export type Persona =
  | 'Health-Conscious Buyer'
  | 'Gifter'
  | 'Enthusiast / Collector'
  | 'Active / Outdoor Buyer'
  | 'Sustainability Advocate'
  | '—'; // null bucket — transactional / ops, no marketing signal

export type TicketStatusNew = 'Resolved' | 'Pending reply' | 'In triage' | 'Escalated';
export type ChannelNew = 'Email' | 'Chat' | 'Instagram DM' | 'WhatsApp';
export type KbStatus = 'Live' | 'Pending approval' | 'Auto-drafted';
export type Verdict = 'Boldr-Specific Gap' | 'Market-Wide Opportunity';

export interface TicketNew {
  id: string;
  date: string;
  customer: string;
  email: string;
  orderId?: string;
  channel: Channel;
  lane: Lane;
  subject: string;
  body: string;
  status: TicketStatus;
  persona: Persona;
  answeredByKb: boolean;
  isKnowledgeGap: boolean;
  requiresEscalation: boolean;
  classifyConfidence: number;   // 0-100, confidence in lane+persona
  kbMatch?: string;             // KB entry id — only if answeredByKb
  kbMatchScore?: number;        // similarity % — only if answeredByKb
  routedTo?: string;            // escalation / gap routing target
  draftedReply?: string;        // present on flagship answerable tickets
  autoKbEntry?: string;         // KB entry id auto-drafted from a resolved gap
}

export interface KbEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  source: string;
  status: KbStatus;
  provenance: string;
  createdDate: string;
}

export interface KbConflict {
  id: string;
  topic: string;
  category: string;
  sources: { doc: string; value: string; dated: string }[];
  recommendedValue: string;
  resolutionLogic: string;
  status: 'Resolved' | 'Flagged';
  affectedKbEntry: string;
}

export interface ThemeNew {
  id: string;
  name: string;
  internalTickets: number;
  externalMentions: number;
  externalSentiment: string;
  verdict: Verdict;
  recommendedAction: string;
  insight: string;
}

export interface ExternalMention {
  source: string;
  handle: string;
  snippet: string;
  theme: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface ExternalSourceNew {
  id: number;
  name: string;
  justification: string;
  mentions: ExternalMention[];
}

/* ----------------------------------------------------------------------------
 * PRODUCT REFERENCE — the 3 models. Correct specs. Use these, never invent.
 * -------------------------------------------------------------------------- */

export const watches = [
  {
    name: 'Expedition Titanium',
    sku: 'BLD-EXP-TI-40',
    priceSgd: 485,
    case: '40mm, Grade 5 Titanium (Ti-6Al-4V), brushed + polished',
    movement: 'Miyota 9015 automatic, 42hr power reserve, +/-10 sec/day',
    waterResistance: '100m (10ATM) — safe for swimming, not diving',
    lume: 'Super-LumiNova C3, non-radioactive, ISO 3157',
    weight: '68g (no strap)',
    lugWidth: '20mm',
    warranty: '2 years on movement',
    availability: 'In stock',
  },
  {
    name: 'Journey Titanium',
    sku: 'BLD-JRN-TI-38',
    priceSgd: 395,
    case: '38mm, Grade 2 Titanium (commercially pure), full brushed',
    movement: 'Miyota 6T33 automatic, 40hr power reserve, +/-15 sec/day',
    waterResistance: '50m (5ATM) — splash resistant, not for swimming',
    lume: 'Super-LumiNova BGW9, non-radioactive, ISO 3157',
    weight: '58g (no strap)',
    lugWidth: '20mm',
    warranty: '2 years on movement',
    availability: 'In stock',
  },
  {
    name: 'Expedition Titanium — Ember Limited Edition',
    sku: 'BLD-EXP-TI-40-LE',
    priceSgd: 595,
    case: '40mm, Grade 5 Titanium with PVD bronze coating, brushed',
    movement: 'Miyota 9015 automatic, 42hr power reserve',
    waterResistance: '100m (10ATM)',
    lume: 'Super-LumiNova C3',
    weight: '—',
    lugWidth: '20mm',
    warranty: '2 years on movement',
    availability: 'Sold out — waitlist at boldr.co/waitlist',
  },
];

export const straps = [
  { sku: 'STR-FKM-20-BLK', type: 'FKM Rubber', colour: 'Black', priceSgd: 35, bpaFree: true, fits: 'All models' },
  { sku: 'STR-FKM-20-NVY', type: 'FKM Rubber', colour: 'Navy', priceSgd: 35, bpaFree: true, fits: 'All models' },
  { sku: 'STR-FKM-20-OLV', type: 'FKM Rubber', colour: 'Olive', priceSgd: 35, bpaFree: true, fits: 'All models' },
  { sku: 'STR-FKM-20-RED', type: 'FKM Rubber', colour: 'Red', priceSgd: 35, bpaFree: true, fits: 'All models' },
  { sku: 'STR-NATO-20-OLV', type: 'Nylon NATO', colour: 'Olive', priceSgd: 25, bpaFree: true, fits: 'All models' },
  { sku: 'STR-NATO-20-BLK', type: 'Nylon NATO', colour: 'Black', priceSgd: 25, bpaFree: true, fits: 'All models' },
  { sku: 'STR-NATO-20-TAN', type: 'Nylon NATO', colour: 'Tan', priceSgd: 25, bpaFree: true, fits: 'All models' },
  { sku: 'STR-LTH-20-BRN', type: 'Leather', colour: 'Brown', priceSgd: 55, bpaFree: true, fits: 'All models' },
  { sku: 'STR-LTH-20-BLK', type: 'Leather', colour: 'Black', priceSgd: 55, bpaFree: true, fits: 'All models' },
  { sku: 'STR-MESH-20-SLV', type: 'Mesh Bracelet', colour: 'Silver', priceSgd: 75, bpaFree: true, fits: 'Journey only' },
  { sku: 'STR-TI-20', type: 'Titanium Bracelet', colour: 'Titanium', priceSgd: 145, bpaFree: true, fits: 'Expedition only' },
];

/* ----------------------------------------------------------------------------
 * THE 5 PERSONAS — the only marketing taxonomy. `—` is the null bucket.
 * -------------------------------------------------------------------------- */

export const personas = [
  {
    name: 'Health-Conscious Buyer',
    triggers: 'BPA-free, nickel, hypoallergenic, EU REACH, safe for kids, sensitive skin, lume safety',
    marketingAction: '"BPA-Free Straps" product badge',
  },
  {
    name: 'Gifter',
    triggers: 'engraving, gift wrap, personalise, birthday, anniversary, wedding, dedication, corporate gifts',
    marketingAction: 'Seasonal campaigns — Valentine\'s, Father\'s Day; gift bundles',
  },
  {
    name: 'Enthusiast / Collector',
    triggers: 'titanium grade, Miyota movement, limited edition, resale value, strap specs, servicing',
    marketingAction: 'Collector content — specs & craftsmanship storytelling',
  },
  {
    name: 'Active / Outdoor Buyer',
    triggers: 'water resistance, swimming, diving, trail running, climbing, altitude, shock, FKM strap',
    marketingAction: 'Adventure-lifestyle content segment',
  },
  {
    name: 'Sustainability Advocate',
    triggers: 'vegan, recycling, take-back, carbon-neutral, offset, eco packaging, environmental practices',
    marketingAction: 'New vegan-strap angle + carbon-neutral shipping option',
  },
];

/* ----------------------------------------------------------------------------
 * TICKETS — all 70, re-classified to the 5+null persona model.
 * Order-status / generic pre-purchase tickets are persona '—' by design.
 * -------------------------------------------------------------------------- */

export const ticketsNew: TicketNew[] = [
  {
    id: 'TKT-1046', date: '2025-11-15', customer: 'Lily Shah', email: 'lily_shah@gmail.com',
    channel: 'Chat', lane: 'Knowledge gap', subject: 'Magnetic field resistance',
    body: 'Is the movement resistant to magnetic fields? I work near MRI equipment.',
    status: 'Resolved', persona: 'Health-Conscious Buyer',
    answeredByKb: false, isKnowledgeGap: true, requiresEscalation: true,
    classifyConfidence: 93, routedTo: 'service@boldr.co', autoKbEntry: 'KB-037',
  },
  {
    id: 'TKT-1010', date: '2025-11-19', customer: 'Oliver Gupta', email: 'oliver.gupta@icloud.com',
    channel: 'Email', lane: 'Servicing', subject: 'Servicing older model',
    body: 'I have a Boldr Expedition from 2019. Do you still service older models? Is it the same price?',
    status: 'Pending reply', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 90, kbMatch: 'KB-026', kbMatchScore: 82,
  },
  {
    id: 'TKT-1068', date: '2025-11-22', customer: 'Caleb Harris', email: 'caleb.harris@protonmail.com',
    channel: 'Chat', lane: 'Product general', subject: 'Price match',
    body: 'I found the same watch cheaper on another site. Do you offer price matching?',
    status: 'In triage', persona: '—',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 88, kbMatch: 'KB-033', kbMatchScore: 80,
  },
  {
    id: 'TKT-1016', date: '2025-11-23', customer: 'Liam Jones', email: 'liam.jones@yahoo.com',
    channel: 'Instagram DM', lane: 'Materials & safety', subject: 'Strap dye safety',
    body: 'Are the dyes used in the coloured straps non-toxic? I sweat a lot and don\'t want dye bleeding onto my skin.',
    status: 'In triage', persona: 'Health-Conscious Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 91, kbMatch: 'KB-001', kbMatchScore: 84,
  },
  {
    id: 'TKT-1035', date: '2025-11-28', customer: 'Alexander Thompson', email: 'alexander74@hotmail.com',
    channel: 'Email', lane: 'Strap compatibility', subject: 'Rubber strap for swimming',
    body: 'I want to use the watch for swimming. Do you sell a rubber or silicone strap that\'s suitable?',
    status: 'Escalated', persona: 'Active / Outdoor Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 95, kbMatch: 'KB-020', kbMatchScore: 94, routedTo: 'cs@boldr.co',
    draftedReply: 'Hi Alexander, thanks for reaching out! For swimming, the FKM rubber strap is the best choice — it is waterproof, quick-drying and salt-resistant. It fits both the Expedition and Journey (20mm), and is available in black, navy, olive and red at SGD 35. Just note the Expedition is rated to 100m and is the better pick for regular water use.',
  },
  {
    id: 'TKT-1002', date: '2025-11-29', customer: 'Luke Moore', email: 'lukem@protonmail.com', orderId: 'BLD-52504',
    channel: 'Chat', lane: 'Order status', subject: 'Express shipping option',
    body: 'I need the watch urgently as a birthday gift. Do you offer express shipping and how much does it cost?',
    status: 'Resolved', persona: '—',
    answeredByKb: false, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 89, routedTo: 'admin.shopify.com',
  },
  {
    id: 'TKT-1006', date: '2025-12-01', customer: 'Logan Taylor', email: 'logant@protonmail.com',
    channel: 'WhatsApp', lane: 'Servicing', subject: 'Water resistance re-testing after service',
    body: 'After a full service, do you re-test the water resistance? I use the watch for diving.',
    status: 'Resolved', persona: 'Active / Outdoor Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 90, kbMatch: 'KB-024', kbMatchScore: 88,
  },
  {
    id: 'TKT-1030', date: '2025-12-03', customer: 'Victoria Wong', email: 'victoria_wong@outlook.com',
    channel: 'Email', lane: 'Product general', subject: 'Limited edition availability',
    body: 'I saw a limited edition collab on your Instagram. Is it still available or sold out?',
    status: 'Pending reply', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 92, kbMatch: 'KB-035', kbMatchScore: 86,
  },
  {
    id: 'TKT-1021', date: '2025-12-04', customer: 'Harper Teo', email: 'harper_teo@outlook.com',
    channel: 'WhatsApp', lane: 'Knowledge gap', subject: 'Luminous material safety',
    body: 'What luminous material do you use on the dial? Is it Super-LumiNova? Is it safe?',
    status: 'Pending reply', persona: 'Health-Conscious Buyer',
    answeredByKb: false, isKnowledgeGap: true, requiresEscalation: true,
    classifyConfidence: 90, routedTo: 'cs@boldr.co', autoKbEntry: 'KB-005',
  },
  {
    id: 'TKT-1037', date: '2025-12-04', customer: 'Oliver Ong', email: 'oliver80@icloud.com',
    channel: 'Chat', lane: 'Strap compatibility', subject: 'Strap length for large wrist',
    body: 'I have a 20cm wrist. Will the standard strap length fit me, or do I need an extended strap?',
    status: 'In triage', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 85, kbMatch: 'KB-016', kbMatchScore: 81,
  },
  {
    id: 'TKT-1011', date: '2025-12-05', customer: 'Dylan Allen', email: 'dylan.allen@yahoo.com',
    channel: 'Email', lane: 'Strap compatibility', subject: 'Interchangeable strap between models',
    body: 'I own both the Expedition and the Journey. Can I swap straps between the two models?',
    status: 'Resolved', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 96, kbMatch: 'KB-019', kbMatchScore: 95,
  },
  {
    id: 'TKT-1005', date: '2025-12-08', customer: 'Xin Joshi', email: 'xin_joshi@yahoo.com', orderId: 'BLD-28131',
    channel: 'Email', lane: 'Order status', subject: 'Customs duties — who pays?',
    body: 'I\'m ordering from the UK. Will I have to pay customs duties on top of the shipping cost?',
    status: 'Resolved', persona: '—',
    answeredByKb: false, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 92, kbMatch: 'KB-030', kbMatchScore: 87, answeredByKbNote: undefined as never,
  } as Ticket,
  {
    id: 'TKT-1007', date: '2025-12-14', customer: 'Luke Nair', email: 'luke_nair@icloud.com', orderId: 'BLD-11504',
    channel: 'Instagram DM', lane: 'Order status', subject: 'Discount code not working',
    body: 'I\'m trying to apply discount code BOLDR10 at checkout but it says it\'s invalid. Can you help?',
    status: 'Resolved', persona: '—',
    answeredByKb: false, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 90, routedTo: 'admin.shopify.com',
  },
  {
    id: 'TKT-1047', date: '2025-12-16', customer: 'Dylan Teo', email: 'dylan_teo@icloud.com',
    channel: 'Instagram DM', lane: 'Engraving', subject: 'Engraving on watch caseback',
    body: 'Hi, I\'d like to get the caseback engraved as a gift. How many characters can I fit and what\'s the cost?',
    status: 'Pending reply', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 96, kbMatch: 'KB-010', kbMatchScore: 93,
    draftedReply: 'Hi Dylan, thanks for reaching out — happy to help! Caseback engraving fits up to 60 characters total. Pricing for Latin script is SGD 25 for up to 20 characters, SGD 40 for 21-40, then SGD 1.50 per character beyond that. Engraving adds 2-3 business days to processing. Do double-check your spelling before confirming, as engraved items can\'t be returned unless there\'s a defect.',
  },
  {
    id: 'TKT-1033', date: '2025-12-19', customer: 'Kavya Smith', email: 'kavya_smith@protonmail.com',
    channel: 'Instagram DM', lane: 'Engraving', subject: 'Multi-line engraving',
    body: 'I want two lines of text engraved. Is that possible and does it cost extra?',
    status: 'In triage', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 94, kbMatch: 'KB-015', kbMatchScore: 90,
  },
  {
    id: 'TKT-1065', date: '2025-12-19', customer: 'Aditya Johnson', email: 'aditya.johnson@gmail.com',
    channel: 'WhatsApp', lane: 'Knowledge gap', subject: 'Altitude performance',
    body: 'I\'m going on a high-altitude trek. Will the watch perform normally at 5,000m above sea level?',
    status: 'Resolved', persona: 'Active / Outdoor Buyer',
    answeredByKb: false, isKnowledgeGap: true, requiresEscalation: true,
    classifyConfidence: 88, routedTo: 'cs@boldr.co',
  },
  {
    id: 'TKT-1009', date: '2025-12-24', customer: 'Vikram Miller', email: 'vikram_miller@protonmail.com', orderId: 'BLD-76540',
    channel: 'Instagram DM', lane: 'Order status', subject: 'Where is my order?',
    body: 'Hi, I placed order BLD-93810 about 10 days ago and haven\'t received it yet. Can you check the status?',
    status: 'Resolved', persona: '—',
    answeredByKb: false, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 93, routedTo: 'admin.shopify.com',
  },
  {
    id: 'TKT-1001', date: '2025-12-26', customer: 'Jack Jones', email: 'jackj@icloud.com',
    channel: 'WhatsApp', lane: 'Servicing', subject: 'Servicing turnaround time',
    body: 'How long does a full service take? I\'m going on holiday in 6 weeks and want the watch back before then.',
    status: 'Resolved', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 91, kbMatch: 'KB-024', kbMatchScore: 89,
  },
  {
    id: 'TKT-1023', date: '2025-12-27', customer: 'Jing Sharma', email: 'jings@outlook.com',
    channel: 'WhatsApp', lane: 'Strap compatibility', subject: 'Strap width for Expedition 40mm',
    body: 'Hi, what lug width does the Expedition 40mm use? I want to buy a third-party strap.',
    status: 'Escalated', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 95, kbMatch: 'KB-016', kbMatchScore: 96, routedTo: 'cs@boldr.co',
  },
  {
    id: 'TKT-1051', date: '2025-12-28', customer: 'Ling Ong', email: 'lingo@icloud.com',
    channel: 'Email', lane: 'Strap compatibility', subject: 'Strap for sensitive skin',
    body: 'My skin reacts to most watch straps. Which of your straps would you recommend for sensitive skin?',
    status: 'Resolved', persona: 'Health-Conscious Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 89, kbMatch: 'KB-022', kbMatchScore: 90,
  },
  {
    id: 'TKT-1049', date: '2025-12-29', customer: 'Henry Koh', email: 'henry95@protonmail.com',
    channel: 'Instagram DM', lane: 'Engraving', subject: 'Engraving in Chinese characters',
    body: 'Can you engrave Chinese characters? I want to put my parents\' names in Mandarin.',
    status: 'Resolved', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 93, kbMatch: 'KB-009', kbMatchScore: 91,
  },
  {
    id: 'TKT-1034', date: '2026-01-07', customer: 'Logan Miller', email: 'loganm@hotmail.com',
    channel: 'Instagram DM', lane: 'Product general', subject: 'Warranty period',
    body: 'What is the warranty period on the watch? Does it cover the movement and the strap separately?',
    status: 'Pending reply', persona: '—',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 90, kbMatch: 'KB-033', kbMatchScore: 92,
  },
  {
    id: 'TKT-1060', date: '2026-01-08', customer: 'Harper Taylor', email: 'harper39@protonmail.com',
    channel: 'Email', lane: 'Materials & safety', subject: 'Titanium grade on the Expedition model',
    body: 'Hello, could you tell me what grade of titanium is used in the case? I\'ve seen Grade 2 and Grade 5 mentioned online and want to know which one Boldr uses.',
    status: 'In triage', persona: 'Health-Conscious Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 92, kbMatch: 'KB-002', kbMatchScore: 95,
  },
  {
    id: 'TKT-1015', date: '2026-01-12', customer: 'Scarlett Harris', email: 'scarlett_harris@gmail.com',
    channel: 'Chat', lane: 'Product general', subject: 'Gift wrapping',
    body: 'Do you offer gift wrapping or a gift box option? I\'m buying this as a wedding gift.',
    status: 'Resolved', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 91, kbMatch: 'KB-034', kbMatchScore: 93,
  },
  {
    id: 'TKT-1022', date: '2026-01-14', customer: 'James Brown', email: 'james.brown@gmail.com',
    channel: 'Chat', lane: 'Engraving', subject: 'Engraving depth and visibility',
    body: 'How deep is the engraving? I want to make sure it\'s visible and won\'t fade over time.',
    status: 'Escalated', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 86, kbMatch: 'KB-009', kbMatchScore: 79, routedTo: 'cs@boldr.co',
  },
  {
    id: 'TKT-1052', date: '2026-01-14', customer: 'Owen Patel', email: 'owen_patel@gmail.com',
    channel: 'Instagram DM', lane: 'Knowledge gap', subject: 'Resale value of titanium watches',
    body: 'How well do Boldr watches hold their resale value compared to other micro-brands?',
    status: 'Resolved', persona: 'Enthusiast / Collector',
    answeredByKb: false, isKnowledgeGap: true, requiresEscalation: true,
    classifyConfidence: 87, routedTo: 'cs@boldr.co',
  },
  {
    id: 'TKT-1058', date: '2026-01-15', customer: 'Victoria Martin', email: 'victoria_martin@icloud.com',
    channel: 'Instagram DM', lane: 'Engraving', subject: 'Engraving turnaround time',
    body: 'If I order today with engraving, how long will it take to ship? I need it by next Friday.',
    status: 'Resolved', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 93, kbMatch: 'KB-012', kbMatchScore: 92,
  },
  {
    id: 'TKT-1004', date: '2026-01-17', customer: 'Mila Sharma', email: 'mila60@yahoo.com',
    channel: 'Instagram DM', lane: 'Servicing', subject: 'Battery replacement cost',
    body: 'Hi, my watch battery has died. How much does a battery replacement cost and how do I send it in?',
    status: 'Pending reply', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 92, kbMatch: 'KB-023', kbMatchScore: 94,
    draftedReply: 'Hi Mila, thanks for reaching out! A battery replacement is SGD 35 with a 3-5 business day turnaround, and includes a basic water-resistance test and function check. To send it in, pack the watch securely and ship it to our Singapore service centre (address provided at checkout) — we recommend insured shipping. Let us know if you\'d like the service-centre details sent over.',
  },
  {
    id: 'TKT-1008', date: '2026-01-21', customer: 'Riley Davis', email: 'riley47@yahoo.com',
    channel: 'Chat', lane: 'Engraving', subject: 'Engraving on strap',
    body: 'Can the strap buckle be engraved as well, or only the watch caseback?',
    status: 'Resolved', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 94, kbMatch: 'KB-014', kbMatchScore: 91,
  },
  {
    id: 'TKT-1044', date: '2026-01-21', customer: 'Olivia Davis', email: 'oliviad@icloud.com',
    channel: 'Email', lane: 'Strap compatibility', subject: 'NATO strap compatibility',
    body: 'Does the Expedition work with standard NATO straps? What size do I need?',
    status: 'Escalated', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 95, kbMatch: 'KB-018', kbMatchScore: 95, routedTo: 'cs@boldr.co',
  },
  {
    id: 'TKT-1048', date: '2026-01-29', customer: 'Vikram Allen', email: 'vikram95@hotmail.com',
    channel: 'Chat', lane: 'Materials & safety', subject: 'Is the watch strap BPA-free?',
    body: 'Hi, I\'m buying this for my young daughter and want to make sure the strap is BPA-free. Can you confirm?',
    status: 'Resolved', persona: 'Health-Conscious Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 97, kbMatch: 'KB-001', kbMatchScore: 96,
    draftedReply: 'Hi Vikram, thanks for reaching out — happy to confirm! All Boldr FKM rubber and nylon NATO straps are 100% BPA-free and nickel-free. For a child, the FKM rubber strap is a great pick: it is BPA-free, non-toxic and easy to clean. The titanium case is also hypoallergenic. Just note our watches are designed for adults, so we\'d recommend adult supervision.',
  },
  {
    id: 'TKT-1062', date: '2026-01-30', customer: 'Noah Shah', email: 'noah58@gmail.com',
    channel: 'WhatsApp', lane: 'Servicing', subject: 'Regulation service',
    body: 'My watch is losing about 10 seconds per day. Would a regulation service fix this?',
    status: 'Escalated', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 89, kbMatch: 'KB-025', kbMatchScore: 87, routedTo: 'service@boldr.co',
  },
  {
    id: 'TKT-1038', date: '2026-02-01', customer: 'Sneha Williams', email: 'snehaw@outlook.com',
    channel: 'Instagram DM', lane: 'Materials & safety', subject: 'Silicone strap material',
    body: 'Is the silicone strap food-grade or medical-grade silicone? Asking because my skin is sensitive.',
    status: 'In triage', persona: 'Health-Conscious Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 88, kbMatch: 'KB-001', kbMatchScore: 82,
  },
  {
    id: 'TKT-1029', date: '2026-02-03', customer: 'Hui Joshi', email: 'hui_joshi@hotmail.com', orderId: 'BLD-36772',
    channel: 'Chat', lane: 'Order status', subject: 'Wrong item received',
    body: 'I received my order BLD-46048 but the strap colour is wrong — I ordered olive green but received black.',
    status: 'Resolved', persona: '—',
    answeredByKb: false, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 94, routedTo: 'cs@boldr.co',
  },
  {
    id: 'TKT-1066', date: '2026-02-06', customer: 'Emily Brown', email: 'emily43@hotmail.com',
    channel: 'Instagram DM', lane: 'Materials & safety', subject: 'Is the watch safe for kids?',
    body: 'I want to gift this to my 10-year-old nephew. Are the materials safe for children? Any certifications?',
    status: 'Pending reply', persona: 'Health-Conscious Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 93, kbMatch: 'KB-003', kbMatchScore: 92,
  },
  {
    id: 'TKT-1040', date: '2026-02-08', customer: 'Evelyn Martin', email: 'evelynm@outlook.com', orderId: 'BLD-13248',
    channel: 'WhatsApp', lane: 'Order status', subject: 'Order not received — presumed lost',
    body: 'It\'s been 3 weeks since I placed order BLD-42098 and tracking shows it\'s stuck in customs. What do I do?',
    status: 'In triage', persona: '—',
    answeredByKb: false, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 91, kbMatch: 'KB-032', kbMatchScore: 85,
  },
  {
    id: 'TKT-1043', date: '2026-02-25', customer: 'Mei Lim', email: 'mei.lim@hotmail.com', orderId: 'BLD-56025',
    channel: 'Instagram DM', lane: 'Order status', subject: 'Refund status',
    body: 'I returned my order BLD-23434 two weeks ago. I haven\'t received my refund yet. Can you check?',
    status: 'Resolved', persona: '—',
    answeredByKb: false, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 92, routedTo: 'cs@boldr.co',
  },
  {
    id: 'TKT-1061', date: '2026-03-02', customer: 'Hui Koh', email: 'hui52@outlook.com',
    channel: 'WhatsApp', lane: 'Servicing', subject: 'Movement service vs battery',
    body: 'What\'s the difference between a movement service and just a battery replacement? Is the movement service worth it?',
    status: 'In triage', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 88, kbMatch: 'KB-024', kbMatchScore: 84,
  },
  {
    id: 'TKT-1045', date: '2026-03-06', customer: 'Charlotte Nair', email: 'charlotte_nair@protonmail.com',
    channel: 'Email', lane: 'Knowledge gap', subject: 'Watch for extreme sports',
    body: 'I do trail running and occasional rock climbing. Which model would you recommend and what\'s the shock resistance rating?',
    status: 'Resolved', persona: 'Active / Outdoor Buyer',
    answeredByKb: false, isKnowledgeGap: true, requiresEscalation: true,
    classifyConfidence: 90, routedTo: 'cs@boldr.co',
  },
  {
    id: 'TKT-1063', date: '2026-03-06', customer: 'Hui Gupta', email: 'huig@outlook.com',
    channel: 'WhatsApp', lane: 'Engraving', subject: 'Engraving price per character',
    body: 'What\'s the per-character charge for engraving? I want to engrave a 20-character message.',
    status: 'Pending reply', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 94, kbMatch: 'KB-010', kbMatchScore: 93,
  },
  {
    id: 'TKT-1032', date: '2026-03-07', customer: 'Benjamin Lee', email: 'benjaminl@hotmail.com',
    channel: 'Instagram DM', lane: 'Materials & safety', subject: 'Alloy composition of the strap',
    body: 'Hi there, I have a nickel allergy. Can you confirm whether the metal parts on the strap buckle contain any nickel?',
    status: 'Pending reply', persona: 'Health-Conscious Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 94, kbMatch: 'KB-004', kbMatchScore: 93,
    draftedReply: 'Hi Benjamin, thanks for reaching out! The FKM rubber and nylon NATO straps are completely nickel-free. The metal buckle on the leather straps is made from Grade 5 titanium, which is also nickel-free. One thing to flag: the mesh bracelet uses 316L stainless steel, which carries trace nickel as all stainless steel does — so for a nickel allergy, we\'d recommend the rubber or NATO options.',
  },
  {
    id: 'TKT-1014', date: '2026-03-10', customer: 'Penelope Wong', email: 'penelope_wong@outlook.com',
    channel: 'Email', lane: 'Knowledge gap', subject: 'Collaboration with independent watchmakers',
    body: 'Do you collaborate with independent watchmakers for limited editions? I\'m a collector and interested in unique pieces.',
    status: 'Resolved', persona: 'Enthusiast / Collector',
    answeredByKb: false, isKnowledgeGap: true, requiresEscalation: true,
    classifyConfidence: 86, routedTo: 'cs@boldr.co',
  },
  {
    id: 'TKT-1064', date: '2026-03-14', customer: 'Olivia Chan', email: 'olivia53@protonmail.com',
    channel: 'Chat', lane: 'Strap compatibility', subject: 'Strap colour options',
    body: 'What colour options are available for the 20mm rubber strap? I can only see black and navy on the website.',
    status: 'In triage', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 90, kbMatch: 'KB-020', kbMatchScore: 86,
  },
  {
    id: 'TKT-1041', date: '2026-03-15', customer: 'Scarlett Moore', email: 'scarlett.moore@outlook.com',
    channel: 'Chat', lane: 'Engraving', subject: 'Can I engrave a logo or image?',
    body: 'Is it possible to engrave a small logo or symbol on the caseback, or is it text only?',
    status: 'Resolved', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 93, kbMatch: 'KB-011', kbMatchScore: 92,
  },
  {
    id: 'TKT-1053', date: '2026-03-16', customer: 'Daniel Jackson', email: 'daniel.jackson@gmail.com',
    channel: 'Email', lane: 'Strap compatibility', subject: 'Leather strap care',
    body: 'I bought the leather strap. How should I care for it? Can it get wet?',
    status: 'Pending reply', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 91, kbMatch: 'KB-021', kbMatchScore: 93,
  },
  {
    id: 'TKT-1057', date: '2026-03-16', customer: 'Kai Iyer', email: 'kai74@icloud.com', orderId: 'BLD-68446',
    channel: 'WhatsApp', lane: 'Order status', subject: 'Change delivery address',
    body: 'I made a mistake in my delivery address for order BLD-28289. Can I update it before it ships?',
    status: 'Resolved', persona: '—',
    answeredByKb: false, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 92, routedTo: 'admin.shopify.com',
  },
  {
    id: 'TKT-1054', date: '2026-03-21', customer: 'Jun Koh', email: 'junk@protonmail.com',
    channel: 'WhatsApp', lane: 'Servicing', subject: 'Servicing warranty',
    body: 'Is there a warranty on the servicing work? What if the issue comes back after a few months?',
    status: 'Resolved', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 90, kbMatch: 'KB-028', kbMatchScore: 91,
  },
  {
    id: 'TKT-1031', date: '2026-03-24', customer: 'Jun Iyer', email: 'jun.iyer@gmail.com',
    channel: 'Instagram DM', lane: 'Strap compatibility', subject: 'Quick-release strap mechanism',
    body: 'Do your straps have a quick-release mechanism or do I need tools to swap them?',
    status: 'Resolved', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 94, kbMatch: 'KB-017', kbMatchScore: 94,
  },
  {
    id: 'TKT-1026', date: '2026-03-30', customer: 'Nathan Brown', email: 'nathan16@icloud.com',
    channel: 'Chat', lane: 'Servicing', subject: 'Full service — what\'s included?',
    body: 'What exactly is included in a full service? I\'ve had the watch for 3 years and it\'s running slightly slow.',
    status: 'Escalated', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 91, kbMatch: 'KB-024', kbMatchScore: 90, routedTo: 'service@boldr.co',
    draftedReply: 'Hi Nathan, thanks for reaching out! Our Full Service (Standard, SGD 160) covers full movement disassembly, ultrasonic cleaning, lubrication, regulation, a 100m water-resistance test, a light case polish and new gaskets. The Premium tier (SGD 220) adds a deep case polish, crystal replacement if scratched, and a 12-month service warranty. Turnaround is 14-21 days. For a 3-year-old watch running slow, a full service is a sensible choice.',
  },
  {
    id: 'TKT-1020', date: '2026-04-01', customer: 'Sophia Wong', email: 'sophia.wong@yahoo.com',
    channel: 'WhatsApp', lane: 'Engraving', subject: 'Engraving mistake — can it be corrected?',
    body: 'I submitted the wrong text for engraving. I just placed the order 10 minutes ago. Can I change it?',
    status: 'In triage', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 92, kbMatch: 'KB-013', kbMatchScore: 95,
  },
  {
    id: 'TKT-1017', date: '2026-04-02', customer: 'Isabella Patel', email: 'isabella_patel@protonmail.com',
    channel: 'Chat', lane: 'Product general', subject: 'Return policy',
    body: 'What is your return policy? Can I return the watch if it doesn\'t fit my wrist?',
    status: 'Resolved', persona: '—',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 91, kbMatch: 'KB-031', kbMatchScore: 93,
  },
  {
    id: 'TKT-1025', date: '2026-04-02', customer: 'Evelyn Jackson', email: 'evelynj@gmail.com',
    channel: 'Email', lane: 'Product general', subject: 'Difference between Expedition and Journey',
    body: 'Can you explain the main differences between the Expedition and Journey models? I can\'t decide which to buy.',
    status: 'Resolved', persona: '—',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 90, kbMatch: 'KB-035', kbMatchScore: 95,
  },
  {
    id: 'TKT-1059', date: '2026-04-02', customer: 'Kai Jones', email: 'kaij@hotmail.com',
    channel: 'Email', lane: 'Servicing', subject: 'Sending watch for service internationally',
    body: 'I\'m based in Australia. Can I send my watch in for servicing and how does that work?',
    status: 'Pending reply', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 89, kbMatch: 'KB-027', kbMatchScore: 90,
  },
  {
    id: 'TKT-1067', date: '2026-04-02', customer: 'Luke Moore', email: 'luke_moore@gmail.com',
    channel: 'Email', lane: 'Materials & safety', subject: 'EU safety certification',
    body: 'Does the strap meet EU REACH or RoHS standards? I\'m based in Germany and need to confirm before purchasing.',
    status: 'Resolved', persona: 'Health-Conscious Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 92, kbMatch: 'KB-006', kbMatchScore: 94,
  },
  {
    id: 'TKT-1012', date: '2026-04-04', customer: 'Rahul Jones', email: 'rahulj@yahoo.com',
    channel: 'Chat', lane: 'Product general', subject: 'Watch size recommendation',
    body: 'I have a small wrist (15cm). Would the 40mm case look too big? Do you have a smaller option?',
    status: 'Resolved', persona: '—',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 87, kbMatch: 'KB-035', kbMatchScore: 83,
  },
  {
    id: 'TKT-1024', date: '2026-04-06', customer: 'Liam Chan', email: 'liam43@hotmail.com',
    channel: 'WhatsApp', lane: 'Product general', subject: 'Sustainability practices',
    body: 'I care about sustainability. Can you tell me about Boldr\'s environmental practices and whether the packaging is recyclable?',
    status: 'Resolved', persona: 'Sustainability Advocate',
    answeredByKb: false, isKnowledgeGap: true, requiresEscalation: false,
    classifyConfidence: 88, routedTo: 'cs@boldr.co',
  },
  {
    id: 'TKT-1039', date: '2026-04-07', customer: 'Ava Lee', email: 'aval@protonmail.com',
    channel: 'WhatsApp', lane: 'Materials & safety', subject: 'Titanium vs stainless steel case',
    body: 'What\'s the practical difference between your titanium case and a standard stainless steel watch? Is titanium really lighter?',
    status: 'In triage', persona: 'Health-Conscious Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 89, kbMatch: 'KB-007', kbMatchScore: 91,
  },
  {
    id: 'TKT-1003', date: '2026-04-09', customer: 'Ethan Tan', email: 'ethan_tan@gmail.com',
    channel: 'Instagram DM', lane: 'Materials & safety', subject: 'Hypoallergenic claim',
    body: 'Your site says the watch is hypoallergenic. Does that apply to the strap as well or just the case?',
    status: 'Pending reply', persona: 'Health-Conscious Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 91, kbMatch: 'KB-008', kbMatchScore: 92,
  },
  {
    id: 'TKT-1050', date: '2026-04-12', customer: 'Mei Mehta', email: 'mei_mehta@hotmail.com',
    channel: 'Instagram DM', lane: 'Servicing', subject: 'Scratches on case — can you polish?',
    body: 'My watch case has some light scratches. Can you polish it during a service?',
    status: 'Pending reply', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 90, kbMatch: 'KB-024', kbMatchScore: 85,
  },
  {
    id: 'TKT-1070', date: '2026-04-19', customer: 'Mila Yeo', email: 'mila_yeo@hotmail.com',
    channel: 'Email', lane: 'Knowledge gap', subject: 'Engraving in Arabic script',
    body: 'Can you engrave in Arabic? I want to put a dedication in Arabic for my father.',
    status: 'In triage', persona: 'Gifter',
    answeredByKb: false, isKnowledgeGap: true, requiresEscalation: true,
    classifyConfidence: 91, routedTo: 'cs@boldr.co', autoKbEntry: 'KB-038',
  },
  {
    id: 'TKT-1028', date: '2026-04-22', customer: 'Mei Davis', email: 'meid@icloud.com',
    channel: 'Email', lane: 'Knowledge gap', subject: 'Strap recycling programme',
    body: 'Do you have a strap recycling or take-back programme? I have three old straps I\'d like to dispose of responsibly.',
    status: 'Resolved', persona: 'Sustainability Advocate',
    answeredByKb: false, isKnowledgeGap: true, requiresEscalation: true,
    classifyConfidence: 89, routedTo: 'cs@boldr.co', autoKbEntry: 'KB-041',
  },
  {
    id: 'TKT-1036', date: '2026-04-27', customer: 'Xin Moore', email: 'xin.moore@hotmail.com',
    channel: 'Instagram DM', lane: 'Knowledge gap', subject: 'Vegan-friendly materials',
    body: 'Are all your straps vegan-friendly? I don\'t use any animal products and want to make sure the leather alternative is genuinely synthetic.',
    status: 'Resolved', persona: 'Sustainability Advocate',
    answeredByKb: false, isKnowledgeGap: true, requiresEscalation: true,
    classifyConfidence: 92, routedTo: 'cs@boldr.co', autoKbEntry: 'KB-039',
  },
  {
    id: 'TKT-1019', date: '2026-05-01', customer: 'Zoey Teo', email: 'zoey62@protonmail.com',
    channel: 'Email', lane: 'Product general', subject: 'Wholesale or bulk order',
    body: 'We\'re a corporate client looking to order 20 watches as employee gifts. Do you offer bulk pricing?',
    status: 'In triage', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 90, kbMatch: 'KB-036', kbMatchScore: 92, routedTo: 'corporate@boldr.co',
  },
  {
    id: 'TKT-1018', date: '2026-05-02', customer: 'Arjun Martin', email: 'arjun70@yahoo.com',
    channel: 'WhatsApp', lane: 'Strap compatibility', subject: 'Mesh bracelet compatibility',
    body: 'Do you sell a mesh/milanese bracelet for the Journey model? Or can I use a third-party one?',
    status: 'In triage', persona: 'Enthusiast / Collector',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 92, kbMatch: 'KB-016', kbMatchScore: 87,
  },
  {
    id: 'TKT-1042', date: '2026-05-02', customer: 'Elizabeth Yeo', email: 'elizabeth_yeo@yahoo.com',
    channel: 'Chat', lane: 'Materials & safety', subject: 'Water resistance and materials',
    body: 'If the watch is water resistant to 100m, does that mean the strap can be submerged too? What material is the strap?',
    status: 'Pending reply', persona: 'Health-Conscious Buyer',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 88, kbMatch: 'KB-020', kbMatchScore: 84,
  },
  {
    id: 'TKT-1056', date: '2026-05-04', customer: 'Lucas Mehta', email: 'lucas.mehta@outlook.com', orderId: 'BLD-27477',
    channel: 'Instagram DM', lane: 'Order status', subject: 'Tracking number not updating',
    body: 'My tracking number DHL9697354961 hasn\'t updated in 5 days. Is there a delay?',
    status: 'Resolved', persona: '—',
    answeredByKb: false, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 92, kbMatch: 'KB-032', kbMatchScore: 86,
  },
  {
    id: 'TKT-1069', date: '2026-05-05', customer: 'Elizabeth Johnson', email: 'elizabethj@yahoo.com',
    channel: 'Email', lane: 'Engraving', subject: 'Font options for engraving',
    body: 'Do you offer different font styles for engraving, or is it a fixed font? I\'d like something more elegant.',
    status: 'In triage', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 87, kbMatch: 'KB-009', kbMatchScore: 80,
  },
  {
    id: 'TKT-1027', date: '2026-05-06', customer: 'Sophia Patel', email: 'sophiap@gmail.com',
    channel: 'Chat', lane: 'Product general', subject: 'Gifting — personalisation options',
    body: 'What personalisation options do you offer for gifting? I want to make it special.',
    status: 'Resolved', persona: 'Gifter',
    answeredByKb: true, isKnowledgeGap: false, requiresEscalation: false,
    classifyConfidence: 90, kbMatch: 'KB-034', kbMatchScore: 88,
  },
  {
    id: 'TKT-1013', date: '2026-05-10', customer: 'Victoria Singh', email: 'victoria87@yahoo.com',
    channel: 'Chat', lane: 'Knowledge gap', subject: 'Carbon footprint of shipping',
    body: 'Do you offer carbon-neutral shipping? I try to offset my purchases where possible.',
    status: 'Escalated', persona: 'Sustainability Advocate',
    answeredByKb: false, isKnowledgeGap: true, requiresEscalation: true,
    classifyConfidence: 91, routedTo: 'cs@boldr.co', autoKbEntry: 'KB-040',
  },
  {
    id: 'TKT-1055', date: '2026-05-12', customer: 'Scarlett Taylor', email: 'scarlett.taylor@gmail.com', orderId: 'BLD-65724',
    channel: 'WhatsApp', lane: 'Order status', subject: 'Cancel order before shipping',
    body: 'I just placed order BLD-39256 and want to cancel it. It hasn\'t shipped yet. Is that possible?',
    status: 'Pending reply', persona: '—',
    answeredByKb: false, isKnowledgeGap: false, requiresEscalation: true,
    classifyConfidence: 93, routedTo: 'admin.shopify.com',
  },
];

/* ----------------------------------------------------------------------------
 * KNOWLEDGE BASE — 41 entries. 36 Live, 3 Auto-drafted, 2 Pending approval.
 * Auto-drafted / Pending entries carry ticket provenance — the self-improving loop.
 * Engraving + servicing entries use the RESOLVED values from kbConflicts below.
 * -------------------------------------------------------------------------- */

export const kbEntries: KbEntry[] = [
  // Materials & safety
  { id: 'KB-001', category: 'Materials & safety', source: 'FAQ document', status: 'Live',
    question: 'Are Boldr watch straps BPA-free?',
    answer: 'Yes. All FKM rubber and nylon NATO straps are 100% BPA-free and nickel-free. Leather straps contain no BPA but are not hypoallergenic.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-002', category: 'Materials & safety', source: 'Product reference', status: 'Live',
    question: 'What grade of titanium is used in each model?',
    answer: 'The Expedition uses Grade 5 Titanium (Ti-6Al-4V), the aerospace alloy. The Journey uses Grade 2 (commercially pure) titanium — slightly softer but very durable.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-003', category: 'Materials & safety', source: 'FAQ document', status: 'Live',
    question: 'Is the watch safe for children?',
    answer: 'The models are designed for adults, but all materials are EU REACH and RoHS compliant. Rubber straps are BPA-free and non-toxic. Adult supervision is recommended.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-004', category: 'Materials & safety', source: 'FAQ document', status: 'Live',
    question: 'Do the straps contain nickel?',
    answer: 'FKM rubber and nylon NATO straps are nickel-free. Leather strap buckles are Grade 5 titanium (nickel-free). The mesh bracelet uses 316L stainless steel, which carries trace nickel.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-005', category: 'Materials & safety', source: 'FAQ document', status: 'Live',
    question: 'Is the luminous material on the dial safe?',
    answer: 'Yes. Boldr uses Super-LumiNova (BGW9 or C3 depending on model) — a non-radioactive photoluminescent pigment compliant with ISO 3157. Safe for everyday wear.',
    provenance: 'Born from TKT-1021 · 4 Dec 2025', createdDate: '2025-12-09' },
  { id: 'KB-006', category: 'Materials & safety', source: 'FAQ document', status: 'Live',
    question: 'Does the watch meet EU safety standards?',
    answer: 'Yes. All Boldr watches are EU REACH and RoHS compliant. Documentation is available on request.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-007', category: 'Materials & safety', source: 'FAQ document', status: 'Live',
    question: 'What is the difference between a titanium and stainless steel case?',
    answer: 'Grade 5 titanium is roughly 45% lighter than stainless steel and more corrosion-resistant. It is also hypoallergenic, unlike most stainless steel.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-008', category: 'Materials & safety', source: 'Product reference', status: 'Live',
    question: 'Is the watch hypoallergenic — case and strap?',
    answer: 'The titanium case and FKM/nylon straps are hypoallergenic. Leather straps are not — some customers with sensitivities may react to treated leather.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  // Engraving — uses resolved values: SGD 40 for 21-40 chars, 60 char max
  { id: 'KB-009', category: 'Engraving', source: 'FAQ document', status: 'Live',
    question: 'Can I get the caseback engraved, and in which scripts?',
    answer: 'Yes — caseback engraving is offered in Roman/Latin script, Chinese/Japanese/Korean characters and Arabic script. Pricing starts at SGD 25.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-010', category: 'Engraving', source: 'Engraving rate card', status: 'Live',
    question: 'How many characters can I engrave and what does it cost?',
    answer: 'Up to 60 characters total on the caseback. Latin script: SGD 25 for up to 20 characters, SGD 40 for 21-40, then SGD 1.50 per character beyond 40. CJK or Arabic: SGD 3.00 per character, up to 15 characters.',
    provenance: 'Updated via KB Health — conflict CFL-01 / CFL-02 resolved', createdDate: '2026-05-14' },
  { id: 'KB-011', category: 'Engraving', source: 'FAQ document', status: 'Live',
    question: 'Can I engrave a logo or image?',
    answer: 'Yes, for an additional SGD 60. A vector file (.ai or .svg) must be supplied; the team reviews the design for feasibility before confirming.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-012', category: 'Engraving', source: 'FAQ document', status: 'Live',
    question: 'How long does engraving take?',
    answer: 'Standard engraving adds 2-3 business days to processing. Rush same-day engraving (SGD 20 surcharge) is available for orders placed before 12pm SGT, subject to availability.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-013', category: 'Engraving', source: 'FAQ document', status: 'Live',
    question: 'Can I change the engraving text after ordering?',
    answer: 'If you contact us within 1 hour of placing the order, the text is amended free of charge. After 1 hour a SGD 15 correction fee applies. Once engraving has begun, changes are not possible.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-014', category: 'Engraving', source: 'Engraving rate card', status: 'Live',
    question: 'Can the strap buckle be engraved?',
    answer: 'Yes, on metal buckles only (not rubber or NATO). Up to 10 characters for SGD 15.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-015', category: 'Engraving', source: 'Engraving rate card', status: 'Live',
    question: 'Can I engrave two lines of text?',
    answer: 'Yes. Multi-line engraving (2 lines) is SGD 35 and includes up to 30 characters total across both lines.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  // Strap compatibility
  { id: 'KB-016', category: 'Strap compatibility', source: 'FAQ document', status: 'Live',
    question: 'What lug width do Boldr watches use?',
    answer: 'All current models (Expedition and Journey) use a 20mm lug width — a standard size compatible with most third-party straps.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-017', category: 'Strap compatibility', source: 'FAQ document', status: 'Live',
    question: 'Are the straps quick-release?',
    answer: 'Yes. All Boldr straps use a quick-release spring-bar mechanism — no tools needed to swap straps.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-018', category: 'Strap compatibility', source: 'FAQ document', status: 'Live',
    question: 'Can I use a NATO strap on the Expedition?',
    answer: 'Yes. Any standard 20mm NATO strap is compatible with the Expedition and Journey.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-019', category: 'Strap compatibility', source: 'FAQ document', status: 'Live',
    question: 'Can I swap straps between the Expedition and Journey?',
    answer: 'Yes. Both models share the 20mm lug width, so all Boldr straps are interchangeable between them.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-020', category: 'Strap compatibility', source: 'FAQ document', status: 'Live',
    question: 'What strap do you recommend for swimming?',
    answer: 'The FKM rubber strap — waterproof, quick-drying and salt-resistant. The nylon NATO is water-resistant but slower to dry. Leather is not recommended for water.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-021', category: 'Strap compatibility', source: 'FAQ document', status: 'Live',
    question: 'How do I care for the leather strap?',
    answer: 'Keep it away from prolonged water exposure. Apply a little leather conditioner every 3-6 months and avoid extended direct sunlight to prevent fading.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-022', category: 'Strap compatibility', source: 'CS SOP', status: 'Live',
    question: 'Which strap is best for sensitive skin?',
    answer: 'FKM rubber straps are recommended for sensitive skin — BPA-free, nickel-free and hypoallergenic. Nylon NATO is also a good option. Avoid leather if you react to treated leather.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  // Servicing — uses resolved values: battery 3-5 days, full service 160/220
  { id: 'KB-023', category: 'Servicing', source: 'Servicing rate card', status: 'Live',
    question: 'How much does a battery replacement cost?',
    answer: 'SGD 35, with a 3-5 business day turnaround. Includes a basic water-resistance test and function check. (Quartz movements.)',
    provenance: 'Updated via KB Health — conflict CFL-03 resolved', createdDate: '2026-05-14' },
  { id: 'KB-024', category: 'Servicing', source: 'Servicing rate card', status: 'Live',
    question: 'What is included in a Full Service?',
    answer: 'Full Service Standard (SGD 160): movement disassembly, ultrasonic cleaning, lubrication, regulation, 100m water-resistance test, light case polish, new gaskets. Premium (SGD 220) adds deep case polish, crystal replacement if scratched, and a 12-month service warranty. Turnaround 14-21 days.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-025', category: 'Servicing', source: 'Servicing rate card', status: 'Live',
    question: 'My watch is losing time — what service do I need?',
    answer: 'If it gains or loses more than 15 seconds per day, a Regulation Service (SGD 85, 7-10 days) is recommended — movement cleaning plus regulation to +/-5 s/day with a timing report.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-026', category: 'Servicing', source: 'FAQ document', status: 'Live',
    question: 'How often should I service my watch?',
    answer: 'Every 3-5 years for automatic movements, or sooner if you notice significant timekeeping deviation.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-027', category: 'Servicing', source: 'FAQ document', status: 'Live',
    question: 'How do I send my watch in for servicing?',
    answer: 'Pack it securely and ship to our Singapore service centre (address provided at checkout) — insured shipping recommended. International customers pay a SGD 25 surcharge for insured return shipping.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-028', category: 'Servicing', source: 'Servicing rate card', status: 'Live',
    question: 'Is there a warranty on servicing work?',
    answer: 'The Premium Full Service includes a 12-month service warranty. A 12-month warranty extension can be added to any service for SGD 30.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  // Orders & shipping
  { id: 'KB-029', category: 'Orders & shipping', source: 'FAQ document', status: 'Live',
    question: 'How long does shipping take?',
    answer: 'Singapore: 3-5 business days. International: 7-14 business days depending on destination. Express shipping is available at checkout.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-030', category: 'Orders & shipping', source: 'FAQ document', status: 'Live',
    question: 'Do you ship internationally and who pays customs?',
    answer: 'Yes, we ship worldwide. Customers are responsible for any customs duties and import taxes in their country — these cannot be predicted by Boldr.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-031', category: 'Orders & shipping', source: 'FAQ document', status: 'Live',
    question: 'What is your return policy?',
    answer: 'Returns are accepted within 14 days of delivery for unworn, unmodified items in original packaging. Engraved items are non-returnable unless there is a manufacturing defect.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-032', category: 'Orders & shipping', source: 'FAQ document', status: 'Live',
    question: 'My order has not arrived — what should I do?',
    answer: 'Check your tracking number first. If tracking shows no update for more than 5 business days, contact support with your order number and the team will investigate.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  // Product & general
  { id: 'KB-033', category: 'Product & general', source: 'FAQ document', status: 'Live',
    question: 'What is the warranty on Boldr watches?',
    answer: 'A 2-year manufacturer warranty covering movement defects. It does not cover physical damage, water damage beyond the rated depth, or normal wear (including strap wear).',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-034', category: 'Product & general', source: 'FAQ document', status: 'Live',
    question: 'Do you offer gift wrapping?',
    answer: 'Yes — select gift wrapping at checkout (SGD 8). The watch arrives in a premium gift box with a ribbon and a personalised gift card.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-035', category: 'Product & general', source: 'FAQ document', status: 'Live',
    question: 'What is the difference between the Expedition and Journey?',
    answer: 'Expedition: 40mm, Grade 5 titanium, 100m water resistance — larger and built for active use. Journey: 38mm, Grade 2 titanium, 50m — slimmer and more dress-casual. Both are automatic.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  { id: 'KB-036', category: 'Product & general', source: 'FAQ document', status: 'Live',
    question: 'Do you offer bulk or corporate pricing?',
    answer: 'Yes. For orders of 10 or more watches, contact corporate@boldr.co for a custom quote.',
    provenance: 'Original FAQ entry', createdDate: '2025-09-01' },
  // Auto-drafted from resolved knowledge gaps — awaiting 1-click approval
  { id: 'KB-037', category: 'Materials & safety', source: 'Auto-draft (gap loop)', status: 'Auto-drafted',
    question: 'Are Boldr movements resistant to magnetic fields (e.g. MRI environments)?',
    answer: 'The Expedition (Miyota 9015) and Journey (Miyota 6T33) are standard automatic movements and are not rated as antimagnetic. Boldr documentation does not currently specify a gauss figure. For strong fields such as MRI suites or industrial magnetic equipment, we recommend removing the watch. A definitive rating is being confirmed with the supplier.',
    provenance: 'Born from TKT-1046 · 15 Nov 2025', createdDate: '2026-05-15' },
  { id: 'KB-038', category: 'Engraving', source: 'Auto-draft (gap loop)', status: 'Auto-drafted',
    question: 'Can the caseback be engraved in Arabic script?',
    answer: 'Yes. Arabic script caseback engraving is available at SGD 3.00 per character, up to 15 characters — the same rate as CJK characters. The team reviews each Arabic engraving for character rendering before confirming.',
    provenance: 'Born from TKT-1070 · 19 Apr 2026', createdDate: '2026-05-15' },
  { id: 'KB-039', category: 'Materials & safety', source: 'Auto-draft (gap loop)', status: 'Auto-drafted',
    question: 'Are Boldr straps vegan-friendly?',
    answer: 'The FKM rubber and nylon NATO straps contain no animal products and are vegan-friendly. The leather strap is genuine leather and is not vegan. Boldr does not currently offer a dedicated vegan leather-alternative strap.',
    provenance: 'Born from TKT-1036 · 27 Apr 2026', createdDate: '2026-05-15' },
  // Pending approval — gaps routed but not yet team-confirmed
  { id: 'KB-040', category: 'Orders & shipping', source: 'Auto-draft (gap loop)', status: 'Pending approval',
    question: 'Do you offer carbon-neutral shipping?',
    answer: 'DRAFT — awaiting ops confirmation. Boldr does not currently offer a carbon-neutral shipping option at checkout. Ops is evaluating an offset partner; do not promise a launch date.',
    provenance: 'Born from TKT-1013 · 10 May 2026', createdDate: '2026-05-13' },
  { id: 'KB-041', category: 'Materials & safety', source: 'Auto-draft (gap loop)', status: 'Pending approval',
    question: 'Do you have a strap recycling or take-back programme?',
    answer: 'DRAFT — awaiting ops confirmation. Boldr does not currently run a strap recycling or take-back programme. This is being assessed as part of the sustainability roadmap.',
    provenance: 'Born from TKT-1028 · 22 Apr 2026', createdDate: '2026-05-13' },
];

/* ----------------------------------------------------------------------------
 * KB HEALTH — real contradictions found across Boldr's own documents.
 * All four implicate the stale Jan 2026 SOP. Resolution = consensus + recency.
 * -------------------------------------------------------------------------- */

export const kbConflicts: KbConflict[] = [
  {
    id: 'CFL-01', topic: 'Engraving price — 21 to 40 characters', category: 'Engraving',
    sources: [
      { doc: 'CS SOP', value: 'SGD 35', dated: 'Jan 2026' },
      { doc: 'FAQ document', value: 'SGD 40', dated: 'May 2026' },
      { doc: 'Engraving rate card', value: 'SGD 40', dated: 'May 2026' },
    ],
    recommendedValue: 'SGD 40',
    resolutionLogic: 'Two of three sources agree on SGD 40, and both (FAQ + rate card) are the May 2026 versions. The SOP is the lone Jan 2026 outlier — stale. Use SGD 40; flag the SOP for update.',
    status: 'Resolved', affectedKbEntry: 'KB-010',
  },
  {
    id: 'CFL-02', topic: 'Engraving maximum character count', category: 'Engraving',
    sources: [
      { doc: 'CS SOP', value: 'Max 40 characters', dated: 'Jan 2026' },
      { doc: 'FAQ document', value: 'Up to 60 characters', dated: 'May 2026' },
      { doc: 'Engraving rate card', value: 'Max 60 characters total', dated: 'May 2026' },
    ],
    recommendedValue: '60 characters',
    resolutionLogic: 'FAQ and rate card agree on a 60-character maximum, both dated May 2026. The SOP\'s 40-character cap predates the per-character pricing tier and is stale.',
    status: 'Resolved', affectedKbEntry: 'KB-010',
  },
  {
    id: 'CFL-03', topic: 'Battery replacement turnaround', category: 'Servicing',
    sources: [
      { doc: 'CS SOP', value: '5-7 business days', dated: 'Jan 2026' },
      { doc: 'FAQ document', value: '3-5 business days', dated: 'May 2026' },
      { doc: 'Servicing rate card', value: '3-5 days', dated: 'May 2026' },
    ],
    recommendedValue: '3-5 business days',
    resolutionLogic: 'FAQ and rate card agree on 3-5 days, both current. The SOP\'s 5-7 days is the outlier. Use 3-5 business days to avoid over-quoting turnaround.',
    status: 'Resolved', affectedKbEntry: 'KB-023',
  },
  {
    id: 'CFL-04', topic: 'Full service price', category: 'Servicing',
    sources: [
      { doc: 'CS SOP', value: 'SGD 180-250', dated: 'Jan 2026' },
      { doc: 'FAQ document', value: 'SGD 160 / 220', dated: 'May 2026' },
      { doc: 'Servicing rate card', value: 'SGD 160 / 220', dated: 'May 2026' },
    ],
    recommendedValue: 'SGD 160 (Standard) / SGD 220 (Premium)',
    resolutionLogic: 'FAQ and rate card give explicit Standard/Premium tiers (160/220), both May 2026. The SOP\'s 180-250 range is stale and would over-quote the customer. SOP still needs updating.',
    status: 'Flagged', affectedKbEntry: 'KB-024',
  },
];

/* ----------------------------------------------------------------------------
 * THEMES — for the bonus benchmarking page. Internal counts match the brief.
 * -------------------------------------------------------------------------- */

export const themesNew: ThemeNew[] = [
  {
    id: 'TH-01', name: 'BPA-Free Straps', internalTickets: 3, externalMentions: 16,
    externalSentiment: 'Positive and curious — buyers surprised it is not advertised',
    verdict: 'Market-Wide Opportunity',
    recommendedAction: 'Add a "BPA-free" badge to all FKM/silicone product pages and surface it in site navigation.',
    insight: 'Boldr already answers this well internally, but external buyers actively look for BPA-free watch straps and find almost no brand marketing it — clear white space.',
  },
  {
    id: 'TH-02', name: 'Titanium Safety', internalTickets: 5, externalMentions: 41,
    externalSentiment: 'High interest with recurring confusion over Grade 2 vs Grade 5',
    verdict: 'Market-Wide Opportunity',
    recommendedAction: 'Publish a Grade 2 vs Grade 5 titanium explainer; state the grade clearly per model on each product page.',
    insight: 'External volume outpaces internal tickets ~8:1. Titanium grade is a market-wide education gap Boldr can own with content.',
  },
  {
    id: 'TH-03', name: 'Sustainability', internalTickets: 4, externalMentions: 28,
    externalSentiment: 'Growing demand, mixed — buyers reward brands that act, penalise vague claims',
    verdict: 'Market-Wide Opportunity',
    recommendedAction: 'Develop carbon-neutral shipping and recyclable-packaging messaging; only claim what can be verified.',
    insight: 'Sustainability questions are rising in both internal tickets and external forums — a segment forming faster than Boldr\'s product pages address it.',
  },
  {
    id: 'TH-04', name: 'Nickel Allergy', internalTickets: 2, externalMentions: 32,
    externalSentiment: 'Anxious and underserved — buyers struggle to find clear nickel information',
    verdict: 'Boldr-Specific Gap',
    recommendedAction: 'Boldr\'s nickel answer exists in the FAQ but is missing from product pages — add nickel content to the PDP spec table.',
    insight: 'Low internal volume but very high external concern. The information exists; the gap is where the customer looks. A product-page fix, not a new answer.',
  },
  {
    id: 'TH-05', name: 'Vegan Straps', internalTickets: 3, externalMentions: 24,
    externalSentiment: 'Rising trend — vegan strap demand growing across enthusiast communities',
    verdict: 'Market-Wide Opportunity',
    recommendedAction: 'Confirm the synthetic strap line is genuinely vegan and build a dedicated vegan-strap angle and SKU.',
    insight: 'Three internal tickets in six weeks plus rising external chatter — an emerging trend Boldr can lead before competitors do.',
  },
];

/* ----------------------------------------------------------------------------
 * EXTERNAL SOURCES — 3 sources, with the brief's required justification.
 * Mentions are illustrative seed quotes for the demo.
 * -------------------------------------------------------------------------- */

export const externalSourcesNew: ExternalSourceNew[] = [
  {
    id: 1,
    name: 'r/Watches + WatchUSeek forums',
    justification: 'Where Boldr\'s enthusiast and collector core gathers. Captures titanium-grade debate, micro-brand sentiment, and strap and movement chatter.',
    mentions: [
      { source: 'WatchUSeek', handle: 'u/ti_diver_88', theme: 'Titanium Safety', sentiment: 'neutral',
        snippet: 'Does anyone actually know the gauss rating on these micro-brand Miyota movements?' },
      { source: 'r/Watches', handle: 'u/grail_hunter', theme: 'Titanium Safety', sentiment: 'positive',
        snippet: 'Grade 2 vs Grade 5 titanium matters far more than people assume — wish brands explained it.' },
      { source: 'r/Watches', handle: 'u/everyday_carry', theme: 'BPA-Free Straps', sentiment: 'positive',
        snippet: 'Surprised more brands do not shout about BPA-free rubber straps. Big selling point for me.' },
      { source: 'WatchUSeek', handle: 'u/strapaddict', theme: 'Vegan Straps', sentiment: 'neutral',
        snippet: 'Looking for a genuinely vegan 20mm strap — most "leather alternative" listings are vague.' },
    ],
  },
  {
    id: 2,
    name: 'r/Allergies + r/SkincareAddiction + Trustpilot mining',
    justification: 'Captures nickel, BPA and skin-reaction sentiment from health-conscious consumers — a signal watch forums underweight. Validates whether the nickel-allergy product-page gap is market-wide.',
    mentions: [
      { source: 'r/Allergies', handle: 'u/nickelfree_life', theme: 'Nickel Allergy', sentiment: 'negative',
        snippet: 'Watch shopping with a nickel allergy is exhausting — brands rarely list buckle materials.' },
      { source: 'r/SkincareAddiction', handle: 'u/sensitive_skin22', theme: 'Nickel Allergy', sentiment: 'negative',
        snippet: 'Reacted to a stainless caseback again. I now only trust titanium, but specs are never clear.' },
      { source: 'Trustpilot', handle: 'verified buyer', theme: 'BPA-Free Straps', sentiment: 'positive',
        snippet: 'Bought a titanium watch specifically because the strap is BPA-free for my kid.' },
      { source: 'r/Allergies', handle: 'u/contact_derm', theme: 'Nickel Allergy', sentiment: 'neutral',
        snippet: 'Trace nickel in 316L still triggers me — wish more brands offered rubber-only options.' },
    ],
  },
  {
    id: 3,
    name: 'Competitor review pages + r/BuyItForLife / r/ZeroWaste',
    justification: 'Vegan-strap and eco-packaging demand, plus an "is a competitor already doing this?" check. Tests whether sustainability is a Boldr gap or an untapped market-wide opportunity.',
    mentions: [
      { source: 'r/ZeroWaste', handle: 'u/lowimpact_life', theme: 'Sustainability', sentiment: 'neutral',
        snippet: 'Would pay more for a watch brand with recyclable packaging and offset shipping.' },
      { source: 'Competitor review', handle: 'verified buyer', theme: 'Sustainability', sentiment: 'negative',
        snippet: 'Loved the watch, but the packaging was excessive plastic. Felt off-brand for an outdoors product.' },
      { source: 'r/BuyItForLife', handle: 'u/keepforever', theme: 'Vegan Straps', sentiment: 'positive',
        snippet: 'A durable vegan strap that lasts would be an instant buy — nobody does it well yet.' },
      { source: 'Competitor review', handle: 'verified buyer', theme: 'Sustainability', sentiment: 'neutral',
        snippet: 'Asked the brand about carbon-neutral shipping and got no clear answer.' },
    ],
  },
];

/* ----------------------------------------------------------------------------
 * MONTHLY MARKETING BRIEF — the headline output of the intelligence loop.
 * -------------------------------------------------------------------------- */

export const monthlyBriefNew = {
  title: 'What customers are asking that is not on your product pages',
  period: 'May 2026',
  summary: 'Five themes surfaced from this month\'s ticket flow, cross-validated against external market sentiment. Four are market-wide opportunities; one is a Boldr-specific product-page gap.',
  topThemes: [
    { theme: 'Titanium Safety', personas: ['Health-Conscious Buyer', 'Enthusiast / Collector'],
      action: 'Publish a Grade 2 vs Grade 5 explainer; state titanium grade per model on every PDP.' },
    { theme: 'Nickel Allergy', personas: ['Health-Conscious Buyer'],
      action: 'Move existing FAQ nickel content onto product pages — the answer exists, the placement does not.' },
    { theme: 'BPA-Free Straps', personas: ['Health-Conscious Buyer'],
      action: 'Add a "BPA-free" badge to all FKM/silicone product pages — a marketing angle nobody is using.' },
    { theme: 'Sustainability', personas: ['Sustainability Advocate'],
      action: 'Build carbon-neutral shipping and recyclable-packaging messaging; verify before claiming.' },
    { theme: 'Vegan Straps', personas: ['Sustainability Advocate'],
      action: 'Confirm the synthetic strap line is genuinely vegan; develop a dedicated vegan-strap SKU.' },
  ],
  personasAffected: ['Health-Conscious Buyer', 'Sustainability Advocate', 'Enthusiast / Collector'],
};

/* ----------------------------------------------------------------------------
 * ENGINE METRICS — proof the loop is self-improving. Show these moving.
 * -------------------------------------------------------------------------- */

export const engineMetrics = {
  ticketsProcessed: 70,
  kbEntriesStart: 28,
  kbEntriesNow: 41,
  kbCoverageBefore: 71,        // % of tickets answerable from KB, start
  kbCoverageNow: 88,           // % now
  escalationRateBefore: 24,    // %
  escalationRateNow: 13,       // %
  avgDraftTimeManualMin: 14,   // minutes per reply, manual
  avgDraftTimeNowMin: 3,       // minutes per reply, with AI draft
  hoursSavedPerWeek: 9,
  conflictsDetected: 4,
  conflictsResolved: 3,
  externalSources: 3,
  kbGrowthSeries: [
    { month: 'Nov', entries: 28 },
    { month: 'Dec', entries: 31 },
    { month: 'Jan', entries: 34 },
    { month: 'Feb', entries: 36 },
    { month: 'Mar', entries: 38 },
    { month: 'Apr', entries: 40 },
    { month: 'May', entries: 41 },
  ],
};

/* ----------------------------------------------------------------------------
 * COPILOT — pre-written analyst answers keyed to the suggested prompts.
 * Staff-only BI tool. Never call it "chat" in the UI.
 * -------------------------------------------------------------------------- */

export const copilotSuggestions = [
  'What are people saying about titanium safety?',
  'What complaints are rising externally vs internally?',
  'Which themes are Boldr-specific gaps?',
];

export const copilotAnswers: Record<string, { answer: string; sources: string[] }> = {
  'What are people saying about titanium safety?': {
    answer: 'Titanium safety is the largest signal this month — 5 internal tickets but 41 external mentions, an 8:1 ratio. The recurring theme is confusion between Grade 2 and Grade 5 titanium: enthusiasts know it matters but say brands rarely explain it. Verdict: market-wide opportunity. Recommended action — publish a Grade 2 vs Grade 5 explainer and state the grade per model on each product page.',
    sources: ['TKT-1060', 'TKT-1039', 'TKT-1002 (theme: Titanium Safety)', 'WatchUSeek u/ti_diver_88', 'r/Watches u/grail_hunter'],
  },
  'What complaints are rising externally vs internally?': {
    answer: 'Nickel allergy shows the sharpest internal-vs-external divergence: only 2 internal tickets but 32 external mentions, and external sentiment is anxious and underserved. This is the one Boldr-specific gap — the nickel answer already exists in the FAQ but is missing from product pages. Sustainability and vegan straps are rising in both channels and are market-wide opportunities.',
    sources: ['TKT-1032', 'TKT-1048 (theme: Nickel Allergy)', 'r/Allergies u/nickelfree_life', 'r/SkincareAddiction u/sensitive_skin22'],
  },
  'Which themes are Boldr-specific gaps?': {
    answer: 'Of the five benchmarked themes, only one is a Boldr-specific gap: Nickel Allergy. The information exists internally but is absent from the product pages where customers actually look — a placement fix, not a new answer. The other four (BPA-Free Straps, Titanium Safety, Sustainability, Vegan Straps) are market-wide opportunities where Boldr can lead rather than catch up.',
    sources: ['theme: Nickel Allergy', 'theme: BPA-Free Straps', 'monthly brief — May 2026'],
  },
};
