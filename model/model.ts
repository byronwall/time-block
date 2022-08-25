export interface TimeBlockEntry {
  start?: number;
  duration: number;
  description: string;
  id: string;
  priority: number;

  isComplete?: boolean;
  isFrozen?: boolean;
}

export interface TaskList {
  id: string;
  name: string;
  timeBlockEntries: TimeBlockEntry[];

  viewStart: string;
  viewEnd: string;
}
