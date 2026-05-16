# Boldr Intelligence Engine

A self-improving customer intelligence platform for Boldr, a Shopify-based watch micro-brand.

Built for the **Echelon 2026 AI Workflow Competition**, this platform transforms customer support emails into:

1. AI-assisted customer replies
2. A self-improving knowledge base
3. Product and marketing intelligence
4. External market sentiment benchmarking

The goal is not to build a chatbot.  
The goal is to turn every customer question into reusable operational knowledge and marketing signal.

---

## Problem

Boldr receives customer enquiries about detailed product, material, customisation, and servicing questions, such as:

- Are the straps BPA-free?
- Are the watches safe for people with nickel allergies?
- Can the caseback be engraved in Arabic script?
- Are the movements resistant to magnetic fields?
- Do you offer express shipping?
- What servicing options are available?

Before this system, the CS team had to manually read each email, search internal documents, write replies, escalate unknown questions, and sometimes update the FAQ afterwards.

This creates three problems:

1. **Repeated manual work**  
   Similar questions are answered again and again.

2. **Knowledge gaps are not captured systematically**  
   Novel questions get answered once, then disappear into the inbox.

3. **Customer questions do not become marketing intelligence**  
   Support tickets contain signals about buyer concerns, product-page gaps, and campaign opportunities.

---

## Solution

**Boldr Intelligence Engine** creates a closed feedback loop:

```text
Customer Email
    ↓
AI Triage
    ↓
Knowledge Base Search
    ↓
Answerable?
    ├── Yes → Draft Reply → Human Approval → Send
    └── No  → Flag Knowledge Gap → Human Answer → Auto-Draft KB Entry → Approval
    ↓
Theme Clustering
    ↓
Marketing Brief + External Sentiment Benchmark
````

Every ticket does one of three things:

1. Gets answered from existing knowledge
2. Improves the knowledge base
3. Becomes a product or marketing insight

---

## Key Features

### 1. Email Ops Workspace

The Email Ops page is the CS team's working inbox.

It shows:

* Incoming customer tickets
* AI-classified intent
* Support lane
* Buyer persona
* Ticket status
* Knowledge gap detection
* Escalation status
* Draft reply workflow

The AI triage layer classifies each ticket into the correct handling path.

Example lanes:

* Knowledge Base
* Shopify Ops
* Servicing
* Product General
* Materials & Safety
* Engraving
* Strap Compatibility

---

### 2. AI Triage

For every incoming ticket, the AI extracts:

* Customer intent
* Question category
* Relevant buyer persona
* Required support lane
* Whether the ticket is answerable from the KB
* Whether escalation is required

If the AI cannot find a confirmed answer, it does not hallucinate.
It flags the ticket as a knowledge gap and routes it to CS for human resolution.

---

### 3. Human-in-the-Loop Reply Drafting

When a customer question is answerable, the system drafts a reply in Boldr's customer support tone.

When a question is not answerable, the CS team writes the canonical answer once.

The same human-approved answer can then be used to:

* Reply to the customer
* Create a draft KB entry
* Resolve future similar questions automatically

This keeps humans in control while reducing repeated manual work.

---

### 4. Self-Improving Knowledge Base

The Knowledge Base is the core intelligence layer.

It includes entries from:

* FAQ documents
* Product reference documents
* CS SOPs
* Servicing rate cards
* Engraving rate cards
* Spreadsheets and structured source files
* Auto-drafted entries from resolved customer gaps

Source documents are synced from Google Drive every 5 minutes.

The system:

1. Loads active KB sources
2. Fetches source content from Google Drive
3. Parses documents and spreadsheets
4. Normalises content into categories
5. Updates the KB database
6. Marks stale entries
7. Exposes updated KB content to Email Ops and AI search

When a knowledge gap is resolved, the system creates a new draft KB entry with provenance, such as:

```text
Born from TKT-1046 · 15 Nov 2025
```

CS can approve or edit the draft before it becomes live.

---

### 5. Knowledge Gap Loop

The knowledge gap workflow follows this logic:

```text
Customer asks new question
    ↓
AI searches KB
    ↓
No confirmed answer found
    ↓
Ticket is flagged as a knowledge gap
    ↓
CS writes canonical answer
    ↓
System creates customer reply
    ↓
System auto-drafts KB entry
    ↓
CS approves entry
    ↓
Future similar questions are answered from KB
```

This is what makes the KB self-improving.

The system improves because every unresolved customer question becomes reusable knowledge after human confirmation.

---

### 6. Marketing Intelligence

The Marketing Intelligence page turns customer support data into business insight.

It clusters tickets by recurring themes, such as:

* BPA-Free Straps
* Titanium Safety
* Sustainability
* Nickel Allergy
* Vegan Straps
* Servicing
* Engraving
* Strap Compatibility

The system identifies:

* Ticket volume by theme
* Trend movement
* Dominant buyer persona
* Knowledge gaps
* Product-page gaps
* Recommended marketing actions

It then generates a monthly marketing brief:

```text
What customers are asking that is not on your product pages
```

This helps Boldr turn support questions into product-page improvements, FAQ updates, and campaign angles.

---

### 7. Buyer Persona Tagging

Each ticket is tagged against one of five buyer personas:

| Persona                 | Example Signals                                                           |
| ----------------------- | ------------------------------------------------------------------------- |
| Health-Conscious Buyer  | BPA-free, nickel-free, hypoallergenic, skin safety, MRI-related questions |
| Gifter                  | Engraving, gift wrap, birthday, anniversary, urgent delivery              |
| Enthusiast / Collector  | Titanium grade, Miyota movement, limited editions, specs                  |
| Active / Outdoor Buyer  | Water resistance, hiking, trail running, strap durability                 |
| Sustainability Advocate | Vegan straps, carbon-neutral shipping, eco-packaging, recycled materials  |

Persona tagging feeds into the marketing brief so Boldr can understand not just what customers are asking, but who is asking.

---

### 8. External Sentiment Benchmarking

The External Sentiment page compares Boldr's internal customer signals against wider market sentiment.

External sources include:

* Reddit communities
* WatchUSeek forums
* Trustpilot reviews
* Competitor review pages

The system compares internal and external signals across themes such as:

* BPA-free straps
* Titanium safety
* Sustainability
* Nickel allergy
* Vegan straps

For each theme, it answers:

```text
Is this a Boldr-specific gap or a market-wide opportunity?
What should Boldr do about it?
```

Example output:

| Theme           | Internal Signal | External Signal | Verdict                 |
| --------------- | --------------: | --------------: | ----------------------- |
| Titanium Safety |          Medium |            High | Market-Wide Opportunity |
| Nickel Allergy  |             Low |            High | Product-Page Gap        |
| Sustainability  |          Medium |            High | Market-Wide Opportunity |
| BPA-Free Straps |          Medium |          Medium | Marketing Opportunity   |
| Vegan Straps    |        Emerging |          Rising | New Segment Opportunity |

---

### 9. Ask Your Data Assistant

The Insights AI Assistant lets the team ask questions across internal and external data.

Example question:

```text
What complaints are rising externally vs internally?
```

The assistant retrieves:

* Internal ticket evidence
* External sentiment sources
* Theme benchmark data
* Relevant citations

It then generates a cited answer so the team can verify the recommendation.

This makes the insight layer explainable rather than a black-box AI summary.

---

## Platform Architecture

The platform has three main layers:

```text
Frontend Workspace
    ↓
AI Workflow Layer
    ↓
Knowledge + Ticket + Sentiment Data Layer
```

### Frontend Workspace

The frontend provides four main user-facing modules:

1. **Email Ops**
   CS triage, ticket handling, draft replies, gap resolution

2. **Knowledge Base**
   Live KB entries, source documents, pending approvals, auto-drafted entries

3. **Marketing Intelligence**
   Theme clustering, persona analysis, trend detection, monthly brief generation

4. **External Sentiment**
   Internal vs external signal comparison, source quotes, benchmark verdicts

---

## Workflow Studio Architecture

The backend intelligence layer is split into six workflows.

### 1. Boldr Main Workflow

Handles the main customer support loop.

Flow:

```text
Gmail Trigger
    ↓
Classify
    ↓
Switch
    ├── Send Approved Email
    ├── Extract Knowledge
    │       ↓
    │   Create Embedding
    │       ↓
    │   Output Parser
    │       ↓
    │   Store Knowledge
    │       ↓
    │   Send Revised Email
    └── Process Inquiry
            ↓
        Format Response
            ↓
        Confirmed Knowledge?
            ├── Yes → Seek Knowledge
            └── No  → Prepare Approval → Seek Approval
```

Responsibilities:

* Ingest customer enquiries
* Classify tickets
* Search knowledge
* Format replies
* Route uncertain cases to approval
* Send approved emails
* Store new knowledge

---

### 2. Knowledge Base Auto-Sync Workflow

Keeps the KB current from Google Drive sources.

Flow:

```text
Sync Every 5 Minutes
    ↓
Load Active KB Sources
    ↓
For Each Source
    ↓
Fetch Drive Content
    ↓
Parse Source Content
    ↓
Normalize & Categorize
    ↓
Upsert KB Entries
    ↓
Mark Stale Entries
    ↓
Collect Sync Results
    ↓
Calculate Sync Stats
    ↓
Update Sync Run Log
    ↓
Update Source Status
    ↓
Expose KB to Surfaces
```

Also includes ticket-level KB matching:

```text
On Customer Ticket
    ↓
AI Match & Grounded Response
    ↓
KB Match Found?
    ├── Yes → Format Grounded Response
    └── No  → Log Knowledge Gap
```

And gap resolution:

```text
On Gap Resolved
    ↓
Auto-Draft KB Entry
    ↓
Save Drafted Entry for Approval
```

Responsibilities:

* Auto-sync source docs
* Parse and normalise KB content
* Upsert latest KB entries
* Detect stale entries
* Match tickets against KB
* Log knowledge gaps
* Auto-draft KB entries after human resolution

---

### 3. Backend API Data Sync Layer

Provides the backend sync layer between workflows, database, and frontend surfaces.

Flow examples:

```text
Knowledge Base Sync Webhook
    ↓
Update Knowledge Base
```

```text
Ticket Ingestion Trigger
    ↓
Store Ticket Data in DB
```

```text
Sentiment Refresh Trigger
    ↓
Update Sentiment Data
```

Responsibilities:

* Store ticket data
* Update knowledge base records
* Refresh sentiment records
* Keep frontend pages stateful
* Support demo-safe operational data flows

---

### 4. Insights AI Assistant with Dual Search

Powers the Ask Your Data panel.

Flow:

```text
Ask Insights AI
    ↓
Parse User Question
    ↓
Retrieve Internal Tickets
    ↓
Retrieve External Sources
    ↓
Retrieve Theme Benchmarks
    ↓
Rank Evidence
    ↓
AI Generate Cited Answer
    ↓
Return Answer + Citations
```

Responsibilities:

* Understand user questions
* Search internal tickets
* Search external sentiment data
* Rank evidence
* Generate cited answers
* Make insights explainable

---

### 5. Marketing Intelligence Workflow

Generates the Marketing Intelligence dashboard and monthly brief.

Flow:

```text
Trigger: UI Request
    ↓
Load Internal Tickets
    ↓
Load External Sentiment
    ↓
Filter Known / Resolved Questions
    ↓
Theme Clustering
    ↓
Persona Analysis
    ↓
Trend Calculation
    ↓
Synthesize Gaps
    ↓
Match External Concerns
    ↓
Generate Marketing Brief
    ↓
Recommend Actions
    ↓
Cache Marketing Insights
```

Responsibilities:

* Cluster tickets by theme
* Detect rising trends
* Identify dominant buyer personas
* Compare internal signals with external concerns
* Generate marketing briefs
* Recommend product-page and campaign actions

---

### 6. External Sentiment Analysis Workflow

Fetches and classifies external market signals.

Flow:

```text
Trigger Sentiment Sync
    ↓
Define Search Terms
    ↓
For Each Search Term
    ↓
Fetch Content
    ↓
Extract Quotes
    ↓
For Each Quote
    ↓
AI Classify Sentiment
    ↓
Combine and Sanitize Results
    ↓
Store Result in DB
```

Responsibilities:

* Search external sources
* Extract relevant quotes
* Classify sentiment
* Map external quotes to themes
* Store benchmark data
* Support internal vs external comparison

---

## Data Sources

### Internal Sources

The system uses the six provided Boldr source files:

| Source                     | Role                                                    |
| -------------------------- | ------------------------------------------------------- |
| Customer tickets CSV       | Primary inbound customer enquiry data                   |
| Product reference document | Product specs, materials, strap catalogue, safety flags |
| Engraving rate card        | Engraving prices, limits, scripts, turnaround           |
| Servicing rate card        | Battery, regulation, full service, pricing, turnaround  |
| FAQ document               | Existing customer-facing answers                        |
| CS SOP                     | Escalation rules, tone guidelines, handling process     |

These source documents are maintained in Google Drive and synced every 5 minutes.

### External Sources

The external benchmarking layer uses:

| Source             | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| Reddit             | Broader customer concerns and buyer discussions         |
| WatchUSeek         | Watch enthusiast and collector sentiment                |
| Trustpilot         | Review-based customer satisfaction and service feedback |
| Competitor reviews | Market comparison and unmet buyer expectations          |

---

## Example Use Case: Magnetic Field Resistance

### 1. Customer asks:

```text
Is the movement resistant to magnetic fields? I work near MRI equipment.
```

### 2. AI triage identifies:

```text
Intent: Magnetic field resistance
Lane: Knowledge gap
Persona: Health-Conscious Buyer
Requires escalation: Yes
```

### 3. AI searches the KB

No confirmed answer is found.

The system flags:

```text
Knowledge gap — needs your answer
AI couldn't answer from the KB and did not guess.
```

### 4. CS writes the canonical answer

CS provides the approved answer and marks the source of truth.

### 5. System creates two outputs

```text
Customer reply
+
Draft KB entry
```

### 6. KB entry appears for approval

The KB card includes:

```text
Auto-drafted
Born from TKT-1046
Pending approval
```

### 7. Future similar tickets are answered from KB

Once approved, the knowledge base has improved and the same question no longer needs manual escalation.

---

## Example Use Case: Marketing Intelligence

Customer tickets reveal repeated questions around:

* Titanium safety
* Sustainability
* Vegan straps
* Nickel allergy
* BPA-free straps

The system clusters these questions and generates a marketing brief.

Example recommendation:

```text
Add a dedicated titanium safety section to product pages and FAQs.
Clarify hypoallergenic properties, movement resistance, and material grade details.
```

This turns customer support into product marketing intelligence.

---

## Requirement Coverage

| Requirement                                | Status    |
| ------------------------------------------ | --------- |
| Ingest customer enquiry                    | Completed |
| Extract intent and context                 | Completed |
| Search KB documents                        | Completed |
| Draft reply if answerable                  | Completed |
| Human approval before sending              | Completed |
| Flag knowledge gaps                        | Completed |
| Avoid hallucinated answers                 | Completed |
| Auto-draft KB entry after human resolution | Completed |
| Sync KB from source documents              | Completed |
| Theme clustering                           | Completed |
| Monthly marketing brief                    | Completed |
| Buyer persona tagging                      | Completed |
| External sentiment benchmarking            | Completed |
| 2+ external sources                        | Completed |
| 3+ theme comparison                        | Completed |
| Actionable insight per theme               | Completed |
| Ask-your-data assistant with citations     | Completed |

---

## Why This Scales Beyond Boldr

This workflow is not specific to watches.

The same pattern can be reused for any brand with:

* Detailed product knowledge
* Repeated customer questions
* A growing FAQ
* A small CS team
* Shopify or e-commerce operations
* Product-page gaps
* Emerging buyer concerns

Examples:

* Specialty food
* Skincare
* Cosmetics
* Outdoor gear
* Consumer electronics
* Fashion accessories
* Hobbyist products

The reusable pattern is:

```text
Classify → Retrieve → Draft → Escalate → Learn → Cluster → Recommend
```

---

## Demo Notes

Recommended demo order:

1. Workflow Studio overview
2. Email Ops inbox
3. AI triage panel
4. Knowledge gap example
5. Human answer + Save KB & Reply
6. Knowledge Base auto-drafted entry
7. KB auto-sync workflow
8. Marketing Intelligence dashboard
9. External Sentiment benchmarking
10. Ask Your Data assistant

Closing line:

```text
Every support ticket now either gets answered, improves the knowledge base, or becomes a marketing signal.
```

---

## Status

Prototype built for the Echelon 2026 AI Workflow Competition.

Current mode:

```text
Demo-ready prototype
```

Some operational connectors may use mock/demo data layers for safe demonstration, while the architecture is designed to support live integrations such as Gmail, Google Drive, Shopify, and external sentiment sources.

```
```
