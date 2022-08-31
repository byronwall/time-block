import { createUuid } from "../util/helpers";
export interface TimeBlockEntry {
  start?: number;
  duration: number;
  description: string;
  id: string;
  priority: number;

  isComplete?: boolean;
  isFrozen?: boolean;
}

export interface TimeBlockDay {
  label: string;
  entries: TimeBlockEntry[];
}

export interface TaskList {
  id: string;
  name: string;
  timeBlockEntries: TimeBlockEntry[];

  timeBlockDays: TimeBlockDay[];

  viewStart: string;
  viewEnd: string;
}

export function createDefaultTaskList(): TaskList {
  return {
    name: "default",
    timeBlockEntries: [],
    id: createUuid(),
    viewEnd: "17:00",
    viewStart: "08:00",
    timeBlockDays: [],
  };
}
