# AGENTS.md — AI Agent Instructions for jArchi Script Development

This file provides instructions for AI coding agents (GitHub Copilot, Claude, etc.) working on `.ajs` scripts in this repository. Read this before generating or editing any jArchi script.

---

## Repository context

- All scripts are JavaScript (`.ajs`) executed by the **jArchi plugin** inside **Archi**.
- Scripts run in a sandboxed Rhino/Nashorn JS engine — **no Node.js APIs**, no `require()`, no ES modules.
- The entry point is always `$(selection)` or `$(model)` — there is no `main()` function.
- Refer to [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for the full API reference.

---

## Language constraints

| Allowed | Not allowed |
|---|---|
| ES5 + limited ES6 (`const`, `let`, arrow functions, template literals) | `import` / `export` / `require()` |
| `var`, `const`, `let` | Node.js built-ins (`fs`, `path`, `process`, …) |
| `Array.forEach`, `Array.map`, `Array.filter`, `Object.keys` | `async` / `await` / Promises |
| `JSON.stringify` / `JSON.parse` | Browser DOM APIs |
| `Java.type(...)` for Archi/Eclipse Java interop | ES2017+ features (optional chaining `?.`, nullish coalescing `??`, etc.) |

> When in doubt, write ES5-compatible code. The engine version varies across Archi installations.

---

## Script file conventions

- **One concern per file.** Do not combine unrelated operations in a single script.
- **Header comment block** is mandatory:
  ```javascript
  /*
   * <Title>
   * <One-line description>
   * Requires jArchi - https://www.archimatetool.com/blog/2018/07/02/jarchi/
   */
  ```
- Always start with `console.show(); console.clear();` so the output panel is open and clean.
- Always validate the selection before any logic and call `exit()` with a `window.alert()` if preconditions are not met.
- Use `exit()` to stop execution — never `return` at the top level.
- Organise code with `// ── Section title ───` banners to separate logical blocks.

---

## Folder placement

| Script type | Folder |
|---|---|
| Extract / export data from model | `customs/exports/` |
| Transform or repair model elements | `customs/miscellaneous/` |
| Create or generate model elements | `customs/model/` |
| AI-assisted generation | `customs/ai/` |

---

## jArchi API patterns to follow

### Always resolve the model concept from a view object
```javascript
var concept = el.concept || el;
```
View objects and model concepts are different proxies. Always use `concept` when reading `id`, `type`, `documentation`, or calling `.rels()`.

### Guard against null/undefined
```javascript
var name = concept.name || "(unnamed)";
var doc  = (concept.documentation || "").replace(/\r?\n/g, " ").trim();
```

### Use `.size()` not `.length` on jArchi collections
```javascript
if ($(selection).filter("archimate-diagram-model").size() !== 1) { ... }
```

### Filter relationships by type before iterating
```javascript
$(el).rels().filter("triggering-relationship").each(function(rel) { ... });
```

### Check direction explicitly inside `.rels()` callbacks
```javascript
$(el).rels().filter("triggering-relationship").each(function(rel) {
    if (rel.source.id !== el.id) return;  // skip incoming
    // process outgoing only
});
```

### Handle AND/OR junctions when traversing chains
Any triggering or flow chain may pass through a `junction`, `and-junction`, or `or-junction` element. Always recurse through junctions transparently and pass a `visited` map to prevent infinite loops:
```javascript
function resolveSuccessors(el, visited) {
    visited = visited || {};
    if (visited[el.id]) return [];
    visited[el.id] = true;
    // ...
}
```

### Wrap type mutations in try/catch
ArchiMate metamodel rules can forbid certain type conversions. Never assume a mutation will succeed:
```javascript
try {
    concept.type = "triggering-relationship";
} catch (e) {
    console.log("Cannot convert: " + e.message);
}
```

---

## Output formatting

- Always output a Markdown table for structured data.
- Use `| Col |` headers and `|-----|` separator rows.
- Never leave a table cell blank — use `"-"` as a fallback.
- Strip newlines from documentation before inserting into a table cell:
  ```javascript
  doc.replace(/\r?\n/g, " ").trim()
  ```
- Print a summary line at the end: `console.log("\nDone.");`
- For multi-item list columns (e.g. predecessors), use this grouping format:
  - Single item → plain ID: `id-abc123`
  - Multiple items via AND junction → `AND(id-abc, id-def)`
  - Multiple items via OR junction → `OR(id-abc, id-def)`

---

## What to check before writing a new script

1. **Does a similar script already exist?** Check `customs/` and `examples/` first.
2. **What is the expected selection?** Decide if the script requires a view, a set of elements, or relationships — and validate upfront.
3. **What is the output?** Console table, file export, or in-place model mutation?
4. **Are there junction elements in the traversal path?** If traversing triggering/flow chains, junction handling is required.
5. **Can the type change violate ArchiMate rules?** If mutating types, add `try/catch`.

---

## What NOT to do

- Do **not** use `console.log` to print raw jArchi collection objects as output rows — always extract `.name`, `.id`, etc. explicitly.
- Do **not** use `el.length` — use `el.size()`.
- Do **not** silently swallow errors — log them with context.
- Do **not** hardcode element IDs or view names — always derive them from the active selection.
- Do **not** mix model queries and UI prompts in the middle of processing — gather all user inputs first, then process.
- Do **not** use optional chaining (`?.`) or nullish coalescing (`??`) — not supported in all Archi JS engines.

---

## Example patterns (canonical references)

| Pattern | File |
|---|---|
| Export elements to Markdown table | `customs/exports/generate_task_list.ajs` |
| Traverse predecessor/successor chain with junction handling | `customs/exports/generate_task_list.ajs` |
| Transform relationship types with user prompt | `customs/miscellaneous/change_relationship_type.ajs` |
| Rich multi-view Markdown export | `customs/exports/ExportToMarkdown.ajs` |
