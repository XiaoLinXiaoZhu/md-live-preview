const status = document.getElementById('status');

export function createEditor() {
  if (!window.__cm6 || !window.__cm6.EditorView) {
    status.textContent = '✗ CM6 not loaded';
    status.className = 'status err';
    return;
  }

  const { EditorView, EditorState, StateEffect, Prec, keymap, Compartment } = window.__cm6;
  const { searchHighlight: If } = window.__fields;
  const { editor: jB, owner: WB, livePreview: KB } = window.__stateFields;
  const { updateField: UB } = window.__stateEffects;
  const { inputHandler: pT, stateField: lT, keymap: fT, markdownSurround: iB } = window.__closeBrackets;
  const { base: ZB, dynamic: iN } = window.__compartments;
  const indentUnit = window.__indentUnit;
  const language = window.__language;
  const baseExtensions = window.__baseExtensions;
  const hangingIndent = window.__hangingIndent;
  const lineNumbers = window.__lineNumbers;
  const activeLineGutter = window.__activeLineGutter;
  const highlightActiveLineGutter = window.__highlightActiveLineGutter;
  const indentGuide = window.__indentGuide;
  const foldGutter = window.__foldGutter;
  const foldExtensions = window.__foldExtensions;
  const foldHeading = window.__foldHeading;
  const foldIndent = window.__foldIndent;
  const foldEffect = window.__foldEffect;
  const frontmatterHandler = window.__frontmatterHandler;
  const { indentMore, indentLess, newlineAndIndent } = window.__commands;
  const listRegex = window.__listRegex;

  const sampleDoc = `# Live Preview Demo

This is **bold text** and *italic text* and ~~strikethrough~~.

Inline \`code\` looks like this.

## Links

[Click here](https://example.com) to visit a link.

[[Internal link]] to another note.

## Blockquotes

> This is a blockquote.
> It can span multiple lines.

> [!NOTE]
> This is a note callout.

> [!WARNING]
> This is a warning callout.
> Pay attention to this content.

> [!TIP]
> Here's a helpful tip for you.

## Lists

- Item one
- Item two with **bold**
- [ ] Unchecked task
- [x] Completed task

1. First ordered
2. Second ordered

## Code Block

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

---

## Math

$$E = mc^2$$

Inline math: $a^2 + b^2 = c^2$

## Tags

#tag1 #tag2

Try editing — cursor reveals raw markdown, moving away renders it.
`;

  const editorEl = document.querySelector('.markdown-source-view');

  // Mock app object
  const mockApp = {
    vault: {
      getConfig(key) {
        const configs = {
          tabSize: 4, useTab: true, readableLineLength: true,
          showFrontmatter: false, livePreview: true,
          autoPairBrackets: true, autoPairMarkdown: true,
          rightToLeft: false, spellcheck: false,
          showLineNumber: true, showIndentGuide: true,
          foldHeading: true, foldIndent: true,
          smartIndentList: true, propertiesInDocument: 'visible',
        };
        return configs[key];
      },
      adapter: { getResourcePath(p) { return p; } },
      on() { return { id: 0 }; }, off() {},
      offref() {},
      getAbstractFileByPath() { return null; },
    },
    workspace: {
      openLinkText() {},
      getActiveFile() { return null; },
      activeEditor: null,
      on() { return { id: 0 }; }, off() {},
      offref() {},
      trigger() {},
      editorExtensions: [],
      editorSuggest: { close() {}, isShowingSuggestion() { return false; }, trigger() {} },
    },
    metadataCache: {
      getFirstLinkpathDest() { return null; },
      getFileCache() { return null; },
      getCache() { return null; },
      on() { return { id: 0 }; }, off() {},
      offref() {},
    },
    internalPlugins: {
      getPluginById() { return null; },
    },
    plugins: { getPlugin() { return null; } },
    keymap: { pushScope() {}, popScope() {}, getRootScope() { return {}; } },
    commands: { executeCommandById() {} },
    isVimEnabled() { return false; },
    mobileToolbar: { update() {} },
  };

  try {
    // Step 1: Create bare EditorView
    const view = new EditorView({ parent: editorEl });
    console.log('EditorView created');

    // Step 2: Build mockEditor (mirrors Obsidian's aN class)
    const mockOwner = {
      file: { path: 'demo.md', name: 'demo.md', basename: 'demo', extension: 'md' },
      saveImmediately() {},
    };

    const mockEditor = {
      app: mockApp,
      get path() { return mockOwner.file?.path || ''; },
      get file() { return mockOwner.file; },
      cm: view,
      editor: null,
      editorEl,
      livePreviewPlugin: null,
      cleanupLivePreview: null,
      sourceMode: false,
      scope: null,
      owner: mockOwner,
      clipboardManager: {
        handleDragOver(e) {},
        handleDrop(e) {},
        handlePaste(e) {},
      },
      addChild(c) { return c; },
      removeChild(c) {},
      register(cb) {},
      registerEvent(ref) {},
      editorSuggest: { close() {}, isShowingSuggestion() { return false; }, trigger() {} },
      editTableCell(table, cell) {
        const miniDiv = document.createElement('div');
        const miniState = EditorState.create({ doc: cell?.text || '' });
        const miniView = new EditorView({ state: miniState, parent: miniDiv });
        return { editor: { cm: miniView }, containerEl: miniDiv };
      },
      destroyTableCell() {},
      onUpdate(update, docChanged) {},
      onEditorClick(e) {},
      updateLinkPopup() {},
    };

    mockEditor.editor = {
      cm: view,
      getSelection() { return ''; },
      getCursor() { return { line: 0, ch: 0 }; },
      getLine(n) { return ''; },
      removeHighlights() {},
      expandText() {},
    };

    // Step 3: Build localExtensions (mirrors buildLocalExtensions)
    const localExtensions = [
      jB.init(() => view),
      WB.init(() => mockOwner),
      EditorView.updateListener.of((update) => {}),
      hangingIndent,
      language,
      // Smart list continuation on Enter, Tab indent/unindent
      keymap.of([
        {
          key: 'Enter',
          run(view) {
            const state = view.state;
            const { head } = state.selection.main;
            const line = state.doc.lineAt(head);
            const match = listRegex.exec(line.text);
            if (!match) return false;
            const prefix = match[0];
            const blockquote = match[1] || '';
            const listMarker = match[2] || '';
            if (!listMarker) return false;
            if (line.text.slice(prefix.length).trim() === '') {
              view.dispatch({ changes: { from: line.from, to: line.to, insert: '' } });
              return true;
            }
            let newMarker = listMarker;
            const ordNum = match[4];
            if (ordNum) {
              const sep = match[5];
              newMarker = (parseInt(ordNum) + 1) + sep;
            }
            const checkbox = match[6] !== undefined ? '[ ] ' : '';
            if (checkbox) newMarker = newMarker.replace(/\[.\] $/, '');
            const insert = '\n' + blockquote + newMarker + checkbox;
            view.dispatch({
              changes: { from: head, insert },
              selection: { anchor: head + insert.length },
              userEvent: 'input.type',
            });
            return true;
          },
          shift(view) {
            return newlineAndIndent(view);
          },
          preventDefault: true,
        },
        {
          key: 'Tab',
          run(view) { return indentMore(view); },
          shift(view) { return indentLess(view); },
        },
      ]),
    ];

    // Step 4: Build dynamicExtensions (mirrors getDynamicExtensions)
    const tabSize = mockApp.vault.getConfig('tabSize');
    const useTab = mockApp.vault.getConfig('useTab');
    const indent = useTab ? '\t' : ' '.repeat(Math.min(Math.max(tabSize, 2), 4));

    const dynamicExtensions = [
      EditorState.tabSize.of(tabSize),
      indentUnit.of(indent),
      EditorView.contentAttributes.of({
        spellcheck: String(mockApp.vault.getConfig('spellcheck')),
        autocorrect: 'on',
        autocapitalize: 'on',
        contenteditable: 'true',
      }),
      KB.init(() => true),
    ];

    // Line numbers (conditional)
    if (mockApp.vault.getConfig('showLineNumber')) {
      dynamicExtensions.push(lineNumbers({ fixed: false }), activeLineGutter, highlightActiveLineGutter());
    }
    // Indent guides (conditional)
    if (mockApp.vault.getConfig('showIndentGuide')) {
      dynamicExtensions.push(indentGuide);
    }
    // Folding (conditional)
    const foldHeadingEnabled = mockApp.vault.getConfig('foldHeading');
    const foldIndentEnabled = mockApp.vault.getConfig('foldIndent');
    if (foldHeadingEnabled || foldIndentEnabled) {
      editorEl.classList.add('is-folding');
      dynamicExtensions.push(foldGutter(), ...foldExtensions);
      if (foldHeadingEnabled) dynamicExtensions.push(foldHeading);
      if (foldIndentEnabled) dynamicExtensions.push(foldIndent);
      dynamicExtensions.push(foldEffect);
    }

    // Live preview extensions (kH)
    const livePreviewExts = window.__kH(mockEditor, view);
    dynamicExtensions.push(livePreviewExts);
    console.log('kH returned', livePreviewExts.length, 'extensions');

    // Auto-pair brackets and markdown
    const autoPairBrackets = mockApp.vault.getConfig('autoPairBrackets');
    const autoPairMarkdown = mockApp.vault.getConfig('autoPairMarkdown');
    if (autoPairBrackets || autoPairMarkdown) {
      const brackets = [];
      if (autoPairBrackets) brackets.push('(', '[', '{', "'", '"');
      if (autoPairMarkdown) brackets.push('*', '_', '`', '```');
      dynamicExtensions.push(pT, lT);
      dynamicExtensions.push(keymap.of(fT));
      dynamicExtensions.push(
        EditorState.languageData.of(() => [{ closeBrackets: { brackets } }])
      );
      dynamicExtensions.push(iB);
      dynamicExtensions.push(frontmatterHandler);
    }

    // Step 5: Create full state
    const nN = ZB.of(baseExtensions);
    const fullState = EditorState.create({
      doc: sampleDoc,
      extensions: [
        localExtensions,
        iN.of(dynamicExtensions),
        nN,
      ],
    });

    view.setState(fullState);
    console.log('State set with full extensions');

    // Force decoration rebuild after syntax tree parses
    function forceRebuild() {
      view.dispatch({});
      const tree = window.__cm6.syntaxTree(view.state);
      if (tree.length < view.state.doc.length) {
        setTimeout(forceRebuild, 50);
      }
    }
    setTimeout(forceRebuild, 50);

    status.textContent = '✓ Live preview active';
    status.className = 'status ok';
    console.log('Live preview editor ready!');

  } catch (e) {
    console.error('Editor creation error:', e);
    status.textContent = '✗ ' + e.message;
    status.className = 'status err';
  }
}
