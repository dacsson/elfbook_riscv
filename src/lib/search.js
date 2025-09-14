export class SearchManager {
    constructor(content) {
        this.searchResults = [];
        this.currentIndex = -1;
        this.content = content;
        this.query = "";
    }

    onInput(searchInput) {
        this.query = searchInput.value.toLowerCase().trim();
        if (!this.query) {
            this.clearHighlights();
        }
    }

    // When query is ready => search in content
    onAcceptClick(scrollManager) {
        this.clearHighlights();

        // Search in all lines (not just visible ones)
        // We need to search through all the stored lines, not the DOM elements
        this.searchResults = [];

        // Search through all stored lines
        scrollManager.lines.forEach((lineHtml, index) => {
            // Extract text content from the HTML to search
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = lineHtml;
            const text = tempDiv.textContent || tempDiv.innerText || '';
            if (text.toLowerCase().includes(this.query)) {
                this.searchResults.push({ index }); // Store index instead of DOM element
            }
        });

        console.log("result search: ", this.searchResults)
        if (this.searchResults.length > 0) {
            this.currentIndex = 0;
            this.highlightCurrent();
        }
    }

    onQueryClear() {
        this.clearHighlights();
        this.query = "";
    }

    highlightCurrent() {
        if (this.searchResults.length === 0) return;

        // Get the index of the current search result
        const resultIndex = this.searchResults[this.currentIndex].index;

        // Scroll to the line in the virtual scroll container
        const targetTop = resultIndex * 25;

        // Scroll to the position
        this.content.scrollTo({
            top: targetTop,
            behavior: 'smooth'
        });

        // Wait for scroll to complete then highlight
        setTimeout(() => {
            // Find the actual DOM element after scroll
            const visibleLines = this.content.querySelectorAll('.line');
            visibleLines.forEach(line => {
                if (parseInt(line.dataset.index) === resultIndex) {
                    // Highlight this line
                    line.style.background = "#BA8E23";
                }
            });
        }, 100);
    }

    clearHighlights() {
        // Clear highlights from DOM elements
        document.querySelectorAll('.line').forEach(el => {
            el.style.background = "none"
        });
        this.searchResults = [];
        this.currentIndex = -1;
    }

    prev() {
        if (this.searchResults.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.searchResults.length) % this.searchResults.length;
        this.highlightCurrent();
    }

    next() {
        if (this.searchResults.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.searchResults.length;
        this.highlightCurrent();
    }
}