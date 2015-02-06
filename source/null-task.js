goog.provide('taskrunner.NullTask');

goog.require('taskrunner.ClosureTask');



/**
 * No-op task primarily useful for unit testing.
 *
 * <p>This type of task can also be useful in a composite when a default, no-op behavior is desired.
 * Simply replace the placeholder null task with one that does actual work.
 *
 * <p>This task can be configured to auto-complete when it is executed.
 * Otherwise it will not complete or error until specifically told to do so.
 *
 * @example
 * // Creates a dummy task that will auto-complete when run.
 * var task = new taskrunner.NullTask(true);
 * task.run();
 *
 * @param {boolean=} opt_autoCompleteUponRun Task should auto-complete when run.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {taskrunner.ClosureTask}
 * @constructor
 * @struct
 */
taskrunner.NullTask = function(opt_autoCompleteUponRun, opt_taskName) {
  goog.base(this, goog.nullFunction, opt_autoCompleteUponRun, opt_taskName);
};
goog.inherits(taskrunner.NullTask, taskrunner.ClosureTask);
