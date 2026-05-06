/**
 * 链接点击处理：内部链接 [[link]] 和外部链接 [text](url) 的交互逻辑。
 */
import type { EditorBackend } from './types.js';

export function setupLinkClickHandler(
  view: any, editorEl: HTMLElement, opts: any, be: Required<EditorBackend>
) {
  editorEl.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target || !target.closest) return;

    const internalLink = target.closest('.internal-link, .cm-hmd-internal-link');
    if (internalLink) {
      e.preventDefault();
      e.stopPropagation();
      const linkText = (internalLink as HTMLElement).getAttribute('data-href')
        || (internalLink as HTMLElement).getAttribute('href')
        || (internalLink as HTMLElement).textContent?.trim() || '';
      if (linkText) {
        if (opts.onLinkClick) {
          opts.onLinkClick(linkText, opts.filePath || '');
        } else {
          be.openFile(linkText);
        }
      }
      return;
    }

    const externalLink = target.closest('.external-link') as HTMLElement;
    if (externalLink) {
      const href = externalLink.getAttribute('href') || externalLink.getAttribute('data-href') || '';
      if (href && /^https?:|^mailto:/.test(href)) {
        e.preventDefault();
        e.stopPropagation();
        if (opts.onExternalLinkClick) {
          opts.onExternalLinkClick(href);
        } else {
          window.open(href, '_blank');
        }
        return;
      }
    }

    const underline = target.closest('.cm-underline') as HTMLElement;
    if (underline) {
      const linkParent = underline.closest('.cm-hmd-internal-link');
      if (linkParent) {
        e.preventDefault();
        e.stopPropagation();
        const pos = view.posAtDOM(underline);
        const linkContent = extractLinkAtPos(view, pos);
        if (linkContent) {
          if (opts.onLinkClick) {
            opts.onLinkClick(linkContent, opts.filePath || '');
          } else {
            be.openFile(linkContent);
          }
        }
        return;
      }
      const extParent = underline.closest('.cm-link');
      if (extParent) {
        const urlEl = extParent.parentElement?.querySelector('.cm-url, .cm-string') as HTMLElement;
        if (urlEl) {
          const url = urlEl.textContent?.replace(/^\(|\)$/g, '') || '';
          if (/^https?:/.test(url)) {
            e.preventDefault();
            e.stopPropagation();
            if (opts.onExternalLinkClick) {
              opts.onExternalLinkClick(url);
            } else {
              window.open(url, '_blank');
            }
          }
        }
      }
    }
  });
}

function extractLinkAtPos(view: any, pos: number): string | null {
  const doc = view.state.doc.toString();
  const before = doc.lastIndexOf('[[', pos);
  if (before !== -1 && before >= pos - 200) {
    const after = doc.indexOf(']]', before + 2);
    if (after !== -1 && after < pos + 200) {
      const content = doc.slice(before + 2, after);
      const pipeIdx = content.indexOf('|');
      return pipeIdx !== -1 ? content.slice(0, pipeIdx) : content;
    }
  }
  return null;
}
