# Sanxingdui Competition Page Mapping

## 1. Purpose

This document maps the competition MVP pages to the current codebase and defines:

- what can be reused directly
- what should be refactored
- what is currently missing

It is the implementation baseline for page-level work.

## 2. Core Page Mapping

### A. Home Page

Current file:

`vue3/src/views/frontend/Home.vue`

Current status:

- Already has a strong visual hero section
- Already has artifact, course, and activity blocks
- Already uses real backend data for featured heritage items
- Already routes into the Sanxingdui exploration path with `exploreHeritage -> /tanmi`

Can be reused:

- Hero visual structure
- Featured artifact section
- General page layout and styling direction
- Existing backend artifact request logic

Needs change:

- Narrow the homepage story to the competition theme instead of a broad cultural platform
- Reduce unrelated blocks such as generic courses and activities if they weaken the main judging path
- Strengthen the main CTA so the page clearly leads into the time-space exploration flow
- Rewrite copy so the page introduces:
  - ancient Shu time-space exploration
  - bronze artifact discovery
  - AI interpretation

Missing for MVP:

- A clear "competition storyline" section
- A visible explanation of the 4-step demo path
- A stronger bridge from homepage to graph + 3D + AI

Conclusion:

This page is highly reusable and should be treated as a `refactor`, not a rewrite.

### B. Time-Space Exploration Page

Current file:

`vue3/src/views/frontend/tanmi.vue`

Current status:

- Already has a strong thematic shell
- Already presents a timeline-like exploration structure
- Already has Sanxingdui/Jinsha-related content blocks
- Already has a clear visual style matching the competition theme

Can be reused:

- Page visual language
- Banner area
- Timeline navigation pattern
- Section-card layout
- Storytelling tone

Needs change:

- Replace static era cards with real interactive filtering
- Convert the page from "read-only cultural introduction" into "time-space selection interface"
- Replace the current bottom action card, which now points to image generation, with the artifact exploration entry
- Turn the timeline from static scroll navigation into active filter controls

Missing for MVP:

- Time slider or time segment selector
- Site filter for Sanxingdui and Jinsha
- Artifact result list returned from selected dimensions
- Connection to graph-backed and 3D-backed artifact results

Conclusion:

This page is the best existing carrier for the MVP core. It should become the main `time-space exploration` page.

### C. 3D Artifact Entry Page

Current file:

`vue3/src/views/3ddemo.vue`

Current status:

- Already has a polished artifact list
- Already contains Sanxingdui-style artifact cards
- Already routes into the 3D model page through `glbUrl`

Can be reused:

- Artifact grid structure
- Card interaction style
- Visual tone for artifact list
- Existing route jump behavior

Needs change:

- Replace hardcoded local artifact list with backend-driven competition artifact data
- Add `entityId` to route params, not only `glbUrl`
- Align the list with the 5 flagship artifacts defined in the MVP
- Add visible time/site/craft metadata to each card

Missing for MVP:

- Dynamic data returned from time-space filtering
- Unified artifact ID binding between page, graph, and AI
- Direct connection to selected filter context

Conclusion:

This page is reusable, but it must stop being a static local demo and become a real artifact selection page.

### D. 3D Artifact Interaction Page

Current file:

`vue3/src/views/Three3dDemo.vue`

Current status:

- Already loads GLB models
- Already handles loading, retry, and responsive canvas behavior
- Already provides a clean technical shell for Three.js display

Can be reused:

- Three.js initialization
- Model loading logic
- Orbit controls
- Loading and error handling

Needs change:

- Accept `entityId` together with `glbUrl`
- Add a right-side or floating information panel
- Add graph relationship request after artifact load or user action
- Add current artifact name, site, era, craft, and symbolic meaning

Missing for MVP:

- Artifact business context
- Graph-linked explanation panel
- Navigation to AI interpretation for the current artifact

Conclusion:

This page is technically reusable, but functionally incomplete. It should be upgraded from `model viewer` to `artifact interaction hub`.

### E. AI Interpretation Page

Current file:

`vue3/src/views/frontend/AiChat.vue`

Current status:

- Already has a very strong visual interface
- Already has streaming chat support
- Already has question suggestion groups around Sanxingdui topics
- Already connects to backend AI session APIs

Can be reused:

- Full page visual structure
- Chat layout
- Streaming UX
- Suggestion buttons
- AI session creation flow

Needs change:

- Add current artifact or current filter context to the request
- Add graph-backed and time-space-backed answer mode
- Make the page feel like "artifact interpretation" rather than generic Q&A
- Add citation or evidence blocks for competition credibility

Missing for MVP:

- Structured context injection from current page state
- Source-aware answer block
- Related artifact and related timeline suggestions

Conclusion:

This is one of the strongest existing pages. It should be upgraded, not redesigned.

## 3. Reuse Priority

Highest reuse value:

1. `tanmi.vue`
2. `AiChat.vue`
3. `Three3dDemo.vue`
4. `Home.vue`
5. `3ddemo.vue`

Meaning:

- `tanmi.vue` is the best shell for the competition core interaction
- `AiChat.vue` already has a strong presentation layer
- `Three3dDemo.vue` already solves the technical model-viewer problem
- `Home.vue` is a good entry page but needs narrative narrowing
- `3ddemo.vue` is useful, but it is currently the most static page

## 4. Immediate Build Decision

Page-by-page implementation direction:

1. `Home.vue`
   Keep and refactor
2. `tanmi.vue`
   Keep and convert into the MVP main page
3. `3ddemo.vue`
   Keep and convert into a dynamic artifact list
4. `Three3dDemo.vue`
   Keep and extend with graph linkage
5. `AiChat.vue`
   Keep and extend with structured interpretation

No page in the MVP needs full deletion or complete rewrite.

## 5. Main Gaps Before Step 3

The page layer is mostly available, but these dependencies are missing:

1. A unified artifact identity model
2. A time-space filter result API
3. A graph detail API for one artifact
4. A graph-enhanced AI answer API

That means the next implementation step should not start from visual redesign.

The next step should start from:

`artifact data model + route parameter model + API contract`
