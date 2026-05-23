# Sanxingdui Competition MVP Definition

## 1. Goal

Build a competition-ready web demo around Sanxingdui and ancient Shu bronze culture.

The project must demonstrate one complete story:

`time-space exploration -> artifact discovery -> 3D interaction -> graph explanation -> AI interpretation`

This version is for competition presentation, not for full product delivery.

## 2. Core Theme

Theme name:

`Ancient Shu Time-Space Exploration and Bronze Civilization Knowledge Graph`

What the judges should understand in one sentence:

This is not a normal cultural website. It is an interactive digital exhibition system that combines time-space navigation, 3D artifacts, knowledge graph linkage, and AI explanation for Sanxingdui culture.

## 3. Core Artifacts

Only use 5 flagship artifacts in the first version:

1. Bronze Sacred Tree
2. Bronze Vertical-Eyed Mask
3. Bronze Standing Figure
4. Gold Scepter
5. Gold Mask

Reason:

- They are recognizable
- They are easy to explain
- They cover ritual, kingship, craftsmanship, and symbolism
- They are enough to support graph, 3D, and AI demos

## 4. Core Sites

Only keep 2 sites in the first version:

1. Sanxingdui Site
2. Jinsha Site

Reason:

- Enough to form a time-space comparison
- Easy to explain cultural continuity
- Avoids over-expanding map and data work

## 5. Core Dimensions

Only keep 3 dimensions in the first version:

1. Time
2. Location
3. Craft

Concrete meaning:

- Time: ancient Shu stages and major archaeological periods
- Location: Sanxingdui and Jinsha
- Craft: casting, gold work, carving, ornament process

Do not include too many extra dimensions in MVP, such as full ethnic modeling, full ritual taxonomy, or large-scale cultural ontology.

## 6. Core Pages

Only keep 4 core pages for the competition version:

1. Home page
2. Time-space exploration page
3. 3D artifact interaction page
4. AI interpretation page

Recommended file mapping based on the current project:

- Home page: `vue3/src/views/frontend/Home.vue`
- Time-space exploration page: `vue3/src/views/frontend/tanmi.vue`
- 3D artifact entry/list page: `vue3/src/views/3ddemo.vue`
- 3D artifact interaction page: `vue3/src/views/Three3dDemo.vue`
- AI interpretation page: `vue3/src/views/frontend/AiChat.vue`

Note:

The 3D entry page and 3D interaction page can be treated as one linked module in the demo flow.

## 7. Competition User Flow

The demo flow must be simple and stable:

1. User enters the home page and understands the project theme
2. User enters the time-space exploration page
3. User selects a time period or site
4. System returns matching artifacts
5. User clicks one artifact and enters the 3D interaction page
6. System shows related graph information: site, era, craft, symbolic meaning
7. User asks an AI question based on the current artifact or context
8. AI returns a structured interpretation

This is the main judging path and should be optimized first.

## 8. What Must Be Visible

The competition MVP must visibly show these 5 abilities:

1. Sanxingdui cultural theme and visual identity
2. Time-space filtering
3. Artifact-card to 3D-model transition
4. Knowledge graph relationship display
5. AI explanation tied to artifact context

If a feature cannot be clearly demonstrated on screen, it should not be treated as a first-priority MVP feature.

## 9. Out Of Scope For MVP

Do not prioritize these in the first competition version:

1. Full Neo4j large-scale graph population
2. Complex GIS map system
3. Large multi-scene 3D world roaming
4. Full multi-agent orchestration
5. Complete admin backend for graph management
6. Very deep recommendation or social features
7. Large content encyclopedia expansion

These can be introduced later as "future optimization directions" in the defense.

## 10. MVP Success Criteria

The first competition version is successful if:

1. The 4 core pages can be presented smoothly
2. The 5 flagship artifacts have complete demo data
3. Time-space filtering returns understandable results
4. At least one 3D artifact can trigger graph-based explanation
5. AI can answer artifact-related questions with stable output
6. The whole project can be explained in 3 to 5 minutes

## 11. Work Rule For Next Steps

All later work must follow these rules:

1. Prefer finishing the core demo path over adding new features
2. Prefer strong visible effect over large hidden architecture
3. Prefer 5 strong artifacts over 50 incomplete artifacts
4. Prefer stable interaction over ambitious but fragile design
5. Every new task must serve the main demo flow

This document is the baseline for the competition build.
