export const NOTIFICATIONS_QUEUE = 'notifications';
export const TASK_ASSIGNED_JOB = 'task.assigned';

export interface TaskAssignedJobPayload {
  taskId: string;
  title: string;
  assigneeIds: string[];
  source: 'create' | 'update';
}
