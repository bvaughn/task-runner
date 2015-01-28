goog.provide('taskrunner.TaskState');



/**
 * Enumeration of Task states.
 * @enum {number}
 */
taskrunner.TaskState = {
  INITIALIZED: 0,
  RUNNING: 1,
  INTERRUPTED: 2,
  COMPLETED: 3,
  ERRORED: 4
};
