import Vue from 'vue'
import VueRouter from 'vue-router'
import ImageProcessing from '../views/ImageProcessing.vue'
import TextProcessing from '../views/TextProcessing.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/image-processing'
  },
  {
    path: '/image-processing',
    name: 'ImageProcessing',
    component: ImageProcessing
  },
  {
    path: '/batch-image-processing',
    name: 'BatchImageProcessing',
    component: () => import('@/views/BatchImageProcessing.vue')
  },
  {
    path: '/text-processing',
    name: 'TextProcessing',
    component: TextProcessing
  }
 
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router