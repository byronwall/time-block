import { createContext } from "react";

export interface TaskColorContext {
  isColoredByPriority: boolean;

  getColorFromPriority(priority: number): string;

  onChange: (data: Partial<TaskColorContext>) => void;
}

export const TaskColorContext = createContext<TaskColorContext>(null);
export type ColorSansHandler = Omit<TaskColorContext, "onChange">;
