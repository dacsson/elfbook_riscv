export class UIManager {
    constructor() {
        this.fileBtn = document.getElementById('fileBtn');
        this.searchInput = document.getElementById('searchInput');
        this.searchAccept = document.getElementById('search-accept');
        this.searchClear = document.getElementById('search-clear');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.tabs = document.querySelectorAll('.tab');
        this.disasmContent = document.getElementById('disasmContent');
        this.readelfContent = document.getElementById('readelfContent');
        this.hexContainer = document.getElementById('hexContainer');
    }

    setupEventListeners(searchManager, fileHandler, virtualScroller) {
        // File button click
        this.fileBtn.addEventListener('click', async () => {
            const result = await fileHandler.openFile();
            if (result) {
                await fileHandler.processFile(result, {
                    resetState: () => {},
                    clearSearchState: () => {},
                    handleDisasmChunk: () => {},
                    handleHexDumpChunk: () => {},
                    handleReadelfChunk: () => {}
                });
            }
        });

        // Search input
        this.searchInput.addEventListener('input', () => {
            if (!this.searchInput.value.toLowerCase().trim()) {
                searchManager.clearSearch();
            }
        });

        // Search accept
        this.searchAccept.addEventListener('click', () => {
            // This will be handled in the main.js context with proper access to allLines
        });
        // Search clear
        this.searchClear.addEventListener('click', () => {
            searchManager.clearSearch();
            this.searchInput.value = '';
        });

        // Navigation buttons
        this.prevBtn.addEventListener('click', () => {
            searchManager.navigatePrevious();
        });

        this.nextBtn.addEventListener('click', () => {
            searchManager.navigateNext();
        });

        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab);
            });
        });

        // Resize handling
        window.addEventListener('resize', () => {
            virtualScroller.viewportHeight = this.disasmContent.clientHeight;
        });
    }

    switchTab(tab) {
        this.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        this.disasmContent.style.display = tabId === 'disasm' ? 'block' : 'none';
        this.readelfContent.style.display = tabId === 'readelf' ? 'block' : 'none';
    }
}