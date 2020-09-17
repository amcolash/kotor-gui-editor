import commandExists from 'command-exists';
import { detailedDiff } from 'deep-object-diff';
import * as hash from 'object-hash';
import { get } from 'object-path';

export function clone(d: any) {
  return JSON.parse(JSON.stringify(d));
}

export async function commandInPath(command: string): Promise<boolean> {
  try {
    await commandExists(command);
    return true;
  } catch (e) {
    // Command does not exist
    return false;
  }
}

export function getParent(data: any, path: string): any | null {
  const found = get(data, path);

  // It seems like the only nodes we care about are those with an id + struct (Normal + SCROLLBAR + PROTOITEM)
  if (found.id && found.struct) return get(data, path);

  return getParent(data, path.replace(/\.[\$\w\d]*$/, ''));
}

export function findModifiedNode(data: any, newData: any): any | null {
  const diff: any = detailedDiff(data, newData);

  const wasAdded = Object.keys(diff.added).length > 0;
  const wasDeleted = Object.keys(diff.deleted).length > 0;
  const wasUpdated = Object.keys(diff.updated).length > 0;

  // Only find node if it was updated
  if (wasUpdated && !wasAdded && !wasDeleted) {
    const lastUpdated = getPathMulti(diff.updated);
    const node = getParent(newData, lastUpdated);

    return node;
  }

  return null;
}

export function findFromHash(data: any, objHash: string): any | null {
  if (objHash === hash(data)) return data;

  if (data.list && data.list.struct) {
    let found;
    data.list.struct.forEach((e: any) => {
      const wasFound = findFromHash(e, objHash);
      if (wasFound) found = wasFound;
    });
    if (found) return found;
  }

  return null;
}

export function getLabel(data: any): string {
  let label: string = '';
  if (data.exostring) {
    if (data.exostring.label === 'TAG') label = data.exostring.$t;
    else if (Array.isArray(data.exostring)) {
      data.exostring.forEach((e: any) => {
        if (e.label === 'TAG') label = e.$t;
      });
    }
  }

  return label;
}

// Generate a path string (only works if there is a singular item at the bottom of the tree)
export function getPath(diff: any): string {
  if (typeof diff !== 'object') return diff;

  const keys = Object.keys(diff);
  if (keys.length === 0) {
    return '';
  } else if (keys.length === 1) {
    if (typeof diff[keys[0]] !== 'object') {
      return keys[0];
    }

    return keys[0] + '.' + getPath(diff[keys[0]]);
  }

  throw 'Multiple changes';
}

// Generate a path string (gets the most common node in the tree)
export function getPathMulti(diff: any): string {
  if (typeof diff !== 'object') return diff;

  const keys = Object.keys(diff);
  if (keys.length === 0) {
    return '';
  } else if (keys.length === 1) {
    if (typeof diff[keys[0]] !== 'object') {
      return keys[0];
    }

    const end = getPathMulti(diff[keys[0]]);
    return keys[0] + (end.length > 0 ? '.' + end : '');
  }

  return '';
}
