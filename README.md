# n8n-nodes-random

An [n8n](https://n8n.io) community node that randomly picks one or more items from a list.

[![npm version](https://img.shields.io/npm/v/n8n-nodes-random.svg)](https://www.npmjs.com/package/n8n-nodes-random)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Useful for random selection, sampling, lottery draws, A/B test splitting, and any workflow where you need randomness.

---

## What it does

**Random** is an n8n community node that picks one or more random items from a list. Two modes:

- **Input Items** — all items flowing into the node form the pool. Picked items go to the **Picked** output; the rest go to **Remaining**.
- **List Field** — each item has an array field (e.g. `countries`, `options`). The node picks from that array and writes the result into a new field on the item.

---

## Installation

In your n8n instance go to **Settings > Community Nodes > Install** and enter:

```
n8n-nodes-random
```

Or via CLI:

```bash
npm install n8n-nodes-random
```

---

## Parameters

| Parameter | Default | Description |
|---|---|---|
| Source | Input Items | Input Items or List Field mode |
| List Field | | Field containing the array to pick from. Supports dot-notation (`data.choices`). Drag and drop from the data panel. |
| Output Field | `picked` | Field name to write the result into (List Field mode only) |
| Pick Count | `1` | How many items to pick |
| Allow Duplicates | `false` | Allow the same item to be picked more than once |
| Always Output an Array | `false` | Wrap result in an array even when Pick Count is 1 |
| Random Seed | | Integer seed for reproducible results. Leave blank for true randomness. |

---

## Outputs

| Pin | Description |
|---|---|
| Picked | The randomly selected items or values |
| Remaining | Everything not selected (Input Items mode) or items with an empty/missing array (List Field mode) |

Every picked item includes a `_pick` metadata field:

```json
{
  "_pick": {
    "poolSize": 10,
    "pickCount": 1,
    "allowDuplicates": false,
    "seeded": false
  }
}
```

---

## Releasing a new version

```bash
git add . && git commit -m "release: v0.x.x"
git tag v0.x.x
git push && git push --tags
```

GitHub Actions builds and publishes to npm automatically on every version tag.

---

## License

MIT © Victor Folorunso
