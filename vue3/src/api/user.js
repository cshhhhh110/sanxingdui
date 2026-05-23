import request from '@/utils/request'

/**
 * 用户登录
 * 功能描述：用户使用用户名和密码进行登录认证
 * 入参：{ username: string, password: string }
 * 返回参数：{ userInfo: object, token: string, roleCode: string, menuList?: array }
 * url地址：/user/login
 * 请求方式：POST
 */
export function login(params, config = {}) {
  return request.post('/user/login', params, config)
}

/**
 * 用户注册
 * 功能描述：新用户注册账号
 * 入参：{ username: string, password: string, email: string, phone?: string, name?: string, roleCode?: string }
 * 返回参数：注册成功信息
 * url地址：/user/add
 * 请求方式：POST
 */
export function register(params, config = {}) {
  return request.post('/user/add', params, config)
}

/**
 * 获取当前登录用户信息
 * 功能描述：获取当前登录用户的详细信息
 * 入参：无
 * 返回参数：{ id: number, username: string, name: string, email: string, phone: string, sex: string, avatar: string, roleCode: string }
 * url地址：/user/current
 * 请求方式：GET
 */
export function getCurrentUser(config = {}) {
  return request.get('/user/current', null, config)
}

/**
 * 根据ID获取用户信息
 * 功能描述：根据用户ID获取用户详细信息
 * 入参：{ id: number }
 * 返回参数：{ id: number, username: string, name: string, email: string, phone: string, sex: string, avatar: string, roleCode: string }
 * url地址：/user/{id}
 * 请求方式：GET
 */
export function getUserById(id, config = {}) {
  return request.get(`/user/${id}`, null, config)
}

/**
 * 更新用户信息
 * 功能描述：更新用户的基本信息
 * 入参：{ id: number, name?: string, email?: string, phone?: string, sex?: string, avatar?: string }
 * 返回参数：更新成功信息
 * url地址：/user/{id}
 * 请求方式：PUT
 */
export function updateUser(id, params, config = {}) {
  return request.put(`/user/${id}`, params, config)
}

/**
 * 修改用户密码
 * 功能描述：用户修改登录密码
 * 入参：{ oldPassword: string, newPassword: string }
 * 返回参数：修改成功信息
 * url地址：/user/password/{id}
 * 请求方式：PUT
 */
export function updatePassword(id, params, config = {}) {
  return request.put(`/user/password/${id}`, params, config)
}

/**
 * 忘记密码
 * 功能描述：通过用户名、邮箱、手机号三要素验证后重置密码
 * 入参：{ username: string, email: string, phone: string, newPassword: string }
 * 返回参数：重置成功信息
 * url地址：/user/forget
 * 请求方式：POST
 */
export function forgetPassword(params, config = {}) {
  return request.post('/user/forget', params, config)
}

/**
 * 用户退出登录
 * 功能描述：用户退出登录，清除登录状态
 * 入参：无
 * 返回参数：退出成功信息
 * url地址：/user/logout
 * 请求方式：POST
 * 注意：后端暂未提供此接口，前端直接清除本地存储即可
 */
export function logout(config = {}) {
  return request.post('/user/logout', null, config)
}

/**
 * 分页查询用户列表
 * 功能描述：获取用户列表，支持分页和搜索（管理员功能）
 * 入参：{ username?: string, email?: string, userType?: string, status?: string, currentPage: number, size: number }
 * 返回参数：{ records: array, total: number, current: number, size: number }
 * url地址：/user/page
 * 请求方式：GET
 */
export function getUserPage(params, config = {}) {
  return request.get('/user/page', params, config)
}