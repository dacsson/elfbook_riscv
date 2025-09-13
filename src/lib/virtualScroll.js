// src/virtualScroll.js

export class VirtualScrollManager {
    constructor(container, lineHeight = 25) {
        this.container = container;
        this.lineHeight = lineHeight;
        this.viewportHeight = 0;
        this.scrollTop = 0;
        this.totalHeight = 0;
        this.startIdx = 0;
        this.endIdx = 0;
        this.isScrolling = false;
        this.isInitialized = false;
        this.spacerElement = null;
        this.lines = [];
        this.renderCallback = null;
    }

    init(renderCallback) {
        this.renderCallback = renderCallback;
        this.viewportHeight = this.container.clientHeight;
        this.totalHeight = this.lines.length * this.lineHeight;

        if (!this.spacerElement) {
            this.spacerElement = document.createElement('div');
            this.spacerElement.className = 'virtual-scroll-spacer';
            this.container.appendChild(this.spacerElement);
        }

        this.updateSpacerHeight();
        this.container.style.overflowY = 'auto';
        this.container.style.position = 'relative';
        this.updateVisibleRange();
    }

    updateSpacerHeight() {
        if (this.spacerElement) {
            this.spacerElement.style.height = `${this.totalHeight}px`;
        }
    }

    updateVisibleRange() {
        if (this.lines.length === 0) return;

        this.startIdx = Math.max(0, Math.floor(this.scrollTop / this.lineHeight) - 10);
        this.endIdx = Math.min(this.lines.length, this.startIdx + Math.ceil(this.viewportHeight / this.lineHeight) + 20);

        if (this.renderCallback) {
            this.renderCallback(this.startIdx, this.endIdx);
        }
    }

    handleScroll() {
        if (this.isScrolling) return;
        this.isScrolling = true;

        this.scrollTop = this.container.scrollTop;
        requestAnimationFrame(() => {
            this.updateVisibleRange();
            this.isScrolling = false;
        });
    }

    setLines(newLines) {
        this.lines = newLines;
        this.totalHeight = this.lines.length * this.lineHeight;
        if (this.isInitialized) {
            this.updateSpacerHeight();
            this.updateVisibleRange();
        }
    }

    addLines(newLines) {
        this.lines = this.lines.concat(newLines);
        this.totalHeight = this.lines.length * this.lineHeight;
        if (this.isInitialized) {
            this.updateSpacerHeight();
            this.updateVisibleRange();
        }
    }

    reset() {
        this.lines = [];
        this.startIdx = 0;
        this.endIdx = 0;
        this.scrollTop = 0;
        this.totalHeight = 0;
        if (this.spacerElement) {
            this.spacerElement.style.height = '0px';
        }
    }
}