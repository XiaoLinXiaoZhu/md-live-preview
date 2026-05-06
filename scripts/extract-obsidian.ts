/**
 * 逆向 Obsidian：用 happy-dom 提供完整 DOM 环境，
 * 直接执行 app.js，逐步 mock 报错的 API 直到能拿到 live preview extension
 */
import { Window } from "happy-dom";
import { readFileSync } from "fs";
import path from "path";

const code = readFileSync(path.join(import.meta.dir, "../public/vendor/obsidian-app.patched.js"), "utf-8");

// happy-dom 提供完整的浏览器 API
const window = new Window({ url: "app://obsidian.md/" });
const doc = window.document;

// 把 happy-dom 的全局对象注入
const g = globalThis as any;
Object.assign(g, {
  window,
  document: doc,
  navigator: { 
    ...window.navigator,
    appVersion: "5.0 (Windows NT 10.0; Win64; x64)",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    platform: "Win32",
    clipboard: { writeText() {}, readText() { return Promise.resolve(""); } },
    language: "en",
  },
  location: window.location,
  HTMLElement: window.HTMLElement,
  HTMLDivElement: window.HTMLDivElement,
  HTMLInputElement: window.HTMLInputElement,
  HTMLSpanElement: window.HTMLSpanElement,
  HTMLAnchorElement: window.HTMLAnchorElement,
  Node: window.Node,
  Element: window.Element,
  DocumentFragment: window.DocumentFragment,
  DOMParser: window.DOMParser,
  XMLSerializer: class { serializeToString() { return ""; } },
  MutationObserver: window.MutationObserver,
  IntersectionObserver: class { observe() {} disconnect() {} },
  ResizeObserver: class { observe() {} disconnect() {} unobserve() {} },
  requestAnimationFrame: (cb: any) => setTimeout(cb, 16),
  cancelAnimationFrame: (id: any) => clearTimeout(id),
  requestIdleCallback: (cb: any) => setTimeout(cb, 0),
  getComputedStyle: () => new Proxy({}, { get() { return ""; } }),
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  CSS: { supports() { return false; } },
  customElements: { define() {}, get() { return undefined; } },
  Image: class { set src(v: any) {} get width() { return 0; } get height() { return 0; } },
  Worker: class { postMessage() {} terminate() {} addEventListener() {} },
  FileReader: class { readAsArrayBuffer() {} readAsText() {} onload: null },
  performance: { now() { return Date.now(); }, mark() {}, measure() {} },
  crypto: { 
    getRandomValues(a: any) { for (let i = 0; i < a.length; i++) a[i] = Math.random() * 256 | 0; return a; },
    randomUUID() { return "mock-uuid"; },
  },
  fetch: () => Promise.resolve({ ok: true, json() { return Promise.resolve({}); }, text() { return Promise.resolve(""); } }),
  
  // Obsidian 特有的全局 helper
  createDiv: (arg: any) => {
    const el = doc.createElement("div");
    if (typeof arg === "string") el.className = arg;
    else if (arg && typeof arg === "object") {
      if (arg.cls) el.className = arg.cls;
      if (arg.text) el.textContent = arg.text;
    }
    // 链式方法
    (el as any).createDiv = (a: any) => { const c = g.createDiv(a); el.appendChild(c); return c; };
    (el as any).createEl = (tag: string, opts: any) => { const c = g.createEl(tag, opts); el.appendChild(c); return c; };
    (el as any).createSpan = (a: any) => { const c = g.createSpan(a); el.appendChild(c); return c; };
    (el as any).find = () => null;
    (el as any).findAll = () => [];
    (el as any).detach = () => el.remove();
    (el as any).empty = () => { el.innerHTML = ""; };
    (el as any).setText = (t: string) => { el.textContent = t; };
    (el as any).setAttr = (k: string, v: any) => el.setAttribute(k, v);
    (el as any).toggleClass = (cls: string, force?: boolean) => el.classList.toggle(cls, force);
    (el as any).addClass = (...cls: string[]) => el.classList.add(...cls);
    (el as any).removeClass = (...cls: string[]) => el.classList.remove(...cls);
    (el as any).hasClass = (cls: string) => el.classList.contains(cls);
    (el as any).instanceOf = (ctor: any) => el instanceof ctor;
    return el;
  },
  createEl: (tag: string, opts?: any) => {
    const el = doc.createElement(tag || "div");
    if (opts) {
      if (opts.cls) el.className = opts.cls;
      if (opts.text) el.textContent = opts.text;
      if (opts.type) el.setAttribute("type", opts.type);
      if (opts.href) el.setAttribute("href", opts.href);
      if (opts.attr) Object.entries(opts.attr).forEach(([k, v]) => el.setAttribute(k, v as string));
    }
    (el as any).createDiv = (a: any) => { const c = g.createDiv(a); el.appendChild(c); return c; };
    (el as any).createEl = (tag2: string, opts2: any) => { const c = g.createEl(tag2, opts2); el.appendChild(c); return c; };
    (el as any).createSpan = (a: any) => { const c = g.createSpan(a); el.appendChild(c); return c; };
    (el as any).find = () => null;
    (el as any).findAll = () => [];
    (el as any).detach = () => el.remove();
    (el as any).empty = () => { el.innerHTML = ""; };
    (el as any).setText = (t: string) => { el.textContent = t; };
    (el as any).setAttr = (k: string, v: any) => el.setAttribute(k, v);
    (el as any).toggleClass = (cls: string, force?: boolean) => el.classList.toggle(cls, force);
    (el as any).addClass = (...cls: string[]) => el.classList.add(...cls);
    (el as any).removeClass = (...cls: string[]) => el.classList.remove(...cls);
    (el as any).hasClass = (cls: string) => el.classList.contains(cls);
    (el as any).instanceOf = (ctor: any) => el instanceof ctor;
    return el;
  },
  createSpan: (arg: any) => {
    const el = g.createEl("span");
    if (typeof arg === "string") el.className = arg;
    else if (arg && typeof arg === "object") {
      if (arg.cls) el.className = arg.cls;
      if (arg.text) el.textContent = arg.text;
    }
    return el;
  },
  createFragment: () => doc.createDocumentFragment(),
  
  // Electron mock
  require: (mod: string) => {
    if (mod === "electron") {
      return {
        ipcRenderer: {
          send() {},
          sendSync(ch: string) { if (ch === "version") return "1.0.0"; return ""; },
          on() {},
          invoke() { return Promise.resolve(); },
        },
        remote: { getCurrentWindow() { return {}; } },
        clipboard: { writeText() {}, readText() { return ""; } },
        shell: { openExternal() {} },
      };
    }
    if (mod === "path") return { join: (...a: string[]) => a.join("/"), basename: (p: string) => p.split("/").pop(), dirname: (p: string) => p.split("/").slice(0, -1).join("/"), extname: (p: string) => "." + p.split(".").pop(), resolve: (...a: string[]) => a.join("/"), sep: "/" };
    if (mod === "fs") return { existsSync() { return false; }, readFileSync() { return ""; }, writeFileSync() {}, mkdirSync() {}, readdirSync() { return []; }, statSync() { return { isFile() { return false; }, isDirectory() { return false; } }; } };
    if (mod === "os") return { homedir() { return "/home/user"; }, platform() { return "win32"; }, tmpdir() { return "/tmp"; } };
    return {};
  },
  
  // Obsidian 的 ready() 函数
  ready: (cb: any) => { /* 不执行，避免初始化 app */ },
});

// 还需要在 document.body 上加 Obsidian 的 helper 方法
const body = doc.body as any;
body.createDiv = g.createDiv;
body.createEl = g.createEl;
body.find = () => null;
body.findAll = () => [];
body.hasClass = () => false;
body.toggleClass = () => {};
body.addClass = () => {};

// 加载 i18next（Obsidian 依赖）
const i18nextCode = readFileSync(path.join(import.meta.dir, "../public/vendor/lib/i18next.min.js"), "utf-8");
new Function(i18nextCode)();
console.log("i18next loaded:", typeof (g as any).i18next);

// Obsidian 的 i18n 数据和其他全局依赖
(g as any).OBSIDIAN_DEFAULT_I18N = {};
(g as any).localStorage = { getItem() { return null; }, setItem() {}, removeItem() {}, clear() {}, length: 0, key() { return null; } };
(g as any).sessionStorage = (g as any).localStorage;
(g as any).devicePixelRatio = 1;
(g as any).innerWidth = 1920;
(g as any).innerHeight = 1080;
(g as any).scrollX = 0;
(g as any).scrollY = 0;
(g as any).screen = { width: 1920, height: 1080, availWidth: 1920, availHeight: 1080 };

// Vim mode mock (Obsidian ships a CM6 vim extension)
(g as any).initVimMode = () => ({ Vim: {} });
(g as any).CodeMirrorAdapter = {};

// Window/Document globals that Obsidian might reference
(g as any).activeWindow = g.window;
(g as any).activeDocument = g.document;
(g as any).open = () => null;
(g as any).close = () => {};
(g as any).focus = () => {};
(g as any).blur = () => {};
(g as any).print = () => {};
(g as any).alert = () => {};
(g as any).confirm = () => true;
(g as any).prompt = () => "";
(g as any).postMessage = () => {};
(g as any).getSelection = () => ({ rangeCount: 0, getRangeAt() { return null; }, removeAllRanges() {}, addRange() {} });

// CodeMirror 5 (legacy — UMD format, exports via factory return)
const cmCode = readFileSync(path.join(import.meta.dir, "../public/vendor/lib/codemirror.js"), "utf-8");
// CM5 is UMD: (function(mod){...})(function(){...return CodeMirror})
// Eval it in a context where it can attach to window
const cmLoader = new Function("module", "exports", "define", cmCode + "\n;");
const fakeModule: any = { exports: {} };
cmLoader(fakeModule, fakeModule.exports, undefined);
(g.window as any).CodeMirror = fakeModule.exports;
// Also load markdown mode
const cmMarkdown = readFileSync(path.join(import.meta.dir, "../public/vendor/lib/markdown.js"), "utf-8");
new Function("CodeMirror", cmMarkdown)((g.window as any).CodeMirror);
console.log("CodeMirror 5 loaded:", typeof (g.window as any).CodeMirror);

// CodeMirror must also be a global (not just window.CodeMirror)
g.CodeMirror = (g.window as any).CodeMirror;

// URL/process mock — Obsidian checks window.process and URL.prototype.hostname
g.process = { platform: "win32", env: {}, versions: { electron: "28.0.0" }, cwd() { return "/"; } };
(g.window as any).process = g.process;

// Obsidian uses native URL class (not happy-dom's). Ensure it's available.
// happy-dom's URL doesn't have getters on prototype, use Bun's native URL
g.URL = URL;
(g.window as any).URL = URL;

// DOMPurify mock
g.DOMPurify = {
  sanitize(html: string) { return html; },
  addHook() {},
  removeHook() {},
  setConfig() {},
  isSupported: true,
};

// document.fonts mock
(g.document as any).fonts = { load() { return Promise.resolve([]); }, check() { return true; }, ready: Promise.resolve(), addEventListener() {} };

// enhance.js — Obsidian's global prototype patches (Array.contains, .remove, etc.)
// It references Document, HTMLElement etc as globals
g.Document = g.document.constructor;
g.HTMLElement = g.HTMLElement || class {};
g.HTMLDivElement = g.HTMLDivElement || class {};
g.TouchEvent = class {};
g.SVGElement = class {};
g.SVGSVGElement = class {};
g.Text = class {};
g.Comment = class {};
g.Range = class { setStart(){} setEnd(){} collapse(){} getBoundingClientRect(){ return {top:0,left:0,right:0,bottom:0,width:0,height:0}; } };
g.Selection = class {};
g.MouseEvent = class {};
g.KeyboardEvent = class {};
g.ClipboardEvent = class {};
g.DragEvent = class {};
g.FocusEvent = class {};
g.InputEvent = class {};
g.Event = class {};
g.CustomEvent = class {};
g.PointerEvent = class {};
g.WheelEvent = class {};
g.UIEvent = class {};
g.EventTarget = class { addEventListener(){} removeEventListener(){} dispatchEvent(){ return true; } };
const enhanceCode = readFileSync(path.join(import.meta.dir, "../public/vendor/enhance.js"), "utf-8");
new Function(enhanceCode)();
console.log("enhance.js loaded, Array.contains:", typeof ([] as any).contains);

// Turndown (HTML→Markdown converter)
const turndownCode = readFileSync(path.join(import.meta.dir, "../public/vendor/lib/turndown.js"), "utf-8");
new Function("window", turndownCode + "\nwindow.TurndownService = TurndownService;")(g.window);
console.log("TurndownService loaded:", typeof (g.window as any).TurndownService);

console.log("Environment ready. Executing app.js...");

try {
  const fn = new Function(code);
  fn();
  console.log("✓ app.js executed successfully!");
  console.log("window.app:", typeof (g.window as any).app);
} catch (e: any) {
  console.log(`✗ ERROR: ${e.message}`);
  // 找到错误在源码中的位置
  const match = e.stack?.match(/:(\d+):(\d+)/);
  if (match) {
    const col = parseInt(match[2]);
    console.log(`at column: ${col}`);
    // 看看那个位置的代码
    console.log(`code around error: ...${code.slice(Math.max(0, col - 50), col + 80)}...`);
  }
}

// Check what we got
const obs = (g.window as any).__obsidian;
if (obs) {
  const keys = Object.keys(obs);
  console.log(`\n✓ __obsidian exports: ${keys.length} keys`);
  
  // Find live preview related exports
  const lpKeys = keys.filter(k => k.toLowerCase().includes('live') || k.toLowerCase().includes('preview') || k.toLowerCase().includes('editor'));
  console.log("\nLive preview / editor related:", lpKeys.join(", "));
  
  // Check for livePreviewState
  console.log("\nlivePreviewState:", typeof obs.livePreviewState);
  console.log("MarkdownView:", typeof obs.MarkdownView);
  console.log("MarkdownRenderer:", typeof obs.MarkdownRenderer);
  
  // Try to inspect MarkdownView — it should have the live preview setup
  if (obs.MarkdownView) {
    const mvProto = obs.MarkdownView.prototype;
    const mvMethods = Object.getOwnPropertyNames(mvProto).filter(n => n !== 'constructor');
    const lpMethods = mvMethods.filter(m => m.toLowerCase().includes('live') || m.toLowerCase().includes('preview') || m.toLowerCase().includes('local'));
    console.log("\nMarkdownView methods related to live preview:", lpMethods.join(", "));
  }
  
  // List all 122 keys
  console.log("\nAll exports:", keys.join(", "));
} else {
  console.log("✗ __obsidian not found");
}

// Check for exposed kH/mH
console.log("\n✓ Direct window checks:");
console.log("  window.__kH:", typeof (g.window as any).__kH);
console.log("  window.__mH:", typeof (g.window as any).__mH);
console.log("  window.__internal:", typeof (g.window as any).__internal);

// Check __cm6
const cm6 = (g.window as any).__cm6;
if (cm6) {
  console.log("\n✓ __cm6 exposed:");
  for (const [k, v] of Object.entries(cm6)) {
    console.log(`  ${k}: ${typeof v}`);
  }
} else {
  console.log("✗ __cm6 not found");
}
