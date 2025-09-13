import { formatDisasm, formatHexDump, formatReadelfOutput } from "./lib/formatter.js";
import { VirtualScrollManager } from "./lib/virtualScroll.js";

// import { invoke, Channel } from '@tauri-apps/api/core';
const { invoke, Channel } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

const DISASSEMBLE_EVENT = 'disassembled'
const onDasmEvent = new Channel()
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

    // Virtual scrolling managers
    let disasmScrollManager = null;
    let hexScrollManager = null;

    // Initialize virtual scroll managers
    disasmScrollManager = new VirtualScrollManager(disasmContent, 25);
    hexScrollManager = new VirtualScrollManager(hexContainer, 25);
    onDasmEvent.onmessage = (message) => {
        try {
            // Store all lines for virtual scrolling
            const lines = message.split('\n').filter(line => line.trim() !== '');
            const formattedLines = lines.map(line => formatDisasm(line));

            // Append new lines
            if (!disasmScrollManager.isInitialized) {
                disasmScrollManager.setLines(formattedLines);
                disasmScrollManager.isInitialized = true;
                disasmContent.addEventListener('scroll', () => disasmScrollManager.handleScroll());
            } else {
                disasmScrollManager.addLines(formattedLines);
            }
        } catch (e) {
            console.log("Error chunk: ", e)
        }
    };

    onHexdEvent.onmessage = (message) => {
        try {
            // For hex dump, we'll also use virtual scrolling for consistency
            const lines = message.split('\n').filter(line => line.trim() !== '');
            const formattedLines = lines.map(line => formatHexDump(line)).filter(html => html.trim() !== '');
            // Append to hex lines array for virtual scrolling
            if (!hexScrollManager.isInitialized) {
                hexScrollManager.setLines(formattedLines);
                hexScrollManager.isInitialized = true;
                hexContainer.addEventListener('scroll', () => hexScrollManager.handleScroll());
            } else {
                hexScrollManager.addLines(formattedLines);
            }
        } catch (e) {
            console.log("Error chunk: ", e)
        }
    }

    // Render functions for virtual scrolling
    function renderDisasmLines(startIdx, endIdx) {
        if (disasmScrollManager.lines.length === 0) return;
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
            const lineHtml = disasmScrollManager.lines[i];
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

        container.appendChild(fragment);
    }

    function renderHexLines(startIdx, endIdx) {
        if (hexScrollManager.lines.length === 0) return;
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
        for (let i = startIdx; i < endIdx; i++) {
            const lineHtml = hexScrollManager.lines[i];
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

        container.appendChild(fragment);
    }

    // Initialize virtual scrolling with proper spacer
    disasmScrollManager.init(renderDisasmLines);
    hexScrollManager.init(renderHexLines);
    fileBtn.addEventListener('click', async () => {
        const result = await window.__TAURI__.dialog.open({
            multiple: false,
            filters: [
                { name: 'Binary Files', extensions: ['bin', 'elf', 'out'] }
            ]
        });
        if (result) {
            // Reset state
            disasmScrollManager.reset();
            hexScrollManager.reset();
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
        disasmScrollManager.lines.forEach((lineHtml, index) => {
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
        const targetTop = resultIndex * 25;

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
        if (disasmScrollManager.lines.length > 0 && disasmScrollManager.isInitialized) {
            disasmScrollManager.viewportHeight = disasmContent.clientHeight;
            disasmScrollManager.updateVisibleRange();
        }
        if (hexScrollManager.lines.length > 0 && hexScrollManager.isInitialized) {
            hexScrollManager.viewportHeight = hexContainer.clientHeight;
            hexScrollManager.updateVisibleRange();
        }
    });

    // Add scroll listener for hex container
    hexContainer.addEventListener('scroll', () => hexScrollManager.handleScroll());
});
