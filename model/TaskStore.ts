import create from "zustand";
import { createDefaultTaskList, TaskList, TimeBlockEntry } from "./model";
import produce from "immer";
import { utcParse } from "d3";

interface TaskStore {
  dateStart: () => Date;

  taskList: TaskList;
  setTaskList: (taskList: TaskList) => void;
  addTimeBlockEntry: (entry: TimeBlockEntry) => void;
  removeTimeBlockEntry: (id: string) => void;
  updateTimeBlockEntry: (entry: TimeBlockEntry) => void;
  updateTimeBlockEntryPartial(id: string, updates: Partial<TimeBlockEntry>);
  updateHoverTimeBlockEntryPartial(updates: PartialOrCallback<TimeBlockEntry>);

  updateTaskListPartial: (updates: Partial<TaskList>) => void;

  updateTimeBlockEntryPartialBulk: (updates: TimeBlockBulkPartial) => void;
}

interface HoverStore {
  mouseOverId: string | undefined;
  setMouseOverId: (id: string | undefined) => void;

  detailOptions: {
    id: string;
    isOpen: boolean;
  };

  lastUpdated: number;

  setDetailOptions: (options: { id: string; isOpen: boolean }) => void;

  toggleDetailShortcut: (forcedState?: boolean) => void;
  onCloseDetails: () => void;

  onDeleteHoverTask: () => void;
  onScheduleHoverTask: () => void;
}

const parser = utcParse("%H:%M");

export type Store = TaskStore & HoverStore;

type PartialOrCallback<T> = Partial<T> | ((draft: T) => Partial<T>);

export const useTaskStore = create<Store>((set, get) => ({
  taskList: createDefaultTaskList(),
  dateStart: () => parser(get()?.taskList.viewStart),
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
  updateHoverTimeBlockEntryPartial: (
    _updates: PartialOrCallback<TimeBlockEntry>
  ) =>
    set(
      produce((draft: Store) => {
        const block = draft.taskList.timeBlockEntries.find(
          (e) => e.id === draft.mouseOverId
        );
        if (block) {
          const updates =
            typeof _updates === "function" ? _updates(block) : _updates;

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

  onDeleteHoverTask: () => {
    set(
      produce((draft) => {
        const index = draft.taskList.timeBlockEntries.findIndex(
          (e) => e.id === draft.mouseOverId
        );
        if (index >= 0) {
          draft.taskList.timeBlockEntries.splice(index, 1);
        }
      })
    );
  },

  onScheduleHoverTask: () => {
    set(
      produce((draft: Store) => {
        const index = draft.taskList.timeBlockEntries.findIndex(
          (e) => e.id === draft.mouseOverId
        );
        if (index < 0) return;

        const entry = draft.taskList.timeBlockEntries[index];

        if (entry.start) {
          // unschedule
          entry.start = undefined;
          return;
        }
        // schedule

        const getFirstStartTime = (entriesFirstDay: TimeBlockEntry[] = []) => {
          const maxEndTime = entriesFirstDay.reduce((max, block) => {
            if (block.start === undefined) {
              return max;
            }

            return Math.max(max, block.start + block.duration * 1000);
          }, draft.dateStart().getTime());

          return maxEndTime;
        };

        entry.start = getFirstStartTime(draft.taskList.timeBlockEntries);
      })
    );
  },

  mouseOverId: undefined,
  lastUpdated: +Date.now(),
  setMouseOverId: (id) => {
    return set({ mouseOverId: id });
  },
  detailOptions: { id: "", isOpen: false },
  setDetailOptions: (options) => set({ detailOptions: options }),
  toggleDetailShortcut: (forcedState?: boolean) => {
    set(
      produce((draft: HoverStore) => {
        if (draft.detailOptions.id === draft.mouseOverId) {
          draft.detailOptions.isOpen =
            forcedState !== undefined
              ? forcedState
              : !draft.detailOptions.isOpen;
        } else {
          draft.detailOptions.id = draft.mouseOverId;
          draft.detailOptions.isOpen = true;
        }

        draft.lastUpdated = +Date.now();
      })
    );
  },
  onCloseDetails: () => {
    set(
      produce((draft: HoverStore) => {
        if (+Date.now() - draft.lastUpdated < 100) {
          // kick out if time delta is too small
          // this is needed because the popovers will call this function when they close naturally
          return;
        }

        draft.detailOptions.isOpen = false;
        draft.detailOptions.id = "";
      })
    );
  },
}));

export type TimeBlockBulkPartial = { [key: string]: Partial<TimeBlockEntry> };
