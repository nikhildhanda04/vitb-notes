// AI-written flowcharts often put ( ) : ' & etc. inside unquoted node labels, e.g. A[Admitted (NCLT)],
// which Mermaid rejects. Quote every plain [..] {..} (..) label so it's read as text.
// Only touches flowcharts; already-quoted labels and special shapes like ((..)) [[..]] are left alone.

// A label ends at its closing bracket when what follows is an edge, a separator or the end of the line
const END = String.raw`(?=\s*(?:-->|---|-\.|==>|--|&|;|:::|$))`;
const SHAPES: [open: string, close: string][] = [["[", "]"], ["{", "}"], ["(", ")"]];

const esc = (s: string) => s.replace(/[[\]{}()]/g, "\\$&");

export function fixMermaid(chart: string): string {
    if (!/^\s*(graph|flowchart)\b/.test(chart)) return chart;

    let fixed = chart;
    for (const [open, close] of SHAPES) {
        // id, opening bracket, label not starting with a quote or another bracket, closing bracket
        const node = new RegExp(String.raw`(\b[\w-]+)${esc(open)}([^"\[\](){}\n][^\n]*?)${esc(close)}${END}`, "gm");
        fixed = fixed.replace(node, (_, id: string, label: string) => `${id}${open}"${label.replace(/"/g, "#quot;")}"${close}`);
    }

    // Edge labels: -->|text| and -- text --> become -->|"text"|
    fixed = fixed.replace(/((?:-->|---|==>|-\.->|-\.-)\s*)\|([^"|\n][^|\n]*)\|/g,
        (_, arrow: string, label: string) => `${arrow}|"${label.replace(/"/g, "#quot;")}"|`);
    fixed = fixed.replace(/--\s+([^\s>|"-][^\n]*?)\s+-->/g, (_, label: string) => `-->|"${label.replace(/"/g, "#quot;")}"|`);

    // Subgraph titles: "subgraph id [title]" gets its title quoted, a plain-text title gets an id too
    fixed = fixed.replace(/^(\s*subgraph\s+[\w-]+\s*)\[([^"\n][^\n]*)\]\s*$/gm,
        (_, head: string, title: string) => `${head}["${title.replace(/"/g, "#quot;")}"]`);
    let n = 0;
    fixed = fixed.replace(/^(\s*)subgraph\s+(?![\w-]+\s*\[)([^"\n].*?)\s*$/gm,
        (_, indent: string, title: string) => `${indent}subgraph sg${++n}["${title.replace(/"/g, "#quot;")}"]`);
    return fixed;
}
