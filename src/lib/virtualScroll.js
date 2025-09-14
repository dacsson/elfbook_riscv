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
    }

    init() {
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


        this.render(this.startIdx, this.endIdx);
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

    render() {
        if (this.lines.length === 0) return;
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
            const lineHtml = this.lines[i];
            if (lineHtml) {
                const element = document.createElement('div');
                element.className = 'line';
                element.dataset.index = i;
                element.innerHTML = lineHtml;
                element.style.position = 'absolute';
                element.style.top = `${i * 25}px`;
                element.style.width = '100%';
                element.style.height = '25px';
                element.style.boxSizing = 'border-box';
                fragment.appendChild(element);
            }
        }

        this.container.appendChild(fragment);
    }

}