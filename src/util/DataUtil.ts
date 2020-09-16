import commandExists from 'command-exists';
import * as hash from 'object-hash';

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

export function findFromHash(data: any, objHash: string): any | null {
  console.log(hash(data), data);
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
