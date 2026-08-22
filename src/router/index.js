import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import AdminAuditLogs from '../views/admin/AdminAuditLogs.vue';
import AdminContestants from '../views/admin/AdminContestants.vue';
import AdminDashboard from '../views/admin/AdminDashboard.vue';
import AdminFinalRound from '../views/admin/AdminFinalRound.vue';
import AdminFinalists from '../views/admin/AdminFinalists.vue';
import AdminJudges from '../views/admin/AdminJudges.vue';
import AdminRoundOne from '../views/admin/AdminRoundOne.vue';
import AdminSettings from '../views/admin/AdminSettings.vue';
import AdminSpecialAwards from '../views/admin/AdminSpecialAwards.vue';
import LoginView from '../views/auth/LoginView.vue';
import JudgeDashboard from '../views/judge/JudgeDashboard.vue';
import JudgeFinal from '../views/judge/JudgeFinal.vue';
import JudgeFinalScore from '../views/judge/JudgeFinalScore.vue';
import JudgeProfile from '../views/judge/JudgeProfile.vue';
import JudgeRoundOne from '../views/judge/JudgeRoundOne.vue';
import JudgeRoundOneScore from '../views/judge/JudgeRoundOneScore.vue';
import StagePresentation from '../views/stage/StagePresentation.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginView },
  { path: '/stage', component: StagePresentation },
  { path: '/admin/dashboard', component: AdminDashboard, meta: { role: 'admin' } },
  { path: '/admin/contestants', component: AdminContestants, meta: { role: 'admin' } },
  { path: '/admin/judges', component: AdminJudges, meta: { role: 'admin' } },
  { path: '/admin/round-one', component: AdminRoundOne, meta: { role: 'admin' } },
  { path: '/admin/round-one/results', component: AdminRoundOne, meta: { role: 'admin' } },
  { path: '/admin/special-awards', component: AdminSpecialAwards, meta: { role: 'admin' } },
  { path: '/admin/finalists', component: AdminFinalists, meta: { role: 'admin' } },
  { path: '/admin/final-round', component: AdminFinalRound, meta: { role: 'admin' } },
  { path: '/admin/final-results', component: AdminFinalRound, meta: { role: 'admin' } },
  { path: '/admin/audit-logs', component: AdminAuditLogs, meta: { role: 'admin' } },
  { path: '/admin/settings', component: AdminSettings, meta: { role: 'admin' } },
  { path: '/judge/dashboard', component: JudgeDashboard, meta: { role: 'judge' } },
  { path: '/judge/round-one', component: JudgeRoundOne, meta: { role: 'judge' } },
  { path: '/judge/round-one/:contestantId', component: JudgeRoundOneScore, meta: { role: 'judge' } },
  { path: '/judge/final', component: JudgeFinal, meta: { role: 'judge' } },
  { path: '/judge/final/:contestantId', component: JudgeFinalScore, meta: { role: 'judge' } },
  { path: '/judge/profile', component: JudgeProfile, meta: { role: 'judge' } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.role && !auth.isAuthenticated) return '/login';
  if (to.meta.role === 'admin' && !auth.isAdmin) return '/judge/dashboard';
  if (to.meta.role === 'judge' && !auth.isJudge) return '/admin/dashboard';
  if (to.path === '/login' && auth.isAdmin) return '/admin/dashboard';
  if (to.path === '/login' && auth.isJudge) return '/judge/dashboard';
  return true;
});

export default router;

