import request from '@/utils/request'

/**
 * 获取仪表板统计数据
 * 功能描述：获取系统各项数据统计信息，包括用户、订单、销售额等统计
 * 入参：无
 * 返回参数：{
 *   totalUsers: number,
 *   todayNewUsers: number,
 *   totalOrders: number,
 *   todayOrders: number,
 *   totalSales: number,
 *   todaySales: number,
 *   totalHeritageItems: number,
 *   totalCourses: number,
 *   totalActivities: number,
 *   totalProducts: number,
 *   totalInheritors: number,
 *   orderStatusDistribution: object,
 *   heritageCategoryDistribution: object,
 *   last7DaysOrders: array,
 *   last7DaysSales: array,
 *   last7DaysUsers: array
 * }
 * url地址：/dashboard/statistics
 * 请求方式：GET
 */
export function getDashboardStatistics(config = {}) {
  return request.get('/dashboard/statistics', null, config)
}

