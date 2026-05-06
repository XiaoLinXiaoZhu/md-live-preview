// MathJax stub — prevents errors with Obsidian's math rendering
// Provides a minimal API surface that won't crash the decoration pipeline
window.MathJax = window.MathJax || {};

// $.chtmlStylesheet() — must return a DOM <style> element with .detach() method
var _mjStyle = document.createElement('style');
_mjStyle.dataset = { mjxChtml: 'true' };
_mjStyle.detach = function() { this.remove(); };
window.MathJax.chtmlStylesheet = function() { return _mjStyle; };

// $.tex2chtml — converts tex to simple text span (no real math rendering)
window.MathJax.tex2chtml = function(tex, opts) {
  var el = document.createElement('span');
  el.className = 'math-stub';
  el.textContent = tex;
  el.style.fontFamily = 'monospace';
  el.style.color = 'var(--text-accent)';
  return el;
};

// $.options — accessed but also conditionally deleted
window.MathJax.options = {
  renderActions: {},
};

// $.tex — namespace for math delimiters
window.MathJax.tex = {
  inlineMath: [['$','$'], ['\\(','\\)']],
  displayMath: [['$$','$$'], ['\\[','\\]']],
  processEscapes: true,
};

// $.startup — promise-based init
window.MathJax.startup = {
  promise: Promise.resolve(),
  document: document,
};

// $.typeset / $.typesetPromise — no-ops
window.MathJax.typesetPromise = function() { return Promise.resolve(); };
window.MathJax.typeset = function() {};
