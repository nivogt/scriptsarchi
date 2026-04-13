# jArchi Script Development Guide

## Overview

jArchi scripts are JavaScript files (`.ajs`) executed inside **Archi** via the jArchi plugin. They provide programmatic access to the ArchiMate model and its views, allowing you to query, transform, and export data.

---

## Prerequisites

| Tool | Notes |
|---|---|
| [Archi](https://www.archimatetool.com/) | Open-source ArchiMate modelling tool |
| [jArchi plugin](https://www.archimatetool.com/blog/2018/07/02/jarchi/) | Adds scripting support to Archi; install via `Help → Manage Plug-ins` |
| A code editor | VS Code with the JavaScript extension works well for authoring `.ajs` files |

---

## Script structure

```javascript
/*
 * Script title and description
 * Requires jArchi
 */

console.show();   // opens the Archi console
console.clear();  // clears previous output

// --- your logic here ---

console.log("Done.");
```

**Key conventions**
- Always call `console.show()` and `console.clear()` at the top so output is visible and clean.
- Use `exit()` (not `return`) to stop execution early.
- Use `window.alert("message")` for blocking user messages.
- Use `window.prompt("message", "default")` to collect user input; it returns `null` if the user cancels.

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
rel.source   // the source element
rel.target   // the target element
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

Junctions are transparent routing elements in ArchiMate. When traversing triggering or flow chains, check for them explicitly and recurse through them:

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
```

Always pass a `visited` map when recursing to avoid infinite loops on cyclic diagrams:

```javascript
function resolveSuccessors(el, visited) {
    visited = visited || {};
    if (visited[el.id]) return [];
    visited[el.id] = true;
    // ... traverse outgoing relationships
}
```

---

## Changing element or relationship types

```javascript
// Change the type of a concept (throws if ArchiMate rules are violated)
el.concept.type = "business-role";

// Change a relationship type
rel.concept.type = "triggering-relationship";
```

Always wrap type changes in a `try/catch` — ArchiMate metamodel rules may forbid certain combinations:

```javascript
try {
    rel.concept.type = "triggering-relationship";
} catch (e) {
    console.log("Cannot convert: " + e.message);
}
```

---

## Outputting Markdown tables

```javascript
console.log("| Col A | Col B | Col C |");
console.log("|-------|-------|-------|");

collection.each(function(el) {
    var concept = el.concept || el;
    console.log("| " + concept.id + " | " + concept.name + " | " + (concept.documentation || "-") + " |");
});
```

**Tips for clean table output**
- Strip newlines from documentation: `doc.replace(/\r?\n/g, " ").trim()`
- Use `|| "-"` as a fallback for empty fields to keep table cells non-empty.

---

## Running scripts

1. Open Archi and load your model.
2. Select the target view or elements in the diagram.
3. Go to **Scripts** (menu or panel) → navigate to your `.ajs` file → double-click or press **Run**.
4. Output appears in the **Console** panel (`Window → Console` if not visible).

---

## Debugging tips

- `console.log($(el))` prints the jArchi collection object — useful for inspecting what was returned.
- `console.log(el.type)` is the fastest way to verify which ArchiMate type an element is.
- `console.log(JSON.stringify(Object.keys(el)))` lists all available properties on a jArchi proxy object.
- Use `$(model).find()` instead of `$(view).find()` to search the entire model regardless of which view is selected.

---

## File organisation

```
customs/
  exports/        # Scripts that extract/export data from a model
  miscellaneous/  # Utility and transformation scripts
  model/          # Scripts that create or modify model elements
  ai/             # AI-assisted generation scripts
examples/         # Reference scripts shipped with jArchi
```

Keep one script per concern. Shared helper functions should be extracted into a separate `.ajs` file and loaded with `load("path/to/helpers.ajs")` if the jArchi version supports it; otherwise duplicate the helpers with a comment referencing the source.

---

## Reference links

- [jArchi documentation](https://github.com/archimatetool/archi-scripting-plugin/wiki)
- [ArchiMate 3.2 specification](https://pubs.opengroup.org/architecture/archimate3-doc/)
- [Archi user guide](https://www.archimatetool.com/downloads/Archi%20User%20Guide.pdf)
