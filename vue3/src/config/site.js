/**
 * 站点配置文件
 * 统一管理站点信息、描述、版权等
 */

export const siteConfig = {
  // 站点基本信息
  name: '青铜数元',
  shortName: '青铜数元',
  description: 'AI赋能三星堆文化传播与沉浸式认知',
  slogan: '玄喵引路，让三星堆文物开口说话',
  
  // Logo配置
  logo: {
    icon: '/src/assets/logo.png', // Logo图片路径
    text: '青铜数元'
  },
  
  // 后台管理系统配置
  admin: {
    name: '青铜数元管理端',
    shortName: '管理后台',
    logo: {
      icon: '/src/assets/logo.png', // Logo图片路径
      text: '青铜数元管理端'
    }
  },
  
  // 版权信息
  copyright: {
    year: '2026',
    icp: '', // ICP备案号
    text: ''
  },
  
  // 联系方式
  contact: {
    email: 'support@intangible-heritage.com',
    phone: '400-888-6688',
    address: '北京市东城区非遗文化街1号'
  },
  
  // 社交媒体
  social: {
    wechat: '',
    weibo: '',
    qq: ''
  },
  
  // 页脚链接
  footerLinks: [
    { text: '关于我们', url: '/about' },
    { text: '隐私政策', url: '/privacy' },
    { text: '用户协议', url: '/terms' },
    { text: '联系我们', url: '/contact' }
  ],
  
  // SEO配置
  seo: {
    keywords: '非遗,非物质文化遗产,传统文化,匠心传承,技艺保护',
    author: '非遗传承团队'
  },
  
  // UI主题配置（新中式风格）
  theme: {
    colors: {
      primary: '#2C2C2C',      // 墨韵黑
      secondary: '#D4282D',    // 朱砂红
      accent: '#7BA4A8',       // 青瓷蓝
      background: '#F8F5F0',   // 宣纸白
      highlight: '#C5A572',    // 金箔黄
      text: {
        primary: '#2C2C2C',
        secondary: '#666666',
        light: '#999999'
      }
    },
    fonts: {
      title: '"Source Han Serif CN", "思源宋体", serif',
      body: '"Source Han Sans CN", "思源黑体", sans-serif'
    }
  }
}

/**
 * 获取完整的版权信息
 */
export function getCopyright() {
  return `© ${siteConfig.copyright.year} ${siteConfig.copyright.owner}. All rights reserved.`
}

/**
 * 获取站点标题（用于页面title）
 */
export function getSiteTitle(pageTitle = '') {
  return pageTitle ? `${pageTitle} - ${siteConfig.name}` : siteConfig.name
}

/**
 * 获取后台标题
 */
export function getAdminTitle(pageTitle = '') {
  return pageTitle ? `${pageTitle} - ${siteConfig.admin.name}` : siteConfig.admin.name
}

export default siteConfig
