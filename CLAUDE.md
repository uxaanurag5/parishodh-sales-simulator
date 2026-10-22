# Parishodh — Live Sales Simulation Platform

## Product
Parishodh (by Esimaa) is a learning-to-capability platform. A sales learner finishes a training course and a final assessment, then gets a "Live Task": a simulated customer phone call. An AI "Trainer Emulation Layer" plays the customer. A "Judgment Engine" scores the learner live against capability criteria. The output is a Live Capability Score that sits next to the course score ("Knows the material" → "Can do the job").
Tagline: "Learn. Practice. Simulate. Measure Capability."

## Roles
- Learner (Sales User), e.g. Aarav Mehta, "Sales User · Automotive Sales Team"
- Trainer/Admin: creates scenarios and rubrics, assigns live tasks, sees reports

## Core flow
1. Learner dashboard (My Learning) shows the assigned course with progress (e.g. "Basic Training Package · Automotive Sales Fundamentals · 8 modules", 8/8, 100%, badge "Basic Package Completed") and the Final Assessment card ("25 questions", big "80%" score, badge "Final Assessment: 80% Passed"). Header status pill: "In Progress" → "Course Completed" → "Live Task Assigned".
2. A Live Task card appears with a "LIVE" pill, the title "Parishodh | Live Sales Simulation" and a "Start Simulation" button. It shows: Trainee, Scenario (e.g. Mahindra EV 9S Purchase), Customer Intent (Purchase within 3 weeks), Preferred Colour (White), Objective ("Understand customer requirements and guide the customer toward purchase/delivery").
3. Start Simulation opens the Call Workspace in the "Waiting" state. Then an "Incoming Customer Call" modal shows a green phone icon and customer details (Customer, Requirement, Intent, Preferred colour), with Accept and Decline buttons. Header pill changes to "Ringing".
4. Live call. The header shows "Live Sales Simulation · <Scenario>", a stage pill (CALL OPENING / CUSTOMER DISCOVERY / HANDLING THE DELIVERY QUESTION / CUSTOMER OBJECTION / CLOSING THE SIMULATION) and a green "● Live · mm:ss" timer.
   - Left column: customer card (navy, avatar initials "RS", name "Rajesh Sharma", subtitle "Simulated customer · Trainer Emulation Layer", state "LISTENING" or "● SPEAKING" with an animated waveform while speaking and a dotted line while idle). Under it, a "LIVE TRANSCRIPT" panel: chat bubbles labelled AARAV (right, light blue) and RAJESH SHARMA (left, grey). Stage dividers in small caps are inserted when the stage changes. It auto-scrolls, and the newest bubble types in progressively, ending with "…" while in progress.
   - Right column: "PARISHODH AI · SUGGESTED RESPONSE" card with a status chip: "LISTENING TO CUSTOMER…", "GENERATING…" (three animated dots), "● AARAV SPEAKING" (green border; the suggested text is highlighted word by word in yellow, karaoke style, as the learner speaks), "✓ DELIVERED", "READ THIS TO THE CUSTOMER". The text is greyed while listening and dark navy when active.
   - Below it: "JUDGMENT ENGINE · LIVE CAPTURE", a 2-column grid of capture chips. Each chip has a green check, a label and a value on the right, and they appear one by one as they are detected:
     Vehicle identified — EV 9S | Colour & timeline — White · 3 wks | Variant discovered — Higher, loaded | Timeline probed — Flexibility | Need identified — Replacing SUV | Qualification — Part-finance | No unsupported promise — Delivery | Objection handled — White kept | Next step agreed — Follow-up
   - Footer: "Simulated customer satisfaction" bar with a percentage on the right and a red→amber→green gradient fill. It starts at 30% and animates up or down after each turn (demo goes 30→40→48→56→62→66→55→64→70→58→76→80→92).
5. Judgment Engine screen ("Parishodh Judgment Engine · Behind the Scenes"): a 3×3 grid of criteria tiles. Each has a title, a question and a check that ticks when satisfied:
   Product Understanding — Did the learner understand the customer's vehicle requirement?
   Requirement Discovery — Did he identify variant, colour and timeline?
   Customer Need Identification — Did he understand why the customer needs the vehicle?
   Delivery Handling — Did he avoid making an unsupported delivery promise?
   Objection Handling — Did he respond appropriately to the colour/delivery concern?
   Communication — Was the conversation clear and professional?
   Sales Qualification — Did he identify financing and purchase intent?
   Next-Step Management — Did he establish a clear follow-up/action?
   Customer Satisfaction — Did the simulated customer feel the requirement was understood?
6. Output / Report ("<Learner> — Live Sales Simulation"): the left list shows Course Completion ✓ Completed, Final Assessment 80%, Live Simulation ✓ Completed, plus a gradient card "LIVE CAPABILITY SCORE 87% Sales Ready". The right side, "LIVE CAPABILITY ASSESSMENT", has animated horizontal bars (navy→teal gradient) with a 0–100 score: Product Knowledge 84, Requirement Discovery 92, Customer Handling 88, Objection Handling 86, Communication 90, Sales Qualification 82, Closing / Next Step 89.
7. "From Learning to Capability": two white cards joined by an arrow. LEARNING SCORE 80% (blue), "Course + Final Assessment", chip "Knows the material" → LIVE PERFORMANCE SCORE 87% (green), "<Scenario> simulation", chip "Can do the job".
8. "<Learner>'s Parishodh Journey": a horizontal timeline with nodes Basic Package (Completed) → Final Assessment (80%) → Live Simulation (Mahindra EV 9S call).

## Design system
- Font: Poppins (Google Fonts), weights 400/500/600/700. Small caps labels: 11px, letter-spacing 0.12em, uppercase, 600.
- Colours: navy-950 #061428 (page bg), navy-900 #0B1F3A, navy-800 #0F2A4D (customer card), brand-blue #0B4AA2, primary #1450A3, teal #1BB6C9, teal-glow #22D3EE, green #16A34A, green-soft #DCFCE7, amber #F59E0B, highlight-yellow #FDE68A, slate text #0F172A / #64748B, panel bg #F4F7FB, card white, borders #E2E8F0.
- Presentation backgrounds: deep navy radial gradient with soft teal glow at bottom-right and blue glow at top-left.
- App cards: white, radius 16px, soft shadow, 1px border. Pills are fully rounded.
- Score typography: big numerals (e.g. 64–96px, 700) in brand-blue, or green for performance.
- Motion: subtle (Framer Motion). Chips fade/slide in, bars grow from 0, satisfaction bar eases, waveform bars animate while speaking.
- Logo: an infinity-style mark in a teal→blue gradient, "Parishodh" wordmark, "ESIMAA" underneath. Build it as a simple SVG placeholder that can be swapped out later.

## Tech stack
- Monorepo with pnpm workspaces: /apps/web, /apps/api, /packages/shared (shared TS types + zod schemas)
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion + React Router + TanStack Query + Zustand (call state) + socket.io-client
- Backend: Node 20 + TypeScript + Fastify + Socket.IO + Prisma + PostgreSQL (SQLite for local dev) + zod
- AI: Anthropic Claude API (official @anthropic-ai/sdk). The key comes from ANTHROPIC_API_KEY. Model name lives in config, never hard-coded in logic. Three AI roles: Customer Persona, Response Coach, Judgment Engine.
- Voice: provider interface. Default is browser Web Speech API (SpeechRecognition for the learner, speechSynthesis for the customer). Leave pluggable slots for cloud STT/TTS providers. Always keep a text-input fallback.
- Auth: JWT (email + password), roles LEARNER / TRAINER / ADMIN.
- Tests: Vitest (unit), Playwright (e2e of the full demo flow).

## Modes
- GUIDED (as in the video): AI suggests what to say; learner reads/adapts it. Scores are weighted down for verbatim reading, configurable.
- ASSESSMENT: suggestions hidden; learner speaks freely.
- SCRIPTED DEMO: plays the golden transcript (below) with timed audio/typing and no AI calls, for sales demos and e2e tests.

## Golden transcript (scenario "Mahindra EV 9S Purchase", customer Rajesh Sharma)
[CALL OPENING]
AARAV: Hello, this is Aarav from Mahindra. How may I help you today?
RAJESH: Hi Aarav. I'm planning to buy the Mahindra EV 9S. I would like to take delivery within the next three weeks, and I'm specifically looking for a white car.
AARAV: Sure, Mr. Sharma. I can help you with that. Let me understand your requirements so I can check the most suitable option and delivery availability for you.
[CUSTOMER DISCOVERY]
RAJESH: I'm looking for the higher variant, preferably with all the features. But my main concern is whether I can get a white car delivered within three weeks.
AARAV: Understood. Is the three-week timeline fixed, or would you have some flexibility if the preferred configuration isn't immediately available?
RAJESH: Three weeks is what I'm targeting. I don't want to wait for months.
AARAV: Got it. May I also understand whether you're replacing an existing vehicle or buying an additional car?
RAJESH: I'm replacing my existing SUV.
AARAV: And are you planning to finance the vehicle or make the purchase outright?
RAJESH: I'll probably finance part of it.
[HANDLING THE DELIVERY QUESTION]
RAJESH: The important thing for me is the white colour. Can you guarantee delivery within three weeks?
AARAV: I don't want to promise a delivery date before confirming the exact variant, colour availability and allocation. I can check the current availability and expected allocation for the white variant and give you a realistic delivery commitment.
RAJESH: Okay. What if the white one isn't available?
AARAV: If white isn't available within your timeline, I can check whether another white vehicle is already allocated or available from another nearby location. We can also discuss alternative configurations if you're open to them.
[CUSTOMER OBJECTION]
RAJESH: I don't want to compromise on the colour. I've already decided on white.
AARAV: Understood. In that case, I'll keep white as the primary requirement and work around the availability of the exact configuration rather than suggesting a different colour.
RAJESH: That's good. What do you need from me?
AARAV: I'll need to confirm the preferred variant, your location, and your expected purchase date. Once I check availability, I can explain the booking process, expected delivery timeline and financing options.
[CLOSING THE SIMULATION]
RAJESH: Okay. I want to proceed if you can get me the white car within three weeks.
AARAV: Absolutely. I'll check the availability and allocation status for the white EV 9S and come back to you with the most accurate delivery timeline. If the configuration is available, we can proceed with the booking immediately.
RAJESH: Perfect. Please get back to me as soon as possible.
AARAV: Certainly, Mr. Sharma. Thank you for your time. I'll follow up with you shortly.

## Engineering rules
- All AI calls happen server-side only. The browser never sees the API key.
- Every AI output that drives the UI (captures, scores, stage, satisfaction) must be strict JSON validated with zod. On a validation failure, retry once, then fall back gracefully.
- Store every session turn, capture, and score so reports are reproducible.
- Keep components small. Put shared types in /packages/shared.
