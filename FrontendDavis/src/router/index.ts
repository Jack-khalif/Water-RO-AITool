import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../components/LandingPage.vue'
import Features from '../components/Features.vue'
import Contact from '../components/Contact.vue'
import LoginPage from '../components/LoginPage.vue'
import SignUpPage from '../components/SignUpPage.vue'
import Dashboard from '../components/Dashboard.vue'
import DashboardHome from '../components/DashboardHome.vue'
import WaterAnalysisForm from '../components/WaterAnalysisForm.vue'

const routes = [
  { path: '/', component: LandingPage },
  { path: '/features', component: Features },
  { path: '/contact', component: Contact },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignUpPage },
  {
    path: '/dashboard',
    component: Dashboard,
    children: [
      { path: '', component: DashboardHome },
      {
        path: 'proposal-tool',
        component: WaterAnalysisForm,
      },
      {
        path: 'upload-report',
        component: () => import('../components/LabReportUpload.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
