export interface Task {
  id: string;
  description: string;
  completed: boolean;

  duration: number;
  start: number;
  end: number;
}
