export interface Task {
  id: string;
  description: string;
  
  duration: number;
  start: number;
  end: number;
  
  completed: boolean;
  priority: number
}
