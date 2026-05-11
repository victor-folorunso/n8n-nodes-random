# n8n-nodes-random

An n8n community node for random selection. Pick one or more random items from any list inside an n8n workflow.

[![npm version](https://img.shields.io/npm/v/n8n-nodes-random.svg)](https://www.npmjs.com/package/n8n-nodes-random)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What is n8n-nodes-random?

**n8n-nodes-random** adds a **Random** node to your n8n instance. Use it any time your n8n workflow needs to pick a random item, sample a random subset, shuffle a list, or split items randomly between two paths.

Common n8n random selection use cases:

- Pick a random winner from a list of entries
- Randomly assign a support agent from a team list
- Sample 5 random rows from a dataset in n8n
- Randomly rotate content (quotes, images, messages) in a scheduled n8n workflow
- A/B split items randomly across two branches
- Pick a random product, country, template, or prompt from an array

---

## Installation

In your n8n instance go to **Settings > Community Nodes > Install** and enter:

```
n8n-nodes-random
```

Or via CLI on a self-hosted n8n instance:

```bash
npm install n8n-nodes-random
```

---

## How it works

The **Random** node has two modes.

### Mode 1: Input Items (default)

All n8n items flowing into the node form the pool. The node randomly picks N of them and routes them to the **Picked** output. Everything else goes to **Remaining**.

Use this when the things you want to pick from are n8n items, for example rows from a database query, spreadsheet rows, API results, or webhook payloads.

**Example: pick 1 random winner from a list of contest entries**

```
HTTP Request (get entries) -> Random (Pick Count: 1) -> Send winner email
                                      |
                                   Remaining -> (ignore or archive)
```

**Example: randomly assign 3 support tickets to an agent**

```
Postgres (get open tickets) -> Random (Pick Count: 3) -> Assign to agent A
                                        |
                                    Remaining -> back to queue
```

### Mode 2: List Field

Each n8n item has a field containing an array. The node picks N values from that array and writes the result into a new field on the same item. All items exit via **Picked**. Items where the array field is empty or missing exit via **Remaining**.

Use this when the array you want to pick from lives inside a field on each item, for example a `tags` field, an `options` field, or any JSON array field.

**Example: pick a random tag from each article**

Input item:
```json
{ "title": "My Article", "tags": ["n8n", "automation", "random", "workflow"] }
```

Configure the node:
- Source: List Field
- List Field: `tags` (or drag and drop the field from the n8n data panel)
- Output Field: `randomTag`
- Pick Count: 1

Output item:
```json
{
  "title": "My Article",
  "tags": ["n8n", "automation", "random", "workflow"],
  "randomTag": "automation",
  "_pick": { "poolSize": 4, "pickCount": 1, "allowDuplicates": false, "seeded": false }
}
```

**Example: pick 2 random options from a survey response**

Input item:
```json
{ "respondent": "Alice", "choices": ["Option A", "Option B", "Option C", "Option D"] }
```

Configure the node:
- Source: List Field
- List Field: `choices`
- Output Field: `selected`
- Pick Count: 2
- Always Output an Array: on

Output item:
```json
{
  "respondent": "Alice",
  "choices": ["Option A", "Option B", "Option C", "Option D"],
  "selected": ["Option C", "Option A"]
}
```

---

## Parameters

| Parameter | Default | Description |
|---|---|---|
| Source | Input Items | Input Items picks from n8n items. List Field picks from an array inside each item. |
| List Field | | Name of the field containing the array. Supports dot-notation for nested fields (e.g. `data.options`). Drag and drop from the n8n data panel. |
| Output Field | `picked` | Name of the field to write the random result into (List Field mode only) |
| Pick Count | `1` | How many random items to pick. Defaults to 1. |
| Allow Duplicates | `false` | When on, the same item can be picked more than once. When off, Pick Count is capped at pool size. |
| Always Output an Array | `false` | When on, result is always an array even if Pick Count is 1. Useful when downstream nodes expect a consistent array shape. |
| Random Seed | | Optional integer. When set, the same seed always produces the same random picks for the same pool. Leave blank for true randomness. |

---

## Outputs

| Output pin | What comes out |
|---|---|
| Picked | The randomly selected n8n items or values |
| Remaining | Items not selected (Input Items mode) or items where the array field was empty or missing (List Field mode) |

---

## Pick metadata

Every item that exits via Picked includes a `_pick` field with context about the random selection:

```json
{
  "_pick": {
    "poolSize": 20,
    "pickCount": 3,
    "allowDuplicates": false,
    "seeded": false
  }
}
```

Use `_pick.poolSize` and `_pick.pickCount` downstream in your n8n workflow if you need to know how many items were in the pool or how many were picked.

---

## Reproducible random picks with a seed

Set **Random Seed** to any integer to make picks reproducible. The same seed with the same pool always produces the same random result. Useful for:

- Testing n8n workflows where you need predictable output
- Deterministic sampling where the same input should always yield the same random subset

Leave the seed blank for true randomness on every execution.

---

## Drag and drop support

In List Field mode, open the n8n data panel on the left side of the canvas, find the array field you want to pick from, and drag it directly into the **List Field** input. The node accepts both plain field names and n8n expressions like `{{ $json.options }}`.

---

## License

MIT (c) Victor Folorunso
