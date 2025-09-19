import {VirtualScrollManager} from "./lib/virtualScroll.js";
import {SearchManager} from "./lib/search.js";
import {Receiver} from "./lib/receiver.js";

const {invoke} = window.__TAURI__.core;

document.addEventListener('DOMContentLoaded', () => {
    const fileBtn = document.getElementById('fileBtn');
    const searchInput = document.getElementById('searchInput');
    const searchAccept = document.getElementById('search-accept')
    const searchClear = document.getElementById('search-clear')
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const rightTabs = document.querySelectorAll('.sidebar.right-sidebar .tab');
    const leftTabs = document.querySelectorAll('.sidebar.left-sidebar .tab');
    const disasmContent = document.getElementById('disasmContent');
    const readelfContent = document.getElementById('readelfContent');
    const hexContainer = document.getElementById('hexContainer');
    const specContent = document.getElementById('specContainer')

    // Virtual scrolling managers
    let disasmScrollManager = new VirtualScrollManager(disasmContent, 25);
    let hexScrollManager = new VirtualScrollManager(hexContainer, 25);

    // Init search
    let searchManager = new SearchManager(disasmContent);

    // Initialize virtual scrolling with proper spacer
    disasmScrollManager.init();
    hexScrollManager.init();

    // Init event receiver
    let receiver = new Receiver();

    // Init events
    // receiver.initEvents(disasmScrollManager, disasmContent, hexScrollManager, hexContainer);
    receiver.initListeners(disasmScrollManager, disasmContent, hexScrollManager, hexContainer);

    fileBtn.addEventListener('click', async () => {
        const result = await window.__TAURI__.dialog.open({
            multiple: false,
            filters: [
                {name: 'Binary Files', extensions: ['bin', 'elf', 'out']}
            ]
        });
        if (result) {
            await receiver.launchFile(result, disasmScrollManager, hexScrollManager)
        }
    });

    searchInput.addEventListener('input', () => {
        searchManager.onInput(searchInput)
    });

    searchAccept.addEventListener('click', async () => {
        searchManager.onAcceptClick(disasmScrollManager)
        invoke("read_spec", {query: searchInput.value})
    })

    searchClear.addEventListener('click', () => {
        searchManager.onQueryClear();
        searchInput.value = '';
        const specContainer = document.getElementById('specContainer');
        specContainer.innerHTML = '';
    })

    prevBtn.addEventListener('click', () => {
        searchManager.prev();
    });

    nextBtn.addEventListener('click', () => {
        searchManager.next();
    });

    rightTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            rightTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            disasmContent.style.display = tabId === 'disasm' ? 'block' : 'none';
            readelfContent.style.display = tabId === 'readelf' ? 'block' : 'none';
            // hexContainer.style.display = tabId === 'hexdump' ? 'block' : 'none';
        });
    });

    leftTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            leftTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            hexContainer.style.display = tabId === 'hex' ? 'block' : 'none';
            specContent.style.display = tabId === 'spec' ? 'block' : 'none';
        });
    })

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
