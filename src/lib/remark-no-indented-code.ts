import type { Processor } from "unified";

// AI-written notes indent follow-on lines (e.g. legal sub-points "(i) ..."), which Markdown turns
// into grey code blocks showing raw ** and *. Real code always comes in ``` fences, so switch
// indented code blocks off and let those lines render as normal text and lists.
export function remarkNoIndentedCode(this: Processor) {
    const data = this.data() as { micromarkExtensions?: unknown[] };
    (data.micromarkExtensions ??= []).push({ disable: { null: ["codeIndented"] } });
}
