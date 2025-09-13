export class SearchManager {
    constructor(disasmContent) {
        this.disasmContent = disasmContent;
        this.searchResults = [];
        this.currentIndex = -1;
        this.query = '';
    }

    setSearchQuery(query) {
        this.query = query.toLowerCase().trim();
    }

    clearSearch() {
        this.searchResults = [];
        this.currentIndex = -1;
        this.clearHighlights();
    }

    searchAllLines(allLines) {
        this.searchResults = [];

        allLines.forEach((lineHtml, index) => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = lineHtml;
            const text = tempDiv.textContent || tempDiv.innerText || '';
            if (text.toLowerCase().includes(this.query)) {
                this.searchResults.push({ index });
            }
        });

        return this.searchResults;
    }

    highlightCurrent() {
        if (this.searchResults.length === 0) return;

        const resultIndex = this.searchResults[this.currentIndex].index;
        const targetTop = resultIndex * 25; // lineHeight

        this.disasmContent.scrollTo({
            top: targetTop,
            behavior: 'smooth'
        });

        // Highlight after scroll
        setTimeout(() => {
            const visibleLines = this.disasmContent.querySelectorAll('.line');
            visibleLines.forEach(line => {
                if (parseInt(line.dataset.index) === resultIndex) {
                    line.style.background = "#BA8E23";
                }
            });
        }, 100);
    }

    navigatePrevious() {
        if (this.searchResults.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.searchResults.length) % this.searchResults.length;
        this.highlightCurrent();
    }

    navigateNext() {
        if (this.searchResults.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.searchResults.length;
        this.highlightCurrent();
    }

    clearHighlights() {
        document.querySelectorAll('.line').forEach(el => {
            el.style.background = "none";
        });
    }
}