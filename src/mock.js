// Browser global mocks required by Obsidian's app.js
window.OBSIDIAN_DEFAULT_I18N = {};
i18next.init({ fallbackLng: 'en', ns: ['app'], defaultNS: 'app', initImmediate: false, interpolation: { escapeValue: false } });
i18next.addResourceBundle('en', 'app', {});
window.DOMPurify = { sanitize(h) { return h; }, addHook(){}, removeHook(){}, setConfig(){}, isSupported: true };
window.activeWindow = window;
window.activeDocument = document;
window.initVimMode = () => ({ Vim: {} });
window.CodeMirrorAdapter = {};
window.process = { platform: 'win32', env: {}, versions: { electron: '28.0.0' }, cwd() { return '/'; } };
window.ready = function() {};

if (!Event.prototype.detach) Event.prototype.detach = function() {};
