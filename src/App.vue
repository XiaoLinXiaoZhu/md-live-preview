<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { createEditor } from './create';
import type { EditorInstance } from './types';
import demoDoc from './demo-doc.md?raw';

const editorContainer = ref<HTMLElement>();
const status = ref<{ text: string; state: 'loading' | 'ok' | 'err' }>({
  text: 'Loading Obsidian engine...',
  state: 'loading',
});

let editor: EditorInstance | null = null;

onMounted(() => {
  if (!editorContainer.value) return;

  try {
    editor = createEditor(editorContainer.value, {
      doc: demoDoc,
      filePath: 'demo.md',
      theme: 'dark',
      onChange(doc) {
        console.log(`[demo] doc changed, length=${doc.length}`);
      },
      onSave(doc) {
        console.log('[demo] save requested, length=', doc.length);
      },
    });

    status.value = { text: '✓ Live preview active', state: 'ok' };
    window.__editorInstance = editor;
  } catch (e: any) {
    console.error('Editor creation error:', e);
    status.value = { text: '✗ ' + e.message, state: 'err' };
  }
});
</script>

<template>
  <div id="toolbar">
    <span>md-live-preview</span>
    <span class="status" :class="status.state">{{ status.text }}</span>
  </div>
  <div class="view-content">
    <div
      ref="editorContainer"
      class="markdown-source-view mod-cm6 is-live-preview is-readable-line-width"
    />
  </div>
</template>
