goog.provide('tr.StopOnSuccess');

goog.require('goog.asserts');
goog.require('tr.Abstract');
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
 * @param {!Array.<!tr.Task>=} opt_tasks Initial set of child tasks.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {tr.Abstract}
 * @constructor
 * @struct
 */
tr.StopOnSuccess = function(opt_tasks, opt_taskName) {
  goog.base(this, opt_taskName || "StopOnSuccess");

  /** @private {!Array.<!tr.Task>} */
  this.taskQueue_ = [];

  /** @private {number} */
  this.taskQueueIndex_ = 0;

  /** @private {!Array.<!tr.Task>} */
  this.completedTasks_ = [];

  /** @private {!Array.<!tr.Task>} */
  this.erroredTasks_ = [];

  if (opt_tasks) {
    this.addAll(opt_tasks);
  }
};
goog.inherits(tr.StopOnSuccess, tr.Abstract);

/**
 * Adds a set of tasks to the list of child tasks.
 * 
 * <p>This method should only be called before the task is run.
 * Adding child tasks while running is not a supported operation.
 *
 * @param {!Array.<!tr.Task>} tasks Child tasks to be added
 * @return {!tr.StopOnSuccess} a reference to the current task.
 * @throws {Error} if the composite task has already been run.
 * @throws {Error} if tasks have been added more than once
 */
tr.StopOnSuccess.prototype.addAll = function(tasks) {
  for (var i = 0; i < tasks.length; i++) {
    this.add(tasks[i]);
  }

  return this;
};

/**
 * Adds a task to the list of child tasks.
 * 
 * <p>This method should only be called before the task is run.
 * Adding child tasks while running is not a supported operation.
 *
 * @param {!tr.Task} task Child task to be run when this task is run.
 * @return {!tr.StopOnSuccess} a reference to the current task.
 * @throws {Error} if the composite task has already been run.
 * @throws {Error} if task has been added more than once
 */
tr.StopOnSuccess.prototype.add = function(task) {
  goog.asserts.assert(this.getState() !== tr.enums.State.RUNNING, 'Cannot add task while running.');

  var index = this.taskQueue_.indexOf(task);

  if (index >= 0) {
    throw 'Cannot add task more than once.';
  }

  this.taskQueue_.push(task);

  return this;
};

/**
 * Removes a task from the list of child tasks.
 * 
 * <p>This method should only be called before the task is run.
 * Removing child tasks while running is not a supported operation.
 *
 * @param {!tr.Task} task Child task to be removed from the graph.
 * @return {!tr.StopOnSuccess} a reference to the current task.
 * @throws {Error} if the composite task has already been run.
 * @throws {Error} if the task provided is not a child of this composite.
 */
tr.StopOnSuccess.prototype.remove = function(task) {
  goog.asserts.assert(this.getState() !== tr.enums.State.RUNNING, 'Cannot remove task while running.');

  var index = this.taskQueue_.indexOf(task);

  if (index < 0) {
    throw 'Attempted to remove an invalid task.';
  }

  this.removeCallbacks_(task);
  this.taskQueue_.splice(this.taskQueue_.indexOf(task), 1);

  return this;
};

/**
 * @inheritDoc
 */
tr.StopOnSuccess.prototype.getOperationsCount = function() {
  var operationsCount = 0;

  this.eachTaskInQueue_(
    function(task) {
      operationsCount += task.getOperationsCount();
    });

  return operationsCount;
};

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
 * @override
 * @inheritDoc
 */
tr.StopOnSuccess.prototype.runImpl = function() {
  if (this.allTasksAreCompleted_()) {
    this.completeInternal();
  } else {
    this.erroredTasks_ = [];

    var task = this.taskQueue_[this.taskQueueIndex_];

    this.addCallbacks_(task);

    task.run();
  }
};

/**
 * @override
 * @inheritDoc
 */
tr.StopOnSuccess.prototype.interruptImpl = function() {
  this.eachTaskInQueue_(
    function(task) {
      if (task.getState() == tr.enums.State.RUNNING) {
        task.interrupt();
      }
    });
};

/**
 * @override
 * @inheritDoc
 */
tr.StopOnSuccess.prototype.resetImpl = function() {
  this.taskQueueIndex_ = 0;
  this.completedTasks_ = [];
  this.erroredTasks_ = [];

  this.eachTaskInQueue_(
    function(task) {
      task.reset();
    });
};

/**
 * Adds completed and errored callback handlers to child Task.
 *
 * @param {!tr.Task} task Child task
 * @private
 */
tr.StopOnSuccess.prototype.addCallbacks_ = function(task) {
  task.completed(this.childTaskCompleted_, this);
  task.errored(this.childTaskErrored_, this);
};

/**
 * Removes completed and errored callback handlers from child Task.
 *
 * @param {!tr.Task} task Child task
 * @private
 */
tr.StopOnSuccess.prototype.removeCallbacks_ = function(task) {
  task.off(tr.enums.Event.COMPLETED, this.childTaskCompleted_, this);
  task.off(tr.enums.Event.ERRORED, this.childTaskErrored_, this);
};

/**
 * Are all child tasks completed?
 *
 * @return {boolean}
 * @private
 */
tr.StopOnSuccess.prototype.allTasksAreCompleted_ = function() {
  for (var i = 0; i < this.taskQueue_.length; i++) {
    var task = this.taskQueue_[i];

    if (task.getState() != tr.enums.State.COMPLETED) {
      return false;
    }
  }

  return true;
};

/**
 * Checks for completion (or failure) of child tasks and triggers callbacks.
 *
 * @private
 */
tr.StopOnSuccess.prototype.checkForTaskCompletion_ = function() {
  if (this.completedTasks_.length > 0) {
    this.completeInternal();
  } else {
    var finishedCount = this.completedTasks_.length + this.erroredTasks_.length;

    if (finishedCount >= this.taskQueue_.length) {
      if (this.erroredTasks_.length > 0) {
        this.errorInternal();
      } else {
        this.completeInternal();
      }
    }
  }
};

/**
 * Convenience method for handling a completed Task and executing the next.
 *
 * @param {!tr.Task} task Task that has either been removed from the
 *     queue or has completed successfully.
 * @private
 */
tr.StopOnSuccess.prototype.taskCompletedOrRemoved_ = function(task) {
  this.taskQueueIndex_++;

  // TRICKY Ensure we are still running before continuing.
  // Callbacks attached to child tasks may have interrupted the composite.
  if (this.getState() != tr.enums.State.RUNNING) {
    return;
  }

  this.checkForTaskCompletion_();

  if (this.getState() == tr.enums.State.RUNNING) {
    var nextTask = this.taskQueue_[this.taskQueueIndex_];

    if (nextTask) {
      this.addCallbacks_(nextTask);

      nextTask.run();
    }
  }
};

/**
 * Invoke a callback once for each Task in the queue.
 *
 * @param {function(!tr.Task)} callback Callback function
 * @private
 */
tr.StopOnSuccess.prototype.eachTaskInQueue_ = function(callback) {
  for (var i = 0; i < this.taskQueue_.length; i++) {
    var task = this.taskQueue_[i];

    callback(task);
  }
};

/**
 * Callback for child task completions.
 *
 * @param {!tr.Task} task Task that has just completed.
 * @private
 */
tr.StopOnSuccess.prototype.childTaskCompleted_ = function(task) {
  this.completedTasks_.push(task);

  this.taskCompletedOrRemoved_(task);
};

/**
 * Callback for child task errors.
 *
 * @param {!tr.Task} task Task that has just errored.
 * @private
 */
tr.StopOnSuccess.prototype.childTaskErrored_ = function(task) {
  this.erroredTasks_.push(task);

  this.taskCompletedOrRemoved_(task);
};
