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

  timeBlockDays: TimeBlockDay[];
  unscheduledEntries: TimeBlockEntry[];

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
    timeBlockDays: [],
    unscheduledEntries: [],
  };
}
