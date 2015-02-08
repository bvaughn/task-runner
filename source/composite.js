goog.provide('tr.Composite');

goog.require('tr.Abstract');
goog.require('tr.enums.Event');
goog.require('tr.enums.State');



/**
 * Executes a set of Tasks either in parallel or one after another.
 *
 * @example
 * // Creates a composite task that will execute child tasks A, B, and C in parallel
 * var task = new tr.Composite(true);
 * task.addTask(childTaskA);
 * task.addTask(childTaskB);
 * task.addTask(childTaskC);
 * task.run();
 *
 * @example
 * // Creates a composite task that will execute child tasks A, then B, then C in order
 * var task = new tr.Composite(false, [childTaskA, childTaskB, childTaskC]);
 * task.run();
 *
 * @param {boolean} parallel If TRUE, child tasks are run simultaneously;
 *                           otherwise they are run serially, in the order they were added.
 * @param {!Array.<!tr.Task>=} opt_tasks Initial set of child tasks.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {tr.Abstract}
 * @constructor
 * @struct
 */
tr.Composite = function(parallel, opt_tasks, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {boolean} */
  this.parallel_ = parallel;

  /** @private {!Array.<!tr.Task>} */
  this.taskQueue_ = [];

  /** @private {number} */
  this.taskQueueIndex_ = 0;

  /** @private {!Array.<!tr.Task>} */
  this.completedTasks_ = [];

  /** @private {!Array.<!tr.Task>} */
  this.erroredTasks_ = [];

  /** @private {boolean} */
  this.flushTaskQueueInProgress_ = false;

  if (opt_tasks) {
    this.addAllTasks(opt_tasks);
  }
};
goog.inherits(tr.Composite, tr.Abstract);


/**
 * Adds a set of tasks to the list of child tasks.
 *
 * @param {!Array.<!tr.Task>} tasks Child tasks to be added
 * @return {!tr.Composite} a reference to the current tr.
 * @throws {Error} if tasks have been added more than once
 */
tr.Composite.prototype.addAllTasks = function(tasks) {
  for (var i = 0; i < tasks.length; i++) {
    this.addTask(tasks[i]);
  }

  return this;
};


/**
 * Adds a task to the list of child tasks.
 *
 * @param {!tr.Task} task Child task to be run when this task is run.
 * @return {!tr.Composite} a reference to the current tr.
 * @throws {Error} if task has been added more than once
 */
tr.Composite.prototype.addTask = function(task) {
  var index = this.taskQueue_.indexOf(task);

  if (index >= 0) {
    throw 'Cannot add task more than once.';
  }

  this.taskQueue_.push(task);

  if (this.getState() == tr.enums.State.RUNNING) {
    index = this.taskQueue_.indexOf(task);

    // TRICKY If the queue was just flushed, auto-run this tr.
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
 * @param {!tr.Task} task Child task to be removed from the graph.
 * @return {!tr.Composite} a reference to the current tr.
 * @throws {Error} if the task provided is not a child of this composite.
 */
tr.Composite.prototype.removeTask = function(task) {
  var index = this.taskQueue_.indexOf(task);

  if (index < 0) {
    throw 'Attempted to remove an invalid tr.';
  }

  this.removeTaskCallbacks_(task);
  this.taskQueue_.splice(this.taskQueue_.indexOf(task), 1);

  if (this.getState() == tr.enums.State.RUNNING) {
    if (this.parallel_ || index <= this.taskQueueIndex_) {
      this.taskQueueIndex_--;
    }

    if (task.getState() == tr.enums.State.RUNNING ||
        task.getState() == tr.enums.State.INTERRUPTED) {
      this.taskCompletedOrRemoved_(task);
    }
  }

  return this;
};


/**
 * @inheritDoc
 */
tr.Composite.prototype.getOperationsCount = function() {
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
tr.Composite.prototype.getCompletedOperationsCount = function() {
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
tr.Composite.prototype.runImpl = function() {
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
tr.Composite.prototype.interruptImpl = function() {
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
tr.Composite.prototype.resetImpl = function() {
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
tr.Composite.prototype.flushTaskQueue = function(doNotComplete) {
  // Prevent completion callbacks from being invoked once the queue is empty.
  // See checkForTaskCompletion_() for more information.
  this.flushTaskQueueInProgress_ = !!doNotComplete;

  // Manually interrupt any Task that are running.
  this.eachTaskInQueue_(
    function(task) {
      if (task.getState() == tr.enums.State.RUNNING) {
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
 * @param {!tr.Task} task Child task
 * @private
 */
tr.Composite.prototype.addTaskCallbacks_ = function(task) {
  task.completed(this.childTaskCompleted_, this);
  task.errored(this.childTaskErrored_, this);
};


/**
 * Removes completed and errored callback handlers from child Task.
 *
 * @param {!tr.Task} task Child task
 * @private
 */
tr.Composite.prototype.removeTaskCallbacks_ = function(task) {
  task.off(tr.enums.Event.COMPLETED, this.childTaskCompleted_, this);
  task.off(tr.enums.Event.ERRORED, this.childTaskErrored_, this);
};


/**
 * Are all child tasks completed?
 *
 * @return {boolean}
 * @private
 */
tr.Composite.prototype.allTasksAreCompleted_ = function() {
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
tr.Composite.prototype.checkForTaskCompletion_ = function() {
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
 * @param {!tr.Task} task Task that has either been removed from the
 *     queue or has completed successfully.
 * @private
 */
tr.Composite.prototype.taskCompletedOrRemoved_ = function(task) {
  this.taskQueueIndex_++;

  // TRICKY Ensure we are still running before continuing.
  // Callbacks attached to child tasks may have interrupted the composite.
  if (this.getState() != tr.enums.State.RUNNING) {
    return;
  }

  this.checkForTaskCompletion_();

  if (!this.parallel_ && this.getState() == tr.enums.State.RUNNING) {
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
 * @param {function(!tr.Task)} callback Callback function
 * @private
 */
tr.Composite.prototype.eachTaskInQueue_ = function(callback) {
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
tr.Composite.prototype.childTaskCompleted_ = function(task) {
  this.completedTasks_.push(task);

  this.taskCompletedOrRemoved_(task);
};


/**
 * Callback for child task errors.
 *
 * @param {!tr.Task} task Task that has just errored.
 * @private
 */
tr.Composite.prototype.childTaskErrored_ = function(task) {
  this.erroredTasks_.push(task);

  // Don't halt execution in parallel mode.
  // Allow tasks to finish running before bubbling the error.
  if (this.parallel_) {
    this.checkForTaskCompletion_();
  } else {
    this.errorInternal(task.getData(), task.getErrorMessage());
  }
};
