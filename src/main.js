import { formatDisasm, formatHexDump, formatReadelfOutput } from "./formatter.js";

// import { invoke, Channel } from '@tauri-apps/api/core';
const { invoke, Channel } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const DISASSEMBLE_EVENT = 'disassembled'
const onDasmEvent = new Channel()
// onDasmEvent.onmessage = (message) => {
//   try {
//     const disasmContainer = document.getElementById('disasmContent');
//     disasmContainer.insertAdjacentHTML('beforeend', formatDisasm(message));
//   } catch (e) {
//     console.log("Error chunk: ", e)
//   }
// }

const HEXDUMP_EVENT = 'hexdumped'
const onHexdEvent = new Channel()

const READELF_EVENT = 'elfinfodumped'
const onRelfEvent = new Channel()
onRelfEvent.onmessage = (message) => {
    try {
        const readelfContainer = document.getElementById('readelfContent');
        readelfContainer.insertAdjacentHTML('beforeend', formatReadelfOutput(message));
    } catch (e) {
        console.log("Error hex dump: ", e)
    }
}

const BACKEND_ERROR_EVENT = 'backend_error'
const onBackErrorEvent = new Channel()
onBackErrorEvent.onmessage = (message) => {
    try {
        alert('Error: ' + message);
    } catch (e) {
        console.log("Error to aler (?!): ", e)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const fileBtn = document.getElementById('fileBtn');
    const searchInput = document.getElementById('searchInput');
    const searchAccept = document.getElementById('search-accept')
    const searchClear = document.getElementById('search-clear')
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const tabs = document.querySelectorAll('.tab');
    const disasmContent = document.getElementById('disasmContent');
    const readelfContent = document.getElementById('readelfContent');
    const hexContainer = document.getElementById('hexContainer');
    let query = ""

    // Virtual scrolling variables
    let allLines = [];
    let lineHeight = 25;
    let viewportHeight = 0;
    let scrollTop = 0;
    let totalHeight = 0;
    let startIdx = 0;
    let endIdx = 0;
    let isScrolling = false;
    let isInitialized = false;

    // Create spacer element for proper scroll height
    let spacerElement = null;

    // Virtual scrolling variables for hex dump
    let hexLines = [];
    let hexLineHeight = 25;
    let hexViewportHeight = 0;
    let hexScrollTop = 0;
    let hexTotalHeight = 0;
    let hexStartIdx = 0;
    let hexEndIdx = 0;
    let hexIsScrolling = false;
    let hexIsInitialized = false;
    let hexSpacerElement = null;

    onDasmEvent.onmessage = (message) => {
        try {
            // Store all lines for virtual scrolling
            const lines = message.split('\n').filter(line => line.trim() !== '');
            const formattedLines = lines.map(line => formatDisasm(line));

            // Append new lines
            allLines = allLines.concat(formattedLines);

            // Reinitialize virtual scrolling if first batch
            if (!isInitialized && allLines.length === formattedLines.length) {
                initVirtualScroll();
                isInitialized = true;
                disasmContent.addEventListener('scroll', handleScroll);
            } else {
                // Update total height for subsequent batches
        totalHeight = allLines.length * lineHeight;
        updateSpacerHeight();
        updateVisibleRange();
    }
        } catch (e) {
            console.log("Error chunk: ", e)
        }
    };

    onHexdEvent.onmessage = (message) => {
        try {
            // For hex dump, we'll also use virtual scrolling for consistency
            const hexContainer = document.getElementById('hexContainer');

            // Parse hex dump lines and store them for virtual scrolling
            const lines = message.split('\n').filter(line => line.trim() !== '');
            const formattedLines = lines.map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length < 2) return '';
                const addr = parts[0];
                const bytes = parts.slice(1).join(' ');
                return `
        <div class="line">
          <span class="line-numbers">${addr}</span>
          <span class="code-content">${bytes}</span>
        </div>
      `;
            }).filter(html => html.trim() !== '');

            // Append to hex lines array for virtual scrolling
            hexLines = hexLines.concat(formattedLines);

            // Update hex container height and trigger virtual scroll
            if (hexLines.length === formattedLines.length) {
                initHexVirtualScroll();
            } else {
                // Update total height for subsequent batches
        hexTotalHeight = hexLines.length * hexLineHeight;
        hexSpacerElement.style.height = `${hexTotalHeight}px`;
        updateHexVisibleRange();
    }
        } catch (e) {
            console.log("Error chunk: ", e)
        }
    }

    // Initialize virtual scrolling with proper spacer
    function initVirtualScroll() {
            viewportHeight = disasmContent.clientHeight;
        totalHeight = allLines.length * lineHeight;

        // Create or reset spacer element
        if (!spacerElement) {
            spacerElement = document.createElement('div');
            spacerElement.className = 'virtual-scroll-spacer';
            disasmContent.appendChild(spacerElement);
        }

        updateSpacerHeight();
        disasmContent.style.overflowY = 'auto';
        disasmContent.style.position = 'relative';
        updateVisibleRange();
        }

    // Update the spacer height to match total content height
    function updateSpacerHeight() {
        if (spacerElement) {
            spacerElement.style.height = `${totalHeight}px`;
        }
    }

    // Update visible range based on scroll position
    function updateVisibleRange() {
        if (allLines.length === 0) return;

        startIdx = Math.max(0, Math.floor(scrollTop / lineHeight) - 10);
        endIdx = Math.min(allLines.length, startIdx + Math.ceil(viewportHeight / lineHeight) + 20);

        renderVisibleLines();
    }

    // Render only visible lines
    function renderVisibleLines() {
        if (allLines.length === 0) return;

        const container = disasmContent;
        const fragment = document.createDocumentFragment();

        // Remove existing line elements (keep spacer)
        const children = Array.from(container.children);
        children.forEach(child => {
            if (child.classList && child.classList.contains('line')) {
                child.remove();
            }
    });

        // Create visible lines
        for (let i = startIdx; i < endIdx; i++) {
            const lineHtml = allLines[i];
            if (lineHtml) {
                const element = document.createElement('div');
                element.className = 'line';
                element.dataset.index = i;
                element.innerHTML = lineHtml;
                element.style.position = 'absolute';
                element.style.top = `${i * lineHeight}px`;
                element.style.width = '100%';
                element.style.height = `${lineHeight}px`;
                element.style.boxSizing = 'border-box';
                fragment.appendChild(element);
            }
        }

        container.appendChild(fragment);
    }

    // Handle scroll events with debouncing
    function handleScroll() {
        if (isScrolling) return;
        isScrolling = true;

        scrollTop = disasmContent.scrollTop;
        requestAnimationFrame(() => {
            updateVisibleRange();
            isScrolling = false;
});
    }

    // Initialize hex virtual scrolling
    function initHexVirtualScroll() {
        hexViewportHeight = hexContainer.clientHeight;
        hexTotalHeight = hexLines.length * hexLineHeight;

        // Create or reset spacer element
        if (!hexSpacerElement) {
            hexSpacerElement = document.createElement('div');
            hexSpacerElement.className = 'virtual-scroll-spacer';
            hexContainer.appendChild(hexSpacerElement);
        }

        hexSpacerElement.style.height = `${hexTotalHeight}px`;
        hexContainer.style.overflowY = 'auto';
        hexContainer.style.position = 'relative';
        updateHexVisibleRange();
    }

    // Update hex visible range based on scroll position
    function updateHexVisibleRange() {
        if (hexLines.length === 0) return;

        hexStartIdx = Math.max(0, Math.floor(hexScrollTop / hexLineHeight) - 10);
        hexEndIdx = Math.min(hexLines.length, hexStartIdx + Math.ceil(hexViewportHeight / hexLineHeight) + 20);

        renderHexVisibleLines();
    }

    // Render only visible hex lines
    function renderHexVisibleLines() {
        if (hexLines.length === 0) return;

        const container = hexContainer;
        const fragment = document.createDocumentFragment();

        // Remove existing line elements (keep spacer)
        const children = Array.from(container.children);
        children.forEach(child => {
            if (child.classList && child.classList.contains('line')) {
                child.remove();
            }
        });

        // Create visible lines
        for (let i = hexStartIdx; i < hexEndIdx; i++) {
            const lineHtml = hexLines[i];
            if (lineHtml) {
                const element = document.createElement('div');
                element.className = 'line';
                element.dataset.index = i;
                element.innerHTML = lineHtml;
                element.style.position = 'absolute';
                element.style.top = `${i * hexLineHeight}px`;
                element.style.width = '100%';
                element.style.height = `${hexLineHeight}px`;
                element.style.boxSizing = 'border-box';
                fragment.appendChild(element);
            }
        }

        container.appendChild(fragment);
    }

    // Handle hex scroll events with debouncing
    function handleHexScroll() {
        if (hexIsScrolling) return;
        hexIsScrolling = true;

        hexScrollTop = hexContainer.scrollTop;
        requestAnimationFrame(() => {
            updateHexVisibleRange();
            hexIsScrolling = false;
        });
    }

    fileBtn.addEventListener('click', async () => {
        const result = await window.__TAURI__.dialog.open({
            multiple: false,
            filters: [
                { name: 'Binary Files', extensions: ['bin', 'elf', 'out'] }
            ]
        });
        if (result) {
            // Reset state
            allLines = [];
            startIdx = 0;
            endIdx = 0;
            scrollTop = 0;
            hexLines = [];
            hexStartIdx = 0;
            hexEndIdx = 0;
            hexScrollTop = 0;

            const promises = [
                invoke("disassemble_file", { filePath: result, onEvent: onDasmEvent }),
                invoke("hexdump_file", { filePath: result, onEvent: onHexdEvent }),
                invoke("readelf_file", { filePath: result, onEvent: onRelfEvent })
            ];

            await Promise.all(promises);
        }
    });

    let searchResults = [];
    let currentIndex = -1;

    searchInput.addEventListener('input', () => {
        query = searchInput.value.toLowerCase().trim();
        if (!query) {
            clearHighlights();
        }
    });

    searchAccept.addEventListener('click', () => {
        clearHighlights();

        // Search in all lines (not just visible ones)
        // We need to search through all the stored lines, not the DOM elements
        searchResults = [];

        // Search through all stored lines
        allLines.forEach((lineHtml, index) => {
            // Extract text content from the HTML to search
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = lineHtml;
            const text = tempDiv.textContent || tempDiv.innerText || '';
            if (text.toLowerCase().includes(query)) {
                searchResults.push({ index }); // Store index instead of DOM element
            }
        });

        console.log("result search: ", searchResults)
        if (searchResults.length > 0) {
            currentIndex = 0;
            highlightCurrent();
        }
    })

    searchClear.addEventListener('click', () => {
        clearHighlights();
        query = "";
    })

    prevBtn.addEventListener('click', () => {
        if (searchResults.length === 0) return;
        currentIndex = (currentIndex - 1 + searchResults.length) % searchResults.length;
        highlightCurrent();
    });

    nextBtn.addEventListener('click', () => {
        if (searchResults.length === 0) return;
        currentIndex = (currentIndex + 1) % searchResults.length;
        highlightCurrent();
    });

    function highlightCurrent() {
        if (searchResults.length === 0) return;

        // Get the index of the current search result
        const resultIndex = searchResults[currentIndex].index;

        // Scroll to the line in the virtual scroll container
        const targetTop = resultIndex * lineHeight;

        // Scroll to the position
        disasmContent.scrollTo({
            top: targetTop,
            behavior: 'smooth'
        });

        // Wait for scroll to complete then highlight
        setTimeout(() => {
            // Find the actual DOM element after scroll
            const visibleLines = disasmContent.querySelectorAll('.line');
            visibleLines.forEach(line => {
                if (parseInt(line.dataset.index) === resultIndex) {
                    // Highlight this line
                    line.style.background = "#BA8E23";
                }
            });
        }, 100);
    }

    function clearHighlights() {
        // Clear highlights from DOM elements
        document.querySelectorAll('.line').forEach(el => {
            el.style.background = "none"
        });
        searchResults = [];
        currentIndex = -1;
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            disasmContent.style.display = tabId === 'disasm' ? 'block' : 'none';
            readelfContent.style.display = tabId === 'readelf' ? 'block' : 'none';
            hexContainer.style.display = tabId === 'hexdump' ? 'block' : 'none';
        });
    });

    window.addEventListener('resize', () => {
        if (allLines.length > 0 && isInitialized) {
            viewportHeight = disasmContent.clientHeight;
            updateVisibleRange();
        }
        if (hexLines.length > 0 && hexIsInitialized) {
            hexViewportHeight = hexContainer.clientHeight;
            updateHexVisibleRange();
        }
    });

    // Add scroll listener for hex container
    hexContainer.addEventListener('scroll', handleHexScroll);
});
