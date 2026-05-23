import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import BackendLayout from '@/layouts/BackendLayout.vue'

export const backendRoutes = [
  {
    path: '/back',
    component: BackendLayout,
    redirect: '/back/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/backend/Dashboard.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'user',
        name: 'UserManagement',
        component: () => import('@/views/backend/user/index.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'heritage',
        name: 'HeritageManagement',
        component: () => import('@/views/backend/heritage/index.vue'),
        meta: { title: '非遗作品管理', icon: 'Collection' }
      },
      {
        path: 'heritage/detail/:id',
        name: 'HeritageDetail',
        component: () => import('@/views/backend/heritage/detail.vue'),
        meta: { title: '作品详情', hidden: true }
      },
      {
        path: 'inheritor',
        name: 'InheritorManagement',
        component: () => import('@/views/backend/inheritor/index.vue'),
        meta: { title: '传承人管理', icon: 'User' }
      },
      {
        path: 'activity',
        name: 'ActivityManagement',
        component: () => import('@/views/backend/activity/index.vue'),
        meta: { title: '活动管理', icon: 'Calendar' }
      },
      {
        path: 'course',
        name: 'CourseManagement',
        component: () => import('@/views/backend/course/index.vue'),
        meta: { title: '课程管理', icon: 'ReadOutlined' }
      },
      {
        path: 'shop/category',
        name: 'ShopCategoryManagement',
        component: () => import('@/views/backend/shop/category/index.vue'),
        meta: { title: '商品分类管理', icon: 'AppstoreOutlined' }
      },
      {
        path: 'shop/product',
        name: 'ShopProductManagement',
        component: () => import('@/views/backend/shop/product/index.vue'),
        meta: { title: '商品管理', icon: 'ShoppingOutlined' }
      },
      {
        path: 'shop/orders',
        name: 'ShopOrderManagement',
        component: () => import('@/views/backend/OrderManage.vue'),
        meta: { title: '订单管理', icon: 'OrderedListOutlined' }
      },
      {
        path: 'profile',
        name: 'BackendProfile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人信息', icon: 'UserFilled' }
      }
    ]
  }
]

const frontendRoutes = [
  {
    path: '/',
    component: () => import('@/layouts/FrontendLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/frontend/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'heritage',
        name: 'HeritageList',
        component: () => import('@/views/frontend/heritage/index.vue'),
        meta: { title: '古蜀瑰宝' }
      },
      {
        path: 'heritage/:id',
        name: 'HeritageItemDetail',
        component: () => import('@/views/frontend/heritage/detail.vue'),
        meta: { title: '作品详情' }
      },
      {
        path: 'inheritor',
        name: 'InheritorList',
        component: () => import('@/views/frontend/inheritor/index.vue'),
        meta: { title: '文博专家' }
      },
      {
        path: 'inheritor/:id',
        name: 'InheritorDetail',
        component: () => import('@/views/frontend/inheritor/detail.vue'),
        meta: { title: '专家详情' }
      },
      {
        path: 'activity',
        name: 'ActivityList',
        component: () => import('@/views/frontend/activity/index.vue'),
        meta: { title: '文化活动' }
      },
      {
        path: 'activity/:id',
        name: 'ActivityDetail',
        component: () => import('@/views/frontend/activity/detail.vue'),
        meta: { title: '活动详情' }
      },
      {
        path: 'course',
        name: 'CourseList',
        component: () => import('@/views/frontend/course/index.vue'),
        meta: { title: '研学课堂' }
      },
      {
        path: 'course/:id/study/:chapterId',
        name: 'CourseStudy',
        component: () => import('@/views/frontend/course/study.vue'),
        meta: { title: '课程学习' }
      },
      {
        path: 'course/:id',
        name: 'CourseDetail',
        component: () => import('@/views/frontend/course/detail.vue'),
        meta: { title: '课程详情' }
      },
      {
        path: 'shop',
        name: 'ShopList',
        component: () => import('@/views/frontend/shop/index.vue'),
        meta: { title: '文创商城' }
      },
      {
        path: 'shop/:id',
        name: 'ShopProductDetail',
        component: () => import('@/views/frontend/shop/detail.vue'),
        meta: { title: '商品详情' }
      },
      {
        path: 'ai-chat',
        name: 'AiChat',
        component: () => import('@/views/frontend/AiChat.vue'),
        meta: { title: 'AI 文博助手', requiresAuth: false }
      },
      {
        path: 'order/confirm',
        name: 'OrderConfirm',
        component: () => import('@/views/frontend/OrderConfirm.vue'),
        meta: { title: '确认订单', requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'UserOrders',
        component: () => import('@/views/frontend/UserOrders.vue'),
        meta: { title: '我的订单', requiresAuth: true }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/frontend/OrderDetail.vue'),
        meta: { title: '订单详情', requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人中心', requiresAuth: true }
      },
      {
        path: '3dlist',
        name: '3dlist',
        component: () => import('@/views/3ddemo.vue'),
        meta: { title: '3D 数字馆', requiresAuth: false }
      },
      {
        path: '3d',
        name: '3d',
        component: () => import('@/views/Three3dDemo.vue'),
        meta: { title: '3D 展示', requiresAuth: false }
      },
      {
        path: 'tanmi',
        name: 'tanmi',
        component: () => import('@/views/frontend/tanmi.vue'),
        meta: { title: '三星堆探秘', requiresAuth: false }
      },
      {
        path: 'quiz',
        name: 'quiz',
        component: () => import('@/views/frontend/quiz/index.vue'),
        meta: { title: '知识问答', requiresAuth: false }
      },
      {
        path: 'info1',
        name: 'info1',
        component: () => import('@/views/frontend/taninfo1.vue'),
        meta: { title: '宝墩文化遗址', requiresAuth: false }
      },
      {
        path: 'info2',
        name: 'info2',
        component: () => import('@/views/frontend/taninfo2.vue'),
        meta: { title: '三星堆祭祀坑遗址', requiresAuth: false }
      },
      {
        path: 'info3',
        name: 'info3',
        component: () => import('@/views/frontend/taninfo3.vue'),
        meta: { title: '金沙祭祀坑遗址', requiresAuth: false }
      },
      {
        path: 'ai-image-generator',
        name: 'ai-image-generator',
        component: () => import('@/views/frontend/ai-image-generator.vue'),
        meta: { title: 'AI 图像生成', requiresAuth: false }
      }
    ]
  },
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: { title: '登录' }
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/Register.vue'),
        meta: { title: '注册' }
      },
      {
        path: 'forgot-password',
        name: 'ForgotPassword',
        component: () => import('@/views/auth/ForgotPassword.vue'),
        meta: { title: '找回密码' }
      }
    ]
  },
  {
    path: '/login',
    redirect: '/auth/login'
  },
  {
    path: '/register',
    redirect: '/auth/register'
  }
]

const errorRoutes = [
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: [
    ...frontendRoutes,
    ...backendRoutes,
    ...errorRoutes
  ]
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 非遗传承系统`
  }

  const userStore = useUserStore()

  if (to.matched.some((record) => record.meta.requiresAuth) && !userStore.isLoggedIn) {
    next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  if (userStore.isLoggedIn) {
    if (to.path === '/login' || to.path === '/auth/login') {
      next(userStore.isUser ? '/home' : '/back/dashboard')
      return
    }

    if (!userStore.isUser) {
      if (to.path.startsWith('/back')) {
        next()
      } else {
        next('/back/dashboard')
      }
      return
    }

    if (to.path.startsWith('/back')) {
      next('/home')
      return
    }
  } else if (to.path.startsWith('/back')) {
    next('/auth/login')
    return
  }

  next()
})

export default router
