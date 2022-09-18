import { createUuid } from "../util/helpers";
export interface TimeBlockEntry {
  start?: number;
  duration: number;
  description: string;
  id: string;
  priority: number;

  // day will be 0 by default -- will increment if tasks are on other days
  day: number;

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

  viewStart: string;
  viewEnd: string;
}

export interface TaskListOld {
  timeBlockEntries: TimeBlockEntry[];
}

export function createDefaultTaskList(): TaskList {
  return {
    name: "default",
    id: createUuid(),
    viewEnd: "17:00",
    viewStart: "08:00",
    timeBlockEntries: [],
  };
}
