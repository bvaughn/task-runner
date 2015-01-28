goog.provide('taskrunner.TaskEvent');



/**
 * Enumeration of Task events.
 * @enum {number}
 */
taskrunner.TaskEvent = {
  STARTED: 0,
  INTERRUPTED: 1,
  COMPLETED: 2,
  ERRORED: 3,
  FINAL: 4
};
