<template>
  <AdminLayout title="Top 5 Finalists">
    <section class="finalists-hero">
      <div class="finalists-hero-copy">
        <div class="hero-icon-mark">
          <AppIcon name="finalists" />
        </div>
        <div>
          <span class="eyebrow"><AppIcon name="shieldCheck" /> Official Finalist Roster</span>
          <h2>Top 5 Finalists</h2>
          <p>Certified qualifiers advanced from the locked Round 1 rankings.</p>
        </div>
      </div>

      <div class="finalists-hero-side">
        <div class="finalists-quick-stats">
          <div>
            <span>{{ finalists.length || 0 }}</span>
            <small>Finalists</small>
          </div>
          <div>
            <span>{{ generatedLabel }}</span>
            <small>Roster Status</small>
          </div>
        </div>

        <div class="finalists-actions">
          <RouterLink to="/admin/final-round" class="btn btn-primary">
            Final Tabulation
            <AppIcon name="arrowRight" />
          </RouterLink>
        </div>
      </div>
    </section>

    <LoadingState v-if="loading" label="finalists" />

    <section v-else-if="finalists.length > 0" class="finalists-grid">
      <article v-for="(finalist, index) in finalists" :key="finalist._id" class="finalist-card">
        <div class="finalist-photo-wrap">
          <img v-if="finalist.contestantId?.photo" :src="mediaUrl(finalist.contestantId.photo)" :alt="finalist.contestantId.name" />
          <div v-else class="photo-fallback">
            <span>{{ finalist.contestantId?.name?.slice(0, 2).toUpperCase() }}</span>
            <small>#{{ finalist.contestantId?.contestantNumber }}</small>
          </div>
          <div class="rank-medallion">
            <AppIcon :name="index === 0 ? 'finalists' : index < 3 ? 'awards' : 'roundOne'" />
            <span>{{ index + 1 }}</span>
          </div>
        </div>

        <div class="finalist-info">
          <div class="finalist-rank-badge">
            <span>Rank {{ roundOneResult(finalist)?.rank || index + 1 }} Qualifier</span>
          </div>
          <h3>{{ finalist.contestantId?.name }}</h3>
          <div class="finalist-meta-row">
            <span>#{{ finalist.contestantId?.contestantNumber }}</span>
            <span v-if="finalist.contestantId?.hometown">
              <AppIcon name="mapPin" />
              {{ finalist.contestantId.hometown }}
            </span>
          </div>
          <p v-if="finalist.contestantId?.advocacy" class="finalist-advocacy">{{ finalist.contestantId.advocacy }}</p>

          <div class="round-one-score-chip">
            <span>Round 1 Score</span>
            <strong>{{ roundOneScore(finalist) }}</strong>
          </div>
        </div>

        <div class="finalist-card-footer">
          <StatusBadge label="OFFICIAL FINALIST" tone="success" />
          <RouterLink :to="`/judge/final/${finalist.contestantId?._id}`" class="btn btn-ghost btn-sm">
            <AppIcon name="scoreSheet" />
            Sheet
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
import { computed, onMounted, ref } from 'vue';
import EmptyState from '../../components/EmptyState.vue';
import AppIcon from '../../components/AppIcon.vue';
import LoadingState from '../../components/LoadingState.vue';
import StatusBadge from '../../components/StatusBadge.vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import { api, mediaUrl } from '../../services/api.js';
import { connectSocket } from '../../services/socket.js';
import { fmt } from '../../utils/score.js';

const finalists = ref([]);
const roundOneRankings = ref([]);
const loading = ref(true);

const generatedLabel = computed(() => (finalists.value.length ? 'Ready' : 'Pending'));
const roundOneByContestantId = computed(() => {
  const entries = roundOneRankings.value.map((result) => [String(result.contestant?._id), result]);
  return new Map(entries);
});

function roundOneResult(finalist) {
  return roundOneByContestantId.value.get(String(finalist.contestantId?._id));
}

function roundOneScore(finalist) {
  const result = roundOneResult(finalist);
  return result?.total != null ? `${fmt(result.total)} pts` : '-';
}

async function load() {
  const [finalistsRes, roundOneRes] = await Promise.all([
    api.get('/admin/finalists'),
    api.get('/admin/round-one/results').catch(() => ({ data: { rankings: [] } }))
  ]);
  finalists.value = finalistsRes.data.finalists || [];
  roundOneRankings.value = roundOneRes.data.rankings || [];
  loading.value = false;
}

onMounted(async () => {
  await load();
  const socket = connectSocket();
  socket.on('finalists:generated', load);
});
</script>

<style scoped>
.finalists-hero {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1.25rem;
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, rgba(201, 154, 46, 0.14), transparent 36%),
    linear-gradient(180deg, var(--surface) 0%, var(--surface-hover) 100%);
  box-shadow: var(--shadow-md);
}

.finalists-hero-copy {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.85rem;
  align-items: center;
  min-width: 0;
}

.hero-icon-mark {
  width: 3rem;
  height: 3rem;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  color: var(--gold-light);
  background: rgba(201, 154, 46, 0.12);
  border: 1px solid var(--border-gold);
}

.hero-icon-mark .app-icon {
  width: 1.55rem;
  height: 1.55rem;
}

.finalists-hero h2 {
  margin-top: 0.15rem;
  font-size: clamp(1.25rem, 5vw, 1.8rem);
  font-weight: 900;
  letter-spacing: 0;
}

.finalists-hero p {
  max-width: 38rem;
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: clamp(0.82rem, 3.4vw, 0.95rem);
}

.finalists-hero-side,
.finalists-actions {
  display: grid;
  gap: 0.75rem;
}

.finalists-quick-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.finalists-quick-stats div {
  min-width: 0;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.04);
}

.finalists-quick-stats span {
  display: block;
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--text-main);
}

.finalists-quick-stats small {
  display: block;
  margin-top: 0.1rem;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.finalists-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.finalist-card {
  min-width: 0;
  display: grid;
  grid-template-columns: 6.25rem 1fr;
  gap: 0.85rem;
  align-items: stretch;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.finalist-card:hover {
  transform: translateY(-2px);
  border-color: var(--gold);
  box-shadow: var(--shadow-lg);
}

.finalist-photo-wrap {
  position: relative;
  min-height: 8.5rem;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--navy-dark) 0%, var(--navy) 100%);
  display: grid;
  place-items: center;
}

.finalist-photo-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rank-medallion {
  position: absolute;
  left: 0.45rem;
  top: 0.45rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.45rem;
  border-radius: var(--radius-full);
  background: rgba(7, 13, 24, 0.82);
  color: var(--gold-light);
  border: 1px solid rgba(201, 154, 46, 0.5);
  backdrop-filter: blur(8px);
  font-size: 0.8rem;
  font-weight: 900;
}

.rank-medallion .app-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.finalist-info {
  min-width: 0;
  align-self: center;
  padding-right: 0.15rem;
}

.finalist-rank-badge {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 0.25rem 0.55rem;
  border-radius: var(--radius-full);
  background: var(--gold-soft);
  color: var(--gold-dark);
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

[data-theme='dark'] .finalist-rank-badge {
  background: rgba(201, 154, 46, 0.14);
  color: var(--gold-light);
}

.finalist-info h3 {
  margin-top: 0.45rem;
  font-size: clamp(1rem, 4.6vw, 1.2rem);
  font-weight: 900;
  line-height: 1.12;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}

.finalist-meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.65rem;
  margin-top: 0.4rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.finalist-meta-row span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.finalist-meta-row span:first-child {
  color: var(--gold-dark);
  font-weight: 900;
}

.finalist-meta-row .app-icon {
  width: 0.85rem;
  height: 0.85rem;
}

.finalist-advocacy {
  margin-top: 0.55rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.round-one-score-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--border-gold);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, rgba(201, 154, 46, 0.12), rgba(201, 154, 46, 0.04));
}

.round-one-score-chip span {
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.round-one-score-chip strong {
  color: var(--gold-dark);
  font-size: 1rem;
  font-weight: 900;
  white-space: nowrap;
}

[data-theme='dark'] .round-one-score-chip strong {
  color: var(--gold-light);
}

.finalist-card-footer {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
}

.finalist-card-footer .btn {
  flex: 0 0 auto;
}

@media (min-width: 520px) {
  .finalists-hero {
    padding: 1.25rem;
  }

  .finalist-card {
    grid-template-columns: 8rem 1fr;
  }

  .finalist-photo-wrap {
    min-height: 10rem;
  }
}

@media (min-width: 760px) {
  .finalists-hero {
    grid-template-columns: minmax(0, 1fr) minmax(20rem, auto);
    align-items: center;
    padding: 1.35rem;
  }

  .finalists-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .finalist-card {
    grid-template-columns: 1fr;
    padding: 0.85rem;
  }

  .finalist-photo-wrap {
    aspect-ratio: 4 / 3;
    min-height: 0;
  }
}

@media (min-width: 1180px) {
  .finalists-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .finalists-actions {
    justify-content: end;
  }
}

@media (max-width: 420px) {
  .finalists-hero {
    margin-left: -0.25rem;
    margin-right: -0.25rem;
  }

  .hero-icon-mark {
    width: 2.55rem;
    height: 2.55rem;
  }

  .finalist-card {
    grid-template-columns: 5rem 1fr;
    gap: 0.7rem;
  }

  .finalist-photo-wrap {
    min-height: 7.5rem;
  }

  .finalist-card-footer {
    align-items: stretch;
  }

  .finalist-card-footer .btn {
    min-width: 5.25rem;
  }
}
</style>
