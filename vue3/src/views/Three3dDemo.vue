<template>
  <div class="three-wrapper" ref="wrapperRef">
    <button class="back-button" @click="goBack" aria-label="返回藏品列表">
      <i class="fas fa-arrow-left"></i>
      返回
    </button>

    <div class="artifact-ribbon" v-if="artifactTitle">
      <span>3D 展馆</span>
      <strong>{{ artifactTitle }}</strong>
    </div>

    <div class="loading-mask" v-if="isLoading">
      <div class="loading-box">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: loadProgress + '%' }"></div>
        </div>
        <span>模型加载中 {{ loadProgress }}%</span>
      </div>
    </div>

    <div class="error-mask" v-if="errorMsg">
      <div class="error-text">{{ errorMsg }}</div>
      <button class="retry-btn" @click="reload">重新加载</button>
    </div>

    <canvas ref="canvasRef"></canvas>

    <aside class="graph-panel" aria-label="文物拓扑图">
      <header class="graph-header">
        <div>
          <p class="graph-kicker">知识图谱</p>
          <h2>{{ artifactTitle || "文物关系拓扑" }}</h2>
        </div>
        <button class="icon-button" type="button" @click="loadGraph" aria-label="刷新图谱">
          <i class="fas fa-rotate-right"></i>
        </button>
      </header>

      <p class="graph-narrative">
        {{ graphPayload.narrative || "沿文物、遗址、时代、工艺与象征意义查看当前藏品的知识关系。" }}
      </p>

      <div class="graph-stats">
        <span><strong>{{ graphStats.nodeCount }}</strong> 节点</span>
        <span><strong>{{ graphStats.edgeCount }}</strong> 关系</span>
        <span><strong>{{ graphStats.expandableCount }}</strong> 可展开</span>
      </div>

      <div class="graph-tools" v-if="graphPayload.availableTypes.length">
        <button
          v-for="type in graphPayload.availableTypes"
          :key="type"
          type="button"
          :class="['type-filter', `filter-${type}`, { active: activeTypeFilters.includes(type) }]"
          :title="typeDescription(type)"
          :aria-label="`筛选${typeLabel(type)}节点`"
          @click="toggleTypeFilter(type)"
        >
          {{ typeLabel(type) }}
        </button>
        <button class="viewport-button" type="button" @click="resetGraphViewport">
          复位
        </button>
      </div>

      <div class="graph-board">
        <div v-show="hasGraphNodes" ref="graphRef" class="g6-graph" aria-label="文物关系拓扑可视化"></div>

        <div class="graph-empty" v-if="!hasGraphNodes">
          <strong>{{ graphEmptyTitle }}</strong>
          <span>{{ graphEmptyText }}</span>
        </div>

        <div class="graph-loading" v-if="graphLoading">
          <span></span>
          正在读取关系图谱
        </div>
      </div>

      <section class="node-inspector">
        <div class="inspector-head">
          <span :class="['type-dot', `type-${selectedNodeType}`]"></span>
          <p>{{ selectedNodeTypeLabel }}</p>
        </div>
        <h3>{{ selectedNodeTitle }}</h3>
        <p class="node-summary">{{ selectedNodeSummary }}</p>

        <div class="relation-list" v-if="selectedNodeRelations.length">
          <button
            v-for="relation in selectedNodeRelations"
            :key="relation.id"
            type="button"
            @click="selectNodeById(relation.otherId)"
          >
            <span>{{ relation.label }}</span>
            <strong>{{ relation.otherLabel }}</strong>
          </button>
        </div>

        <button
          class="expand-button"
          type="button"
          :disabled="!canExpandSelectedNode || graphLoading"
          @click="expandGraphNode(selectedNode)"
        >
          {{ expandButtonText }}
        </button>
      </section>

      <p class="graph-error" v-if="graphError">{{ graphError }}</p>
    </aside>
  </div>
</template>

<script>
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { markRaw, nextTick } from "vue";
import { Graph as G6Graph } from "@antv/g6";
import { getArtifactGraph, getArtifactGraphNeighbors } from "@/api/SpacetimeApi";

const TYPE_META = {
  artifact: { label: "文物", radius: 46, description: "当前文物或相关文物" },
  craft: { label: "工艺", radius: 34, description: "制作技法和加工方式" },
  material: { label: "材质", radius: 32, description: "青铜、黄金、玉石等材料" },
  meaning: { label: "象征", radius: 34, description: "神权、王权、太阳崇拜等含义" },
  motif: { label: "母题", radius: 32, description: "神鸟、纵目、鱼鸟箭纹等视觉纹样" },
  ritual: { label: "仪式", radius: 33, description: "通神祭祀、王权礼仪等使用语境" },
  site: { label: "遗址", radius: 36, description: "文物关联的出土地或遗址" },
  era: { label: "时代", radius: 34, description: "文物所属的历史阶段" },
  node: { label: "节点", radius: 32, description: "其他知识图谱节点" },
};

const DEFAULT_TYPE_FILTERS = ["artifact", "craft", "material", "meaning", "site", "era"];

const TYPE_COLORS = {
  artifact: { fill: "#9b6f30", stroke: "#f0c46d", label: "#fff3d4" },
  craft: { fill: "#42664f", stroke: "#86c99b", label: "#d8f2df" },
  material: { fill: "#716452", stroke: "#d0bd93", label: "#efe4c9" },
  meaning: { fill: "#84652f", stroke: "#ddb25b", label: "#f5e2aa" },
  motif: { fill: "#86513d", stroke: "#d78b5e", label: "#f2d2bf" },
  ritual: { fill: "#4b746d", stroke: "#89c7ba", label: "#d7f1ec" },
  site: { fill: "#3c6670", stroke: "#8bd0de", label: "#d7f5f9" },
  era: { fill: "#5d5946", stroke: "#c7bb88", label: "#eee5bd" },
  node: { fill: "#3a3f36", stroke: "#aeb89c", label: "#edf2e0" },
};

const RELATION_LABELS = {
  craft: "采用工艺",
  material: "主要材质",
  meaning: "象征寓意",
  motif: "纹饰母题",
  ritual: "仪式语境",
  origin: "出土地",
  time: "所属时代",
};

export default {
  name: "Three3dDemo",
  data() {
    return {
      glbUrl: "",
      entityId: "",
      artifactTitle: "",
      isLoading: true,
      loadProgress: 0,
      errorMsg: "",

      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      glbModel: null,
      animationId: 0,
      modelViewport: { width: 0, height: 0 },

      graphLoading: false,
      graphError: "",
      graphInstance: null,
      graphClickTimer: 0,
      graphPayload: {
        centerNodeId: "",
        narrative: "",
        availableTypes: [],
        stats: null,
        nodes: [],
        edges: [],
      },
      selectedNodeId: "",
      expandedNodeIds: [],
      activeTypeFilters: [],
    };
  },

  computed: {
    graphStats() {
      return {
        nodeCount: this.graphPayload.stats?.nodeCount ?? this.graphPayload.nodes.length,
        edgeCount: this.graphPayload.stats?.edgeCount ?? this.graphPayload.edges.length,
        expandableCount:
          this.graphPayload.stats?.expandableCount ??
          this.graphPayload.nodes.filter((node) => node.expandable).length,
      };
    },

    hasGraphNodes() {
      return this.graphPayload.nodes.length > 0;
    },

    selectedNode() {
      return this.graphPayload.nodes.find((node) => node.id === this.selectedNodeId) || null;
    },

    selectedNodeType() {
      return this.selectedNode?.type || "node";
    },

    selectedNodeTypeLabel() {
      return this.typeLabel(this.selectedNodeType);
    },

    selectedNodeTitle() {
      return this.selectedNode?.label || "尚未选择节点";
    },

    selectedNodeSummary() {
      return this.selectedNode?.summary || "点击拓扑图中的节点，可以查看它和当前文物之间的关系。";
    },

    selectedNodeRelations() {
      if (!this.selectedNode) return [];
      const nodeMap = this.graphPayload.nodes.reduce((map, node) => {
        map[node.id] = node;
        return map;
      }, {});

      return (this.graphPayload.edges || [])
        .filter((edge) => edge.source === this.selectedNode.id || edge.target === this.selectedNode.id)
        .map((edge) => {
          const otherId = edge.source === this.selectedNode.id ? edge.target : edge.source;
          return {
            id: edge.id,
            label: edge.label || RELATION_LABELS[edge.category] || "关联",
            otherId,
            otherLabel: nodeMap[otherId]?.label || otherId,
          };
        });
    },

    canExpandSelectedNode() {
      return Boolean(
        this.selectedNode?.expandable &&
          this.entityId &&
          !this.expandedNodeIds.includes(this.selectedNode.id)
      );
    },

    expandButtonText() {
      if (!this.selectedNode) return "选择节点";
      if (!this.selectedNode.expandable) return "当前节点不可展开";
      if (this.expandedNodeIds.includes(this.selectedNode.id)) return "已展开";
      return "展开相邻节点";
    },

    graphEmptyTitle() {
      if (!this.entityId) return "缺少文物 ID";
      if (this.graphError) return "图谱暂不可用";
      return "等待图谱数据";
    },

    graphEmptyText() {
      if (!this.entityId) return "从 3D 藏品列表进入时会自动带入 entityId。";
      if (this.graphError) return this.graphError;
      return "正在准备当前藏品的关系网络。";
    },
  },

  mounted() {
    this.getModelUrl();
    this.initThree();
    this.loadGraph();
  },

  methods: {
    getModelUrl() {
      const url = this.$route.query.glbUrl;
      this.entityId = this.safeDecode(this.$route.query.entityId || "");
      this.artifactTitle = this.safeDecode(this.$route.query.title || "");

      if (!url) {
        this.errorMsg = "未获取到模型地址";
        this.isLoading = false;
        return;
      }
      this.glbUrl = this.safeDecode(url);
    },

    initThree() {
      if (!this.glbUrl) return;

      this.scene = markRaw(new THREE.Scene());
      this.camera = markRaw(
        new THREE.PerspectiveCamera(
          55,
          this.$refs.wrapperRef.clientWidth / this.$refs.wrapperRef.clientHeight,
          0.01,
          1000
        )
      );
      this.camera.position.z = 2.5;

      this.renderer = markRaw(
        new THREE.WebGLRenderer({
          canvas: this.$refs.canvasRef,
          antialias: true,
          alpha: true,
        })
      );
      this.renderer.setSize(this.$refs.wrapperRef.clientWidth, this.$refs.wrapperRef.clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      this.updateModelViewport();

      this.controls = markRaw(new OrbitControls(this.camera, this.renderer.domElement));
      this.controls.enableDamping = true;
      this.controls.minDistance = 1;
      this.controls.maxDistance = 10;

      const ambientLight = markRaw(new THREE.AmbientLight(0xffffff, 0.7));
      this.scene.add(ambientLight);
      const directionalLight = markRaw(new THREE.DirectionalLight(0xffffff, 0.8));
      directionalLight.position.set(5, 10, 5);
      this.scene.add(directionalLight);

      const hdrLoader = new RGBELoader();
      hdrLoader.load(
        "/environment.hdr",
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          this.scene.environment = texture;
        },
        undefined,
        () => {
          this.scene.background = markRaw(new THREE.Color(0x12130f));
        }
      );

      this.loadModel();
      this.animate();
      window.addEventListener("resize", this.onWindowResize);
    },

    loadModel() {
      const loader = new GLTFLoader();
      loader.load(
        this.glbUrl,
        (gltf) => {
          this.glbModel = markRaw(gltf.scene);
          this.scene.add(this.glbModel);
          this.isLoading = false;

          const box = new THREE.Box3().setFromObject(this.glbModel);
          const center = box.getCenter(new THREE.Vector3());
          this.glbModel.position.sub(center);
        },
        (xhr) => {
          const total = xhr.total || xhr.loaded || 1;
          this.loadProgress = Math.min(100, Math.floor((xhr.loaded / total) * 100));
        },
        (err) => {
          console.error("模型加载失败：", err);
          this.errorMsg = "模型加载失败，文件损坏或不存在";
          this.isLoading = false;
        }
      );
    },

    animate() {
      this.animationId = requestAnimationFrame(() => this.animate());
      if (this.controls) this.controls.update();
      if (this.renderer && this.scene && this.camera) {
        this.applyModelViewport();
        this.renderer.render(this.scene, this.camera);
      }
    },

    async loadGraph() {
      if (!this.entityId) {
        this.graphError = "当前页面没有收到 entityId，无法加载知识图谱。";
        return;
      }

      this.graphLoading = true;
      this.graphError = "";
      try {
        const response = await getArtifactGraph({ entityId: this.entityId }, { showDefaultMsg: false });
        this.graphPayload = this.normalizeGraphPayload(response);
        this.activeTypeFilters = this.getDefaultTypeFilters(this.graphPayload.availableTypes);
        this.expandedNodeIds = [];
        this.selectedNodeId =
          this.graphPayload.centerNodeId ||
          this.graphPayload.nodes.find((node) => node.type === "artifact")?.id ||
          this.graphPayload.nodes[0]?.id ||
          "";
        await nextTick();
        await this.renderGraph();
      } catch (error) {
        console.error("图谱加载失败：", error);
        this.graphPayload = this.normalizeGraphPayload(null);
        this.selectedNodeId = "";
        this.destroyGraph();
        this.graphError = "图谱服务暂时不可用，3D 模型仍可继续浏览。";
      } finally {
        this.graphLoading = false;
      }
    },

    async expandGraphNode(node) {
      if (!node || !node.expandable || !this.entityId || this.expandedNodeIds.includes(node.id)) return;

      this.graphLoading = true;
      this.graphError = "";
      try {
        const response = await getArtifactGraphNeighbors(
          { entityId: this.entityId, nodeId: node.id, depth: 1 },
          { showDefaultMsg: false }
        );
        this.graphPayload = this.mergeGraphPayload(this.graphPayload, this.normalizeGraphPayload(response));
        this.activeTypeFilters = this.activeTypeFilters.filter((type) => this.graphPayload.availableTypes.includes(type));
        this.expandedNodeIds = [...this.expandedNodeIds, node.id];
        await nextTick();
        await this.renderGraph();
        await this.applyFocusState(node.id, false);
      } catch (error) {
        console.error("图谱扩展失败：", error);
        this.graphError = "这个节点暂时不能继续展开。";
      } finally {
        this.graphLoading = false;
      }
    },

    getVisibleGraphPayload() {
      const enabledTypes = new Set(this.activeTypeFilters.length ? this.activeTypeFilters : this.graphPayload.availableTypes);
      const nodes = this.graphPayload.nodes.filter((node) => enabledTypes.has(node.type));
      const visibleNodeIds = new Set(nodes.map((node) => node.id));
      const edges = this.graphPayload.edges.filter(
        (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
      );
      return { nodes, edges };
    },

    buildG6Data() {
      const { nodes, edges } = this.getVisibleGraphPayload();
      const positions = this.computeRadialLayout(nodes, this.graphPayload.centerNodeId);

      return {
        nodes: nodes.map((node) => ({
          id: node.id,
          data: node,
          style: {
            ...this.buildNodeStyle(node),
            ...(positions.get(node.id) || { x: 0, y: 0 }),
          },
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: edge,
          style: this.buildEdgeStyle(edge),
        })),
      };
    },

    computeRadialLayout(nodes, centerNodeId) {
      const positions = new Map();
      const centerId = centerNodeId || nodes.find((node) => node.type === "artifact")?.id;
      if (!centerId) return positions;

      positions.set(centerId, { x: 0, y: 0 });
      const buckets = {
        inner: nodes.filter((node) => node.id !== centerId && ["site", "era", "material"].includes(node.type)),
        middle: nodes.filter((node) => node.id !== centerId && ["craft", "meaning", "motif"].includes(node.type)),
        outer: nodes.filter((node) => node.id !== centerId && ["ritual", "artifact"].includes(node.type)),
      };

      this.layoutRing(buckets.inner, 150, positions, -Math.PI / 2);
      this.layoutRing(buckets.middle, 255, positions, -Math.PI / 4);
      this.layoutRing(buckets.outer, 360, positions, Math.PI / 8);
      return positions;
    },

    layoutRing(nodes, radius, positions, startAngle) {
      if (!nodes.length) return;
      nodes.forEach((node, index) => {
        const angle = startAngle + (Math.PI * 2 * index) / nodes.length;
        positions.set(node.id, {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        });
      });
    },

    buildNodeStyle(node) {
      const palette = TYPE_COLORS[node.type] || TYPE_COLORS.node;
      const isCenter = node.id === this.graphPayload.centerNodeId;
      const isRelatedArtifact = node.type === "artifact" && !isCenter;
      const size = isCenter ? 88 : isRelatedArtifact ? 62 : ["site", "era"].includes(node.type) ? 54 : 44;

      return {
        size,
        fill: palette.fill,
        stroke: palette.stroke,
        lineWidth: isCenter ? 3 : 1.8,
        cursor: "pointer",
        halo: true,
        haloLineWidth: isCenter ? 16 : 9,
        haloStroke: palette.stroke,
        haloStrokeOpacity: isCenter ? 0.28 : 0.15,
        label: true,
        labelText: node.label,
        labelFill: isCenter ? "#fff6df" : palette.label,
        labelFontFamily: '"Microsoft YaHei", "Noto Serif SC", sans-serif',
        labelFontWeight: isCenter ? 800 : 700,
        labelFontSize: isCenter ? 16 : 12,
        labelPlacement: isCenter ? "center" : "bottom",
        labelOffsetY: isCenter ? 0 : 10,
      };
    },

    buildEdgeStyle(edge) {
      const strokeMap = {
        origin: "#8bd0de",
        time: "#c7bb88",
        craft: "#86c99b",
        material: "#d0bd93",
        meaning: "#ddb25b",
        motif: "#d78b5e",
        ritual: "#89c7ba",
      };

      return {
        stroke: strokeMap[edge.category] || "#b9a985",
        lineWidth: edge.weight === 2 ? 2.3 : 1.35,
        opacity: 0.72,
        lineDash: ["meaning", "ritual"].includes(edge.category) ? [7, 5] : undefined,
        endArrow: true,
        cursor: "pointer",
      };
    },

    async renderGraph() {
      if (!this.$refs.graphRef) return;

      const data = this.buildG6Data();
      if (!data.nodes.length) {
        this.destroyGraph();
        return;
      }

      const width = Math.max(this.$refs.graphRef.clientWidth || 0, 320);
      const height = Math.max(this.$refs.graphRef.clientHeight || 0, 300);

      if (!this.graphInstance) {
        this.graphInstance = markRaw(
          new G6Graph({
            container: this.$refs.graphRef,
            width,
            height,
            data,
            autoFit: "view",
            padding: 36,
            animation: false,
            node: {
              type: "circle",
              state: {
                active: { lineWidth: 4, haloLineWidth: 20, haloStrokeOpacity: 0.42 },
                neighbor: { lineWidth: 3, haloLineWidth: 14, haloStrokeOpacity: 0.25 },
                dim: { opacity: 0.18 },
              },
            },
            edge: {
              type: "line",
              state: {
                active: { lineWidth: 2.8, opacity: 1 },
                dim: { opacity: 0.1 },
              },
            },
            behaviors: ["drag-canvas", "zoom-canvas", "drag-node"],
          })
        );
        this.bindGraphEvents();
      } else {
        this.graphInstance.setSize(width, height);
        this.graphInstance.setData(data);
      }

      await this.graphInstance.render();
      this.normalizeSelectedNode();
      await this.applyFocusState(this.selectedNodeId || this.graphPayload.centerNodeId, false);
    },

    bindGraphEvents() {
      if (!this.graphInstance) return;

      this.graphInstance.on("node:click", async (event) => {
        const nodeId = event?.target?.id;
        if (!nodeId) return;
        if (this.graphClickTimer) window.clearTimeout(this.graphClickTimer);
        this.graphClickTimer = window.setTimeout(async () => {
          this.selectedNodeId = nodeId;
          await this.applyFocusState(nodeId);
        }, 140);
      });

      this.graphInstance.on("node:dblclick", async (event) => {
        const nodeId = event?.target?.id;
        if (!nodeId) return;
        if (this.graphClickTimer) {
          window.clearTimeout(this.graphClickTimer);
          this.graphClickTimer = 0;
        }
        const node = this.graphPayload.nodes.find((item) => item.id === nodeId);
        if (node) {
          this.selectedNodeId = nodeId;
          await this.expandGraphNode(node);
        }
      });

      this.graphInstance.on("node:mouseenter", async (event) => {
        const nodeId = event?.target?.id;
        if (!nodeId || nodeId === this.selectedNodeId) return;
        await this.applyFocusState(nodeId, false);
      });

      this.graphInstance.on("node:mouseleave", async () => {
        await this.applyFocusState(this.selectedNodeId || this.graphPayload.centerNodeId, false);
      });
    },

    async applyFocusState(nodeId, animate = true) {
      if (!this.graphInstance || !nodeId) return;
      const { nodes, edges } = this.getVisibleGraphPayload();
      const neighborIds = new Set([nodeId]);
      const states = {};

      edges.forEach((edge) => {
        const isRelated = edge.source === nodeId || edge.target === nodeId;
        states[edge.id] = isRelated ? ["active"] : ["dim"];
        if (isRelated) {
          neighborIds.add(edge.source);
          neighborIds.add(edge.target);
        }
      });

      nodes.forEach((node) => {
        if (node.id === nodeId) {
          states[node.id] = ["active"];
        } else if (neighborIds.has(node.id)) {
          states[node.id] = ["neighbor"];
        } else {
          states[node.id] = ["dim"];
        }
      });

      await this.graphInstance.setElementState(states, false);
      if (animate) {
        await this.graphInstance.focusElement(nodeId, { duration: 320, easing: "ease-in-out" });
      }
    },

    normalizeSelectedNode() {
      const visibleIds = new Set(this.getVisibleGraphPayload().nodes.map((node) => node.id));
      if (!visibleIds.has(this.selectedNodeId)) {
        this.selectedNodeId = visibleIds.has(this.graphPayload.centerNodeId)
          ? this.graphPayload.centerNodeId
          : this.getVisibleGraphPayload().nodes[0]?.id || "";
      }
    },

    async toggleTypeFilter(type) {
      const nextFilters = this.activeTypeFilters.includes(type)
        ? this.activeTypeFilters.filter((item) => item !== type)
        : [...this.activeTypeFilters, type];
      this.activeTypeFilters = nextFilters.length ? nextFilters : [...this.graphPayload.availableTypes];
      await nextTick();
      await this.renderGraph();
    },

    async resetGraphViewport() {
      if (!this.graphInstance) return;
      await this.graphInstance.fitView();
      await this.applyFocusState(this.selectedNodeId || this.graphPayload.centerNodeId, false);
    },

    destroyGraph() {
      if (this.graphClickTimer) {
        window.clearTimeout(this.graphClickTimer);
        this.graphClickTimer = 0;
      }
      if (this.graphInstance) {
        this.graphInstance.destroy();
        this.graphInstance = null;
      }
    },

    normalizeGraphPayload(payload) {
      const nodes = Array.isArray(payload?.nodes) ? payload.nodes : [];
      const edges = Array.isArray(payload?.edges) ? payload.edges : [];
      const availableTypes = Array.isArray(payload?.availableTypes)
        ? payload.availableTypes
        : [...new Set(nodes.map((node) => node.type).filter(Boolean))];

      return {
        centerNodeId: payload?.centerNodeId || nodes.find((node) => node.type === "artifact")?.id || "",
        narrative: payload?.narrative || "",
        availableTypes,
        stats: payload?.stats || {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          expandableCount: nodes.filter((node) => node.expandable).length,
        },
        nodes,
        edges,
      };
    },

    mergeGraphPayload(current, incoming) {
      const nodeMap = new Map((current.nodes || []).map((node) => [node.id, node]));
      const edgeMap = new Map((current.edges || []).map((edge) => [edge.id, edge]));

      (incoming.nodes || []).forEach((node) => nodeMap.set(node.id, { ...nodeMap.get(node.id), ...node }));
      (incoming.edges || []).forEach((edge) => edgeMap.set(edge.id, edge));

      const nodes = [...nodeMap.values()];
      const edges = [...edgeMap.values()];
      return {
        centerNodeId: current.centerNodeId || incoming.centerNodeId,
        narrative: current.narrative || incoming.narrative,
        availableTypes: [...new Set([...current.availableTypes, ...incoming.availableTypes])],
        stats: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          expandableCount: nodes.filter((node) => node.expandable).length,
        },
        nodes,
        edges,
      };
    },

    selectNode(node) {
      this.selectedNodeId = node.id;
    },

    selectNodeById(nodeId) {
      if (this.graphPayload.nodes.some((node) => node.id === nodeId)) {
        this.selectedNodeId = nodeId;
        this.applyFocusState(nodeId);
      }
    },

    typeLabel(type) {
      return (TYPE_META[type] || TYPE_META.node).label;
    },

    typeDescription(type) {
      return (TYPE_META[type] || TYPE_META.node).description;
    },

    getDefaultTypeFilters(availableTypes) {
      const availableSet = new Set(availableTypes || []);
      const defaults = DEFAULT_TYPE_FILTERS.filter((type) => availableSet.has(type));
      return defaults.length ? defaults : [...availableSet];
    },

    safeDecode(value) {
      try {
        return decodeURIComponent(value);
      } catch (error) {
        return value;
      }
    },

    reload() {
      this.errorMsg = "";
      this.isLoading = true;
      this.loadProgress = 0;
      this.loadModel();
    },

    goBack() {
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        this.$router.push("/");
      }
    },

    getModelViewportSize() {
      const wrapper = this.$refs.wrapperRef;
      if (!wrapper) return { width: 0, height: 0 };

      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      if (width <= 780) {
        return { width, height };
      }

      const panelWidth = Math.min(430, Math.max(width - 40, 0));
      const reservedRight = panelWidth + 40;
      return {
        width: Math.max(360, width - reservedRight),
        height,
      };
    },

    updateModelViewport() {
      if (!this.$refs.wrapperRef || !this.camera || !this.renderer) return;

      const wrapperWidth = this.$refs.wrapperRef.clientWidth;
      const wrapperHeight = this.$refs.wrapperRef.clientHeight;
      this.modelViewport = this.getModelViewportSize();

      this.camera.aspect = this.modelViewport.width / this.modelViewport.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(wrapperWidth, wrapperHeight);
    },

    applyModelViewport() {
      if (!this.renderer || !this.modelViewport.width || !this.modelViewport.height) return;
      this.renderer.setViewport(0, 0, this.modelViewport.width, this.modelViewport.height);
      this.renderer.setScissor(0, 0, this.modelViewport.width, this.modelViewport.height);
      this.renderer.setScissorTest(true);
    },

    onWindowResize() {
      if (!this.$refs.wrapperRef || !this.camera || !this.renderer) return;
      this.updateModelViewport();
      if (this.graphInstance && this.$refs.graphRef) {
        const graphWidth = Math.max(this.$refs.graphRef.clientWidth || 0, 320);
        const graphHeight = Math.max(this.$refs.graphRef.clientHeight || 0, 300);
        this.graphInstance.setSize(graphWidth, graphHeight);
      }
    },
  },

  beforeUnmount() {
    window.removeEventListener("resize", this.onWindowResize);
    this.destroyGraph();
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.controls) this.controls.dispose();
    if (this.renderer) this.renderer.dispose();
  },
};
</script>

<style scoped>
.three-wrapper {
  width: 100%;
  height: 100vh;
  position: relative;
  background:
    linear-gradient(120deg, rgba(16, 17, 13, 0.92), rgba(35, 37, 29, 0.82)),
    #12130f;
  overflow: hidden;
  z-index: 20;
}

.three-wrapper::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(210, 177, 103, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(210, 177, 103, 0.04) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0.55), transparent 72%);
  z-index: 1;
}

.back-button,
.artifact-ribbon,
.graph-panel {
  position: absolute;
  z-index: 30;
}

.back-button {
  top: 20px;
  left: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  color: #f7efe0;
  font-size: 14px;
  font-weight: 600;
  background: rgba(18, 20, 16, 0.72);
  border: 1px solid rgba(216, 180, 98, 0.32);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.back-button:hover {
  background: rgba(60, 86, 66, 0.84);
  border-color: rgba(216, 180, 98, 0.62);
  transform: translateX(-2px);
}

.back-button i {
  font-size: 12px;
}

.artifact-ribbon {
  left: 20px;
  bottom: 22px;
  min-width: 240px;
  padding: 14px 18px;
  color: #f6ead2;
  background: rgba(18, 20, 16, 0.68);
  border-left: 4px solid #d6b35f;
  border-radius: 8px;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(12px);
}

.artifact-ribbon span {
  display: block;
  margin-bottom: 5px;
  color: #c4b690;
  font-size: 12px;
}

.artifact-ribbon strong {
  font-size: 18px;
  letter-spacing: 0;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
  position: relative;
  z-index: 2;
}

.graph-panel {
  top: 20px;
  right: 20px;
  bottom: 20px;
  width: min(430px, calc(100vw - 40px));
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 18px;
  overflow-y: auto;
  overscroll-behavior: contain;
  color: #f7ecd7;
  background:
    linear-gradient(180deg, rgba(26, 31, 25, 0.9), rgba(14, 16, 13, 0.86)),
    rgba(18, 20, 16, 0.84);
  border: 1px solid rgba(214, 179, 95, 0.28);
  border-radius: 8px;
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.36);
  backdrop-filter: blur(8px);
}

.graph-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.graph-kicker {
  margin: 0 0 5px;
  color: #b6d3bd;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.graph-header h2 {
  margin: 0;
  color: #fff6df;
  font-size: 19px;
  line-height: 1.25;
  letter-spacing: 0;
}

.icon-button {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: #ead7a6;
  background: rgba(216, 180, 98, 0.1);
  border: 1px solid rgba(216, 180, 98, 0.28);
  border-radius: 8px;
  cursor: pointer;
}

.icon-button:hover {
  color: #ffffff;
  background: rgba(66, 102, 79, 0.42);
}

.graph-narrative {
  margin: 0;
  color: #c9c0a7;
  font-size: 12.5px;
  line-height: 1.65;
}

.graph-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.graph-stats span {
  min-width: 0;
  padding: 9px 8px;
  color: #cabf9c;
  text-align: center;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
}

.graph-stats strong {
  display: block;
  color: #f1d48d;
  font-size: 18px;
  line-height: 1.05;
}

.graph-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.type-filter,
.viewport-button {
  min-height: 28px;
  padding: 0 9px;
  color: #cfc2a6;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 6px;
  cursor: pointer;
}

.type-filter.active {
  color: #10130f;
  background: #d6b35f;
  border-color: #d6b35f;
}

.viewport-button {
  margin-left: auto;
  color: #f0d391;
  border-color: rgba(216, 180, 98, 0.28);
}

.viewport-button:hover,
.type-filter:hover {
  border-color: rgba(216, 180, 98, 0.6);
}

.graph-board {
  position: relative;
  height: clamp(280px, 38vh, 360px);
  min-height: 0;
  flex: 0 0 auto;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(216, 180, 98, 0.08), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(216, 180, 98, 0.18);
  border-radius: 8px;
  touch-action: none;
}

.g6-graph {
  width: 100%;
  height: 100%;
  min-height: 0;
  cursor: grab;
}

.g6-graph:active {
  cursor: grabbing;
}

.graph-empty,
.graph-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  padding: 24px;
  text-align: center;
}

.graph-empty strong {
  color: #f2dda8;
  font-size: 16px;
}

.graph-empty span {
  color: #bfb49a;
  font-size: 13px;
  line-height: 1.6;
}

.graph-loading {
  color: #f4dfa8;
  font-size: 13px;
  background: rgba(14, 16, 13, 0.62);
}

.graph-loading span {
  width: 22px;
  height: 22px;
  border: 2px solid rgba(244, 223, 168, 0.28);
  border-top-color: #f4dfa8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.node-inspector {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

.inspector-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.inspector-head p {
  margin: 0;
  color: #cfc2a6;
  font-size: 12px;
}

.type-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #8f8a72;
}

.type-artifact {
  background: #d6a84d;
}

.type-craft {
  background: #6ea37a;
}

.type-material {
  background: #b8a884;
}

.type-meaning {
  background: #d6b35f;
}

.type-motif {
  background: #c17f58;
}

.type-ritual {
  background: #7bb0a5;
}

.type-site {
  background: #76aebb;
}

.type-era {
  background: #b8ad83;
}

.node-inspector h3 {
  margin: 0;
  color: #fff4d8;
  font-size: 18px;
  line-height: 1.3;
  letter-spacing: 0;
}

.node-summary {
  margin: 0;
  color: #c7bea6;
  font-size: 12.5px;
  line-height: 1.65;
}

.relation-list {
  display: grid;
  gap: 7px;
  max-height: 104px;
  overflow: auto;
}

.relation-list button {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  padding: 8px 10px;
  color: #e9dcc2;
  background: rgba(20, 22, 18, 0.62);
  border: 1px solid rgba(216, 180, 98, 0.18);
  border-radius: 6px;
  cursor: pointer;
}

.relation-list span,
.relation-list strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.relation-list span {
  color: #acbda9;
  font-size: 12px;
  font-weight: 500;
}

.relation-list strong {
  color: #f2dfac;
  font-size: 12px;
}

.expand-button {
  width: 100%;
  min-height: 38px;
  color: #10130f;
  font-size: 13px;
  font-weight: 800;
  background: #d6b35f;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

.expand-button:disabled {
  color: rgba(244, 238, 222, 0.45);
  background: rgba(255, 255, 255, 0.08);
  cursor: not-allowed;
}

.graph-error {
  margin: 0;
  color: #ffd29a;
  font-size: 12px;
  line-height: 1.45;
}

.loading-mask,
.error-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.loading-mask {
  background: rgba(16, 17, 13, 0.88);
}

.loading-box {
  min-width: 240px;
  padding: 22px;
  color: #f6ead2;
  text-align: center;
  background: rgba(18, 20, 16, 0.86);
  border: 1px solid rgba(216, 180, 98, 0.26);
  border-radius: 8px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: #d6b35f;
  transition: width 0.2s;
}

.error-mask {
  flex-direction: column;
  background: rgba(16, 17, 13, 0.92);
}

.error-text {
  font-size: 16px;
  color: #ffd29a;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 8px 20px;
  background: #42664f;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .graph-panel {
    width: min(390px, calc(100vw - 40px));
  }

  .artifact-ribbon {
    bottom: auto;
    top: 72px;
  }
}

@media (max-width: 780px) {
  .back-button {
    top: 14px;
    left: 14px;
  }

  .artifact-ribbon {
    display: none;
  }

  .graph-panel {
    left: 12px;
    right: 12px;
    top: auto;
    bottom: 12px;
    width: auto;
    max-height: 56vh;
    padding: 14px;
    overflow: auto;
  }

  .graph-board {
    height: 260px;
  }

  .g6-graph {
    min-height: 0;
  }

  .graph-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
