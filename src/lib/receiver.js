import {formatDisasm, formatHexDump, formatReadelfOutput, formatSpec} from "./formatter.js";

const {invoke, Channel} = window.__TAURI__.core;
const {listen} = window.__TAURI__.event;

const DISASM_EVENT = "disassembled"
const HEXDUMP_EVENT = "hexdumped"
const ELFINFO_EVENT = "elfinfodumped"
const ERROR_EVENT = "backend_error"
const SPECRESULT_EVENT = "specresult"

// An opponent of backend's `Sender`
// receives events from backend
export class Receiver {
    constructor() {
        this.disasmChannel = new Channel();
        this.hexChannel = new Channel();
        this.readelfChannel = new Channel();
        this.errorChannel = new Channel();
    }

    // Seems like channels are not reusable?
    // testing needed to make sure to use
    // channels or to use events
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
                // virtual scrolling
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

    initListeners(disasmScrollManager, disasmContent, hexScrollManager, hexContainer) {
        listen(DISASM_EVENT, (message) => {
            console.log("mL ", message)
            try {
                // Store all lines for virtual scrolling
                const lines = message.payload.split('\n').filter(line => line.trim() !== '');
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
        })

        listen(HEXDUMP_EVENT, (message) => {
            try {
                // virtual scrolling
                const lines = message.payload.split('\n').filter(line => line.trim() !== '');
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
        })

        listen(ELFINFO_EVENT, (message) => {
            try {
                const readelfContainer = document.getElementById('readelfContent');
                readelfContainer.insertAdjacentHTML('beforeend', formatReadelfOutput(message.payload));
            } catch (e) {
                console.log("Error hex dump: ", e)
            }
        })

        listen(ERROR_EVENT, (message) => {
            try {
                alert('Error: ' + message.payload);
            } catch (e) {
                console.log("Error to aler (?!): ", e)
            }
        })

        listen(SPECRESULT_EVENT, (message) => {
            try {
                const specContainer = document.getElementById('specContainer');
                const searchQuery = document.getElementById('searchInput').value;
                specContainer.innerHTML += formatSpec(message.payload, searchQuery);
            } catch (e) {
                console.log("Error special result: ", e)
            }
        })
    }

    // Do the flow on uploaded file -> run programs on it
    async launchFile(result, disasmScrollManager, hexScrollManager) {
        // Reset state
        disasmScrollManager.reset();
        hexScrollManager.reset();
        const promises = [
            invoke("disassemble_file", {filePath: result}),
            invoke("hexdump_file", {filePath: result}),
            invoke("readelf_file", {filePath: result})
        ];

        await Promise.all(promises);
    }
}