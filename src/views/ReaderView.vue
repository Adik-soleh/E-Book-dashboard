<template>
  <section class="reader" :class="{ dark: darkMode }">
    <div class="controls">
      <div class="left">
        <button @click="prevPage" :disabled="currentPage <= 1">Prev</button>
        <span>Page {{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage >= totalPages">Next</button>
      </div>
      <div class="right">
        <button @click="zoomOut">-</button>
        <button @click="zoomIn">+</button>
        <label class="toggle">
          <input type="checkbox" v-model="darkMode" />
          <span>Dark</span>
        </label>
      </div>
    </div>
    <canvas ref="canvasRef"></canvas>
  </section>
</template>

<script setup lang="ts">
import { markRaw, onMounted, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { readerApi } from '../api';
import { apiBaseUrl } from '../api/http';
import { useAuthStore } from '../stores/auth';
import { ensureDownloadToken, invalidateDownloadToken } from '../utils/downloadTokens';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import pdfWorkerSrc from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const route = useRoute();
const auth = useAuthStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const pdfDoc = shallowRef<PDFDocumentProxy | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const scale = ref(1.2);
const darkMode = ref(false);
const ebookId = route.params.id as string;

onMounted(async () => {
  if (!auth.user) return;
  const progress = await readerApi.getProgress(ebookId);
  if (progress) {
    currentPage.value = progress.lastPage;
  }
  await loadDocument();
});

watch(currentPage, (page) => {
  if (!pdfDoc.value) return;
  renderPage(page);
  readerApi.updateProgress({ ebookId, lastPage: page });
});

const fetchDocumentBuffer = async (hasRetried = false): Promise<ArrayBuffer> => {
  const token = await ensureDownloadToken(ebookId);
  const response = await fetch(`${apiBaseUrl}/download/${token}`);
  const shouldRetry = (response.status === 404 || response.status === 403) && !hasRetried;
  if (shouldRetry) {
    invalidateDownloadToken(ebookId);
    return fetchDocumentBuffer(true);
  }
  if (!response.ok) {
    throw new Error(`Failed to download ebook: ${response.status}`);
  }
  return response.arrayBuffer();
};

const loadDocument = async () => {
  const buffer = await fetchDocumentBuffer();
  const document = await pdfjsLib.getDocument({ data: buffer }).promise;
  const parsedDocument = markRaw(document);
  pdfDoc.value = parsedDocument;
  totalPages.value = parsedDocument.numPages;
  renderPage(currentPage.value);
};

const renderPage = async (pageNumber: number) => {
  if (!pdfDoc.value) return;
  const page = await pdfDoc.value.getPage(pageNumber);
  const viewport = page.getViewport({ scale: scale.value });
  const canvas = canvasRef.value;
  if (!canvas) return;
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext: context!, viewport }).promise;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1;
  }
};

const zoomIn = () => {
  scale.value += 0.1;
  renderPage(currentPage.value);
};

const zoomOut = () => {
  scale.value = Math.max(0.5, scale.value - 0.1);
  renderPage(currentPage.value);
};
</script>

<style scoped>
.reader {
  background: rgba(255, 255, 255, 0.04);
  padding: 1.5rem;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  align-items: center;
}

.reader.dark {
  background: rgba(15, 23, 42, 0.95);
  border-color: rgba(148, 163, 184, 0.2);
}

.controls {
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.left,
.right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.controls button {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: inherit;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
}

.controls button:disabled {
  opacity: 0.4;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.toggle input {
  accent-color: var(--accent);
}

canvas {
  max-width: 100%;
  border-radius: 20px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.6);
}
</style>
