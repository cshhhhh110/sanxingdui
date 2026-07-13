<template>
  <div class="archaeology-container">
    <!-- 全景查看器 -->
    <div id="panorama-viewer" ref="viewerContainer"></div>

    <!-- 加载提示 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>正在加载全景场景...</p>
      </div>
    </div>

    <!-- 顶部工具栏 -->
    <header class="top-toolbar">
      <button @click="goBack" class="back-btn">
        <i class="fas fa-arrow-left"></i> 返回
      </button>
      <button @click="exitPanorama" class="exit-btn">
        <i class="fas fa-times-circle"></i> 退出全景
      </button>
      <button @click="showMap = true" class="toolbar-btn">
        <i class="fas fa-map"></i> 遗址地图
      </button>
      <button @click="showNotes = true" class="toolbar-btn">
        <i class="fas fa-book"></i> 考古笔记
      </button>
      <div class="progress-indicator">
        <i class="fas fa-compass"></i>
        探索进度: {{ store.visitedScenes.length }}/8
      </div>
    </header>

    <!-- 场景信息面板 -->
    <aside class="scene-info-panel" :class="{collapsed: panelCollapsed}">
      <button class="collapse-btn" @click="panelCollapsed = !panelCollapsed">
        <i :class="panelCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
      </button>

      <div class="panel-content" v-if="!panelCollapsed">
        <h2>{{ currentScene.name }}</h2>
        <p class="scene-name-en">{{ currentScene.nameEn }}</p>
        <p class="scene-description">{{ currentScene.description }}</p>

        <div class="hotspots-list" v-if="remainingHotspots.length > 0">
          <h3>
            <i class="fas fa-map-marker-alt"></i>
            待探索热点 ({{ remainingHotspots.length }})
          </h3>
          <ul>
            <li v-for="hotspot in remainingHotspots" :key="hotspot.id" @click="focusHotspot(hotspot)">
              <span class="hotspot-icon">{{ hotspot.icon }}</span>
              <span class="hotspot-title">{{ hotspot.title }}</span>
            </li>
          </ul>
        </div>

        <div class="scene-completed" v-else>
          <i class="fas fa-check-circle"></i>
          <p>已完成本场景所有探索！</p>
          <button v-if="nextScene" @click="switchToNextScene" class="next-scene-btn">
            前往下一场景 →
          </button>
        </div>
      </div>
    </aside>

    <!-- 热点信息卡片 -->
    <transition name="slide-left">
      <div v-if="activeHotspot" class="hotspot-card">
        <button class="close-btn" @click="closeHotspot">×</button>

        <!-- 媒体区 -->
        <div class="hotspot-media" v-if="activeHotspot.image || activeHotspot.video">
          <img v-if="activeHotspot.image" :src="activeHotspot.image" :alt="activeHotspot.title" />
          <video v-if="activeHotspot.video" :src="activeHotspot.video" controls></video>
        </div>

        <!-- 内容区 -->
        <div class="hotspot-content">
          <div class="hotspot-header">
            <span class="hotspot-type-icon">{{ activeHotspot.icon }}</span>
            <h3>{{ activeHotspot.title }}</h3>
          </div>

          <p class="hotspot-description">{{ activeHotspot.description }}</p>

          <!-- AI评论 -->
          <div v-if="activeHotspot.aiComment" class="ai-comment">
            <img :src="xuanmiaoAvatar" class="ai-avatar" />
            <div class="comment-bubble">
              <p>{{ activeHotspot.aiComment }}</p>
            </div>
          </div>

          <!-- 时间轴 -->
          <div v-if="activeHotspot.timeline" class="timeline">
            <h4>发现历程</h4>
            <div v-for="event in activeHotspot.timeline" :key="event.time" class="timeline-item">
              <span class="time">{{ event.time }}</span>
              <span class="event">{{ event.event }}</span>
            </div>
          </div>

          <!-- 文物清单 -->
          <div v-if="activeHotspot.inventory" class="inventory-list">
            <h4>出土文物</h4>
            <ul>
              <li v-for="item in activeHotspot.inventory" :key="item">{{ item }}</li>
            </ul>
          </div>

          <!-- 谜题 -->
          <div v-if="activeHotspot.mystery" class="mystery-box">
            <i class="fas fa-question-circle"></i>
            <p>{{ activeHotspot.mystery }}</p>
          </div>

          <!-- 操作按钮 -->
          <div class="hotspot-actions" v-if="activeHotspot.actions">
            <button
              v-for="action in activeHotspot.actions"
              :key="action.label"
              @click="handleAction(action)"
              class="action-btn"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- AI导览助手 -->
    <div class="ai-guide" :class="{speaking: aiSpeaking}">
      <img :src="xuanmiaoAvatar" class="guide-avatar" @click="toggleAIGuide" />
      <transition name="fade">
        <div v-if="aiMessage" class="guide-bubble">
          {{ aiMessage }}
        </div>
      </transition>
    </div>

    <!-- 遗址地图浮层 -->
    <transition name="fade">
      <div v-if="showMap" class="map-overlay" @click="showMap = false">
        <div class="map-panel" @click.stop>
          <button class="modal-close" @click="showMap = false">×</button>
          <h2>三星堆遗址全景地图</h2>
          <p class="map-description">点击场景标记可以直接跳转（需先解锁）</p>

          <svg class="site-map-svg" viewBox="0 0 800 600">
            <!-- 背景地图图片 -->
            <!-- <image href="/images/archaeology/site-aerial-map.jpg" x="0" y="0" width="800" height="600" opacity="0.3" /> -->
            <rect x="0" y="0" width="800" height="600" fill="rgba(26, 31, 25, 0.5)" />

            <!-- 场景连线 -->
            <g class="connections">
              <line
                v-for="conn in sceneConnections"
                :key="`${conn.from}-${conn.to}`"
                :x1="getSceneById(conn.from).mapX"
                :y1="getSceneById(conn.from).mapY"
                :x2="getSceneById(conn.to).mapX"
                :y2="getSceneById(conn.to).mapY"
                stroke="#d6b35f"
                stroke-width="2"
                stroke-dasharray="5,5"
                opacity="0.5"
              />
            </g>

            <!-- 场景标记点 -->
            <g v-for="scene in scenes" :key="scene.id" class="scene-marker-group">
              <circle
                :cx="scene.mapX"
                :cy="scene.mapY"
                r="30"
                :class="[
                  'scene-marker',
                  {
                    current: currentScene.id === scene.id,
                    visited: store.getSceneStatus(scene.id),
                    locked: !scene.unlocked
                  }
                ]"
                @click="handleSceneClick(scene)"
              />

              <!-- 场景编号 -->
              <text
                :x="scene.mapX"
                :y="scene.mapY + 5"
                class="scene-number"
                text-anchor="middle"
              >
                {{ scene.unlocked ? scene.id : '🔒' }}
              </text>

              <!-- 场景名称 -->
              <text
                :x="scene.mapX"
                :y="scene.mapY + 50"
                class="scene-name"
                text-anchor="middle"
              >
                {{ scene.name }}
              </text>

              <!-- 已访问标记 -->
              <circle
                v-if="store.getSceneStatus(scene.id)"
                :cx="scene.mapX + 20"
                :cy="scene.mapY - 20"
                r="8"
                fill="#4ade80"
                class="visited-badge"
              />
            </g>
          </svg>

          <div class="map-legend">
            <div class="legend-item">
              <span class="legend-dot current"></span>
              <span>当前位置</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot visited"></span>
              <span>已访问</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot locked"></span>
              <span>未解锁</span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 考古笔记浮层 -->
    <transition name="slide-up">
      <div v-if="showNotes" class="notes-overlay">
        <div class="notes-panel" @click.stop>
          <button class="modal-close" @click="showNotes = false">×</button>
          <h2>
            <i class="fas fa-book"></i>
            我的考古日志
          </h2>

          <div class="notes-stats">
            <div class="stat-item">
              <strong>{{ store.visitedScenes.length }}</strong>
              <span>场景探访</span>
            </div>
            <div class="stat-item">
              <strong>{{ store.exploredHotspots.length }}</strong>
              <span>热点发现</span>
            </div>
            <div class="stat-item">
              <strong>{{ store.explorationProgress }}%</strong>
              <span>完成进度</span>
            </div>
          </div>

          <div class="notes-timeline">
            <div
              v-for="(note, index) in store.archaeologyNotes"
              :key="index"
              class="note-entry"
            >
              <div class="note-time">{{ formatTime(note.timestamp) }}</div>
              <div class="note-content">
                <div class="note-header">
                  <i :class="getNoteIcon(note.type)"></i>
                  <span class="note-title">{{ note.title || note.sceneName }}</span>
                </div>
                <p>{{ note.content }}</p>
                <img v-if="note.image" :src="note.image" class="note-image" />
              </div>
            </div>

            <div v-if="store.archaeologyNotes.length === 0" class="notes-empty">
              <i class="fas fa-clipboard"></i>
              <p>还没有记录，开始探索吧！</p>
            </div>
          </div>

          <div class="notes-actions">
            <button @click="exportNotes" class="export-btn">
              <i class="fas fa-download"></i>
              导出考古报告
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Viewer } from '@photo-sphere-viewer/core';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { useArchaeologyStore } from '@/stores/archaeology';
import { archaeologyScenes, sceneConnections } from '@/data/archaeologyScenes';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';
import xuanmiaoAvatar from '@/assets/sanxingdui-ai-chat/xuanmiao-avatar.png';

const router = useRouter();
const route = useRoute();
const store = useArchaeologyStore();

// 响应式数据
const viewerContainer = ref(null);
let viewer = null;
let markersPlugin = null;

const isLoading = ref(true);
const scenes = ref(archaeologyScenes);
const currentScene = ref(scenes.value[0]);
const activeHotspot = ref(null);
const showMap = ref(false);
const showNotes = ref(false);
const panelCollapsed = ref(false);
const aiMessage = ref('');
const aiSpeaking = ref(false);

// 计算属性
const remainingHotspots = computed(() => {
  return currentScene.value.hotspots.filter(h => {
    const hotspotKey = `${currentScene.value.id}-${h.id}`;
    return !store.exploredHotspots.includes(hotspotKey);
  });
});

const nextScene = computed(() => {
  const currentIndex = scenes.value.findIndex(s => s.id === currentScene.value.id);
  if (currentIndex < scenes.value.length - 1) {
    const next = scenes.value[currentIndex + 1];
    return next.unlocked ? next : null;
  }
  return null;
});

// 初始化
onMounted(async () => {
  // 从URL获取场景ID（如果有）
  const sceneId = route.query.sceneId ? parseInt(route.query.sceneId) : 1;
  const scene = scenes.value.find(s => s.id === sceneId) || scenes.value[0];

  // 初始化探索
  if (!store.startTime) {
    store.startExploration();
  }

  // 初始化全景查看器
  await initViewer(scene);

  // 欢迎语
  setTimeout(() => {
    aiMessage.value = scene.aiGuide;
    aiSpeaking.value = true;
    setTimeout(() => {
      aiSpeaking.value = false;
    }, 5000);
  }, 500);
});

onUnmounted(() => {
  if (viewer) {
    viewer.destroy();
  }
});

// 初始化全景查看器
const initViewer = async (scene) => {
  isLoading.value = true;

  try {
    viewer = new Viewer({
      container: viewerContainer.value,
      panorama: scene.panorama,
      plugins: [
        [MarkersPlugin, {
          markers: createMarkers(scene)
        }]
      ],
      navbar: [
        'zoom',
        'move',
        'fullscreen'
      ],
      defaultZoomLvl: 30,
      minFov: 30,
      maxFov: 90,
      loadingTxt: '加载中...',
      lang: {
        zoom: '缩放',
        zoomIn: '放大',
        zoomOut: '缩小',
        moveUp: '向上',
        moveDown: '向下',
        moveLeft: '向左',
        moveRight: '向右',
        fullscreen: '全屏'
      }
    });

    markersPlugin = viewer.getPlugin(MarkersPlugin);

    // 监听热点点击
    markersPlugin.on('select-marker', (e, marker) => {
      handleHotspotClick(marker.data);
    });

    // 监听加载完成
    viewer.once('ready', () => {
      isLoading.value = false;
      currentScene.value = scene;
      store.visitScene(scene.id, scene.name);

      // 检查是否解锁下一场景
      checkUnlockNextScene();
    });

  } catch (error) {
    console.error('全景查看器初始化失败:', error);
    isLoading.value = false;
  }
};

// 创建热点标记
const createMarkers = (scene) => {
  return scene.hotspots.map(hotspot => {
    const hotspotKey = `${scene.id}-${hotspot.id}`;
    const explored = store.exploredHotspots.includes(hotspotKey);

    return {
      id: hotspot.id,
      longitude: `${hotspot.position.longitude}deg`,
      latitude: `${hotspot.position.latitude}deg`,
      html: `
        <div class="panorama-hotspot ${hotspot.type} ${explored ? 'explored' : ''}">
          <div class="hotspot-icon">${hotspot.icon}</div>
          <div class="hotspot-pulse"></div>
        </div>
      `,
      tooltip: hotspot.title,
      data: { ...hotspot, sceneId: scene.id }
    };
  });
};

// 处理热点点击
const handleHotspotClick = (hotspot) => {
  activeHotspot.value = hotspot;
  store.exploreHotspot(hotspot);

  // AI讲解
  if (hotspot.aiComment) {
    setTimeout(() => {
      aiMessage.value = hotspot.aiComment;
      aiSpeaking.value = true;
      setTimeout(() => {
        aiSpeaking.value = false;
      }, 5000);
    }, 500);
  }

  // 更新热点标记状态
  updateMarkerStatus(hotspot.id);

  // 检查是否完成本场景
  if (remainingHotspots.value.length === 0) {
    setTimeout(() => {
      aiMessage.value = '太棒了！你已完成本场景的所有探索！';
      aiSpeaking.value = true;
      checkUnlockNextScene();
    }, 1000);
  }
};

// 更新标记状态
const updateMarkerStatus = (hotspotId) => {
  const marker = markersPlugin.getMarker(hotspotId);
  if (marker) {
    marker.config.html = marker.config.html.replace('panorama-hotspot', 'panorama-hotspot explored');
    markersPlugin.updateMarker(marker.config);
  }
};

// 检查并解锁下一场景
const checkUnlockNextScene = () => {
  if (remainingHotspots.value.length === 0 && nextScene.value === null) {
    const currentIndex = scenes.value.findIndex(s => s.id === currentScene.value.id);
    if (currentIndex < scenes.value.length - 1) {
      const next = scenes.value[currentIndex + 1];
      next.unlocked = true;

      setTimeout(() => {
        aiMessage.value = `🎉 解锁新场景：${next.name}！`;
        aiSpeaking.value = true;
      }, 1500);
    }
  }
};

// 切换场景
const switchScene = async (scene) => {
  if (!scene.unlocked) {
    aiMessage.value = '请先完成当前场景的探索！';
    aiSpeaking.value = true;
    setTimeout(() => aiSpeaking.value = false, 3000);
    return;
  }

  isLoading.value = true;
  activeHotspot.value = null;

  // 更新全景
  await viewer.setPanorama(scene.panorama);

  // 更新热点
  markersPlugin.clearMarkers();
  const newMarkers = createMarkers(scene);
  newMarkers.forEach(marker => {
    markersPlugin.addMarker(marker);
  });

  currentScene.value = scene;
  store.visitScene(scene.id, scene.name);
  isLoading.value = false;

  // AI场景介绍
  aiMessage.value = scene.aiGuide;
  aiSpeaking.value = true;
  setTimeout(() => {
    aiSpeaking.value = false;
  }, 5000);

  // 关闭地图
  showMap.value = false;
};

// 切换到下一场景
const switchToNextScene = () => {
  if (nextScene.value) {
    switchScene(nextScene.value);
  }
};

// 处理场景点击
const handleSceneClick = (scene) => {
  switchScene(scene);
};

// 聚焦热点
const focusHotspot = (hotspot) => {
  viewer.animate({
    longitude: `${hotspot.position.longitude}deg`,
    latitude: `${hotspot.position.latitude}deg`,
    zoom: 50,
    speed: '2rpm'
  });
};

// 关闭热点卡片
const closeHotspot = () => {
  activeHotspot.value = null;
};

// 处理操作按钮
const handleAction = (action) => {
  switch (action.type) {
    case '3d':
      router.push(`/3d?entityId=${action.artifactId || 'HI-2025-001'}`);
      break;
    case 'ask-ai':
      router.push('/ai-chat');
      break;
    case 'video':
      // 播放视频
      break;
    case 'quiz':
      // 显示问答
      break;
    default:
      console.log('Action:', action);
  }
};

// 切换AI导览
const toggleAIGuide = () => {
  if (!aiMessage.value) {
    aiMessage.value = currentScene.value.aiGuide;
    aiSpeaking.value = true;
    setTimeout(() => aiSpeaking.value = false, 5000);
  } else {
    aiSpeaking.value = !aiSpeaking.value;
  }
};

// 返回
const goBack = () => {
  router.push('/tanmi');
};

// 退出全景
const exitPanorama = () => {
  router.push('/tanmi');
};

// 导出笔记
const exportNotes = () => {
  const report = store.exportReport();
  console.log('导出考古报告:', report);
  // TODO: 生成PDF
  aiMessage.value = '考古报告生成功能开发中...';
  aiSpeaking.value = true;
};

// 工具函数
const getSceneById = (id) => {
  return scenes.value.find(s => s.id === id);
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const getNoteIcon = (type) => {
  const icons = {
    'scene': 'fas fa-map-marker-alt',
    'discovery': 'fas fa-search',
    'artifact': 'fas fa-gem'
  };
  return icons[type] || 'fas fa-sticky-note';
};
</script>

<style scoped>
.archaeology-container {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background: #1a1a1a;
  overflow: hidden;
}

#panorama-viewer {
  width: 100%;
  height: 100%;
}

/* 加载提示 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  color: #f7efe0;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(214, 179, 95, 0.3);
  border-top-color: #d6b35f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 顶部工具栏 */
.top-toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 100;
}

.back-btn,
.exit-btn,
.toolbar-btn {
  padding: 10px 16px;
  background: rgba(18, 20, 16, 0.85);
  border: 1px solid rgba(214, 179, 95, 0.4);
  border-radius: 8px;
  color: #f7efe0;
  font-size: 14px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.back-btn:hover,
.exit-btn:hover,
.toolbar-btn:hover {
  background: rgba(42, 66, 52, 0.9);
  border-color: rgba(214, 179, 95, 0.7);
  transform: translateY(-2px);
}

.exit-btn {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.exit-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.6);
}

.progress-indicator {
  margin-left: auto;
  padding: 10px 16px;
  background: rgba(18, 20, 16, 0.85);
  border-radius: 8px;
  color: #d6b35f;
  font-weight: 600;
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 场景信息面板 */
.scene-info-panel {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 300px;
  max-height: calc(100vh - 120px);
  padding: 20px;
  background: rgba(18, 20, 16, 0.92);
  border: 1px solid rgba(214, 179, 95, 0.3);
  border-radius: 12px;
  color: #f7efe0;
  backdrop-filter: blur(12px);
  overflow-y: auto;
  z-index: 90;
  transition: all 0.3s;
}

.scene-info-panel.collapsed {
  width: 50px;
  height: 50px;
  padding: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background: rgba(214, 179, 95, 0.2);
  border: none;
  border-radius: 50%;
  color: #d6b35f;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  flex-shrink: 0;
}

.scene-info-panel.collapsed .collapse-btn {
  position: static;
  margin: 0;
}

.collapse-btn:hover {
  background: rgba(214, 179, 95, 0.4);
}

.panel-content h2 {
  font-size: 20px;
  margin-bottom: 4px;
  color: #d6b35f;
}

.scene-name-en {
  font-size: 12px;
  color: #a89970;
  margin-bottom: 12px;
  font-style: italic;
}

.scene-description {
  font-size: 13px;
  line-height: 1.7;
  color: #c4b690;
  margin-bottom: 20px;
}

.hotspots-list h3 {
  font-size: 14px;
  margin-bottom: 10px;
  color: #d6b35f;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hotspots-list ul {
  list-style: none;
  padding: 0;
}

.hotspots-list li {
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.hotspots-list li:hover {
  background: rgba(214, 179, 95, 0.15);
  transform: translateX(5px);
}

.hotspot-icon {
  font-size: 18px;
}

.hotspot-title {
  flex: 1;
}

.scene-completed {
  text-align: center;
  padding: 20px;
  background: rgba(74, 222, 128, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.scene-completed i {
  font-size: 48px;
  color: #4ade80;
  margin-bottom: 10px;
}

.next-scene-btn {
  margin-top: 15px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #d6b35f, #a89970);
  border: none;
  border-radius: 20px;
  color: #1a1a1a;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.next-scene-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(214, 179, 95, 0.4);
}

/* 热点信息卡片 */
.hotspot-card {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 420px;
  max-height: calc(100vh - 120px);
  background: rgba(18, 20, 16, 0.95);
  border: 1px solid rgba(214, 179, 95, 0.4);
  border-radius: 12px;
  overflow: hidden;
  z-index: 110;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(214, 179, 95, 0.8);
  transform: rotate(90deg);
}

.hotspot-media {
  width: 100%;
  max-height: 250px;
  overflow: hidden;
  background: #000;
}

.hotspot-media img,
.hotspot-media video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hotspot-content {
  padding: 20px;
  color: #f7efe0;
  overflow-y: auto;
  flex: 1;
}

.hotspot-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.hotspot-type-icon {
  font-size: 32px;
}

.hotspot-header h3 {
  font-size: 18px;
  color: #d6b35f;
  margin: 0;
}

.hotspot-description {
  font-size: 14px;
  line-height: 1.8;
  color: #c4b690;
  margin-bottom: 16px;
}

/* AI评论 */
.ai-comment {
  display: flex;
  gap: 12px;
  margin: 16px 0;
  padding: 12px;
  background: rgba(102, 126, 234, 0.1);
  border-left: 3px solid #667eea;
  border-radius: 8px;
}

.ai-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-bubble p {
  font-size: 13px;
  line-height: 1.6;
  color: #e0d7c6;
  margin: 0;
}

/* 时间轴 */
.timeline {
  margin: 16px 0;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
}

.timeline h4 {
  font-size: 14px;
  color: #d6b35f;
  margin-bottom: 10px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.timeline-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.timeline-item .time {
  font-size: 11px;
  color: #a89970;
  font-weight: 600;
  min-width: 90px;
}

.timeline-item .event {
  font-size: 12px;
  color: #c4b690;
  flex: 1;
}

/* 文物清单 */
.inventory-list {
  margin: 16px 0;
}

.inventory-list h4 {
  font-size: 14px;
  color: #d6b35f;
  margin-bottom: 10px;
}

.inventory-list ul {
  list-style: none;
  padding: 0;
}

.inventory-list li {
  font-size: 12px;
  color: #c4b690;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  margin-bottom: 6px;
}

/* 谜题框 */
.mystery-box {
  margin: 16px 0;
  padding: 12px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  display: flex;
  gap: 10px;
  align-items: start;
}

.mystery-box i {
  color: #ffc107;
  font-size: 18px;
  margin-top: 2px;
}

.mystery-box p {
  font-size: 13px;
  line-height: 1.6;
  color: #f5e5b8;
  margin: 0;
}

/* 操作按钮 */
.hotspot-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.action-btn {
  padding: 8px 16px;
  background: rgba(214, 179, 95, 0.2);
  border: 1px solid rgba(214, 179, 95, 0.4);
  border-radius: 20px;
  color: #d6b35f;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(214, 179, 95, 0.3);
  transform: translateY(-2px);
}

/* AI导览助手 */
.ai-guide {
  position: absolute;
  bottom: 30px;
  right: 30px;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.guide-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.2s;
}

.guide-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
}

.ai-guide.speaking .guide-avatar {
  animation: pulse-avatar 2s infinite;
}

@keyframes pulse-avatar {
  0%, 100% { box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.8); }
}

.guide-bubble {
  max-width: 300px;
  padding: 12px 16px;
  background: rgba(102, 126, 234, 0.95);
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  line-height: 1.6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 遗址地图浮层 */
.map-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(5px);
}

.map-panel {
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  background: rgba(18, 20, 16, 0.98);
  border: 2px solid rgba(214, 179, 95, 0.5);
  border-radius: 16px;
  padding: 30px;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  background: rgba(214, 179, 95, 0.2);
  border: none;
  border-radius: 50%;
  color: #d6b35f;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(214, 179, 95, 0.4);
  transform: rotate(90deg);
}

.map-panel h2 {
  font-size: 24px;
  color: #d6b35f;
  margin-bottom: 8px;
}

.map-description {
  font-size: 14px;
  color: #a89970;
  margin-bottom: 20px;
}

.site-map-svg {
  width: 100%;
  height: auto;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  margin-bottom: 20px;
}

.scene-marker {
  cursor: pointer;
  transition: all 0.3s;
}

.scene-marker.current {
  fill: #667eea;
  stroke: #764ba2;
  stroke-width: 3;
}

.scene-marker.visited {
  fill: #4ade80;
  stroke: #22c55e;
  stroke-width: 2;
}

.scene-marker.locked {
  fill: #6b7280;
  stroke: #4b5563;
  stroke-width: 1;
  cursor: not-allowed;
}

.scene-marker:not(.locked):hover {
  transform: scale(1.2);
  filter: brightness(1.3);
}

.scene-number {
  fill: #fff;
  font-size: 18px;
  font-weight: 600;
  pointer-events: none;
}

.scene-name {
  fill: #d6b35f;
  font-size: 12px;
  pointer-events: none;
}

.visited-badge {
  pointer-events: none;
}

.map-legend {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #c4b690;
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.legend-dot.current {
  background: #667eea;
}

.legend-dot.visited {
  background: #4ade80;
}

.legend-dot.locked {
  background: #6b7280;
}

/* 考古笔记浮层 */
.notes-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(5px);
}

.notes-panel {
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  background: rgba(18, 20, 16, 0.98);
  border: 2px solid rgba(214, 179, 95, 0.5);
  border-radius: 16px;
  padding: 30px;
  overflow-y: auto;
  position: relative;
}

.notes-panel h2 {
  font-size: 24px;
  color: #d6b35f;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.notes-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(214, 179, 95, 0.2);
}

.stat-item strong {
  display: block;
  font-size: 28px;
  color: #d6b35f;
  margin-bottom: 5px;
}

.stat-item span {
  font-size: 12px;
  color: #a89970;
}

.notes-timeline {
  margin-bottom: 20px;
}

.note-entry {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.note-time {
  font-size: 11px;
  color: #a89970;
  min-width: 60px;
}

.note-content {
  flex: 1;
}

.note-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.note-header i {
  color: #d6b35f;
}

.note-title {
  font-size: 14px;
  font-weight: 600;
  color: #d6b35f;
}

.note-content p {
  font-size: 13px;
  color: #c4b690;
  line-height: 1.6;
  margin: 0;
}

.note-image {
  width: 100%;
  max-width: 300px;
  border-radius: 8px;
  margin-top: 10px;
}

.notes-empty {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.notes-empty i {
  font-size: 48px;
  margin-bottom: 15px;
  opacity: 0.5;
}

.notes-actions {
  text-align: center;
}

.export-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #d6b35f, #a89970);
  border: none;
  border-radius: 24px;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(214, 179, 95, 0.4);
}

/* 动画 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 全景热点标记样式 */
:deep(.panorama-hotspot) {
  position: relative;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

:deep(.panorama-hotspot .hotspot-icon) {
  font-size: 28px;
  z-index: 2;
  position: relative;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

:deep(.panorama-hotspot .hotspot-pulse) {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(214, 179, 95, 0.3);
  animation: pulse 2s infinite;
}

:deep(.panorama-hotspot.explored .hotspot-pulse) {
  background: rgba(74, 222, 128, 0.3);
  animation: none;
}

:deep(.panorama-hotspot:hover) {
  transform: scale(1.2);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* 响应式 */
@media (max-width: 1024px) {
  .scene-info-panel {
    width: 260px;
  }

  .hotspot-card {
    width: 360px;
  }
}

@media (max-width: 768px) {
  .scene-info-panel {
    width: calc(100% - 40px);
    max-width: 300px;
  }

  .hotspot-card {
    width: calc(100% - 40px);
    max-width: 400px;
  }

  .top-toolbar {
    flex-wrap: wrap;
  }

  .progress-indicator {
    width: 100%;
  }
}
</style>
