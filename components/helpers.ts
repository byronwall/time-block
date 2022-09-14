import { TimeBlockEntry } from "../model/model";
import { TimeBlockBulkPartial } from "../model/TaskStore";

/** Event handler that exposes the target element's value as a boolean. */
export function handleBooleanChange(handler: (checked: boolean) => void) {
  return (event: React.FormEvent<HTMLElement>) =>
    handler((event.target as HTMLInputElement).checked);
}

/** Event handler that exposes the target element's value as a string. */
export function handleStringChange(handler: (value: string) => void) {
  return (event: React.FormEvent<HTMLElement>) =>
    handler((event.target as HTMLInputElement).value);
}

/** Event handler that exposes the target element's value as a number. */
export function handleNumberChange(handler: (value: number) => void) {
  return handleStringChange((value) => handler(+value));
}

// function that takes a hex code and returns black or white depending on the luminosity
export function getTextColor(hex: string) {
  const rgb = hexToRgb(hex);
  const luminosity = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminosity > 0.5 ? "black" : "white";
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function getTImeBlocksWithoutOverlap(
  timeBlocks: TimeBlockEntry[],
  forcedStart: number
): TimeBlockBulkPartial {
  // function that modifies an array of time blocks to occur end to end without overlap

  const result: TimeBlockBulkPartial = {};

  const goodBlocks = timeBlocks
    .filter((c) => c.start !== undefined)
    .sort((a, b) => a.start - b.start);

  const frozenBlocks = timeBlocks.filter(
    (c) => c.isFrozen && c.start !== undefined
  );

  goodBlocks.forEach((block, idx) => {
    // skip movement on frozen blocks and complete
    if (block.isFrozen || block.isComplete) {
      return;
    }

    if (idx === 0) {
      if (forcedStart !== undefined) {
        result[block.id] = { start: forcedStart };
      }
      return;
    }
    let prevBlock = goodBlocks[idx - 1];

    const prevStart = result[prevBlock.id]?.start ?? prevBlock.start;

    const possibleStart = Math.max(
      forcedStart,
      prevStart + prevBlock.duration * 1000
    );

    const possibleEnd = possibleStart + block.duration * 1000;

    // check if start or end time is in a frozen block
    const frozenConflicts = frozenBlocks.filter((c) => {
      const isBefore = possibleEnd <= c.start;
      const isAfter = possibleStart >= c.start + c.duration * 1000;

      return !(isBefore || isAfter);
    });

    const actualStart =
      frozenConflicts.length > 0
        ? frozenConflicts[0].start + frozenConflicts[0].duration * 1000
        : possibleStart;

    result[block.id] = { start: actualStart };
  });

  return result;
}
