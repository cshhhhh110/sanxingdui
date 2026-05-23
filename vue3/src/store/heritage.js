import { defineStore } from 'pinia'

export const useHeritageStore = defineStore('heritage', {
  state: () => ({
    // 列表数据
    heritageList: [],
    total: 0,
    loading: false,
    
    // 详情数据
    currentItem: null,
    itemLoading: false,
    
    // 搜索参数
    searchParams: {
      currentPage: 1,
      size: 10
    }
  }),

  getters: {
    // 按状态统计数量
    getItemCountByStatus: (state) => {
      return (status) => {
        return state.heritageList.filter(item => item.status === status).length
      }
    }
  },

  actions: {
    // 设置列表数据
    setHeritageList(list, total = 0) {
      this.heritageList = list || []
      this.total = total
    },

    // 设置加载状态
    setLoading(loading) {
      this.loading = loading
    },

    // 设置当前项
    setCurrentItem(item) {
      this.currentItem = item
    },

    // 设置详情加载状态
    setItemLoading(loading) {
      this.itemLoading = loading
    },

    // 更新项状态
    updateItemStatus(itemId, status) {
      const item = this.heritageList.find(item => item.id === itemId)
      if (item) {
        item.status = status
        // 更新状态名称
        const statusMap = {
          0: '草稿',
          1: '待审',
          2: '已发布',
          3: '下架'
        }
        item.statusName = statusMap[status]
      }
      
      // 如果当前项也是这个ID，同时更新
      if (this.currentItem && this.currentItem.id === itemId) {
        this.currentItem.status = status
        this.currentItem.statusName = statusMap[status]
      }
    },

    // 从列表中移除项
    removeItemFromList(itemId) {
      const index = this.heritageList.findIndex(item => item.id === itemId)
      if (index !== -1) {
        this.heritageList.splice(index, 1)
        this.total = Math.max(0, this.total - 1)
      }
    },

    // 重置搜索参数
    resetSearchParams() {
      this.searchParams = {
        currentPage: 1,
        size: 10
      }
    }
  }
})
