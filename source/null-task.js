goog.provide('taskrunner.NullTask');

goog.require('taskrunner.ClosureTask');



/**
 * No-op Task useful primarily for unit testing.
 * It can also be useful in factory situations when no-op behavior is desired.
 * If certain implementations wish to provide behavior they can replace the placeholder Stub task with one that does work.
 *
 * <p>This Task can be configured to auto-complete when it is executed.
 * Otherwise it will not complete or error until specifically told to do so.
 *
 * <p>This task is also interruptible although it does nothing when interrupted.
 *
 * @example
 * // Creates a dummy task that will auto-complete when run.
 * var task = new taskrunner.NullTask(true);
 * task.run();
 *
 * @param {boolean=} opt_autoCompleteUponRun Task should auto-complete when run.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.ClosureTask}
 * @constructor
 * @struct
 */
taskrunner.NullTask = function(opt_autoCompleteUponRun, opt_taskName) {
  goog.base(this, goog.nullFunction, opt_autoCompleteUponRun, opt_taskName);
};
goog.inherits(taskrunner.NullTask, taskrunner.ClosureTask);
