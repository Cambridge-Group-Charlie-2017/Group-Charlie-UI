export class Cache<T> {
  // List of cache entries. Indexes are not always ordered.
  private cache: {
    start: number;
    end: number;
    messages: T[];
  }[] = [];

  /**
   * Put messages into the message cache.
   * @param start start index of the messages, inclusive.
   * @param end end index of the messages, inclusive.
   * @param messages list of messages to cache.
   */
  put(start: number, end: number, messages: T[]): T {
    for (let i = 0; i < this.cache.length; i++) {
      let entry = this.cache[i];
      // If two entries neither collide nor touch, skip
      if (entry.start > end + 1 || entry.end + 1 < start) {
        continue;
      }
      if (start <= entry.start) {
        if (end >= entry.end) {
          // Inserting entry encloses the old entry
          // Then discard the old entry completely
          this.cache.splice(i, 1);
          return this.put(start, end, messages);
        } else {
          // Inserting entry preceeds existing entry
          // but there are messages in old entry that need to be merged with new ones
          let messageMerged = messages.concat(entry.messages.slice(end + 1 - entry.start));
          this.cache.splice(i, 1);
          return this.put(start, entry.end, messageMerged);
        }
      } else {
        let messageBefore = entry.messages.slice(0, start - entry.start);
        if (entry.end >= end) {
          // Inserting entry is enclosed by the old entry
          // Update old entry will be sufficient
          entry.messages = messageBefore.concat(messages, entry.messages.slice(end + 1 - entry.start));
          return;
        } else {
          // Inserting entry is after existing entry
          // but there are messages in old entry that need to be merged with new ones
          let messageMerged = messageBefore.concat(messages);
          this.cache.splice(i, 1);
          return this.put(entry.start, end, messageMerged);
        }
      }
    }
    this.cache.push({
      start: start,
      end: end,
      messages: messages
    });
  }

  mask(start: number, end: number): [number, number] {
    for (let entry of this.cache) {
      // If two entries neither collide nor touch, skip
      if (entry.start > end + 1 || entry.end + 1 < start) {
        continue;
      }
      if (start < entry.start) {
        if (end > entry.end) {
          // We can only return an interval
          // So no-op
        } else {
          end = entry.start - 1;
        }
      } else {
        if (entry.end >= end) {
          // Everything cached
          return [0, 0];
        } else {
          start = entry.end + 1;
        }
      }
    }
    return [start, end];
  }

  get(start: number, end: number) {
    for (let entry of this.cache) {
      // If two entries neither collide nor touch, skip
      if (entry.start > end + 1 || entry.end + 1 < start) {
        continue;
      }
      // If encloses
      if (start >= entry.start && end <= entry.end) {
        return entry.messages.slice(start - entry.start, end + 1 - entry.start);
      }
      // Otherwise we know that the entry partially collides
      return null;
    }
  }
}
