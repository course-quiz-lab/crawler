import { createHash } from 'node:crypto';

/**
 * 对对象进行稳定序列化（key 排序，无缩进），然后生成 MD5 摘要 ID。
 * 对于同一个 JSON 对象（忽略缩进和换行），始终生成相同的 ID。
 */
export function generateBankId(data: Record<string, unknown>): string {
  const normalized = stableStringify(data);
  const hash = createHash('md5').update(normalized, 'utf-8').digest('hex');
  return hash;
}

/**
 * 稳定的 JSON 序列化：递归地对对象的 key 排序，确保缩进无关。
 */
function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const items = value.map((v) => stableStringify(v));
    return `[${items.join(',')}]`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const pairs = keys.map(
      (k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`,
    );
    return `{${pairs.join(',')}}`;
  }
  throw new Error(`Unexpected value type: ${typeof value}`);
}
