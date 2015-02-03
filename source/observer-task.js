goog.provide('taskrunner.ObserverTask');

goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.TaskEvent');
goog.require('taskrunner.TaskState');



/**
 * Observes (but does not execute) a collection of Tasks.
 * This task can be used to monitor the execution of 1 or more running Tasks.
 * Tasks can be added (or removed) while the observer is running.
 * It will complete only once all observed Tasks has completed.
 *
 * <p>If this Task is executed with no observed Tasks it will instantly complete.
 * The same is true if all of its observed Tasks have already completed by the time it has been executed.
 *
 * @example
 * // Observes the pair of tasks provided to it and completes or errors when they do.
 * var task = new taskrunner.ObserverTask([observedTask1, observedTask2]);
 * task.run();
 *
 * @param {!Array.<!taskrunner.Task>=} opt_tasks The array of Tasks to observe.
 * @param {boolean=} opt_failUponFirstError Whether to error the observer task immediately when one of the observed tasks errors.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.AbstractTask}
 * @constructor
 * @struct
 */
taskrunner.ObserverTask = function(opt_tasks, opt_failUponFirstError, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {boolean} */
  this.failUponFirstError_ = !!opt_failUponFirstError;

  /** @private {!Array.<!taskrunner.Task>} */
  this.observedTasks_ = [];
  if (opt_tasks) {
    for (var i in opt_tasks) {
      var task = opt_tasks[i];
      if (this.observedTasks_.indexOf(task) == -1) {
        this.observedTasks_.push(task);
      }
    }
  }
};
goog.inherits(taskrunner.ObserverTask, taskrunner.AbstractTask);


/**
 * Returns a list of observed tasks.
 * @return {!Array.<!taskrunner.Task>}
 */
taskrunner.ObserverTask.prototype.getObservedTasks = function() {
  return this.observedTasks_;
};


/**
 * Add an additional Task to observe.
 * @param {!taskrunner.Task} task
 */
taskrunner.ObserverTask.prototype.observeTask = function(task) {
  if (this.observedTasks_.indexOf(task) == -1) {
    this.observedTasks_.push(task);
  }
  if (this.getState() == taskrunner.TaskState.RUNNING) {
    task.completed(this.onObservedTaskCompleted_, this);
    task.errored(this.onObservedTaskErrored_, this);
  }
};


/**
 * Stops a Task from being observed.
 * @param {!taskrunner.Task} task
 */
taskrunner.ObserverTask.prototype.stopObservingTask = function(task) {
  var index = this.observedTasks_.indexOf(task);
  if (index == -1) {
    return;
  }
  task.off(taskrunner.TaskEvent.COMPLETED, this.onObservedTaskCompleted_, this);
  task.off(taskrunner.TaskEvent.ERRORED, this.onObservedTaskErrored_, this);
  this.observedTasks_.splice(index, 1);
  this.tryToFinalize_();
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.ObserverTask.prototype.getOperationsCount = function() {
  var count = 0;
  for (var i in this.observedTasks_) {
    var task = this.observedTasks_[i];
    count += task.getOperationsCount();
  }
  return count;
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.ObserverTask.prototype.getCompletedOperationsCount = function() {
  var count = 0;
  for (var i in this.observedTasks_) {
    var task = this.observedTasks_[i];
    count += task.getCompletedOperationsCount();
  }
  return count;
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.ObserverTask.prototype.runImpl = function() {
  if (!this.tryToFinalize_()) {
    for (var i in this.observedTasks_) {
      var task = this.observedTasks_[i];
      this.observeTask(task);
    }
  }
};


/**
 * Event handler for when the observed task is complete.
 * @param {!taskrunner.Task} task
 * @private
 */
taskrunner.ObserverTask.prototype.onObservedTaskCompleted_ = function(task) {
  this.tryToFinalize_();
};


/**
 * Event handler for when the observed task errored.
 * @param {!taskrunner.Task} task
 * @private
 */
taskrunner.ObserverTask.prototype.onObservedTaskErrored_ = function(task) {
  this.tryToFinalize_();
};


/**
 * Try to complete or error the observer task based on the states of the
 * observed tasks, if the observer task is running.
 * @return {boolean}
 * @private
 */
taskrunner.ObserverTask.prototype.tryToFinalize_ = function() {
  if (this.getState() != taskrunner.TaskState.RUNNING) {
    return false;
  }
  var allFinal = true;
  var firstError = null;
  for (var i in this.observedTasks_) {
    var task = this.observedTasks_[i];
    if (task.getState() == taskrunner.TaskState.ERRORED) {
      firstError = firstError || task;
    } else if (task.getState() != taskrunner.TaskState.COMPLETED) {
      allFinal = false;
    }
  }
  if (firstError && this.failUponFirstError_) {
    this.errorInternal(firstError.getData(), firstError.getErrorMessage());
    return true;
  } else if (firstError && allFinal) {
    this.errorInternal();
    return true;
  } else if (allFinal) {
    this.completeInternal();
    return true;
  }
  return false;
};
