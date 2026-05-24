<template>
  <div class="goods-container">
    <div class="shu-title-zone">
      <span class="title-decoration"></span>
      <h3>古蜀遗珍 · 3D 数字博物馆</h3>
    </div>

    <div class="goods-list">
      <div
        class="goods-item"
        :class="{ 'model-unavailable': !item.glbUrl }"
        v-for="(item, index) in goodsList"
        :key="index"
        @click="handleJump(item)"
      >
        <div class="goods-img">
          <img :src="item.imgUrl" :alt="item.name" />
          <div class="goods-era-tag">商周时期</div>
          <div v-if="!item.glbUrl" class="model-status">暂无 3D</div>
        </div>
        <div class="goods-desc">
          <h4>{{ item.name }}</h4>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "GoodsList",
  data() {
    return {
      // 彻底替换为纯正的古蜀文明藏品数据，保留你的 glbUrl 配置逻辑
      goodsList: [
        {
          entityId: "HI-2025-002",
          name: "商周金面具残片",
          desc: "古蜀神权政治的最高象征。面具整体精细贴合于青铜人头像表面，额头平齐，眉眼镂空，带有神圣而不可侵犯的威严之气。黄金与青铜的结合，构成了古蜀文明独特的祭祀美学。",
          imgUrl: "images/商周金面具残片.jpg",
          glbUrl: "glbs/黄金面具残片.glb",
        },
        {
          entityId: "HI-2025-003",
          name: '青铜纵目面具',
          desc: '三星堆最具标志性的青铜器之一。双眼呈柱状向前凸出达16厘米，双耳向两侧展开，被誉为“千里眼、顺风耳”，具有极高的人神沟通祭祀象征意义，尽显古蜀人夸张浪漫的想象力。',
          imgUrl: "images/青铜纵目面具.jpg",
          glbUrl: "glbs/纵目面具.glb", // 可根据你的真实文件名修改
        },
        {
          entityId: "HI-2025-006",
          name: '青铜神树',
          desc: '通高近4米，共有三层九枝，每枝上栖息一只神鸟。它完美印证了《山海经》中关于“扶桑”、“若木”等神树的记载，是古蜀人天地人神沟通、太阳崇拜的终极青铜重器。',
          imgUrl: "images/青铜神树.jpg",
          glbUrl: "glbs/青铜神树.glb",
        },
        {
          entityId: "HI-2025-004",
          name: "三星堆金杖",
          desc: "出土于三星堆遗址，古蜀文明代表性国宝。杖身錾刻人头、神鸟、鱼箭等神秘纹样，纹饰构图诡谲精巧，尽显古蜀先民超凡铸金技艺与独特信仰文化。",
          imgUrl: "images/三星堆金杖.jpg",
          glbUrl: "glbs/三星堆金杖.glb",
        },
        {
          entityId: "HI-2025-005",
          name: "青铜大立人像",
          desc: "被誉为“东方巨人”。人像高180厘米，身穿繁复的三层云雷纹法衣，双手环抱握成管状，神情庄重，仿佛正在主持一场极为隆重浩大的神殿祭祀仪式，是古蜀巫王或至高神职人员的写照。",
          imgUrl: "images/青铜大立人像.jpg",
          glbUrl: "glbs/青铜大立人像.glb",
        },
        {
          entityId: "HI-2025-001",
          name: "商周玉边璋",
          desc: "古蜀玉石工艺的巅峰代表。器身通体抛光精美，表面极度罕见地刻有古蜀人祭祀神山的精细图案（包括山川、人物、祭台等），是研究古蜀宗教仪式、服饰与信仰最珍贵的文字替代档案。",
          imgUrl: "images/商周玉边璋.jpg",
          glbUrl: "",
        },
      ],
    };
  },
  methods: {
    handleJump(item) {
      if (!item.glbUrl) {
        return;
      }

      this.$router.push({
        path: "/3d",
        query: {
          glbUrl: item.glbUrl,
          entityId: item.entityId,
          title: item.name,
        },
      });
    },
  },
};
</script>

<style scoped>
.goods-container {
  width: min(1180px, 94vw);
  margin: 24px auto 52px;
  padding: 20px 0 16px;
}

/* 古蜀文明风格标题区（辅以太阳神鸟金芒色） */
.shu-title-zone {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.title-decoration {
  width: 5px;
  height: 22px;
  background: #cfa95c; /* 古蜀金 */
  border-radius: 2px;
}

.goods-container h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #42664f; /* 主色：古蜀青铜绿 */
  letter-spacing: 2px;
}

/* 列表网格布局 */
.goods-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

/* 藏品卡片 */
.goods-item {
  position: relative;
  display: flex;
  gap: 18px;
  padding: 18px;
  border-radius: 12px;
  border: 1px solid rgba(66, 102, 79, 0.12);

  /* 泥土、古玉与青铜器斑驳感交织的微光微渐变背景 */
  background:
      radial-gradient(
          1200px 240px at 10% 0%,
          rgba(66, 102, 79, 0.12),
          transparent 45%
      ),
      linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.98),
          rgba(244, 248, 245, 0.96)
      );

  box-shadow:
      0 12px 32px rgba(66, 102, 79, 0.05),
      0 4px 10px rgba(17, 24, 39, 0.02);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.goods-item.model-unavailable {
  cursor: default;
}

.goods-item.model-unavailable .goods-img img {
  filter: grayscale(0.25);
}

.goods-item:hover {
  transform: translateY(-5px);
  border-color: #cfa95c; /* 悬浮时透出金沙面具般的细金边 */
  box-shadow:
      0 20px 48px rgba(66, 102, 79, 0.14),
      0 4px 12px rgba(17, 24, 39, 0.05);
}

/* 藏品图片包裹区 */
.goods-img {
  flex: 0 0 190px;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  background: #eef3ef;
  border: 1px solid rgba(66, 102, 79, 0.08);
}

/* 时代历史角标 */
.goods-era-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(66, 102, 79, 0.75);
  color: #cfa95c;
  padding: 2px 6px;
  font-size: 11px;
  border-radius: 4px;
  font-weight: 500;
  backdrop-filter: blur(2px);
}

.model-status {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 3px 7px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  background: rgba(31, 47, 37, 0.72);
  border-radius: 4px;
}

/* 探索出土时的流光流金动效 */
.goods-img::before {
  content: "";
  position: absolute;
  inset: -40% -30%;
  background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0) 30%,
      rgba(255, 255, 255, 0.4) 48%,
      rgba(255, 255, 255, 0) 66%
  );
  transform: translateX(-40%);
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.4s ease;
}

.goods-item:hover .goods-img::before {
  opacity: 1;
  transform: translateX(20%);
}

.goods-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.02);
  transition: transform 0.3s ease;
}

.goods-item:hover .goods-img img {
  transform: scale(1.06);
}

/* 藏品介绍文本区 */
.goods-desc {
  flex: 1;
  padding: 4px 4px 32px 0; /* 底部预留空间防止遮挡3D鉴赏按钮 */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: 0;
}

.goods-desc h4 {
  margin: 0 0 8px;
  color: #1e2c22;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.25s ease;
}

/* 整个卡片 hover 时，标题变为古蜀青铜绿 */
.goods-item:hover .goods-desc h4 {
  color: #42664f;
}

.goods-desc p {
  margin: 0;
  color: #5d6f64;
  font-size: 13.5px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ================= 重点交互：3D鉴赏按钮样式及 hover 反转 ================= */
.goods-desc::before {
  content: "3D 鉴赏 🔱";
  position: absolute;
  right: 24px;
  bottom: 18px;
  padding: 5px 14px;
  border-radius: 6px; /* 小硬朗圆角，更贴近重器金属线条 */
  background: #ffffff;
  border: 1px solid #42664f; /* 初始边框采用古蜀绿 */
  color: #42664f;            /* 初始文字采用古蜀绿 */
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transform: translateY(4px);
  opacity: 0;
  transition: all 0.25s cubic-bezier(0.165, 0.84, 0.44, 1);
}

/* 1. 当鼠标移入整个藏品卡片时：按钮轻微滑出、浮现（绿字白底） */
.goods-item:hover .goods-desc::before {
  opacity: 1;
  transform: translateY(0);
}

/* 2. 当鼠标精准划入按钮/文本激活区域时：背景完美反转为 #42664f 全实色，文字变纯白 */
.goods-item:hover .goods-desc:hover::before {
  background: #42664f !important;
  color: #ffffff !important;
  border-color: #42664f !important;
  box-shadow: 0 4px 12px rgba(66, 102, 79, 0.25);
}

/* 移动端屏幕深度优化适配 */
@media (max-width: 768px) {
  .goods-list {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .goods-item {
    padding: 14px;
    gap: 14px;
  }

  .goods-img {
    flex-basis: 140px;
    height: 110px;
  }

  .goods-desc {
    padding-bottom: 24px;
  }

  .goods-desc h4 {
    font-size: 16px;
  }

  .goods-desc p {
    font-size: 13px;
    -webkit-line-clamp: 2; /* 移动端屏幕高度紧凑，简介改为展示2行 */
  }

  /* 移动端取消悬浮逻辑，按钮默认保持直接展示，提升移动设备触控直观度 */
  .goods-desc::before {
    opacity: 1;
    transform: translateY(0);
    right: 14px;
    bottom: 12px;
    padding: 3px 8px;
  }
}
</style>
