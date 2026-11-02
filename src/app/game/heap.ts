/** Binary min-heap of integer items keyed by a numeric priority. */
export class MinHeap {
  private keys: number[] = [];
  private items: number[] = [];

  get size(): number {
    return this.items.length;
  }

  push(item: number, key: number) {
    const keys = this.keys;
    const items = this.items;
    let i = items.length;
    keys.push(key);
    items.push(item);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (keys[parent] <= key) break;
      keys[i] = keys[parent];
      items[i] = items[parent];
      i = parent;
    }
    keys[i] = key;
    items[i] = item;
  }

  /** Removes and returns the item with the lowest key, or -1 when empty. */
  pop(): number {
    const keys = this.keys;
    const items = this.items;
    if (!items.length) return -1;
    const top = items[0];
    const lastKey = keys.pop()!;
    const lastItem = items.pop()!;
    const n = items.length;
    if (n) {
      let i = 0;
      while (true) {
        let child = 2 * i + 1;
        if (child >= n) break;
        if (child + 1 < n && keys[child + 1] < keys[child]) child++;
        if (keys[child] >= lastKey) break;
        keys[i] = keys[child];
        items[i] = items[child];
        i = child;
      }
      keys[i] = lastKey;
      items[i] = lastItem;
    }
    return top;
  }

  /** Key of the item `pop()` would return next. */
  peekKey(): number {
    return this.keys.length ? this.keys[0] : Infinity;
  }
}
