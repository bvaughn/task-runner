goog.provide('tr.Observer');

goog.require('tr.Abstract');
goog.require('tr.enums.Event');
goog.require('tr.enums.State');



/**
 * Observes (but does not execute) a collection of Tasks.
 * 
 * <p>This task can be used to monitor the execution of 1 or more running Tasks.
 * These tasks do not have to be related in any way.
 * Tasks can be added (or removed) while the observer is running.
 * It will complete only once all observed Tasks has completed.
 *
 * <p>If this Task is executed with no observed Tasks it will instantly complete.
 * The same is true if all of its observed Tasks have already completed by the time it has been executed.
 *
 * @example
 * // Observes the pair of tasks provided to it and completes or errors when they do.
 * var task = new tr.Observer([observedTask1, observedTask2]);
 * task.run();
 *
 * @param {!Array.<!tr.Task>=} opt_tasks The array of Tasks to observe.
 * @param {boolean=} opt_failUponFirstError Whether to error the observer task immediately when one of the observed tasks errors.
 * @param {string=} opt_taskName Optional defaulttask name.
 * @extends {tr.Abstract}
 * @constructor
 * @struct
 */
tr.Observer = function(opt_tasks, opt_failUponFirstError, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {boolean} */
  this.failUponFirstError_ = !!opt_failUponFirstError;

  /** @private {!Array.<!tr.Task>} */
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
goog.inherits(tr.Observer, tr.Abstract);


/**
 * Returns a list of observed tasks.
 * @return {!Array.<!tr.Task>}
 */
tr.Observer.prototype.getObservedTasks = function() {
  return this.observedTasks_;
};


/**
 * Add an additional Task to observe.
 * @param {!tr.Task} task
 */
tr.Observer.prototype.observeTask = function(task) {
  if (this.observedTasks_.indexOf(task) == -1) {
    this.observedTasks_.push(task);
  }
  if (this.getState() == tr.enums.State.RUNNING) {
    task.completed(this.onObservedTaskCompleted_, this);
    task.errored(this.onObservedTaskErrored_, this);
  }
};


/**
 * Stops a Task from being observed.
 * @param {!tr.Task} task
 */
tr.Observer.prototype.stopObservingTask = function(task) {
  var index = this.observedTasks_.indexOf(task);
  if (index == -1) {
    return;
  }
  task.off(tr.enums.Event.COMPLETED, this.onObservedTaskCompleted_, this);
  task.off(tr.enums.Event.ERRORED, this.onObservedTaskErrored_, this);
  this.observedTasks_.splice(index, 1);
  this.tryToFinalize_();
};


/**
 * @override
 * @inheritDoc
 */
tr.Observer.prototype.getOperationsCount = function() {
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
tr.Observer.prototype.getCompletedOperationsCount = function() {
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
tr.Observer.prototype.runImpl = function() {
  if (!this.tryToFinalize_()) {
    for (var i in this.observedTasks_) {
      var task = this.observedTasks_[i];
      this.observeTask(task);
    }
  }
};


/**
 * Event handler for when the observed task is complete.
 * @param {!tr.Task} task
 * @private
 */
tr.Observer.prototype.onObservedTaskCompleted_ = function(task) {
  this.tryToFinalize_();
};


/**
 * Event handler for when the observed task errored.
 * @param {!tr.Task} task
 * @private
 */
tr.Observer.prototype.onObservedTaskErrored_ = function(task) {
  this.tryToFinalize_();
};


/**
 * Try to complete or error the observer task based on the states of the
 * observed tasks, if the observer task is running.
 * @return {boolean}
 * @private
 */
tr.Observer.prototype.tryToFinalize_ = function() {
  if (this.getState() != tr.enums.State.RUNNING) {
    return false;
  }
  var allFinal = true;
  var firstError = null;
  for (var i in this.observedTasks_) {
    var task = this.observedTasks_[i];
    if (task.getState() == tr.enums.State.ERRORED) {
      firstError = firstError || task;
    } else if (task.getState() != tr.enums.State.COMPLETED) {
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
