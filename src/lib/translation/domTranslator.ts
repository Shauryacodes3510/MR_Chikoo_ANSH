import { isUserFacingText, isElementExcluded } from './filterUtils';
import { translationService } from './translationService';
import { MASTER_LANGUAGE_CODE } from './languages';

class DOMTranslator {
  private activeLanguage: string = MASTER_LANGUAGE_CODE;
  private observer: MutationObserver | null = null;
  private isObserving: boolean = false;
  private debounceTimeout: any = null;

  // WeakMaps to store original master texts without memory leaks
  private originalNodeTextMap: WeakMap<Node, string> = new WeakMap();
  private trackedNodes: Set<Node> = new Set();

  // Tracked attributes (placeholder, title, aria-label)
  private originalAttrMap: WeakMap<Element, Record<string, string>> = new WeakMap();
  private trackedElements: Set<Element> = new Set();

  // Translation in-progress status
  private isTranslating: boolean = false;
  private statusListeners: Set<(translating: boolean) => void> = new Set();

  constructor() {
    // Whenever translation service receives new translations, apply them to DOM
    translationService.subscribe((lang) => {
      if (lang === this.activeLanguage && this.activeLanguage !== MASTER_LANGUAGE_CODE) {
        this.applyTranslationsToDOM();
      }
    });
  }

  public subscribeStatus(cb: (translating: boolean) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private setTranslating(val: boolean) {
    if (this.isTranslating !== val) {
      this.isTranslating = val;
      this.statusListeners.forEach(cb => cb(val));
    }
  }

  /**
   * Set active language and immediately translate or restore DOM.
   */
  public setLanguage(targetLanguage: string) {
    if (this.activeLanguage === targetLanguage) return;

    const prevLanguage = this.activeLanguage;
    this.activeLanguage = targetLanguage;

    if (targetLanguage === MASTER_LANGUAGE_CODE) {
      // Instantly restore original master text
      this.restoreOriginalText();
      this.stopObserver();
      this.setTranslating(false);
    } else {
      // If switching from another language, restore to original English baseline first
      if (prevLanguage !== MASTER_LANGUAGE_CODE) {
        this.restoreOriginalText();
      }
      this.startObserver();
      this.debouncedTranslateScreen(0);
    }
  }

  public getActiveLanguage(): string {
    return this.activeLanguage;
  }

  public getIsTranslating(): boolean {
    return this.isTranslating;
  }

  /**
   * Debounced screen translation to prevent rapid sequential calls during UI transitions.
   */
  public debouncedTranslateScreen(delay = 40) {
    if (this.activeLanguage === MASTER_LANGUAGE_CODE) return;

    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.translateScreen();
    }, delay);
  }

  /**
   * Scan and apply cached translations to an added DOM subtree synchronously.
   */
  private scanAndApplySubtree(rootNode: Node) {
    if (this.activeLanguage === MASTER_LANGUAGE_CODE) return;

    if (rootNode.nodeType === Node.TEXT_NODE) {
      this.processTextNodeSync(rootNode);
      return;
    }

    if (rootNode.nodeType === Node.ELEMENT_NODE) {
      const el = rootNode as HTMLElement;
      if (isElementExcluded(el)) return;

      const walker = document.createTreeWalker(
        el,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent || isElementExcluded(parent)) return NodeFilter.FILTER_REJECT;
            const text = node.nodeValue?.trim();
            if (!text || !isUserFacingText(text)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let textNode = walker.nextNode();
      while (textNode) {
        this.processTextNodeSync(textNode);
        textNode = walker.nextNode();
      }
    }
  }

  /**
   * Synchronously process a single text node: store original English and apply cache if available.
   */
  private processTextNodeSync(node: Node) {
    const parent = node.parentElement;
    if (parent && isElementExcluded(parent)) return;

    const currentText = node.nodeValue || '';
    const trimmed = currentText.trim();
    if (!trimmed || !isUserFacingText(trimmed)) return;

    let original = this.originalNodeTextMap.get(node);
    if (original === undefined) {
      original = currentText;
      this.originalNodeTextMap.set(node, original);
      this.trackedNodes.add(node);
    }

    const cached = translationService.getCached(original, this.activeLanguage);
    if (cached && node.nodeValue !== cached) {
      node.nodeValue = cached;
    }
  }

  /**
   * Start observing DOM mutations for dynamic on-screen translation.
   */
  private startObserver() {
    if (this.isObserving || typeof window === 'undefined') return;

    const targetNode = document.body || document.getElementById('root');
    if (!targetNode) return;

    this.observer = new MutationObserver((mutations) => {
      if (this.activeLanguage === MASTER_LANGUAGE_CODE) return;

      let shouldScan = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            this.scanAndApplySubtree(mutation.addedNodes[i]);
          }
          shouldScan = true;
        } else if (mutation.type === 'characterData') {
          const target = mutation.target;
          if (!target || !target.nodeValue) continue;

          if (target.parentElement && isElementExcluded(target.parentElement)) continue;

          const currentVal = target.nodeValue;
          const orig = this.originalNodeTextMap.get(target);

          if (orig === undefined) {
            if (isUserFacingText(currentVal)) {
              this.originalNodeTextMap.set(target, currentVal);
              this.trackedNodes.add(target);
              const cached = translationService.getCached(currentVal, this.activeLanguage);
              if (cached && target.nodeValue !== cached) {
                target.nodeValue = cached;
              } else if (!cached) {
                shouldScan = true;
              }
            }
          } else {
            const cachedForOrig = translationService.getCached(orig, this.activeLanguage);
            if (currentVal === orig) {
              // React re-rendered and placed the original English back into the DOM
              if (cachedForOrig && target.nodeValue !== cachedForOrig) {
                target.nodeValue = cachedForOrig;
              } else if (!cachedForOrig && isUserFacingText(orig)) {
                shouldScan = true;
              }
            } else if (cachedForOrig && currentVal === cachedForOrig) {
              // Already displaying the translated string
            } else {
              // React or dynamic state set a completely new string (e.g. next question or new feedback)
              if (isUserFacingText(currentVal)) {
                this.originalNodeTextMap.set(target, currentVal);
                const newCached = translationService.getCached(currentVal, this.activeLanguage);
                if (newCached && target.nodeValue !== newCached) {
                  target.nodeValue = newCached;
                } else {
                  shouldScan = true;
                }
              }
            }
          }
        }
      }

      if (shouldScan) {
        this.debouncedTranslateScreen(40);
      }
    });

    this.observer.observe(targetNode, {
      childList: true,
      subtree: true,
      characterData: true
    });

    this.isObserving = true;
  }

  private stopObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isObserving = false;
    clearTimeout(this.debounceTimeout);
  }

  private isKnownTranslation(currentText: string, originalText: string): boolean {
    const cached = translationService.getCached(originalText, this.activeLanguage);
    return cached === currentText;
  }

  /**
   * Scan visible DOM, update cached items synchronously, and collect all uncached
   * strings on the current screen to translate them in a single batched request.
   */
  public translateScreen() {
    if (this.activeLanguage === MASTER_LANGUAGE_CODE || typeof document === 'undefined') {
      return;
    }

    const root = document.body || document.getElementById('root');
    if (!root) return;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (isElementExcluded(parent)) return NodeFilter.FILTER_REJECT;

          const text = node.nodeValue?.trim();
          if (!text || !isUserFacingText(text)) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodesToTranslate: Node[] = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      nodesToTranslate.push(currentNode);
      currentNode = walker.nextNode();
    }

    const uncachedTextsToFetch: string[] = [];
    const nodeTextMap: Map<Node, string> = new Map();

    for (const node of nodesToTranslate) {
      let originalText = this.originalNodeTextMap.get(node);
      if (originalText === undefined) {
        originalText = node.nodeValue || '';
        this.originalNodeTextMap.set(node, originalText);
        this.trackedNodes.add(node);
      }

      const trimmed = originalText.trim();
      if (!trimmed) continue;

      nodeTextMap.set(node, originalText);

      // Check if already in cache (Memory or LocalStorage)
      const cached = translationService.getCached(originalText, this.activeLanguage);
      if (cached !== null) {
        if (node.nodeValue !== cached) {
          node.nodeValue = cached;
        }
      } else {
        uncachedTextsToFetch.push(trimmed);
      }
    }

    // Also scan attributes (placeholders, titles)
    const uncachedAttrsToFetch = this.scanAttributes(root);
    const combinedUncached = [...uncachedTextsToFetch, ...uncachedAttrsToFetch];

    // If there are uncached strings on the current screen, fetch them in a single batch
    if (combinedUncached.length > 0) {
      this.setTranslating(true);
      const uniqueUncached = Array.from(new Set(combinedUncached));

      // Trigger batched translation
      translationService.translateBatch(uniqueUncached, this.activeLanguage)
        .then(() => {
          this.applyTranslationsToDOM();
        })
        .catch((err) => {
          console.warn('[DOMTranslator] Translation request failed gracefully:', err);
        })
        .finally(() => {
          this.setTranslating(false);
        });
    } else {
      this.setTranslating(false);
    }
  }

  /**
   * Scan input placeholders and button titles.
   */
  private scanAttributes(root: HTMLElement): string[] {
    const uncached: string[] = [];
    const elementsWithAttrs = root.querySelectorAll('input[placeholder], textarea[placeholder], button[title], [title], [aria-label]');
    
    elementsWithAttrs.forEach((el) => {
      if (isElementExcluded(el as HTMLElement)) return;

      let origAttrs = this.originalAttrMap.get(el);
      if (!origAttrs) {
        origAttrs = {};
        this.originalAttrMap.set(el, origAttrs);
        this.trackedElements.add(el);
      }

      // Placeholder
      const placeholder = el.getAttribute('placeholder');
      if (placeholder && isUserFacingText(placeholder)) {
        if (origAttrs.placeholder === undefined) {
          origAttrs.placeholder = placeholder;
        }
        const cached = translationService.getCached(origAttrs.placeholder, this.activeLanguage);
        if (cached) {
          el.setAttribute('placeholder', cached);
        } else {
          uncached.push(origAttrs.placeholder.trim());
        }
      }

      // Title
      const title = el.getAttribute('title');
      if (title && isUserFacingText(title)) {
        if (origAttrs.title === undefined) {
          origAttrs.title = title;
        }
        const cached = translationService.getCached(origAttrs.title, this.activeLanguage);
        if (cached) {
          el.setAttribute('title', cached);
        } else {
          uncached.push(origAttrs.title.trim());
        }
      }
    });

    return uncached;
  }

  /**
   * Apply all available cached translations to tracked DOM nodes.
   */
  public applyTranslationsToDOM() {
    if (this.activeLanguage === MASTER_LANGUAGE_CODE) return;

    for (const node of this.trackedNodes) {
      if (!node.isConnected) {
        this.trackedNodes.delete(node);
        continue;
      }
      const originalText = this.originalNodeTextMap.get(node);
      if (originalText) {
        const cached = translationService.getCached(originalText, this.activeLanguage);
        if (cached && node.nodeValue !== cached) {
          node.nodeValue = cached;
        }
      }
    }

    for (const el of this.trackedElements) {
      if (!el.isConnected) {
        this.trackedElements.delete(el);
        continue;
      }
      const origAttrs = this.originalAttrMap.get(el);
      if (origAttrs) {
        if (origAttrs.placeholder) {
          const cached = translationService.getCached(origAttrs.placeholder, this.activeLanguage);
          if (cached) el.setAttribute('placeholder', cached);
        }
        if (origAttrs.title) {
          const cached = translationService.getCached(origAttrs.title, this.activeLanguage);
          if (cached) el.setAttribute('title', cached);
        }
      }
    }
  }

  /**
   * Instantly restore all text nodes and element attributes back to master English text.
   */
  public restoreOriginalText() {
    for (const node of this.trackedNodes) {
      if (node.isConnected) {
        const originalText = this.originalNodeTextMap.get(node);
        if (originalText !== undefined) {
          node.nodeValue = originalText;
        }
      }
    }

    for (const el of this.trackedElements) {
      if (el.isConnected) {
        const origAttrs = this.originalAttrMap.get(el);
        if (origAttrs) {
          if (origAttrs.placeholder !== undefined) {
            el.setAttribute('placeholder', origAttrs.placeholder);
          }
          if (origAttrs.title !== undefined) {
            el.setAttribute('title', origAttrs.title);
          }
          if (origAttrs['aria-label'] !== undefined) {
            el.setAttribute('aria-label', origAttrs['aria-label']);
          }
        }
      }
    }
  }
}

export const domTranslator = new DOMTranslator();
