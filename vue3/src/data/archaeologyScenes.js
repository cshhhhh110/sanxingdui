// 考古全景漫游场景配置数据

export const archaeologyScenes = [
  {
    id: 1,
    name: '三星堆遗址入口',
    nameEn: 'Site Entrance',
    panorama: '/images/archaeology/panoramas/scene1-entrance.jpg',
    mapX: 150,
    mapY: 120,
    unlocked: true,
    description: '欢迎来到三星堆考古遗址。这里是古蜀文明的核心区域，1929年首次发现，1986年和2021年进行了重大发掘。',
    aiGuide: '欢迎来到三星堆遗址入口！我是你的AI考古导师玄喵。点击场景中的标记开始探索吧~',
    bgm: '/audio/ambient-archaeology.mp3',

    hotspots: [
      {
        id: 'entrance-info',
        type: 'info',
        title: '遗址信息牌',
        position: { longitude: 0, latitude: 10 },
        description: '三星堆遗址位于四川省广汉市，距今约3000-5000年，是古蜀文明的重要代表。遗址面积约12平方公里，是迄今在西南地区发现的范围最大、延续时间最长、文化内涵最丰富的古城、古国、古蜀文化遗址。',
        image: '/images/archaeology/info-board.jpg',
        icon: 'ℹ️',
        aiComment: '三星堆遗址是20世纪人类最重大的考古发现之一，被誉为"长江文明之源"。',
        actions: [
          { label: '查看遗址历史', type: 'history' },
          { label: '查看发掘时间线', type: 'timeline' }
        ]
      },
      {
        id: 'entrance-map',
        type: 'tool',
        title: '遗址导览图',
        position: { longitude: 45, latitude: 5 },
        description: '三星堆遗址包含8个祭祀坑、古城墙遗址、大型建筑基址等重要考古发现点。',
        image: '/images/archaeology/site-map.jpg',
        icon: '🗺️',
        aiComment: '这张地图显示了遗址的整体布局，你可以按照标记点依次探索。',
        actions: [
          { label: '查看完整地图', type: 'map' }
        ]
      },
      {
        id: 'entrance-tools',
        type: 'tool',
        title: '考古工具箱',
        position: { longitude: -30, latitude: -5 },
        description: '考古发掘需要使用专业工具：手铲、刷子、测绘仪、相机等。每件工具都有特定的用途和使用规范。',
        image: '/images/archaeology/tools.jpg',
        icon: '🔧',
        aiComment: '考古是一门严谨的科学，需要使用专业工具小心翼翼地揭示历史。',
        content: {
          tools: [
            { name: '手铲', usage: '精确清理泥土，控制力度避免损坏文物' },
            { name: '软刷', usage: '清理文物表面的浮土' },
            { name: '测绘仪', usage: '记录文物的精确位置和深度' },
            { name: '相机', usage: '记录发掘过程和文物出土状态' }
          ]
        },
        actions: [
          { label: '了解考古流程', type: 'process' }
        ]
      }
    ]
  },

  {
    id: 2,
    name: '1号祭祀坑发掘现场',
    nameEn: 'Pit No.1 Excavation Site',
    panorama: '/images/archaeology/panoramas/scene2-pit1.jpg',
    mapX: 280,
    mapY: 180,
    unlocked: false,
    description: '1986年7月首次发现的祭祀坑，坑内出土了大量青铜器、玉石器、象牙等珍贵文物。',
    aiGuide: '这里是1号祭祀坑，1986年夏天考古队在此有了惊人发现。让我们看看当年的发掘现场吧...',
    bgm: '/audio/pit-exploration.mp3',

    hotspots: [
      {
        id: 'pit1-bronze',
        type: 'artifact',
        title: '青铜器堆积区',
        position: { longitude: 45, latitude: -20 },
        description: '1986年7月，考古队在坑位东北角发现大量青铜器碎片，包括青铜面具、人头像等。这些器物被有意识地破坏后埋入坑中，体现了古蜀人独特的祭祀仪式。',
        image: '/images/archaeology/pit1-bronze-cluster.jpg',
        icon: '🏺',
        aiComment: '这些青铜器在埋藏前被故意打碎，这是古蜀祭祀仪式的重要特征。',
        timeline: [
          { time: '1986.07.18', event: '发现青铜器碎片' },
          { time: '1986.07.25', event: '清理出3件青铜面具' },
          { time: '1986.08.10', event: '发现5件青铜人头像' }
        ],
        inventory: ['青铜面具×3', '青铜人头像×5', '青铜器碎片×200+'],
        actions: [
          { label: '查看出土清单', type: 'inventory' },
          { label: '3D查看文物', type: '3d', artifactId: 'HI-2025-001' }
        ]
      },
      {
        id: 'pit1-ivory',
        type: 'artifact',
        title: '象牙层',
        position: { longitude: -45, latitude: -15 },
        description: '坑底西南角发现67根象牙，每根长约1.2米。象牙在古蜀文明中具有特殊地位，可能象征财富和权力。',
        image: '/images/archaeology/pit1-ivory.jpg',
        icon: '🦴',
        aiComment: '为什么祭祀坑要放这么多象牙？这是考古学家一直在研究的谜题。有学者认为象牙代表与神灵沟通的媒介。',
        mystery: '古蜀地区并不产象，这些象牙从何而来？是否说明古蜀与南方地区有贸易往来？',
        actions: [
          { label: '询问AI专家', type: 'ask-ai' },
          { label: '查看相关研究', type: 'research' }
        ]
      },
      {
        id: 'pit1-grid',
        type: 'info',
        title: '测绘网格',
        position: { longitude: 0, latitude: -25 },
        description: '考古发掘采用标准网格法，将坑位划分为若干个1×1米的方格，逐格清理并记录文物位置。这种方法确保了发掘的科学性和准确性。',
        image: '/images/archaeology/excavation-grid.jpg',
        icon: '📐',
        aiComment: '每一格都有编号，出土的每件文物都要记录在哪一格、哪一层发现，这样才能还原当时的埋藏状态。',
        interactive: {
          type: 'grid-simulation',
          description: '拖动滑块模拟按网格清理泥土的过程'
        },
        actions: [
          { label: '体验网格发掘', type: 'interactive' }
        ]
      },
      {
        id: 'pit1-layer',
        type: 'info',
        title: '地层剖面',
        position: { longitude: 90, latitude: 0 },
        description: '通过观察坑壁的地层剖面，可以判断遗址的年代和形成过程。',
        image: '/images/archaeology/soil-layers.jpg',
        icon: '🪨',
        aiComment: '地层学是考古断代的重要方法。越深的地层年代越早，这就是"地层叠压法则"。',
        content: {
          layers: [
            { depth: '0-30cm', name: '现代填土', color: '灰褐色', period: '现代' },
            { depth: '30-80cm', name: '汉代文化层', color: '黄褐色', period: '汉代' },
            { depth: '80-200cm', name: '商周文化层', color: '红褐色', period: '商周（祭祀坑年代）' },
            { depth: '200cm+', name: '生土层', color: '黄色', period: '更早期' }
          ]
        },
        actions: [
          { label: '学习地层断代', type: 'learn' }
        ]
      },
      {
        id: 'pit1-diary',
        type: 'person',
        title: '考古队员日志',
        position: { longitude: -90, latitude: 5 },
        description: '1986年7月的考古日志记录了激动人心的发现过程。',
        image: '/images/archaeology/diary.jpg',
        icon: '📝',
        aiComment: '这是当年考古队长陈德安先生的手写日志，记录了那个夏天的重大发现。',
        content: {
          diary: `1986年7月18日 晴

今天是发掘的第5天。上午9点，队员小王在1号坑东北角清理时，发现了一片青铜碎片。我们立即停止作业，改用软刷小心清理。

随着泥土被一层层剥离，一个青铜面具的轮廓逐渐显现。面具有夸张的大眼睛和高鼻梁，造型极为奇特，与中原青铜器完全不同。

下午3点，又在旁边发现了第二件面具。大家都非常激动，我意识到这可能是一个重大发现。

—— 陈德安`
        },
        actions: [
          { label: '阅读更多日志', type: 'diary' }
        ]
      }
    ]
  },

  {
    id: 3,
    name: '2号祭祀坑（青铜神树）',
    nameEn: 'Pit No.2 - Bronze Sacred Tree',
    panorama: '/images/archaeology/panoramas/scene3-pit2.jpg',
    mapX: 420,
    mapY: 200,
    unlocked: false,
    description: '2号祭祀坑是三星堆最重要的发现之一，青铜神树、大立人等国宝级文物均出土于此。',
    aiGuide: '2号祭祀坑比1号坑更大，出土的文物也更加震撼。青铜神树就是在这里发现的！',

    hotspots: [
      {
        id: 'pit2-tree',
        type: 'artifact',
        title: '青铜神树（出土状态）',
        position: { longitude: 0, latitude: -15 },
        description: '1986年8月发现，高达3.96米的青铜神树是世界上最大的青铜器之一。发现时树干断裂成3段，经过修复重新矗立。',
        image: '/images/archaeology/sacred-tree-excavation.jpg',
        icon: '🌳',
        aiComment: '这棵青铜神树可能代表古蜀人心目中的"建木"——连接天地的神树。',
        timeline: [
          { time: '1986.08.12', event: '发现树干第一段' },
          { time: '1986.08.15', event: '发现树顶部分' },
          { time: '1986.09.20', event: '清理完毕，准备起吊' },
          { time: '1987-2000', event: '修复工作进行中' },
          { time: '2021.03.20', event: '3D扫描建模完成' }
        ],
        video: '/videos/tree-discovery.mp4',
        actions: [
          { label: '观看发现视频', type: 'video' },
          { label: '查看修复过程', type: 'restoration' },
          { label: '3D查看神树', type: '3d', artifactId: 'sacred-tree' }
        ]
      },
      {
        id: 'pit2-standing',
        type: 'artifact',
        title: '青铜大立人',
        position: { longitude: 60, latitude: -10 },
        description: '高达2.62米的青铜大立人是三星堆的标志性文物，可能代表古蜀王或大祭司。',
        image: '/images/archaeology/standing-figure.jpg',
        icon: '🧍',
        aiComment: '大立人双手呈环抱状，可能原本握有权杖或其他器物。他的身份至今仍是谜。',
        actions: [
          { label: '3D查看大立人', type: '3d' }
        ]
      },
      {
        id: 'pit2-record',
        type: 'info',
        title: '出土文物记录表',
        position: { longitude: -60, latitude: 0 },
        description: '考古队详细记录了每件文物的出土位置、状态和编号。',
        image: '/images/archaeology/record-table.jpg',
        icon: '📋',
        content: {
          table: `三星堆遗址2号祭祀坑出土文物登记表

编号    名称            数量  位置      状态
--------------------------------------------------------
K2:1    青铜神树        1件   中央      破损（已修复）
K2:2    青铜大立人      1件   东侧      完整
K2:3    青铜人头像     23件   西北角    完整
K2:4    金面罩          4件   南侧      完整
K2:5    玉石器         89件   四周      部分破损
K2:6    象牙           41根   坑底      完整`
        },
        actions: [
          { label: '下载完整清单', type: 'download' }
        ]
      },
      {
        id: 'pit2-quiz',
        type: 'mystery',
        title: '考古知识问答',
        position: { longitude: 90, latitude: 10 },
        description: '测试你的考古知识！如果你是考古队员，发现这棵神树时会怎么做？',
        icon: '❓',
        aiComment: '来挑战一下吧！正确的考古操作对文物保护至关重要。',
        quiz: {
          question: '发现青铜神树时，首先应该做什么？',
          options: [
            { text: '立即用手拿出来', correct: false, feedback: '❌ 错误！直接触摸可能损坏文物表面。' },
            { text: '拍照记录位置后，用专业工具小心提取', correct: true, feedback: '✅ 正确！必须先记录原始状态。' },
            { text: '先清理周边泥土，绘制平面图', correct: true, feedback: '✅ 正确！了解文物周边情况很重要。' },
            { text: '呼叫更多专家来现场', correct: true, feedback: '✅ 正确！重大发现需要专家团队共同决策。' }
          ]
        },
        actions: [
          { label: '开始答题', type: 'quiz' }
        ]
      }
    ]
  },

  {
    id: 4,
    name: '文物清理修复室',
    nameEn: 'Conservation Lab',
    panorama: '/images/archaeology/panoramas/scene4-lab.jpg',
    mapX: 550,
    mapY: 160,
    unlocked: false,
    description: '出土文物需要经过专业的清理和修复才能展出。这里是文物保护的幕后工作间。',
    aiGuide: '文物出土后的工作才刚刚开始。让我们看看修复师如何让文物重现光彩。',

    hotspots: [
      {
        id: 'lab-workbench',
        type: 'tool',
        title: '修复工作台',
        position: { longitude: 0, latitude: -10 },
        description: '正在修复的黄金面具。修复工作需要极高的专业技能和耐心。',
        image: '/images/archaeology/restoration-bench.jpg',
        icon: '🔬',
        content: {
          steps: [
            { step: 1, name: '清洗', description: '使用专业溶剂去除泥土和锈迹' },
            { step: 2, name: '加固', description: '涂抹保护剂防止进一步腐蚀' },
            { step: 3, name: '拼接', description: '将碎片拼回原状' },
            { step: 4, name: '记录', description: '拍照、3D扫描记录修复过程' }
          ]
        },
        actions: [
          { label: '查看修复流程', type: 'process' }
        ]
      },
      {
        id: 'lab-xray',
        type: 'tool',
        title: 'X光透视仪',
        position: { longitude: 60, latitude: 5 },
        description: 'X光检查可以透视文物内部结构，发现肉眼看不到的细节。',
        image: '/images/archaeology/xray-machine.jpg',
        icon: '📡',
        actions: [
          { label: '查看X光片', type: 'xray' }
        ]
      },
      {
        id: 'lab-interview',
        type: 'person',
        title: '修复师访谈',
        position: { longitude: -60, latitude: 0 },
        description: '听修复师讲述修复青铜神树的故事。',
        image: '/images/archaeology/conservator.jpg',
        icon: '👨‍🔬',
        video: '/videos/conservator-interview.mp4',
        actions: [
          { label: '播放访谈视频', type: 'video' }
        ]
      }
    ]
  },

  {
    id: 5,
    name: '3号祭祀坑（2021新发现）',
    nameEn: 'Pit No.3 - New Discovery 2021',
    panorama: '/images/archaeology/panoramas/scene5-pit3.jpg',
    mapX: 420,
    mapY: 320,
    unlocked: false,
    description: '2021年新发掘的祭祀坑，采用了最先进的考古技术。',
    aiGuide: '这是2021年最新发掘的3号坑，让我们看看现代考古技术的进步！',

    hotspots: [
      {
        id: 'pit3-compare',
        type: 'info',
        title: '1986 vs 2021对比',
        position: { longitude: 0, latitude: 0 },
        description: '左右对比展示考古技术35年来的巨大进步。',
        icon: '⚖️',
        content: {
          comparison: [
            { aspect: '防护', old: '简易棚架', new: '恒温恒湿透明舱' },
            { aspect: '清理', old: '手工刷土', new: '机械臂辅助' },
            { aspect: '记录', old: '手绘+照相', new: '3D扫描+实时建模' },
            { aspect: '监测', old: '人工巡视', new: '24小时智能监控' }
          ]
        },
        actions: [
          { label: '查看详细对比', type: 'compare' }
        ]
      },
      {
        id: 'pit3-monitor',
        type: 'tool',
        title: '实时监控屏',
        position: { longitude: 60, latitude: -10 },
        description: '模拟监控画面，显示温湿度、氧气含量等环境数据。',
        icon: '📺',
        content: {
          data: {
            temperature: '20±2℃',
            humidity: '55±5%',
            oxygen: '21%',
            status: '正常'
          }
        }
      },
      {
        id: 'pit3-newartifacts',
        type: 'artifact',
        title: '新出土文物',
        position: { longitude: -60, latitude: -5 },
        description: '圆口铜尊、铜扭头跪坐人像等2021年新发现的文物。',
        icon: '✨',
        aiComment: '这些是"热乎乎"的文物，刚刚出土不久！',
        actions: [
          { label: '查看新发现', type: 'gallery' }
        ]
      }
    ]
  },

  {
    id: 6,
    name: '金沙遗址祭祀区',
    nameEn: 'Jinsha Site',
    panorama: '/images/archaeology/panoramas/scene6-jinsha.jpg',
    mapX: 580,
    mapY: 280,
    unlocked: false,
    description: '金沙遗址是三星堆文明的延续，出土了著名的太阳神鸟金饰。',
    aiGuide: '金沙遗址距离三星堆约50公里，被认为是三星堆衰落后古蜀人的新都城。',

    hotspots: [
      {
        id: 'jinsha-sunbird',
        type: 'artifact',
        title: '太阳神鸟金饰',
        position: { longitude: 0, latitude: -10 },
        description: '太阳神鸟金饰是中国文化遗产标志，展现了古蜀人精湛的金器制作工艺。',
        icon: '☀️',
        actions: [
          { label: '3D查看太阳神鸟', type: '3d' }
        ]
      },
      {
        id: 'jinsha-compare',
        type: 'info',
        title: '与三星堆的关系',
        position: { longitude: 60, latitude: 0 },
        description: '金沙与三星堆在器物风格、祭祀方式上有诸多相似之处，说明文化的传承关系。',
        icon: '🔗',
        aiComment: '两个遗址相距约50公里，年代上金沙晚于三星堆，可能是古蜀王国迁都后的新都城。'
      }
    ]
  },

  {
    id: 7,
    name: '宝墩遗址（史前聚落）',
    nameEn: 'Baodun Site',
    panorama: '/images/archaeology/panoramas/scene7-baodun.jpg',
    mapX: 150,
    mapY: 350,
    unlocked: false,
    description: '距今约4500年的宝墩文化是古蜀文明的源头。',
    aiGuide: '在三星堆之前，古蜀人已经在成都平原建立了城市。宝墩遗址展示了文明的起源。',

    hotspots: [
      {
        id: 'baodun-wall',
        type: 'info',
        title: '古城墙遗迹',
        position: { longitude: 0, latitude: 0 },
        description: '宝墩古城是中国西南地区最早的城址之一，城墙宽达40米。',
        icon: '🧱'
      },
      {
        id: 'baodun-timeline',
        type: 'info',
        title: '古蜀文明演变时间轴',
        position: { longitude: -60, latitude: -10 },
        description: '从宝墩文化到三星堆，再到金沙，古蜀文明延续了2000多年。',
        icon: '📅',
        content: {
          timeline: [
            { period: '约公元前2500年', event: '宝墩文化兴起' },
            { period: '约公元前1600年', event: '三星堆文明鼎盛' },
            { period: '约公元前1000年', event: '金沙遗址出现' },
            { period: '约公元前316年', event: '秦灭古蜀' }
          ]
        }
      }
    ]
  },

  {
    id: 8,
    name: '三星堆博物馆展厅',
    nameEn: 'Museum Exhibition Hall',
    panorama: '/images/archaeology/panoramas/scene8-museum.jpg',
    mapX: 350,
    mapY: 420,
    unlocked: false,
    description: '探索之旅的终点。在这里可以看到修复后的文物精品。',
    aiGuide: '恭喜你完成了考古探索之旅！现在让我们在博物馆欣赏这些珍贵的文物吧。',

    hotspots: [
      {
        id: 'museum-showcase',
        type: 'artifact',
        title: '精品文物展柜',
        position: { longitude: 0, latitude: 0 },
        description: '青铜神树、大立人、黄金面具等国宝级文物在此展出。',
        icon: '🏛️',
        actions: [
          { label: '浏览全部展品', type: 'gallery' }
        ]
      },
      {
        id: 'museum-journey',
        type: 'info',
        title: '从发掘到展览',
        position: { longitude: 60, latitude: -5 },
        description: '回顾文物从出土、修复到展览的完整历程。',
        icon: '🎬',
        actions: [
          { label: '查看完整流程', type: 'journey' }
        ]
      },
      {
        id: 'museum-certificate',
        type: 'info',
        title: '领取考古证书',
        position: { longitude: -60, latitude: -5 },
        description: '完成全部探索后，可以生成个性化的考古实习证书。',
        icon: '🏆',
        aiComment: '恭喜你完成了三星堆考古探索！点击生成你的专属证书吧！',
        actions: [
          { label: '生成考古证书', type: 'certificate' }
        ]
      }
    ]
  }
];

// 地图SVG路径数据（用于绘制场景连线）
export const sceneConnections = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 3, to: 5 },
  { from: 5, to: 6 },
  { from: 1, to: 7 },
  { from: 6, to: 8 },
  { from: 7, to: 8 }
];
