goog.provide('tr.StopOnSuccess');

goog.require('tr.Composite');
goog.require('tr.enums.State');

/**
 * Runs a series of tasks until one of them successfully completes.
 *
 * <p>This type of task completes successfully if at least one of its children complete.
 * If all of its children error, this task will also error.
 *
 * @example
 * new tr.StopOnSuccess([taskA, taskB]).run();
 * // Task A will be executed first.
 * // If Task A completes, StopOnSuccess will complete.
 * // If Task A fails, Task B will be run.
 * // If Task B completes, StopOnSuccess will complete.
 * // If Task B fails, StopOnSuccess will fail.
 *
 * @param {boolean} parallel If TRUE, child tasks are run simultaneously;
 *                           otherwise they are run serially, in the order they were added.
 * @param {!Array.<!tr.Task>=} opt_tasks Initial set of child tasks.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {tr.Abstract}
 * @constructor
 * @struct
 */
tr.StopOnSuccess = function(opt_tasks, opt_taskName) {
  goog.base(this, false, opt_tasks, opt_taskName || "StopOnSuccess");
};
goog.inherits(tr.StopOnSuccess, tr.Composite);

/**
 * @inheritDoc
 */
tr.StopOnSuccess.prototype.getCompletedOperationsCount = function() {
  if (this.getState() === tr.enums.State.COMPLETED) {
    return this.getOperationsCount();
  } else {
    var completedOperationsCount = 0;

    this.eachTaskInQueue_(
      function(task) {
        completedOperationsCount += task.getCompletedOperationsCount();
      });

    return completedOperationsCount;
  }
};

/**
 * @private
 */
tr.StopOnSuccess.prototype.checkForTaskCompletion_ = function() {
  if (this.completedTasks_.length > 0) {
    this.completeInternal();
  } else {
    goog.base(this, 'checkForTaskCompletion_');
  }
};

/**
 * @private
 */
tr.StopOnSuccess.prototype.childTaskErrored_ = function(task) {
  this.erroredTasks_.push(task);

  this.taskCompletedOrRemoved_(task);
};