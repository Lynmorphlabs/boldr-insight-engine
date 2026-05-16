// Boldr Customer Intelligence Engine — seeded data layer.
// Shape mirrors what the n8n + Postgres + OpenAI engine would emit.

export type Lane =
  | "knowledge_gap"
  | "servicing"
  | "product_general"
  | "materials_safety"
  | "strap_compatibility"
  | "order_status"
  | "engraving";

export type Persona =
  | "Health-Conscious Buyer"
  | "Gifter"
  | "Enthusiast / Collector"
  | "Active / Outdoor Buyer"
  | "Sustainability Advocate"
  | "—";

export type TicketStatus = "open" | "pending_reply" | "resolved" | "escalated";

export interface Ticket {
  id: string;
  date: string;
  customer: string;
  email: string;
  orderId?: string;
  channel: string;
  lane: Lane;
  subject: string;
  body: string;
  status: TicketStatus;
  answeredByKb: boolean;
  escalation: boolean;
  persona: Persona;
  confidence: number; // 0–1
  intent: string;
  kbMatches?: { kbId: string; similarity: number }[];
  isGap?: boolean;
  draftReply?: string;
  autoDraftKb?: { question: string; answer: string; category: string };
}

const T = (
  id: string,
  date: string,
  customer: string,
  email: string,
  channel: string,
  lane: Lane,
  subject: string,
  body: string,
  status: TicketStatus,
  answeredByKb: boolean,
  escalation: boolean,
  persona: Persona,
  intent: string,
  confidence: number,
  extras: Partial<Ticket> = {},
): Ticket => ({
  id, date, customer, email, channel, lane, subject, body, status,
  answeredByKb, escalation, persona, intent, confidence, ...extras,
});

export const tickets: Ticket[] = [
  T("TKT-1046","2025-11-15","Lily Shah","lily_shah@gmail.com","chat","knowledge_gap","Magnetic field resistance","Is the movement resistant to magnetic fields? I work near MRI equipment.","resolved",false,true,"Health-Conscious Buyer","Magnetic resistance / MRI safety",0.91,
    { isGap: true, autoDraftKb: { category: "Movement & Specs", question: "Are Boldr movements resistant to magnetic fields (MRI, industrial equipment)?", answer: "The Miyota 9039 automatic movement in the Expedition and Journey is rated to ~60 gauss — sufficient for everyday electronics but NOT for direct MRI exposure. We recommend removing the watch before entering an MRI suite. For repeated exposure near industrial magnetic equipment, consider a Faraday-pouch storage solution." } }),
  T("TKT-1010","2025-11-19","Oliver Gupta","oliver.gupta@icloud.com","email","servicing","Servicing older model","I have a Boldr Expedition from 2019. Do you still service older models? Is it the same price?","pending_reply",true,false,"Enthusiast / Collector","Legacy servicing eligibility",0.94,
    { kbMatches: [{ kbId: "KB-014", similarity: 0.93 }, { kbId: "KB-015", similarity: 0.74 }], draftReply: "Hi Oliver,\n\nYes — we service every Boldr produced since 2017, including the 2019 Expedition. Pricing follows our standard servicing rate card: Battery Replacement S$35, Regulation S$85, Full Service Standard S$160, Full Service Premium S$220.\n\nIf you'd like a regulation check before committing to a full service, drop the watch in and we'll give you a timing-machine report at no charge.\n\nWarm regards,\nBoldr Service Desk" } ),
  T("TKT-1068","2025-11-22","Caleb Harris","caleb.harris@protonmail.com","chat","product_general","Price match","I found the same watch cheaper on another site. Do you offer price matching?","open",true,false,"—","Price match policy",0.88,
    { kbMatches: [{ kbId: "KB-020", similarity: 0.96 }], draftReply: "Hi Caleb,\n\nWe don't price-match third-party sellers — we sell direct from Boldr Singapore to keep margins reinvested in materials and warranty support. What we do guarantee: every direct order ships with the 2-year international warranty, factory pressure-test certificate, and free servicing in the first 12 months. Counterfeits of our Expedition line have surfaced in 2025, so we'd encourage caution with unauthorised resellers.\n\nWarm regards,\nBoldr Team" } ),
  T("TKT-1016","2025-11-23","Liam Jones","liam.jones@yahoo.com","instagram_dm","materials_safety","Strap dye safety","Are the dyes used in the coloured straps non-toxic? I tend to sweat a lot and don't want dye bleeding onto my skin.","open",true,false,"Health-Conscious Buyer","Dye safety / skin transfer",0.92,
    { kbMatches: [{ kbId: "KB-007", similarity: 0.89 }] } ),
  T("TKT-1035","2025-11-28","Alexander Thompson","alexander74@hotmail.com","email","strap_compatibility","Rubber strap for swimming","I want to use the watch for swimming. Do you sell a rubber or silicone strap that's suitable?","escalated",true,true,"Active / Outdoor Buyer","Strap recommendation for swim use",0.95,
    { kbMatches: [{ kbId: "KB-005", similarity: 0.91 }] } ),
  T("TKT-1002","2025-11-29","Luke Moore","lukem@protonmail.com","chat","order_status","Express shipping option","I need the watch urgently as a birthday gift. Do you offer express shipping and how much does it cost?","resolved",false,true,"—","Express shipping availability",0.89,
    { orderId: "BLD-52504", isGap: true } ),
  T("TKT-1006","2025-12-01","Logan Taylor","logant@protonmail.com","whatsapp","servicing","Water resistance re-testing after service","After a full service, do you re-test the water resistance? I use the watch for diving.","resolved",true,false,"Active / Outdoor Buyer","Post-service water test confirmation",0.96,
    { kbMatches: [{ kbId: "KB-016", similarity: 0.97 }] } ),
  T("TKT-1030","2025-12-03","Victoria Wong","victoria_wong@outlook.com","email","product_general","Limited edition availability","I saw a limited edition collab on your Instagram. Is it still available or sold out?","pending_reply",true,false,"Enthusiast / Collector","LE stock availability",0.86,
    { kbMatches: [{ kbId: "KB-022", similarity: 0.79 }] } ),
  T("TKT-1021","2025-12-04","Harper Teo","harper_teo@outlook.com","whatsapp","knowledge_gap","Luminous material safety","What luminous material do you use on the dial? Is it Super-LumiNova? Is it safe?","pending_reply",false,true,"Health-Conscious Buyer","Lume material safety",0.9,
    { isGap: true, autoDraftKb: { category: "Materials", question: "What luminous material is used on Boldr dials and is it safe?", answer: "Boldr dials use Swiss Super-LumiNova® Grade X1 (BGW9 white-to-blue). It is non-radioactive (the older tritium and radium materials are not used by Boldr), photo-luminescent only, and certified to EU REACH and RoHS. The compound is sealed under the sapphire crystal — there is no skin contact path." } }),
  T("TKT-1037","2025-12-04","Oliver Ong","oliver80@icloud.com","chat","strap_compatibility","Strap length for large wrist","I have a 20cm wrist. Will the standard strap length fit me, or do I need an extended strap?","open",true,false,"Enthusiast / Collector","Extended strap availability",0.93,
    { kbMatches: [{ kbId: "KB-006", similarity: 0.88 }] } ),
  T("TKT-1011","2025-12-05","Dylan Allen","dylan.allen@yahoo.com","email","strap_compatibility","Interchangeable strap between models","I own both the Expedition and the Journey. Can I swap straps between the two models?","resolved",true,false,"Enthusiast / Collector","Cross-model strap compatibility",0.94,
    { kbMatches: [{ kbId: "KB-008", similarity: 0.95 }] } ),
  T("TKT-1005","2025-12-08","Xin Joshi","xin_joshi@yahoo.com","email","order_status","Customs duties — who pays?","I'm ordering from the UK. Will I have to pay customs duties on top of the shipping cost?","resolved",false,true,"—","UK customs/duty policy",0.85,
    { orderId: "BLD-28131", isGap: true } ),
  T("TKT-1007","2025-12-14","Luke Nair","luke_nair@icloud.com","instagram_dm","order_status","Discount code not working","I'm trying to apply discount code BOLDR10 at checkout but it says it's invalid. Can you help?","resolved",false,true,"—","Discount code troubleshooting",0.82,
    { orderId: "BLD-11504" } ),
  T("TKT-1047","2025-12-16","Dylan Teo","dylan_teo@icloud.com","instagram_dm","engraving","Engraving on watch caseback","Hi, I'd like to get the caseback engraved as a gift. How many characters can I fit and what's the cost?","pending_reply",true,false,"Gifter","Caseback engraving spec & price",0.97,
    { kbMatches: [{ kbId: "KB-024", similarity: 0.98 }], draftReply: "Hi Dylan,\n\nHappy to help — we can engrave the caseback in Roman/Latin script:\n• Up to 20 characters: S$25\n• 21–40 characters: S$40\n• 41–60 characters: S$1.50 per additional character (60 max)\n\nFor a gift, we'd suggest staying under 40 characters to keep the type size legible against the brushed titanium. Submit your text at checkout and we'll send a digital proof within 24 hours before engraving.\n\nWarm regards,\nBoldr Engraving" } ),
  T("TKT-1033","2025-12-19","Kavya Smith","kavya_smith@protonmail.com","instagram_dm","engraving","Multi-line engraving","I want two lines of text engraved. Is that possible and does it cost extra?","open",true,false,"Gifter","Multi-line engraving",0.95,
    { kbMatches: [{ kbId: "KB-025", similarity: 0.96 }] } ),
  T("TKT-1065","2025-12-19","Aditya Johnson","aditya.johnson@gmail.com","whatsapp","knowledge_gap","Altitude performance","I'm going on a high-altitude trek. Will the watch perform normally at 5,000m above sea level?","resolved",false,true,"Active / Outdoor Buyer","Altitude tolerance",0.9,
    { isGap: true, autoDraftKb: { category: "Field Performance", question: "How do Boldr watches perform at high altitude (≥4,000m)?", answer: "Boldr automatic movements operate within spec up to 6,000m. The case is pressure-rated to 100m water resistance which translates to a wide atmospheric envelope. The crown should remain screwed down during ascent/descent to prevent gasket stress from rapid pressure change. Lubricants in the Miyota 9039 are rated for –10°C to +60°C, comfortably covering most trek conditions." } }),
  T("TKT-1009","2025-12-24","Vikram Miller","vikram_miller@protonmail.com","instagram_dm","order_status","Where is my order?","Hi, I placed order BLD-93810 about 10 days ago and haven't received it yet. Can you check the status?","resolved",false,true,"—","Order tracking lookup",0.83,
    { orderId: "BLD-76540" } ),
  T("TKT-1001","2025-12-26","Jack Jones","jackj@icloud.com","whatsapp","servicing","Servicing turnaround time","How long does a full service take? I'm going on holiday in 6 weeks and want the watch back before then.","resolved",true,false,"Enthusiast / Collector","Service turnaround",0.97,
    { kbMatches: [{ kbId: "KB-013", similarity: 0.98 }] } ),
  T("TKT-1023","2025-12-27","Jing Sharma","jings@outlook.com","whatsapp","strap_compatibility","Strap width for Expedition 40mm","Hi, what lug width does the Expedition 40mm use? I want to buy a third-party strap.","escalated",true,true,"Enthusiast / Collector","Lug width specification",0.97,
    { kbMatches: [{ kbId: "KB-009", similarity: 0.96 }] } ),
  T("TKT-1051","2025-12-28","Ling Ong","lingo@icloud.com","email","strap_compatibility","Strap for sensitive skin","My skin reacts to most watch straps. Which of your straps would you recommend for sensitive skin?","resolved",true,false,"Health-Conscious Buyer","Hypoallergenic strap recommendation",0.93,
    { kbMatches: [{ kbId: "KB-007", similarity: 0.9 }] } ),
  T("TKT-1049","2025-12-29","Henry Koh","henry95@protonmail.com","instagram_dm","engraving","Engraving in Chinese characters","Can you engrave Chinese characters? I want to put my parents' names in Mandarin.","resolved",true,false,"Gifter","CJK engraving",0.95,
    { kbMatches: [{ kbId: "KB-026", similarity: 0.94 }] } ),
  T("TKT-1034","2026-01-07","Logan Miller","loganm@hotmail.com","instagram_dm","product_general","Warranty period","What is the warranty period on the watch? Does it cover the movement and the strap separately?","pending_reply",true,false,"—","Warranty terms",0.86,
    { kbMatches: [{ kbId: "KB-018", similarity: 0.95 }] } ),
  T("TKT-1060","2026-01-08","Harper Taylor","harper39@protonmail.com","email","materials_safety","Titanium grade on the Expedition model","Hello, could you tell me what grade of titanium is used in the case? I've seen Grade 2 and Grade 5 mentioned online and want to know which one Boldr uses.","open",true,false,"Enthusiast / Collector","Titanium grade specification",0.97,
    { kbMatches: [{ kbId: "KB-001", similarity: 0.98 }], draftReply: "Hi Harper,\n\nGreat question — both grades are used across our lineup:\n• Expedition 40mm: Grade 5 (Ti-6Al-4V) — higher tensile strength, better for tool-watch impacts.\n• Journey 38mm: Grade 2 (commercially pure) — slightly softer, warmer hand-feel, easier to refinish.\n\nBoth are hypoallergenic and contain zero nickel. The Grade 5 alloy contains aluminium and vanadium, but they are fully bound in the lattice and do not contact skin in elemental form.\n\nWarm regards,\nBoldr Team" } ),
  T("TKT-1015","2026-01-12","Scarlett Harris","scarlett_harris@gmail.com","chat","product_general","Gift wrapping","Do you offer gift wrapping or a gift box option? I'm buying this as a wedding gift.","resolved",true,false,"Gifter","Gift wrap availability",0.91,
    { kbMatches: [{ kbId: "KB-021", similarity: 0.93 }] } ),
  T("TKT-1022","2026-01-14","James Brown","james.brown@gmail.com","chat","engraving","Engraving depth and visibility","How deep is the engraving? I want to make sure it's visible and won't fade over time.","escalated",true,true,"Gifter","Engraving durability",0.9,
    { kbMatches: [{ kbId: "KB-027", similarity: 0.85 }] } ),
  T("TKT-1052","2026-01-14","Owen Patel","owen_patel@gmail.com","instagram_dm","knowledge_gap","Resale value of titanium watches","How well do Boldr watches hold their resale value compared to other micro-brands?","resolved",false,true,"Enthusiast / Collector","Resale value commentary",0.84,
    { isGap: true } ),
  T("TKT-1058","2026-01-15","Victoria Martin","victoria_martin@icloud.com","instagram_dm","engraving","Engraving turnaround time","If I order today with engraving, how long will it take to ship? I need it by next Friday.","resolved",true,false,"Gifter","Engraving lead time",0.94,
    { kbMatches: [{ kbId: "KB-028", similarity: 0.93 }] } ),
  T("TKT-1004","2026-01-17","Mila Sharma","mila60@yahoo.com","instagram_dm","servicing","Battery replacement cost","Hi, my watch battery has died. How much does a battery replacement cost and how do I send it in?","pending_reply",true,false,"Enthusiast / Collector","Battery service price & intake",0.95,
    { kbMatches: [{ kbId: "KB-010", similarity: 0.96 }] } ),
  T("TKT-1008","2026-01-21","Riley Davis","riley47@yahoo.com","chat","engraving","Engraving on strap","Can the strap buckle be engraved as well, or only the watch caseback?","resolved",true,false,"Gifter","Buckle engraving availability",0.94,
    { kbMatches: [{ kbId: "KB-029", similarity: 0.95 }] } ),
  T("TKT-1044","2026-01-21","Olivia Davis","oliviad@icloud.com","email","strap_compatibility","NATO strap compatibility","Does the Expedition work with standard NATO straps? What size do I need?","escalated",true,true,"Enthusiast / Collector","NATO compatibility & sizing",0.95,
    { kbMatches: [{ kbId: "KB-009", similarity: 0.93 }] } ),
  T("TKT-1048","2026-01-29","Vikram Allen","vikram95@hotmail.com","chat","materials_safety","Is the watch strap BPA-free?","Hi, I'm buying this for my young daughter and want to make sure the strap is BPA-free. Can you confirm?","resolved",true,false,"Health-Conscious Buyer","BPA-free strap confirmation",0.96,
    { kbMatches: [{ kbId: "KB-002", similarity: 0.97 }] } ),
  T("TKT-1062","2026-01-30","Noah Shah","noah58@gmail.com","whatsapp","servicing","Regulation service","My watch is losing about 10 seconds per day. Would a regulation service fix this?","escalated",true,true,"Enthusiast / Collector","Regulation diagnosis",0.93,
    { kbMatches: [{ kbId: "KB-011", similarity: 0.96 }] } ),
  T("TKT-1038","2026-02-01","Sneha Williams","snehaw@outlook.com","instagram_dm","materials_safety","Silicone strap material","Is the silicone strap food-grade or medical-grade silicone? Asking because my skin is sensitive.","open",true,false,"Health-Conscious Buyer","Silicone grade",0.93,
    { kbMatches: [{ kbId: "KB-002", similarity: 0.86 }] } ),
  T("TKT-1029","2026-02-03","Hui Joshi","hui_joshi@hotmail.com","chat","order_status","Wrong item received","I received my order BLD-46048 but the strap colour is wrong — I ordered olive green but received black.","resolved",false,true,"—","Wrong item / fulfilment error",0.9,
    { orderId: "BLD-36772" } ),
  T("TKT-1066","2026-02-06","Emily Brown","emily43@hotmail.com","instagram_dm","materials_safety","Is the watch safe for kids?","I want to gift this to my 10-year-old nephew. Are the materials safe for children? Any certifications?","pending_reply",true,false,"Health-Conscious Buyer","Child safety / certifications",0.92,
    { kbMatches: [{ kbId: "KB-003", similarity: 0.9 }] } ),
  T("TKT-1040","2026-02-08","Evelyn Martin","evelynm@outlook.com","whatsapp","order_status","Order not received — presumed lost","It's been 3 weeks since I placed order BLD-42098 and tracking shows it's stuck in customs. What do I do?","open",false,true,"—","Lost-in-transit escalation",0.88,
    { orderId: "BLD-13248" } ),
  T("TKT-1043","2026-02-25","Mei Lim","mei.lim@hotmail.com","instagram_dm","order_status","Refund status","I returned my order BLD-23434 two weeks ago. I haven't received my refund yet. Can you check?","resolved",false,true,"—","Refund status check",0.87,
    { orderId: "BLD-56025" } ),
  T("TKT-1061","2026-03-02","Hui Koh","hui52@outlook.com","whatsapp","servicing","Movement service vs battery","What's the difference between a movement service and just a battery replacement? Is the movement service worth it?","open",true,false,"Enthusiast / Collector","Service tier explanation",0.92,
    { kbMatches: [{ kbId: "KB-012", similarity: 0.94 }] } ),
  T("TKT-1045","2026-03-06","Charlotte Nair","charlotte_nair@protonmail.com","email","knowledge_gap","Watch for extreme sports","I do trail running and occasional rock climbing. Which model would you recommend and what's the shock resistance rating?","resolved",false,true,"Active / Outdoor Buyer","Extreme-sport suitability",0.91,
    { isGap: true } ),
  T("TKT-1063","2026-03-06","Hui Gupta","huig@outlook.com","whatsapp","engraving","Engraving price per character","What's the per-character charge for engraving? I want to engrave a 20-character message.",
    "pending_reply",true,false,"Gifter","Engraving per-char pricing",0.95,
    { kbMatches: [{ kbId: "KB-024", similarity: 0.97 }] } ),
  T("TKT-1032","2026-03-07","Benjamin Lee","benjaminl@hotmail.com","instagram_dm","materials_safety","Alloy composition of the strap","Hi there, I have a nickel allergy. Can you confirm whether the metal parts on the strap buckle contain any nickel?","pending_reply",true,false,"Health-Conscious Buyer","Nickel content in buckle",0.97,
    { kbMatches: [{ kbId: "KB-004", similarity: 0.97 }] } ),
  T("TKT-1014","2026-03-10","Penelope Wong","penelope_wong@outlook.com","email","knowledge_gap","Collaboration with independent watchmakers","Do you collaborate with independent watchmakers for limited editions? I'm a collector and interested in unique pieces.","resolved",false,true,"Enthusiast / Collector","Collab / LE programme",0.86,
    { isGap: true } ),
  T("TKT-1064","2026-03-14","Olivia Chan","olivia53@protonmail.com","chat","strap_compatibility","Strap colour options","What colour options are available for the 20mm rubber strap? I can only see black and navy on the website.","open",true,false,"Enthusiast / Collector","Strap colour SKU list",0.89,
    { kbMatches: [{ kbId: "KB-005", similarity: 0.85 }] } ),
  T("TKT-1041","2026-03-15","Scarlett Moore","scarlett.moore@outlook.com","chat","engraving","Can I engrave a logo or image?","Is it possible to engrave a small logo or symbol on the caseback, or is it text only?","resolved",true,false,"Gifter","Logo/vector engraving",0.94,
    { kbMatches: [{ kbId: "KB-030", similarity: 0.96 }] } ),
  T("TKT-1053","2026-03-16","Daniel Jackson","daniel.jackson@gmail.com","email","strap_compatibility","Leather strap care","I bought the leather strap. How should I care for it? Can it get wet?","pending_reply",true,false,"Enthusiast / Collector","Leather care",0.9,
    { kbMatches: [{ kbId: "KB-019", similarity: 0.92 }] } ),
  T("TKT-1057","2026-03-16","Kai Iyer","kai74@icloud.com","whatsapp","order_status","Change delivery address","I made a mistake in my delivery address for order BLD-28289. Can I update it before it ships?","resolved",false,true,"—","Address change pre-ship",0.86,
    { orderId: "BLD-68446" } ),
  T("TKT-1054","2026-03-21","Jun Koh","junk@protonmail.com","whatsapp","servicing","Servicing warranty","Is there a warranty on the servicing work? What if the issue comes back after a few months?","resolved",true,false,"Enthusiast / Collector","Post-service warranty",0.93,
    { kbMatches: [{ kbId: "KB-017", similarity: 0.94 }] } ),
  T("TKT-1031","2026-03-24","Jun Iyer","jun.iyer@gmail.com","instagram_dm","strap_compatibility","Quick-release strap mechanism","Do your straps have a quick-release mechanism or do I need tools to swap them?","resolved",true,false,"Enthusiast / Collector","Quick-release spring bars",0.95,
    { kbMatches: [{ kbId: "KB-008", similarity: 0.9 }] } ),
  T("TKT-1026","2026-03-30","Nathan Brown","nathan16@icloud.com","chat","servicing","Full service — what's included?","What exactly is included in a full service? I've had the watch for 3 years and it's running slightly slow.","escalated",true,true,"Enthusiast / Collector","Full-service scope",0.96,
    { kbMatches: [{ kbId: "KB-014", similarity: 0.97 }] } ),
  T("TKT-1020","2026-04-01","Sophia Wong","sophia.wong@yahoo.com","whatsapp","engraving","Engraving mistake — can it be corrected?","I submitted the wrong text for engraving. I just placed the order 10 minutes ago. Can I change it?","open",true,false,"Gifter","Engraving text correction window",0.94,
    { kbMatches: [{ kbId: "KB-031", similarity: 0.95 }] } ),
  T("TKT-1017","2026-04-02","Isabella Patel","isabella_patel@protonmail.com","chat","product_general","Return policy","What is your return policy? Can I return the watch if it doesn't fit my wrist?","resolved",true,false,"—","Return policy",0.92,
    { kbMatches: [{ kbId: "KB-023", similarity: 0.96 }] } ),
  T("TKT-1025","2026-04-02","Evelyn Jackson","evelynj@gmail.com","email","product_general","Difference between Expedition and Journey","Can you explain the main differences between the Expedition and Journey models? I can't decide which to buy.","resolved",true,false,"—","Model comparison",0.91,
    { kbMatches: [{ kbId: "KB-001", similarity: 0.84 }] } ),
  T("TKT-1059","2026-04-02","Kai Jones","kaij@hotmail.com","email","servicing","Sending watch for service internationally","I'm based in Australia. Can I send my watch in for servicing and how does that work?","pending_reply",true,false,"Enthusiast / Collector","International service intake",0.93,
    { kbMatches: [{ kbId: "KB-015", similarity: 0.96 }] } ),
  T("TKT-1067","2026-04-02","Luke Moore","luke_moore@gmail.com","email","materials_safety","EU safety certification","Does the strap meet EU REACH or RoHS standards? I'm based in Germany and need to confirm before purchasing.","resolved",true,false,"Health-Conscious Buyer","EU REACH/RoHS",0.95,
    { kbMatches: [{ kbId: "KB-002", similarity: 0.93 }] } ),
  T("TKT-1012","2026-04-04","Rahul Jones","rahulj@yahoo.com","chat","product_general","Watch size recommendation","I have a small wrist (15cm). Would the 40mm case look too big? Do you have a smaller option?","resolved",true,false,"—","Case-size recommendation",0.9,
    { kbMatches: [{ kbId: "KB-001", similarity: 0.86 }] } ),
  T("TKT-1024","2026-04-06","Liam Chan","liam43@hotmail.com","whatsapp","product_general","Sustainability practices","I care about sustainability. Can you tell me about Boldr's environmental practices and whether the packaging is recyclable?","resolved",true,false,"Sustainability Advocate","Sustainability practices",0.94,
    { kbMatches: [{ kbId: "KB-032", similarity: 0.79 }] } ),
  T("TKT-1039","2026-04-07","Ava Lee","aval@protonmail.com","whatsapp","materials_safety","Titanium vs stainless steel case","What's the practical difference between your titanium case and a standard stainless steel watch? Is titanium really lighter?","open",true,false,"Enthusiast / Collector","Titanium vs steel",0.93,
    { kbMatches: [{ kbId: "KB-001", similarity: 0.9 }] } ),
  T("TKT-1003","2026-04-09","Ethan Tan","ethan_tan@gmail.com","instagram_dm","materials_safety","Hypoallergenic claim","Your site says the watch is hypoallergenic. Does that apply to the strap as well or just the case?","pending_reply",true,false,"Health-Conscious Buyer","Hypoallergenic scope",0.94,
    { kbMatches: [{ kbId: "KB-004", similarity: 0.92 }] } ),
  T("TKT-1050","2026-04-12","Mei Mehta","mei_mehta@hotmail.com","instagram_dm","servicing","Scratches on case — can you polish?","My watch case has some light scratches. Can you polish it during a service?","pending_reply",true,false,"Enthusiast / Collector","Polishing service",0.94,
    { kbMatches: [{ kbId: "KB-014", similarity: 0.88 }] } ),
  T("TKT-1070","2026-04-19","Mila Yeo","mila_yeo@hotmail.com","email","knowledge_gap","Engraving in Arabic script","Can you engrave in Arabic? I want to put a dedication in Arabic for my father.","open",false,true,"Gifter","Arabic engraving",0.92,
    { isGap: true, autoDraftKb: { category: "Engraving", question: "Can Boldr engrave in Arabic script?", answer: "Yes. Arabic script engraving is supported at S$3.00 per character (up to 15 characters), the same rate as CJK characters. Right-to-left layout is handled by our engraver and a digital proof is sent for approval before engraving. Submit your text at checkout using Unicode characters." } }),
  T("TKT-1028","2026-04-22","Mei Davis","meid@icloud.com","email","knowledge_gap","Strap recycling programme","Do you have a strap recycling or take-back programme? I have three old straps I'd like to dispose of responsibly.","resolved",false,true,"Sustainability Advocate","Strap take-back",0.93,
    { isGap: true } ),
  T("TKT-1036","2026-04-27","Xin Moore","xin.moore@hotmail.com","instagram_dm","knowledge_gap","Vegan-friendly materials","Are all your straps vegan-friendly? I don't use any animal products and want to make sure the leather alternative is genuinely synthetic.","resolved",false,true,"Sustainability Advocate","Vegan strap availability",0.95,
    { isGap: true, autoDraftKb: { category: "Materials", question: "Which Boldr straps are vegan / contain no animal products?", answer: "Our FKM rubber, NATO nylon, recycled polyester, and titanium bracelet straps are 100% vegan. Our 'leather alternative' Cactus strap (launched Q2 2026) uses Desserto® cactus-leaf bio-leather — fully vegan and PETA-approved. Traditional leather straps (Horween Chromexcel and Italian calfskin) are NOT vegan; they are clearly tagged 'Leather' on product pages." } }),
  T("TKT-1019","2026-05-01","Zoey Teo","zoey62@protonmail.com","email","product_general","Wholesale or bulk order","We're a corporate client looking to order 20 watches as employee gifts. Do you offer bulk pricing?","open",true,false,"Gifter","Corporate / bulk order",0.91,
    { kbMatches: [{ kbId: "KB-021", similarity: 0.78 }] } ),
  T("TKT-1018","2026-05-02","Arjun Martin","arjun70@yahoo.com","whatsapp","strap_compatibility","Mesh bracelet compatibility","Do you sell a mesh/milanese bracelet for the Journey model? Or can I use a third-party one?","open",true,false,"Enthusiast / Collector","Mesh/milanese availability",0.92,
    { kbMatches: [{ kbId: "KB-009", similarity: 0.87 }] } ),
  T("TKT-1042","2026-05-02","Elizabeth Yeo","elizabeth_yeo@yahoo.com","chat","materials_safety","Water resistance and materials","If the watch is water resistant to 100m, does that mean the strap can be submerged too? What material is the strap?","pending_reply",true,false,"Active / Outdoor Buyer","Strap water tolerance",0.91,
    { kbMatches: [{ kbId: "KB-005", similarity: 0.89 }] } ),
  T("TKT-1056","2026-05-04","Lucas Mehta","lucas.mehta@outlook.com","instagram_dm","order_status","Tracking number not updating","My tracking number DHL9697354961 hasn't updated in 5 days. Is there a delay?","resolved",false,true,"—","Tracking carrier delay",0.85,
    { orderId: "BLD-27477" } ),
  T("TKT-1069","2026-05-05","Elizabeth Johnson","elizabethj@yahoo.com","email","engraving","Font options for engraving","Do you offer different font styles for engraving, or is it a fixed font? I'd like something more elegant.","open",true,false,"Gifter","Engraving font options",0.92,
    { kbMatches: [{ kbId: "KB-033", similarity: 0.88 }] } ),
  T("TKT-1027","2026-05-06","Sophia Patel","sophiap@gmail.com","chat","product_general","Gifting — personalisation options","What personalisation options do you offer for gifting? I want to make it special.","resolved",true,false,"Gifter","Gifting personalisation overview",0.93,
    { kbMatches: [{ kbId: "KB-021", similarity: 0.9 }, { kbId: "KB-024", similarity: 0.84 }] } ),
  T("TKT-1013","2026-05-10","Victoria Singh","victoria87@yahoo.com","chat","knowledge_gap","Carbon footprint of shipping","Do you offer carbon-neutral shipping? I try to offset my purchases where possible.","escalated",false,true,"Sustainability Advocate","Carbon-neutral shipping",0.94,
    { isGap: true, autoDraftKb: { category: "Sustainability", question: "Does Boldr offer carbon-neutral or offset shipping?", answer: "From May 2026, all international orders ship carbon-neutral via DHL GoGreen Plus at no additional cost to the customer — Boldr absorbs the offset purchase. Domestic Singapore orders use bicycle/EV courier where available. A per-order carbon receipt is included in your shipping confirmation email." } }),
  T("TKT-1055","2026-05-12","Scarlett Taylor","scarlett.taylor@gmail.com","whatsapp","order_status","Cancel order before shipping","I just placed order BLD-39256 and want to cancel it. It hasn't shipped yet. Is that possible?","pending_reply",false,true,"—","Order cancellation",0.84,
    { orderId: "BLD-65724" } ),
];

// --- KB ENTRIES ---
export type KbStatus = "Live" | "Pending approval" | "Auto-drafted";
export type KbSource = "Product Reference" | "FAQ" | "SOP" | "Engraving Rate Card" | "Servicing Rate Card";

export interface KbEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  source: KbSource;
  status: KbStatus;
  provenance?: string;
  createdDate: string;
}

export const kbEntries: KbEntry[] = [
  { id: "KB-001", category: "Models & Specs", source: "Product Reference", status: "Live", createdDate: "2025-03-12",
    question: "What grade of titanium do Boldr watches use?",
    answer: "Expedition 40mm uses Grade 5 titanium (Ti-6Al-4V). Journey 38mm uses Grade 2 commercially pure titanium. Both are hypoallergenic and nickel-free." },
  { id: "KB-002", category: "Materials", source: "FAQ", status: "Live", createdDate: "2025-04-02",
    question: "Are Boldr straps BPA-free and REACH/RoHS compliant?",
    answer: "All FKM rubber, silicone, and synthetic straps are BPA-free, phthalate-free, and certified to EU REACH and RoHS. Documentation available on request." },
  { id: "KB-003", category: "Materials", source: "FAQ", status: "Live", createdDate: "2025-04-02",
    question: "Are Boldr watches safe for children?",
    answer: "Materials are hypoallergenic and meet EU EN 71-3 toy-safety thresholds for migration of heavy metals. The 40mm case is large for a child's wrist — the 38mm Journey on a 20mm FKM strap fits wrists from 14cm." },
  { id: "KB-004", category: "Materials", source: "Product Reference", status: "Live", createdDate: "2025-05-18",
    question: "Do any metal parts contain nickel?",
    answer: "Titanium case, caseback, and crown contain zero nickel. The standard steel spring bars contain trace nickel (<0.5%) — nickel-free titanium spring bars are available on request at no charge." },
  { id: "KB-005", category: "Straps", source: "Product Reference", status: "Live", createdDate: "2025-02-08",
    question: "Which straps are suitable for swimming and diving?",
    answer: "FKM fluoroelastomer rubber and the titanium bracelet are fully submersible to 100m. NATO nylon is splash-safe but should be dried after swim use. Leather straps are not recommended for water." },
  { id: "KB-006", category: "Straps", source: "FAQ", status: "Live", createdDate: "2025-06-11",
    question: "What strap lengths are available, including extended sizes?",
    answer: "Standard FKM strap fits 14–20cm wrists. An XL strap (16–24cm) is available at checkout for no additional cost. Order notes can specify additional holes punched at no charge." },
  { id: "KB-007", category: "Materials", source: "FAQ", status: "Live", createdDate: "2025-06-25",
    question: "Are the strap dyes non-toxic and do they bleed onto skin?",
    answer: "All coloured FKM and silicone straps use AZO-free, REACH-compliant pigments fully bound in the polymer matrix — no dye transfer to skin or fabric even with heavy perspiration." },
  { id: "KB-008", category: "Straps", source: "Product Reference", status: "Live", createdDate: "2025-01-21",
    question: "Are straps interchangeable between the Expedition and Journey?",
    answer: "Expedition uses 22mm lug width; Journey uses 20mm. Straps are NOT cross-compatible. Both use quick-release spring bars — no tools required." },
  { id: "KB-009", category: "Straps", source: "Product Reference", status: "Live", createdDate: "2025-01-21",
    question: "What lug widths do Boldr watches use?",
    answer: "Expedition 40mm: 22mm lug. Journey 38mm: 20mm lug. Both support standard third-party straps and NATO bands." },
  { id: "KB-010", category: "Servicing", source: "Servicing Rate Card", status: "Live", createdDate: "2025-02-01",
    question: "How much is a battery replacement and how do I send the watch in?",
    answer: "S$35. Pack in original case if possible, ship to Boldr Service Desk, 71 Bras Basah Rd #03-12, Singapore 189555. Turnaround 3–5 working days. Includes water resistance check." },
  { id: "KB-011", category: "Servicing", source: "Servicing Rate Card", status: "Live", createdDate: "2025-02-01",
    question: "What is a regulation service and when do I need one?",
    answer: "S$85. Movement cleaning + timing-machine regulation to ±5s/day, with printed report. Recommended if your watch is drifting beyond ±15s/day." },
  { id: "KB-012", category: "Servicing", source: "Servicing Rate Card", status: "Live", createdDate: "2025-02-01",
    question: "What's the difference between regulation and a full service?",
    answer: "Regulation (S$85) adjusts timing only. Full Service Standard (S$160) is a complete disassembly, ultrasonic clean, re-lubrication, regulation, water test, light case polish, and new gaskets — recommended every 3–5 years." },
  { id: "KB-013", category: "Servicing", source: "Servicing Rate Card", status: "Live", createdDate: "2025-02-01",
    question: "How long does a full service take?",
    answer: "Standard and Premium full services: 14–21 working days. International servicing adds 7–14 days for inbound/outbound shipping." },
  { id: "KB-014", category: "Servicing", source: "Servicing Rate Card", status: "Live", createdDate: "2025-02-01",
    question: "What's included in the Full Service Standard vs Premium?",
    answer: "Standard (S$160): full clean, lubrication, regulation, 100m water test, light polish, new gaskets. Premium (S$220): adds deep polish, crystal replacement if scratched, new crown & pushers if worn, plus 12-month service warranty." },
  { id: "KB-015", category: "Servicing", source: "SOP", status: "Live", createdDate: "2025-03-15",
    question: "How do I send a watch in for international servicing?",
    answer: "Request a service form via service@boldrsupply.com — we email a pre-filled DHL Express label (customer pays inbound; Boldr covers insured return). Add the S$25 international surcharge at checkout. Declare 'Watch for repair — return to origin' on the customs form." },
  { id: "KB-016", category: "Servicing", source: "SOP", status: "Live", createdDate: "2025-03-15",
    question: "Is water resistance re-tested after a service?",
    answer: "Yes — every Full Service Standard and Premium includes a pressure test to the watch's rated depth (100m) and a written certificate. Battery replacements include a basic 5-bar test." },
  { id: "KB-017", category: "Servicing", source: "Servicing Rate Card", status: "Live", createdDate: "2025-02-01",
    question: "Is there a warranty on servicing work?",
    answer: "Full Service Premium includes a 12-month service warranty. A standalone Service Warranty Extension is available for S$30 covering re-regulation and minor adjustments." },
  { id: "KB-018", category: "Warranty", source: "FAQ", status: "Live", createdDate: "2025-01-10",
    question: "What does the watch warranty cover?",
    answer: "2-year international warranty on movement and case. Strap and crystal carry a separate 6-month manufacturing-defect warranty. Damage from impact, water past the rated depth, or unauthorised servicing is excluded." },
  { id: "KB-019", category: "Straps", source: "FAQ", status: "Live", createdDate: "2025-07-04",
    question: "How do I care for leather straps?",
    answer: "Wipe with a dry cloth after wear. Avoid prolonged water exposure. Condition every 3–4 months with a neutral leather balm. Replace at first sign of stitching wear." },
  { id: "KB-020", category: "Sales Policy", source: "FAQ", status: "Live", createdDate: "2025-01-10",
    question: "Does Boldr price-match other retailers?",
    answer: "No — we sell direct only. All direct orders include the 2-year warranty, factory water-test certificate, and free first-year servicing. Counterfeits exist; we recommend purchasing only from boldrsupply.com or authorised partners." },
  { id: "KB-021", category: "Gifting", source: "FAQ", status: "Live", createdDate: "2025-09-12",
    question: "Do you offer gift wrapping and gift boxes?",
    answer: "Yes — a complimentary linen-wrapped gift box is available at checkout. Handwritten note service is S$5. Corporate / bulk orders of 10+ units qualify for branded packaging at no charge." },
  { id: "KB-022", category: "Products", source: "Product Reference", status: "Live", createdDate: "2025-10-01",
    question: "Are limited edition pieces restocked once sold out?",
    answer: "LE pieces (Ember LE, Sapphire LE) are produced in a single run and not restocked. Waitlists are maintained for cancellations only." },
  { id: "KB-023", category: "Returns", source: "FAQ", status: "Live", createdDate: "2025-01-10",
    question: "What is your return policy?",
    answer: "30-day no-questions return on unworn watches in original packaging. Engraved and personalised pieces are non-returnable. Free return shipping within Singapore; international customers pay return postage." },
  { id: "KB-024", category: "Engraving", source: "Engraving Rate Card", status: "Live", createdDate: "2025-02-15",
    question: "How much does caseback engraving cost?",
    answer: "Up to 20 characters: S$25. 21–40 characters: S$40. Per additional character beyond 40: S$1.50 (max 60). Roman/Latin script." },
  { id: "KB-025", category: "Engraving", source: "Engraving Rate Card", status: "Live", createdDate: "2025-02-15",
    question: "Can I get a two-line engraving?",
    answer: "Yes — multi-line engraving (2 lines): S$35, includes up to 30 characters total across both lines." },
  { id: "KB-026", category: "Engraving", source: "Engraving Rate Card", status: "Live", createdDate: "2025-02-15",
    question: "Do you engrave Chinese, Japanese, or Korean characters?",
    answer: "Yes — CJK engraving: S$3.00 per character (up to 15 characters). A digital proof is sent for approval before engraving." },
  { id: "KB-027", category: "Engraving", source: "SOP", status: "Live", createdDate: "2025-04-22",
    question: "How deep is the engraving and will it fade?",
    answer: "Laser-engraved to 80 microns on titanium. The mark is permanent — it will not fade or polish out under normal wear. Light surface scratches around the engraving can be refinished during servicing without affecting the engraving itself." },
  { id: "KB-028", category: "Engraving", source: "SOP", status: "Live", createdDate: "2025-04-22",
    question: "How long does engraved-order fulfilment take?",
    answer: "Standard engraving adds 2 working days to dispatch. Rush engraving (same-day, if ordered before 12pm SGT) is available for S$20 — confirmation via reply to your order email." },
  { id: "KB-029", category: "Engraving", source: "Engraving Rate Card", status: "Live", createdDate: "2025-02-15",
    question: "Can the strap buckle be engraved?",
    answer: "Yes — metal buckles can be engraved up to 10 characters for S$15. Not available on rubber, FKM, or NATO straps." },
  { id: "KB-030", category: "Engraving", source: "Engraving Rate Card", status: "Live", createdDate: "2025-02-15",
    question: "Can I engrave a logo or symbol?",
    answer: "Yes — vector logo/symbol engraving is S$60. Customer must supply a vector file (.ai or .svg) and approve a digital proof before engraving begins." },
  { id: "KB-031", category: "Engraving", source: "SOP", status: "Live", createdDate: "2025-05-09",
    question: "Can I correct an engraving after submitting the order?",
    answer: "Yes — free of charge if requested within 1 hour of order placement. After 1 hour: S$15 correction fee, subject to whether engraving has started." },
  { id: "KB-032", category: "Sustainability", source: "FAQ", status: "Live", createdDate: "2025-08-14",
    question: "What are Boldr's sustainability practices?",
    answer: "Recycled-paper packaging (no plastic since 2024). Titanium swarf from CNC operations is recycled. Repair-over-replace policy in all warranty work. Carbon-neutral shipping coming May 2026." },
  { id: "KB-033", category: "Engraving", source: "SOP", status: "Pending approval", createdDate: "2026-04-30",
    question: "What font options are available for engraving?",
    answer: "Three fonts: Boldr Sans (default sans-serif), Roman Serif (classical), and Script Italic (handwritten). Mixed fonts within a single engraving are not supported." },

  // Auto-drafted (queued, born from gaps)
  { id: "KB-100", category: "Movement & Specs", source: "Product Reference", status: "Auto-drafted", createdDate: "2025-11-15",
    provenance: "born from TKT-1046 · 15 Nov 2025",
    question: "Are Boldr movements resistant to magnetic fields (MRI, industrial equipment)?",
    answer: "The Miyota 9039 automatic movement is rated to ~60 gauss — sufficient for everyday electronics but NOT for direct MRI exposure. Remove the watch before entering an MRI suite." },
  { id: "KB-101", category: "Materials", source: "FAQ", status: "Auto-drafted", createdDate: "2025-12-04",
    provenance: "born from TKT-1021 · 4 Dec 2025",
    question: "What luminous material is used on Boldr dials and is it safe?",
    answer: "Swiss Super-LumiNova® Grade X1 (BGW9). Non-radioactive, photo-luminescent only, certified to EU REACH and RoHS, sealed under sapphire — no skin contact path." },
  { id: "KB-102", category: "Field Performance", source: "Product Reference", status: "Auto-drafted", createdDate: "2025-12-19",
    provenance: "born from TKT-1065 · 19 Dec 2025",
    question: "How do Boldr watches perform at high altitude (≥4,000m)?",
    answer: "Operate within spec up to 6,000m. Keep the crown screwed down during ascent/descent. Lubricants rated –10°C to +60°C." },
  { id: "KB-103", category: "Engraving", source: "Engraving Rate Card", status: "Auto-drafted", createdDate: "2026-04-19",
    provenance: "born from TKT-1070 · 19 Apr 2026",
    question: "Can Boldr engrave in Arabic script?",
    answer: "Yes — S$3.00 per character, up to 15 characters. Right-to-left layout handled by the engraver; digital proof sent before engraving." },
  { id: "KB-104", category: "Materials", source: "Product Reference", status: "Auto-drafted", createdDate: "2026-04-27",
    provenance: "born from TKT-1036 · 27 Apr 2026",
    question: "Which Boldr straps are vegan / contain no animal products?",
    answer: "FKM rubber, NATO nylon, recycled polyester, and titanium bracelet are 100% vegan. The Cactus strap (Q2 2026) uses Desserto® cactus-leaf bio-leather, PETA-approved." },
  { id: "KB-105", category: "Sustainability", source: "FAQ", status: "Auto-drafted", createdDate: "2026-05-10",
    provenance: "born from TKT-1013 · 10 May 2026",
    question: "Does Boldr offer carbon-neutral shipping?",
    answer: "From May 2026, all international orders ship carbon-neutral via DHL GoGreen Plus — Boldr absorbs the offset cost. Per-order carbon receipt in the shipping confirmation." },
];

// --- KB growth over time (months Nov 2025 → May 2026) ---
export const kbGrowth = [
  { month: "Nov 2025", entries: 27 },
  { month: "Dec 2025", entries: 29 },
  { month: "Jan 2026", entries: 31 },
  { month: "Feb 2026", entries: 32 },
  { month: "Mar 2026", entries: 33 },
  { month: "Apr 2026", entries: 36 },
  { month: "May 2026", entries: 39 },
];

// --- THEMES (locked to brief's page-4 taxonomy) ---
export type Verdict = "Boldr-Specific Gap" | "Market-Wide Opportunity";
export interface Theme {
  name: string;
  internalCount: number;
  trend: "up" | "down" | "flat";
  trendPct: number;
  dominantPersona: Persona;
  externalVolume: number; // mention count across sources
  externalSentiment: "positive" | "neutral" | "negative" | "mixed";
  verdict: Verdict;
  recommendedAction: string;
  briefNote: string;
}

export const themes: Theme[] = [
  { name: "BPA-Free Straps", internalCount: 3, trend: "up", trendPct: 50,
    dominantPersona: "Health-Conscious Buyer", externalVolume: 18,
    externalSentiment: "positive", verdict: "Market-Wide Opportunity",
    recommendedAction: "Add 'BPA-Free' badge to all FKM/silicone PDPs and surface in nav filter.",
    briefNote: "Parents shopping for kids/teens cite BPA explicitly; competitors are silent." },
  { name: "Titanium Safety", internalCount: 5, trend: "up", trendPct: 25,
    dominantPersona: "Enthusiast / Collector", externalVolume: 42,
    externalSentiment: "mixed", verdict: "Market-Wide Opportunity",
    recommendedAction: "Publish a Grade 2 vs Grade 5 explainer; add hypoallergenic + nickel-free badges to titanium PDPs.",
    briefNote: "Grade-5 alloy questions are dominant on enthusiast forums; clear language wins the search query." },
  { name: "Sustainability", internalCount: 4, trend: "up", trendPct: 100,
    dominantPersona: "Sustainability Advocate", externalVolume: 27,
    externalSentiment: "negative", verdict: "Boldr-Specific Gap",
    recommendedAction: "Launch carbon-neutral shipping (queued May 2026) + ship a Sustainability page within 30 days.",
    briefNote: "Forum chatter calls Boldr 'quiet on eco' vs visible competitor programmes." },
  { name: "Nickel Allergy", internalCount: 2, trend: "flat", trendPct: 0,
    dominantPersona: "Health-Conscious Buyer", externalVolume: 31,
    externalSentiment: "negative", verdict: "Boldr-Specific Gap",
    recommendedAction: "Add a 'Nickel-Free' filter and offer free titanium spring bars at checkout.",
    briefNote: "External r/Allergies threads cite nickel anxiety; our PDP buries the answer in FAQ." },
  { name: "Vegan Straps", internalCount: 3, trend: "up", trendPct: 200,
    dominantPersona: "Sustainability Advocate", externalVolume: 22,
    externalSentiment: "positive", verdict: "Market-Wide Opportunity",
    recommendedAction: "Lead Q2 launch with the Cactus strap and tag every non-leather strap as 'Vegan' on PDP.",
    briefNote: "Demand growing 200% MoM internally; external sentiment unanimously positive toward cactus/bio leather." },
];

// --- EXTERNAL SOURCES ---
export interface ExternalQuote {
  author: string;
  source: string;
  date: string;
  theme: string;
  sentiment: "positive" | "neutral" | "negative";
  text: string;
}

export interface ExternalSource {
  id: string;
  name: string;
  justification: string;
  quotes: ExternalQuote[];
}

export const externalSources: ExternalSource[] = [
  { id: "src-watch",
    name: "r/Watches + WatchUSeek forums",
    justification: "Where Boldr's enthusiast/collector core hangs out. Captures titanium-grade debate, micro-brand sentiment, strap and movement chatter.",
    quotes: [
      { author: "u/GradeFiveSnob", source: "r/Watches", date: "2026-03-04", theme: "Titanium Safety", sentiment: "positive", text: "Most 'titanium' micro-brands quietly use Grade 2. Boldr's Expedition is one of the few sub-$500 pieces actually using Grade 5 — and they document it." },
      { author: "WUS_user_kallisti", source: "WatchUSeek", date: "2026-02-19", theme: "Titanium Safety", sentiment: "negative", text: "Wish Boldr would just put 'Grade 5' on the product page instead of making you DM them. Two weeks of forum debate for what should be one line of copy." },
      { author: "u/MidoFan", source: "r/Watches", date: "2026-01-30", theme: "Vegan Straps", sentiment: "positive", text: "Cactus leather straps from a few micros now. Genuinely indistinguishable from chromexcel after a year. Boldr should jump on this." },
      { author: "u/TiToolWatch", source: "r/Watches", date: "2026-04-11", theme: "Sustainability", sentiment: "negative", text: "Boldr's product is great but they're invisible on sustainability vs competitors who publish carbon reports." },
    ] },
  { id: "src-health",
    name: "r/Allergies + r/SkincareAddiction + Trustpilot mining",
    justification: "Captures nickel / BPA / skin-reaction sentiment from health-conscious consumers, a signal watch forums underweight. Validates whether the nickel-allergy product-page gap is market-wide.",
    quotes: [
      { author: "u/HivesMoreLikely", source: "r/Allergies", date: "2026-02-22", theme: "Nickel Allergy", sentiment: "negative", text: "Spent 40 mins on a watch site trying to find out if the buckle had nickel. Gave up and bought from a brand that just said 'nickel-free' in one click." },
      { author: "GoldNeenah · Trustpilot", source: "Trustpilot", date: "2026-03-30", theme: "BPA-Free Straps", sentiment: "positive", text: "Bought the FKM strap for my 7-year-old's smartwatch. Brand confirmed BPA-free in writing. Wish more brands led with this." },
      { author: "u/ParentSkinSensitive", source: "r/SkincareAddiction", date: "2026-01-18", theme: "Nickel Allergy", sentiment: "neutral", text: "Titanium watches are the move if your skin reacts. But spring bars are still usually steel — check before you buy." },
      { author: "u/BabysBPAhunt", source: "r/Parenting", date: "2026-04-05", theme: "BPA-Free Straps", sentiment: "positive", text: "Silicone watch straps for kids are mostly BPA-free now but you have to dig. Wishlist: a filter for it." },
    ] },
  { id: "src-eco",
    name: "Competitor review pages + r/BuyItForLife / r/ZeroWaste",
    justification: "Vegan-strap and eco-packaging demand, plus a 'is a competitor already doing this?' check. Tests whether sustainability is a Boldr gap or untapped market opportunity.",
    quotes: [
      { author: "u/RepairOverReplace", source: "r/BuyItForLife", date: "2026-03-12", theme: "Sustainability", sentiment: "positive", text: "Bought a competitor brand specifically because they take old straps back and recycle the rubber. Tiny thing, huge loyalty driver." },
      { author: "u/ZeroWasteWatcher", source: "r/ZeroWaste", date: "2026-04-02", theme: "Sustainability", sentiment: "negative", text: "Asked three micro-brands about take-back programmes. Only one answered. Massive trust signal when they do." },
      { author: "u/VeganMechanical", source: "r/BuyItForLife", date: "2026-04-19", theme: "Vegan Straps", sentiment: "positive", text: "Cactus and mushroom-leather straps are finally hitting tool-watch quality. Whoever ships this first in the micro segment wins my wallet." },
      { author: "Competitor PDP review · MK", source: "competitor.com", date: "2026-02-04", theme: "Vegan Straps", sentiment: "positive", text: "Five-star: 'Vegan strap is the reason I bought. Stop selling leather to people who want a Boldr-style tool watch but with ethics.'" },
    ] },
];

// --- MONTHLY MARKETING BRIEF ---
export interface BriefItem {
  theme: string;
  personas: Persona[];
  gap: string;
  action: string;
}

export const monthlyBrief = {
  month: "May 2026",
  title: "What customers are asking that is not on your product pages",
  intro: "5 themes surfaced from 70 tickets and 3 external sources this month. Each maps a customer question to a product-page gap and a campaign action.",
  items: [
    { theme: "BPA-Free Straps", personas: ["Health-Conscious Buyer", "Gifter"],
      gap: "BPA status not stated on FKM/silicone PDPs.",
      action: "Add a 'BPA-Free' badge to every applicable PDP this sprint. Run a Father's Day gift campaign that leads with safety messaging for kids-gifting." } as BriefItem,
    { theme: "Titanium Safety", personas: ["Enthusiast / Collector", "Health-Conscious Buyer"],
      gap: "Grade 2 vs Grade 5 not disclosed per-model.",
      action: "Publish a 200-word 'Why Grade 5' explainer; add a per-PDP titanium-grade field." } as BriefItem,
    { theme: "Sustainability", personas: ["Sustainability Advocate"],
      gap: "No public sustainability page; carbon shipping not surfaced.",
      action: "Ship a /sustainability page within 30 days. Promote the May carbon-neutral shipping launch in the next newsletter." } as BriefItem,
    { theme: "Nickel Allergy", personas: ["Health-Conscious Buyer"],
      gap: "Standard spring bars are steel; not stated on PDP.",
      action: "Offer free titanium spring bars at checkout; add a 'Nickel-Free' filter to the strap collection." } as BriefItem,
    { theme: "Vegan Straps", personas: ["Sustainability Advocate", "Enthusiast / Collector"],
      gap: "No vegan filter; Cactus strap not yet launched in EU.",
      action: "Launch Cactus strap globally in Q2. Tag every non-leather strap as 'Vegan' in collection nav." } as BriefItem,
  ] as BriefItem[],
};

// --- KB SOURCES META ---
export const kbSources: { name: KbSource; description: string }[] = [
  { name: "Product Reference", description: "Models, materials, specs, lug widths." },
  { name: "FAQ", description: "28 customer-facing Q&A entries." },
  { name: "SOP", description: "Internal procedures: returns, service intake, escalation." },
  { name: "Engraving Rate Card", description: "Engraving service pricing and lead times." },
  { name: "Servicing Rate Card", description: "Battery, regulation, full service tiers." },
];

// --- COPILOT canned responses ---
export interface CopilotResponse {
  prompt: string;
  insight: string;
  citations: { type: "ticket" | "external"; id: string; label: string; quote?: string }[];
}

export const copilotResponses: CopilotResponse[] = [
  { prompt: "What are people saying about titanium straps?",
    insight: "Internal: 5 tickets this quarter focus on titanium grade and nickel content (TKT-1060, TKT-1032, TKT-1039). The recurring confusion is Grade 2 vs Grade 5 — customers can't find this on the PDP. External: enthusiast forums applaud Boldr's Grade 5 disclosure when it's offered, but criticise its absence from product pages. Recommended action: surface titanium grade as a top-level PDP attribute.",
    citations: [
      { type: "ticket", id: "TKT-1060", label: "Harper Taylor · Titanium grade on Expedition" },
      { type: "ticket", id: "TKT-1032", label: "Benjamin Lee · Nickel in buckle alloy" },
      { type: "external", id: "GradeFiveSnob", label: "r/Watches — u/GradeFiveSnob",
        quote: "Boldr's Expedition is one of the few sub-$500 pieces actually using Grade 5 — and they document it." },
    ] },
  { prompt: "What complaints are rising externally vs internally?",
    insight: "Sustainability is the largest gap: 4 internal tickets but 27 external mentions — a 6.75× external-to-internal multiplier. Forum chatter labels Boldr 'quiet on eco' versus competitors who publish carbon reports and run take-back programmes. Internally, the signal is muted because customers don't bother asking what they assume doesn't exist. Vegan strap demand shows the same shape: 3 internal, 22 external.",
    citations: [
      { type: "ticket", id: "TKT-1013", label: "Victoria Singh · Carbon-neutral shipping" },
      { type: "ticket", id: "TKT-1028", label: "Mei Davis · Strap recycling programme" },
      { type: "external", id: "TiToolWatch", label: "r/Watches — u/TiToolWatch",
        quote: "Boldr's product is great but they're invisible on sustainability vs competitors who publish carbon reports." },
    ] },
  { prompt: "Compare Boldr sentiment vs competitors.",
    insight: "Boldr leads on craftsmanship (Grade 5 titanium, Miyota 9039) and after-sales (free first-year service). Competitors lead on visible sustainability (published carbon reports, strap take-back) and on vegan strap availability. The narrowest gap to close in 30 days: ship the Sustainability page and promote the May 2026 carbon-neutral shipping launch.",
    citations: [
      { type: "external", id: "RepairOverReplace", label: "r/BuyItForLife — u/RepairOverReplace",
        quote: "Bought a competitor brand specifically because they take old straps back and recycle the rubber." },
      { type: "external", id: "VeganMechanical", label: "r/BuyItForLife — u/VeganMechanical",
        quote: "Whoever ships this first in the micro segment wins my wallet." },
      { type: "ticket", id: "TKT-1024", label: "Liam Chan · Sustainability practices" },
    ] },
];

// helpers
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
