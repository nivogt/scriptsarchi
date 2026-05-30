# AGENTS.md — jArchi Script Development Guide for AI Agents

This file provides instructions and full API reference for AI coding agents (GitHub Copilot, Claude, etc.) working on `.ajs` scripts in this repository. Read this before generating or editing any jArchi script.

---

## Repository structure

```
customs/
  ai/             # AI-assisted generation scripts
  exports/        # Scripts that extract/export data from a model
  miscellaneous/  # Utility and transformation scripts
  model/          # Scripts that create or modify model elements
examples/         # Reference scripts shipped with jArchi
```

---

## Repository context

- All scripts are JavaScript (`.ajs`) executed by the **jArchi plugin** inside **Archi**.
- Scripts run in a sandboxed Rhino/Nashorn JS engine — **no Node.js APIs**, no `require()`, no ES modules.
- The entry point is always `$(selection)` or `$(model)` — there is no `main()` function.

---

## Prerequisites

| Tool | Notes |
|---|---|
| [Archi](https://www.archimatetool.com/) | Open-source ArchiMate modelling tool |
| [jArchi plugin](https://www.archimatetool.com/blog/2018/07/02/jarchi/) | Adds scripting support to Archi; install via `Help → Manage Plug-ins` |
| VS Code | Works well for authoring `.ajs` files with the JavaScript extension |

---

## Language constraints

| Allowed | Not allowed |
|---|---|
| ES5 + limited ES6 (`const`, `let`, arrow functions, template literals) | `import` / `export` / `require()` |
| `var`, `const`, `let` | Node.js built-ins (`fs`, `path`, `process`, ...) |
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
- Organise code with `// -- Section title ---` banners to separate logical blocks.
- Gather all user inputs (via `window.prompt`) before any model processing.

---

## Folder placement

| Script type | Folder |
|---|---|
| AI-assisted generation | `customs/ai/` |
| Extract / export data from model | `customs/exports/` |
| Transform or repair model elements | `customs/miscellaneous/` |
| Create or generate model elements | `customs/model/` |

---

## Running scripts

1. Open Archi and load your model.
2. Select the target view or elements in the diagram.
3. Go to **Scripts** (menu or panel) → navigate to your `.ajs` file → double-click or press **Run**.
4. Output appears in the **Console** panel (`Window → Console` if not visible).

---

## The jArchi object model

### Selection and views

```javascript
// Get the currently selected elements
$(selection)

// Filter to only archimate diagram views
$(selection).filter("archimate-diagram-model")

// Always call .first() to get a single element from a collection
var view = $(selection).filter("archimate-diagram-model").first();
```

### Querying elements

```javascript
// Find all elements of a type anywhere in the view (recursive)
$(view).find("work-package")

// Get direct children only (non-recursive)
$(view).children()

// Exclude relationships
$(view).children().not("relationship")

// Iterate over a collection
$(view).find("work-package").each(function(el) {
    console.log(el.name);
});
```

### Element properties

| Property | Description |
|---|---|
| `el.id` | Unique ArchiMate element identifier |
| `el.name` | Display name |
| `el.type` | ArchiMate type string (e.g. `"work-package"`, `"plateau"`) |
| `el.documentation` | Free-text documentation field |
| `el.concept` | The underlying model concept (use when iterating view objects) |
| `el.prop("key")` | Read a custom property |
| `el.prop()` | Returns array of all custom property keys |

> **Tip:** When iterating view elements (returned by `$(view).find()`), always resolve the underlying concept with `var concept = el.concept || el` before accessing `id`, `type`, or relationships.

---

## Working with relationships

```javascript
// Get all relationships connected to an element
$(el).rels()

// Filter by relationship type
$(el).rels().filter("triggering-relationship")
$(el).rels().filter("flow-relationship")
$(el).rels().filter("realization-relationship")
$(el).rels().filter("composition-relationship")

// Check direction
rel.source.id === el.id   // true if el is the source (outgoing)
rel.target.id === el.id   // true if el is the target (incoming)
```

### Common relationship types

| Type string | ArchiMate relationship |
|---|---|
| `triggering-relationship` | Triggering |
| `flow-relationship` | Flow |
| `realization-relationship` | Realization |
| `composition-relationship` | Composition |
| `aggregation-relationship` | Aggregation |
| `association-relationship` | Association |
| `assignment-relationship` | Assignment |
| `serving-relationship` | Serving |
| `influence-relationship` | Influence |
| `specialization-relationship` | Specialization |
| `access-relationship` | Access |

---

## Handling AND / OR junctions

Junctions are transparent routing elements in ArchiMate. When traversing triggering or flow chains, check for them explicitly and recurse through them. Always pass a `visited` map to prevent infinite loops on cyclic diagrams:

```javascript
function isJunction(el) {
    return el.type === "junction" ||
           el.type === "or-junction" ||
           el.type === "and-junction";
}

function junctionLabel(el) {
    if (el.type === "or-junction") return "OR";
    if (el.junction === "or")      return "OR";  // fallback for some Archi versions
    return "AND";
}

function resolveSuccessors(el, visited) {
    visited = visited || {};
    if (visited[el.id]) return [];
    visited[el.id] = true;
    // ... traverse outgoing relationships
}
```

---

## Changing element or relationship types

Always wrap type changes in a `try/catch` — ArchiMate metamodel rules may forbid certain combinations:

```javascript
try {
    rel.concept.type = "triggering-relationship";
} catch (e) {
    console.log("Cannot convert: " + e.message);
}
```

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

### Filter callback return types

When using `.filter()` with jArchi view or proxy objects, ensure the callback returns a plain JavaScript boolean. Returning a Java/Archi proxy (for example `o.view`) can cause the Rhino/Nashorn engine to attempt a lossy primitive coercion and throw a `ClassCastException`.

Examples:

```javascript
// Avoid — may return a Java proxy object and trigger a ClassCastException
$(selection).filter("relationship").filter(function(o) { return o.view; })

// Preferred — returns a plain boolean (safe across Archi/jArchi versions)
$(selection).filter("relationship").filter(function(o) { return o.view != null; })

// Alternative explicit check
$(selection).filter("relationship").filter(function(o) { return typeof o.view !== 'undefined'; })
```

Use these patterns whenever a filter callback inspects properties that may be proxied Java objects.

### Check direction explicitly inside `.rels()` callbacks
```javascript
$(el).rels().filter("triggering-relationship").each(function(rel) {
    if (rel.source.id !== el.id) return;  // skip incoming
    // process outgoing only
});
```

---

## Creating dialogs with proper focus handling

When creating dialog boxes in jArchi scripts, **always retain focus on the Archi window** after the dialog closes, and **ensure dialogs appear on the correct monitor in multi-monitor setups**. Use this pattern for all dialogs:

```javascript
var JOptionPane = Java.type("javax.swing.JOptionPane");
var JPanel = Java.type("javax.swing.JPanel");
var JLabel = Java.type("javax.swing.JLabel");
var JTextField = Java.type("javax.swing.JTextField");
var GridLayout = Java.type("java.awt.GridLayout");

var panel = new JPanel(new GridLayout(0, 2, 8, 8));
panel.add(new JLabel("Input:"));
panel.add(new JTextField("default value", 20));

// CRITICAL: Get parent window to maintain focus and multi-monitor support
var parentWindow = null;
try {
    var KeyboardFocusManager = Java.type("javax.swing.KeyboardFocusManager");
    var focusOwner = KeyboardFocusManager.getCurrentKeyboardFocusManager().getFocusOwner();
    parentWindow = focusOwner != null ? focusOwner.getTopLevelAncestor() : null;
} catch (e) {
    // If KeyboardFocusManager is restricted, try Frame.getFrames()
    try {
        var Frame = Java.type("java.awt.Frame");
        var frames = Frame.getFrames();
        if (frames && frames.length > 0) {
            // Prefer the first visible frame to ensure it's the active Archi window
            for (var i = 0; i < frames.length; i++) {
                if (frames[i].isVisible()) {
                    parentWindow = frames[i];
                    break;
                }
            }
            // Fall back to first frame if none visible
            if (!parentWindow && frames.length > 0) {
                parentWindow = frames[0];
            }
        }
    } catch (e2) {
        // Fall back to null if all methods fail
        parentWindow = null;
    }
}

var result = JOptionPane.showConfirmDialog(
    parentWindow,  // Always pass the parent window, not null
    panel,
    "Dialog Title",
    JOptionPane.OK_CANCEL_OPTION,
    JOptionPane.QUESTION_MESSAGE
);

if (result !== JOptionPane.OK_OPTION) {
    exit();
}
```

**Why this matters:**
- Passing `null` as the parent creates an unmanaged window, losing focus on Archi after closing
- `KeyboardFocusManager` provides the best focus resolution but may be restricted in sandboxes
- **For multi-monitor setups:** The frame iteration logic prioritizes visible frames, ensuring dialogs appear on the same monitor as the Archi window (fixes issue #4)
- `Frame.getFrames()` is a fallback for restrictive Rhino/Nashorn environments
- The try-catch ensures graceful degradation if both methods fail

**Common dialog types:**
- `JOptionPane.showConfirmDialog()` — OK/Cancel buttons
- `JOptionPane.showInputDialog()` — Single text input
- `JOptionPane.showOptionDialog()` — Custom buttons and complex layouts

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
  - Single item -> plain ID: `id-abc123`
  - Multiple items via AND junction -> `AND(id-abc, id-def)`
  - Multiple items via OR junction -> `OR(id-abc, id-def)`

---

## Debugging tips

- `console.log($(el))` prints the jArchi collection object — useful for inspecting what was returned.
- `console.log(el.type)` is the fastest way to verify which ArchiMate type an element is.
- `console.log(JSON.stringify(Object.keys(el)))` lists all available properties on a jArchi proxy object.
- Use `$(model).find()` instead of `$(view).find()` to search the entire model regardless of which view is selected.

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
| Export elements to Markdown table | `customs/exports/ExportToMarkdown.ajs` |
| Transform relationship types with user prompt | `customs/miscellaneous/` |
| AI-assisted documentation generation | `customs/ai/AI-GenerateDocumentation.ajs` |

---

## Reference links

- [jArchi documentation](https://github.com/archimatetool/archi-scripting-plugin/wiki)
- [ArchiMate 3.2 specification](https://pubs.opengroup.org/architecture/archimate3-doc/)
- [Archi user guide](https://www.archimatetool.com/downloads/Archi%20User%20Guide.pdf)
