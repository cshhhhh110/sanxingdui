/**
 * 自然语言意图解析器
 * 将用户的自然语言转换为 MCP 工具调用
 */

import { INTENT_KEYWORDS, ROUTE_MAPPINGS, MCP_TOOL_CATEGORIES } from './config'
import { MCP_TOOLS, getToolList } from './tools'

/**
 * 意图类型枚举
 */
export const IntentType = {
  NAVIGATION: 'navigation',
  SEARCH: 'search',
  ACTION: 'action',
  QUESTION: 'question',
  GREETING: 'greeting',
  UNKNOWN: 'unknown',
}

/**
 * 自然语言意图解析器类
 */
export class IntentParser {
  constructor() {
    this.context = null
    this.history = [] // 对话历史
  }

  /**
   * 解析用户输入的自然语言
   * @param {string} text - 用户输入
   * @param {object} context - 上下文信息（当前页面、用户信息等）
   * @returns {object} 解析结果 { intent, params, tool, confidence }
   */
  parse(text, context = {}) {
    this.context = context
    const normalizedText = this.normalizeText(text)
    
    // 调试日志：打印原始输入
    console.log('[MCP] ====== 意图解析开始 ======')
    console.log('[MCP] 原始输入:', text)
    console.log('[MCP] 归一化文本:', normalizedText)
    
    // 1. 检查是否是问候语
    if (this.isGreeting(normalizedText)) {
      console.log('[MCP] 识别为: 问候语')
      console.log('[MCP] ====== 意图解析结束 ======\n')
      return this.buildResult(IntentType.GREETING, null, null, 1.0)
    }

    // 2. 【关键】尝试解析问答意图 - 问句优先交给AI回答
    const questionResult = this.parseQuestion(text)
    console.log('[MCP] 问答解析结果:', { confidence: questionResult.confidence, tool: questionResult.tool })
    if (questionResult.confidence > 0.8) {
      console.log('[MCP] 识别为: 问句 → AI回答')
      console.log('[MCP] ====== 意图解析结束 ======\n')
      return questionResult
    }

    // 3. 尝试解析操作意图（点赞、收藏、报名等明确的动作指令）
    const actionResult = this.parseAction(normalizedText)
    console.log('[MCP] 操作解析结果:', { confidence: actionResult.confidence, tool: actionResult.tool, message: actionResult.message })
    if (actionResult.confidence > 0.8) {
      console.log('[MCP] 识别为: 操作指令')
      console.log('[MCP] ====== 意图解析结束 ======\n')
      return actionResult
    }

    // 4. 尝试解析搜索意图
    const searchResult = this.parseSearch(normalizedText)
    console.log('[MCP] 搜索解析结果:', { confidence: searchResult.confidence, tool: searchResult.tool })
    if (searchResult.confidence > 0.7) {
      console.log('[MCP] 识别为: 搜索')
      console.log('[MCP] ====== 意图解析结束 ======\n')
      return searchResult
    }

    // 5. 尝试解析导航意图（仅处理明确的导航指令）
    const navResult = this.parseNavigation(normalizedText)
    console.log('[MCP] 导航解析结果:', { confidence: navResult.confidence, tool: navResult.tool })
    if (navResult.confidence > 0.85) {
      console.log('[MCP] 识别为: 导航')
      console.log('[MCP] ====== 意图解析结束 ======\n')
      return navResult
    }

    // 6. 兜底：交给AI处理
    console.log('[MCP] 无法识别 → 兜底: 交给AI')
    console.log('[MCP] ====== 意图解析结束 ======\n')
    return this.buildResult(IntentType.UNKNOWN, null, null, 0.2, '抱歉，我不太理解您的意思，请试试说"帮我导航到xxx"或"搜索xxx"')
  }

  /**
   * 文本归一化处理
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[？?。，！!.,]/g, '')
  }

  /**
   * 检查是否是问候语
   */
  isGreeting(text) {
    const greetings = ['你好', 'hi', 'hello', '嗨', '在吗', '在么', '你好呀', '哈喽']
    return greetings.some(g => text.includes(g) && text.length < 10)
  }

  /**
   * 检查是否是问句（询问类问题应该交给AI回答）
   */
  isQuestion(text, normalizedText) {
    // 1. 标点符号判断：包含问号
    if (text.includes('?') || text.includes('？')) {
      return true
    }

    // 2. 疑问词判断（问号可能被省略）
    const questionKeywords = ['什么', '怎么', '如何', '为什么', '多少', '是谁', '哪有', '哪的',
      '吗', '嘛', '呢', '是不是', '能不能', '会不会', '好不好', '谁', '哪', '几', '怎样',
      '请问', '请教', '问一下', '问一下', '问一下', '我想知道', '想问']
    if (questionKeywords.some(k => normalizedText.includes(k))) {
      return true
    }

    // 3. 句式判断：以"我想问一下"等开头
    const questionPatterns = [/^我想问一下/, /^请问/, /^请教/, /^问一下/, /^问/, /^我想知道/]
    if (questionPatterns.some(p => p.test(text))) {
      return true
    }

    return false
  }

  /**
   * 解析导航意图
   * 例如："去首页"、"打开非遗页面"、"跳转到活动中心"
   * 注意：只有包含明确的导航动词才认为是导航指令
   */
  parseNavigation(text) {
    // 明确的导航动词
    const navVerbs = ['去', '打开', '跳转到', '跳到', '进入', '访问', '前往', '回到', '返回到']
    
    // 检查是否包含导航动词
    const hasNavVerb = navVerbs.some(v => text.includes(v))
    
    // 如果没有导航动词，不视为导航指令
    if (!hasNavVerb) {
      return this.buildResult(IntentType.NAVIGATION, null, null, 0)
    }

    // 遍历所有路由映射
    for (const [routeKey, keywords] of Object.entries(ROUTE_MAPPINGS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return this.buildResult(
            IntentType.NAVIGATION,
            { destination: routeKey },
            'navigate_to',
            0.95,
            `正在前往${keyword}...`
          )
        }
      }
    }

    return this.buildResult(IntentType.NAVIGATION, null, null, 0)
  }

  /**
   * 解析搜索意图
   * 例如："搜索青铜器"、"查找三星堆文物"
   */
  parseSearch(text) {
    // 搜索关键词
    const searchKeywords = ['搜索', '查找', '找', '查询']
    
    for (const keyword of searchKeywords) {
      if (text.includes(keyword)) {
        // 提取搜索内容
        const searchContent = text.split(keyword)[1]?.trim()
        
        if (searchContent && searchContent.length > 0) {
          // 检查是否指定了分类
          let category = null
          for (const [catKey, catKeywords] of Object.entries(ROUTE_MAPPINGS)) {
            for (const catKeyword of catKeywords) {
              if (searchContent.includes(catKeyword)) {
                category = catKey
                break
              }
            }
          }

          return this.buildResult(
            IntentType.SEARCH,
            { 
              keyword: searchContent,
              category
            },
            'search_heritage',
            0.9,
            `正在搜索"${searchContent}"...`
          )
        }
      }
    }

    // "看看有什么xxx" 句式
    const seePattern = /看看有什么(.+)/
    const match = text.match(seePattern)
    if (match) {
      return this.buildResult(
        IntentType.SEARCH,
        { keyword: match[1] },
        'search_heritage',
        0.85,
        `正在查找${match[1]}...`
      )
    }

    return this.buildResult(IntentType.SEARCH, null, null, 0)
  }

  /**
   * 解析操作意图
   * 例如："收藏这个"、"报名活动"
   */
  parseAction(text) {
    // 收藏/点赞操作
    if (this.containsAny(text, INTENT_KEYWORDS.like)) {
      if (this.context.currentArtifact) {
        return this.buildResult(
          IntentType.ACTION,
          { 
            action: 'like',
            artifact_id: this.context.currentArtifact
          },
          null,
          0.85,
          '已为您收藏'
        )
      }
      return this.buildResult(
        IntentType.ACTION,
        { action: 'like' },
        null,
        0.6,
        '请先选择一个文物'
      )
    }

    // 报名操作
    if (this.containsAny(text, INTENT_KEYWORDS.book)) {
      // 检查是否有活动ID上下文
      if (this.context.currentActivity) {
        return this.buildResult(
          IntentType.ACTION,
          { 
            action: 'book_activity',
            activity_id: this.context.currentActivity,
            confirm: text.includes('确认') || text.includes('好的') || text.includes('是')
          },
          'book_activity',
          0.9,
          '正在为您报名...'
        )
      }
      
      // 如果没有上下文，解析活动名称
      const activityMatch = this.extractActivityName(text)
      if (activityMatch) {
        return this.buildResult(
          IntentType.ACTION,
          { 
            action: 'book_activity',
            activity_name: activityMatch,
            confirm: text.includes('确认') || text.includes('好的') || text.includes('是')
          },
          'book_activity',
          0.85,
          `正在报名"${activityMatch}"...`
        )
      }

      return this.buildResult(
        IntentType.ACTION,
        { action: 'book_activity' },
        null,
        0.5,
        '请问您想报名哪个活动？'
      )
    }

    // 购买操作
    if (this.containsAny(text, INTENT_KEYWORDS.buy)) {
      if (this.context.currentProduct) {
        return this.buildResult(
          IntentType.ACTION,
          { 
            action: 'add_to_cart',
            product_id: this.context.currentProduct,
            confirm: text.includes('确认') || text.includes('好的') || text.includes('是')
          },
          null,
          0.9,
          '已加入购物车'
        )
      }
    }

    // 播放/听/看 语音介绍
    if (this.containsAny(text, INTENT_KEYWORDS.play)) {
      if (this.context.currentArtifact) {
        return this.buildResult(
          IntentType.ACTION,
          { 
            action: 'play_voice',
            artifact_id: this.context.currentArtifact
          },
          'play_voice_intro',
          0.9,
          '正在播放语音介绍...'
        )
      }
      
      // 播放某个文物
      const artifactMatch = text.match(/播放(.+)的介绍/)
      if (artifactMatch) {
        return this.buildResult(
          IntentType.ACTION,
          { 
            action: 'play_voice',
            artifact_name: artifactMatch[1]
          },
          'play_voice_intro',
          0.85,
          `正在播放"${artifactMatch[1]}"的语音介绍...`
        )
      }
    }

    // 开始问答
    if (text.includes('问答') || text.includes('答题') || text.includes('挑战')) {
      let topic = 'general'
      if (text.includes('文物')) topic = 'artifact'
      else if (text.includes('历史')) topic = 'history'
      else if (text.includes('工艺')) topic = 'craft'

      return this.buildResult(
        IntentType.ACTION,
        { topic },
        'start_quiz',
        0.9,
        '即将开始知识问答...'
      )
    }

    // 商城相关操作
    // 加入购物车
    if (text.includes('加入购物车') || text.includes('加购物车') || text.includes('加入购物')) {
      if (this.context.currentProduct) {
        return this.buildResult(
          IntentType.ACTION,
          { product_id: this.context.currentProduct },
          'add_to_cart',
          0.95,
          '已加入购物车'
        )
      }
      return this.buildResult(
        IntentType.ACTION,
        { action: 'add_to_cart' },
        null,
        0.5,
        '请问要把哪个商品加入购物车？'
      )
    }

    // 查看购物车
    if (text.includes('查看购物车') || text.includes('我的购物车') || text.includes('购物车')) {
      return this.buildResult(
        IntentType.ACTION,
        {},
        'view_cart',
        0.9,
        '正在打开购物车...'
      )
    }

    // 下单/购买 - 先检查是否有批量下单关键词，避免误匹配
    // 只有在不包含批量关键词时才处理普通购买
    const batchKeywords = ['批量下单', '全部购买', '全部买', '一起买', '一起购买', '类的商品全部', '全部']
    const hasBatchKeyword = batchKeywords.some(k => text.includes(k))
    
    if (this.containsAny(text, INTENT_KEYWORDS.buy) || text.includes('购买') || text.includes('买') || text.includes('下单')) {
      // 如果包含批量关键词，优先走批量下单
      if (hasBatchKeyword && (text.includes('全部') || text.includes('一起'))) {
        // 提取分类名称
        const categoryPatterns = [
          /把(.+?)类的商品/, /把(.+?)的全部/, /购买(.+?)类的/,
          /(.+?)类的全部/, /买(.+?)类的/, /(.+?)类商品/, /全部(.+?)/
        ]
        
        let categoryName = null
        for (const pattern of categoryPatterns) {
          const match = text.match(pattern)
          if (match && match[1]) {
            categoryName = match[1].trim()
            break
          }
        }
        
        const quantityMatch = text.match(/(\d+)份|(\d+)件/)
        const quantity = quantityMatch ? parseInt(quantityMatch[1] || quantityMatch[2]) : 1
        
        return this.buildResult(
          IntentType.ACTION,
          { category_name: categoryName, quantity_per_item: quantity },
          'batch_create_order',
          0.98,
          categoryName ? `正在准备批量下单"${categoryName}"类商品...` : '正在准备批量下单...'
        )
      }
      
      // 普通购买 - 支持 "购买X份产品名" 或 "买X份产品名" 格式
      const fullText = text

      // 首先提取数量（简化处理）
      let quantity = 1
      if (fullText.includes('两') || fullText.includes('二')) {
        quantity = 2
      } else if (fullText.includes('三')) {
        quantity = 3
      } else if (fullText.includes('四')) {
        quantity = 4
      } else if (fullText.includes('五')) {
        quantity = 5
      } else if (fullText.includes('六')) {
        quantity = 6
      } else if (fullText.includes('七')) {
        quantity = 7
      } else if (fullText.includes('八')) {
        quantity = 8
      } else if (fullText.includes('九')) {
        quantity = 9
      } else if (fullText.includes('十')) {
        quantity = 10
      } else {
        // 尝试匹配阿拉伯数字
        const numMatch = fullText.match(/(\d+)\s*[份个件]/)
        if (numMatch) {
          quantity = parseInt(numMatch[1])
        }
      }

      // 提取产品名称 - 移除数量词和常见语气词
      let productName = fullText
        .replace(/帮我|请帮我|我想|帮我购买|购买|买|下单/gi, '')
        .replace(/[零一二两三四五六七八九十百千万]+\s*[份个件]/g, '')
        .replace(/\d+\s*[份个件]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      if (productName && productName.length > 0) {
        return this.buildResult(
          IntentType.ACTION,
          { keyword: productName, quantity },
          'search_product',
          0.85,
          `正在搜索"${productName}"，先为您打开商品列表...`
        )
      }

      // 如果有当前商品上下文
      if (this.context.currentProduct) {
        return this.buildResult(
          IntentType.ACTION,
          { product_id: this.context.currentProduct, quantity },
          'create_order', 0.95, `正在下单购买${quantity}件商品...`
        )
      }

      return this.buildResult(
        IntentType.ACTION, { action: 'buy' }, 'view_cart', 0.5, '请问您想购买什么商品？'
      )
    }

    // 查看订单
    if (text.includes('我的订单') || text.includes('查看订单') || text.includes('订单列表')) {
      return this.buildResult(
        IntentType.ACTION,
        {},
        'view_orders',
        0.9,
        '正在打开订单列表...'
      )
    }

    // 查看活动
    if (text.includes('查看活动') || text.includes('最近有什么活动')) {
      return this.buildResult(
        IntentType.ACTION,
        {},
        'search_activity',
        0.9,
        '正在打开活动列表...'
      )
    }

    // 查看课程
    if (text.includes('查看课程') || text.includes('学习课程')) {
      return this.buildResult(
        IntentType.ACTION,
        {},
        'view_courses',
        0.9,
        '正在打开课程页面...'
      )
    }

    // 批量取消订单（优先级高于批量支付）
    if ((text.includes('取消') || text.includes('撤销')) && (text.includes('待支付') || text.includes('待付款') || text.includes('未支付') || text.includes('未付款') || text.includes('所有订单'))) {
      console.log('[MCP] 匹配: 批量取消订单')
      return this.buildResult(
        IntentType.ACTION,
        {},
        'batch_cancel_orders',
        0.98,
        null  // 不显示提示，由页面组件处理
      )
    }

    // 批量支付订单
    if (text.includes('支付') && (text.includes('待支付') || text.includes('待付款') || text.includes('未支付') || text.includes('未付款'))) {
      console.log('[MCP] 匹配: 批量支付订单')
      return this.buildResult(
        IntentType.ACTION,
        {},
        'batch_pay_orders',
        0.95,
        null  // 不显示提示，由页面组件处理
      )
    }

    // 退出登录
    if (text.includes('退出登录') || text.includes('退出账号') || text.includes('登出') || text.includes('切换账号')) {
      return this.buildResult(IntentType.ACTION, {}, 'logout', 0.9, '正在退出登录...')
    }

    return this.buildResult(IntentType.ACTION, null, null, 0)
  }

  /**
   * 解析问答意图
   * 只有包含问号或明确疑问词的内容才会触发
   */
  parseQuestion(text) {
    const hasQuestionMark = text.includes('?') || text.includes('？')
    
    // 有问号 → 最高优先级
    if (hasQuestionMark) {
      return this.buildResult(
        IntentType.QUESTION,
        { question: text },
        'ask_xuanmiao',
        0.95,
        '让我来回答您的问题...'
      )
    }

    // 问号省略但有明确疑问词 → 交给AI
    const questionKeywords = ['什么', '怎么', '如何', '为什么', '多少', '是谁', '哪', '吗', '呢']
    const hasQuestionWord = questionKeywords.some(k => text.includes(k))
    
    if (hasQuestionWord) {
      return this.buildResult(
        IntentType.QUESTION,
        { question: text },
        'ask_xuanmiao',
        0.9,
        '让我来回答您的问题...'
      )
    }

    return this.buildResult(IntentType.QUESTION, null, null, 0)
  }

  /**
   * 辅助函数：检查文本是否包含任意关键词
   */
  containsAny(text, keywords) {
    return keywords.some(k => text.includes(k))
  }

  /**
   * 提取活动名称
   */
  extractActivityName(text) {
    // 简单的正则匹配
    const patterns = [
      /报名(.+?)(?:活动)?$/,
      /参加(.+?)(?:活动)?$/,
      /预订(.+?)(?:活动)?$/
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    
    return null
  }

  /**
   * 构建解析结果
   */
  buildResult(intent, params, tool, confidence, message = '') {
    return {
      intent,
      params: params || {},
      tool,
      confidence,
      message,
      timestamp: Date.now()
    }
  }
}

// 导出单例
export const intentParser = new IntentParser()

/**
 * 解析自然语言并执行对应的 MCP 工具
 * @param {string} text - 用户输入
 * @param {object} context - 上下文
 * @returns {object} 执行结果
 */
export async function parseAndExecute(text, context) {
  const result = intentParser.parse(text, context)
  
  console.log('[MCP] ====== 工具执行开始 ======')
  console.log('[MCP] 识别到的意图:', {
    intent: result.intent,
    tool: result.tool,
    confidence: result.confidence,
    params: result.params,
    message: result.message
  })
  
  if (!result.tool || result.confidence < 0.7) {
    console.log('[MCP] 工具置信度不足（<0.7）或无工具，交给AI处理')
    console.log('[MCP] ====== 工具执行结束 ======\n')
    // 无法识别，交给 AI 处理
    if (result.intent === IntentType.QUESTION || result.intent === IntentType.UNKNOWN) {
      return {
        success: false,
        needAi: true,
        message: result.message || '让我帮您问问玄喵...',
        originalText: text
      }
    }
    return {
      success: false,
      message: result.message || '抱歉，无法理解您的指令',
      originalText: text
    }
  }

  // 执行工具
  try {
    const tool = MCP_TOOLS[result.tool]
    if (!tool) {
      console.log('[MCP] 工具不存在:', result.tool)
      throw new Error(`工具 ${result.tool} 不存在`)
    }

    console.log('[MCP] 正在执行工具:', result.tool)
    console.log('[MCP] 工具参数:', result.params)
    
    const executeResult = await tool.execute(result.params, context)
    
    console.log('[MCP] 工具执行结果:', executeResult)
    console.log('[MCP] ====== 工具执行结束 ======\n')
    
    return {
      success: executeResult.success,
      tool: result.tool,
      message: executeResult.success ? result.message : executeResult.error,
      data: executeResult.data,
      originalText: text
    }
  } catch (error) {
    console.log('[MCP] 工具执行出错:', error.message)
    console.log('[MCP] ====== 工具执行结束 ======\n')
    return {
      success: false,
      error: error.message,
      message: `执行出错: ${error.message}`,
      originalText: text
    }
  }
}
