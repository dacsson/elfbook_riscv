/// Disassembly formatter
export function formatDisasm(disasmText) {
    return disasmText
        .split('\n')
        .map(line => {
            // Skip info on file (first line in objdump)
            if (line.includes("file format")) return '';

            // Trim whitespace
            const trimmed = line.trim();

            // Check for function name (e.g., "0000000000000000 <foo>:")
            const funcMatch = trimmed.match(/^([0-9a-fA-F]+)\s+<(.+)>:/);
            if (funcMatch) {
                const addr = funcMatch[1];
                const name = funcMatch[2];
                return `
          <div class="line">
            <span class="line-numbers">${addr}</span>
            <span class="code-content" style="color:#5fa6ff;"><strong>${name}</strong>:</span>
          </div>
        `;
            }

            // Check for regular instruction (e.g., "0: 06400f93      li t6, 0x64")
            const instMatch = trimmed.match(/^([0-9a-fA-F]+):\s+(.*)$/);
            if (instMatch) {
                const addr = instMatch[1];
                const code = instMatch[2];
                return `
          <div class="line">
            <span class="line-numbers">${addr}</span>
            <span class="code-content">${code}</span>
          </div>
        `;
            }

            // Skip empty lines
            if (!trimmed) return '';

            // Fallback
            return `
        <div class="line">
          <span class="line-numbers"></span>
          <span class="code-content" style="color:#808080">${trimmed}</span>
        </div>
      `;
        })
        .join('');
}

/// Format hex dump of an elf file
export function formatHexDump(hexText) {
    return hexText
        .split('\n')
        .map(line => {
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
        })
        .join('');
}

/// Format output of `readelf` cmd
export function formatReadelfOutput(rawOutput) {
    const lines = rawOutput.trim().split('\n');
    let result = '';
    let currentSection = '';

    lines.forEach(line => {
        if (!line.trim()) return;

        // Detect section headers (e.g., "Program Headers", "Section Headers")
        const sectionMatch = line.match(/^(\w+[\s\w]+):$/);
        if (sectionMatch) {
            const sectionName = sectionMatch[1].trim();
            currentSection = sectionName;
            result += `<div class="section"><strong>${sectionName}</strong></div>`;
            return;
        }

        // Detect key-value pairs (e.g., "Type: EXEC (Executable file)")
        const kvMatch = line.match(/^(\w+[\s\w]+):\s+(.*)$/);
        if (kvMatch) {
            const key = kvMatch[1].trim();
            const value = kvMatch[2].trim();
            result += `<div class="kv"><span class="key">${key}:</span> <span class="value">${value}</span></div>`;
            return;
        }

        // Detect numbered entries (e.g., "  [ 0] .text")
        const numberedMatch = line.match(/^\s*\[(\d+)\]\s+(.*)$/);
        if (numberedMatch) {
            const index = numberedMatch[1];
            const content = numberedMatch[2].trim();
            result += `<div class="entry"><span class="index">[${index}]</span> <span class="content">${content}</span></div>`;
            return;
        }

        // Detect hex dumps (e.g., "  00000000: 7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00")
        const hexMatch = line.match(/^\s*([0-9a-fA-F]{8}):\s+(.*)$/);
        if (hexMatch) {
            const addr = hexMatch[1];
            const bytes = hexMatch[2];
            result += `<div class="hex"><span class="addr">${addr}</span> <span class="bytes">${bytes}</span></div>`;
            return;
        }

        // Fallback: plain text
        result += `<div class="text">${line.trim()}</div>`;
    });

    return result;
}

/// Format SPEC responce (pages with query)
export function formatSpec(response, query) {
    return response.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>');
    // const lines = response.trim().split('\n');
    // let res = '';
    // lines.forEach(line => {
    //     let pageNumMatch = line.trim().match(/^(\d+)$/);
    //
    //     // Highlight query found in text
    //     if (query && line.includes(query)) {
    //         line = line.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>');
    //     }
    //
    //     if (pageNumMatch) {
    //         res += `<hr>`
    //     }
    //     else {
    //         res += `<p>${line}</p>`;
    //     }
    // });
    // let result = '<pre>';
    // result += res;
    // result += '</pre>';
    // return result;
}