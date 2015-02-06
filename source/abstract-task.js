goog.provide('taskrunner.AbstractTask');

goog.require('taskrunner.Task');
goog.require('taskrunner.TaskEvent');
goog.require('taskrunner.TaskState');



/**
 * Abstract implementation of Task.
 *
 * <p>To create a Task extend this class and override runImpl(), interruptImpl(), and resetImpl().
 *
 * <p>Your Task should call completeInternal() or errorInternal() when it is done.
 *
 * @example
 * taskrunner.CustomTask = function() {
 *   goog.base(this);
 * };
 * goog.inherits(taskrunner.CustomTask, taskrunner.AbstractTask);
 * 
 * taskrunner.CustomTask.prototype.resetImpl = function() {
 *   // Reset state
 * };
 * 
 * taskrunner.CustomTask.prototype.interruptImpl = function() {
 *   // Interrupt any moving parts
 * };
 * 
 * taskrunner.CustomTask.prototype.runImpl = function() {
 *   // Start the task
 * };
 *
 * @param {string=} opt_taskName Optional defaulttask name,
 *     useful for automated testing or debugging.
 * @implements {taskrunner.Task}
 * @constructor
 * @struct
 */
taskrunner.AbstractTask = function(opt_taskName) {
  /** @private {string|undefined} */
  this.taskName_ = opt_taskName;

  /** @private {number} */
  this.uniqueID_ = taskrunner.AbstractTask.ID_++;

  /** @private {!taskrunner.TaskState} */
  this.state_ = taskrunner.TaskState.INITIALIZED;

  /** @private {!Object|undefined} */
  this.data_ = undefined;

  /** @private {string|undefined} */
  this.errorMessage_ = undefined;

  /** @private {taskrunner.Task} */
  this.interruptingTask_ = null;

  /**
   * A map from task events to its corresponding callbacks.
   * @private {!Object.<
   *             !taskrunner.TaskEvent,
   *             !Array.<!taskrunner.AbstractTask.TaskCallback_>>}
   */
  this.taskCallbackMap_ = {};
};


/**
 * Auto-incremeted unique ID managed by AbstractTask.
 *
 * @private
 */
taskrunner.AbstractTask.ID_ = 0;


/** @override */
taskrunner.AbstractTask.prototype.getData = function() {
  return this.data_;
};


/** @override */
taskrunner.AbstractTask.prototype.getErrorMessage = function() {
  return this.errorMessage_;
};


/** @override */
taskrunner.AbstractTask.prototype.getOperationsCount = function() {
  return 1;
};


/** @override */
taskrunner.AbstractTask.prototype.getCompletedOperationsCount = function() {
  return this.state_ == taskrunner.TaskState.COMPLETED ? 1 : 0;
};


/** @override */
taskrunner.AbstractTask.prototype.getState = function() {
  return this.state_;
};


/** @override */
taskrunner.AbstractTask.prototype.getTaskName = function() {
  return this.taskName_;
};


/** @override */
taskrunner.AbstractTask.prototype.getUniqueID = function() {
  return this.uniqueID_;
};


/**
 * Executes an array of callback functions with the current task as the only
 * paramater.
 *
 * @param {!taskrunner.TaskEvent} taskEvent
 * @private
 */
taskrunner.AbstractTask.prototype.executeCallbacks_ = function(taskEvent) {
  var taskCallbacks = this.taskCallbackMap_[taskEvent];
  if (taskCallbacks) {
    for (var i in taskCallbacks) {
      taskCallbacks[i].execute(this);
    }
  }
};


/** @override */
taskrunner.AbstractTask.prototype.run = function() {
  if (this.state_ == taskrunner.TaskState.RUNNING) {
    throw 'Cannot run a running task.';
  }

  if (this.state_ != taskrunner.TaskState.COMPLETED) {
    this.interruptingTask_ = null;
    this.data_ = undefined;
    this.errorMessage_ = undefined;
    this.state_ = taskrunner.TaskState.RUNNING;

    this.executeCallbacks_(taskrunner.TaskEvent.STARTED);

    this.runImpl();
  }

  return this;
};


/** @override */
taskrunner.AbstractTask.prototype.interrupt = function() {
  if (this.state_ != taskrunner.TaskState.RUNNING) {
    throw 'Cannot interrupt a task that is not running.';
  }

  this.state_ = taskrunner.TaskState.INTERRUPTED;

  this.interruptImpl();

  this.executeCallbacks_(taskrunner.TaskEvent.INTERRUPTED);

  return this;
};


/** @override */
taskrunner.AbstractTask.prototype.interruptForTask = function(task) {
  this.interruptingTask_ = task;

  this.interrupt();

  task.completed(function(t) {
    if (t == this.interruptingTask_) {
      this.interruptingTask_ = null;

      this.run();
    }
  }, this);
  task.errored(function(t) {
    if (t == this.interruptingTask_) {
      this.interruptingTask_ = null;

      // TRICKY Tasks cannot error unless they're running
      this.state_ = taskrunner.TaskState.RUNNING;

      this.errorInternal(t.getData(), t.getErrorMessage());
    }
  }, this);

  return this;
};


/** @override */
taskrunner.AbstractTask.prototype.reset = function() {
  if (this.state_ == taskrunner.TaskState.RUNNING) {
    throw 'Cannot reset a running task.';
  }

  if (this.state_ != taskrunner.TaskState.INITIALIZED) {
    this.data_ = undefined;
    this.errorMessage_ = undefined;
    this.state_ = taskrunner.TaskState.INITIALIZED;

    this.resetImpl();
  }

  return this;
};


/** @override */
taskrunner.AbstractTask.prototype.on = function(
    taskEvent, callback, opt_scope) {
  this.taskCallbackMap_[taskEvent] = this.taskCallbackMap_[taskEvent] || [];

  var taskCallbacks = this.taskCallbackMap_[taskEvent];
  var index = -1;
  for (var i in taskCallbacks) {
    var taskCallback = taskCallbacks[i];
    if (taskCallback.callback_ === callback &
        taskCallback.scope_ === opt_scope) {
      index = i;
      break;
    }
  }
  if (index == -1) {
    taskCallbacks.push(
        new taskrunner.AbstractTask.TaskCallback_(callback, opt_scope));
  }
  return this;
};


/** @override */
taskrunner.AbstractTask.prototype.off = function(
    taskEvent, callback, opt_scope) {
  var taskCallbacks = this.taskCallbackMap_[taskEvent];
  var index = -1;
  if (taskCallbacks) {
    for (var i in taskCallbacks) {
      var taskCallback = taskCallbacks[i];
      if (taskCallback.callback_ === callback &
          taskCallback.scope_ === opt_scope) {
        index = i;
        break;
      }
    }
  }
  if (index != -1) {
    taskCallbacks.splice(index, 1);
  }
  return this;
};


/** @override */
taskrunner.AbstractTask.prototype.started = function(callback, opt_scope) {
  return this.on(taskrunner.TaskEvent.STARTED, callback, opt_scope);
};


/** @override */
taskrunner.AbstractTask.prototype.interrupted = function(callback, opt_scope) {
  return this.on(taskrunner.TaskEvent.INTERRUPTED, callback, opt_scope);
};


/** @override */
taskrunner.AbstractTask.prototype.completed = function(callback, opt_scope) {
  return this.on(taskrunner.TaskEvent.COMPLETED, callback, opt_scope);
};


/** @override */
taskrunner.AbstractTask.prototype.errored = function(callback, opt_scope) {
  return this.on(taskrunner.TaskEvent.ERRORED, callback, opt_scope);
};


/** @override */
taskrunner.AbstractTask.prototype.final = function(callback, opt_scope) {
  return this.on(taskrunner.TaskEvent.FINAL, callback, opt_scope);
};


/**
 * This method is called each time a task is run.
 * Call completeInternal() or errorInternal() when the task is finished.
 */
taskrunner.AbstractTask.prototype.runImpl = goog.abstractMethod;


/**
 * This method is called each time a task is interrupted.
 */
taskrunner.AbstractTask.prototype.interruptImpl = goog.nullFunction;


/**
 * This method is called each time a task is reset.
 * Override it to perform custom cleanup between task-runs.
 */
taskrunner.AbstractTask.prototype.resetImpl = goog.nullFunction;


/**
 * Call this method to mark the task as complete.
 *
 * @param {!Object=} data Task data.
 * @throws {Error} if called while a task is not running.
 * @protected
 */
taskrunner.AbstractTask.prototype.completeInternal = function(data) {
  if (this.state_ != taskrunner.TaskState.RUNNING) {
    throw 'Cannot complete an inactive task.';
  }

  this.data_ = data;
  this.state_ = taskrunner.TaskState.COMPLETED;

  this.executeCallbacks_(taskrunner.TaskEvent.COMPLETED);
  this.executeCallbacks_(taskrunner.TaskEvent.FINAL);
};


/**
 * Call this method to mark the task as errored.
 *
 * @param {!Object=} data Task data.
 * @param {string=} errorMessage Error message.
 * @throws {Error} if called while a task is not running.
 * @protected
 */
taskrunner.AbstractTask.prototype.errorInternal = function(data, errorMessage) {
  if (this.state_ != taskrunner.TaskState.RUNNING) {
    throw 'Cannot error an inactive task.';
  }

  this.data_ = data;
  this.errorMessage_ = errorMessage;
  this.state_ = taskrunner.TaskState.ERRORED;

  this.executeCallbacks_(taskrunner.TaskEvent.ERRORED);
  this.executeCallbacks_(taskrunner.TaskEvent.FINAL);
};


/**
 * A TaskCallback contains a reference to a callback function and the scope it
 * should be called with.
 *
 * @param {function(!taskrunner.Task)} callback
 * @param {?=} opt_scope
 * @constructor
 * @struct
 * @private
 */
taskrunner.AbstractTask.TaskCallback_ = function(callback, opt_scope) {
  /** @private {function(!taskrunner.Task)} */
  this.callback_ = callback;

  /** @private {?} */
  this.scope_ = opt_scope;
};


/**
 * Executes the callback function with the scope if it's available.
 * @param {!taskrunner.Task} task
 */
taskrunner.AbstractTask.TaskCallback_.prototype.execute = function(task) {
  if (this.scope_) {
    this.callback_.call(this.scope_, task);
  } else {
    this.callback_(task);
  }
};
