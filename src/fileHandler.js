import { formatDisasm, formatHexDump, formatReadelfOutput } from "../formatter.js";

const { invoke, Channel } = window.__TAURI__.core;

export class FileHandler {
    constructor(disasmContent, hexContainer, readelfContent) {
        this.disasmContent = disasmContent;
        this.hexContainer = hexContainer;
        this.readelfContent = readelfContent;
        this.channels = {
            onDasmEvent: new Channel(),
            onHexdEvent: new Channel(),
            onRelfEvent: new Channel()
        };
    }

    async openFile() {
        const result = await window.__TAURI__.dialog.open({
            multiple: false,
            filters: [
                { name: 'Binary Files', extensions: ['bin', 'elf', 'out'] }
            ]
        });
        return result;
    }

    setupChannels(callbacks) {
        // Setup disassembly channel
        this.channels.onDasmEvent.onmessage = (message) => {
            callbacks.handleDisasmChunk(message);
        };

        // Setup hexdump channel
        this.channels.onHexdEvent.onmessage = (message) => {
            callbacks.handleHexDumpChunk(message);
        };

        // Setup readelf channel
        this.channels.onRelfEvent.onmessage = (message) => {
            callbacks.handleReadelfChunk(message);
        };
    }

    async processFile(filePath, callbacks) {
        // Reset state
        callbacks.resetState();

        // Clear existing content
        this.disasmContent.innerHTML = '';
        this.hexContainer.innerHTML = '';
        this.readelfContent.innerHTML = '';

        // Reset search state
        callbacks.clearSearchState();

        const promises = [
            invoke("disassemble_file", { filePath, onEvent: this.channels.onDasmEvent }),
            invoke("hexdump_file", { filePath, onEvent: this.channels.onHexdEvent }),
            invoke("readelf_file", { filePath, onEvent: this.channels.onRelfEvent })
        ];

        await Promise.all(promises);
    }
}