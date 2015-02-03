goog.provide('taskrunner.CompositeTask');

goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.TaskEvent');
goog.require('taskrunner.TaskState');



/**
 * Executes a set of Tasks either in parallel or serial, as specified by a constructor parameter.
 *
 * @example
 * // Creates a composite task that will execute child tasks A, B, and C in parallel
 * var task = new taskrunner.CompositeTask(true);
 * task.addTask(childTaskA);
 * task.addTask(childTaskB);
 * task.addTask(childTaskC);
 * task.run();
 *
 * @example
 * // Creates a composite task that will execute child tasks A, B, and C in serial
 * var task = new taskrunner.CompositeTask(false, [childTaskA, childTaskB, childTaskC]);
 * task.run();
 *
 * @param {boolean} parallel If TRUE, child tasks are run simultaneously;
 *                           otherwise they are run serially, in the order they were added.
 * @param {!Array.<!taskrunner.Task>=} opt_tasks Initial set of child tasks.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.AbstractTask}
 * @constructor
 * @struct
 */
taskrunner.CompositeTask = function(parallel, opt_tasks, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {boolean} */
  this.parallel_ = parallel;

  /** @private {!Array.<!taskrunner.Task>} */
  this.taskQueue_ = [];

  /** @private {number} */
  this.taskQueueIndex_ = 0;

  /** @private {!Array.<!taskrunner.Task>} */
  this.completedTasks_ = [];

  /** @private {!Array.<!taskrunner.Task>} */
  this.erroredTasks_ = [];

  /** @private {boolean} */
  this.flushTaskQueueInProgress_ = false;

  if (opt_tasks) {
    this.addAllTasks(opt_tasks);
  }
};
goog.inherits(taskrunner.CompositeTask, taskrunner.AbstractTask);


/**
 * Adds a set of tasks to the list of child tasks.
 *
 * @param {!Array.<!taskrunner.Task>} tasks Child tasks to be added
 * @return {!taskrunner.CompositeTask} a reference to the current task.
 * @throws {Error} if tasks have been added more than once
 */
taskrunner.CompositeTask.prototype.addAllTasks = function(tasks) {
  for (var i = 0; i < tasks.length; i++) {
    this.addTask(tasks[i]);
  }

  return this;
};


/**
 * Adds a task to the list of child tasks.
 *
 * @param {!taskrunner.Task} task Child task to be run when this task is run.
 * @return {!taskrunner.CompositeTask} a reference to the current task.
 * @throws {Error} if task has been added more than once
 */
taskrunner.CompositeTask.prototype.addTask = function(task) {
  var index = this.taskQueue_.indexOf(task);

  if (index >= 0) {
    throw 'Cannot add task more than once.';
  }

  this.taskQueue_.push(task);

  if (this.getState() == taskrunner.TaskState.RUNNING) {
    index = this.taskQueue_.indexOf(task);

    // TRICKY If the queue was just flushed, auto-run this task.
    if (this.parallel_ || this.taskQueueIndex_ == index) {
      this.addTaskCallbacks_(task);

      task.run();
    }
  }

  return this;
};


/**
 * Removes a task from the list of child tasks.
 *
 * @param {!taskrunner.Task} task Child task to be removed from the graph.
 * @return {!taskrunner.CompositeTask} a reference to the current task.
 * @throws {Error} if the task provided is not a child of this composite.
 */
taskrunner.CompositeTask.prototype.removeTask = function(task) {
  var index = this.taskQueue_.indexOf(task);

  if (index < 0) {
    throw 'Attempted to remove an invalid task.';
  }

  this.removeTaskCallbacks_(task);
  this.taskQueue_.splice(this.taskQueue_.indexOf(task), 1);

  if (this.getState() == taskrunner.TaskState.RUNNING) {
    if (this.parallel_ || index <= this.taskQueueIndex_) {
      this.taskQueueIndex_--;
    }

    if (task.getState() == taskrunner.TaskState.RUNNING ||
        task.getState() == taskrunner.TaskState.INTERRUPTED) {
      this.taskCompletedOrRemoved_(task);
    }
  }

  return this;
};


/**
 * @inheritDoc
 */
taskrunner.CompositeTask.prototype.getOperationsCount = function() {
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
taskrunner.CompositeTask.prototype.getCompletedOperationsCount = function() {
  var completedOperationsCount = 0;

  this.eachTaskInQueue_(
    function(task) {
      completedOperationsCount += task.getCompletedOperationsCount();
    });

  return completedOperationsCount;
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.CompositeTask.prototype.runImpl = function() {
  if (this.allTasksAreCompleted_()) {
    this.completeInternal();
  } else {
    this.erroredTasks_ = [];

    if (this.parallel_) {
      this.eachTaskInQueue_(
        goog.bind(function(task) {
          this.addTaskCallbacks_(task);

          task.run();
        }, this));
    } else {
      var task = this.taskQueue_[this.taskQueueIndex_];

      this.addTaskCallbacks_(task);

      task.run();
    }
  }
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.CompositeTask.prototype.interruptImpl = function() {
  this.eachTaskInQueue_(
    function(task) {
      if (task.getState() == taskrunner.TaskState.RUNNING) {
        task.interrupt();
      }
    });
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.CompositeTask.prototype.resetImpl = function() {
  this.taskQueueIndex_ = 0;
  this.completedTasks_ = [];
  this.erroredTasks_ = [];

  this.eachTaskInQueue_(
    function(task) {
      task.reset();
    });
};


/**
 * Warning: this method is intended for a specific use-case. Please read the
 * documentation carefully to ensure that you understand that use-case before
 * using the method.
 *
 * Composite tasks may need to change direction while executing. For instance,
 * a user-input event may be received while a composite task is executing that
 * changes what should happen next. In that event this method can be used to
 * interrupt any tasks that are running, flush the current queue, and reset the
 * composite task to a pristine state.
 *
 * Furthermore this method may be instructed to leave the composite task running
 * once the queue has been flushed. This allows a new set of child tasks to be
 * added and run without triggering external callbacks.
 *
 * This behavior should only be used if the composite is going to be
 * re-populated and re-run (continued) immediately after flushing.
 *
 * @param {boolean=} doNotComplete If TRUE, this task will not complete itself
 *     nor invoke any completion callbacks once the queue has been emptied.
 * @protected
 */
taskrunner.CompositeTask.prototype.flushTaskQueue = function(doNotComplete) {
  // Prevent completion callbacks from being invoked once the queue is empty.
  // See checkForTaskCompletion_() for more information.
  this.flushTaskQueueInProgress_ = !!doNotComplete;

  // Manually interrupt any Task that are running.
  this.eachTaskInQueue_(
    function(task) {
      if (task.getState() == taskrunner.TaskState.RUNNING) {
        task.interrupt();
      }
    });

  // Remove Tasks in reverse order to avoid running the next Task(s).
  while (this.taskQueue_.length > 0) {
    var task = this.taskQueue_[this.taskQueue_.length - 1];

    this.removeTask(task);
  }

  this.completedTasks_ = [];
  this.erroredTasks_ = [];

  this.flushTaskQueueInProgress_ = false;
};


/**
 * Adds completed and errored callback handlers to child Task.
 *
 * @param {!taskrunner.Task} task Child task
 * @private
 */
taskrunner.CompositeTask.prototype.addTaskCallbacks_ = function(task) {
  task.completed(this.childTaskCompleted_, this);
  task.errored(this.childTaskErrored_, this);
};


/**
 * Removes completed and errored callback handlers from child Task.
 *
 * @param {!taskrunner.Task} task Child task
 * @private
 */
taskrunner.CompositeTask.prototype.removeTaskCallbacks_ = function(task) {
  task.off(taskrunner.TaskEvent.COMPLETED, this.childTaskCompleted_, this);
  task.off(taskrunner.TaskEvent.ERRORED, this.childTaskErrored_, this);
};


/**
 * Are all child tasks completed?
 *
 * @return {boolean}
 * @private
 */
taskrunner.CompositeTask.prototype.allTasksAreCompleted_ = function() {
  for (var i = 0; i < this.taskQueue_.length; i++) {
    var task = this.taskQueue_[i];

    if (task.getState() != taskrunner.TaskState.COMPLETED) {
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
taskrunner.CompositeTask.prototype.checkForTaskCompletion_ = function() {
  // This lock will only be set to true if the flushTaskQueue() is in-progress.
  // In this case we should ignore child task callbacks.
  if (this.flushTaskQueueInProgress_) {
    return;
  }

  var finishedCount = this.completedTasks_.length + this.erroredTasks_.length;

  // When running in parallel, wait for all child tasks to complete (or fail)
  // before triggering our callbacks. Also be sure to count the failed tasks
  // when determining if the queue is empty.
  if (finishedCount >= this.taskQueue_.length) {
    if (this.erroredTasks_.length > 0) {
      this.errorInternal();
    } else {
      this.completeInternal();
    }
  }
};


/**
 * Convenience method for handling a completed Task and executing the next.
 *
 * @param {!taskrunner.Task} task Task that has either been removed from the
 *     queue or has completed successfully.
 * @private
 */
taskrunner.CompositeTask.prototype.taskCompletedOrRemoved_ = function(task) {
  this.taskQueueIndex_++;

  // TRICKY Ensure we are still running before continuing.
  // Callbacks attached to child tasks may have interrupted the composite.
  if (this.getState() != taskrunner.TaskState.RUNNING) {
    return;
  }

  this.checkForTaskCompletion_();

  if (!this.parallel_ && this.getState() == taskrunner.TaskState.RUNNING) {
    var nextTask = this.taskQueue_[this.taskQueueIndex_];

    // TRICKY Handle edge-case where the task queue is being flushed.
    if (nextTask) {
      this.addTaskCallbacks_(nextTask);

      nextTask.run();
    }
  }
};


/**
 * Invoke a callback once for each Task in the queue.
 *
 * @param {function(!taskrunner.Task)} callback Callback function
 * @private
 */
taskrunner.CompositeTask.prototype.eachTaskInQueue_ = function(callback) {
  for (var i = 0; i < this.taskQueue_.length; i++) {
    var task = this.taskQueue_[i];

    callback(task);
  }
};


/**
 * Callback for child task completions.
 *
 * @param {!taskrunner.Task} task Task that has just completed.
 * @private
 */
taskrunner.CompositeTask.prototype.childTaskCompleted_ = function(task) {
  this.completedTasks_.push(task);

  this.taskCompletedOrRemoved_(task);
};


/**
 * Callback for child task errors.
 *
 * @param {!taskrunner.Task} task Task that has just errored.
 * @private
 */
taskrunner.CompositeTask.prototype.childTaskErrored_ = function(task) {
  this.erroredTasks_.push(task);

  // Don't halt execution in parallel mode.
  // Allow tasks to finish running before bubbling the error.
  if (this.parallel_) {
    this.checkForTaskCompletion_();
  } else {
    this.errorInternal(task.getData(), task.getErrorMessage());
  }
};
