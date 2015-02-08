goog.provide('tr.Abstract');

goog.require('tr.Task');
goog.require('tr.enums.Event');
goog.require('tr.enums.State');



/**
 * Abstract implementation of Task.
 *
 * <p>To create a Task extend this class and override runImpl(), interruptImpl(), and resetImpl().
 *
 * <p>Your Task should call completeInternal() or errorInternal() when it is done.
 *
 * @example
 * tr.CustomTask = function() {
 *   goog.base(this);
 * };
 * goog.inherits(tr.CustomTask, tr.Abstract);
 * 
 * tr.CustomTask.prototype.resetImpl = function() {
 *   // Reset state
 * };
 * 
 * tr.CustomTask.prototype.interruptImpl = function() {
 *   // Interrupt any moving parts
 * };
 * 
 * tr.CustomTask.prototype.runImpl = function() {
 *   // Start the task
 * };
 *
 * @param {string=} opt_taskName Optional defaulttask name,
 *     useful for automated testing or debugging.
 * @implements {tr.Task}
 * @constructor
 * @struct
 */
tr.Abstract = function(opt_taskName) {
  /** @private {string|undefined} */
  this.taskName_ = opt_taskName;

  /** @private {number} */
  this.uniqueID_ = tr.Abstract.ID_++;

  /** @private {!tr.enums.State} */
  this.state_ = tr.enums.State.INITIALIZED;

  /** @private {!Object|undefined} */
  this.data_ = undefined;

  /** @private {string|undefined} */
  this.errorMessage_ = undefined;

  /** @private {tr.Task} */
  this.interruptingTask_ = null;

  /**
   * A map from task events to its corresponding callbacks.
   * @private {!Object.<
   *             !tr.enums.Event,
   *             !Array.<!tr.Abstract.TaskCallback_>>}
   */
  this.taskCallbackMap_ = {};
};


/**
 * Auto-incremeted unique ID managed by AbstractTask.
 *
 * @private
 */
tr.Abstract.ID_ = 0;


/** @override */
tr.Abstract.prototype.getData = function() {
  return this.data_;
};


/** @override */
tr.Abstract.prototype.getErrorMessage = function() {
  return this.errorMessage_;
};


/** @override */
tr.Abstract.prototype.getOperationsCount = function() {
  return 1;
};


/** @override */
tr.Abstract.prototype.getCompletedOperationsCount = function() {
  return this.state_ == tr.enums.State.COMPLETED ? 1 : 0;
};


/** @override */
tr.Abstract.prototype.getState = function() {
  return this.state_;
};


/** @override */
tr.Abstract.prototype.getTaskName = function() {
  return this.taskName_;
};


/** @override */
tr.Abstract.prototype.getUniqueID = function() {
  return this.uniqueID_;
};


/**
 * Executes an array of callback functions with the current task as the only
 * paramater.
 *
 * @param {!tr.enums.Event} taskEvent
 * @private
 */
tr.Abstract.prototype.executeCallbacks_ = function(taskEvent) {
  var taskCallbacks = this.taskCallbackMap_[taskEvent];
  if (taskCallbacks) {
    for (var i in taskCallbacks) {
      taskCallbacks[i].execute(this);
    }
  }
};


/** @override */
tr.Abstract.prototype.run = function() {
  if (this.state_ == tr.enums.State.RUNNING) {
    throw 'Cannot run a running tr.';
  }

  if (this.state_ != tr.enums.State.COMPLETED) {
    this.interruptingTask_ = null;
    this.data_ = undefined;
    this.errorMessage_ = undefined;
    this.state_ = tr.enums.State.RUNNING;

    this.executeCallbacks_(tr.enums.Event.STARTED);

    this.runImpl();
  }

  return this;
};


/** @override */
tr.Abstract.prototype.interrupt = function() {
  if (this.state_ != tr.enums.State.RUNNING) {
    throw 'Cannot interrupt a task that is not running.';
  }

  this.state_ = tr.enums.State.INTERRUPTED;

  this.interruptImpl();

  this.executeCallbacks_(tr.enums.Event.INTERRUPTED);

  return this;
};


/** @override */
tr.Abstract.prototype.interruptForTask = function(task) {
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
      this.state_ = tr.enums.State.RUNNING;

      this.errorInternal(t.getData(), t.getErrorMessage());
    }
  }, this);

  return this;
};


/** @override */
tr.Abstract.prototype.reset = function() {
  if (this.state_ == tr.enums.State.RUNNING) {
    throw 'Cannot reset a running tr.';
  }

  if (this.state_ != tr.enums.State.INITIALIZED) {
    this.data_ = undefined;
    this.errorMessage_ = undefined;
    this.state_ = tr.enums.State.INITIALIZED;

    this.resetImpl();
  }

  return this;
};


/** @override */
tr.Abstract.prototype.on = function(
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
        new tr.Abstract.TaskCallback_(callback, opt_scope));
  }
  return this;
};


/** @override */
tr.Abstract.prototype.off = function(
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
tr.Abstract.prototype.started = function(callback, opt_scope) {
  return this.on(tr.enums.Event.STARTED, callback, opt_scope);
};


/** @override */
tr.Abstract.prototype.interrupted = function(callback, opt_scope) {
  return this.on(tr.enums.Event.INTERRUPTED, callback, opt_scope);
};


/** @override */
tr.Abstract.prototype.completed = function(callback, opt_scope) {
  return this.on(tr.enums.Event.COMPLETED, callback, opt_scope);
};


/** @override */
tr.Abstract.prototype.errored = function(callback, opt_scope) {
  return this.on(tr.enums.Event.ERRORED, callback, opt_scope);
};


/** @override */
tr.Abstract.prototype.final = function(callback, opt_scope) {
  return this.on(tr.enums.Event.FINAL, callback, opt_scope);
};


/**
 * This method is called each time a task is run.
 * Call completeInternal() or errorInternal() when the task is finished.
 */
tr.Abstract.prototype.runImpl = goog.abstractMethod;


/**
 * This method is called each time a task is interrupted.
 */
tr.Abstract.prototype.interruptImpl = goog.nullFunction;


/**
 * This method is called each time a task is reset.
 * Override it to perform custom cleanup between task-runs.
 */
tr.Abstract.prototype.resetImpl = goog.nullFunction;


/**
 * Call this method to mark the task as complete.
 *
 * @param {!Object=} data Task data.
 * @throws {Error} if called while a task is not running.
 * @protected
 */
tr.Abstract.prototype.completeInternal = function(data) {
  if (this.state_ != tr.enums.State.RUNNING) {
    throw 'Cannot complete an inactive tr.';
  }

  this.data_ = data;
  this.state_ = tr.enums.State.COMPLETED;

  this.executeCallbacks_(tr.enums.Event.COMPLETED);
  this.executeCallbacks_(tr.enums.Event.FINAL);
};


/**
 * Call this method to mark the task as errored.
 *
 * @param {!Object=} data Task data.
 * @param {string=} errorMessage Error message.
 * @throws {Error} if called while a task is not running.
 * @protected
 */
tr.Abstract.prototype.errorInternal = function(data, errorMessage) {
  if (this.state_ != tr.enums.State.RUNNING) {
    throw 'Cannot error an inactive tr.';
  }

  this.data_ = data;
  this.errorMessage_ = errorMessage;
  this.state_ = tr.enums.State.ERRORED;

  this.executeCallbacks_(tr.enums.Event.ERRORED);
  this.executeCallbacks_(tr.enums.Event.FINAL);
};


/**
 * A TaskCallback contains a reference to a callback function and the scope it
 * should be called with.
 *
 * @param {function(!tr.Task)} callback
 * @param {Object=} opt_scope
 * @constructor
 * @struct
 * @private
 */
tr.Abstract.TaskCallback_ = function(callback, opt_scope) {
  /** @private {function(!tr.Task)} */
  this.callback_ = callback;

  /** @private {?} */
  this.scope_ = opt_scope;
};


/**
 * Executes the callback function with the scope if it's available.
 * @param {!tr.Task} task
 */
tr.Abstract.TaskCallback_.prototype.execute = function(task) {
  if (this.scope_) {
    this.callback_.call(this.scope_, task);
  } else {
    this.callback_(task);
  }
};
