<template>
  <AdminLayout title="Official Reports">
    <p class="section-subhead report-intro">Download one score sheet per category for judge signatures, then the overall round report.</p>
    <LoadingState v-if="loading" label="report categories" />
    <p v-else-if="error" class="error-text">{{ error }}</p>
    <template v-else>
      <section v-for="group in groups" :key="group.key" class="panel report-section">
        <div class="section-head">
          <div>
            <span class="eyebrow">{{ group.label }}</span>
            <h2>{{ group.label }} Reports</h2>
            <p class="section-subhead">Each category PDF lists candidate scores by judge and provides judge signature lines.</p>
          </div>
          <button class="btn btn-gold" type="button" :disabled="downloading === `${group.key}:overall`" @click="download(group.key, null)">
            <AppIcon name="arrowDownTray" /> Overall PDF
          </button>
        </div>
        <div class="report-grid">
          <div v-for="category in group.categories" :key="category.key" class="report-card">
            <div><strong>{{ category.label }}</strong><p>{{ category.weight }}% weight · {{ category.locked ? 'Locked' : 'Open' }}</p></div>
            <button class="btn btn-ghost btn-sm" type="button" :disabled="downloading === `${group.key}:${category.key}`" @click="download(group.key, category)">
              <AppIcon name="arrowDownTray" /> Category PDF
            </button>
          </div>
        </div>
      </section>
    </template>
    <Toast :message="message" />
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import AdminLayout from '../../layouts/AdminLayout.vue';
import AppIcon from '../../components/AppIcon.vue';
import LoadingState from '../../components/LoadingState.vue';
import Toast from '../../components/Toast.vue';
import { api } from '../../services/api.js';

const pageant = ref({});
const loading = ref(true);
const downloading = ref('');
const error = ref('');
const message = ref('');
const groups = computed(() => [
  { key: 'round-one', label: 'Round 1', categories: pageant.value.roundOneCategories || [] },
  { key: 'final', label: 'Final Round', categories: pageant.value.finalCategories || [] }
]);

onMounted(async () => {
  try {
    const { data } = await api.get('/pageant');
    pageant.value = data.pageant;
  } catch (requestError) {
    error.value = requestError.response?.data?.message || 'Unable to load report categories.';
  } finally {
    loading.value = false;
  }
});

async function download(round, category) {
  const key = `${round}:${category?.key || 'overall'}`;
  downloading.value = key;
  try {
    const path = category
      ? `/admin/exports/${round}/category/${encodeURIComponent(category.key)}`
      : `/admin/exports/${round}?format=pdf`;
    const response = await api.get(path, { responseType: 'blob' });
    const href = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = href;
    link.download = category ? `${round}-${category.key}-judge-scores.pdf` : `${round}-overall-results.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  } catch (requestError) {
    message.value = requestError.response?.data?.message || 'Unable to download report.';
  } finally {
    downloading.value = '';
  }
}
</script>

<style scoped>
.report-intro { margin-bottom: 1rem; }
.report-section { margin-bottom: 1rem; }
.report-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 0.75rem; }
.report-card { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; padding: 0.9rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-hover); }
.report-card p { color: var(--text-muted); font-size: 0.75rem; }
</style>
