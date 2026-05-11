import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  IDataObject,
} from 'n8n-workflow';

// ─── Seeded PRNG (Mulberry32) ────────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildRng(seed: string): () => number {
  if (!seed) return Math.random;
  const n = Number(seed);
  return Number.isFinite(n) ? mulberry32(n) : Math.random;
}

// ─── Fisher-Yates shuffle ────────────────────────────────────────────────────
function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickFrom<T>(pool: T[], count: number, allowDuplicates: boolean, rng: () => number): T[] {
  if (!pool.length) return [];
  if (allowDuplicates) {
    return Array.from({ length: count }, () => pool[Math.floor(rng() * pool.length)]);
  }
  return shuffle([...pool], rng).slice(0, Math.min(count, pool.length));
}

export class Random implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Random',
    name: 'random',
    icon: 'fa:dice',
    group: ['transform'],
    version: 1,
    description: 'Randomly pick one or more items from a list',
    defaults: { name: 'Random' },
    inputs: ['main'],
    outputs: ['main', 'main'],
    outputNames: ['Picked', 'Remaining'],
    hints: [
      {
        message: 'In <strong>Input Items</strong> mode, all items flowing into this node form the pool. Picked items exit via <strong>Picked</strong>; the rest via <strong>Remaining</strong>.',
        location: 'outputPane',
        displayCondition: '={{ $parameter.source === "inputItems" }}',
      },
      {
        message: 'In <strong>List Field</strong> mode, each item is processed independently. Picked values are written into the output field. Items with an empty or missing array exit via <strong>Remaining</strong>.',
        location: 'outputPane',
        displayCondition: '={{ $parameter.source === "listField" }}',
      },
    ],
    properties: [
      {
        displayName: 'Source',
        name: 'source',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Input Items',
            value: 'inputItems',
            description: 'Treat all items coming into this node as the pool',
          },
          {
            name: 'List Field',
            value: 'listField',
            description: 'Pick from an array stored in a field — drag & drop a field from the data panel',
          },
        ],
        default: 'inputItems',
      },
      {
        displayName: 'List Field',
        name: 'listField',
        type: 'string',
        default: '',
        placeholder: 'e.g. options or data.choices',
        description: 'Field whose value is the array to pick from. Supports dot-notation. Drag & drop from the data panel to fill automatically.',
        displayOptions: { show: { source: ['listField'] } },
        required: true,
      },
      {
        displayName: 'Output Field',
        name: 'outputField',
        type: 'string',
        default: 'picked',
        description: 'Field name to write the picked value(s) into on each item',
        displayOptions: { show: { source: ['listField'] } },
      },
      {
        displayName: 'Pick Count',
        name: 'pickCount',
        type: 'number',
        default: 1,
        typeOptions: { minValue: 1 },
        description: 'How many items to pick. Capped at pool size when Allow Duplicates is off.',
      },
      {
        displayName: 'Allow Duplicates',
        name: 'allowDuplicates',
        type: 'boolean',
        default: false,
        description: 'Whether the same candidate can be picked more than once',
      },
      {
        displayName: 'Always Output an Array',
        name: 'alwaysArray',
        type: 'boolean',
        default: false,
        description: 'Whether to wrap the result in an array even when Pick Count is 1. Keeps output shape consistent when Pick Count varies at runtime.',
        displayOptions: { show: { source: ['listField'] } },
      },
      {
        displayName: 'Random Seed',
        name: 'seed',
        type: 'string',
        default: '',
        placeholder: 'Leave blank for truly random',
        hint: 'Accepts any integer. Leave blank to use a fresh random seed every execution.',
        description: 'Optional integer seed for reproducible results. Same seed + same pool always produces the same picks.',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items        = this.getInputData();
    const source       = this.getNodeParameter('source', 0) as string;
    const pickCount    = this.getNodeParameter('pickCount', 0) as number;
    const allowDups    = this.getNodeParameter('allowDuplicates', 0) as boolean;
    const seed         = this.getNodeParameter('seed', 0) as string;
    const rng          = buildRng(seed);

    // ── Mode A: pick from input items ────────────────────────────────────────
    if (source === 'inputItems') {
      if (!items.length) return [[], []];

      const indices = Array.from({ length: items.length }, (_, i) => i);
      const pickedSet = new Set(pickFrom(indices, pickCount, allowDups, rng));
      const meta = { poolSize: items.length, pickCount: pickedSet.size, allowDuplicates: allowDups, seeded: !!seed };

      const picked: INodeExecutionData[]    = [];
      const remaining: INodeExecutionData[] = [];

      for (let i = 0; i < items.length; i++) {
        const enriched = { ...items[i], json: { ...items[i].json, _pick: meta } };
        (pickedSet.has(i) ? picked : remaining).push(enriched);
      }

      return [picked, remaining];
    }

    // ── Mode B: pick from an array field on each item ─────────────────────────
    if (source === 'listField') {
      const outputField = this.getNodeParameter('outputField', 0) as string;
      const alwaysArray = this.getNodeParameter('alwaysArray', 0) as boolean;

      const picked: INodeExecutionData[]    = [];
      const remaining: INodeExecutionData[] = [];

      for (let i = 0; i < items.length; i++) {
        // Read per-item so expressions like {{ $json.countries }} resolve correctly
        const rawField = this.getNodeParameter('listField', i) as unknown;

        // Case 1: expression already resolved to an array — use it directly
        // Case 2: string field name — navigate item.json by dot-notation
        let fieldValue: unknown;
        if (Array.isArray(rawField)) {
          fieldValue = rawField;
        } else if (typeof rawField === 'string' && rawField.trim()) {
          fieldValue = rawField.trim().split('.').reduce<unknown>(
            (obj, key) => (obj && typeof obj === 'object' ? (obj as IDataObject)[key] : undefined),
            items[i].json,
          );
        } else {
          throw new NodeOperationError(this.getNode(), 'List Field must be a field name or an expression that returns an array.');
        }

        if (!Array.isArray(fieldValue) || !fieldValue.length) {
          remaining.push(items[i]);
          continue;
        }

        const picks = pickFrom(fieldValue as unknown[], pickCount, allowDups, rng);
        const outputValue = (!alwaysArray && pickCount === 1) ? picks[0] : picks;

        picked.push({
          ...items[i],
          json: {
            ...items[i].json,
            [outputField]: outputValue as IDataObject,
            _pick: { poolSize: fieldValue.length, pickCount: picks.length, allowDuplicates: allowDups, seeded: !!seed } as IDataObject,
          } as IDataObject,
        });
      }

      return [picked, remaining];
    }

    throw new NodeOperationError(this.getNode(), `Unknown source mode: ${source}`);
  }
}
