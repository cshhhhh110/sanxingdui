<template>
  <main class="time-space-trail" :class="{ 'time-space-trail--compact': activeScene > 1, 'time-space-trail--immersive': activeScene === 3 }">
    <div
      v-if="voiceGuideAutoCollapsed"
      class="voice-guide-hover-zone"
      aria-hidden="true"
      @mouseenter="revealVoiceGuidePanel"
    >
      <span>玄喵陪游</span>
    </div>
    <section
      class="voice-guide-panel"
      :class="{
        'voice-guide-panel--active': voiceGuideEnabled,
        'voice-guide-panel--loading': voiceGuideLoading,
        'voice-guide-panel--collapsed': voiceGuideAutoCollapsed,
        'voice-guide-panel--revealed': voiceGuidePeekVisible
      }"
      aria-label="玄喵陪游"
      @mouseenter="revealVoiceGuidePanel"
      @mouseleave="hideVoiceGuidePanelIfNeeded"
    >
      <div class="voice-guide-panel__mark" aria-hidden="true">
        <img :src="aiAvatar" alt="" />
        <i v-if="voiceGuideLoading" class="fas fa-spinner fa-spin"></i>
      </div>
      <div class="voice-guide-panel__copy">
        <div class="voice-guide-panel__head">
          <strong>玄喵陪游</strong>
          <span>{{ xuanmiaoTrailMode }}</span>
        </div>
        <p>{{ xuanmiaoCompanionLine }}</p>
      </div>
      <div class="voice-guide-panel__actions">
        <template v-if="!voiceGuideEnabled">
          <button
            class="voice-guide-button voice-guide-button--primary showcase-button-hover"
            type="button"
            @click="enableVoiceGuide"
          >
            开启陪游
          </button>
          <button
            class="voice-guide-button voice-guide-button--ghost showcase-button-hover"
            type="button"
            :disabled="!selectedArtifact"
            @click="askXuanmiaoFromCompanion"
          >
            问玄喵
          </button>
        </template>
        <template v-else>
          <button class="voice-guide-button showcase-button-hover" type="button" @click="toggleVoiceGuidePause">
            {{ voiceGuidePaused ? '继续' : '暂停' }}
          </button>
          <button
            class="voice-guide-button showcase-button-hover"
            type="button"
            :disabled="!selectedArtifact"
            @click="askXuanmiaoFromCompanion"
          >
            问玄喵
          </button>
          <button class="voice-guide-button voice-guide-button--ghost showcase-button-hover" type="button" @click="closeVoiceGuide">
            关闭
          </button>
        </template>
      </div>
    </section>

    <Transition name="trail-command">
      <section v-if="trailCommandTransition.visible" class="trail-command-overlay" aria-live="polite">
        <div class="trail-command-overlay__panel">
          <div class="trail-command-overlay__mark" aria-hidden="true">
            <i class="fas fa-route"></i>
          </div>
          <div class="trail-command-overlay__copy">
            <span>玄喵带路</span>
            <h2>{{ trailCommandTransition.title }}</h2>
            <p>{{ trailCommandTransition.line }}</p>
          </div>
          <div class="trail-command-overlay__steps" aria-hidden="true">
            <span
              v-for="(step, index) in trailCommandTransition.steps"
              :key="step.key"
              :class="{
                'is-active': index === trailCommandTransition.activeIndex,
                'is-done': index < trailCommandTransition.activeIndex
              }"
            >
              <i>{{ index + 1 }}</i>
              <small>{{ step.label }}</small>
            </span>
          </div>
        </div>
      </section>
    </Transition>

    <button
      class="trail-step-back showcase-button-hover"
      type="button"
      :aria-label="trailStepBackLabel"
      @click="goBackTrailStep"
    >
      <i class="fas fa-arrow-left" aria-hidden="true"></i>
      <span>{{ trailStepBackLabel }}</span>
    </button>

    <section v-if="activeScene === 1" class="trail-hero">
      <div class="hero-copy showcase-enter" style="--delay: 0s">
        <p class="hero-kicker">玄喵导览</p>
        <h1>循着古蜀线索，走进三星堆</h1>
        <p class="hero-subtitle">{{ heroNarrative }}</p>
        <div class="hero-actions">
          <button class="hero-button hero-button--primary showcase-button-hover" type="button" @click="scrollToArtifacts">
            查看推荐文物
          </button>
          <button class="hero-button showcase-button-hover" type="button" :disabled="!selectedArtifact" @click="scrollToGuide">
            听玄喵讲解
          </button>
        </div>
      </div>

      <aside class="hero-board showcase-enter" style="--delay: 0.08s">
        <div class="board-card">
          <span>当前命中</span>
          <strong>{{ displayVisibleCount }}</strong>
        </div>
        <div class="board-card">
          <span>可看 3D</span>
          <strong>{{ displayReadyCount }}</strong>
        </div>
        <div class="board-card">
          <span>当前焦点</span>
          <strong>{{ selectedArtifact ? 1 : 0 }}</strong>
        </div>
      </aside>
    </section>

    <section class="trail-shell" :class="{ 'trail-shell--immersive': activeScene === 3, 'trail-shell--guide': activeScene === 4 }">
      <section class="trail-progress-card showcase-enter" style="--delay: 0.12s" aria-label="展线进度">
        <div class="trail-progress-card__head">
          <span>展线进度</span>
          <strong>{{ activeScene }}/{{ sceneSteps.length }}</strong>
        </div>
        <div class="trail-progress-card__bar" aria-hidden="true">
          <i :style="{ width: `${trailSceneProgressPercent}%` }"></i>
        </div>
        <div class="trail-progress-card__steps">
          <button
            v-for="item in trailProgressItems"
            :key="item.id"
            class="trail-progress-step showcase-button-hover"
            :class="{
              'is-done': item.id < activeScene,
              'is-active': item.id === activeScene
            }"
            type="button"
            :disabled="item.disabled"
            @click="goToScene(item.id)"
          >
            <em>{{ item.index }}</em>
            <small>{{ item.label }}</small>
          </button>
        </div>
        <p>{{ trailProgressHint }}</p>
      </section>

      <section v-show="activeScene === 1" ref="filterSectionRef" class="filter-panel showcase-enter" style="--delay: 0.12s">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">第一幕 · 时空定点</p>
            <h2>先站上一个古蜀坐标</h2>
          </div>
          <span class="panel-badge">{{ isLoading ? '线索浮现中' : '坐标已落定' }}</span>
        </div>

        <div class="pit-map-layout">
          <article class="pit-map-card">
            <div class="pit-map-card__head">
              <div>
                <p class="panel-kicker">遗址俯瞰入口</p>
                <h3>从祭祀坑与代表文物进入展线</h3>
              </div>
              <span class="pit-map-card__badge">{{ activePitCode || '俯瞰图' }}</span>
            </div>
            <div class="pit-map-hint" aria-label="地图交互提示">
              <span><strong>K1-K8 坑位</strong>点击选择空间线索</span>
              <span><strong>文物标注</strong>点击直接进入对应文物</span>
            </div>
            <div class="pit-map-scroll" aria-label="三星堆遗址重点文物模型位置示意图">
              <div class="pit-map-stage">
                <img class="pit-map-image" src="/images/trail/pit-map.png" alt="三星堆遗址重点文物模型位置示意图" />
                <button
                  v-for="spot in pitMapHotspots"
                  :key="spot.key"
                  class="pit-hotspot"
                  :class="[
                    `pit-hotspot--${spot.kind}`,
                    {
                      'pit-hotspot--active': activePitCode === spot.pitCode || selectedArtifactId === spot.entityId,
                      'pit-hotspot--linked': Boolean(spot.entityId),
                      'pit-hotspot--pressed': pitHotspotFeedbackKey === spot.key
                    }
                  ]"
                  :style="getPitHotspotStyle(spot)"
                  type="button"
                  :aria-label="spot.label"
                  :title="spot.kind === 'pit' ? `${spot.label}：点击选择坑位` : `${spot.label}：点击直接进入文物`"
                  @click="selectPitHotspot(spot)"
                >
                  <span>{{ spot.shortLabel }}</span>
                </button>
              </div>
            </div>
          </article>

          <aside
            :key="activePitInfo.pitCode || 'map'"
            class="pit-map-inspector"
            :class="{ 'pit-map-inspector--pulse': Boolean(pitHotspotFeedbackKey) }"
          >
            <p class="panel-kicker">当前空间线索</p>
            <div class="pit-map-inspector__code">{{ activePitInfo.pitCode || 'MAP' }}</div>
            <h3>{{ activePitInfo.title }}</h3>
            <figure
              v-if="activePitInfo.image"
              class="pit-map-inspector__figure"
              :class="{ 'pit-map-inspector__figure--portrait': activePitInfo.imageLayout === 'portrait' }"
            >
              <img :src="activePitInfo.image" :alt="activePitInfo.imageAlt || activePitInfo.title" loading="lazy" />
              <figcaption>{{ activePitInfo.imageCaption || '科普导览素材' }}</figcaption>
            </figure>
            <p>{{ activePitInfo.description }}</p>
            <div class="pit-map-inspector__tags">
              <span v-for="tag in activePitInfo.tags" :key="tag">{{ tag }}</span>
            </div>
            <div class="pit-map-inspector__guide">
              <strong>{{ activePitInfo.artifacts.some((item) => item.entityId) ? '可进入代表文物' : '空间线索已记录' }}</strong>
              <small>{{ activePitInfo.artifacts.some((item) => item.entityId) ? '沿这个坑位进入第二幕展线' : '先作为祭祀坑空间背景保留' }}</small>
            </div>
            <div class="pit-map-inspector__artifacts">
              <button
                v-for="artifact in activePitInfo.artifacts"
                :key="artifact.name"
                class="pit-artifact-link showcase-button-hover"
                :class="{ 'pit-artifact-link--disabled': !artifact.entityId }"
                type="button"
                @click="enterPitArtifact(artifact)"
              >
                <span v-if="artifact.image" class="pit-artifact-link__thumb">
                  <img :src="artifact.image" :alt="artifact.name" loading="lazy" />
                </span>
                <span class="pit-artifact-link__copy">
                  <strong>{{ artifact.name }}</strong>
                  <small>{{ artifact.entityId ? '进入展线' : artifact.statusText || '空间线索' }}</small>
                </span>
              </button>
            </div>
          </aside>
        </div>

        <div class="filter-zone filter-zone--real">
          <div class="filter-zone__head">
            <div>
              <p class="panel-kicker">真实筛选</p>
              <h3>用已有数据缩小文物范围</h3>
            </div>
            <span>会改变结果</span>
          </div>

        <div class="filter-group">
          <label>时代</label>
          <div class="filter-row">
            <button
              class="filter-pill showcase-button-hover"
              :class="{ active: activeEra === '' }"
              type="button"
              @click="activeEra = ''"
            >
              <span>全部时代</span>
              <small>从整段时间望进去</small>
            </button>
            <button
              v-for="option in eraOptions"
              :key="option.value"
              class="filter-pill showcase-button-hover"
              :class="{ active: activeEra === option.value }"
              type="button"
              @click="activeEra = option.value"
            >
              <span>{{ option.label }}</span>
              <small>{{ describeFacet(option) }}</small>
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label>遗址</label>
          <div class="filter-row">
            <button
              class="filter-pill showcase-button-hover"
              :class="{ active: activeSite === '' }"
              type="button"
              @click="activeSite = ''"
            >
              <span>全部遗址</span>
              <small>先看整体空间分布</small>
            </button>
            <button
              v-for="option in siteOptions"
              :key="option.value"
              class="filter-pill showcase-button-hover"
              :class="{ active: activeSite === option.value }"
              type="button"
              @click="activeSite = option.value"
            >
              <span>{{ option.label }}</span>
              <small>{{ describeFacet(option) }}</small>
            </button>
          </div>
        </div>

        <div class="filter-group">
          <label>工艺</label>
          <div class="filter-row">
            <button
              class="filter-pill showcase-button-hover"
              :class="{ active: activeCraft === '' }"
              type="button"
              @click="activeCraft = ''"
            >
              <span>全部工艺</span>
              <small>先看主要技艺脉络</small>
            </button>
            <button
              v-for="option in craftOptions"
              :key="option.value"
              class="filter-pill showcase-button-hover"
              :class="{ active: activeCraft === option.value }"
              type="button"
              @click="activeCraft = option.value"
            >
              <span>{{ option.label }}</span>
              <small>{{ describeFacet(option) }}</small>
            </button>
          </div>
        </div>

        </div>

        <div v-if="meaningFocus" class="meaning-focus">
          <span>当前寓意追踪：{{ meaningFocus }}</span>
          <button class="meaning-clear showcase-button-hover" type="button" @click="meaningFocus = ''">
            清除
          </button>
        </div>

        <div class="guide-clue-panel">
          <div class="guide-clue-head">
            <div>
              <p class="panel-kicker">导览线索</p>
              <h3>从坑位、器类和象征角度继续看</h3>
            </div>
            <span>空间线索 / 可筛选</span>
          </div>
          <div
            v-for="group in guideClueGroups"
            :key="group.key"
            class="guide-clue-group"
          >
            <label>{{ group.label }}</label>
            <div class="guide-clue-row">
              <button
                v-for="clue in group.items"
                :key="`${group.key}-${clue.value}`"
                class="guide-clue-chip showcase-button-hover"
                :class="{
                  active: isGuideClueActive(group, clue),
                  'guide-clue-chip--filterable': clue.mode === 'filterable',
                  'guide-clue-chip--placeholder': clue.mode === 'guideOnly'
                }"
                type="button"
                @click="selectGuideClue(group, clue)"
              >
                <span>{{ clue.label }}</span>
                <small>{{ clue.mode === 'filterable' ? '可筛选' : '空间线索' }}</small>
              </button>
            </div>
          </div>
        </div>

        <p class="filter-summary">{{ resultNarrative }}</p>

        <div class="panel-actions">
          <button class="hero-button hero-button--primary showcase-button-hover" type="button" @click="scrollToArtifacts">
            继续向前
          </button>
          <button class="hero-button showcase-button-hover" type="button" @click="resetFilters">
            重新定点
          </button>
        </div>
      </section>

      <div class="trail-main">
        <section v-show="activeScene === 2" ref="artifactSectionRef" class="artifact-section showcase-enter" style="--delay: 0.18s">
          <div class="section-head">
            <div>
              <p class="section-kicker">第二幕 · 文物驻足</p>
            </div>
            <span class="section-badge">{{ visibleArtifacts.length }} 件</span>
          </div>

          <div v-if="activeFilterChips.length" class="scene-context-row">
            <span class="scene-context-row__label">上一幕落点</span>
            <span v-for="chip in activeFilterChips" :key="chip.key" class="scene-context-chip">
              {{ chip.label }}：{{ chip.value }}
            </span>
          </div>

          <div v-if="selectedArtifact" class="featured-spotlight">
            <div class="spotlight-visual">
              <img :src="selectedArtifact.cardImage || selectedArtifact.coverImage" :alt="selectedArtifact.displayTitle" />
              <span class="spotlight-site">{{ selectedArtifact.siteLabel }}</span>
            </div>
            <div class="spotlight-copy">
              <p class="section-kicker">当前焦点</p>
              <h3>{{ selectedArtifact.displayTitle }}</h3>
              <p class="spotlight-era">{{ selectedArtifact.eraLabel }} · {{ selectedArtifact.yearLabel }}</p>
              <p class="spotlight-summary">{{ selectedArtifact.summary }}</p>
              <p class="spotlight-reason">{{ selectedReason }}</p>
              <div class="spotlight-tags">
                <span>{{ selectedArtifact.category }}</span>
                <span>{{ selectedArtifact.craftLabel }}</span>
              </div>
              <div class="spotlight-actions">
                <button class="hero-button hero-button--primary showcase-button-hover" type="button" @click="scrollToStage">
                  走近这件文物
                </button>
                <button class="hero-button showcase-button-hover" type="button" @click="scrollToGuide" :disabled="!selectedArtifact">
                  让玄喵开讲
                </button>
              </div>
            </div>
          </div>

          <div v-if="loadError" class="status-state status-state--error">
            {{ loadError }}
          </div>
          <div v-else-if="isLoading" class="status-state">
            正在根据当前时空坐标整理文物结果……
          </div>
          <div v-else-if="!visibleArtifacts.length" class="status-state">
            当前条件下暂未命中文物。你可以放宽时代、切换遗址，或取消当前工艺筛选，再看看古蜀文明会把哪件文物推到你面前。
          </div>

          <div v-else class="artifact-grid">
            <article
              v-for="artifact in visibleArtifacts"
              :key="artifact.entityId"
              class="artifact-card showcase-card-hover"
              :class="{ 'artifact-card--active': artifact.entityId === selectedArtifactId }"
              @click="selectArtifact(artifact, `你从当前筛选结果里挑中了 ${artifact.displayTitle}。`)"
            >
              <div class="artifact-image-wrap">
                <img :src="artifact.cardImage || artifact.coverImage" :alt="artifact.displayTitle" />
                <span class="artifact-badge">{{ artifact.category }}</span>
                <span class="artifact-model">{{ artifact.isModelReady ? '3D 已就绪' : '档案可看' }}</span>
              </div>
              <div class="artifact-content">
                <p class="artifact-site">{{ artifact.siteLabel }}</p>
                <h3>{{ artifact.displayTitle }}</h3>
                <p class="artifact-time">{{ artifact.eraLabel }} · {{ artifact.yearLabel }}</p>
                <p class="artifact-summary">{{ artifact.summary }}</p>
                <div class="artifact-actions">
                  <button
                    class="card-action showcase-button-hover"
                    type="button"
                    @click.stop="selectArtifact(artifact, `你决定先细看 ${artifact.displayTitle}。`)"
                  >
                    选它
                  </button>
                  <button
                    class="card-action card-action--ghost showcase-button-hover"
                    type="button"
                    @click.stop="openStandalone3D(artifact)"
                  >
                    单独打开
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section v-show="activeScene === 3" ref="stageSectionRef" class="immersive-section showcase-enter" style="--delay: 0.24s">
          <div v-if="stageVisible && selectedArtifactDetail" class="stage-overview stage-overview--single">
            <article class="stage-overview__card">
              <span>当前文物</span>
              <strong>{{ selectedArtifactDetail.displayTitle }}</strong>
              <p>{{ selectedArtifactDetail.summary }}</p>
            </article>
          </div>

          <div v-if="!stageVisible" class="stage-preview showcase-card-hover">
            <div class="stage-preview__copy">
              <p class="section-kicker">展品现场即将展开</p>
              <h3>{{ selectedArtifact?.displayTitle || '先在上一幕选中一件文物' }}</h3>
              <p>{{ stageNarrative }}</p>
            </div>
            <div class="stage-preview__actions">
              <button
                class="hero-button hero-button--primary showcase-button-hover"
                type="button"
                :disabled="!selectedArtifact"
                @click="scrollToStage"
              >
                走进展品现场
              </button>
              <button
                class="hero-button showcase-button-hover"
                type="button"
                :disabled="!selectedArtifact"
                @click="scrollToGuide"
              >
                直接听玄喵开讲
              </button>
            </div>
          </div>

          <div v-else class="immersive-grid">
            <article class="viewer-card">
              <div class="viewer-meta">
                <span class="meta-chip">{{ selectedArtifactDetail?.siteLabel || '遗址待定' }}</span>
                <span class="meta-chip">{{ selectedArtifactDetail?.eraLabel || '年代待定' }}</span>
                <span class="meta-chip meta-chip--highlight">{{ hasModel ? '3D 已就绪' : '档案模式' }}</span>
              </div>

              <div
                ref="viewerRef"
                class="viewer-shell"
                :class="{ 'viewer-shell--fullscreen': isViewerFullscreen }"
              >
                <div class="viewer-glow viewer-glow--left" aria-hidden="true"></div>
                <div class="viewer-glow viewer-glow--right" aria-hidden="true"></div>
                <button
                  class="viewer-fullscreen-button"
                  type="button"
                  :aria-pressed="isViewerFullscreen"
                  @click="toggleViewerFullscreen"
                >
                  {{ isViewerFullscreen ? '退出全屏' : '全屏展示' }}
                </button>
                <div v-if="isViewerFullscreen" class="fullscreen-return-hint" aria-live="polite">
                  <span>Esc</span>
                  返回展线
                </div>

                <img
                  v-if="!hasModel && selectedArtifactDetail?.cardImage"
                  class="artifact-fallback"
                  :src="selectedArtifactDetail.cardImage || selectedArtifactDetail.coverImage"
                  :alt="selectedArtifactDetail.displayTitle"
                />
                <canvas v-show="hasModel" ref="canvasRef"></canvas>

                <div class="viewer-caption">
                  <span>拖拽旋转</span>
                  <span>滚轮缩放</span>
                  <span>图谱联动</span>
                </div>

                <div v-if="isModelLoading" class="viewer-mask">
                  <div class="mask-box">
                    <p>正在布置数字展台</p>
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: `${modelProgress}%` }"></div>
                    </div>
                    <span>{{ modelProgress }}%</span>
                  </div>
                </div>

                <div v-if="modelError" class="viewer-mask viewer-mask--error">
                  <p class="error-title">模型暂未完整就绪</p>
                  <p>{{ modelError }}</p>
                  <button v-if="hasModel" class="retry-button" type="button" @click="reloadModel">重新加载</button>
                </div>
              </div>
            </article>

            <aside ref="insightPanelRef" class="insight-panel">
              <section class="panel-card panel-card--hero">
                <p class="panel-label">文物档案</p>
                <h2>{{ selectedArtifactDetail?.displayTitle || '选中文物' }}</h2>
                <p class="panel-summary">{{ selectedArtifactDetail?.summary || '从左侧展厅选择一件文物，档案将在此展开。' }}</p>
                <dl class="fact-grid">
                  <div><dt>出土地</dt><dd>{{ selectedArtifactDetail?.siteLabel || '—' }}</dd></div>
                  <div><dt>年代</dt><dd>{{ selectedArtifactDetail?.yearLabel || '—' }}</dd></div>
                  <div><dt>类别</dt><dd>{{ selectedArtifactDetail?.category || '—' }}</dd></div>
                  <div><dt>工艺</dt><dd>{{ selectedArtifactDetail?.craftLabel || '—' }}</dd></div>
                </dl>
              </section>

              <section ref="graphPanelRef" class="panel-card graph-panel" :class="{ 'graph-panel--fullscreen': isGraphFullscreen }">
                <div v-if="isGraphFullscreen" class="fullscreen-return-hint fullscreen-return-hint--graph" aria-live="polite">
                  <span>Esc</span>
                  返回展线
                </div>
                <div class="section-head graph-panel__toolbar">
                  <div>
                    <p class="panel-label">关系网络</p>
                    <h3 class="section-title">图谱探索器</h3>
                  </div>
                  <div class="section-actions">
                    <span class="section-tag">{{ graphLoading ? '图谱刷新中' : '关系已联动' }}</span>
                    <button class="mini-action" type="button" @click="toggleGraphFullscreen">
                      {{ isGraphFullscreen ? '退出全屏' : '全屏展示' }}
                    </button>
                    <button class="mini-action" type="button" @click="focusCenterNode">回到中心</button>
                    <button class="mini-action" type="button" @click="resetGraphViewport">重置视图</button>
                  </div>
                </div>

                <p class="graph-lead">{{ activeNarrative }}</p>

                <div class="type-filter-row" :aria-label="graphFilterHint">
                  <button
                    v-for="item in graphTypeFilters"
                    :key="item.type"
                    class="type-filter"
                    :class="{ active: activeTypeFilters.includes(item.type) }"
                    type="button"
                    :title="item.description"
                    @click="toggleTypeFilter(item.type)"
                  >
                    <span>{{ item.label }}</span>
                    <strong>{{ item.count }}</strong>
                  </button>
                </div>
                <p class="graph-filter-hint">{{ graphFilterHint }}</p>

                <div class="graph-stage" :class="{ 'graph-stage--loading': graphLoading }">
                  <div ref="graphRef" class="graph-canvas"></div>
                  <div v-if="graphLoading" class="graph-loading-badge" aria-live="polite">
                    图谱正在展开关系...
                  </div>
                  <p v-if="graphError" class="graph-error">{{ graphError }}</p>
                </div>

                <div class="graph-legend">
                  <span class="legend-item"><i class="legend-dot legend-dot--core"></i>中心文物</span>
                  <span class="legend-item"><i class="legend-dot legend-dot--site"></i>时空坐标</span>
                  <span class="legend-item"><i class="legend-dot legend-dot--craft"></i>工艺 / 材质 / 象征</span>
                  <span class="legend-item"><i class="legend-dot legend-dot--artifact"></i>相关文物</span>
                </div>
              </section>

              <section class="panel-card">
                <div class="section-head">
                  <p class="panel-label">当前节点</p>
                  <span class="section-tag">{{ selectedNodeTypeLabel }}</span>
                </div>

                <div class="narrative-grid">
                  <article class="narrative-card">
                    <p class="narrative-label">这是什么</p>
                    <strong>{{ selectedNodeTitle }}</strong>
                    <p>{{ selectedNodeSummary }}</p>
                  </article>
                  <article class="narrative-card">
                    <p class="narrative-label">它与谁相连</p>
                    <ul class="linked-list">
                      <li v-for="item in selectedNodeRelations" :key="`${item.relation}-${item.targetId}`">
                        <span>{{ item.relation }}</span>
                        <strong>{{ item.label }}</strong>
                      </li>
                    </ul>
                  </article>
                  <article class="narrative-card">
                    <p class="narrative-label">下一步去哪里</p>
                    <strong>{{ selectedNodeActionTitle }}</strong>
                    <p>{{ selectedNodeActionHint }}</p>
                    <div class="narrative-actions">
                      <button
                        class="narrative-button narrative-button--secondary"
                        type="button"
                        :disabled="!selectedGraphNode"
                        @click="continueXuanmiaoNarrationFromNode"
                      >
                        继续听玄喵讲
                      </button>
                      <button
                        class="narrative-button"
                        type="button"
                        :disabled="!selectedGraphNode"
                        @click="jumpByNode(selectedGraphNode)"
                      >
                        {{ selectedNodeActionButton }}
                      </button>
                    </div>
                  </article>
                </div>
              </section>
            </aside>
          </div>
        </section>

        <section v-show="activeScene === 4" ref="guideSectionRef" class="guide-section showcase-enter" style="--delay: 0.3s">
          <div class="section-head">
            <div>
              <p class="section-kicker">第四幕 · 玄喵讲解</p>
              <h2>让玄喵把这件文物讲成故事</h2>
            </div>
            <span class="section-badge">{{ selectedArtifactDetail?.displayTitle || '等待选中文物' }}</span>
          </div>

          <div v-if="activeFilterChips.length" class="scene-context-row">
            <span class="scene-context-row__label">这一讲解承接自</span>
            <span v-for="chip in activeFilterChips" :key="chip.key" class="scene-context-chip">
              {{ chip.label }}：{{ chip.value }}
            </span>
          </div>

          <div v-if="!guideExpanded" class="guide-preview">
            <div class="guide-preview__copy">
              <div v-if="guideArtifactVisual" class="guide-artifact-visual guide-artifact-visual--preview">
                <img :src="guideArtifactVisual.image" :alt="guideArtifactVisual.title" />
                <div class="guide-artifact-visual__shade"></div>
                <div class="guide-artifact-visual__meta">
                  <span>上一幕展品</span>
                  <strong>{{ guideArtifactVisual.title }}</strong>
                </div>
                <button
                  v-if="guideArtifactVisual.hasModel"
                  class="guide-artifact-visual__action showcase-button-hover"
                  type="button"
                  @click="scrollToStage"
                >
                  回看 3D
                </button>
                <div class="guide-artifact-visual__xuanmiao" aria-hidden="true">
                  <img :src="aiAvatar" alt="" />
                </div>
              </div>
              <div v-else class="guide-avatar showcase-float" style="--delay: 0.2s">
                <img :src="aiAvatar" alt="玄喵讲解员" />
              </div>
              <h3>{{ selectedArtifactDetail?.displayTitle || '玄喵正在等待新的文物线索' }}</h3>
              <p class="guide-journey">{{ guideJourneyLine }}</p>
              <p class="guide-preview__line">{{ previewGuideOpening }}</p>
            </div>

            <div class="guide-preview__actions">
              <button
                v-for="item in quickQuestions"
                :key="item.text"
                class="question-pill showcase-button-hover"
                type="button"
                @click="openGuideAndAsk(item.text)"
              >
                {{ item.text }}
              </button>
              <button class="hero-button hero-button--primary showcase-button-hover" type="button" @click="toggleGuideExpanded(true)">
                展开讲解
              </button>
            </div>
          </div>

          <div v-else class="guide-shell">
            <aside class="guide-context">
              <div v-if="guideArtifactVisual" class="guide-artifact-visual">
                <img :src="guideArtifactVisual.image" :alt="guideArtifactVisual.title" />
                <div class="guide-artifact-visual__shade"></div>
                <div class="guide-artifact-visual__meta">
                  <span>上一幕展品</span>
                  <strong>{{ guideArtifactVisual.title }}</strong>
                </div>
                <button
                  v-if="guideArtifactVisual.hasModel"
                  class="guide-artifact-visual__action showcase-button-hover"
                  type="button"
                  @click="scrollToStage"
                >
                  回看 3D
                </button>
                <div class="guide-artifact-visual__xuanmiao" aria-hidden="true">
                  <img :src="aiAvatar" alt="" />
                </div>
              </div>
              <div v-else class="guide-avatar showcase-float" style="--delay: 0.2s">
                <img :src="aiAvatar" alt="玄喵讲解员" />
              </div>
              <h3>{{ selectedArtifactDetail?.displayTitle || '玄喵正在等待新的文物线索' }}</h3>
              <p class="guide-journey">{{ guideJourneyLine }}</p>
              <dl class="guide-facts">
                <div>
                  <dt>遗址</dt>
                  <dd>{{ selectedArtifactDetail?.siteLabel || '待补充' }}</dd>
                </div>
                <div>
                  <dt>年代</dt>
                  <dd>{{ selectedArtifactDetail?.yearLabel || '待补充' }}</dd>
                </div>
                <div>
                  <dt>工艺</dt>
                  <dd>{{ selectedArtifactDetail?.craftLabel || '待补充' }}</dd>
                </div>
              </dl>
              <button class="guide-fold showcase-button-hover" type="button" @click="toggleGuideExpanded(false)">
                收起讲解台
              </button>
            </aside>

            <section class="guide-chat">
              <div ref="messagesRef" class="message-scroll">
                <article
                  v-for="item in messages"
                  :key="item.id"
                  class="message-row"
                  :class="`message-row--${item.role}`"
                >
                  <div v-if="item.role === 'assistant'" class="message-avatar">
                    <img :src="aiAvatar" alt="玄喵" />
                  </div>
                  <div class="message-stack">
                    <div class="message-bubble">
                      <span v-if="item.role === 'guide'" class="message-guide-label">玄喵提示</span>
                      <p v-for="line in item.content" :key="line">{{ line }}</p>
                    </div>
                    <time>{{ item.time }}</time>
                  </div>
                  <div v-if="item.role === 'user'" class="message-avatar message-avatar--user" :title="userDisplayName">
                    <img v-if="userAvatarUrl" :src="userAvatarUrl" :alt="userDisplayName" />
                    <span v-else>{{ userInitial }}</span>
                  </div>
                </article>

              <div class="quick-questions quick-questions--chat" aria-label="推荐提问">
                <button
                  v-for="item in quickQuestions"
                  :key="item.text"
                  class="question-pill showcase-button-hover"
                  type="button"
                  @click="sendMessage(item.text)"
                >
                  {{ item.text }}
                </button>
              </div>

              <article v-if="isThinking && showThinkingBubble" class="message-row message-row--assistant">
                  <div class="message-avatar">
                    <img :src="aiAvatar" alt="玄喵" />
                  </div>
                  <div class="message-stack">
                    <div class="message-bubble thinking-bubble">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </article>
              </div>

              <article v-if="showTrailLoopNudge" class="trail-loop-nudge showcase-enter" aria-label="换一条线索提示">
                <div>
                  <strong>想换个线索继续看，也可以回到第一幕。</strong>
                  <span>当前文物和讲解会保留，等你问完这一轮再换入口也来得及。</span>
                </div>
                <button class="trail-loop-nudge-action" type="button" @click="returnToTrailStart">
                  换线索
                </button>
                <button class="trail-loop-nudge-close" type="button" aria-label="关闭换线索提示" @click="dismissTrailNextCard">
                  继续问
                </button>
              </article>

              <article v-if="showTrailNextCard" class="trail-next-card showcase-enter" aria-label="展线下一步推荐">
                <button class="trail-next-close" type="button" aria-label="关闭下一步推荐" @click="dismissTrailNextCard">×</button>
                <div class="trail-next-mark">
                  <i :class="showQuizPromo ? 'fas fa-award' : 'fas fa-route'"></i>
                </div>
                <div class="trail-next-copy">
                  <p class="trail-next-kicker">{{ showQuizPromo ? '玄喵小挑战' : '展线下一步' }}</p>
                  <h4>{{ showQuizPromo ? '听懂了这件文物？来试试答题赢证书' : '还想从另一个线索重新看一遍吗？' }}</h4>
                  <p>{{ showQuizPromo ? '完成挑战模式，80 分及以上可查看专属证书。' : '你可以回到祭祀坑地图或线索标签，换一个入口继续走展线。' }}</p>
                  <span>{{ showQuizPromo ? '题目围绕三星堆文化与展线知识，不会打断当前讲解。' : '当前文物和讲解不会丢失，回来后仍能接着问玄喵。' }}</span>
                </div>
                <div class="trail-next-actions">
                  <button v-if="showQuizPromo" class="trail-next-primary showcase-button-hover" type="button" @click="goQuizChallenge">
                    去答题赢证书
                  </button>
                  <button class="trail-next-secondary trail-next-secondary--route showcase-button-hover" type="button" @click="returnToTrailStart">
                    再走一条线索
                  </button>
                  <button class="trail-next-secondary" type="button" @click="dismissTrailNextCard">
                    {{ showQuizPromo ? '继续听玄喵讲' : '继续问玄喵' }}
                  </button>
                </div>
              </article>

              <form class="composer" @submit.prevent="sendMessage()">
                <textarea
                  v-model="draft"
                  rows="2"
                  maxlength="500"
                  :placeholder="composerPlaceholder"
                  @keydown.enter.exact.prevent="sendMessage()"
                />
                <button
                  class="composer-send showcase-button-hover"
                  type="submit"
                  :disabled="!draft.trim() || isThinking"
                >
                  发送
                </button>
              </form>
            </section>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { Graph as G6Graph } from '@antv/g6'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment'
import { useUserStore } from '@/store/user'
import { searchSpacetimeArtifacts, getArtifactGraph, getArtifactGraphNeighbors, getSpacetimeArtifactDetail } from '@/api/SpacetimeApi'
import { createSession as createSessionApi, getChatStreamUrl } from '@/api/AiChatApi'
import { synthesizeSpeech, revokeSpeechUrl } from '@/api/TtsApi'
import { matchFixedAnswer } from '@/config/chatReplyConfig'
import { buildFallbackReply, buildRagPrompt, searchKnowledge } from '@/utils/knowledgeSearch'
import { formatYearRange } from '@/data/competitionArtifacts'
import { pushCompetitionTrail, getRecentArtifactTrail } from '@/utils/competitionTrail'
import aiAvatar from '@/assets/sanxingdui-ai-chat/xuanmiao-avatar.png'

const TYPE_LABELS = {
  artifact: '相关文物',
  site: '遗址',
  era: '时代',
  craft: '工艺',
  material: '材质',
  meaning: '象征',
  motif: '母题',
  ritual: '仪式'
}

const TYPE_DESCRIPTIONS = {
  artifact: '当前文物或相关文物',
  site: '文物关联的出土地或遗址',
  era: '文物所属的历史阶段',
  craft: '制作技法和加工方式',
  material: '青铜、黄金、玉石等材料',
  meaning: '神权、王权、太阳崇拜等含义',
  motif: '神鸟、纵目、鱼鸟箭纹等视觉纹样',
  ritual: '通神祭祀、王权礼仪等使用语境'
}

const DEFAULT_TYPE_FILTERS = ['artifact', 'site', 'era', 'craft', 'material', 'meaning']
const VOICE_GUIDE_CACHE_LIMIT = 8
const VOICE_GUIDE_RECENT_LIMIT = 10
const VOICE_GUIDE_TTS_TIMEOUT = 7000
const VOICE_GUIDE_LOADING_TEXT = '玄喵正在组织讲解…'
const VOICE_GUIDE_START_KEY = 'trail-guide-start'
const VOICE_GUIDE_START_TEXT = '玄喵陪游已开启。接下来我会跟着你的探索路线，结合当前文物、遗址和图谱线索，边走边讲。'
const VOICE_GUIDE_START_AUDIO_URL = '/audio/xuanmiao-preset/preset.trail-guide-start.default.wav'
const VOICE_GUIDE_TEXT_FALLBACK = '语音稍慢，已先显示文字提示'
const VOICE_GUIDE_MANIFEST_URL = '/data/trail-voice-guide.manifest.json'

const TYPE_COLORS = {
  artifact: { fill: '#d2ac54', stroke: '#f3dfb4', label: '#142117' },
  site: { fill: '#2f5c4f', stroke: '#8ed8be', label: '#eff9f3' },
  era: { fill: '#395f74', stroke: '#8eb7d8', label: '#eff5fa' },
  craft: { fill: '#213329', stroke: '#78bda2', label: '#ecf7f1' },
  material: { fill: '#625744', stroke: '#cfba86', label: '#f2ead4' },
  meaning: { fill: '#4e4432', stroke: '#d4bd7f', label: '#f8f2df' },
  motif: { fill: '#744b37', stroke: '#d68a5e', label: '#f4d4c1' },
  ritual: { fill: '#3e665f', stroke: '#8bd0c1', label: '#dcf6f1' }
}

const PIT_MAP_DATA = [
  {
    pitCode: 'K1',
    title: 'K1 一号祭祀坑',
    description: '一号祭祀坑以金杖等器物为代表，适合作为古蜀王权、身份标识与祭祀权威的入口。',
    image: '/images/trail/artifacts/artifact-HI-2025-004-gold-scepter.jpg',
    imageAlt: '金杖导览图',
    imageCaption: '代表文物：金杖',
    tags: ['重点坑位', '金杖', '王权象征', '仪式权威'],
    artifacts: [
      {
        name: '金杖',
        entityId: 'HI-2025-004',
        image: '/images/trail/artifacts/artifact-HI-2025-004-gold-scepter.jpg'
      }
    ]
  },
  {
    pitCode: 'K2',
    title: 'K2 二号祭祀坑',
    description: '二号祭祀坑连接青铜神树、青铜大立人像和青铜纵目面具，是进入三星堆青铜文明最丰富的一处入口。',
    image: '/images/trail/artifacts/artifact-HI-2025-006-bronze-sacred-tree.jpg',
    imageAlt: '青铜神树导览图',
    imageCaption: '代表文物：青铜神树、青铜大立人像、青铜纵目面具',
    tags: ['重点坑位', '青铜器群', '神权祭祀', '宇宙观'],
    artifacts: [
      {
        name: '青铜神树',
        entityId: 'HI-2025-006',
        image: '/images/trail/artifacts/artifact-HI-2025-006-bronze-sacred-tree.jpg'
      },
      {
        name: '青铜大立人像',
        entityId: 'HI-2025-005',
        image: '/images/trail/artifacts/artifact-HI-2025-005-bronze-standing-figure.jpg'
      },
      {
        name: '青铜纵目面具',
        entityId: 'HI-2025-003',
        image: '/images/trail/artifacts/artifact-HI-2025-003-bronze-vertical-eye-mask.jpg'
      }
    ]
  },
  {
    pitCode: 'K3',
    title: 'K3 三号祭祀坑',
    description: '三号祭祀坑以金面罩、青铜尊、青铜罍等线索为主，适合观察金器与大型礼器如何共同构成祭祀陈设。',
    image: '/images/trail/pits/pit-K3-bronze-vessels-gold-mask.image2.png',
    imageLayout: 'portrait',
    imageAlt: 'K3 金面罩与大型铜器真实感生成图',
    imageCaption: '真实感生成：金面罩与大型铜器线索',
    tags: ['金面罩', '青铜尊', '青铜罍', '礼器组合'],
    artifacts: [
      { name: '金面罩', entityId: '', statusText: '空间线索', image: '/images/trail/pits/pit-K3-bronze-vessels-gold-mask.image2.png' },
      { name: '青铜尊、青铜罍', entityId: '', statusText: '补充线索', image: '/images/trail/pits/pit-K3-bronze-vessels-gold-mask.image2.png' }
    ]
  },
  {
    pitCode: 'K4',
    title: 'K4 四号祭祀坑',
    description: '四号祭祀坑关联铜扭头跪坐人像等人物形象线索，可补足“谁在祭祀、以什么姿态祭祀”的叙事。',
    image: '/images/trail/pits/pit-K4-kneeling-twisted-head-figure.image2.png',
    imageLayout: 'portrait',
    imageAlt: 'K4 铜扭头跪坐人像真实感生成图',
    imageCaption: '真实感生成：祭祀人物形象',
    tags: ['铜扭头跪坐人像', '人物形象', '祭祀姿态', '身份表达'],
    artifacts: [
      { name: '铜扭头跪坐人像', entityId: '', statusText: '空间线索', image: '/images/trail/pits/pit-K4-kneeling-twisted-head-figure.image2.png' },
      { name: '玉琮等玉石器线索', entityId: '', statusText: '补充线索', image: '/images/trail/pits/pit-K4-kneeling-twisted-head-figure.image2.png' }
    ]
  },
  {
    pitCode: 'K5',
    title: 'K5 五号祭祀坑',
    description: '五号祭祀坑以金面具为代表，突出黄金崇拜、高等级身份与小型坑位的出土特征。',
    image: '/images/trail/artifacts/artifact-HI-2025-002-gold-mask.jpg',
    imageAlt: '金面具导览图',
    imageCaption: '代表文物：金面具',
    tags: ['重点坑位', '金面具', '鸟形金饰', '黄金崇拜'],
    artifacts: [
      {
        name: '金面具',
        entityId: 'HI-2025-002',
        image: '/images/trail/artifacts/artifact-HI-2025-002-gold-mask.jpg'
      },
      { name: '鸟形金饰、金珠', entityId: '', statusText: '补充线索', image: '/images/trail/artifacts/artifact-HI-2025-002-gold-mask.jpg' }
    ]
  },
  {
    pitCode: 'K6',
    title: 'K6 六号祭祀坑',
    description: '六号祭祀坑关联木箱、玉刀、朱砂和丝织品残痕等特殊遗存，提醒观众关注那些不容易保存的材料。',
    image: '/images/trail/pits/pit-K6-wooden-box-jade-knife.image2.png',
    imageAlt: 'K6 木箱与玉刀真实感生成图',
    imageCaption: '真实感生成：木箱、玉刀与有机材料线索',
    tags: ['木箱', '玉刀', '朱砂', '丝织品残痕'],
    artifacts: [
      { name: '木箱、玉刀', entityId: '', statusText: '空间线索', image: '/images/trail/pits/pit-K6-wooden-box-jade-knife.image2.png' },
      { name: '朱砂与丝织品残痕', entityId: '', statusText: '补充线索', image: '/images/trail/pits/pit-K6-wooden-box-jade-knife.image2.png' }
    ]
  },
  {
    pitCode: 'K7',
    title: 'K7 七号祭祀坑',
    description: '七号祭祀坑以龟背形网格状铜器和玉石器组合为重要线索，适合观察特殊器形、结构和材料的并置。',
    image: '/images/trail/pits/pit-K7-grid-bronze-jade.image2.png',
    imageAlt: 'K7 龟背形网格状铜器真实感生成图',
    imageCaption: '真实感生成：网格铜器与玉石器组合',
    tags: ['龟背形网格状铜器', '玉石器', '特殊器形', '材料组合'],
    artifacts: [
      { name: '龟背形网格状铜器', entityId: '', statusText: '空间线索', image: '/images/trail/pits/pit-K7-grid-bronze-jade.image2.png' },
      { name: '玉石器组合', entityId: '', statusText: '补充线索', image: '/images/trail/pits/pit-K7-grid-bronze-jade.image2.png' }
    ]
  },
  {
    pitCode: 'K8',
    title: 'K8 八号祭祀坑',
    description: '八号祭祀坑集中呈现顶尊蛇身人像、铜神坛、铜神兽等神话性铜器组合，是理解三星堆想象力的重要入口。',
    image: '/images/trail/pits/pit-K8-zun-snake-body-bronze-altar.image2.png',
    imageLayout: 'portrait',
    imageAlt: 'K8 顶尊蛇身人像与铜神坛真实感生成图',
    imageCaption: '真实感生成：大型神话性铜器组合',
    tags: ['顶尊蛇身人像', '铜神坛', '铜神兽', '神话组合'],
    artifacts: [
      { name: '顶尊蛇身人像', entityId: '', statusText: '空间线索', image: '/images/trail/pits/pit-K8-zun-snake-body-bronze-altar.image2.png' },
      { name: '铜神坛、铜神兽', entityId: '', statusText: '补充线索', image: '/images/trail/pits/pit-K8-zun-snake-body-bronze-altar.image2.png' }
    ]
  }
]

const PIT_MAP_HOTSPOTS = [
  { key: 'pit-k1', kind: 'pit', pitCode: 'K1', shortLabel: 'K1', label: '一号祭祀坑 K1', x: 50.3, y: 39.8, w: 3.3, h: 6.2 },
  { key: 'pit-k2', kind: 'pit', pitCode: 'K2', shortLabel: 'K2', label: '二号祭祀坑 K2', x: 60.4, y: 53, w: 3.5, h: 6.4 },
  { key: 'pit-k3', kind: 'pit', pitCode: 'K3', shortLabel: 'K3', label: '三号祭祀坑 K3', x: 57.7, y: 34, w: 3.1, h: 5.6 },
  { key: 'pit-k4', kind: 'pit', pitCode: 'K4', shortLabel: 'K4', label: '四号祭祀坑 K4', x: 49.6, y: 32.4, w: 3.1, h: 5.6 },
  { key: 'pit-k5', kind: 'pit', pitCode: 'K5', shortLabel: 'K5', label: '五号祭祀坑 K5', x: 53.6, y: 52.5, w: 3.4, h: 6.2 },
  { key: 'pit-k6', kind: 'pit', pitCode: 'K6', shortLabel: 'K6', label: '六号祭祀坑 K6', x: 47.7, y: 50.7, w: 3.1, h: 5.8 },
  { key: 'pit-k7', kind: 'pit', pitCode: 'K7', shortLabel: 'K7', label: '七号祭祀坑 K7', x: 47.7, y: 59.5, w: 3.1, h: 5.8 },
  { key: 'pit-k8', kind: 'pit', pitCode: 'K8', shortLabel: 'K8', label: '八号祭祀坑 K8', x: 61.8, y: 62, w: 3.1, h: 5.8 },
  { key: 'artifact-staff', kind: 'artifact', pitCode: 'K1', entityId: 'HI-2025-004', shortLabel: '金杖', label: '金杖，进入一号祭祀坑展线', x: 31.2, y: 33, w: 11.5, h: 9.8 },
  { key: 'artifact-tree', kind: 'artifact', pitCode: 'K2', entityId: 'HI-2025-006', shortLabel: '神树', label: '青铜神树，进入二号祭祀坑展线', x: 69.5, y: 35.4, w: 12.4, h: 13 },
  { key: 'artifact-standing', kind: 'artifact', pitCode: 'K2', entityId: 'HI-2025-005', shortLabel: '立人', label: '青铜大立人像，进入二号祭祀坑展线', x: 69.5, y: 51, w: 12.5, h: 11.8 },
  { key: 'artifact-mask-eye', kind: 'artifact', pitCode: 'K2', entityId: 'HI-2025-003', shortLabel: '纵目', label: '青铜纵目面具，进入二号祭祀坑展线', x: 69.5, y: 66, w: 12.5, h: 11.6 },
  { key: 'artifact-gold-mask', kind: 'artifact', pitCode: 'K5', entityId: 'HI-2025-002', shortLabel: '金面具', label: '金面具，进入五号祭祀坑展线', x: 46.5, y: 73, w: 12, h: 10.5 }
]

const PIT_VOICE_GUIDE_PRESETS = {
  K1: {
    text: '你点到了一号祭祀坑。这里以金杖为代表，适合从王权象征、身份标识和祭祀权威进入三星堆展线。',
    audioUrl: '/audio/trail-guide/pit-anchor.K1.default.wav'
  },
  K2: {
    text: '你点到了二号祭祀坑。这里关联青铜神树、青铜大立人像和青铜纵目面具，是理解三星堆青铜文明最丰富的入口。',
    audioUrl: '/audio/trail-guide/pit-anchor.K2.default.wav'
  },
  K3: {
    text: '你点到了三号祭祀坑。这里可以从金面罩、青铜尊和青铜罍等线索，观察金器与大型礼器如何组成祭祀陈设。',
    audioUrl: '/audio/trail-guide/pit-anchor.K3.default.wav'
  },
  K4: {
    text: '你点到了四号祭祀坑。这里关联铜扭头跪坐人像等人物形象，适合追问谁在祭祀，以及以什么姿态祭祀。',
    audioUrl: '/audio/trail-guide/pit-anchor.K4.default.wav'
  },
  K5: {
    text: '你点到了五号祭祀坑。这里以金面具为代表，突出黄金崇拜、高等级身份和小型坑位的出土特征。',
    audioUrl: '/audio/trail-guide/pit-anchor.K5.default.wav'
  },
  K6: {
    text: '你点到了六号祭祀坑。这里关联木箱、玉刀、朱砂和丝织品残痕，提醒我们关注那些不易保存的材料线索。',
    audioUrl: '/audio/trail-guide/pit-anchor.K6.default.wav'
  },
  K7: {
    text: '你点到了七号祭祀坑。这里以龟背形网格状铜器和玉石器组合为线索，适合观察特殊器形、结构和材料并置。',
    audioUrl: '/audio/trail-guide/pit-anchor.K7.default.wav'
  },
  K8: {
    text: '你点到了八号祭祀坑。这里集中呈现顶尊蛇身人像、铜神坛和铜神兽等神话性铜器组合，是理解三星堆想象力的重要入口。',
    audioUrl: '/audio/trail-guide/pit-anchor.K8.default.wav'
  }
}

const TRAIL_COMMAND_NAV_WORDS = [
  '带我',
  '带路',
  '去',
  '看',
  '看看',
  '想看',
  '我要看',
  '打开',
  '进入',
  '跳到',
  '切到',
  '转到',
  '回到',
  '回',
  '导览'
]

const TRAIL_COMMAND_ARTIFACTS = [
  {
    entityId: 'HI-2025-002',
    title: '金面具',
    pitCode: 'K5',
    aliases: ['完整金面具', '金面具', '黄金面具', '五号坑金面具', '5号坑金面具', 'k5金面具']
  },
  {
    entityId: 'HI-2025-003',
    title: '青铜纵目面具',
    pitCode: 'K2',
    aliases: ['青铜纵目面具', '纵目面具', '纵目', '千里眼面具']
  },
  {
    entityId: 'HI-2025-004',
    title: '金杖',
    pitCode: 'K1',
    aliases: ['金杖', '黄金权杖', '权杖', '一号坑金杖', 'k1金杖']
  },
  {
    entityId: 'HI-2025-005',
    title: '青铜大立人像',
    pitCode: 'K2',
    aliases: ['青铜大立人像', '大立人', '立人像', '立人']
  },
  {
    entityId: 'HI-2025-006',
    title: '青铜神树',
    pitCode: 'K2',
    aliases: ['青铜神树', '神树', '通天神树']
  }
]

const TRAIL_COMMAND_PITS = [
  { pitCode: 'K1', title: '一号祭祀坑', aliases: ['K1', 'k1', '一号坑', '1号坑', '一号祭祀坑', '第一号坑'] },
  { pitCode: 'K2', title: '二号祭祀坑', aliases: ['K2', 'k2', '二号坑', '2号坑', '二号祭祀坑', '第二号坑'] },
  { pitCode: 'K3', title: '三号祭祀坑', aliases: ['K3', 'k3', '三号坑', '3号坑', '三号祭祀坑', '第三号坑'] },
  { pitCode: 'K4', title: '四号祭祀坑', aliases: ['K4', 'k4', '四号坑', '4号坑', '四号祭祀坑', '第四号坑'] },
  { pitCode: 'K5', title: '五号祭祀坑', aliases: ['K5', 'k5', '五号坑', '5号坑', '五号祭祀坑', '第五号坑'] },
  { pitCode: 'K6', title: '六号祭祀坑', aliases: ['K6', 'k6', '六号坑', '6号坑', '六号祭祀坑', '第六号坑'] },
  { pitCode: 'K7', title: '七号祭祀坑', aliases: ['K7', 'k7', '七号坑', '7号坑', '七号祭祀坑', '第七号坑'] },
  { pitCode: 'K8', title: '八号祭祀坑', aliases: ['K8', 'k8', '八号坑', '8号坑', '八号祭祀坑', '第八号坑'] }
]

const TRAIL_COMMAND_GRAPH_TARGETS = [
  { type: 'craft', title: '工艺', aliases: ['工艺', '技艺', '铸造', '锻造', '金箔', '鎏金', '焊接'] },
  { type: 'site', title: '遗址', aliases: ['遗址', '出土地', '地点', '三星堆遗址', '祭祀坑'] },
  { type: 'era', title: '时代', aliases: ['时代', '年代', '时期', '古蜀晚期', '古蜀'] },
  { type: 'material', title: '材质', aliases: ['材质', '材料', '青铜', '黄金', '玉石', '木器'] },
  { type: 'motif', title: '母题', aliases: ['母题', '纹样', '图案'] },
  { type: 'ritual', title: '仪式', aliases: ['仪式', '祭祀', '礼仪'] },
  { type: 'meaning', title: '象征', aliases: ['象征', '寓意', '意义', '神权', '王权', '通天', '宇宙观'] },
  { type: 'artifact', title: '相关文物', aliases: ['相关文物', '文物节点', '别的文物'] }
]

const GUIDE_CLUE_GROUPS = [
  {
    key: 'pit',
    label: '祭祀坑',
    items: ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8'].map((pitCode) => ({
      label: pitCode,
      value: pitCode,
      mode: 'guideOnly'
    }))
  },
  {
    key: 'category',
    label: '器类',
    items: ['青铜器', '金器', '玉石器', '祭祀器', '人像', '面具'].map((label) => ({
      label,
      value: label,
      mode: 'guideOnly'
    }))
  },
  {
    key: 'meaning',
    label: '象征',
    items: ['通天', '神权', '王权', '祖先崇拜', '宇宙观', '黄金崇拜'].map((label) => ({
      label,
      value: label,
      mode: 'filterable'
    }))
  },
  {
    key: 'material',
    label: '材质',
    items: ['青铜', '黄金', '玉石', '木器'].map((label) => ({
      label,
      value: label,
      mode: 'guideOnly'
    }))
  }
]

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const artifactSectionRef = ref(null)
const stageSectionRef = ref(null)
const guideSectionRef = ref(null)
const filterSectionRef = ref(null)
const viewerRef = ref(null)
const canvasRef = ref(null)
const graphRef = ref(null)
const insightPanelRef = ref(null)
const graphPanelRef = ref(null)
const messagesRef = ref(null)

const userDisplayName = computed(() => userStore.displayName || '用户')
const userAvatarUrl = computed(() => userStore.avatar || '')
const userInitial = computed(() => {
  const name = userDisplayName.value.trim()
  return name ? name.slice(0, 1).toUpperCase() : '我'
})

const activeEra = ref(String(route.query.eraCode || ''))
const activeSite = ref(String(route.query.siteCode || ''))
const activeCraft = ref(String(route.query.craftCode || ''))
const meaningFocus = ref('')
const activePitCode = ref(String(route.query.pitCode || ''))
const activeGuideClues = ref({})
const pitHotspotFeedbackKey = ref('')
const activeScene = ref(1)
const trailCommandTransition = ref({
  visible: false,
  title: '',
  line: '',
  activeIndex: 0,
  steps: []
})

const isLoading = ref(true)
const isRefreshing = ref(false)
const loadError = ref('')
const searchToken = ref(0)
const artifacts = ref([])
const searchNarrative = ref({ entryLine: '', sceneLine: '', resultLine: '' })
const siteOptions = ref([])
const eraOptions = ref([])
const craftOptions = ref([])

const selectedArtifactId = ref(String(route.query.entityId || ''))
const selectedArtifactDetail = ref(null)
const selectedReason = ref('')
const stageVisible = ref(false)
const guideExpanded = ref(false)
const stageReadyEntityId = ref('')
const graphReadyEntityId = ref('')

const isModelLoading = ref(false)
const modelProgress = ref(0)
const modelError = ref('')
const isViewerFullscreen = ref(false)
const isGraphFullscreen = ref(false)

const graphPayload = ref({
  centerNodeId: '',
  narrative: '',
  availableTypes: [],
  stats: { nodeCount: 0, edgeCount: 0, expandableCount: 0 },
  nodes: [],
  edges: []
})
const graphError = ref('')
const graphLoading = ref(false)
const activeTypeFilters = ref([])
const selectedNodeId = ref('')
const hoverNodeId = ref('')
const focusedPathIds = ref({ nodes: new Set(), edges: new Set() })
const expandedNodeIds = ref(new Set())

const draft = ref('')
const messages = ref([])
const isThinking = ref(false)
const showThinkingBubble = ref(false)
const currentSessionId = ref(null)
const lastAutoAskedEntityId = ref('')
const guideUserQuestionCount = ref(0)
const showQuizPromo = ref(false)
const trailNextCardDismissed = ref(false)
const trailLoopHintVisible = ref(false)
const trailViewHistory = ref([])
const voiceGuideEnabled = ref(false)
const voiceGuidePaused = ref(false)
const voiceGuidePlaying = ref(false)
const voiceGuideLoading = ref(false)
const voiceGuideRequestId = ref(0)
const currentNarrationText = ref('')
const lastNarrationKey = ref('')
const lastNarrationIntent = ref('')
const voiceGuideError = ref('')
const voiceGuideScrolledAway = ref(false)
const voiceGuidePeekVisible = ref(false)

const QUIZ_PROMO_SESSION_KEY = 'sanxingdui.trail.quizPromo.seen'
const QUIZ_PROMO_TRIGGER_ROUNDS = 2
const TRAIL_LOOP_NUDGE_TRIGGER_ROUNDS = 1

let scene = null
let camera = null
let renderer = null
let controls = null
let glbModel = null
let frameId = 0
let graphInstance = null
let graphClickTimer = null
let resizeObserver = null
let graphStablePositions = new Map()
let environmentTexture = null
let pmremGenerator = null
let filterTimer = null
let chatAbortController = null
let trailCommandTransitionTimers = new Set()
let previousBodyOverflow = ''
let voiceGuideTimer = null
let voiceGuideAudio = null
let voiceGuideAudioUrl = ''
let pendingVoiceGuideNarration = null
let voiceGuideAbortController = null
let voiceGuideActivePlayback = null
let isRestoringTrailView = false
let suppressNextVoiceGuideSchedule = false
const voiceGuideAudioCache = new Map()
const recentNarrationKeys = new Set()
const recentNarrationKeyQueue = []
const prebuiltVoiceGuideEntries = new Map()
const archivedNarrationKeys = new Set()
const voiceGuideActiveContext = {
  scene: 0,
  entityId: ''
}

const pitMapHotspots = PIT_MAP_HOTSPOTS
const guideClueGroups = GUIDE_CLUE_GROUPS

const visibleArtifacts = computed(() => {
  if (!meaningFocus.value) {
    return artifacts.value
  }
  return artifacts.value.filter((item) => {
    const meanings = Array.isArray(item.symbolicMeaningZh)
      ? item.symbolicMeaningZh
      : [item.symbolicMeaningZh || item.symbolicMeaning || '']
    return meanings.some((entry) => String(entry || '').includes(meaningFocus.value))
  })
})

const selectedArtifact = computed(() => {
  const fromList = visibleArtifacts.value.find((item) => item.entityId === selectedArtifactId.value)
  if (fromList) {
    return fromList
  }
  if (selectedArtifactDetail.value?.entityId === selectedArtifactId.value) {
    return selectedArtifactDetail.value
  }
  return null
})

const activePitInfo = computed(() => {
  return PIT_MAP_DATA.find((item) => item.pitCode === activePitCode.value) || {
    pitCode: '',
    title: '先从地图上点一个坑位',
    description: '这张图会帮你把文物放回三星堆祭祀区的空间关系里。点击 K1、K2、K5 可直接进入已有文物展线，其他坑位先作为空间线索记录。',
    image: '/images/trail/pit-map.png',
    imageAlt: '三星堆遗址重点文物模型位置示意图',
    imageCaption: '俯瞰图：祭祀区与代表文物位置',
    tags: ['科普示意', '空间导览', '不改变原展线'],
    artifacts: []
  }
})

const displayVisibleCount = computed(() => (isLoading.value ? '—' : visibleArtifacts.value.length))
const displayReadyCount = computed(() => {
  if (isLoading.value) return '—'
  return visibleArtifacts.value.filter((item) => item.isModelReady).length
})

const heroNarrative = computed(() => {
  return searchNarrative.value.entryLine || '先选择时代、遗址与工艺线索，系统会为你筛出相关文物；再进入 3D 展品与玄喵讲解，沿着关系图谱继续探索。'
})

const activeFilterChips = computed(() => {
  const chips = []
  const eraOption = eraOptions.value.find((item) => item.value === activeEra.value)
  const siteOption = siteOptions.value.find((item) => item.value === activeSite.value)
  const craftOption = craftOptions.value.find((item) => item.value === activeCraft.value)

  if (eraOption?.label) {
    chips.push({ key: 'era', label: '时代', value: eraOption.label })
  }
  if (siteOption?.label) {
    chips.push({ key: 'site', label: '遗址', value: siteOption.label })
  }
  if (craftOption?.label) {
    chips.push({ key: 'craft', label: '工艺', value: craftOption.label })
  }
  if (activePitCode.value) {
    chips.push({ key: 'pit', label: '坑位', value: activePitCode.value })
  }
  if (meaningFocus.value) {
    chips.push({ key: 'meaning', label: '象征', value: meaningFocus.value })
  }

  return chips
})

const sceneSteps = [
  { id: 1, title: '时空定点', subtitle: '先选一个古蜀坐标' },
  { id: 2, title: '文物驻足', subtitle: '从结果里停在一件前' },
  { id: 3, title: '展品现场', subtitle: '走近模型与关系网络' },
  { id: 4, title: '玄喵讲解', subtitle: '让故事开始往下讲' }
]

const activeSceneMeta = computed(() => sceneSteps.find((item) => item.id === activeScene.value) || sceneSteps[0])
const showTrailLoopNudge = computed(() => (
  activeScene.value === 4 &&
  guideExpanded.value &&
  !isThinking.value &&
  !showQuizPromo.value &&
  !trailNextCardDismissed.value &&
  guideUserQuestionCount.value >= TRAIL_LOOP_NUDGE_TRIGGER_ROUNDS
))
const showTrailNextCard = computed(() => activeScene.value === 4 && guideExpanded.value && showQuizPromo.value)
const trailStepBackLabel = computed(() => {
  if (isViewerFullscreen.value || isGraphFullscreen.value) return '返回展线'
  return trailViewHistory.value.length ? '返回上一步' : '回到入口'
})

const hasTrailAnchor = computed(() => Boolean(
  activePitCode.value ||
  activeEra.value ||
  activeSite.value ||
  activeCraft.value ||
  meaningFocus.value ||
  selectedArtifactId.value
))

const hasTrailArtifact = computed(() => Boolean(selectedArtifactId.value && (selectedArtifact.value || selectedArtifactDetail.value)))
const hasTrailStage = computed(() => Boolean(stageVisible.value && selectedArtifactDetail.value))
const hasTrailGuide = computed(() => Boolean(selectedArtifactDetail.value && (guideExpanded.value || activeScene.value === 4 || messages.value.some((item) => item.role === 'user'))))

const trailProgressItems = computed(() => [
  { id: 1, index: '01', label: '时空定点', done: hasTrailAnchor.value, disabled: false },
  { id: 2, index: '02', label: '文物驻足', done: hasTrailArtifact.value, disabled: false },
  { id: 3, index: '03', label: '展品现场', done: hasTrailStage.value, disabled: !selectedArtifact.value },
  { id: 4, index: '04', label: '玄喵讲解', done: hasTrailGuide.value, disabled: !selectedArtifact.value }
])

const trailSceneProgressPercent = computed(() => Math.round((activeScene.value / sceneSteps.length) * 100))

const trailProgressHint = computed(() => {
  if (activeScene.value === 1) {
    if (trailLoopHintVisible.value) {
      return '已回到第一幕，当前线索仍保留。你可以直接换一个坑位、时代或工艺。'
    }
    return hasTrailAnchor.value
      ? '你回到了第一幕，可以重新选择坑位、时代、遗址或工艺。'
      : '先从地图、时代、遗址或工艺里落下一个古蜀坐标。'
  }
  if (activeScene.value === 2) {
    return hasTrailArtifact.value
      ? '当前已经选中文物，也可以在这一幕重新驻足。'
      : '坐标已经落下，下一步挑一件代表文物停下来。'
  }
  if (activeScene.value === 3) {
    return hasTrailStage.value
      ? '展品现场已经打开，可以继续看 3D 与关系图谱。'
      : '已经选中文物，可以进入展品现场看 3D 与关系图谱。'
  }
  if (activeScene.value === 4) {
    return hasTrailGuide.value
      ? '玄喵正在承接这件文物讲解，可以继续追问。'
      : '最后让玄喵把这件文物讲成故事。'
  }
  if (!hasTrailAnchor.value) {
    return '先从地图、时代、遗址或工艺里落下一个古蜀坐标。'
  }
  if (!hasTrailArtifact.value) {
    return '坐标已经落下，下一步挑一件代表文物停下来。'
  }
  if (!hasTrailStage.value) {
    return '已经选中文物，可以进入展品现场看 3D 与关系图谱。'
  }
  if (!hasTrailGuide.value) {
    return '展品现场已经打开，最后让玄喵把这件文物讲成故事。'
  }
  return '这次展线体验已经形成闭环，可以继续提问或去答题赢证书。'
})

const resultNarrative = computed(() => {
  if (loadError.value) {
    return loadError.value
  }
  if (searchNarrative.value.sceneLine) {
    return searchNarrative.value.sceneLine
  }
  if (!visibleArtifacts.value.length) {
    return '这一组坐标暂时没有把文物带到你面前。你可以换一个时代、遗址，或换一条工艺线索。'
  }
  return `当前命中 ${visibleArtifacts.value.length} 件文物，其中 ${displayReadyCount.value} 件已经准备好 3D 模型。`
})

const stageNarrative = computed(() => {
  if (!selectedArtifactDetail.value) {
    return '先在上一幕选定一件文物，展品现场才会真正亮起来。'
  }

  const site = selectedArtifactDetail.value.siteLabel || '它的出土地'
  const era = selectedArtifactDetail.value.eraLabel || '它所属的时代'
  const craft = selectedArtifactDetail.value.craftLabel || '它背后的工艺线索'

  return `${selectedArtifactDetail.value.displayTitle} 正站在 ${site} 与 ${era} 的交汇点上。走近它，再顺着 ${craft} 和关系网络继续往下。`
})

const compactStageTitle = computed(() => {
  if (activeScene.value === 2) {
    return selectedArtifact.value?.displayTitle || '先在展厅停下一件文物'
  }
  if (activeScene.value === 3) {
    return selectedArtifactDetail.value?.displayTitle || selectedArtifact.value?.displayTitle || '走近一件文物'
  }
  if (activeScene.value === 4) {
    return selectedArtifactDetail.value?.displayTitle || '让玄喵继续开讲'
  }
  return '沿古蜀线索继续向前'
})

const compactStageLine = computed(() => {
  if (activeScene.value === 2) {
    return searchNarrative.value.resultLine || resultNarrative.value
  }
  if (activeScene.value === 3) {
    return stageNarrative.value
  }
  if (activeScene.value === 4) {
    return guideJourneyLine.value
  }
  return heroNarrative.value
})

const hasModel = computed(() => Boolean(selectedArtifactDetail.value?.resolvedGlbUrl))
const guideArtifactVisual = computed(() => {
  const artifact = selectedArtifactDetail.value || selectedArtifact.value
  if (!artifact) return null
  const image = artifact.cardImage || artifact.coverImage || ''
  if (!image) return null
  return {
    title: artifact.displayTitle || artifact.title || '当前文物',
    image,
    hasModel: Boolean(artifact.resolvedGlbUrl || artifact.isModelReady)
  }
})
const previousArtifact = computed(() => {
  if (!selectedArtifactDetail.value?.entityId) {
    return getRecentArtifactTrail(1)[0] || null
  }
  return getRecentArtifactTrail(3).find((item) => item.entityId && item.entityId !== selectedArtifactDetail.value.entityId) || null
})

const guideJourneyLine = computed(() => {
  if (!selectedArtifactDetail.value) {
    return '等你站到一件文物前，玄喵就会顺着它的工艺、寓意与时代继续往下讲。'
  }
  if (previousArtifact.value?.title) {
    return `你刚才还看过 ${previousArtifact.value.title}，现在玄喵会把它和 ${selectedArtifactDetail.value.displayTitle} 串起来继续讲。`
  }
  return `你已经走到 ${selectedArtifactDetail.value.displayTitle} 面前，玄喵会接着这件文物继续往下讲。`
})

const composerPlaceholder = computed(() => {
  if (!selectedArtifactDetail.value) {
    return '先选一件文物，再继续问玄喵。'
  }
  return `围绕“${selectedArtifactDetail.value.displayTitle}”提问，例如它的工艺、寓意或与其他文物的关系`
})

const quickQuestions = computed(() => {
  const title = selectedArtifactDetail.value?.displayTitle || '这件文物'
  return [
    { text: `讲讲${title}为什么重要` },
    { text: `${title}用了哪些关键工艺` },
    { text: `${title}和祭祀体系有什么关系` },
    { text: '下一步还适合继续看什么' }
  ]
})

const previewGuideOpening = computed(() => {
  const firstAssistant = messages.value.find((item) => item.role === 'assistant')
  return firstAssistant?.content?.[0] || '玄喵已经在这里等你，只要你愿意，它就会从这件文物开始开讲。'
})

const selectedGraphNode = computed(() => {
  const targetId = selectedNodeId.value || graphPayload.value.centerNodeId
  return graphPayload.value.nodes.find((node) => node.id === targetId) || graphPayload.value.nodes[0] || null
})

const selectedNodeTypeLabel = computed(() => TYPE_LABELS[selectedGraphNode.value?.type] || '关系线索')
const selectedNodeTitle = computed(() => selectedGraphNode.value?.label || selectedArtifactDetail.value?.displayTitle || '等待图谱载入')
const selectedNodeSummary = computed(() => {
  return selectedGraphNode.value?.summary || '顺着这条关系继续展开，你会看到文物如何回到古蜀文明的时空与工艺语境中。'
})
const activeNarrative = computed(() => {
  if (!selectedGraphNode.value || selectedGraphNode.value.id === graphPayload.value.centerNodeId) {
    return graphPayload.value.narrative || '这件文物并非孤立展品，它与遗址、时代、工艺和寓意共同构成一条可继续追踪的古蜀线索。'
  }
  return `${selectedGraphNode.value.label} 正在成为新的观察切口。顺着它继续走，你会看到这件文物背后的更多关联。`
})

const selectedNodeRelations = computed(() => {
  if (!selectedGraphNode.value) return []
  const nodesById = new Map(graphPayload.value.nodes.map((node) => [node.id, node]))
  return graphPayload.value.edges
    .filter((edge) => edge.source === selectedGraphNode.value.id || edge.target === selectedGraphNode.value.id)
    .map((edge) => {
      const targetId = edge.source === selectedGraphNode.value.id ? edge.target : edge.source
      const targetNode = nodesById.get(targetId)
      return {
        targetId,
        relation: edge.label,
        label: targetNode?.label || targetId
      }
    })
    .slice(0, 6)
})

const selectedNodeActionTitle = computed(() => {
  const node = selectedGraphNode.value
  if (!node) return '继续探索'
  if (node.type === 'artifact' && node.entityId === selectedArtifactDetail.value?.entityId) return '继续听玄喵讲这件文物'
  if (node.type === 'artifact') return '切换到另一件相关文物'
  if (node.type === 'site') return '把视角切到这个遗址'
  if (node.type === 'era') return '回到这个时代'
  if (node.type === 'craft') return '查看同工艺文物'
  if (node.type === 'material') return '追踪同材质线索'
  if (node.type === 'meaning') return '继续追踪这一寓意'
  if (node.type === 'motif') return '继续追踪这一母题'
  if (node.type === 'ritual') return '进入这类仪式语境'
  return '顺着这条关系往下走'
})

const selectedNodeActionHint = computed(() => {
  const node = selectedGraphNode.value
  if (!node) return '从当前节点继续延伸下一步。'
  if (node.type === 'artifact' && node.entityId === selectedArtifactDetail.value?.entityId) return '玄喵会接着当前图谱上下文，把这件文物讲得更完整。'
  if (node.type === 'artifact') return '不离开展线，直接把焦点切到另一件相关文物。'
  if (node.type === 'site') return '重新整理遗址筛选，让展线回到这个空间坐标。'
  if (node.type === 'era') return '重新整理时代筛选，看看同一阶段还有哪些文物。'
  if (node.type === 'craft') return '聚焦采用同类工艺的文物，让工艺线索继续展开。'
  if (node.type === 'material') return '把同材质文物聚到一起，观察材料选择背后的礼制与工艺差异。'
  if (node.type === 'meaning') return '以寓意为线索继续浏览命中文物。'
  if (node.type === 'motif') return '围绕这一视觉纹样继续查找相关文物。'
  if (node.type === 'ritual') return '从使用场景切入，看它如何连接祭祀、通神或王权礼仪。'
  return '继续沿着这条关系往下探索。'
})

const selectedNodeActionButton = computed(() => {
  const node = selectedGraphNode.value
  if (!node) return '继续探索'
  if (node.type === 'artifact' && node.entityId === selectedArtifactDetail.value?.entityId) return '听玄喵继续讲'
  if (node.type === 'artifact') return '切到这件文物'
  if (node.type === 'site') return '应用这个遗址'
  if (node.type === 'era') return '应用这个时代'
  if (node.type === 'craft') return '应用这项工艺'
  if (node.type === 'material') return '追踪同材质'
  if (node.type === 'meaning') return '追踪这一寓意'
  if (node.type === 'motif') return '追踪这一母题'
  if (node.type === 'ritual') return '追踪仪式语境'
  return '继续探索'
})

const graphTypeFilters = computed(() => {
  const counts = graphPayload.value.nodes.reduce((result, node) => {
    result[node.type] = (result[node.type] || 0) + 1
    return result
  }, {})
  return graphPayload.value.availableTypes.map((type) => ({
    type,
    label: TYPE_LABELS[type] || type,
    description: TYPE_DESCRIPTIONS[type] || '图谱节点类型',
    count: counts[type] || 0
  }))
})

const graphFilterHint = computed(() => {
  const total = graphPayload.value.availableTypes.length
  const active = activeTypeFilters.value.length
  if (!total) return '图谱类型会随当前文物自动载入。'
  if (active === total) return '当前显示全部关系类型；点击类型可临时收起，至少会保留一类避免图谱空白。'
  const labels = activeTypeFilters.value.map((type) => TYPE_LABELS[type] || type).join('、')
  return `当前只看：${labels || '全部关系'}。再次点击可恢复对应类型。`
})

const xuanmiaoTrailMode = computed(() => {
  if (!voiceGuideEnabled.value) return '未开启'
  if (voiceGuideError.value) return '语音暂不可用'
  if (voiceGuidePaused.value) return '已暂停'
  if (voiceGuideLoading.value) return '准备中'
  if (voiceGuidePlaying.value) return '陪游中'
  if (activeScene.value === 4 && guideExpanded.value) return '可追问'
  return '陪游中'
})

const xuanmiaoCompanionLine = computed(() => {
  if (currentNarrationText.value) return currentNarrationText.value
  if (activeScene.value === 4 && guideExpanded.value) {
    return '玄喵已经接上刚才的讲解，你可以继续追问这件文物的线索。'
  }
  return '开启后，玄喵会边走边讲；想细问时，可以直接进入第四幕追问。'
})

const voiceGuideAutoCollapsed = computed(() => voiceGuideScrolledAway.value && !voiceGuidePeekVisible.value)

function syncVoiceGuideCollapseState() {
  const scrolledAway = window.scrollY > 72
  voiceGuideScrolledAway.value = scrolledAway
  if (!scrolledAway) {
    voiceGuidePeekVisible.value = false
  }
}

function revealVoiceGuidePanel() {
  if (!voiceGuideScrolledAway.value) return
  voiceGuidePeekVisible.value = true
}

function hideVoiceGuidePanelIfNeeded() {
  if (!voiceGuideScrolledAway.value) return
  voiceGuidePeekVisible.value = false
}

onMounted(async () => {
  window.addEventListener('keydown', handleViewerKeydown)
  window.addEventListener('scroll', syncVoiceGuideCollapseState, { passive: true })
  window.addEventListener('xuanmiao:speech-ended', handleXuanmiaoSpeechEnded)
  window.addEventListener('xuanmiao:speech-error', handleXuanmiaoSpeechError)
  window.addEventListener('xuanmiao:speech-stopped', handleXuanmiaoSpeechStopped)
  window.addEventListener('xuanmiao:trail-command', handleTrailCommandEvent)
  syncVoiceGuideCollapseState()
  hydrateQuizPromoState()
  void loadVoiceGuideManifest()
  await loadArtifacts()
  mountResizeObserver()
})

onBeforeUnmount(() => {
  if (filterTimer) window.clearTimeout(filterTimer)
  if (graphClickTimer) window.clearTimeout(graphClickTimer)
  clearTrailCommandTransitionTimer()
  window.removeEventListener('keydown', handleViewerKeydown)
  window.removeEventListener('scroll', syncVoiceGuideCollapseState)
  window.removeEventListener('xuanmiao:speech-ended', handleXuanmiaoSpeechEnded)
  window.removeEventListener('xuanmiao:speech-error', handleXuanmiaoSpeechError)
  window.removeEventListener('xuanmiao:speech-stopped', handleXuanmiaoSpeechStopped)
  window.removeEventListener('xuanmiao:trail-command', handleTrailCommandEvent)
  restoreViewerPageState()
  restoreGraphPageState()
  resizeObserver?.disconnect()
  destroyThreeStage()
  destroyGraph()
  chatAbortController?.abort?.()
  cancelVoiceGuideRequest()
  stopVoiceGuideAudio()
  clearVoiceGuideAudioCache()
})

watch([activeEra, activeSite, activeCraft], () => {
  activeScene.value = 1
  stageVisible.value = false
  guideExpanded.value = false
  if (filterTimer) window.clearTimeout(filterTimer)
  filterTimer = window.setTimeout(() => {
    void loadArtifacts()
  }, 180)
})

watch(meaningFocus, () => {
  syncSelectedArtifactFromVisible()
})

watch(
  [activeScene, stageVisible, () => selectedArtifactDetail.value?.entityId],
  async ([sceneId, stageOpen, entityId]) => {
    if (sceneId === 3 && stageOpen && entityId) {
      await ensureStageExperience()
      return
    }

    destroyThreeStage()
    destroyGraph()
    stageReadyEntityId.value = ''
    graphReadyEntityId.value = ''
  }
)

watch(
  [
    activeScene,
    stageVisible,
    guideExpanded,
    selectedNodeId,
    () => selectedArtifactDetail.value?.entityId,
    activePitCode,
    meaningFocus,
    () => visibleArtifacts.value.length
  ],
  () => {
    if (suppressNextVoiceGuideSchedule) {
      suppressNextVoiceGuideSchedule = false
      return
    }
    scheduleVoiceGuideNarration()
  },
  { flush: 'post' }
)

async function loadArtifacts() {
  const token = ++searchToken.value
  loadError.value = ''
  if (artifacts.value.length) {
    isRefreshing.value = true
  } else {
    isLoading.value = true
  }

  try {
    const response = await searchSpacetimeArtifacts(
      {
        eraCode: activeEra.value || undefined,
        siteCode: activeSite.value || undefined,
        craftCode: activeCraft.value || undefined
      },
      { showDefaultMsg: false }
    )

    if (token !== searchToken.value) return

    artifacts.value = Array.isArray(response?.artifacts) ? response.artifacts : []
    searchNarrative.value = response?.narrative || { entryLine: '', sceneLine: '', resultLine: '' }
    siteOptions.value = response?.facets?.siteOptions || []
    eraOptions.value = response?.facets?.eraOptions || []
    craftOptions.value = response?.facets?.craftOptions || []

    syncSelectedArtifactFromVisible()
    syncQueryState()
  } catch (error) {
    console.error('加载时空展线失败:', error)
    loadError.value = '时空展线暂时没有完整展开。你可以稍后重试，或先回到首页和其他页面继续浏览。'
  } finally {
    if (token === searchToken.value) {
      isLoading.value = false
      isRefreshing.value = false
    }
  }
}

function syncSelectedArtifactFromVisible() {
  if (!visibleArtifacts.value.length) {
    activeScene.value = 1
    stageVisible.value = false
    selectedArtifactId.value = ''
    selectedArtifactDetail.value = null
    selectedReason.value = ''
    destroyThreeStage()
    destroyGraph()
    stageReadyEntityId.value = ''
    graphReadyEntityId.value = ''
    resetMessages()
    return
  }

  const stillVisible = visibleArtifacts.value.find((item) => item.entityId === selectedArtifactId.value)
  if (stillVisible) {
    void selectArtifact(stillVisible, selectedReason.value || buildArtifactReason(stillVisible), {
      keepScene: true
    })
    return
  }

  const nextArtifact = recommendArtifact(visibleArtifacts.value)
  void selectArtifact(nextArtifact, buildArtifactReason(nextArtifact), {
    keepScene: true
  })
}

function recommendArtifact(list) {
  return [...list].sort((a, b) => scoreArtifact(b) - scoreArtifact(a))[0]
}

function scoreArtifact(item) {
  let score = 0
  if (item.isModelReady) score += 40
  if (item.symbolicMeaningZh?.length || item.symbolicMeaning) score += 20
  if (item.craftNamesZh?.length) score += item.craftNamesZh.length * 6
  if (item.summary) score += 8
  if (item.cardImage || item.coverImage) score += 5
  return score
}

function buildArtifactReason(item) {
  const reasons = []
  if (item.isModelReady) reasons.push('已具备 3D 模型')
  if ((item.symbolicMeaningZh?.length || 0) > 0 || item.symbolicMeaning) reasons.push('寓意线索更完整')
  if ((item.craftNamesZh?.length || 0) > 1) reasons.push('关联工艺更丰富')
  if (!reasons.length) reasons.push('它最适合从当前筛选视角先看')
  return `优先推荐理由：${reasons.join('、')}。`
}

async function selectArtifact(artifact, reason = '', options = {}) {
  if (!artifact?.entityId) return

  const { keepScene = false, skipHistory = false } = options

  const sameArtifact =
    selectedArtifactId.value === artifact.entityId &&
    selectedArtifactDetail.value?.entityId === artifact.entityId

  if (!skipHistory && !sameArtifact) {
    pushTrailViewSnapshot('select-artifact')
  }

  selectedArtifactId.value = artifact.entityId
  selectedReason.value = reason || buildArtifactReason(artifact)
  if (!keepScene) {
    activeScene.value = 2
  }
  syncQueryState()

  if (sameArtifact) return
  await loadSelectedArtifactExperience(artifact.entityId)
}

async function loadSelectedArtifactExperience(entityId) {
  guideExpanded.value = false
  stageVisible.value = false
  selectedArtifactDetail.value = null
  destroyThreeStage()
  destroyGraph()
  stageReadyEntityId.value = ''
  graphReadyEntityId.value = ''
  modelError.value = ''
  modelProgress.value = 0
  graphError.value = ''

  try {
    const detail = await getSpacetimeArtifactDetail({ entityId }, { showDefaultMsg: false })
    selectedArtifactDetail.value = detail
    pushCompetitionTrail({
      entityId: detail.entityId,
      title: detail.displayTitle,
      siteLabel: detail.siteLabel,
      eraLabel: detail.eraLabel,
      reason: selectedReason.value,
      stage: 'trail',
      sourceStage: 'trail'
    })

    await initializeGuide()

    if (activeScene.value === 3 && stageVisible.value) {
      await ensureStageExperience(true)
    }
  } catch (error) {
    console.error('加载焦点文物失败:', error)
    selectedArtifactDetail.value = null
    modelError.value = '当前文物详情未能完整读取，你仍然可以保留筛选结果并切换到其他文物。'
    resetMessages()
  }
}

function syncQueryState() {
  router.replace({
    path: '/trail',
    query: {
      eraCode: activeEra.value || undefined,
      siteCode: activeSite.value || undefined,
      craftCode: activeCraft.value || undefined,
      pitCode: activePitCode.value || undefined,
      entityId: selectedArtifactId.value || undefined
    }
  })
}

function createTrailViewSnapshot(reason = '') {
  return {
    reason,
    activeScene: activeScene.value,
    activePitCode: activePitCode.value,
    selectedArtifactId: selectedArtifactId.value,
    selectedNodeId: selectedNodeId.value,
    stageVisible: stageVisible.value,
    guideExpanded: guideExpanded.value,
    meaningFocus: meaningFocus.value,
    activeGuideClues: { ...activeGuideClues.value },
    isViewerFullscreen: isViewerFullscreen.value,
    isGraphFullscreen: isGraphFullscreen.value
  }
}

function getTrailViewSnapshotKey(snapshot) {
  return JSON.stringify({
    activeScene: snapshot.activeScene,
    activePitCode: snapshot.activePitCode,
    selectedArtifactId: snapshot.selectedArtifactId,
    selectedNodeId: snapshot.selectedNodeId,
    stageVisible: snapshot.stageVisible,
    guideExpanded: snapshot.guideExpanded,
    meaningFocus: snapshot.meaningFocus,
    activeGuideClues: snapshot.activeGuideClues,
    isViewerFullscreen: snapshot.isViewerFullscreen,
    isGraphFullscreen: snapshot.isGraphFullscreen
  })
}

function pushTrailViewSnapshot(reason = '') {
  if (isRestoringTrailView) return
  const snapshot = createTrailViewSnapshot(reason)
  const latest = trailViewHistory.value[trailViewHistory.value.length - 1]
  if (latest && getTrailViewSnapshotKey(latest) === getTrailViewSnapshotKey(snapshot)) return
  trailViewHistory.value = [...trailViewHistory.value.slice(-7), snapshot]
}

function scrollToTrailSnapshot(snapshot) {
  nextTick(() => {
    if (snapshot.activeScene === 1) {
      filterSectionRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      return
    }
    if (snapshot.activeScene === 2) {
      artifactSectionRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      return
    }
    if (snapshot.activeScene === 3) {
      stageSectionRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      restoreGraphPanelScrollPosition()
      return
    }
    if (snapshot.activeScene === 4) {
      guideSectionRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
      scrollMessagesToBottom()
    }
  })
}

async function restoreTrailViewSnapshot(snapshot) {
  isRestoringTrailView = true
  try {
    if (isViewerFullscreen.value) setViewerFullscreen(false)
    if (isGraphFullscreen.value) setGraphFullscreen(false)

    activeScene.value = snapshot.activeScene || 1
    activePitCode.value = snapshot.activePitCode || ''
    selectedArtifactId.value = snapshot.selectedArtifactId || ''
    selectedNodeId.value = snapshot.selectedNodeId || ''
    stageVisible.value = Boolean(snapshot.stageVisible)
    guideExpanded.value = Boolean(snapshot.guideExpanded)
    meaningFocus.value = snapshot.meaningFocus || ''
    activeGuideClues.value = { ...(snapshot.activeGuideClues || {}) }
    trailLoopHintVisible.value = false
    trailNextCardDismissed.value = false
    syncQueryState()

    if (
      selectedArtifactId.value &&
      selectedArtifactDetail.value?.entityId !== selectedArtifactId.value
    ) {
      await loadSelectedArtifactExperience(selectedArtifactId.value)
      stageVisible.value = Boolean(snapshot.stageVisible)
      guideExpanded.value = Boolean(snapshot.guideExpanded)
      selectedNodeId.value = snapshot.selectedNodeId || selectedNodeId.value
    }

    await nextTick()
    if (activeScene.value === 3 && stageVisible.value) {
      await ensureStageExperience(true)
      if (selectedNodeId.value) {
        await applyFocusState(selectedNodeId.value, false)
      }
    }
    scrollToTrailSnapshot(snapshot)
  } finally {
    isRestoringTrailView = false
  }
}

async function goBackTrailStep() {
  if (isViewerFullscreen.value) {
    setViewerFullscreen(false)
    return
  }
  if (isGraphFullscreen.value) {
    setGraphFullscreen(false)
    return
  }

  const history = [...trailViewHistory.value]
  const snapshot = history.pop()
  trailViewHistory.value = history

  if (snapshot) {
    await restoreTrailViewSnapshot(snapshot)
    return
  }

  if (activeScene.value !== 1 || stageVisible.value || guideExpanded.value) {
    pushTrailViewSnapshot('fallback-entry')
    activeScene.value = 1
    stageVisible.value = false
    guideExpanded.value = false
    trailLoopHintVisible.value = true
    await nextTick()
    filterSectionRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }
}

function describeFacet(option) {
  const count = Number(option?.artifactCount || 0)
  const ready = Number(option?.readyModelCount || 0)
  return `命中 ${count} 件 · ${ready} 件可进 3D`
}

function getPitHotspotStyle(spot) {
  return {
    left: `${spot.x}%`,
    top: `${spot.y}%`,
    width: `${spot.w}%`,
    height: `${spot.h}%`
  }
}

function getPitInfo(pitCode) {
  return PIT_MAP_DATA.find((item) => item.pitCode === pitCode) || null
}

function triggerPitHotspotFeedback(key) {
  if (!key) return
  pitHotspotFeedbackKey.value = key
  window.setTimeout(() => {
    if (pitHotspotFeedbackKey.value === key) {
      pitHotspotFeedbackKey.value = ''
    }
  }, 420)
}

function suppressAutomaticVoiceGuideOnce() {
  suppressNextVoiceGuideSchedule = true
  cancelVoiceGuideRequest()
}

function selectPitHotspot(spot) {
  if (!spot?.pitCode) return
  triggerPitHotspotFeedback(spot.key)
  const willChangePit = activePitCode.value !== spot.pitCode
  const willEnterArtifact = spot.kind === 'artifact' && spot.entityId
  if (willChangePit || willEnterArtifact) {
    suppressAutomaticVoiceGuideOnce()
  }
  activePitCode.value = spot.pitCode
  activeGuideClues.value = { ...activeGuideClues.value, pit: spot.pitCode }
  syncQueryState()

  const pitInfo = getPitInfo(spot.pitCode)
  const message = buildPitVoiceGuideText(pitInfo)

  if (spot.kind === 'artifact' && spot.entityId) {
    window.setTimeout(() => enterPitArtifact({
      name: spot.shortLabel,
      entityId: spot.entityId,
      pitCode: spot.pitCode
    }), 140)
    return
  }

  announcePitVoiceGuide(message, spot.pitCode)
}

function enterPitArtifact(artifact) {
  if (!artifact?.entityId) {
    announcePitVoiceGuide('这个坑位资料先作为空间线索记录，后续可继续补齐文物展线。', activePitCode.value || artifact?.name || 'pending')
    return
  }

  const pitCode = artifact.pitCode || activePitCode.value
  if (pitCode) {
    suppressAutomaticVoiceGuideOnce()
    activePitCode.value = pitCode
    activeGuideClues.value = { ...activeGuideClues.value, pit: pitCode }
  }

  const listArtifact = artifacts.value.find((item) => item.entityId === artifact.entityId)
  const target = listArtifact || (selectedArtifactDetail.value?.entityId === artifact.entityId ? selectedArtifactDetail.value : null)

  const fallbackArtifact = target || {
    entityId: artifact.entityId,
    displayTitle: artifact.name,
    title: artifact.name
  }

  const reason = pitCode
    ? `你从三星堆祭祀坑俯瞰图的 ${pitCode} 进入，先看 ${artifact.name}。`
    : `你从三星堆祭祀坑俯瞰图进入，先看 ${artifact.name}。`

  announcePitVoiceGuide(`${reason} 玄喵会沿着这条空间线索继续讲。`, `${pitCode || 'artifact'}-${artifact.entityId}`)
  pushTrailViewSnapshot('pit-artifact')
  void selectArtifact(fallbackArtifact, reason, { skipHistory: true })
}

function selectGuideClue(group, clue) {
  if (!group?.key || !clue?.value) return

  if (group.key === 'pit') {
    const isSamePit = activePitCode.value === clue.value
    const nextPitCode = isSamePit ? '' : clue.value
    suppressAutomaticVoiceGuideOnce()
    activePitCode.value = nextPitCode
    activeGuideClues.value = { ...activeGuideClues.value, pit: nextPitCode }
    syncQueryState()
    announcePitVoiceGuide(
      nextPitCode
        ? buildPitVoiceGuideText(getPitInfo(nextPitCode))
        : `已取消 ${clue.label} 这条坑位线索，展线不会自动跳转。`,
      `pit-clue-${clue.value}-${nextPitCode || 'off'}`
    )
    return
  }

  if (group.key === 'meaning' && clue.mode === 'filterable') {
    suppressAutomaticVoiceGuideOnce()
    meaningFocus.value = meaningFocus.value === clue.value ? '' : clue.value
    activeGuideClues.value = { ...activeGuideClues.value, [group.key]: meaningFocus.value }
    syncQueryState()
    announcePitVoiceGuide(
      meaningFocus.value
        ? `你把线索落在“${clue.label}”。接下来文物结果会优先沿着这条象征意义收束。`
        : `已取消“${clue.label}”这条象征线索。`,
      `meaning-${clue.value}-${meaningFocus.value || 'off'}`
    )
    return
  }

  const currentValue = activeGuideClues.value[group.key]
  const nextValue = currentValue === clue.value ? '' : clue.value
  activeGuideClues.value = { ...activeGuideClues.value, [group.key]: nextValue }
  announcePitVoiceGuide(
    nextValue
      ? `“${clue.label}”已作为导览线索记录，当前先不改变文物结果。`
      : `已取消“${clue.label}”这条导览线索。`,
    `${group.key}-${clue.value}-${nextValue || 'off'}`
  )
}

function isGuideClueActive(group, clue) {
  if (group.key === 'pit') return activePitCode.value === clue.value
  if (group.key === 'meaning') return meaningFocus.value === clue.value
  return activeGuideClues.value[group.key] === clue.value
}

function buildPitVoiceGuideText(pitInfo) {
  if (!pitInfo) return '这个坑位资料先作为空间线索记录，后续可继续补齐文物展线。'
  return PIT_VOICE_GUIDE_PRESETS[pitInfo.pitCode]?.text || '这个坑位资料先作为空间线索记录，后续可继续补齐文物展线。'
}

function announcePitVoiceGuide(text, key) {
  if (!text) return
  const preset = PIT_VOICE_GUIDE_PRESETS[key] || null
  cancelVoiceGuideRequest()
  currentNarrationText.value = text
  if (!voiceGuideEnabled.value || voiceGuidePaused.value) return
  void playVoiceGuideNarration(
    {
      key: `pit-map-${key}`,
      intent: 'pit-map',
      text: preset?.text || text,
      scene: activeScene.value,
      entityId: selectedArtifactId.value || '',
      audioUrl: preset?.audioUrl || '',
      skipPreset: true
    },
    false
  )
}

function normalizeTrailCommandText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[，。！？,.!?;；:：、"'“”‘’（）()[\]{}<>《》]/g, '')
}

function trailTextIncludesAny(normalizedText, words = []) {
  return words.some((word) => normalizedText.includes(normalizeTrailCommandText(word)))
}

function hasTrailNavigationIntent(normalizedText) {
  return trailTextIncludesAny(normalizedText, TRAIL_COMMAND_NAV_WORDS)
}

function findTrailArtifactMatches(normalizedText) {
  const matches = TRAIL_COMMAND_ARTIFACTS.filter((artifact) => {
    return artifact.aliases.some((alias) => normalizedText.includes(normalizeTrailCommandText(alias)))
  })

  const unique = new Map(matches.map((item) => [item.entityId, item]))
  return [...unique.values()]
}

function findTrailPitMatch(normalizedText) {
  return TRAIL_COMMAND_PITS.find((pit) => {
    return pit.aliases.some((alias) => normalizedText.includes(normalizeTrailCommandText(alias)))
  }) || null
}

function findTrailGraphTarget(normalizedText) {
  return TRAIL_COMMAND_GRAPH_TARGETS.find((target) => {
    return target.aliases.some((alias) => normalizedText.includes(normalizeTrailCommandText(alias)))
  }) || null
}

function parseTrailCommand(text) {
  const normalizedText = normalizeTrailCommandText(text)
  if (!normalizedText) return null

  const hasNavIntent = hasTrailNavigationIntent(normalizedText)
  const hasQuestionCue = trailTextIncludesAny(normalizedText, ['什么', '为什么', '含义', '意义', '代表', '怎么', '如何'])
  const hasStrongNavIntent = trailTextIncludesAny(normalizedText, [
    '带我',
    '带路',
    '去',
    '打开',
    '进入',
    '跳到',
    '切到',
    '转到',
    '回到',
    '回',
    '导览',
    '我要看',
    '想看'
  ])
  const hasDirectLookIntent = normalizedText.startsWith('看') && !hasQuestionCue
  const hasCommandIntent = hasStrongNavIntent || hasDirectLookIntent
  const hasGraphCue = trailTextIncludesAny(normalizedText, ['图谱', '关系', '节点', '网络', '关联'])
  const hasStageCue = trailTextIncludesAny(normalizedText, ['3d', '三维', '模型', '展品现场', '现场', '旋转'])
  const hasGuideCue = trailTextIncludesAny(normalizedText, ['继续讲解', '继续讲', '玄喵讲', '开讲', '讲解这件', '听讲解', '听玄喵'])
  const hasQuizCue = trailTextIncludesAny(normalizedText, ['答题', '证书', 'quiz', '挑战'])
  const hasSceneOneCue = trailTextIncludesAny(normalizedText, ['第一幕', '时空定点', '回地图', '回筛选', '回坐标'])
  const hasArtifactListCue = trailTextIncludesAny(normalizedText, ['文物列表', '第二幕', '命中文物', '看命中文物'])

  if (hasQuizCue && (hasNavIntent || trailTextIncludesAny(normalizedText, ['赢证书', '去答题']))) {
    return { action: 'startQuiz' }
  }

  if (hasSceneOneCue && hasNavIntent) {
    return { action: 'goSceneOne' }
  }

  if (hasArtifactListCue && hasNavIntent) {
    return { action: 'goArtifactList' }
  }

  if (hasCommandIntent) {
    const artifactsMatched = findTrailArtifactMatches(normalizedText)
    if (artifactsMatched.length === 1) {
      return { action: 'goToArtifact', artifact: artifactsMatched[0] }
    }
    if (artifactsMatched.length > 1 || (normalizedText.includes('面具') && !artifactsMatched.length)) {
      return {
        action: 'ambiguous',
        message: '你说的“面具”可能指金面具，也可能指青铜纵目面具。你可以说“带我看金面具”或“带我看纵目面具”。'
      }
    }

    const pitMatched = findTrailPitMatch(normalizedText)
    if (pitMatched) {
      return { action: 'selectPit', pit: pitMatched }
    }
  }

  if (hasGraphCue) {
    return { action: 'focusGraphNode', target: findTrailGraphTarget(normalizedText), rawText: normalizedText }
  }

  if (hasStageCue && (hasNavIntent || trailTextIncludesAny(normalizedText, ['3d', '三维']))) {
    return { action: 'openStage' }
  }

  if (hasGuideCue && (hasNavIntent || trailTextIncludesAny(normalizedText, ['讲解', '玄喵']))) {
    return { action: 'openGuide' }
  }

  return null
}

function sayTrailCommand(text, key = 'reply') {
  if (!text) return
  currentNarrationText.value = text
  window.dispatchEvent(new CustomEvent('xuanmiao:say', {
    detail: {
      key: `trail-command-${key}`,
      text,
      source: 'trail-command',
      interrupt: true,
      playDelayMs: 120,
      charDelay: 68
    }
  }))
}

function stopTrailGuideForCommand() {
  cancelVoiceGuideRequest()
  stopExternalXuanmiaoSpeech()
  stopVoiceGuideAudio()
  voiceGuidePlaying.value = false
  voiceGuideLoading.value = false
}

function clearTrailCommandTransitionTimer() {
  trailCommandTransitionTimers.forEach((timer) => {
    window.clearTimeout(timer)
  })
  trailCommandTransitionTimers.clear()
}

function setTrailCommandTransitionTimer(callback, ms) {
  const timer = window.setTimeout(() => {
    trailCommandTransitionTimers.delete(timer)
    callback()
  }, ms)
  trailCommandTransitionTimers.add(timer)
  return timer
}

function resetTrailCommandTransition() {
  clearTrailCommandTransitionTimer()
  trailCommandTransition.value = {
    visible: false,
    title: '',
    line: '',
    activeIndex: 0,
    steps: []
  }
}

function waitTrailCommandTransition(ms = 520) {
  return new Promise((resolve) => {
    setTrailCommandTransitionTimer(() => {
      resolve()
    }, ms)
  })
}

function buildTrailCommandTransitionSteps(artifactCommand) {
  const pitTitle = artifactCommand.pitCode
    ? getPitInfo(artifactCommand.pitCode)?.title || `${artifactCommand.pitCode} 祭祀坑`
    : '目标线索'
  return [
    { key: 'pit', label: `定位${pitTitle}` },
    { key: 'guide', label: '调取讲解资料' },
    { key: 'stage', label: '进入展品现场' }
  ]
}

function showTrailCommandTransition(artifactCommand) {
  resetTrailCommandTransition()
  trailCommandTransition.value = {
    visible: true,
    title: `前往 ${artifactCommand.title}`,
    line: `正在顺着${artifactCommand.title}的出土线索往展品现场走，讲解也在同步准备。`,
    activeIndex: 0,
    steps: buildTrailCommandTransitionSteps(artifactCommand)
  }
}

async function runTrailCommandTransitionStep(index, line, ms = 620) {
  trailCommandTransition.value = {
    ...trailCommandTransition.value,
    activeIndex: index,
    line
  }
  await waitTrailCommandTransition(ms)
}

function hideTrailCommandTransition(delay = 460) {
  setTrailCommandTransitionTimer(() => {
    trailCommandTransition.value = {
      ...trailCommandTransition.value,
      visible: false
    }
  }, delay)
}

function handleTrailCommandEvent(event) {
  const detail = event?.detail || {}
  const respond = typeof detail.respond === 'function' ? detail.respond : () => {}

  if (route.path !== '/trail') {
    respond({ handled: false })
    return
  }

  let command = null
  try {
    command = parseTrailCommand(detail.text)
  } catch (error) {
    console.error('玄喵展线命令解析失败:', error)
    respond({ handled: false })
    return
  }
  if (!command) {
    respond({ handled: false })
    return
  }

  respond({ handled: true, action: command.action })
  void executeTrailCommand(command)
}

async function executeTrailCommand(command) {
  stopTrailGuideForCommand()

  try {
    if (command.action === 'ambiguous') {
      sayTrailCommand(command.message, 'ambiguous')
      return
    }

    if (command.action === 'startQuiz') {
      sayTrailCommand('好，我带你去答题赢证书。未登录的话，系统会先带你登录，再回到答题页。', 'quiz')
      window.setTimeout(() => {
        void router.push('/quiz')
      }, 360)
      return
    }

    if (command.action === 'goSceneOne') {
      pushTrailViewSnapshot('command-scene-one')
      activeScene.value = 1
      stageVisible.value = false
      guideExpanded.value = false
      sayTrailCommand('好，我们回到第一幕。你可以重新从祭祀坑地图、时代、遗址和工艺里定一个坐标。', 'scene-one')
      return
    }

    if (command.action === 'goArtifactList') {
      scrollToArtifacts()
      sayTrailCommand('好，我把视线切回文物驻足。你可以先选一件文物，再进入 3D、图谱和讲解。', 'artifact-list')
      return
    }

    if (command.action === 'goToArtifact') {
      await executeTrailGoToArtifact(command.artifact)
      return
    }

    if (command.action === 'selectPit') {
      executeTrailSelectPit(command.pit)
      return
    }

    if (command.action === 'openStage') {
      await executeTrailOpenStage()
      return
    }

    if (command.action === 'openGuide') {
      await executeTrailOpenGuide()
      return
    }

    if (command.action === 'focusGraphNode') {
      await executeTrailFocusGraphNode(command.target, command.rawText)
    }
  } catch (error) {
    console.error('玄喵展线动作执行失败:', error)
    hideTrailCommandTransition(180)
    sayTrailCommand('这一步我没能顺利带过去。你可以先手动点一下当前展线按钮，我再继续讲解。', 'error')
  }
}

async function ensureTrailArtifactDetailReady() {
  if (selectedArtifactDetail.value) return true
  if (selectedArtifact.value) {
    await selectArtifact(selectedArtifact.value, selectedReason.value || buildArtifactReason(selectedArtifact.value), {
      keepScene: true
    })
  }
  return Boolean(selectedArtifactDetail.value)
}

async function executeTrailGoToArtifact(artifactCommand) {
  pushTrailViewSnapshot('command-artifact')
  const target =
    artifacts.value.find((item) => item.entityId === artifactCommand.entityId) ||
    (selectedArtifactDetail.value?.entityId === artifactCommand.entityId ? selectedArtifactDetail.value : null) ||
    {
      entityId: artifactCommand.entityId,
      displayTitle: artifactCommand.title,
      title: artifactCommand.title
    }

  sayTrailCommand(`好，我带你去看${artifactCommand.title}，讲解资料也会同步准备。`, `artifact-${artifactCommand.entityId}-start`)
  showTrailCommandTransition(artifactCommand)

  if (artifactCommand.pitCode) {
    activeScene.value = 1
    stageVisible.value = false
    guideExpanded.value = false
    activePitCode.value = artifactCommand.pitCode
    activeGuideClues.value = { ...activeGuideClues.value, pit: artifactCommand.pitCode }
    triggerPitHotspotFeedback(`pit-${artifactCommand.pitCode.toLowerCase()}`)
    syncQueryState()
  }

  const selectPromise = selectArtifact(target, `玄喵根据你的指令，带你直接来到 ${artifactCommand.title}。`, {
    keepScene: true,
    skipHistory: true
  })

  await runTrailCommandTransitionStep(
    0,
    artifactCommand.pitCode
      ? `${artifactCommand.title}的空间线索已经落到${getPitInfo(artifactCommand.pitCode)?.title || artifactCommand.pitCode}。`
      : `已经锁定${artifactCommand.title}的展线位置。`,
    720
  )

  activeScene.value = 2
  stageVisible.value = false
  guideExpanded.value = false
  await nextTick()

  await runTrailCommandTransitionStep(
    1,
    `文物详情、知识图谱和开场讲解正在同步调取，稍后可以直接接着听。`,
    780
  )

  await selectPromise
  if (!selectedArtifactDetail.value) {
    sayTrailCommand(`我找到了${artifactCommand.title}，但这件文物的详情暂时没载入完成。你可以稍等一下再让我打开展品现场。`, `artifact-${artifactCommand.entityId}-pending`)
    hideTrailCommandTransition(180)
    return
  }

  stageVisible.value = true
  activeScene.value = 3
  await nextTick()
  const stagePromise = ensureStageExperience(true)
  await runTrailCommandTransitionStep(
    2,
    `${artifactCommand.title}的展品现场正在打开，右侧图谱也会跟着展开。`,
    640
  )
  await stagePromise
  hideTrailCommandTransition()
  sayTrailCommand(`到了，我们现在看${artifactCommand.title}。开场讲解已经在第四幕整理，想继续听可以直接进入玄喵讲解。`, `artifact-${artifactCommand.entityId}`)
}

function executeTrailSelectPit(pitCommand) {
  pushTrailViewSnapshot('command-select-pit')
  activeScene.value = 1
  stageVisible.value = false
  guideExpanded.value = false
  activePitCode.value = pitCommand.pitCode
  activeGuideClues.value = { ...activeGuideClues.value, pit: pitCommand.pitCode }
  syncQueryState()
  triggerPitHotspotFeedback(`pit-${pitCommand.pitCode.toLowerCase()}`)
  sayTrailCommand(`好，我把地图焦点放到${pitCommand.title}。这里先记录空间线索，不会自动跳到某一件文物。`, `pit-${pitCommand.pitCode}`)
}

async function executeTrailOpenStage() {
  if (!selectedArtifact.value && !selectedArtifactDetail.value) {
    sayTrailCommand('还没有选中文物。你可以说“带我看金面具”或先在第二幕选一件文物，我再打开 3D 展品现场。', 'stage-empty')
    return
  }

  const ready = await ensureTrailArtifactDetailReady()
  if (!ready) {
    sayTrailCommand('这件文物的详情还没载入完成，先稍等一下，再打开 3D 展品现场。', 'stage-not-ready')
    return
  }

  scrollToStage()
  await nextTick()
  await ensureStageExperience(true)
  sayTrailCommand(`好，我把你带到${selectedArtifactDetail.value?.displayTitle || '这件文物'}的展品现场。你可以拖拽旋转，也可以顺着旁边图谱看关系。`, 'stage')
}

async function executeTrailOpenGuide() {
  if (!selectedArtifact.value && !selectedArtifactDetail.value) {
    sayTrailCommand('还没有选中文物。你可以先说“带我看青铜神树”，我再接着为它讲解。', 'guide-empty')
    return
  }

  const ready = await ensureTrailArtifactDetailReady()
  if (!ready) {
    sayTrailCommand('这件文物的讲解资料还没准备好。等详情载入后，我再继续讲。', 'guide-not-ready')
    return
  }

  scrollToGuide()
  sayTrailCommand(`好，我们进入玄喵讲解。我会围绕${selectedArtifactDetail.value?.displayTitle || '这件文物'}继续讲它的背景、工艺和关系。`, 'guide')
}

function findGraphNodeByTrailCommand(target, rawText) {
  const nodes = graphPayload.value.nodes || []
  if (!nodes.length) return null

  if (!target) {
    return nodes.find((node) => node.id === graphPayload.value.centerNodeId) || nodes[0]
  }

  const aliases = target.aliases.map((alias) => normalizeTrailCommandText(alias))
  const typedNodes = nodes.filter((node) => node.type === target.type)
  const scoredNodes = typedNodes
    .map((node) => ({
      node,
      score: scoreGraphNodeForTrailCommand(node, rawText, aliases, target)
    }))
    .sort((a, b) => b.score - a.score)

  const best = scoredNodes[0]
  return best && best.score >= 5 ? best.node : null
}

function scoreGraphNodeForTrailCommand(node, rawText, aliases, target) {
  const haystack = normalizeTrailCommandText(`${node.label || ''}${node.summary || ''}${node.routeTarget || ''}${node.entityId || ''}`)
  let score = node.type === target.type ? 5 : 0

  aliases.forEach((alias) => {
    if (!alias) return
    if (rawText.includes(alias)) score += 4
    if (haystack.includes(alias)) score += 6
    if (rawText.includes(alias) && haystack.includes(alias)) score += 10
  })

  if (haystack && rawText.includes(haystack)) score += 12
  if (node.id === graphPayload.value.centerNodeId) score += 2
  score += Math.min(Number(node.importance || 0), 100) / 100
  return score
}

async function executeTrailFocusGraphNode(target, rawText) {
  if (!selectedArtifact.value && !selectedArtifactDetail.value) {
    sayTrailCommand('要看图谱，得先选中一件文物。你可以说“带我看金面具”，我会先带你进入它的展品现场。', 'graph-empty')
    return
  }

  const ready = await ensureTrailArtifactDetailReady()
  if (!ready) {
    sayTrailCommand('当前文物详情还没准备好，图谱暂时不能展开。等它载入后我再带你看关系。', 'graph-not-ready')
    return
  }

  scrollToStage()
  await nextTick()
  await ensureStageExperience(true)

  const node = findGraphNodeByTrailCommand(target, rawText)
  if (!node) {
    sayTrailCommand('我在当前图谱里还不能确定你要看哪条线索。你可以直接说“看工艺关系”“看寓意关系”或“看遗址关系”。', 'graph-missing')
    return
  }

  const requiredTypes = ['artifact', node.type]
  if (requiredTypes.some((type) => !activeTypeFilters.value.includes(type))) {
    activeTypeFilters.value = [...new Set([...activeTypeFilters.value, ...requiredTypes])]
    await renderGraph()
  }

  if (selectedNodeId.value !== node.id) {
    pushTrailViewSnapshot('command-graph-node')
  }
  selectedNodeId.value = node.id
  await nextTick()
  await applyFocusState(node.id)
  const typeLabel = TYPE_LABELS[node.type] || target?.title || '线索'
  sayTrailCommand(`好，我把图谱焦点切到${typeLabel}“${node.label || target?.title || '这个节点'}”。你可以顺着高亮关系继续看它和当前文物的联系。`, `graph-${node.id}`)
}

function resetFilters() {
  activeScene.value = 1
  activeEra.value = ''
  activeSite.value = ''
  activeCraft.value = ''
  meaningFocus.value = ''
  activePitCode.value = ''
  activeGuideClues.value = {}
  stageVisible.value = false
  guideExpanded.value = false
  syncQueryState()
}

async function ensureStageExperience(force = false) {
  const entityId = selectedArtifactDetail.value?.entityId
  if (!entityId || activeScene.value !== 3 || !stageVisible.value) return

  await nextTick()

  if (!viewerRef.value || !graphRef.value) return
  if (!viewerRef.value.clientWidth || !viewerRef.value.clientHeight) return

  if (force || stageReadyEntityId.value !== entityId) {
    destroyThreeStage()
    initThreeStage()
    stageReadyEntityId.value = entityId
  } else {
    resizeThreeStage()
  }

  if (force || graphReadyEntityId.value !== entityId) {
    await loadGraph()
    graphReadyEntityId.value = entityId
  } else if (graphInstance && graphRef.value) {
    graphInstance.setSize(graphRef.value.clientWidth || 320, graphRef.value.clientHeight || 420)
    await graphInstance.fitView()
  }
}

function goToScene(sceneId) {
  if (sceneId === activeScene.value) return
  if (sceneId === 1) {
    pushTrailViewSnapshot('nav-scene-1')
    activeScene.value = 1
    return
  }

  if (sceneId === 2) {
    pushTrailViewSnapshot('nav-scene-2')
    trailLoopHintVisible.value = false
    activeScene.value = 2
    return
  }

  if (sceneId === 3) {
    if (!selectedArtifact.value) return
    pushTrailViewSnapshot('nav-scene-3')
    trailLoopHintVisible.value = false
    stageVisible.value = true
    activeScene.value = 3
    return
  }

  if (sceneId === 4) {
    if (!selectedArtifact.value) return
    pushTrailViewSnapshot('nav-scene-4')
    trailLoopHintVisible.value = false
    trailNextCardDismissed.value = false
    stageVisible.value = true
    guideExpanded.value = true
    activeScene.value = 4
  }
}

function scrollToArtifacts() {
  if (activeScene.value !== 2) {
    pushTrailViewSnapshot('to-artifacts')
  }
  trailLoopHintVisible.value = false
  activeScene.value = 2
}

function scrollToStage() {
  if (!selectedArtifact.value) return
  if (activeScene.value !== 3 || !stageVisible.value) {
    pushTrailViewSnapshot('to-stage')
  }
  trailLoopHintVisible.value = false
  stageVisible.value = true
  activeScene.value = 3
}

function scrollToGuide() {
  if (!selectedArtifact.value) return
  if (activeScene.value !== 4 || !guideExpanded.value) {
    pushTrailViewSnapshot('to-guide')
  }
  trailLoopHintVisible.value = false
  trailNextCardDismissed.value = false
  stageVisible.value = true
  guideExpanded.value = true
  activeScene.value = 4
  scrollMessagesToBottom()
}

function enableVoiceGuide() {
  voiceGuideEnabled.value = true
  voiceGuidePaused.value = false
  voiceGuideError.value = ''
  voiceGuideLoading.value = false
  currentNarrationText.value = VOICE_GUIDE_START_TEXT
  playVoiceGuideStartBridge()
}

function toggleVoiceGuidePause() {
  if (!voiceGuideEnabled.value) return
  voiceGuidePaused.value = !voiceGuidePaused.value

  if (voiceGuidePaused.value) {
    cancelVoiceGuideRequest()
    stopVoiceGuideAudio()
    return
  }

  scheduleVoiceGuideNarration(true)
}

function closeVoiceGuide() {
  voiceGuideEnabled.value = false
  voiceGuidePaused.value = false
  voiceGuidePlaying.value = false
  voiceGuideLoading.value = false
  voiceGuideError.value = ''
  currentNarrationText.value = ''
  lastNarrationKey.value = ''
  lastNarrationIntent.value = ''
  cancelVoiceGuideRequest()
  stopVoiceGuideAudio()
}

function playVoiceGuideStartBridge() {
  const narration = {
    key: VOICE_GUIDE_START_KEY,
    intent: 'guide-start',
    scene: activeScene.value,
    entityId: selectedArtifactId.value || '',
    text: VOICE_GUIDE_START_TEXT
  }

  cancelVoiceGuideRequest()
  stopVoiceGuideAudio()
  lastNarrationKey.value = narration.key
  lastNarrationIntent.value = narration.intent
  voiceGuideActiveContext.scene = narration.scene
  voiceGuideActiveContext.entityId = narration.entityId
  voiceGuideActivePlayback = {
    key: narration.key,
    narration,
    usedPrebuilt: false,
    resolvedCacheKey: 'preset:trail-guide-start'
  }
  voiceGuidePlaying.value = true
  dispatchXuanmiaoSpeech(narration, VOICE_GUIDE_START_AUDIO_URL, VOICE_GUIDE_START_TEXT)
}

function scheduleVoiceGuideNarration(force = false) {
  try {
    if (!voiceGuideEnabled.value || voiceGuidePaused.value) return
    const narration = buildVoiceGuideNarrationV2()
    if (!narration?.key || !narration.text) {
      voiceGuideLoading.value = false
      return
    }
    if (isThinking.value) {
      currentNarrationText.value = narration.text
      voiceGuideLoading.value = false
      return
    }
    if (!force && recentNarrationKeys.has(narration.key)) {
      voiceGuideLoading.value = false
      return
    }

    const samePlayingContext =
      voiceGuidePlaying.value &&
      narration.scene === voiceGuideActiveContext.scene &&
      narration.entityId === voiceGuideActiveContext.entityId &&
      narration.key === voiceGuideActivePlayback?.key

    if (!samePlayingContext || force) {
      voiceGuideLoading.value = true
      voiceGuideError.value = ''
      currentNarrationText.value = narration.text
    }

    if (voiceGuideTimer) window.clearTimeout(voiceGuideTimer)
    const delay = force ? 0 : narration.intent === 'graph-node' ? 900 : narration.intent === 'scene-anchor' ? 560 : 420
    voiceGuideTimer = window.setTimeout(() => {
      void playVoiceGuideNarration(narration, force)
    }, delay)
  } catch (error) {
    settleVoiceGuideTextFallback('玄喵陪游暂时没组织好，已先显示文字提示', error)
  }
}

async function playCurrentVoiceGuideNarration(force = false) {
  if (!voiceGuideEnabled.value || voiceGuidePaused.value || isThinking.value) return
  try {
    const narration = buildVoiceGuideNarrationV2()
    if (!narration?.key || !narration.text) return
    await playVoiceGuideNarration(narration, force)
  } catch (error) {
    settleVoiceGuideTextFallback('玄喵陪游暂时没组织好，已先显示文字提示', error)
  }
}

async function playVoiceGuideNarration(narration, force = false) {
  if (!voiceGuideEnabled.value || voiceGuidePaused.value || isThinking.value) return
  if (!narration?.key || !narration.text) return
  if (!force && recentNarrationKeys.has(narration.key)) {
    voiceGuideLoading.value = false
    return
  }

  const samePlayingContext =
    voiceGuidePlaying.value &&
    narration.scene === voiceGuideActiveContext.scene &&
    narration.entityId === voiceGuideActiveContext.entityId &&
    narration.key === voiceGuideActivePlayback?.key

  if (samePlayingContext && !force) {
    pendingVoiceGuideNarration = narration
    voiceGuideLoading.value = false
    return
  }

  const requestId = voiceGuideRequestId.value + 1
  voiceGuideRequestId.value = requestId
  rememberVoiceGuideNarration(narration.key)
  lastNarrationKey.value = narration.key
  lastNarrationIntent.value = narration.intent || ''
  currentNarrationText.value = narration.text
  voiceGuideError.value = ''
  voiceGuideLoading.value = true
  pendingVoiceGuideNarration = null
  stopVoiceGuideAudio()

  try {
    const preferredVoice = getVoiceGuidePreferredVoice()
    const cacheKey = getVoiceGuideCacheKey(narration)
    const prebuiltEntry = narration.skipPreset ? null : resolvePrebuiltVoiceGuideEntry(narration, preferredVoice)
    const resolvedCacheKey = prebuiltEntry
      ? `preset:${preferredVoice}:${prebuiltEntry.key}:${prebuiltEntry.contentHash || prebuiltEntry.audioUrl}`
      : narration.audioUrl
        ? `direct:${narration.audioUrl}`
        : cacheKey
    let audioUrl = voiceGuideAudioCache.get(resolvedCacheKey)
    let usedPrebuilt = false
    if (!audioUrl) {
      if (narration.audioUrl) {
        audioUrl = narration.audioUrl
        usedPrebuilt = true
      } else if (prebuiltEntry?.audioUrl) {
        audioUrl = prebuiltEntry.audioUrl
        usedPrebuilt = true
        if (prebuiltEntry.text) {
          currentNarrationText.value = prebuiltEntry.text
        }
      } else {
        audioUrl = await synthesizeVoiceGuideSpeech(narration.text, preferredVoice)
        if (!isVoiceGuideRequestCurrent(requestId, narration)) {
          revokeSpeechUrl(audioUrl)
          return
        }
      }
      voiceGuideAudioCache.set(resolvedCacheKey, audioUrl)
      pruneVoiceGuideAudioCache()
    }

    if (!isVoiceGuideRequestCurrent(requestId, narration)) return

    voiceGuideLoading.value = false
    voiceGuideAudioUrl = audioUrl
    voiceGuideActiveContext.scene = narration.scene
    voiceGuideActiveContext.entityId = narration.entityId
    voiceGuideActivePlayback = {
      key: narration.key,
      narration,
      usedPrebuilt,
      resolvedCacheKey
    }
    archiveVoiceGuideNarration(narration, currentNarrationText.value)
    voiceGuidePlaying.value = true
    dispatchXuanmiaoSpeech(narration, audioUrl, currentNarrationText.value)
  } catch (error) {
    if (isVoiceGuideRequestCurrent(requestId, narration)) {
      stopVoiceGuideAudio()
      voiceGuideLoading.value = false
      const isTimeout = error?.name === 'AbortError' || error?.message === 'VOICE_GUIDE_TTS_TIMEOUT'
      voiceGuideError.value = isTimeout ? VOICE_GUIDE_TEXT_FALLBACK : '语音暂不可用，已显示文字提示'
    }
  }
}

async function synthesizeVoiceGuideSpeech(text, voice = getVoiceGuidePreferredVoice()) {
  voiceGuideAbortController?.abort?.()
  const controller = new AbortController()
  voiceGuideAbortController = controller

  let timeoutId = null
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      controller.abort()
      reject(new Error('VOICE_GUIDE_TTS_TIMEOUT'))
    }, VOICE_GUIDE_TTS_TIMEOUT)
  })

  try {
    return await Promise.race([
      synthesizeSpeech(text, voice, 1.0, { signal: controller.signal }),
      timeoutPromise
    ])
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId)
    if (voiceGuideAbortController === controller) {
      voiceGuideAbortController = null
    }
  }
}

async function loadVoiceGuideManifest() {
  try {
    const response = await fetch(VOICE_GUIDE_MANIFEST_URL, { cache: 'no-cache' })
    if (!response.ok) return
    const manifest = await response.json()
    const entries = Array.isArray(manifest?.entries) ? manifest.entries : []
    prebuiltVoiceGuideEntries.clear()
    entries.forEach((entry) => {
      if (entry?.key && hasPrebuiltAudio(entry) && entry.ready !== false) {
        const presetKey = entry.presetKey || entry.key
        const normalizedEntry = { ...entry }
        if (!prebuiltVoiceGuideEntries.has(presetKey)) {
          prebuiltVoiceGuideEntries.set(presetKey, [])
        }
        prebuiltVoiceGuideEntries.get(presetKey).push(normalizedEntry)
      }
    })
    prebuiltVoiceGuideEntries.forEach((list) => {
      list.sort((a, b) => {
        if (a.legacy !== b.legacy) return a.legacy ? 1 : -1
        const priorityDiff = (b.priority || 0) - (a.priority || 0)
        if (priorityDiff) return priorityDiff
        return String(a.variant || a.key || '').localeCompare(String(b.variant || b.key || ''))
      })
    })
  } catch (error) {
    console.warn('玄喵陪游预制清单读取失败，将使用实时 TTS。', error)
  }
}

function resolvePrebuiltVoiceGuideEntry(narration, preferredVoice = getVoiceGuidePreferredVoice()) {
  const keys = Array.isArray(narration.presetKeys) ? narration.presetKeys : []
  for (const key of keys) {
    const entries = (prebuiltVoiceGuideEntries.get(key) || []).filter((entry) =>
      Boolean(getPrebuiltAudioUrl(entry, preferredVoice))
    )
    const entry = pickPrebuiltVoiceVariant(entries, `${narration.key}-${key}`, preferredVoice)
    const audioUrl = getPrebuiltAudioUrl(entry, preferredVoice)
    if (audioUrl) return { ...entry, audioUrl }
  }
  return null
}

function getPrebuiltAudioUrl(entry, preferredVoice = getVoiceGuidePreferredVoice()) {
  if (!entry) return ''
  const readyVoices = Array.isArray(entry.readyVoices) ? entry.readyVoices : []
  if (readyVoices.length && !readyVoices.includes(preferredVoice)) return ''
  const source = entry.sources?.[preferredVoice]?.wav
  if (source) return source
  return preferredVoice === 'default' ? (entry?.sources?.wav || entry?.audioUrl || '') : ''
}

function dispatchXuanmiaoSpeech(narration, audioUrl, text) {
  window.dispatchEvent(new CustomEvent('xuanmiao:say', {
    detail: {
      key: narration.key,
      text: text || narration.text,
      audioUrl,
      source: 'trail-guide',
      interrupt: true
    }
  }))
}

function stopExternalXuanmiaoSpeech(key = lastNarrationKey.value) {
  window.dispatchEvent(new CustomEvent('xuanmiao:stop', {
    detail: {
      key,
      source: 'trail-guide'
    }
  }))
}

function handleXuanmiaoSpeechEnded(event) {
  const detail = event?.detail || {}
  if (detail.source !== 'trail-guide') return
  if (voiceGuideActivePlayback?.key && detail.key !== voiceGuideActivePlayback.key) return

  const endedPlayback = voiceGuideActivePlayback
  voiceGuidePlaying.value = false
  voiceGuideAudioUrl = ''
  voiceGuideActivePlayback = null
  if (endedPlayback?.narration?.intent === 'guide-start') {
    if (voiceGuideEnabled.value && !voiceGuidePaused.value && !isThinking.value) {
      scheduleVoiceGuideNarration(true)
    }
    return
  }
  const pending = pendingVoiceGuideNarration
  pendingVoiceGuideNarration = null
  if (pending && voiceGuideEnabled.value && !voiceGuidePaused.value && !isThinking.value) {
    void playVoiceGuideNarration(pending)
  }
}

function handleXuanmiaoSpeechError(event) {
  const detail = event?.detail || {}
  if (detail.source !== 'trail-guide') return
  const active = voiceGuideActivePlayback
  if (active?.key && detail.key !== active.key) return

  voiceGuidePlaying.value = false
  voiceGuideLoading.value = false
  voiceGuideAudioUrl = ''
  voiceGuideActivePlayback = null
  if (active?.usedPrebuilt) {
    voiceGuideAudioCache.delete(active.resolvedCacheKey)
    void playVoiceGuideNarration({ ...active.narration, skipPreset: true }, true)
    return
  }
  voiceGuideError.value = '语音暂不可用，已显示文字提示'
}

function handleXuanmiaoSpeechStopped(event) {
  const detail = event?.detail || {}
  if (detail.source !== 'trail-guide') return
  if (voiceGuideActivePlayback?.key && detail.key !== voiceGuideActivePlayback.key) return
  voiceGuidePlaying.value = false
  voiceGuideLoading.value = false
  voiceGuideAudioUrl = ''
  voiceGuideActivePlayback = null
  pendingVoiceGuideNarration = null
}

function hasPrebuiltAudio(entry) {
  if (!entry) return false
  if (entry.sources?.wav || entry.audioUrl) return true
  return ['default', 'zh_female', 'sweet'].some((voice) => Boolean(entry.sources?.[voice]?.wav))
}

function getVoiceGuidePreferredVoice() {
  try {
    const voice = localStorage.getItem('xuanmiao_voice') || 'default'
    return ['default', 'zh_female', 'sweet'].includes(voice) ? voice : 'default'
  } catch (error) {
    return 'default'
  }
}

function pickPrebuiltVoiceVariant(entries, seed, preferredVoice = getVoiceGuidePreferredVoice()) {
  if (!entries.length) return null
  const voiceReadyEntries = entries.filter((entry) => Boolean(getPrebuiltAudioUrl(entry, preferredVoice)))
  const modernEntries = voiceReadyEntries.filter((entry) => !entry.legacy)
  const candidates = modernEntries.length ? modernEntries : voiceReadyEntries
  if (!candidates.length) return null
  let hash = 0
  const source = `${seed}-${lastNarrationIntent.value || 'start'}`
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 33 + source.charCodeAt(index)) % 104729
  }
  return candidates[hash % candidates.length]
}

function stopVoiceGuideAudio() {
  if (voiceGuideAudio) {
    voiceGuideAudio.pause()
    voiceGuideAudio.currentTime = 0
    voiceGuideAudio = null
  }
  if (voiceGuideActivePlayback?.key) {
    stopExternalXuanmiaoSpeech(voiceGuideActivePlayback.key)
  }
  voiceGuidePlaying.value = false
  voiceGuideAudioUrl = ''
  voiceGuideActivePlayback = null
}

function cancelVoiceGuideRequest() {
  if (voiceGuideTimer) {
    window.clearTimeout(voiceGuideTimer)
    voiceGuideTimer = null
  }
  voiceGuideAbortController?.abort?.()
  voiceGuideAbortController = null
  pendingVoiceGuideNarration = null
  voiceGuideLoading.value = false
  voiceGuideRequestId.value += 1
}

function settleVoiceGuideTextFallback(message, error) {
  console.warn('玄喵陪游降级:', error)
  voiceGuideLoading.value = false
  voiceGuidePlaying.value = false
  voiceGuideError.value = message
  if (!currentNarrationText.value || currentNarrationText.value === VOICE_GUIDE_LOADING_TEXT) {
    currentNarrationText.value = '你可以继续浏览展线，玄喵稍后再跟上讲解。'
  }
}

function isVoiceGuideRequestCurrent(requestId, narration) {
  return (
    voiceGuideEnabled.value &&
    !voiceGuidePaused.value &&
    voiceGuideRequestId.value === requestId &&
    lastNarrationKey.value === narration.key
  )
}

function getVoiceGuideCacheKey(narration) {
  return `${getVoiceGuidePreferredVoice()}::${narration.key}::${narration.text}`
}

function pruneVoiceGuideAudioCache() {
  while (voiceGuideAudioCache.size > VOICE_GUIDE_CACHE_LIMIT) {
    const oldestKey = voiceGuideAudioCache.keys().next().value
    const oldestUrl = voiceGuideAudioCache.get(oldestKey)
    if (oldestUrl === voiceGuideAudioUrl) {
      voiceGuideAudioCache.delete(oldestKey)
      voiceGuideAudioCache.set(oldestKey, oldestUrl)
      continue
    }
    revokeSpeechUrl(oldestUrl)
    voiceGuideAudioCache.delete(oldestKey)
  }
}

function clearVoiceGuideAudioCache() {
  voiceGuideAudioCache.forEach((url) => revokeSpeechUrl(url))
  voiceGuideAudioCache.clear()
  voiceGuideAudioUrl = ''
}

function rememberVoiceGuideNarration(key) {
  recentNarrationKeys.add(key)
  recentNarrationKeyQueue.push(key)
  while (recentNarrationKeyQueue.length > VOICE_GUIDE_RECENT_LIMIT) {
    const oldestKey = recentNarrationKeyQueue.shift()
    if (!recentNarrationKeyQueue.includes(oldestKey)) {
      recentNarrationKeys.delete(oldestKey)
    }
  }
}

function buildVoiceGuideNarration() {
  const entityId = selectedArtifactDetail.value?.entityId || selectedArtifact.value?.entityId || 'none'
  const title = selectedArtifactDetail.value?.displayTitle || selectedArtifact.value?.displayTitle || ''
  const context = getVoiceGuideArtifactContext()

  if (activeScene.value === 1) {
    const filterKey = `${activeEra.value || 'all'}-${activeSite.value || 'all'}-${activeCraft.value || 'all'}-${activePitCode.value || 'map'}-${meaningFocus.value || 'all'}-${visibleArtifacts.value.length}`
    const filterText = activeFilterChips.value.length
      ? `现在的坐标是${activeFilterChips.value.map((item) => item.value).join('、')}。`
      : '可以先从时代、遗址或工艺里选一个入口。'
    return {
      key: `scene-1-${filterKey}`,
      intent: 'scene-anchor',
      scene: 1,
      entityId: 'filters',
      skipPreset: true,
      presetKeys: [],
      text: pickVoiceVariant(`scene-1-${filterKey}`, [
        `这里先定古蜀坐标。${filterText}下方会把命中文物收束成一条展线。`,
        `${filterText}你每换一次条件，展线都会重新整理，适合先找一条最想看的线索。`
      ])
    }
  }

  if (activeScene.value === 2) {
    const count = visibleArtifacts.value.length
    const targetTitle = selectedArtifact.value?.displayTitle || visibleArtifacts.value[0]?.displayTitle || '一件代表性文物'
    const hint = context.summary ? `它的看点是：${context.summary}。` : `可以先看它的年代、遗址和工艺。`
    return {
      key: `scene-2-${count}-${selectedArtifact.value?.entityId || 'none'}`,
      intent: 'artifact-list',
      scene: 2,
      entityId: selectedArtifact.value?.entityId || 'artifact-list',
      presetKeys: [
        `artifact-list.${selectedArtifact.value?.entityId || ''}`,
        'artifact-list.default'
      ],
      text: pickVoiceVariant(`scene-2-${targetTitle}-${count}`, [
        `当前命中 ${count} 件文物。建议先停在 ${targetTitle} 前，${hint}`,
        `这一步先选一件代表物。${targetTitle} 很适合开场，之后再进入 3D 和关系图谱。`
      ])
    }
  }

  if (activeScene.value === 3 && stageVisible.value && selectedNodeId.value && selectedNodeId.value !== graphPayload.value.centerNodeId) {
    const nodeType = TYPE_LABELS[selectedGraphNode.value?.type] || '线索'
    const nodeSummary = clipVoiceText(selectedNodeSummary.value, 36)
    return {
      key: `scene-3-node-${entityId}-${selectedNodeId.value}`,
      intent: 'graph-node',
      scene: 3,
      entityId,
      presetKeys: [
        ...getGraphNodeVoiceGuidePresetKeys(entityId, selectedGraphNode.value?.type),
        `graph-type.${selectedGraphNode.value?.type || ''}`,
        'graph-type.default'
      ],
      text: pickVoiceVariant(`scene-3-node-${selectedNodeId.value}`, [
        `你点到的是${nodeType}“${selectedNodeTitle.value}”。${nodeSummary}`,
        `现在从“${selectedNodeTitle.value}”看回${title || '当前文物'}，重点是它们之间的关系，而不是孤立看一件器物。`
      ])
    }
  }

  if (activeScene.value === 3 && stageVisible.value) {
    return {
      key: `scene-3-stage-${entityId}`,
      intent: 'stage-viewer',
      scene: 3,
      entityId,
      presetKeys: [
        `stage-viewer.${entityId}`,
        'stage-viewer.default'
      ],
      text: title
        ? pickVoiceVariant(`scene-3-stage-${entityId}`, [
            `现在看 ${title}。先拖拽模型观察轮廓和细部，再看右侧图谱里的${context.site}、${context.era}和${context.craft}。`,
            `${title} 已进入展品现场。左侧看造型，右侧看关系，两边合起来才像一次完整观察。`
          ])
        : '现在进入展品现场。可以先观察 3D 模型，再顺着右侧图谱理解它的文化关系。'
    }
  }

  if (activeScene.value === 4) {
    return {
      key: `scene-4-guide-${entityId}-${guideExpanded.value ? 'open' : 'preview'}`,
      intent: guideExpanded.value ? 'guide-chat-open' : 'guide-chat-preview',
      scene: 4,
      entityId,
      presetKeys: [
        `guide-chat.${entityId}`,
        `artifact-next.${entityId}`,
        `artifact-symbol.${entityId}`,
        'guide-chat.default'
      ],
      text: title
        ? pickVoiceVariant(`scene-4-guide-${entityId}-${guideExpanded.value}`, [
            `这里可以继续问玄喵。围绕 ${title}，你可以问它为什么重要、用了什么工艺，或和哪件文物有关。`,
            `讲解区已经准备好。接下来不必背知识点，只要追问 ${title} 的看点，玄喵会把线索串起来。`
          ])
        : '这里是玄喵讲解区。你可以继续提问，让玄喵把展线里的文物线索讲成一段故事。'
    }
  }

  return null
}

function buildVoiceGuideNarrationV2() {
  const entityId = selectedArtifactDetail.value?.entityId || selectedArtifact.value?.entityId || 'none'
  const title = selectedArtifactDetail.value?.displayTitle || selectedArtifact.value?.displayTitle || ''
  const context = getVoiceGuideArtifactContext()

  if (activeScene.value === 1) {
    const pitInfo = getPitInfo(activePitCode.value)
    const pitPreset = pitInfo ? PIT_VOICE_GUIDE_PRESETS[pitInfo.pitCode] : null
    const filterKey = `${activeEra.value || 'all'}-${activeSite.value || 'all'}-${activeCraft.value || 'all'}-${activePitCode.value || 'map'}-${meaningFocus.value || 'all'}`
    const filterText = activeFilterChips.value.length
      ? `当前线索是 ${activeFilterChips.value.map((item) => item.value).join('、')}。`
      : '还没有固定线索，可以先从祭祀坑地图、时代、遗址或工艺里选一个入口。'
    const sceneText = pitInfo
      ? `${pitInfo.pitCode} 已经作为空间线索记录。先看它关联的代表文物，再决定要不要进入第二幕。`
      : `${filterText} 第一幕的重点不是填条件，而是帮你找到一次参观的起点。`

    return {
      key: `scene-1-${filterKey}`,
      intent: 'scene-anchor',
      scene: 1,
      entityId: 'filters',
      skipPreset: true,
      presetKeys: [],
      audioUrl: pitPreset?.audioUrl || '',
      text: pitPreset?.text || pickVoiceVariant(`scene-1-v2-${filterKey}`, [
        sceneText,
        `${filterText} 真实筛选会改变结果，导览线索只帮助你决定观察角度。`
      ])
    }
  }

  if (activeScene.value === 2) {
    const count = visibleArtifacts.value.length
    const targetTitle = selectedArtifact.value?.displayTitle || visibleArtifacts.value[0]?.displayTitle || '一件代表性文物'
    const hint = context.summary ? `它的看点是：${context.summary}。` : '可以先看年代、出土地、类别和是否有 3D 模型。'

    return {
      key: `scene-2-${selectedArtifact.value?.entityId || 'list'}-${count ? 'has-result' : 'empty'}`,
      intent: 'artifact-list',
      scene: 2,
      entityId: selectedArtifact.value?.entityId || 'artifact-list',
      presetKeys: [
        `artifact-list.${selectedArtifact.value?.entityId || ''}`,
        'artifact-list.default'
      ],
      text: pickVoiceVariant(`scene-2-v2-${targetTitle}-${count}`, [
        selectedArtifact.value
          ? `你已经停在 ${targetTitle} 前。${hint} 下一步适合进入展品现场。`
          : `当前命中 ${count} 件文物。先选一件代表文物停下来，后面的 3D、图谱和玄喵讲解才会接上。`,
        `${targetTitle} 可以作为这一轮展线的观察对象。先确认它的身份，再往下看造型和关系。`
      ])
    }
  }

  if (activeScene.value === 3 && stageVisible.value && selectedNodeId.value && selectedNodeId.value !== graphPayload.value.centerNodeId) {
    const nodeType = TYPE_LABELS[selectedGraphNode.value?.type] || '线索'
    const nodeSummary = clipVoiceText(selectedNodeSummary.value, 36)

    return {
      key: `scene-3-node-${entityId}-${selectedNodeId.value}`,
      intent: 'graph-node',
      scene: 3,
      entityId,
      presetKeys: [
        ...getGraphNodeVoiceGuidePresetKeys(entityId, selectedGraphNode.value?.type),
        `graph-type.${selectedGraphNode.value?.type || ''}`,
        'graph-type.default'
      ],
      text: pickVoiceVariant(`scene-3-node-v2-${selectedNodeId.value}`, [
        `你点到的是${nodeType}“${selectedNodeTitle.value}”。${nodeSummary || '先看它和当前文物之间的关系。'}`,
        `现在从“${selectedNodeTitle.value}”回看${title || '当前文物'}，重点是关系，不是孤立看一件器物。`
      ])
    }
  }

  if (activeScene.value === 3 && stageVisible.value) {
    return {
      key: `scene-3-stage-${entityId}`,
      intent: 'stage-viewer',
      scene: 3,
      entityId,
      presetKeys: [
        `stage-viewer.${entityId}`,
        'stage-viewer.default'
      ],
      text: title
        ? pickVoiceVariant(`scene-3-stage-v2-${entityId}`, [
            `现在看 ${title}。先拖拽模型观察轮廓和细节，再看右侧图谱里的${context.site}、${context.era}和${context.craft}。`,
            `${title} 已经进入展品现场。左侧看造型，右侧看关系，两边合起来才像一次完整观察。`
          ])
        : '现在进入展品现场。可以先观察 3D 模型，再顺着右侧图谱理解它的文化关系。'
    }
  }

  if (activeScene.value === 4) {
    return {
      key: `scene-4-guide-${entityId}`,
      intent: 'guide-chat',
      scene: 4,
      entityId,
      presetKeys: guideExpanded.value
        ? [`guide-chat.${entityId}`, `artifact-symbol.${entityId}`, 'guide-chat.default']
        : [`artifact-next.${entityId}`, `guide-chat.${entityId}`, 'guide-chat.default'],
      text: title
        ? pickVoiceVariant(`scene-4-guide-v2-${entityId}`, [
            `这里可以继续问玄喵。围绕 ${title}，你可以问它为什么重要、用了什么工艺，或和哪件文物有关。`,
            `讲解区已经准备好。接下来不用背知识点，只要追问 ${title} 的看点，玄喵会把线索串起来。`
          ])
        : '这里是玄喵讲解区。你可以继续提问，让玄喵把展线里的文物线索讲成一段故事。'
    }
  }

  return null
}

function getVoiceGuideArtifactContext() {
  const artifact = selectedArtifactDetail.value || selectedArtifact.value || {}
  return {
    site: artifact.siteLabel || '遗址',
    era: artifact.eraLabel || artifact.yearLabel || '时代',
    craft: artifact.craftLabel || '工艺',
    summary: clipVoiceText(artifact.summary, 34)
  }
}

function clipVoiceText(value, maxLength = 40) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

function pickVoiceVariant(key, variants) {
  if (!variants.length) return ''
  let hash = 0
  const source = `${key}-${lastNarrationIntent.value || 'start'}`
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 9973
  }
  return variants[hash % variants.length]
}

function getGraphNodeVoiceGuidePresetKeys(entityId, nodeType) {
  if (!entityId || entityId === 'none') return []
  const artifactKey = String(entityId)
  const type = String(nodeType || '')
  if (type === 'craft') return [`artifact-craft.${artifactKey}`]
  if (['meaning', 'motif', 'ritual'].includes(type)) return [`artifact-symbol.${artifactKey}`]
  if (['site', 'era'].includes(type)) return [`artifact-context.${artifactKey}`]
  return []
}

function toggleGuideExpanded(expanded) {
  if (guideExpanded.value !== expanded) {
    pushTrailViewSnapshot(expanded ? 'expand-guide' : 'collapse-guide')
  }
  guideExpanded.value = expanded
  if (expanded) {
    trailNextCardDismissed.value = false
    scrollMessagesToBottom()
  }
}

function askXuanmiaoFromCompanion() {
  if (!selectedArtifact.value && !selectedArtifactDetail.value) {
    scrollToArtifacts()
    return
  }
  pushTrailViewSnapshot('companion-guide')
  trailLoopHintVisible.value = false
  trailNextCardDismissed.value = false
  stageVisible.value = true
  guideExpanded.value = true
  activeScene.value = 4
  scrollMessagesToBottom()
}

async function continueXuanmiaoNarrationFromNode() {
  if (!selectedGraphNode.value && !selectedArtifactDetail.value) return

  voiceGuideEnabled.value = true
  voiceGuidePaused.value = false
  voiceGuideError.value = ''

  if (isThinking.value) {
    currentNarrationText.value = '玄喵正在整理当前线索，稍等一下。'
    voiceGuideLoading.value = false
    return
  }

  voiceGuideLoading.value = true
  currentNarrationText.value = '玄喵正在接着当前线索讲解...'
  await playCurrentVoiceGuideNarration(true)
}

function openGuideAndAsk(question) {
  pushTrailViewSnapshot('quick-guide-question')
  trailLoopHintVisible.value = false
  trailNextCardDismissed.value = false
  stageVisible.value = true
  guideExpanded.value = true
  activeScene.value = 4
  nextTick(() => {
    void sendMessage(question)
  })
}

function openStandalone3D(artifact) {
  router.push({
    path: '/3d',
    query: {
      entityId: artifact.entityId,
      title: artifact.displayTitle,
      siteCode: artifact.siteCode,
      eraCode: artifact.eraCode,
      glbUrl: artifact.resolvedGlbUrl || ''
    }
  })
}

function initThreeStage() {
  if (!viewerRef.value || !canvasRef.value) return

  const glbUrl = selectedArtifactDetail.value?.resolvedGlbUrl || ''
  if (!glbUrl) {
    isModelLoading.value = false
    modelProgress.value = 100
    modelError.value = ''
    return
  }

  isModelLoading.value = true
  modelProgress.value = 8
  modelError.value = ''

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#08110d')
  scene.fog = new THREE.Fog('#08110d', 8, 28)

  const { clientWidth, clientHeight } = viewerRef.value
  camera = new THREE.PerspectiveCamera(38, clientWidth / clientHeight, 0.1, 120)
  camera.position.set(0, 0.72, 5.4)

  renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(clientWidth, clientHeight, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12

  pmremGenerator = new THREE.PMREMGenerator(renderer)
  environmentTexture = pmremGenerator.fromScene(new RoomEnvironment(renderer), 0.04).texture
  scene.environment = environmentTexture

  scene.add(new THREE.AmbientLight('#f5f0da', 1.28), new THREE.HemisphereLight('#fff3cf', '#0f1814', 0.92))

  const spotLight = new THREE.SpotLight('#ffe4a8', 2.75, 34, Math.PI / 6, 0.28, 1)
  spotLight.position.set(6, 10, 8)
  const fillLight = new THREE.DirectionalLight('#ffd98f', 1.15)
  fillLight.position.set(-4, 5, 6)
  const rimLight = new THREE.PointLight('#79c4a7', 1.5, 24)
  rimLight.position.set(-6, 2, -5)
  scene.add(spotLight, fillLight, rimLight)

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 96),
    new THREE.MeshBasicMaterial({
      color: '#172b22',
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -2.6
  scene.add(floor)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.minDistance = 2.6
  controls.maxDistance = 9.8
  controls.maxPolarAngle = Math.PI * 0.68
  controls.target.set(0, 0.05, 0)

  const loader = new GLTFLoader()
  loader.load(
    glbUrl,
    (gltf) => {
      glbModel = gltf.scene
      const box = new THREE.Box3().setFromObject(glbModel)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDimension = Math.max(size.x, size.y, size.z) || 1
      const scale = 2.35 / maxDimension
      glbModel.scale.setScalar(scale)
      glbModel.position.sub(center.multiplyScalar(scale))
      const fittedBox = new THREE.Box3().setFromObject(glbModel)
      const fittedSize = fittedBox.getSize(new THREE.Vector3())
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3())
      const fittedSphere = fittedBox.getBoundingSphere(new THREE.Sphere())
      const fitDistance = Math.max(3.4, fittedSphere.radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5)) * 1.08)
      camera.position.set(fittedCenter.x, fittedCenter.y + fittedSphere.radius * 0.12, fittedCenter.z + fitDistance)
      camera.near = Math.max(0.05, fitDistance / 80)
      camera.far = fitDistance * 80
      camera.updateProjectionMatrix()
      floor.position.y = fittedBox.min.y - Math.max(0.12, fittedSize.y * 0.06)

      glbModel.traverse((child) => {
        if (!child.isMesh || !child.material) return
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((mat) => {
          mat.needsUpdate = true
          if ('envMapIntensity' in mat) mat.envMapIntensity = 1.2
        })
      })

      scene.add(glbModel)
      controls.target.copy(fittedCenter)
      controls.update()
      isModelLoading.value = false
      modelProgress.value = 100
    },
    (event) => {
      if (event.total) {
        modelProgress.value = Math.min(98, Math.floor((event.loaded / event.total) * 100))
      }
    },
    () => {
      isModelLoading.value = false
      modelProgress.value = 100
      modelError.value = '模型资源暂时无法读取，你仍然可以继续看图谱和玄喵讲解。'
    }
  )

  animateThreeStage()
}

function animateThreeStage() {
  frameId = requestAnimationFrame(animateThreeStage)
  controls?.update()
  renderer?.render(scene, camera)
}
function destroyThreeStage() {
  if (frameId) {
    cancelAnimationFrame(frameId)
    frameId = 0
  }
  controls?.dispose()
  environmentTexture?.dispose?.()
  pmremGenerator?.dispose?.()
  renderer?.dispose?.()
  scene = null
  camera = null
  controls = null
  renderer = null
  glbModel = null
  environmentTexture = null
  pmremGenerator = null
}

async function loadGraph() {
  if (!selectedArtifactDetail.value?.entityId) return

  graphLoading.value = true
  graphError.value = ''

  try {
    const response = await getArtifactGraph({ entityId: selectedArtifactDetail.value.entityId }, { showDefaultMsg: false })
    graphPayload.value = normalizeGraphPayload(response)
    activeTypeFilters.value = getDefaultTypeFilters(graphPayload.value.availableTypes)
    selectedNodeId.value = graphPayload.value.centerNodeId
    expandedNodeIds.value = new Set()
    graphStablePositions = new Map()
    await nextTick()
    await renderGraph({ fit: true })
  } catch (error) {
    console.error('图谱加载失败:', error)
    graphError.value = '关系网络暂时没有完整展开，但当前文物档案和讲解仍可继续浏览。'
  } finally {
    graphLoading.value = false
  }
}

async function expandNode(node) {
  if (!node?.expandable || expandedNodeIds.value.has(node.id) || !selectedArtifactDetail.value?.entityId) return

  graphLoading.value = true
  try {
    const response = await getArtifactGraphNeighbors(
      {
        entityId: selectedArtifactDetail.value.entityId,
        nodeId: node.id,
        depth: 1
      },
      { showDefaultMsg: false }
    )
    graphPayload.value = mergeGraphPayload(graphPayload.value, normalizeGraphPayload(response))
    expandedNodeIds.value = new Set([...expandedNodeIds.value, node.id])
    preserveTypeFilters()
    await renderGraph()
  } catch (error) {
    console.error('图谱扩展失败:', error)
    graphError.value = '这个节点暂时不能继续展开，不过你仍然可以使用当前图谱继续探索。'
  } finally {
    graphLoading.value = false
  }
}

function normalizeGraphPayload(payload) {
  const nodes = Array.isArray(payload?.nodes) ? payload.nodes : []
  const edges = Array.isArray(payload?.edges) ? payload.edges : []
  const availableTypes = Array.isArray(payload?.availableTypes)
    ? payload.availableTypes
    : [...new Set(nodes.map((node) => node.type).filter(Boolean))]
  return {
    centerNodeId: payload?.centerNodeId || nodes.find((node) => node.type === 'artifact')?.id || '',
    narrative: payload?.narrative || '',
    availableTypes,
    stats: payload?.stats || {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      expandableCount: nodes.filter((node) => node.expandable).length
    },
    nodes,
    edges
  }
}

function mergeGraphPayload(currentPayload, incomingPayload) {
  const nodeMap = new Map()
  const edgeMap = new Map()
  ;[...(currentPayload?.nodes || []), ...(incomingPayload?.nodes || [])].forEach((node) => {
    nodeMap.set(node.id, { ...(nodeMap.get(node.id) || {}), ...node })
  })
  ;[...(currentPayload?.edges || []), ...(incomingPayload?.edges || [])].forEach((edge) => {
    const edgeId = edge.id || `${edge.source}->${edge.target}:${edge.category || edge.label || 'edge'}`
    edgeMap.set(edgeId, { id: edgeId, ...edge })
  })
  const mergedNodes = [...nodeMap.values()]
  const mergedEdges = [...edgeMap.values()]
  const mergedTypes = [...new Set([...(currentPayload?.availableTypes || []), ...(incomingPayload?.availableTypes || [])])]
  return {
    centerNodeId: currentPayload?.centerNodeId || incomingPayload?.centerNodeId || '',
    narrative: currentPayload?.narrative || incomingPayload?.narrative || '',
    availableTypes: mergedTypes,
    stats: {
      nodeCount: mergedNodes.length,
      edgeCount: mergedEdges.length,
      expandableCount: mergedNodes.filter((node) => node.expandable).length
    },
    nodes: mergedNodes,
    edges: mergedEdges
  }
}

function preserveTypeFilters() {
  if (!activeTypeFilters.value.length) {
    activeTypeFilters.value = getDefaultTypeFilters(graphPayload.value.availableTypes)
    return
  }
  activeTypeFilters.value = graphPayload.value.availableTypes.filter((type) => activeTypeFilters.value.includes(type))
  if (!activeTypeFilters.value.length) {
    activeTypeFilters.value = getDefaultTypeFilters(graphPayload.value.availableTypes)
  }
}

function getDefaultTypeFilters(availableTypes) {
  const availableSet = new Set(availableTypes || [])
  const defaults = DEFAULT_TYPE_FILTERS.filter((type) => availableSet.has(type))
  return defaults.length ? defaults : [...availableSet]
}

function getVisibleGraphPayload() {
  const enabledTypes = new Set(activeTypeFilters.value)
  const nodes = graphPayload.value.nodes.filter((node) => enabledTypes.has(node.type))
  const visibleNodeIds = new Set(nodes.map((node) => node.id))
  const edges = graphPayload.value.edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
  return { nodes, edges }
}

function buildG6Data() {
  const { nodes, edges } = getVisibleGraphPayload()
  const positions = computeRadialLayout(nodes, graphPayload.value.centerNodeId, edges)
  const visibleIds = new Set(nodes.map((node) => node.id))
  graphStablePositions.forEach((_, id) => {
    if (!visibleIds.has(id)) graphStablePositions.delete(id)
  })

  return {
    nodes: nodes.map((node) => {
      const nextPosition = graphStablePositions.get(node.id) || positions.get(node.id) || { x: 0, y: 0 }
      graphStablePositions.set(node.id, nextPosition)
      return {
        id: node.id,
        data: node,
        style: {
          ...buildNodeStyle(node),
          ...nextPosition
        }
      }
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: edge,
      style: buildEdgeStyle(edge)
    }))
  }
}

function computeRadialLayout(nodes, centerNodeId, edges = []) {
  const positions = new Map()
  const centerId = centerNodeId || nodes.find((node) => node.type === 'artifact')?.id
  if (!centerId) return positions

  positions.set(centerId, { x: 0, y: 0 })
  const rankedNodes = rankGraphNodes(nodes, edges, centerId)
  const ringBuckets = {
    ring1: rankedNodes.filter((node) => node.id !== centerId && (node.type === 'site' || node.type === 'era' || node.type === 'material')),
    ring2: rankedNodes.filter((node) => node.id !== centerId && (node.type === 'craft' || node.type === 'meaning' || node.type === 'motif')),
    ring3: rankedNodes.filter((node) => node.id !== centerId && (node.type === 'ritual' || node.type === 'artifact'))
  }

  layoutRing(ringBuckets.ring1, 165, positions, -Math.PI / 2)
  layoutRing(ringBuckets.ring2, 285, positions, -Math.PI / 3)
  layoutRing(ringBuckets.ring3, 400, positions, 0)
  return positions
}

function rankGraphNodes(nodes, edges, centerId) {
  const relationScores = edges.reduce((scores, edge) => {
    const weight = Number(edge.weight || 1)
    scores[edge.source] = (scores[edge.source] || 0) + weight
    scores[edge.target] = (scores[edge.target] || 0) + weight
    return scores
  }, {})

  return [...nodes].sort((a, b) => {
    if (a.id === centerId) return -1
    if (b.id === centerId) return 1
    const scoreA = Number(a.importance || 0) + (relationScores[a.id] || 0) * 8 + (a.expandable ? 5 : 0)
    const scoreB = Number(b.importance || 0) + (relationScores[b.id] || 0) * 8 + (b.expandable ? 5 : 0)
    if (scoreA !== scoreB) return scoreB - scoreA
    return String(a.label || a.id).localeCompare(String(b.label || b.id), 'zh-Hans-CN')
  })
}

function layoutRing(nodes, radius, positions, startAngle) {
  if (!nodes.length) return
  const spread = nodes.length <= 4 ? Math.PI * 1.36 : Math.PI * 2
  const offset = nodes.length <= 4 ? spread / 2 : 0
  nodes.forEach((node, index) => {
    const angle = startAngle - offset + (spread * index) / Math.max(nodes.length, 1)
    const importance = Math.min(Number(node.importance || 0), 100)
    const radiusShift = importance >= 85 ? -18 : node.expandable ? -8 : 0
    positions.set(node.id, {
      x: Math.cos(angle) * (radius + radiusShift),
      y: Math.sin(angle) * (radius + radiusShift)
    })
  })
}

function clipGraphLabel(label, maxLength = 9) {
  const text = String(label || '')
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text
}

function buildNodeStyle(node) {
  const palette = TYPE_COLORS[node.type] || TYPE_COLORS.meaning
  const isCenter = node.id === graphPayload.value.centerNodeId
  const isRelatedArtifact = node.type === 'artifact' && !isCenter
  const size = isCenter ? 108 : isRelatedArtifact ? 70 : node.type === 'site' || node.type === 'era' ? 58 : 46
  return {
    size,
    fill: palette.fill,
    stroke: palette.stroke,
    lineWidth: isCenter ? 3 : 2,
    shadowColor: `${palette.stroke}66`,
    shadowBlur: isCenter ? 22 : 12,
    cursor: 'pointer',
    halo: true,
    haloLineWidth: isCenter ? 18 : 10,
    haloStroke: palette.stroke,
    haloStrokeOpacity: isCenter ? 0.3 : 0.18,
    label: true,
    labelText: isCenter ? node.label : clipGraphLabel(node.label),
    labelFill: isCenter ? '#f8f0db' : palette.label,
    labelFontFamily: '"Noto Serif SC", "STZhongsong", serif',
    labelFontWeight: isCenter ? 700 : 600,
    labelFontSize: isCenter ? 18 : 13,
    labelPlacement: isCenter ? 'center' : 'bottom',
    labelOffsetY: isCenter ? 0 : 14,
    labelBackground: !isCenter,
    labelBackgroundFill: 'rgba(8, 17, 13, 0.72)',
    labelBackgroundRadius: 6,
    labelPadding: [3, 6]
  }
}

function buildEdgeStyle(edge) {
  const edgeColors = {
    origin: '#86ceb2',
    time: '#8aaed4',
    craft: '#d8c07b',
    material: '#cfba86',
    meaning: '#d4bd7f',
    motif: '#d68a5e',
    ritual: '#8bd0c1'
  }
  const stroke = edgeColors[edge.category] || '#b9a985'

  return {
    stroke,
    lineWidth: edge.weight === 2 ? 2.4 : 1.4,
    opacity: 0.7,
    lineDash: edge.category === 'meaning' || edge.category === 'ritual' ? [8, 6] : undefined,
    endArrow: true,
    cursor: 'pointer'
  }
}

async function renderGraph(options = {}) {
  if (!graphRef.value) return
  const { fit = false, focus = false } = options

  const data = buildG6Data()
  if (!data.nodes.length) {
    destroyGraph()
    return
  }

  const width = Math.max(graphRef.value.clientWidth || 0, 320)
  const height = Math.max(graphRef.value.clientHeight || 0, 420)
  const isNewGraph = !graphInstance

  if (!graphInstance) {
    graphInstance = new G6Graph({
      container: graphRef.value,
      width,
      height,
      data,
      padding: 36,
      animation: false,
      node: {
        type: 'circle',
        state: {
          active: {
            lineWidth: 5,
            haloLineWidth: 26,
            haloStrokeOpacity: 0.55,
            labelFontWeight: 800,
            labelFontSize: 15,
            labelBackgroundFill: 'rgba(216, 184, 109, 0.22)'
          },
          hover: {
            lineWidth: 4,
            haloLineWidth: 22,
            haloStrokeOpacity: 0.38,
            labelFontWeight: 800,
            labelBackgroundFill: 'rgba(121, 196, 167, 0.18)'
          },
          neighbor: {
            lineWidth: 3,
            haloLineWidth: 16,
            haloStrokeOpacity: 0.28,
            labelOpacity: 0.95
          },
          dim: { opacity: 0.18, labelOpacity: 0.3, haloStrokeOpacity: 0.04 }
        }
      },
      edge: {
        type: 'line',
        state: {
          active: { lineWidth: 3.4, opacity: 1 },
          preview: { lineWidth: 2.4, opacity: 0.9 },
          dim: { opacity: 0.08 }
        }
      },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-node']
    })
    bindGraphEvents()
  } else {
    graphInstance.setSize(width, height)
    graphInstance.setData(data)
  }

  await graphInstance.render()
  normalizeSelectedNode()
  if (fit || isNewGraph) {
    await graphInstance.fitView()
  }
  await applyFocusState(selectedNodeId.value || graphPayload.value.centerNodeId, focus)
}

function bindGraphEvents() {
  if (!graphInstance) return

  graphInstance.on('node:click', async (event) => {
    const nodeId = event?.target?.id
    if (!nodeId) return
    if (graphClickTimer) window.clearTimeout(graphClickTimer)
    graphClickTimer = window.setTimeout(async () => {
      if (selectedNodeId.value !== nodeId) {
        pushTrailViewSnapshot('graph-node')
      }
      selectedNodeId.value = nodeId
      hoverNodeId.value = ''
      await applyFocusState(nodeId, false)
      const node = graphPayload.value.nodes.find((item) => item.id === nodeId)
      if (node?.expandable && !expandedNodeIds.value.has(node.id)) {
        await expandNode(node)
        await applyFocusState(nodeId, false)
      }
    }, 180)
  })

  graphInstance.on('node:dblclick', (event) => {
    const nodeId = event?.target?.id
    if (!nodeId) return
    if (graphClickTimer) {
      window.clearTimeout(graphClickTimer)
      graphClickTimer = null
    }
    const node = graphPayload.value.nodes.find((item) => item.id === nodeId)
    if (node) jumpByNode(node)
  })

  graphInstance.on('node:mouseenter', async (event) => {
    const nodeId = event?.target?.id
    if (!nodeId || nodeId === selectedNodeId.value) return
    hoverNodeId.value = nodeId
    await applyFocusState(nodeId, false, true)
  })

  graphInstance.on('node:mouseleave', async () => {
    hoverNodeId.value = ''
    await applyFocusState(selectedNodeId.value || graphPayload.value.centerNodeId, false)
  })
}

async function applyFocusState(nodeId, animate = true, preview = false) {
  if (!graphInstance || !nodeId) return
  const { nodes, edges } = getVisibleGraphPayload()
  const neighborIds = new Set([nodeId])
  const relatedEdgeIds = new Set()
  const states = {}

  edges.forEach((edge) => {
    const isRelated = edge.source === nodeId || edge.target === nodeId
    states[edge.id] = isRelated ? [preview ? 'preview' : 'active'] : ['dim']
    if (isRelated) {
      neighborIds.add(edge.source)
      neighborIds.add(edge.target)
      relatedEdgeIds.add(edge.id)
    }
  })

  nodes.forEach((node) => {
    if (node.id === nodeId) {
      states[node.id] = [preview ? 'hover' : 'active']
    } else if (neighborIds.has(node.id)) {
      states[node.id] = ['neighbor']
    } else {
      states[node.id] = ['dim']
    }
  })

  if (preview && selectedNodeId.value && selectedNodeId.value !== nodeId) {
    states[selectedNodeId.value] = ['active']
  }

  focusedPathIds.value = { nodes: neighborIds, edges: relatedEdgeIds }
  await graphInstance.setElementState(states, false)
  if (animate && !preview) {
    await graphInstance.focusElement(nodeId, { duration: 400, easing: 'ease-in-out' })
  }
}

function normalizeSelectedNode() {
  const visibleIds = new Set(getVisibleGraphPayload().nodes.map((node) => node.id))
  if (!visibleIds.has(selectedNodeId.value)) {
    selectedNodeId.value = graphPayload.value.centerNodeId
  }
  if (!visibleIds.has(hoverNodeId.value)) {
    hoverNodeId.value = ''
  }
}

function toggleTypeFilter(type) {
  const nextFilters = activeTypeFilters.value.includes(type)
    ? activeTypeFilters.value.filter((item) => item !== type)
    : [...activeTypeFilters.value, type]
  activeTypeFilters.value = nextFilters.length ? nextFilters : [...graphPayload.value.availableTypes]
  void renderGraph()
}

async function focusCenterNode() {
  hoverNodeId.value = ''
  selectedNodeId.value = graphPayload.value.centerNodeId
  await applyFocusState(selectedNodeId.value)
}

async function resetGraphViewport() {
  if (!graphInstance) return
  hoverNodeId.value = ''
  await graphInstance.fitView()
  await applyFocusState(selectedNodeId.value || graphPayload.value.centerNodeId, false)
}

async function resizeGraphStage(fit = false) {
  if (!graphInstance || !graphRef.value) return
  graphInstance.setSize(graphRef.value.clientWidth || 320, graphRef.value.clientHeight || 420)
  if (fit) {
    await graphInstance.fitView()
    await applyFocusState(selectedNodeId.value || graphPayload.value.centerNodeId, false)
  }
}

function jumpByNode(node) {
  if (!node) return
  pushTrailViewSnapshot('graph-jump')

  if (node.type === 'artifact') {
    if (node.entityId === selectedArtifactDetail.value?.entityId) {
      scrollToGuide()
      return
    }
    const nextArtifact = artifacts.value.find((item) => item.entityId === (node.routeTarget || node.entityId))
    if (nextArtifact) {
      void selectArtifact(nextArtifact, `你顺着 ${selectedNodeTitle.value} 这条关系线索，继续走向另一件相关文物。`)
      activeScene.value = 3
      stageVisible.value = true
      return
    }
    selectedArtifactId.value = node.routeTarget || node.entityId || ''
    selectedReason.value = `你顺着 ${selectedNodeTitle.value} 这条关系线索，继续走向另一件相关文物。`
    void loadSelectedArtifactExperience(selectedArtifactId.value)
    activeScene.value = 3
    stageVisible.value = true
    return
  }

  if (node.type === 'site') {
    activeSite.value = node.routeTarget || node.label || ''
    meaningFocus.value = ''
    scrollToArtifacts()
    return
  }

  if (node.type === 'era') {
    activeEra.value = node.routeTarget || node.label || ''
    meaningFocus.value = ''
    scrollToArtifacts()
    return
  }

  if (node.type === 'craft') {
    activeCraft.value = node.routeTarget || node.label || ''
    meaningFocus.value = ''
    scrollToArtifacts()
    return
  }

  if (node.type === 'meaning') {
    meaningFocus.value = node.routeTarget || node.label || ''
    scrollToArtifacts()
    return
  }

  if (node.type === 'material' || node.type === 'motif' || node.type === 'ritual') {
    meaningFocus.value = node.routeTarget || node.label || ''
    scrollToArtifacts()
  }
}

function destroyGraph() {
  graphInstance?.destroy()
  graphInstance = null
  graphStablePositions = new Map()
}

function mountResizeObserver() {
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(async () => {
    resizeThreeStage()
    await resizeGraphStage(true)
  })

  if (viewerRef.value) resizeObserver.observe(viewerRef.value)
  if (graphRef.value) resizeObserver.observe(graphRef.value)
}

function resizeThreeStage() {
  if (!viewerRef.value || !camera || !renderer) return
  const width = viewerRef.value.clientWidth
  const height = viewerRef.value.clientHeight
  if (!width || !height) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
}

function afterFullscreenLayout(callback) {
  nextTick(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(callback)
    })
  })
}

function syncViewerLayoutAfterFullscreen(recheck = false) {
  afterFullscreenLayout(() => {
    resizeThreeStage()
    controls?.update()
    if (recheck) {
      window.setTimeout(() => {
        resizeThreeStage()
        controls?.update()
      }, 140)
    }
  })
}

function syncGraphLayoutAfterFullscreen(recheck = false) {
  afterFullscreenLayout(() => {
    void renderGraph()
      .then(() => resizeGraphStage(true))
      .then(() => {
        if (recheck) restoreGraphPanelScrollPosition()
      })
    if (recheck) {
      window.setTimeout(() => {
        restoreGraphPanelScrollPosition()
        void renderGraph().then(() => resizeGraphStage(true))
      }, 140)
      window.setTimeout(() => {
        restoreGraphPanelScrollPosition()
        void resizeGraphStage(true)
      }, 360)
    }
  })
}

function restoreGraphPanelScrollPosition() {
  const scroller = insightPanelRef.value
  const panel = graphPanelRef.value
  if (!scroller || !panel) return

  const style = window.getComputedStyle(scroller)
  const canScroll = style.overflowY === 'auto' || style.overflowY === 'scroll'
  if (!canScroll) return

  const scrollerRect = scroller.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const targetTop = Math.max(scroller.scrollTop + panelRect.top - scrollerRect.top - 12, 0)
  scroller.scrollTo({ top: targetTop, behavior: 'auto' })
}

function toggleViewerFullscreen() {
  setViewerFullscreen(!isViewerFullscreen.value)
}

function setViewerFullscreen(value) {
  if (isViewerFullscreen.value === value) return
  if (value && isGraphFullscreen.value) {
    setGraphFullscreen(false)
  }
  isViewerFullscreen.value = value

  if (value) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = ''
  }

  syncViewerLayoutAfterFullscreen(!value)
}

function restoreViewerPageState() {
  if (!isViewerFullscreen.value) return
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = ''
  isViewerFullscreen.value = false
}

function handleViewerKeydown(event) {
  if (event.key !== 'Escape') return
  const shouldExitFullscreen = isViewerFullscreen.value || isGraphFullscreen.value
  if (!shouldExitFullscreen) return
  event.preventDefault()
  if (isViewerFullscreen.value) {
    setViewerFullscreen(false)
  }
  if (isGraphFullscreen.value) {
    setGraphFullscreen(false)
  }
}

function toggleGraphFullscreen() {
  setGraphFullscreen(!isGraphFullscreen.value)
}

function setGraphFullscreen(value) {
  if (isGraphFullscreen.value === value) return
  if (value && isViewerFullscreen.value) {
    setViewerFullscreen(false)
  }
  isGraphFullscreen.value = value

  if (value) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = ''
  }

  syncGraphLayoutAfterFullscreen(!value)
}

function restoreGraphPageState() {
  if (!isGraphFullscreen.value) return
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = ''
  isGraphFullscreen.value = false
  syncGraphLayoutAfterFullscreen(true)
}

async function initializeGuide() {
  chatAbortController?.abort?.()
  resetMessages()
  void maybeAutoStartGuide()
}

function createInitialMessages() {
  if (!selectedArtifactDetail.value) {
    return [
      {
        id: 1,
        role: 'assistant',
        content: ['玄喵已经在展线末端等你。先选一件文物，我会从“这是什么、为什么重要、它和谁有关、下一步还能看什么”开始讲。'],
        time: getCurrentTime()
      }
    ]
  }

  const intro = [
    `你已经站到 ${selectedArtifactDetail.value.displayTitle} 面前了。`,
    selectedReason.value || `我会先围绕 ${selectedArtifactDetail.value.displayTitle} 的遗址、年代、工艺和寓意，把它讲成一段完整的古蜀线索。`
  ]

  if (previousArtifact.value?.title) {
    intro.push(`如果你愿意，我也可以把它和刚才看过的 ${previousArtifact.value.title} 放在一起比较。`)
  }

  return [
    {
      id: Date.now(),
      role: 'assistant',
      content: intro,
      time: getCurrentTime()
    }
  ]
}

function resetMessages() {
  currentSessionId.value = null
  archivedNarrationKeys.clear()
  messages.value = createInitialMessages()
  scrollMessagesToBottom()
}

function archiveVoiceGuideNarration(narration, text) {
  if (!shouldArchiveVoiceGuideNarration(narration)) return
  const archiveKey = narration.key
  if (!archiveKey || archivedNarrationKeys.has(archiveKey)) return

  archivedNarrationKeys.add(archiveKey)
  messages.value.push({
    id: `guide-${archiveKey}-${Date.now()}`,
    role: 'guide',
    narrationKey: archiveKey,
    content: [clipVoiceText(text || narration.text, 96)],
    time: getCurrentTime()
  })

  if (activeScene.value === 4 && guideExpanded.value) {
    scrollMessagesToBottom()
  }
}

function shouldArchiveVoiceGuideNarration(narration) {
  if (!narration?.intent) return false
  return ['scene-anchor', 'artifact-list', 'stage-viewer', 'graph-node', 'guide-chat'].includes(narration.intent)
}

function getCurrentArtifactEntityId() {
  return selectedArtifactDetail.value?.entityId || selectedArtifactId.value || ''
}

function updateAssistantMessageById(messageId, content) {
  const targetMessage = messages.value.find((item) => item.id === messageId)
  if (!targetMessage) return
  targetMessage.content = Array.isArray(content) ? content : [content]
  scrollMessagesToBottom()
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function typeAssistantMessageById(messageId, text, options = {}) {
  const finalText = String(text || '').trim()
  if (!finalText) return

  const thinkingMs = options.thinkingMs ?? 650
  const charDelay = options.charDelay ?? 24
  isThinking.value = true
  showThinkingBubble.value = true
  scrollMessagesToBottom()
  await wait(thinkingMs)

  isThinking.value = false
  showThinkingBubble.value = false
  updateAssistantMessageById(messageId, '')

  let displayed = ''
  for (const char of finalText) {
    displayed += char
    updateAssistantMessageById(messageId, displayed)
    await wait(charDelay)
  }
}

function appendAssistantPlaceholder(content = '...') {
  const id = Date.now() + Math.random()
  messages.value.push({
    id,
    role: 'assistant',
    content: [content],
    time: getCurrentTime()
  })
  scrollMessagesToBottom()
  return id
}

function buildAutoGuideQuestion() {
  return '请你以三星堆数字展线讲解员“玄喵”的口吻，围绕当前文物先做一段开场讲解。按“这是什么、为什么重要、它和什么有关、下一步还可以看什么”的顺序来讲，控制在四句以内，语言自然、适合展馆导览。'
}

async function maybeAutoStartGuide() {
  const entityId = getCurrentArtifactEntityId()
  if (!entityId || entityId === lastAutoAskedEntityId.value) return
  lastAutoAskedEntityId.value = entityId
  await requestAutoGuide(entityId)
}

async function requestAutoGuide(expectedEntityId) {
  const question = buildAutoGuideQuestion()
  let docs = []
  let userMessage = question

  const placeholderId = appendAssistantPlaceholder()
  /*
  messages.value.push({
    id: placeholderId,
    role: 'assistant',
    content: ['玄喵正在顺着当前文物的时空线索整理讲解……'],
    time: getCurrentTime()
  })
  scrollMessagesToBottom()
  */

  try {
    docs = await searchKnowledge(question, 1)
    userMessage = buildPromptWithContext(question, docs)
  } catch (error) {
    console.warn('自动讲解检索失败，继续用当前文物上下文生成讲解。', error)
  }

  if (!currentSessionId.value) {
    await createSession()
  }

  if (!currentSessionId.value) {
    updateAssistantMessageById(placeholderId, getMockReply(question, docs))
    return
  }

  isThinking.value = true
  const controller = new AbortController()
  chatAbortController?.abort?.()
  chatAbortController = controller
  let aiResponse = ''
  const headers = { 'Content-Type': 'application/json' }
  if (userStore.token) {
    headers.Authorization = `Bearer ${userStore.token}`
  }

  try {
    await fetchEventSource(getChatStreamUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId: currentSessionId.value,
        userMessage
      }),
      signal: controller.signal,
      openWhenHidden: true,
      onmessage(event) {
        if (controller.signal.aborted || getCurrentArtifactEntityId() !== expectedEntityId) {
          return
        }
        if (event.data === '[DONE]') {
          isThinking.value = false
          return
        }
        if (event.data.startsWith('[ERROR]')) {
          isThinking.value = false
          updateAssistantMessageById(placeholderId, getMockReply(question, docs))
          return
        }
        aiResponse += event.data
        updateAssistantMessageById(placeholderId, aiResponse)
      },
      onerror(error) {
        if (controller.signal.aborted || getCurrentArtifactEntityId() !== expectedEntityId) {
          return 0
        }
        console.error('自动讲解 SSE 连接失败:', error)
        isThinking.value = false
        updateAssistantMessageById(placeholderId, getMockReply(question, docs))
        return 999999999
      },
      onclose() {
        isThinking.value = false
      }
    })
  } catch (error) {
    if (!controller.signal.aborted && getCurrentArtifactEntityId() === expectedEntityId) {
      console.error('自动讲解请求失败:', error)
      updateAssistantMessageById(placeholderId, getMockReply(question, docs))
    }
    isThinking.value = false
  } finally {
    if (chatAbortController === controller) {
      chatAbortController = null
    }
  }
}

async function createSession() {
  try {
    const title = selectedArtifactDetail.value
      ? `时空展线讲解 - ${selectedArtifactDetail.value.displayTitle}`
      : '时空展线讲解'
    currentSessionId.value = await createSessionApi(title, { showDefaultMsg: false })
  } catch (error) {
    console.error('创建 AI 会话失败:', error)
    currentSessionId.value = null
  }
}

function getCurrentContextPayload() {
  if (!selectedArtifactDetail.value) return null
  return {
    title: selectedArtifactDetail.value.displayTitle,
    entityId: selectedArtifactDetail.value.entityId,
    site: selectedArtifactDetail.value.siteLabel,
    era:
      selectedArtifactDetail.value.yearLabel ||
      formatYearRange(selectedArtifactDetail.value.timeStartYear, selectedArtifactDetail.value.timeEndYear),
    craft: selectedArtifactDetail.value.craftLabel,
    summary: selectedArtifactDetail.value.summary || '',
    previousTitle: previousArtifact.value?.title || '',
    previousSite: previousArtifact.value?.siteLabel || '',
    previousEra: previousArtifact.value?.eraLabel || '',
    entryReason: selectedReason.value || ''
  }
}

function buildPromptWithContext(question, docs = []) {
  return buildRagPrompt(question, docs, getCurrentContextPayload() || {})
}

function getMockReply(question = '', docs = []) {
  return buildFallbackReply(question, docs, getCurrentContextPayload() || {})
}

async function sendMessage(presetQuestion = '') {
  const question = (presetQuestion || draft.value).trim()
  if (!question || isThinking.value) return

  if (voiceGuideEnabled.value && !voiceGuidePaused.value) {
    cancelVoiceGuideRequest()
    stopVoiceGuideAudio()
  }

  const fixedAnswer = matchFixedAnswer(question)
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: [question],
    time: getCurrentTime()
  })
  const quizPromoRound = registerGuideUserQuestion()
  draft.value = ''
  scrollMessagesToBottom()
  const assistantPlaceholderId = appendAssistantPlaceholder()

  if (fixedAnswer) {
    await typeAssistantMessageById(assistantPlaceholderId, fixedAnswer.reply)
    maybeRevealQuizPromo(quizPromoRound)
    return
  }

  let docs = []
  let userMessage = question
  try {
    docs = await searchKnowledge(question, 1)
    userMessage = buildPromptWithContext(question, docs)
  } catch (error) {
    console.warn('本地知识检索失败，降级为原始问题。', error)
  }

  if (!currentSessionId.value) {
    await createSession()
  }

  if (!currentSessionId.value) {
    updateAssistantMessageById(assistantPlaceholderId, getMockReply(question, docs))
    maybeRevealQuizPromo(quizPromoRound)
    return
  }

  isThinking.value = true
  showThinkingBubble.value = false
  chatAbortController?.abort?.()
  chatAbortController = new AbortController()

  let aiResponse = ''
  const headers = { 'Content-Type': 'application/json' }
  if (userStore.token) {
    headers.Authorization = `Bearer ${userStore.token}`
  }

  try {
    await fetchEventSource(getChatStreamUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId: currentSessionId.value,
        userMessage
      }),
      signal: chatAbortController.signal,
      openWhenHidden: true,
      onmessage(event) {
        if (event.data === '[DONE]') {
          isThinking.value = false
          if (!aiResponse) {
            updateAssistantMessageById(assistantPlaceholderId, getMockReply(question, docs))
          }
          maybeRevealQuizPromo(quizPromoRound)
          return
        }
        if (event.data.startsWith('[ERROR]')) {
          isThinking.value = false
          updateAssistantMessageById(assistantPlaceholderId, getMockReply(question, docs))
          maybeRevealQuizPromo(quizPromoRound)
          return
        }
        aiResponse += event.data
        updateAssistantMessageById(assistantPlaceholderId, aiResponse)
      },
      onerror(error) {
        console.error('AI SSE 连接失败:', error)
        isThinking.value = false
        updateAssistantMessageById(assistantPlaceholderId, getMockReply(question, docs))
        maybeRevealQuizPromo(quizPromoRound)
        return 999999999
      },
      onclose() {
        isThinking.value = false
      }
    })
  } catch (error) {
    console.error('发送 AI 消息失败:', error)
    isThinking.value = false
    updateAssistantMessageById(assistantPlaceholderId, getMockReply(question, docs))
    maybeRevealQuizPromo(quizPromoRound)
  } finally {
    chatAbortController = null
  }
}

function appendAssistantMessage(content) {
  const lines = Array.isArray(content) ? content : [content]
  messages.value.push({
    id: Date.now() + Math.random(),
    role: 'assistant',
    content: lines,
    time: getCurrentTime()
  })
  scrollMessagesToBottom()
}

function scrollMessagesToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function getCurrentTime() {
  const date = new Date()
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function hydrateQuizPromoState() {
  showQuizPromo.value = false
}

function hasSeenQuizPromo() {
  try {
    return sessionStorage.getItem(QUIZ_PROMO_SESSION_KEY) === '1'
  } catch (error) {
    return false
  }
}

function markQuizPromoSeen() {
  try {
    sessionStorage.setItem(QUIZ_PROMO_SESSION_KEY, '1')
  } catch (error) {
    // sessionStorage may be blocked; the in-memory flag still prevents immediate repeats.
  }
}

function registerGuideUserQuestion() {
  guideUserQuestionCount.value += 1
  return guideUserQuestionCount.value
}

function maybeRevealQuizPromo(roundCount) {
  if (showQuizPromo.value || hasSeenQuizPromo()) return
  if (roundCount < QUIZ_PROMO_TRIGGER_ROUNDS) return

  showQuizPromo.value = true
  trailNextCardDismissed.value = false
  markQuizPromoSeen()
  scrollMessagesToBottom()
}

function dismissTrailNextCard() {
  if (showQuizPromo.value) {
    dismissQuizPromo()
    return
  }
  trailNextCardDismissed.value = true
}

function dismissQuizPromo() {
  showQuizPromo.value = false
  markQuizPromoSeen()
}

function returnToTrailStart() {
  pushTrailViewSnapshot('trail-loop-start')
  activeScene.value = 1
  guideExpanded.value = false
  trailLoopHintVisible.value = true
  trailNextCardDismissed.value = false

  nextTick(() => {
    filterSectionRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  })
}

function goQuizChallenge() {
  markQuizPromoSeen()
  showQuizPromo.value = false
  router.push('/quiz')
}
</script>

<style scoped>
@import '@/styles/competitionMotion.css';

.time-space-trail {
  --paper: #fbf7ee;
  --paper-soft: rgba(255, 251, 243, 0.92);
  --ink: #1d342b;
  --ink-soft: #6d7d75;
  --green: #42664f;
  --green-deep: #29483a;
  --gold: #b89243;
  --line: rgba(66, 102, 79, 0.14);
  --voice-guide-top: 76px;
  --voice-guide-space: 104px;
  position: relative;
  min-height: calc(100vh - 64px);
  padding: var(--voice-guide-space) 28px 56px;
  color: var(--ink);
  background:
    radial-gradient(circle at 12% 0%, rgba(184, 146, 67, 0.18), transparent 22%),
    radial-gradient(circle at 100% 8%, rgba(66, 102, 79, 0.12), transparent 26%),
    linear-gradient(180deg, #fbf9f2 0%, #f4efe2 100%);
  scroll-snap-type: y proximity;
}

.time-space-trail,
.time-space-trail * {
  box-sizing: border-box;
}

.trail-hero,
.trail-stagebar,
.trail-shell,
.voice-guide-panel {
  width: min(1400px, calc(100vw - 56px));
  margin: 0 auto;
}

.voice-guide-panel {
  position: fixed;
  top: var(--voice-guide-top);
  left: max(28px, calc((100vw - 1120px) / 2));
  right: max(28px, calc((100vw - 1120px) / 2));
  z-index: 780;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  width: auto;
  margin-bottom: 16px;
  padding: 12px 14px;
  transform: none;
  border: 1px solid rgba(184, 146, 67, 0.18);
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(255, 252, 243, 0.94), rgba(244, 239, 226, 0.9)),
    var(--paper-soft);
  box-shadow: 0 16px 34px rgba(78, 62, 31, 0.08);
  backdrop-filter: blur(14px);
  transition:
    transform 0.28s ease,
    opacity 0.24s ease,
    border-color 0.24s ease,
    box-shadow 0.24s ease;
  will-change: transform, opacity;
}

.voice-guide-hover-zone {
  position: fixed;
  top: 54px;
  left: max(28px, calc((100vw - 1120px) / 2));
  right: max(28px, calc((100vw - 1120px) / 2));
  z-index: 781;
  height: 34px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  pointer-events: auto;
}

.voice-guide-hover-zone span {
  margin-top: 6px;
  padding: 5px 14px;
  border: 1px solid rgba(184, 146, 67, 0.22);
  border-radius: 999px;
  color: rgba(41, 72, 58, 0.78);
  background: rgba(255, 252, 243, 0.88);
  box-shadow: 0 10px 24px rgba(37, 56, 45, 0.12);
  font-size: 12px;
  font-weight: 800;
  opacity: 0.72;
  backdrop-filter: blur(12px);
}

.voice-guide-panel--collapsed {
  opacity: 0;
  pointer-events: none;
  transform: translateY(calc(-1 * (var(--voice-guide-top) + 100% + 10px)));
}

.voice-guide-panel--revealed {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.voice-guide-panel--active {
  border-color: rgba(66, 102, 79, 0.26);
}

.trail-step-back {
  position: fixed;
  top: calc(var(--voice-guide-top) + 86px);
  left: 24px;
  z-index: 775;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(66, 102, 79, 0.16);
  border-radius: 999px;
  color: var(--green-deep);
  background: rgba(255, 252, 243, 0.94);
  box-shadow: 0 14px 28px rgba(37, 56, 45, 0.12);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
  backdrop-filter: blur(14px);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.trail-step-back:hover {
  transform: translateY(-1px);
  border-color: rgba(184, 146, 67, 0.34);
  background: rgba(255, 248, 230, 0.96);
  box-shadow: 0 18px 34px rgba(37, 56, 45, 0.16);
}

.trail-step-back i {
  font-size: 12px;
}

.time-space-trail--immersive .trail-step-back {
  color: #f7f2e4;
  border-color: rgba(121, 196, 167, 0.18);
  background: rgba(12, 28, 21, 0.86);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.22);
}

.trail-command-overlay {
  position: fixed;
  left: 50%;
  top: calc(var(--voice-guide-top) + 84px);
  z-index: 790;
  width: min(680px, calc(100vw - 40px));
  pointer-events: none;
  transform: translateX(-50%);
}

.trail-command-overlay__panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px 16px;
  align-items: center;
  padding: 16px;
  border: 1px solid rgba(66, 102, 79, 0.24);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(252, 248, 238, 0.96), rgba(236, 244, 236, 0.94)),
    rgba(255, 255, 255, 0.92);
  box-shadow: 0 22px 48px rgba(37, 56, 45, 0.18);
  backdrop-filter: blur(16px);
}

.trail-command-overlay__mark {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 1px solid rgba(184, 146, 67, 0.36);
  border-radius: 14px;
  color: #fffaf0;
  background: linear-gradient(135deg, #b89243, #42664f);
  box-shadow: 0 12px 24px rgba(66, 102, 79, 0.22);
}

.trail-command-overlay__copy {
  min-width: 0;
}

.trail-command-overlay__copy span {
  display: block;
  margin-bottom: 4px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.trail-command-overlay__copy h2 {
  margin: 0;
  color: var(--green-deep);
  font-size: 22px;
  line-height: 1.2;
}

.trail-command-overlay__copy p {
  margin: 6px 0 0;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.7;
}

.trail-command-overlay__steps {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.trail-command-overlay__steps span {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 12px;
  color: rgba(29, 52, 43, 0.56);
  background: rgba(255, 255, 255, 0.46);
  transition: transform 0.22s ease, border-color 0.22s ease, color 0.22s ease, background 0.22s ease;
}

.trail-command-overlay__steps i {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: inherit;
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
  background: rgba(66, 102, 79, 0.1);
}

.trail-command-overlay__steps small {
  overflow: hidden;
  min-width: 0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trail-command-overlay__steps span.is-active {
  color: var(--green-deep);
  border-color: rgba(184, 146, 67, 0.38);
  background: rgba(255, 251, 243, 0.86);
  transform: translateY(-1px);
}

.trail-command-overlay__steps span.is-done {
  color: #42664f;
  border-color: rgba(66, 102, 79, 0.22);
  background: rgba(232, 242, 231, 0.78);
}

.trail-command-enter-active,
.trail-command-leave-active {
  transition: opacity 0.26s ease, transform 0.26s ease;
}

.trail-command-enter-from,
.trail-command-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

.voice-guide-panel--loading .voice-guide-panel__mark {
  border-color: rgba(184, 146, 67, 0.46);
}

.time-space-trail--immersive .voice-guide-panel {
  background:
    linear-gradient(135deg, rgba(14, 34, 26, 0.94), rgba(28, 50, 38, 0.9)),
    #102018;
  border-color: rgba(121, 196, 167, 0.18);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);
}

.voice-guide-panel__mark {
  display: grid;
  place-items: center;
  position: relative;
  width: 46px;
  height: 46px;
  overflow: hidden;
  border: 2px solid rgba(184, 146, 67, 0.28);
  border-radius: 50%;
  color: var(--green-deep);
  background: #f7efe3;
  box-shadow: 0 12px 24px rgba(41, 72, 58, 0.2);
}

.voice-guide-panel__mark img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.voice-guide-panel__mark i {
  position: absolute;
  right: -1px;
  bottom: -1px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: 2px solid #f7efe3;
  border-radius: 50%;
  color: #fff8e8;
  background: var(--gold);
  font-size: 9px;
}

.voice-guide-panel__copy {
  min-width: 0;
}

.voice-guide-panel__head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 4px;
}

.voice-guide-panel__head strong {
  font-size: 15px;
  color: var(--ink);
}

.voice-guide-panel__head span {
  flex: none;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: var(--green-deep);
  background: rgba(66, 102, 79, 0.1);
}

.voice-guide-panel__copy p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.65;
}

.time-space-trail--immersive .voice-guide-panel__head strong {
  color: #f4eddc;
}

.time-space-trail--immersive .voice-guide-panel__head span {
  color: #d9f0e0;
  background: rgba(121, 196, 167, 0.14);
}

.time-space-trail--immersive .voice-guide-panel__copy p {
  color: rgba(233, 241, 233, 0.72);
}

.voice-guide-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
}

.voice-guide-button {
  flex: none;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid rgba(66, 102, 79, 0.16);
  border-radius: 999px;
  color: var(--green-deep);
  font-size: 13px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
}

.voice-guide-button:disabled {
  opacity: 0.46;
  cursor: not-allowed;
}

.voice-guide-button--primary {
  color: #fffaf0;
  border-color: transparent;
  background: linear-gradient(135deg, var(--green), var(--green-deep));
  box-shadow: 0 12px 22px rgba(41, 72, 58, 0.18);
}

.voice-guide-button--ghost {
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.48);
}

.time-space-trail--immersive .voice-guide-button {
  color: #e6f2e7;
  border-color: rgba(121, 196, 167, 0.16);
  background: rgba(255, 255, 255, 0.06);
}

.time-space-trail--immersive .voice-guide-button--primary {
  color: #08110d;
  background: linear-gradient(135deg, #d8bf72, #79c4a7);
}

.trail-nav {
  width: min(1400px, calc(100vw - 56px));
  margin: 0 auto 20px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.time-space-trail--compact {
  padding-top: var(--voice-guide-space);
}

.time-space-trail--immersive {
  padding: var(--voice-guide-space) 28px 56px;
  background:
    radial-gradient(circle at 20% 0%, rgba(52, 97, 81, 0.16), transparent 42%),
    radial-gradient(circle at 100% 0%, rgba(182, 140, 52, 0.08), transparent 28%),
    linear-gradient(180deg, #07100c 0%, #0b1511 48%, #0a130f 100%);
  color: #f4eddc;
}

.time-space-trail--immersive .trail-nav {
  margin-bottom: 10px;
}

.time-space-trail--immersive .trail-stagebar {
  margin-bottom: 10px;
  padding-top: 0;
}

.time-space-trail--immersive .scene-tab {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(121, 196, 167, 0.12);
  color: rgba(233, 241, 233, 0.68);
}

.time-space-trail--immersive .scene-tab--active {
  background: rgba(121, 196, 167, 0.16);
  color: #f4eddc;
  border-color: rgba(121, 196, 167, 0.24);
}

.time-space-trail--immersive .trail-progress-card {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(121, 196, 167, 0.12);
  color: rgba(233, 241, 233, 0.72);
}

.time-space-trail--immersive .trail-progress-card__head strong,
.time-space-trail--immersive .trail-progress-card__steps button.is-done small,
.time-space-trail--immersive .trail-progress-card__steps button.is-active small {
  color: #f4eddc;
}

.time-space-trail--immersive .trail-progress-card p {
  color: rgba(233, 241, 233, 0.58);
}

.time-space-trail--immersive .trail-stagebar__kicker {
  color: #dfbf72;
}

.time-space-trail--immersive .trail-stagebar__copy h1 {
  color: #f4eddc;
}

.time-space-trail--immersive .trail-stagebar__line {
  color: rgba(233, 241, 233, 0.68);
}

.time-space-trail--immersive .trail-stagebar__stat {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(121, 196, 167, 0.1);
}

.time-space-trail--immersive .trail-stagebar__stat em {
  color: rgba(233, 241, 233, 0.52);
}

.time-space-trail--immersive .trail-stagebar__stat strong {
  color: #f4eddc;
}

.trail-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
  gap: 34px;
  align-items: stretch;
  margin-bottom: 20px;
  padding: 34px 40px;
  min-height: 0;
  scroll-snap-align: start;
  overflow: hidden;
  border: 1px solid rgba(184, 146, 67, 0.2);
  border-radius: 26px;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.86), rgba(255, 250, 238, 0.72) 50%, rgba(232, 224, 204, 0.38)),
    linear-gradient(90deg, rgba(66, 102, 79, 0.08), transparent 38%),
    var(--paper-soft);
  box-shadow: 0 22px 48px rgba(78, 62, 31, 0.1);
}

.trail-hero::before {
  content: '';
  position: absolute;
  inset: 16px;
  pointer-events: none;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.68);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.trail-hero::after {
  content: '';
  position: absolute;
  top: 18px;
  bottom: 18px;
  left: 56%;
  width: 1px;
  pointer-events: none;
  background: linear-gradient(180deg, transparent, rgba(184, 146, 67, 0.2), transparent);
}

.hero-copy,
.hero-board,
.filter-panel,
.artifact-section,
.guide-section {
  border: 1px solid rgba(184, 146, 67, 0.16);
  border-radius: 28px;
  background: var(--paper-soft);
  box-shadow: 0 20px 42px rgba(78, 62, 31, 0.08);
}

.hero-copy {
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  padding: 26px 12px 26px 8px;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.trail-stagebar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: end;
  margin-bottom: 14px;
  padding: 14px 0 10px;
}

.trail-progress-card {
  width: min(1400px, calc(100vw - 56px));
  margin: -6px auto 18px;
  padding: 14px 16px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: 0 12px 28px rgba(46, 64, 50, 0.06);
}

.trail-progress-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 800;
}

.trail-progress-card__head strong {
  color: var(--green);
  font-size: 15px;
}

.trail-progress-card__bar {
  height: 5px;
  margin-top: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(66, 102, 79, 0.1);
}

.trail-progress-card__bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4e765d, #d1a852);
  transition: width 0.32s ease;
}

.trail-progress-card__steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}

.trail-progress-card__steps button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0;
  color: var(--ink-soft);
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.trail-progress-card__steps button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.trail-progress-card__steps button:not(:disabled):hover em {
  transform: translateY(-2px);
  box-shadow: 0 0 0 4px rgba(184, 146, 67, 0.13);
}

.trail-progress-card__steps em {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  background: rgba(66, 102, 79, 0.08);
  color: var(--green);
  font-size: 11px;
  font-style: normal;
  font-weight: 900;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

.trail-progress-card__steps small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 800;
}

.trail-progress-card__steps button.is-done em {
  background: #315845;
  color: #f7f2e4;
}

.trail-progress-card__steps button.is-active em {
  box-shadow: 0 0 0 4px rgba(184, 146, 67, 0.16);
}

.trail-progress-card__steps button.is-done small,
.trail-progress-card__steps button.is-active small {
  color: var(--green);
}

.trail-progress-card p {
  margin: 10px 0 0;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.6;
}

.hero-kicker,
.panel-kicker,
.section-kicker,
.node-label {
  margin: 0 0 10px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

.hero-copy h1,
.filter-panel h2,
.section-head h2,
.section-head h3,
.spotlight-copy h3,
.guide-context h3,
.guide-preview h3 {
  margin: 0;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  line-height: 1.08;
}

.hero-copy h1 {
  max-width: 860px;
  color: var(--ink);
  font-size: clamp(36px, 3.6vw, 62px);
  letter-spacing: 0;
  text-shadow: 0 10px 24px rgba(46, 64, 50, 0.08);
}

.hero-subtitle,
.filter-summary,
.spotlight-summary,
.spotlight-reason,
.graph-lead,
.guide-journey,
.artifact-summary,
.narrative-card p,
.message-bubble p,
.guide-preview__line {
  line-height: 1.8;
}

.hero-subtitle {
  max-width: 920px;
  margin: 20px 0 0;
  color: var(--ink-soft);
  font-size: 17px;
  font-weight: 700;
}

.hero-actions,
.panel-actions,
.spotlight-actions,
.section-actions,
.artifact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-actions {
  margin-top: 30px;
}

.hero-button,
.card-action,
.mini-action,
.meaning-clear,
.question-pill,
.guide-fold {
  border: none;
  cursor: pointer;
  transition: transform 0.24s ease, box-shadow 0.24s ease, background 0.24s ease, color 0.24s ease;
}

.hero-button,
.card-action {
  border-radius: 999px;
  padding: 14px 26px;
  font-size: 15px;
  font-weight: 700;
}

.hero-button--primary,
.card-action,
.narrative-button {
  background: linear-gradient(135deg, #4e765d, #29483a);
  color: #f7f2e4;
  box-shadow: 0 14px 28px rgba(41, 72, 58, 0.18);
}

.hero-button:not(.hero-button--primary),
.card-action--ghost,
.guide-fold {
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
  border: 1px solid rgba(66, 102, 79, 0.14);
}

.hero-button:disabled,
.card-action:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.hero-board {
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  padding: 12px;
  display: grid;
  gap: 10px;
  align-content: center;
  border: 1px solid rgba(184, 146, 67, 0.12);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.42);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
}

.board-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(66, 102, 79, 0.08);
  border-radius: 18px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 24px rgba(78, 62, 31, 0.07);
}

.board-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg, var(--gold), var(--green));
  opacity: 0.72;
}

.board-card span {
  display: block;
  margin-bottom: 12px;
  color: var(--ink-soft);
  font-size: 14px;
  font-weight: 800;
}

.board-card strong {
  color: var(--ink);
  font-size: 42px;
  line-height: 1;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
}

.trail-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

.trail-stagebar {
  width: min(1480px, calc(100vw - 48px));
}

.trail-stagebar__copy {
  min-width: 0;
}

.trail-stagebar__kicker {
  margin: 0 0 8px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.trail-stagebar__copy h1 {
  margin: 0;
  color: var(--ink);
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: clamp(22px, 2.1vw, 34px);
  line-height: 1.16;
}

.trail-stagebar__line {
  max-width: 920px;
  margin: 10px 0 0;
  color: var(--ink-soft);
  font-size: 15px;
  line-height: 1.75;
}

.trail-stagebar__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.trail-stagebar__stat {
  min-width: 108px;
  padding: 12px 14px;
  border: 1px solid rgba(66, 102, 79, 0.1);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 10px 22px rgba(78, 62, 31, 0.06);
}

.trail-stagebar__stat em {
  display: block;
  margin-bottom: 8px;
  color: var(--ink-soft);
  font-style: normal;
  font-size: 12px;
}

.trail-stagebar__stat strong {
  color: var(--ink);
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: 26px;
  line-height: 1;
}

.scene-tab {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 22px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  background: rgba(255, 255, 255, 0.64);
  color: var(--ink-soft);
}

.scene-tab--active {
  background: linear-gradient(135deg, rgba(66, 102, 79, 0.92), rgba(41, 72, 58, 0.94));
  color: #f8f3e6;
  box-shadow: 0 16px 28px rgba(41, 72, 58, 0.16);
}

.scene-tab--unlocked:not(.scene-tab--active) {
  border-color: rgba(184, 146, 67, 0.2);
  color: var(--ink);
}

.scene-index {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(184, 146, 67, 0.14);
  color: var(--gold);
  font-weight: 800;
}

.scene-tab--active .scene-index {
  background: rgba(255, 248, 229, 0.16);
  color: #f4d48b;
}

.scene-copy {
  display: grid;
  gap: 2px;
  text-align: left;
}

.scene-copy strong {
  font-size: 15px;
}

.scene-copy small {
  font-size: 12px;
  color: inherit;
  opacity: 0.8;
}

.filter-panel {
  position: static;
  padding: 28px 32px;
  min-height: clamp(580px, calc(100vh - 240px), 720px);
  scroll-snap-align: start;
}

.pit-map-layout {
  --pit-map-panel-height: clamp(560px, calc(100vh - 260px), 720px);
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.75fr);
  gap: 18px;
  margin-top: 24px;
  align-items: stretch;
  grid-auto-rows: minmax(0, auto);
}

.pit-map-card,
.pit-map-inspector,
.guide-clue-panel {
  border: 1px solid rgba(66, 102, 79, 0.14);
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 18px 44px rgba(38, 56, 43, 0.08);
}

.pit-map-card {
  display: flex;
  flex-direction: column;
  height: var(--pit-map-panel-height);
  overflow: hidden;
  border-radius: 22px;
}

.pit-map-card__head,
.guide-clue-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
}

.pit-map-card__head h3,
.pit-map-inspector h3,
.guide-clue-head h3 {
  margin: 0;
  color: var(--ink);
  font-size: 20px;
  line-height: 1.25;
}

.pit-map-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(184, 146, 67, 0.14);
  color: #7a5a1e;
  font-size: 12px;
  font-weight: 800;
}

.pit-map-hint {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 18px 12px;
}

.pit-map-hint span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  padding: 5px 10px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 999px;
  background: rgba(250, 247, 239, 0.82);
  color: var(--ink-soft);
  font-size: 12px;
  line-height: 1.35;
}

.pit-map-hint strong {
  color: var(--green);
  font-weight: 900;
  white-space: nowrap;
}

.pit-map-scroll {
  flex: 1 1 auto;
  overflow: auto hidden;
  padding: 0 16px 16px;
  scrollbar-width: thin;
}

.pit-map-stage {
  position: relative;
  min-width: 720px;
  aspect-ratio: 16 / 9;
  border-radius: 18px;
  overflow: hidden;
  background: #e8dec7;
}

.pit-map-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  pointer-events: none;
}

.pit-hotspot {
  position: absolute;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 12px;
  color: transparent;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.pit-hotspot span {
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(18, 34, 25, 0);
  font-size: 11px;
  font-weight: 800;
  pointer-events: none;
}

.pit-hotspot:hover,
.pit-hotspot--active {
  color: #fff8e6;
  border-color: rgba(255, 238, 186, 0.92);
  background: rgba(176, 78, 38, 0.22);
  box-shadow: 0 0 0 3px rgba(211, 159, 70, 0.2), 0 10px 24px rgba(63, 42, 20, 0.24);
}

.pit-hotspot--pressed {
  transform: translate(-50%, -50%) scale(0.94);
}

.pit-hotspot:hover span,
.pit-hotspot--active span {
  background: rgba(37, 58, 43, 0.86);
}

.pit-hotspot--pit {
  border-color: rgba(49, 88, 69, 0.2);
  background: rgba(255, 255, 255, 0.04);
}

.pit-hotspot--pit::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 14px;
  border: 1px solid rgba(217, 169, 86, 0);
  pointer-events: none;
}

.pit-hotspot--pit span {
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 0.2s ease, transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.pit-hotspot--pit:hover,
.pit-hotspot--pit.pit-hotspot--active,
.pit-hotspot--pit.pit-hotspot--pressed {
  color: #fff8e6;
  border-color: rgba(255, 238, 186, 0.86);
  background: rgba(176, 78, 38, 0.14);
  box-shadow: 0 0 0 2px rgba(211, 159, 70, 0.16), 0 10px 24px rgba(63, 42, 20, 0.18);
}

.pit-hotspot--pit:hover span,
.pit-hotspot--pit.pit-hotspot--active span,
.pit-hotspot--pit.pit-hotspot--pressed span {
  opacity: 1;
  transform: translateY(0);
}

.pit-hotspot--pit.pit-hotspot--pressed::after {
  animation: pitHotspotPulse 0.42s ease-out;
}

.pit-hotspot--artifact {
  width: 48px !important;
  height: 48px !important;
  border-radius: 50%;
  color: transparent;
  background: transparent;
  border-color: transparent;
  backdrop-filter: none;
}

.pit-hotspot--artifact::after {
  content: "";
  position: absolute;
  inset: -7px;
  border-radius: inherit;
  border: 1px solid rgba(69, 120, 92, 0.28);
  opacity: 0;
  transform: scale(0.82);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.pit-hotspot--artifact span {
  max-width: 38px;
  padding: 0;
  background: rgba(37, 84, 63, 0);
  color: transparent;
  font-size: 10px;
  line-height: 1.1;
  text-align: center;
  white-space: normal;
  transition: background 0.2s ease, color 0.2s ease;
}

.pit-hotspot--artifact:hover,
.pit-hotspot--artifact.pit-hotspot--active {
  background: transparent;
  border-color: rgba(151, 214, 184, 0.72);
}

.pit-hotspot--artifact.pit-hotspot--active:not(:hover):not(.pit-hotspot--pressed),
.pit-hotspot--artifact:not(:hover):not(.pit-hotspot--pressed) {
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.pit-hotspot--artifact.pit-hotspot--active:not(:hover):not(.pit-hotspot--pressed)::after,
.pit-hotspot--artifact:not(:hover):not(.pit-hotspot--pressed)::after {
  opacity: 0;
}

.pit-hotspot--artifact.pit-hotspot--active:not(:hover):not(.pit-hotspot--pressed) span,
.pit-hotspot--artifact:not(:hover):not(.pit-hotspot--pressed) span {
  color: transparent;
  background: transparent;
}

.pit-hotspot--artifact:hover span,
.pit-hotspot--artifact.pit-hotspot--pressed span {
  background: rgba(37, 84, 63, 0.7);
  color: #fff8e6;
}

.pit-hotspot--artifact:hover::after,
.pit-hotspot--artifact.pit-hotspot--pressed::after {
  opacity: 1;
  transform: scale(1);
}

.pit-hotspot--artifact.pit-hotspot--pressed::after {
  animation: pitHotspotPulse 0.42s ease-out;
}

@keyframes pitHotspotPulse {
  0% {
    opacity: 0.75;
    transform: scale(0.86);
    box-shadow: 0 0 0 0 rgba(217, 169, 86, 0.42);
  }

  100% {
    opacity: 0;
    transform: scale(1.55);
    box-shadow: 0 0 0 14px rgba(217, 169, 86, 0);
  }
}

@keyframes pitInspectorIn {
  0% {
    opacity: 0;
    transform: translateY(6px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.pit-map-inspector {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  min-height: 0;
  height: var(--pit-map-panel-height);
  max-height: var(--pit-map-panel-height);
  padding: 20px 16px 20px 20px;
  border-radius: 22px;
  position: relative;
  overflow-x: hidden;
  overflow-y: scroll;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(49, 88, 69, 0.54) rgba(49, 88, 69, 0.08);
  transition: border-color 0.24s ease, box-shadow 0.24s ease, transform 0.24s ease;
  animation: pitInspectorIn 0.24s ease both;
}

.pit-map-inspector::-webkit-scrollbar {
  width: 8px;
}

.pit-map-inspector::-webkit-scrollbar-track {
  border-radius: 999px;
  background: rgba(49, 88, 69, 0.08);
}

.pit-map-inspector::-webkit-scrollbar-thumb {
  border: 2px solid rgba(255, 255, 255, 0.76);
  border-radius: 999px;
  background: rgba(49, 88, 69, 0.54);
}

.pit-map-inspector::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 84% 12%, rgba(184, 146, 67, 0.18), transparent 34%);
}

.pit-map-inspector--pulse {
  border-color: rgba(184, 146, 67, 0.38);
  box-shadow: 0 22px 56px rgba(58, 76, 54, 0.14);
  transform: translateY(-1px);
}

.pit-map-inspector__code {
  align-self: flex-start;
  min-width: 48px;
  height: 28px;
  margin: -2px 0 10px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(49, 88, 69, 0.12);
  color: var(--green);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
}

.pit-map-inspector p {
  margin: 12px 0 0;
  color: var(--ink-soft);
  line-height: 1.8;
}

.pit-map-inspector__figure {
  margin: 12px 0 0;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(66, 102, 79, 0.12);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(244, 239, 226, 0.78)),
    rgba(255, 255, 255, 0.7);
}

.pit-map-inspector__figure img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  max-height: 300px;
  object-fit: contain;
  object-position: center;
}

.pit-map-inspector__figure--portrait img {
  aspect-ratio: 1 / 1;
  max-height: 340px;
}

.pit-map-inspector__figure figcaption {
  padding: 8px 12px;
  color: var(--ink-soft);
  font-size: 12px;
  line-height: 1.45;
}

.pit-map-inspector__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.pit-map-inspector__tags span {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(66, 102, 79, 0.1);
  color: var(--green);
  font-size: 12px;
  font-weight: 800;
}

.pit-map-inspector__guide {
  display: grid;
  gap: 4px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(184, 146, 67, 0.2);
  border-radius: 16px;
  background: rgba(184, 146, 67, 0.1);
  color: var(--green);
}

.pit-map-inspector__guide strong {
  font-size: 14px;
}

.pit-map-inspector__guide small {
  color: var(--ink-soft);
  line-height: 1.55;
}

.pit-map-inspector__artifacts {
  display: grid;
  gap: 10px;
  margin-top: auto;
  padding-top: 18px;
}

.pit-artifact-link {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--green);
  text-align: left;
}

.pit-artifact-link__thumb {
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: 12px;
  background: rgba(49, 88, 69, 0.08);
}

.pit-artifact-link__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.pit-artifact-link__copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.pit-artifact-link strong {
  font-size: 14px;
  line-height: 1.35;
}

.pit-artifact-link small {
  color: var(--ink-soft);
  line-height: 1.35;
}

.pit-artifact-link--disabled {
  opacity: 0.72;
  cursor: default;
}

.panel-head,
.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel-head h2,
.section-head h2 {
  font-size: clamp(28px, 2.2vw, 38px);
}

.section-head h3 {
  font-size: 28px;
}

.panel-badge,
.section-badge,
.meta-chip,
.spotlight-site,
.artifact-badge,
.artifact-model {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.panel-badge,
.section-badge {
  min-height: 38px;
  padding: 0 14px;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.82);
}

.filter-group {
  margin-top: 22px;
}

.filter-zone {
  margin-top: 24px;
  padding: 18px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.58);
}

.filter-zone__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 4px;
}

.filter-zone__head h3 {
  margin: 0;
  color: var(--ink);
  font-size: 19px;
}

.filter-zone__head span {
  flex: 0 0 auto;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(49, 88, 69, 0.12);
  color: var(--green);
  font-size: 12px;
  font-weight: 900;
}

.filter-zone .filter-group:first-of-type {
  margin-top: 14px;
}

.guide-clue-panel {
  margin-top: 22px;
  padding-bottom: 16px;
  border-radius: 22px;
  background: rgba(250, 247, 239, 0.72);
}

.guide-clue-head span {
  flex: 0 0 auto;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(184, 146, 67, 0.12);
  color: #81601f;
  font-size: 12px;
  font-weight: 800;
}

.guide-clue-group {
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 12px;
  align-items: start;
  padding: 0 18px 12px;
}

.guide-clue-group label {
  padding-top: 8px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 800;
}

.guide-clue-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.guide-clue-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 7px 10px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--green);
  white-space: nowrap;
}

.guide-clue-chip span {
  font-size: 13px;
  font-weight: 800;
}

.guide-clue-chip small {
  color: var(--ink-soft);
  font-size: 11px;
}

.guide-clue-chip.active {
  background: #315845;
  color: #f7f2e4;
  border-color: transparent;
}

.guide-clue-chip.active small {
  color: rgba(247, 242, 228, 0.82);
}

.guide-clue-chip--placeholder:not(.active) {
  background: rgba(241, 238, 226, 0.72);
  color: #5f6f60;
}

.guide-clue-chip--filterable:not(.active) {
  border-color: rgba(184, 146, 67, 0.28);
  background: rgba(255, 252, 242, 0.86);
}

.guide-clue-chip--filterable small {
  color: #8a6826;
}

.filter-group label {
  display: block;
  margin-bottom: 12px;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-pill {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 144px;
  padding: 12px 14px;
  border: 1px solid rgba(66, 102, 79, 0.14);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
  text-align: left;
}

.filter-pill span {
  font-size: 14px;
  font-weight: 700;
}

.filter-pill small {
  color: var(--ink-soft);
  font-size: 12px;
}

.filter-pill.active {
  background: linear-gradient(135deg, #4e765d, #29483a);
  color: #f7f2e4;
  border-color: transparent;
}

.filter-pill.active small {
  color: rgba(247, 242, 228, 0.84);
}

.meaning-focus {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(184, 146, 67, 0.12);
  color: var(--green);
}

.meaning-clear,
.mini-action,
.question-pill,
.guide-fold {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
  border: 1px solid rgba(66, 102, 79, 0.12);
}

.meaning-clear,
.mini-action,
.guide-fold {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
}

.filter-summary {
  margin: 20px 0 0;
  color: var(--ink-soft);
  font-size: 15px;
}

.panel-actions {
  margin-top: 22px;
}

.trail-main {
  display: grid;
  gap: 0;
}

.artifact-section,
.guide-section {
  padding: 28px;
  display: grid;
  gap: 18px;
}

.artifact-section {
  min-height: clamp(620px, calc(100vh - 240px), 780px);
  scroll-snap-align: start;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(251, 247, 238, 0.94)),
    radial-gradient(circle at 0% 0%, rgba(184, 146, 67, 0.08), transparent 22%);
}

.immersive-section {
  --stage-bg: #08110d;
  --panel-bg: rgba(16, 23, 19, 0.92);
  --panel-border: rgba(121, 196, 167, 0.15);
  --text-main: #f7f1e2;
  --text-muted: rgba(236, 244, 237, 0.8);
  --gold-soft: #f2d68c;
  display: grid;
  gap: 14px;
  min-height: clamp(660px, calc(100vh - 180px), 860px);
  padding: 24px;
  scroll-snap-align: start;
  border-radius: 28px;
  border: 1px solid rgba(121, 196, 167, 0.1);
  background:
    radial-gradient(circle at 100% 0%, rgba(182, 140, 52, 0.1), transparent 28%),
    linear-gradient(180deg, #07100c 0%, #0b1511 48%, #0a130f 100%);
  color: var(--text-main);
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.38);
}

.immersive-section .viewer-card,
.immersive-section .panel-card {
  border: 1px solid rgba(121, 196, 167, 0.12);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.025), rgba(255, 255, 255, 0.01)),
    rgba(16, 23, 19, 0.9);
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  color: #f4eddc;
}

.immersive-section .panel-card--hero {
  background:
    radial-gradient(circle at top right, rgba(217, 177, 90, 0.1), transparent 34%),
    rgba(16, 23, 19, 0.92);
}

.immersive-section .meta-chip {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
}

.immersive-section .meta-chip--highlight {
  background: rgba(223, 191, 114, 0.14);
  color: var(--gold-soft);
}

.immersive-section .panel-label {
  color: var(--gold-soft);
}

.immersive-section .panel-summary {
  color: var(--text-muted);
}

.immersive-section .fact-grid div {
  background: rgba(255, 255, 255, 0.04);
}

.immersive-section .fact-grid dt {
  color: var(--text-muted);
}

.immersive-section .fact-grid dd {
  color: var(--text-main);
}

.immersive-section .section-tag {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
}

.immersive-section .mini-action {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
}

.immersive-section .mini-action:hover {
  background: rgba(255, 255, 255, 0.12);
}

.immersive-section .type-filter {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
}

.immersive-section .type-filter.active {
  background: rgba(121, 196, 167, 0.22);
  color: #f4eddc;
}

.immersive-section .graph-lead {
  color: var(--text-muted);
}

.immersive-section .panel-card h2,
.immersive-section .panel-card .section-title {
  color: var(--text-main);
}

.immersive-section .insight-panel {
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.immersive-section .insight-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

.immersive-section .section-head {
  align-items: end;
}

.immersive-section .section-head h2 {
  font-size: clamp(24px, 2vw, 32px);
  line-height: 1.16;
  color: var(--text-main);
}

.immersive-section .section-kicker {
  color: var(--gold-soft);
}

.immersive-section .legend-item {
  color: var(--text-muted);
}

.immersive-section .narrative-card {
  background: rgba(255, 255, 255, 0.04);
}

.immersive-section .narrative-label {
  color: var(--gold-soft);
}

.immersive-section .narrative-card strong {
  color: var(--text-main);
}

.immersive-section .narrative-card p {
  color: var(--text-muted);
}

.immersive-section .linked-list span {
  color: var(--gold-soft);
}

.immersive-section .linked-list strong {
  color: var(--text-main);
}

.immersive-section .fact-grid dd {
  color: var(--text-main);
  font-weight: 600;
}

.immersive-section .fact-grid dt {
  color: var(--text-muted);
}

.immersive-section .graph-error {
  color: #b8705f;
}

.guide-section {
  min-height: clamp(620px, calc(100vh - 240px), 780px);
  scroll-snap-align: start;
  background:
    linear-gradient(180deg, rgba(250, 246, 238, 0.9), rgba(244, 240, 230, 0.94)),
    radial-gradient(circle at 100% 0%, rgba(184, 146, 67, 0.1), transparent 24%);
}

.stage-preview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  min-height: 44vh;
  padding: 26px 28px;
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(18, 31, 24, 0.9), rgba(34, 52, 43, 0.92)),
    radial-gradient(circle at 20% 10%, rgba(212, 189, 127, 0.16), transparent 24%);
  color: #f3ead0;
  box-shadow: 0 18px 34px rgba(24, 32, 27, 0.18);
}

.stage-preview__copy {
  max-width: 720px;
}

.stage-preview__copy h3 {
  margin: 8px 0 12px;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: clamp(30px, 2.8vw, 52px);
  line-height: 1.1;
  color: #fff8e5;
}

.stage-preview__copy p:last-child {
  margin: 0;
  color: rgba(255, 245, 217, 0.82);
  line-height: 1.85;
}

.stage-preview__actions {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.scene-context-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: -2px;
}

.scene-context-row--immersive {
  margin-top: 0;
}

.stage-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

.stage-overview--single {
  width: 100%;
  max-width: none;
  margin: 0;
}

.stage-overview__card {
  position: relative;
  overflow: hidden;
  min-height: 170px;
  padding: 28px 36px;
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(37, 61, 48, 0.96), rgba(12, 23, 17, 0.96)),
    radial-gradient(circle at 88% 16%, rgba(211, 171, 88, 0.2), transparent 34%);
  border: 1px solid rgba(206, 176, 102, 0.28);
  color: #f8f1dc;
  box-shadow:
    0 22px 46px rgba(0, 0, 0, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.stage-overview__card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(211, 171, 88, 0.16), transparent 42%),
    radial-gradient(circle at 8% 12%, rgba(121, 196, 167, 0.14), transparent 28%);
}

.stage-overview__card::after {
  content: '';
  position: absolute;
  top: 24px;
  bottom: 24px;
  left: 0;
  width: 5px;
  border-radius: 0 999px 999px 0;
  background: linear-gradient(180deg, #f2d68c, rgba(84, 132, 101, 0.86));
}

.stage-overview__card span {
  position: relative;
  display: block;
  margin-bottom: 12px;
  color: #f2d68c;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
}

.stage-overview__card strong {
  position: relative;
  display: block;
  margin-bottom: 14px;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: clamp(30px, 3vw, 46px);
  line-height: 1.16;
  color: #fff7df;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.28);
}

.stage-overview__card p {
  position: relative;
  max-width: 980px;
  margin: 0;
  color: rgba(244, 237, 220, 0.9);
  font-size: 16px;
  line-height: 1.8;
}

.scene-context-row__label {
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 700;
}

.scene-context-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--green);
  font-size: 13px;
  font-weight: 700;
}

.scene-context-chip--dark {
  background: rgba(255, 255, 255, 0.16);
  color: #f5e8c1;
}

.featured-spotlight {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 22px;
  margin-top: 20px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
}

.spotlight-visual {
  position: relative;
}

.spotlight-visual img,
.artifact-image-wrap img,
.artifact-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 22px;
}

.spotlight-site {
  position: absolute;
  left: 14px;
  top: 14px;
  min-height: 32px;
  padding: 0 12px;
  background: rgba(12, 27, 20, 0.74);
  color: #f8f3e7;
}

.spotlight-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.spotlight-copy h3 {
  font-size: clamp(34px, 3.2vw, 52px);
}

.spotlight-era,
.artifact-site,
.artifact-time {
  color: var(--gold);
  font-size: 15px;
  font-weight: 700;
}

.spotlight-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0 22px;
}

.spotlight-tags span {
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(66, 102, 79, 0.08);
  color: var(--green);
  font-size: 13px;
  font-weight: 700;
}

.status-state {
  margin-top: 22px;
  padding: 18px 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--ink-soft);
}

.status-state--error {
  background: rgba(167, 93, 78, 0.12);
  color: #7d4036;
}

.artifact-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.artifact-card {
  padding: 14px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid transparent;
  cursor: pointer;
}

.artifact-card--active {
  border-color: rgba(66, 102, 79, 0.24);
  box-shadow: inset 0 0 0 1px rgba(66, 102, 79, 0.08);
}

.artifact-image-wrap {
  position: relative;
  aspect-ratio: 1.12 / 1;
}

.artifact-badge,
.artifact-model {
  position: absolute;
  min-height: 30px;
  padding: 0 12px;
}

.artifact-badge {
  left: 12px;
  top: 12px;
  background: rgba(12, 27, 20, 0.72);
  color: #f6f0de;
}

.artifact-model {
  right: 12px;
  bottom: 12px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--green);
}

.artifact-content {
  padding: 14px 8px 6px;
}

.artifact-content h3 {
  margin: 8px 0;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: 30px;
  line-height: 1.12;
}

.immersive-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
  gap: 18px;
  align-items: stretch;
  height: clamp(540px, calc(100vh - 330px), 660px);
  min-height: 0;
}

.viewer-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  padding: 20px;
  border-radius: 28px;
  overflow: hidden;
}

.insight-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  height: 100%;
  max-height: none;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(41, 72, 58, 0.18) transparent;
  padding-right: 8px;
}

.insight-panel::-webkit-scrollbar {
  width: 8px;
}

.insight-panel::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(41, 72, 58, 0.18);
}

.insight-panel::-webkit-scrollbar-track {
  background: transparent;
}

.panel-card {
  padding: 20px;
  border-radius: 28px;
}

.graph-panel {
  position: relative;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto auto auto minmax(340px, 340px) auto;
  gap: 12px;
  overflow: hidden;
}

.graph-panel:not(.graph-panel--fullscreen) {
  min-height: 680px;
}

.graph-panel:not(.graph-panel--fullscreen) .graph-panel__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 10px;
}

.graph-panel:not(.graph-panel--fullscreen) .section-actions {
  justify-content: flex-start;
  min-width: 0;
}

.graph-panel:not(.graph-panel--fullscreen) .section-tag,
.graph-panel:not(.graph-panel--fullscreen) .mini-action {
  flex: 0 0 auto;
}

.graph-panel > * {
  position: relative;
  z-index: 1;
}

.graph-panel--fullscreen {
  position: fixed;
  inset: 18px;
  z-index: 1190;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  gap: 14px;
  padding-top: 72px;
  width: auto;
  height: auto;
  max-height: none;
  overflow: hidden;
  border: 1px solid rgba(216, 184, 109, 0.34);
  border-radius: 28px;
  background:
    radial-gradient(circle at 80% 10%, rgba(216, 184, 109, 0.12), transparent 32%),
    linear-gradient(180deg, rgba(12, 22, 18, 0.98), rgba(8, 15, 12, 0.98));
  box-shadow:
    0 36px 90px rgba(0, 0, 0, 0.58),
    0 0 0 9999px rgba(2, 8, 6, 0.72);
}

.graph-panel--fullscreen .graph-panel__toolbar {
  position: absolute;
  top: 18px;
  left: 22px;
  right: 22px;
  z-index: 8;
  min-height: 42px;
  padding: 0;
  gap: 16px;
}

.graph-panel--fullscreen .section-head {
  align-items: center;
}

.graph-panel--fullscreen .section-actions {
  flex-wrap: nowrap;
  justify-content: flex-end;
}

.graph-panel--fullscreen .graph-stage {
  position: relative;
  min-height: 0;
  height: 100%;
}

.graph-panel--fullscreen .graph-canvas {
  min-height: 0;
  height: 100%;
}

.panel-card--hero {
  background:
    radial-gradient(circle at top right, rgba(217, 177, 90, 0.1), transparent 34%),
    var(--paper-soft);
}

.panel-label {
  margin: 0 0 6px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.panel-summary {
  margin: 12px 0 0;
  color: var(--ink-soft);
  line-height: 1.72;
}

.panel-card h2,
.panel-card .section-title {
  margin: 0;
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: 24px;
  line-height: 1.15;
}

.panel-card h3.section-title {
  font-size: 20px;
}

.fact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0 0;
}

.fact-grid div {
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(205, 178, 130, 0.08);
}

.fact-grid dt {
  color: var(--ink-soft);
  font-size: 12px;
}

.fact-grid dd {
  margin: 6px 0 0;
  font-weight: 600;
  font-size: 14px;
}

.section-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.section-tag {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(66, 102, 79, 0.08);
  color: var(--green);
  font-size: 12px;
}

.mini-action {
  padding: 7px 12px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
  font-size: 12px;
  cursor: pointer;
}

.mini-action:hover {
  background: rgba(66, 102, 79, 0.06);
}

.viewer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}

.meta-chip {
  min-height: 34px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
}

.meta-chip--highlight {
  background: rgba(184, 146, 67, 0.16);
  color: #7a5a17;
}

.viewer-shell {
  position: relative;
  min-height: 0;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 20%, rgba(98, 148, 126, 0.14), transparent 32%),
    linear-gradient(180deg, #08110d 0%, #0a140f 100%);
}

.viewer-shell--fullscreen {
  position: fixed;
  inset: 18px;
  z-index: 1200;
  width: auto;
  height: auto;
  min-height: 0;
  border: 1px solid rgba(216, 184, 109, 0.34);
  border-radius: 28px;
  box-shadow:
    0 36px 90px rgba(0, 0, 0, 0.58),
    0 0 0 9999px rgba(2, 8, 6, 0.72);
}

.viewer-shell canvas,
.artifact-fallback {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.viewer-fullscreen-button {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 5;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid rgba(216, 184, 109, 0.28);
  border-radius: 999px;
  color: #f7f2e4;
  background: rgba(12, 22, 18, 0.72);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.24);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  backdrop-filter: blur(12px);
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.viewer-fullscreen-button:hover {
  transform: translateY(-1px);
  border-color: rgba(216, 184, 109, 0.52);
  background: rgba(37, 62, 49, 0.86);
}

.viewer-shell--fullscreen .viewer-fullscreen-button {
  top: 24px;
  right: 24px;
}

.fullscreen-return-hint {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 0 15px;
  border: 1px solid rgba(216, 184, 109, 0.3);
  border-radius: 999px;
  color: #f7f2e4;
  background: rgba(12, 22, 18, 0.76);
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.24);
  font-size: 13px;
  font-weight: 800;
  backdrop-filter: blur(12px);
  pointer-events: none;
}

.fullscreen-return-hint span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid rgba(247, 242, 228, 0.28);
  border-radius: 8px;
  background: rgba(247, 242, 228, 0.12);
  color: #ffe5a3;
  font-size: 12px;
  line-height: 1;
}

.fullscreen-return-hint--graph {
  left: 50%;
  transform: translateX(-50%);
}

.viewer-caption {
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.viewer-caption span {
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(12, 22, 18, 0.62);
  color: rgba(240, 246, 239, 0.82);
  font-size: 12px;
}

.viewer-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 17, 13, 0.72);
  color: #f3eddc;
}

.mask-box {
  width: min(340px, calc(100% - 48px));
  text-align: center;
}

.progress-bar {
  height: 10px;
  margin: 14px 0 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #d8b86d, #79c4a7);
}

.viewer-mask--error {
  padding: 28px;
  text-align: center;
}

.error-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.retry-button {
  margin-top: 14px;
  padding: 8px 20px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f7f2e4;
  cursor: pointer;
}

.retry-button:hover {
  background: rgba(255, 255, 255, 0.16);
}

.viewer-glow {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  filter: blur(24px);
  pointer-events: none;
}

.viewer-glow--left {
  left: -30px;
  bottom: -30px;
  background: radial-gradient(circle, rgba(223, 191, 114, 0.26), transparent 64%);
}

.viewer-glow--right {
  right: -40px;
  top: 8%;
  background: radial-gradient(circle, rgba(78, 135, 114, 0.22), transparent 64%);
}

.graph-lead {
  display: -webkit-box;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid rgba(121, 196, 167, 0.1);
  border-radius: 14px;
  background: rgba(5, 13, 10, 0.72);
  color: var(--ink-soft);
  line-height: 1.6;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.graph-panel--fullscreen .graph-lead {
  display: block;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  overflow: visible;
  -webkit-line-clamp: unset;
}

.type-filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-content: flex-start;
  gap: 8px;
  margin-bottom: 0;
}

.type-filter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 32px;
  padding: 0 11px;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--green);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.type-filter.active {
  background: linear-gradient(135deg, #4e765d, #29483a);
  color: #f7f2e4;
  border-color: transparent;
}

.type-filter strong {
  font-size: 12px;
  line-height: 1;
}

.graph-panel--fullscreen .type-filter-row {
  max-height: 72px;
  margin: 0 0 8px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(216, 184, 109, 0.28) transparent;
}

.graph-panel--fullscreen .type-filter {
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

.graph-panel--fullscreen .type-filter strong {
  font-size: 12px;
}

.graph-filter-hint {
  display: -webkit-box;
  margin: -2px 0 0;
  color: rgba(244, 237, 220, 0.62);
  font-size: 12px;
  line-height: 1.5;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.graph-panel--fullscreen .graph-filter-hint {
  display: block;
  overflow: visible;
  -webkit-line-clamp: unset;
}

.graph-stage {
  position: relative;
  flex: 0 0 340px;
  min-height: 340px;
  height: 340px;
  border-radius: 22px;
  background:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(180deg, #0b1411 0%, #0f1915 100%);
  background-size: 40px 40px, 40px 40px, auto;
  overflow: hidden;
  z-index: 2;
}

.graph-stage--loading::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 50% 45%, rgba(121, 196, 167, 0.08), transparent 42%);
}

.graph-loading-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 4;
  padding: 8px 12px;
  border: 1px solid rgba(216, 184, 109, 0.24);
  border-radius: 999px;
  background: rgba(10, 20, 15, 0.78);
  color: #f2ead4;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(10px);
}

.graph-canvas {
  width: 100%;
  height: 340px;
  min-height: 340px;
}

.graph-panel--fullscreen .graph-stage {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.graph-panel--fullscreen .graph-canvas {
  min-height: 0;
  height: 100%;
}

.graph-error {
  margin: 0;
  padding: 14px 18px;
  color: #b8705f;
}

.graph-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(66, 102, 79, 0.06);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ink-soft);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot--core { background: #79c4a7; }
.legend-dot--site { background: #d8b86d; }
.legend-dot--craft { background: rgba(205, 178, 130, 0.75); }
.legend-dot--artifact { background: rgba(255, 255, 255, 0.45); }

.narrative-grid {
  display: grid;
  gap: 14px;
  margin-top: 14px;
}

.narrative-card {
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(205, 178, 130, 0.06);
}

.narrative-label {
  margin: 0 0 6px;
  color: var(--gold);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.narrative-card strong {
  display: block;
  font-size: 15px;
  margin-bottom: 6px;
}

.narrative-card p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.6;
}

.linked-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.linked-list li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: baseline;
}

.linked-list span {
  color: var(--gold);
  font-size: 12px;
}

.linked-list strong {
  font-size: 14px;
  margin-bottom: 0;
}

.narrative-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.narrative-button {
  display: inline-flex;
  align-items: center;
  min-height: 42px;
  margin-top: 0;
  padding: 0 18px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--green), var(--green-deep));
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.narrative-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.narrative-button:hover:not(:disabled) {
  box-shadow: 0 8px 20px rgba(66, 102, 79, 0.22);
}

.narrative-button--secondary {
  background: rgba(66, 102, 79, 0.1);
  color: var(--green-deep);
  box-shadow: none;
}

.narrative-button--secondary:hover:not(:disabled) {
  background: rgba(66, 102, 79, 0.16);
  box-shadow: 0 8px 18px rgba(41, 72, 58, 0.12);
}

.guide-preview,
.guide-shell {
  margin-top: 18px;
}

.guide-preview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.72fr);
  gap: 18px;
  padding: 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.76);
}

.guide-preview__copy,
.guide-context,
.guide-chat {
  padding: 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.76);
}

.guide-preview__line {
  margin-top: 18px;
  padding-left: 16px;
  border-left: 3px solid rgba(184, 146, 67, 0.42);
  color: var(--green);
}

.guide-preview__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}

.guide-shell {
  display: grid;
  grid-template-columns: minmax(300px, 0.82fr) minmax(0, 1.18fr);
  align-items: stretch;
  gap: 18px;
}

.guide-avatar {
  width: 104px;
  height: 104px;
  margin-bottom: 16px;
}

.guide-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guide-artifact-visual {
  position: relative;
  width: min(100%, 310px);
  aspect-ratio: 16 / 10;
  min-height: 0;
  margin-bottom: 14px;
  overflow: hidden;
  border: 1px solid rgba(66, 102, 79, 0.12);
  border-radius: 18px;
  background: rgba(241, 237, 225, 0.72);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.34);
}

.guide-artifact-visual--preview {
  width: min(100%, 340px);
  aspect-ratio: 16 / 10;
}

.guide-artifact-visual > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guide-artifact-visual__shade {
  position: absolute;
  inset: auto 0 0;
  height: 58%;
  background: linear-gradient(180deg, rgba(20, 38, 31, 0), rgba(20, 38, 31, 0.74));
  pointer-events: none;
}

.guide-artifact-visual__meta {
  position: absolute;
  left: 14px;
  right: 58px;
  bottom: 12px;
  display: grid;
  gap: 2px;
  color: #fff8e8;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.22);
}

.guide-artifact-visual__meta span {
  font-size: 11px;
  font-weight: 800;
  opacity: 0.78;
}

.guide-artifact-visual__meta strong {
  font-size: 15px;
  line-height: 1.25;
}

.guide-artifact-visual__action {
  position: absolute;
  top: 12px;
  right: 12px;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(255, 248, 232, 0.42);
  border-radius: 999px;
  color: #fff8e8;
  background: rgba(36, 61, 49, 0.72);
  font: inherit;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.guide-artifact-visual__xuanmiao {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 38px;
  height: 38px;
  overflow: hidden;
  border: 2px solid rgba(255, 248, 232, 0.78);
  border-radius: 50%;
  background: #f7efe3;
  box-shadow: 0 10px 22px rgba(10, 24, 18, 0.28);
}

.guide-artifact-visual__xuanmiao img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guide-facts {
  display: grid;
  gap: 10px;
  margin: 14px 0;
}

.guide-facts div {
  padding: 11px 14px;
  border-radius: 14px;
  background: rgba(66, 102, 79, 0.06);
}

.guide-facts dt {
  margin-bottom: 4px;
  color: var(--ink-soft);
  font-size: 12px;
}

.guide-facts dd {
  margin: 0;
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-questions--chat {
  width: min(620px, 100%);
  margin: 4px 0 0 56px;
  padding: 10px 0 0;
  border-top: 1px solid rgba(66, 102, 79, 0.08);
}

.question-pill {
  padding: 9px 12px;
  font-size: 12px;
  font-weight: 700;
}

.guide-chat {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto auto;
  gap: 16px;
  height: min(620px, calc(100vh - 260px));
  min-height: 460px;
  max-height: calc(100vh - 180px);
  overflow: hidden;
}

.message-scroll {
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 14px;
  padding-right: 8px;
  scrollbar-gutter: stable;
}

.message-row {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}

.message-row--user {
  justify-content: flex-end;
}

.message-row--guide {
  justify-content: center;
}

.message-row--guide .message-stack {
  width: min(560px, 92%);
  max-width: none;
}

.message-row--guide .message-bubble {
  border: 1px solid rgba(184, 146, 67, 0.22);
  background:
    linear-gradient(135deg, rgba(255, 251, 239, 0.88), rgba(235, 244, 238, 0.78));
  color: rgba(29, 52, 43, 0.78);
}

.message-guide-label {
  display: inline-flex;
  margin-bottom: 6px;
  color: var(--gold);
  font-size: 12px;
  font-weight: 800;
}

.message-row--user .message-stack {
  margin-left: 0;
  align-items: flex-end;
}

.message-avatar {
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  overflow: hidden;
  border-radius: 50%;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-avatar--user {
  display: grid;
  place-items: center;
  color: #f7f2e4;
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(135deg, #caa35c, #42664f);
  box-shadow: 0 10px 24px rgba(41, 72, 58, 0.16);
}

.message-stack {
  display: flex;
  flex-direction: column;
  max-width: min(700px, calc(100% - 56px));
  text-align: left;
}

.message-bubble {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(66, 102, 79, 0.08);
}

.message-row--user .message-bubble {
  background: linear-gradient(135deg, #4e765d, #29483a);
  color: #f7f2e4;
}

.message-row--user .message-stack time {
  text-align: right;
}

.message-stack time {
  display: block;
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 12px;
}

.trail-loop-nudge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 10px 14px;
  border: 1px solid rgba(66, 102, 79, 0.14);
  border-radius: 14px;
  background: rgba(255, 251, 239, 0.72);
  box-shadow: 0 10px 22px rgba(43, 59, 46, 0.08);
}

.trail-loop-nudge div {
  min-width: 0;
  flex: 1;
}

.trail-loop-nudge strong,
.trail-loop-nudge span {
  display: block;
}

.trail-loop-nudge strong {
  color: var(--green-deep);
  font-size: 13px;
  font-weight: 800;
}

.trail-loop-nudge span {
  margin-top: 2px;
  color: rgba(29, 52, 43, 0.58);
  font-size: 12px;
  line-height: 1.45;
}

.trail-loop-nudge-action,
.trail-loop-nudge-close {
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
}

.trail-loop-nudge-action {
  min-height: 32px;
  padding: 0 12px;
  color: #f8f2df;
  background: var(--green);
}

.trail-loop-nudge-close {
  padding: 0 4px;
  color: var(--green);
  background: transparent;
}

.trail-next-card {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 16px 18px;
  border: 1px solid rgba(184, 146, 67, 0.32);
  border-radius: 18px;
  background:
    radial-gradient(circle at 0% 0%, rgba(216, 184, 109, 0.2), transparent 32%),
    linear-gradient(135deg, rgba(255, 251, 239, 0.98), rgba(235, 244, 238, 0.96));
  box-shadow: 0 18px 38px rgba(43, 59, 46, 0.12);
}

.trail-next-mark {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  color: #f8f2df;
  background: linear-gradient(135deg, #d0a757, #4e765d);
  border-radius: 14px;
  box-shadow: 0 12px 24px rgba(184, 146, 67, 0.18);
}

.trail-next-copy {
  min-width: 0;
}

.trail-next-kicker,
.trail-next-copy h4,
.trail-next-copy p,
.trail-next-copy span {
  margin: 0;
}

.trail-next-kicker {
  color: var(--gold);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.trail-next-copy h4 {
  margin-top: 3px;
  color: var(--ink);
  font-family: 'STZhongsong', 'Noto Serif SC', serif;
  font-size: 20px;
  line-height: 1.25;
}

.trail-next-copy p {
  margin-top: 6px;
  color: var(--green-deep);
  font-size: 14px;
  font-weight: 700;
}

.trail-next-copy span {
  display: block;
  margin-top: 4px;
  color: rgba(29, 52, 43, 0.64);
  font-size: 12px;
}

.trail-next-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  min-width: 226px;
}

.trail-next-primary,
.trail-next-secondary,
.trail-next-close {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.trail-next-primary,
.trail-next-secondary--route {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.trail-next-primary {
  color: #f8f2df;
  background: linear-gradient(135deg, #4e765d, #29483a);
  box-shadow: 0 12px 22px rgba(41, 72, 58, 0.16);
}

.trail-next-secondary--route {
  color: var(--green-deep);
  background: rgba(66, 102, 79, 0.1);
}

.trail-next-secondary {
  color: var(--green);
  background: transparent;
  font-size: 12px;
  font-weight: 700;
}

.trail-next-close {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: rgba(29, 52, 43, 0.62);
  background: rgba(255, 255, 255, 0.64);
  font-size: 18px;
  line-height: 1;
}

.trail-next-close:hover {
  color: var(--ink);
  background: rgba(255, 255, 255, 0.92);
}

.thinking-bubble {
  display: inline-flex;
  gap: 8px;
}

.thinking-bubble span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(41, 72, 58, 0.4);
  animation: pulse 1s infinite ease-in-out;
}

.thinking-bubble span:nth-child(2) {
  animation-delay: 0.18s;
}

.thinking-bubble span:nth-child(3) {
  animation-delay: 0.36s;
}

.composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: stretch;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(184, 146, 67, 0.22);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 253, 248, 0.94), rgba(247, 243, 233, 0.88));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 14px 34px rgba(43, 59, 46, 0.08);
}

.composer textarea {
  width: 100%;
  min-height: 72px;
  max-height: 150px;
  padding: 14px 16px;
  border: 1px solid rgba(66, 102, 79, 0.14);
  border-radius: 18px;
  resize: none;
  font: inherit;
  color: var(--ink);
  line-height: 1.65;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.composer textarea:focus {
  outline: none;
  border-color: rgba(66, 102, 79, 0.34);
  background: rgba(255, 255, 255, 0.96);
}

.composer-send {
  width: 112px;
  min-height: 72px;
  border: 0;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #f8f2df;
  background: linear-gradient(135deg, #4e765d 0%, #29483a 100%);
  box-shadow: 0 12px 24px rgba(41, 72, 58, 0.18);
  cursor: pointer;
  font: inherit;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.04em;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.composer-send:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px rgba(41, 72, 58, 0.22);
}

.composer-send:disabled {
  cursor: not-allowed;
  opacity: 0.48;
  box-shadow: none;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    transform: scale(0.8);
    opacity: 0.42;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 1180px) {
  .trail-nav,
  .trail-hero,
  .trail-stagebar,
  .stage-preview,
  .stage-overview,
  .guide-preview,
  .guide-shell,
  .immersive-grid,
  .narrative-grid,
  .featured-spotlight {
    grid-template-columns: 1fr;
  }

  .artifact-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .trail-stagebar {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .trail-hero::before {
    display: none;
  }

  .trail-hero::after {
    display: none;
  }

  .hero-board {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .trail-stagebar__stats {
    justify-content: flex-start;
  }

  .viewer-card,
  .insight-panel .panel-card {
    height: auto;
  }

  .immersive-grid {
    height: auto;
    min-height: 0;
    align-items: start;
  }

  .viewer-shell {
    min-height: 460px;
  }

  .insight-panel {
    height: auto;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .graph-stage {
    flex: none;
  }

  .graph-canvas {
    height: 340px;
  }
}

@media (max-width: 760px) {
  .time-space-trail {
    --voice-guide-top: 70px;
    --voice-guide-space: 140px;
    padding: var(--voice-guide-space) 14px 44px;
  }

  .trail-nav,
  .trail-hero,
  .trail-progress-card,
  .trail-stagebar,
  .trail-shell,
  .voice-guide-panel {
    width: 100%;
  }

  .voice-guide-panel {
    position: fixed;
    top: var(--voice-guide-top);
    left: 12px;
    right: 12px;
    width: auto;
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px;
    transform: none;
  }

  .voice-guide-hover-zone {
    top: 48px;
    left: 12px;
    right: 12px;
  }

  .voice-guide-panel__mark {
    width: 42px;
    height: 42px;
  }

  .voice-guide-panel__actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .trail-command-overlay {
    top: calc(var(--voice-guide-top) + 156px);
    width: calc(100vw - 24px);
  }

  .trail-command-overlay__panel {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 14px;
  }

  .trail-command-overlay__mark {
    display: none;
  }

  .trail-command-overlay__copy h2 {
    font-size: 18px;
  }

  .trail-command-overlay__steps {
    grid-template-columns: 1fr;
  }

  .trail-step-back {
    top: calc(var(--voice-guide-top) + 164px);
    left: 14px;
    min-height: 36px;
    padding: 0 12px;
    font-size: 12px;
  }

  .trail-hero {
    padding: 16px;
    gap: 10px;
  }

  .hero-copy {
    padding: 18px 4px 10px;
  }

  .hero-copy h1 {
    font-size: 32px;
  }

  .hero-subtitle {
    font-size: 14px;
  }

  .hero-board {
    grid-template-columns: 1fr;
    padding: 10px;
    border-radius: 18px;
  }

  .board-card {
    padding: 14px 16px;
    border-radius: 14px;
  }

  .board-card strong {
    font-size: 30px;
  }

  .stage-overview--single {
    max-width: none;
  }

  .stage-overview__card {
    min-height: 0;
    padding: 22px 18px 22px 22px;
    border-radius: 20px;
  }

  .stage-overview__card strong {
    font-size: 28px;
  }

  .stage-overview__card p {
    font-size: 14px;
  }

  .trail-nav {
    grid-template-columns: 1fr 1fr;
  }

  .trail-progress-card {
    margin-top: -8px;
    padding: 12px;
    border-radius: 18px;
  }

  .trail-progress-card__steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pit-map-layout {
    --pit-map-panel-height: auto;
    grid-template-columns: 1fr;
  }

  .pit-map-card,
  .pit-map-inspector {
    height: auto;
    max-height: none;
  }

  .pit-map-inspector {
    overflow: visible;
    padding-right: 20px;
    scrollbar-gutter: auto;
  }

  .pit-map-card__head,
  .guide-clue-head {
    flex-direction: column;
  }

  .pit-map-scroll {
    margin: 0 -4px;
    padding: 0 4px 14px;
  }

  .pit-map-stage {
    min-width: 760px;
  }

  .guide-clue-group {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .guide-clue-group label {
    padding-top: 0;
  }

  .composer {
    grid-template-columns: 1fr;
  }

  .composer-send {
    width: 100%;
    min-height: 50px;
  }

  .trail-loop-nudge {
    align-items: stretch;
    flex-direction: column;
  }

  .trail-loop-nudge-action,
  .trail-loop-nudge-close {
    width: 100%;
    min-height: 34px;
  }

  .trail-next-card {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .trail-next-mark {
    display: none;
  }

  .trail-next-actions {
    justify-content: stretch;
    min-width: 0;
  }

  .trail-next-primary,
  .trail-next-secondary--route {
    width: 100%;
  }

  .scene-context-row {
    align-items: flex-start;
  }

  .filter-panel,
  .artifact-section,
  .immersive-section,
  .guide-section,
  .stage-preview,
  .viewer-card,
  .insight-panel .panel-card,
  .guide-preview__copy,
  .guide-context,
  .guide-chat {
    padding: 22px 18px;
    border-radius: 22px;
  }

  .guide-artifact-visual,
  .guide-artifact-visual--preview {
    width: min(100%, 290px);
    aspect-ratio: 16 / 10;
  }

  .guide-artifact-visual__meta {
    right: 64px;
  }

  .guide-artifact-visual__meta strong {
    font-size: 16px;
  }

  .quick-questions--chat {
    width: 100%;
    margin-left: 0;
  }

  .hero-copy h1 {
    font-size: 42px;
  }

  .trail-stagebar {
    gap: 12px;
    padding: 6px 0 2px;
  }

  .trail-stagebar__copy h1 {
    font-size: 26px;
  }

  .trail-stagebar__line {
    margin-top: 8px;
    font-size: 14px;
  }

  .trail-stagebar__stats {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .trail-stagebar__stat {
    min-width: 0;
    padding: 10px 12px;
  }

  .trail-stagebar__stat strong {
    font-size: 22px;
  }

  .featured-spotlight {
    padding: 0;
    background: transparent;
  }

  .viewer-shell,
  .viewer-shell canvas,
  .artifact-fallback,
  .graph-canvas {
    min-height: 360px;
    height: 360px;
  }

  .viewer-shell--fullscreen {
    inset: 10px;
    height: auto;
    min-height: 0;
    border-radius: 22px;
  }

  .viewer-shell--fullscreen canvas,
  .viewer-shell--fullscreen .artifact-fallback {
    height: 100%;
    min-height: 0;
  }

  .graph-panel--fullscreen {
    inset: 10px;
    border-radius: 22px;
    padding: 64px 16px 16px;
  }

  .graph-panel--fullscreen .graph-panel__toolbar {
    top: 14px;
    left: 16px;
    right: 16px;
  }

  .graph-panel--fullscreen .section-actions {
    flex-wrap: wrap;
  }

  .insight-panel {
    padding-right: 6px;
  }

  .artifact-grid {
    grid-template-columns: 1fr;
  }
}
</style>
