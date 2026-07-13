import { defineStore } from 'pinia';

export const useArchaeologyStore = defineStore('archaeology', {
  state: () => ({
    // 当前场景ID
    currentSceneId: 1,

    // 已访问的场景
    visitedScenes: [],

    // 已探索的热点
    exploredHotspots: [],

    // 考古笔记
    archaeologyNotes: [],

    // 收集的照片
    collectedPhotos: [],

    // 探索开始时间
    startTime: null,
  }),

  getters: {
    // 探索进度百分比
    explorationProgress: (state) => {
      const totalScenes = 8;
      return Math.floor((state.visitedScenes.length / totalScenes) * 100);
    },

    // 是否完成所有探索
    isCompleted: (state) => {
      return state.visitedScenes.length >= 8;
    },

    // 获取某个场景的探索状态
    getSceneStatus: (state) => (sceneId) => {
      return state.visitedScenes.includes(sceneId);
    },

    // 获取某个热点的探索状态
    isHotspotExplored: (state) => (hotspotId) => {
      return state.exploredHotspots.includes(hotspotId);
    },
  },

  actions: {
    // 开始探索
    startExploration() {
      this.startTime = new Date().toISOString();
      this.visitedScenes = [];
      this.exploredHotspots = [];
      this.archaeologyNotes = [];
      this.collectedPhotos = [];
    },

    // 访问场景
    visitScene(sceneId, sceneName) {
      if (!this.visitedScenes.includes(sceneId)) {
        this.visitedScenes.push(sceneId);

        // 添加到笔记
        this.addNote({
          type: 'scene',
          sceneId,
          sceneName,
          timestamp: new Date().toISOString(),
          content: `探访了${sceneName}`,
        });
      }
      this.currentSceneId = sceneId;
    },

    // 探索热点
    exploreHotspot(hotspot) {
      const hotspotKey = `${hotspot.sceneId}-${hotspot.id}`;

      if (!this.exploredHotspots.includes(hotspotKey)) {
        this.exploredHotspots.push(hotspotKey);

        // 添加到笔记
        this.addNote({
          type: 'discovery',
          sceneId: hotspot.sceneId,
          hotspotId: hotspot.id,
          title: hotspot.title,
          timestamp: new Date().toISOString(),
          content: hotspot.description,
          image: hotspot.image,
        });
      }
    },

    // 添加笔记
    addNote(note) {
      this.archaeologyNotes.push(note);
    },

    // 添加照片
    addPhoto(photo) {
      this.collectedPhotos.push({
        url: photo.url,
        caption: photo.caption,
        sceneId: photo.sceneId,
        timestamp: new Date().toISOString(),
      });
    },

    // 重置探索
    resetExploration() {
      this.currentSceneId = 1;
      this.visitedScenes = [];
      this.exploredHotspots = [];
      this.archaeologyNotes = [];
      this.collectedPhotos = [];
      this.startTime = null;
    },

    // 导出考古报告
    exportReport() {
      return {
        title: '三星堆考古探索报告',
        startTime: this.startTime,
        endTime: new Date().toISOString(),
        visitedScenes: this.visitedScenes.length,
        exploredHotspots: this.exploredHotspots.length,
        notes: this.archaeologyNotes,
        photos: this.collectedPhotos,
        progress: this.explorationProgress,
      };
    },
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'archaeology-exploration',
        storage: localStorage,
      },
    ],
  },
});
