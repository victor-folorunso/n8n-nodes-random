# n8n-nodes-random

An [n8n](https://n8n.io) community node that randomly picks one or more items from a list.

[![npm version](https://img.shields.io/npm/v/n8n-nodes-random.svg)](https://www.npmjs.com/package/n8n-nodes-random)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Features

| Feature | Details |
|---|---|
| **Two source modes** | Pick from **input items** or from an **array field** on each item |
| **Configurable count** | Pick 1 → N candidates; defaults to 1 |
| **Drag & drop** | In List Field mode, drag any array field from the data panel straight into the _List Field_ input |
| **Duplicates control** | Allow or prevent the same candidate appearing more than once |
| **Seeded randomness** | Supply an integer seed for reproducible, deterministic picks |
| **Two outputs** | **Picked** pin for selected items; **Remaining** pin for everything else |
| **Pick metadata** | Every output item includes a `_pick` object with `poolSize`, `pickCount`, `allowDuplicates`, and `seeded` |

---

## Installation

In your n8n instance go to **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-random
```

---

## Usage

### Mode: Input Items (default)

All items flowing into the **Random** node form the pool. The node picks N of them randomly and routes them to the **Picked** output. Everything else goes to **Remaining**.

**Example:** You have 20 leads coming in and want to A/B test on 5 random ones.

### Mode: List Field

Each item is processed independently. You point the node at an array field (e.g. `options` or `data.choices`), and it picks N values from that array, writing the result into a new field on the same item.

**Drag & drop:** Open the data panel on the left, find your array field, and drag it straight into the _List Field_ input.

---

## Parameters

| Parameter | Default | Description |
|---|---|---|
| Source | Input Items | Where to source the pool — input items or a field on each item |
| List Field | — | Field name containing the array (List Field mode only). Supports dot-notation. |
| Output Field | `picked` | Field name to write the result into (List Field mode only) |
| Pick Count | `1` | How many items to pick |
| Allow Duplicates | `false` | Whether the same item can be picked more than once |
| Always Output an Array | `false` | Wrap result in array even when Pick Count is 1 (List Field mode only) |
| Random Seed | — | Optional integer for reproducible results. Leave blank for true randomness. |

---

## Output metadata

Every picked item carries a `_pick` field:

```json
{
  "_pick": {
    "poolSize": 20,
    "pickCount": 5,
    "allowDuplicates": false,
    "seeded": false
  }
}
```

---

## Releasing a new version

```bash
# 1. Bump version in package.json, then:
git add . && git commit -m "release: v0.x.x"
git tag v0.x.x
git push && git push --tags
# GitHub Actions builds and publishes to npm automatically.
```

To retag after a fix: `retag.bat 0.x.x`

---

## License

MIT © Victor Folorunso
