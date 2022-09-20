import { scaleOrdinal, timeFormat, utcParse } from "d3";
import produce from "immer";
import create from "zustand";

import { getTImeBlocksWithoutOverlap } from "../components/helpers";
import { quickPost } from "../util/quickPost";
import { createDefaultTaskList, TaskList, TimeBlockEntry } from "./model";

interface TaskStore {
  dateStart: () => Date;
  dateEnd: () => Date;

  taskList: TaskList;
  setTaskList: (taskList: TaskList) => void;
  addTimeBlockEntry: (entry: TimeBlockEntry) => void;
  updateTimeBlockEntry: (entry: TimeBlockEntry) => void;
  updateTimeBlockEntryPartial(id: string, updates: Partial<TimeBlockEntry>);
  updateHoverTimeBlockEntryPartial(updates: PartialOrCallback<TimeBlockEntry>);

  updateTaskListPartial: (updates: Partial<TaskList>) => void;

  updateTimeBlockEntryPartialBulk: (updates: TimeBlockBulkPartial) => void;

  onSaveActiveTasks: () => void;

  onRebalanceTasks: (day?: number) => void;

  shouldScheduleAfterCurrent: boolean;
  setShouldScheduleAfterCurrent: (shouldScheduleAfterCurrent: boolean) => void;

  numberOfDays: () => number;
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

interface SearchStore {
  isSearchOpen: boolean;
  searchText: string;

  setIsSearchOpen: (isOpen: boolean) => void;
  setSearchText: (text: string) => void;
}

interface ColorStore {
  isColoredByPriority: boolean;
  setIsColoredByPriority: (isColoredByPriority: boolean) => void;
  toggleIsColoredByPriority: () => void;

  getColorFromPriority(priority: number): string;
}

const parser = utcParse("%H:%M");
const dateToStrLocal = timeFormat("%H:%M");

export type Store = TaskStore & HoverStore & SearchStore & ColorStore;

type PartialOrCallback<T> = Partial<T> | ((draft: T) => Partial<T>);

export const useTaskStore = create<Store>((set, get) => ({
  numberOfDays: () => {
    const maxDayNum = get().taskList.timeBlockEntries.reduce((acc, entry) => {
      return Math.max(acc, entry.day ?? 0);
    }, 0);
    return maxDayNum;
  },

  shouldScheduleAfterCurrent: true,
  setShouldScheduleAfterCurrent: (shouldScheduleAfterCurrent) => {
    set({ shouldScheduleAfterCurrent });
  },
  onRebalanceTasks: (day = 0) => {
    // TODO: verify that this works?
    // TODO: this can now process the draft directly... update

    // TODO: handle the case where the shortcut is used for all days
    const nowInRightUnits = parser(dateToStrLocal(new Date()));

    const schedStartTime = get().shouldScheduleAfterCurrent
      ? +nowInRightUnits
      : +get().dateStart();

    const taskForDesiredDay = get().taskList.timeBlockEntries.filter(
      (entry) => entry.day === day
    );
    const newEntries = getTImeBlocksWithoutOverlap(
      taskForDesiredDay,
      schedStartTime
    );

    get().updateTimeBlockEntryPartialBulk(newEntries);
  },
  isColoredByPriority: true,
  setIsColoredByPriority: (isColoredByPriority) => set({ isColoredByPriority }),
  toggleIsColoredByPriority: () =>
    set((state) => ({
      isColoredByPriority: !state.isColoredByPriority,
    })),
  getColorFromPriority: (priority) => {
    const scale = scaleOrdinal<number, string>()
      .domain([1, 2, 3, 4, 5])
      .range(["#D61E29", "#FDBB30", "#FEE08B", "#D9EF8B", "#A6D96A"]);
    return scale(priority);
  },

  isSearchOpen: false,
  searchText: "",
  setIsSearchOpen: (isOpen) =>
    set(
      produce((draft) => {
        draft.isSearchOpen = isOpen;
      })
    ),
  setSearchText: (text) =>
    set(
      produce((draft) => {
        draft.searchText = text;
      })
    ),
  taskList: createDefaultTaskList(),
  dateStart: () => parser(get()?.taskList.viewStart),
  dateEnd: () => parser(get()?.taskList.viewEnd),

  setTaskList: (taskList) => set({ taskList }),
  updateTaskListPartial: (updates) => {
    set(
      produce((draft) => {
        Object.assign(draft.taskList, updates);
      })
    );
  },

  onSaveActiveTasks: () => {
    quickPost("/api/insertTaskList", get().taskList);
  },

  addTimeBlockEntry: (entry) =>
    set(
      produce((draft) => {
        draft.taskList.timeBlockEntries.push(entry);
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

        const maxEndTime = draft.taskList.timeBlockEntries.reduce(
          (max, block) => {
            if (block.start === undefined) {
              return max;
            }

            return Math.max(max, block.start + block.duration * 1000);
          },
          -Number.MAX_VALUE
        );

        entry.start = maxEndTime;
      })
    );
  },

  mouseOverId: undefined,
  lastUpdated: +Date.now(),
  setMouseOverId: (id) => set({ mouseOverId: id }),
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
