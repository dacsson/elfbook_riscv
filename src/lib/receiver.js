import {formatDisasm, formatHexDump, formatReadelfOutput} from "./formatter.js";

const {invoke, Channel} = window.__TAURI__.core;

// An opponent of backend's `Sender`
// receives events from backend
export class Receiver {
    constructor() {
        this.disasmChannel = new Channel();
        this.hexChannel = new Channel();
        this.readelfChannel = new Channel();
        this.errorChannel = new Channel();
    }

    initEvents(disasmScrollManager, disasmContent, hexScrollManager, hexContainer) {
        this.disasmChannel.onmessage = (message) => {
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

        this.hexChannel.onmessage = (message) => {
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

        this.readelfChannel.onmessage = (message) => {
            try {
                const readelfContainer = document.getElementById('readelfContent');
                readelfContainer.insertAdjacentHTML('beforeend', formatReadelfOutput(message));
            } catch (e) {
                console.log("Error hex dump: ", e)
            }
        }

        this.errorChannel.onmessage = (message) => {
            try {
                alert('Error: ' + message);
            } catch (e) {
                console.log("Error to aler (?!): ", e)
            }
        }
    }

    async tieChannelsToEvents(result, disasmScrollManager, hexScrollManager) {
        // Reset state
        disasmScrollManager.reset();
        hexScrollManager.reset();
        const promises = [
            invoke("disassemble_file", {filePath: result, onEvent: this.disasmChannel}),
            invoke("hexdump_file", {filePath: result, onEvent: this.hexChannel}),
            invoke("readelf_file", {filePath: result, onEvent: this.readelfChannel})
        ];

        await Promise.all(promises);
    }
}