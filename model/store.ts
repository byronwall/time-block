import create from "zustand";
import { createDefaultTaskList, TaskList, TimeBlockEntry } from "./model";
import produce from "immer";

interface TaskStore {
  taskList: TaskList;
  setTaskList: (taskList: TaskList) => void;
  addTimeBlockEntry: (entry: TimeBlockEntry) => void;
  removeTimeBlockEntry: (id: string) => void;
  updateTimeBlockEntry: (entry: TimeBlockEntry) => void;
  updateTimeBlockEntryPartial(id: string, updates: Partial<TimeBlockEntry>);

  updateTaskListPartial: (updates: Partial<TaskList>) => void;

  updateTimeBlockEntryPartialBulk: (updates: TimeBlockBulkPartial) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  taskList: createDefaultTaskList(),
  setTaskList: (taskList) => set({ taskList }),
  updateTaskListPartial: (updates) => {
    set(
      produce((draft) => {
        Object.assign(draft.taskList, updates);
      })
    );
  },

  addTimeBlockEntry: (entry) =>
    set(produce((draft) => draft.taskList.timeBlockEntries.push(entry))),

  removeTimeBlockEntry: (id) =>
    set(
      produce((draft) => {
        const index = draft.taskList.timeBlockEntries.findIndex(
          (e) => e.id === id
        );
        if (index >= 0) {
          draft.taskList.timeBlockEntries.splice(index, 1);
        }
      })
    ),

  updateTimeBlockEntry: (entry) =>
    set(
      produce((draft) => {
        const index = draft.taskList.timeBlockEntries.findIndex(
          (e) => e.id === entry.id
        );
        draft.taskList.timeBlockEntries[index] = entry;
      })
    ),

  updateTimeBlockEntryPartial: (id: string, updates: Partial<TimeBlockEntry>) =>
    set(
      produce((draft) => {
        const block = draft.taskList.timeBlockEntries.find((e) => e.id === id);
        if (block) {
          Object.assign(block, updates);
        }
      })
    ),
  updateTimeBlockEntryPartialBulk: (updates: TimeBlockBulkPartial) =>
    set(
      produce((draft) => {
        for (const id in updates) {
          const block = draft.taskList.timeBlockEntries.find(
            (e) => e.id === id
          );
          if (block) {
            Object.assign(block, updates[id]);
          }
        }
      })
    ),
}));

export type TimeBlockBulkPartial = { [key: string]: Partial<TimeBlockEntry> };
