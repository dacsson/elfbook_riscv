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
        this.spacerElement = null;
    }

    init() {
        this.viewportHeight = this.container.clientHeight;
        this.setupSpacer();
        this.container.style.overflowY = 'auto';
        this.container.style.position = 'relative';
        // Ensure the container has proper scroll behavior
        this.container.style.height = '100%';
    }

    setupSpacer() {
        if (!this.spacerElement) {
            this.spacerElement = document.createElement('div');
            this.spacerElement.className = 'virtual-scroll-spacer';
            this.container.appendChild(this.spacerElement);
        }
    }

    updateHeight(height) {
        this.totalHeight = height;
        if (this.spacerElement) {
            this.spacerElement.style.height = `${this.totalHeight}px`;
        }
    }

    updateVisibleRange(start, end) {
        this.startIdx = start;
        this.endIdx = end;
    }

    renderLines(lines, renderCallback) {
        const fragment = document.createDocumentFragment();

        // Remove existing line elements (keep spacer)
        const children = Array.from(this.container.children);
        children.forEach(child => {
            if (child.classList && child.classList.contains('line')) {
                child.remove();
            }
        });

        // Create visible lines
        for (let i = this.startIdx; i < this.endIdx; i++) {
            const lineHtml = lines[i];
            if (lineHtml) {
                    const element = document.createElement('div');
                    element.className = 'line';
                    element.dataset.index = i;
                    element.innerHTML = lineHtml;
                    element.style.position = 'absolute';
                    element.style.top = `${i * this.lineHeight}px`;
                    element.style.width = '100%';
                    element.style.height = `${this.lineHeight}px`;
                    element.style.boxSizing = 'border-box';
                    renderCallback?.(element);
                    fragment.appendChild(element);
                }
            }

        this.container.appendChild(fragment);
    }

    // New method to properly handle scroll events
    handleScroll() {
        if (this.isScrolling) return;
        this.isScrolling = true;

        // Update scroll tracking variables
        this.scrollTop = this.container.scrollTop;
        this.viewportHeight = this.container.clientHeight;

        // Calculate visible range
        const startIdx = Math.max(0, Math.floor(this.scrollTop / this.lineHeight) - 5);
        const endIdx = Math.min(Math.ceil(this.totalHeight / this.lineHeight), startIdx + Math.ceil(this.viewportHeight / this.lineHeight) + 10);

        // Only update if range actually changed
        if (startIdx !== this.startIdx || endIdx !== this.endIdx) {
            this.updateVisibleRange(startIdx, endIdx);
            // Render only visible lines
            const linesToRender = window.allLines || [];
            this.renderLines(linesToRender, (element) => {
                this.container.appendChild(element);
            });
    }

        this.isScrolling = false;
}
}
