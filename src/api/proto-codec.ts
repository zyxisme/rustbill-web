/**
 * Minimal protobuf binary encoder/decoder for gRPC-Web.
 *
 * Handles field types: string, uint32, int32, int64, uint64, bool,
 * bytes, nested messages, map, and repeated fields.
 *
 * int64/uint64 are decoded as strings to preserve full 64-bit precision.
 * Map fields are encoded as repeated nested messages with key/value fields
 * (proto3 map encoding).
 *
 * Does NOT support: oneof, packed repeated scalars, extensions.
 * This is sufficient for all RustBill proto messages.
 */

// ── Varint encoding / decoding ──────────────────────────────

function encodeVarint(value: number): Uint8Array {
  const bytes: number[] = [];
  let v = value >>> 0; // treat as unsigned
  while (v > 0x7f) {
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  bytes.push(v & 0x7f);
  return new Uint8Array(bytes.length === 0 ? [0] : bytes);
}

function decodeVarint(
  bytes: Uint8Array,
  offset: number,
): { value: number; length: number } {
  let value = 0;
  let shift = 0;
  let i = offset;
  while (i < bytes.length) {
    const b = bytes[i]!;
    value |= (b & 0x7f) << shift;
    i++;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  return { value: value >>> 0, length: i - offset };
}

/** Decode varint as a bigint-capable string (for int64/uint64 fields). */
function decodeVarintAsString(bytes: Uint8Array, offset: number): { value: string; length: number } {
  let lo = 0;
  let hi = 0;
  let shift = 0;
  let i = offset;
  while (i < bytes.length) {
    const b = bytes[i]!;
    if (shift < 28) {
      lo |= (b & 0x7f) << shift;
    } else if (shift < 60) {
      hi |= (b & 0x7f) << (shift - 28);
      lo |= Math.floor(((b & 0x7f) << (shift - 28)) * 0x10000000) & 0xffffffff;
    }
    i++;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  // For values that fit in JS safe integer range, return the exact number as string
  if (hi === 0 && lo <= 9007199254740991) {
    return { value: String(lo), length: i - offset };
  }
  // For larger values, use BigInt if available, otherwise approximate
  if (typeof BigInt !== 'undefined') {
    let bigVal = BigInt(0);
    let bigShift = BigInt(0);
    let j = offset;
    while (j < i) {
      const b = bytes[j]!;
      bigVal |= BigInt(b & 0x7f) << bigShift;
      j++;
      if ((b & 0x80) === 0) break;
      bigShift += BigInt(7);
    }
    return { value: String(bigVal), length: i - offset };
  }
  // Fallback: low-range value as string
  return { value: String(lo), length: i - offset };
}

function varintLength(value: number): number {
  let len = 1;
  let v = value >>> 0;
  while (v > 0x7f) {
    len++;
    v >>>= 7;
  }
  return len;
}

// ── Wire format constants ───────────────────────────────────

const WIRE_VARINT = 0;
const WIRE_64BIT = 1;
const WIRE_LENGTH_DELIMITED = 2;
const WIRE_32BIT = 5;

// ── Map entry cache ─────────────────────────────────────────

const mapEntryDefCache: Record<string, MessageDef> = {};

function getMapEntryDef(mapValueType: FieldType): MessageDef {
  const key = mapValueType;
  if (!mapEntryDefCache[key]) {
    mapEntryDefCache[key] = {
      fields: [
        { no: 1, name: 'key', type: 'string' },
        { no: 2, name: 'value', type: mapValueType },
      ],
    };
  }
  return mapEntryDefCache[key]!;
}

// ── Wire type helper ────────────────────────────────────────

function wireType(fieldType: FieldType): number {
  switch (fieldType) {
    case 'string':
    case 'bytes':
    case 'message':
    case 'map':
      return WIRE_LENGTH_DELIMITED;
    case 'uint32':
    case 'int32':
    case 'int64':
    case 'uint64':
    case 'bool':
      return WIRE_VARINT;
    default:
      return WIRE_LENGTH_DELIMITED;
  }
}

function tag(fieldNo: number, wt: number): number {
  return (fieldNo << 3) | wt;
}

// ── Field schema types ──────────────────────────────────────

export type FieldType =
  | 'string'
  | 'uint32'
  | 'int32'
  | 'int64'
  | 'uint64'
  | 'bool'
  | 'message'
  | 'map'
  | 'bytes';

export interface FieldDef {
  no: number;
  name: string;
  type: FieldType;
  repeated?: boolean;
  message?: MessageDef;
  mapValueType?: FieldType;
}

export interface MessageDef {
  fields: FieldDef[];
}

// ── Size computation (for pre-allocating buffer) ────────────

function fieldSize(def: FieldDef, value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  if (value === false && def.type !== 'bool') return 0;
  const wt = wireType(def.type);
  const tagLen = varintLength(tag(def.no, wt));

  if (def.repeated && Array.isArray(value)) {
    let total = 0;
    for (const item of value) {
      total += tagLen + scalarFieldSize(def, item);
    }
    return total;
  }

  if (def.type === 'map' && typeof value === 'object' && value !== null) {
    const entryDef = getMapEntryDef(def.mapValueType || 'string');
    let total = 0;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined || v === null || v === '') continue;
      const entry = encodeMessage(entryDef, { key: k, value: v });
      total += tagLen + varintLength(entry.length) + entry.length;
    }
    return total;
  }

  return tagLen + scalarFieldSize(def, value);
}

function scalarFieldSize(def: FieldDef, value: unknown): number {
  switch (def.type) {
    case 'string': {
      const str = String(value);
      const encoded = new TextEncoder().encode(str);
      return varintLength(encoded.length) + encoded.length;
    }
    case 'uint32':
    case 'int32':
      return varintLength(Number(value) >>> 0);
    case 'int64':
    case 'uint64':
      return varintLength(Number(value) >>> 0);
    case 'bool':
      return 1;
    case 'bytes': {
      const data = value instanceof Uint8Array ? value : new Uint8Array(0);
      return varintLength(data.length) + data.length;
    }
    case 'message':
      if (def.message && typeof value === 'object' && value !== null) {
        const inner = encodeMessage(def.message, value as Record<string, unknown>);
        return varintLength(inner.length) + inner.length;
      }
      return 0;
    default:
      return 0;
  }
}

// ── Encode ──────────────────────────────────────────────────

export function encodeMessage(
  def: MessageDef,
  obj: Record<string, unknown>,
): Uint8Array {
  // Calculate total size first to pre-allocate exactly
  let totalSize = 0;
  for (const f of def.fields) {
    const val = obj[f.name];
    if (val === undefined || val === null || val === '') continue;
    if (val === false && f.type !== 'bool') continue;
    totalSize += fieldSize(f, val);
  }

  const buf = new Uint8Array(totalSize);
  let pos = 0;

  for (const f of def.fields) {
    const val = obj[f.name];
    if (val === undefined || val === null || val === '') continue;
    if (val === false && f.type !== 'bool') continue;
    pos = encodeField(f, val, buf, pos);
  }

  return buf;
}

function encodeField(
  def: FieldDef,
  value: unknown,
  buf: Uint8Array,
  pos: number,
): number {
  if (def.type === 'map') {
    return encodeScalarField(def, value, buf, pos);
  }
  if (def.repeated && Array.isArray(value)) {
    for (const item of value) {
      pos = encodeScalarField(def, item, buf, pos);
    }
    return pos;
  }
  return encodeScalarField(def, value, buf, pos);
}

function encodeScalarField(
  def: FieldDef,
  value: unknown,
  buf: Uint8Array,
  pos: number,
): number {
  // Map fields: write tag + length-delimited entry message for each key-value pair
  if (def.type === 'map') {
    const entryDef = getMapEntryDef(def.mapValueType || 'string');
    const mapObj = value as Record<string, unknown>;
    const wt = wireType(def.type);
    const tagVal = tag(def.no, wt);
    const tagBytes = encodeVarint(tagVal);
    for (const [k, v] of Object.entries(mapObj)) {
      if (v === undefined || v === null || v === '') continue;
      const inner = encodeMessage(entryDef, { key: k, value: v });
      const lenBytes = encodeVarint(inner.length);
      buf.set(tagBytes, pos); pos += tagBytes.length;
      buf.set(lenBytes, pos); pos += lenBytes.length;
      buf.set(inner, pos); pos += inner.length;
    }
    return pos;
  }

  const wt = wireType(def.type);
  const tagVal = tag(def.no, wt);
  const tagBytes = encodeVarint(tagVal);
  buf.set(tagBytes, pos);
  pos += tagBytes.length;

  switch (def.type) {
    case 'string': {
      const str = String(value);
      const encoded = new TextEncoder().encode(str);
      const lenBytes = encodeVarint(encoded.length);
      buf.set(lenBytes, pos);
      pos += lenBytes.length;
      buf.set(encoded, pos);
      pos += encoded.length;
      break;
    }
    case 'bytes': {
      const data = value instanceof Uint8Array ? value : new Uint8Array(0);
      const lenBytes = encodeVarint(data.length);
      buf.set(lenBytes, pos);
      pos += lenBytes.length;
      buf.set(data, pos);
      pos += data.length;
      break;
    }
    case 'uint32':
    case 'int32':
    case 'uint64':
    case 'int64': {
      const v = encodeVarint(Number(value) >>> 0);
      buf.set(v, pos);
      pos += v.length;
      break;
    }
    case 'bool': {
      buf[pos] = value ? 1 : 0;
      pos += 1;
      break;
    }
    case 'message':
      if (def.message && typeof value === 'object' && value !== null) {
        const inner = encodeMessage(def.message, value as Record<string, unknown>);
        const lenBytes = encodeVarint(inner.length);
        buf.set(lenBytes, pos);
        pos += lenBytes.length;
        buf.set(inner, pos);
        pos += inner.length;
      }
      break;
  }

  return pos;
}

// ── Decode ──────────────────────────────────────────────────

export function decodeMessage(
  def: MessageDef,
  bytes: Uint8Array,
): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  // Pre-initialize repeated fields as arrays and map fields as objects
  for (const f of def.fields) {
    if (f.repeated) obj[f.name] = [];
    if (f.type === 'map') obj[f.name] = {};
  }

  let pos = 0;
  while (pos < bytes.length) {
    const { value: tagVal, length: tagLen } = decodeVarint(bytes, pos);
    pos += tagLen;

    const fieldNo = tagVal >>> 3;
    const wt = tagVal & 0x7;

    const field = def.fields.find((f) => f.no === fieldNo);
    if (!field) {
      // Skip unknown field
      pos = advancePastField(bytes, pos, wt);
      continue;
    }

    if (field.type === 'map') {
      if (wt !== WIRE_LENGTH_DELIMITED) {
        pos = advancePastField(bytes, pos, wt);
        continue;
      }
      const { value: len, length: lenLen } = decodeVarint(bytes, pos);
      const innerStart = pos + lenLen;
      const innerBytes = bytes.slice(innerStart, innerStart + len);
      const entryDef = getMapEntryDef(field.mapValueType || 'string');
      const entry = decodeMessage(entryDef, innerBytes);
      const map = (obj[field.name] as Record<string, unknown>) || {};
      if (entry.key !== undefined && entry.key !== null) {
        map[String(entry.key)] = entry.value;
      }
      obj[field.name] = map;
      pos = innerStart + len;
    } else if (field.repeated) {
      const arr = (obj[field.name] as unknown[]) || [];
      arr.push(decodeScalarField(field, bytes, pos, wt));
      obj[field.name] = arr;
      pos = advancePastField(bytes, pos, wt);
    } else {
      obj[field.name] = decodeScalarField(field, bytes, pos, wt);
      pos = advancePastField(bytes, pos, wt);
    }
  }

  return obj;
}

function decodeScalarField(
  def: FieldDef,
  bytes: Uint8Array,
  pos: number,
  wt: number,
): unknown {
  switch (def.type) {
    case 'string': {
      const { value: len, length: lenLen } = decodeVarint(bytes, pos);
      const strBytes = bytes.slice(pos + lenLen, pos + lenLen + len);
      return new TextDecoder().decode(strBytes);
    }
    case 'bytes': {
      const { value: len, length: lenLen } = decodeVarint(bytes, pos);
      return bytes.slice(pos + lenLen, pos + lenLen + len);
    }
    case 'uint32':
    case 'int32': {
      const { value } = decodeVarint(bytes, pos);
      return value;
    }
    case 'uint64':
    case 'int64': {
      const { value } = decodeVarintAsString(bytes, pos);
      return value;
    }
    case 'bool': {
      const { value } = decodeVarint(bytes, pos);
      return value !== 0;
    }
    case 'message':
      if (def.message) {
        const { value: len, length: lenLen } = decodeVarint(bytes, pos);
        const inner = bytes.slice(pos + lenLen, pos + lenLen + len);
        return decodeMessage(def.message, inner);
      }
      return {};
    default:
      return null;
  }
}

/** Advance read position past a field value (not the tag). */
function advancePastField(
  bytes: Uint8Array,
  pos: number,
  wt: number,
): number {
  if (wt === WIRE_VARINT) {
    const { length } = decodeVarint(bytes, pos);
    return pos + length;
  } else if (wt === WIRE_LENGTH_DELIMITED) {
    const { value: len, length: lenLen } = decodeVarint(bytes, pos);
    return pos + lenLen + len;
  } else if (wt === WIRE_32BIT) {
    return pos + 4;
  } else if (wt === WIRE_64BIT) {
    return pos + 8;
  }
  return pos;
}
