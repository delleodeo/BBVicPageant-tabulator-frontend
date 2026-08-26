<template>
  <AdminLayout title="Top 5 Finalists">
    <section class="panel panel-gold">
      <div class="section-head">
        <div>
          <span class="eyebrow"><AppIcon name="finalists" /> Official Finalist Roster</span>
          <h2>Top 5 Finalists</h2>
          <p class="section-subhead">Automatically advanced from certified Round 1 rankings</p>
        </div>

        <div class="button-row">
          <RouterLink to="/stage" target="_blank" class="btn btn-gold">
            <AppIcon name="stage" />
            Launch Finalists Stage Reveal Screen
          </RouterLink>
          <RouterLink to="/admin/final-round" class="btn btn-primary">
            Go to Final Round Tabulation
            <AppIcon name="arrowRight" />
          </RouterLink>
        </div>
      </div>
    </section>

    <LoadingState v-if="loading" label="finalists" />

    <section v-else-if="finalists.length > 0" class="card-grid">
      <article v-for="(finalist, index) in finalists" :key="finalist._id" class="entity-card finalist-highlight-card">
        <div class="finalist-rank-badge">
          <span class="crown-icon"><AppIcon :name="index === 0 ? 'finalists' : index < 3 ? 'awards' : 'roundOne'" /></span>
          <span>Rank {{ index + 1 }} Qualifier</span>
        </div>

        <div class="photo-frame">
          <img v-if="finalist.contestantId?.photo" :src="mediaUrl(finalist.contestantId.photo)" :alt="finalist.contestantId.name" />
          <div v-else class="photo-fallback">
            <span>{{ finalist.contestantId?.name?.slice(0, 2).toUpperCase() }}</span>
            <small>#{{ finalist.contestantId?.contestantNumber }}</small>
          </div>
        </div>

        <div class="finalist-info">
          <h3>#{{ finalist.contestantId?.contestantNumber }} {{ finalist.contestantId?.name }}</h3>
          <p v-if="finalist.contestantId?.hometown" class="finalist-hometown">{{ finalist.contestantId.hometown }}</p>
          <p v-if="finalist.contestantId?.advocacy" class="finalist-advocacy">"{{ finalist.contestantId.advocacy }}"</p>
        </div>

        <div class="finalist-card-footer">
          <StatusBadge label="OFFICIAL FINALIST" tone="success" />
          <RouterLink :to="`/judge/final/${finalist.contestantId?._id}`" class="btn btn-ghost btn-sm">
            View Sheet
          </RouterLink>
        </div>
      </article>
    </section>

    <EmptyState
      v-else
      message="Top 5 Finalists have not been generated yet. They will appear automatically once Round 1 is locked by the Tabulation Committee."
    />
  </AdminLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import EmptyState from '../../components/EmptyState.vue';
import AppIcon from '../../components/AppIcon.vue';
import LoadingState from '../../components/LoadingState.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { api, mediaUrl } from '../../services/api.js';
import { connectSocket } from '../../services/socket.js';

const finalists = ref([]);
const loading = ref(true);

async function load() {
  const { data } = await api.get('/admin/finalists');
  finalists.value = data.finalists || [];
  loading.value = false;
}

onMounted(async () => {
  await load();
  const socket = connectSocket();
  socket.on('finalists:generated', load);
});
</script>

<style scoped>
.finalist-highlight-card {
  border-color: var(--border-gold);
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-hover) 100%);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.finalist-rank-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--gold-dark);
  text-transform: uppercase;
}

.crown-icon .app-icon {
  width: 1rem;
  height: 1rem;
}

.finalist-info h3 {
  font-size: 1.1rem;
  font-weight: 900;
}

.finalist-hometown {
  font-size: 0.8rem;
  color: var(--gold-dark);
  font-weight: 700;
}

.finalist-advocacy {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-style: italic;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: 0.2rem;
}

.finalist-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
  margin-top: auto;
}
</style>
