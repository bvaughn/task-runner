(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.tr = factory();
  }
}(this, function() {
var tr;
(function (tr) {
    /**
     * Abstract implementation of Task.
     *
     * <p>To create a Task extend this class and override runImpl(), interruptImpl(), and resetImpl().
     *
     * <p>Your Task should call completeInternal() or errorInternal() when it is done.
     */
    var Abstract = (function () {
        /**
         * Constructor.
         *
         * @param name Optional task name, useful for automated testing or debugging.
         *             Sub-classes should specify a default equal to the name of the class.
         */
        function Abstract(name) {
            this.name_ = name;
            this.state_ = tr.enums.State.INITIALIZED;
            this.taskCallbackMap_ = {};
            this.uniqueID_ = Abstract.UNIQUE_ID_COUNTER++;
            // Store extra context when in debug mode.
            if (window["DEBUG"]) {
                var error = new Error("Constructor");
                if (error.hasOwnProperty("stack")) {
                    var stack = error["stack"];
                    this.creationContext_ = stack.replace(/^\s+at\s+/gm, '').replace(/\s$/gm, '').split("\n").slice(2);
                }
                this.logger_ = console.log;
            }
            else {
                this.logger_ = function (text) {
                };
            }
        }
        /**
         * Debug logger for tasks.
         *
         * <p>Messages are logged with task information (id and name) for debugging purposes.
         * These log messages are disabled in production builds.
         *
         * @param text String to log to the console (if in debug mode)
         */
        Abstract.prototype.log = function (text) {
            this.logger_.call(console, text + " :: " + this);
        };
        // Accessor methods ////////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        Abstract.prototype.toString = function () {
            return this.name_ + ' [id: ' + this.uniqueID_ + ']';
        };
        /** @inheritDoc */
        Abstract.prototype.getCompletedOperationsCount = function () {
            return this.state_ === tr.enums.State.COMPLETED ? 1 : 0;
        };
        /** @inheritDoc */
        Abstract.prototype.getCreationContext = function () {
            return this.creationContext_;
        };
        /** @inheritDoc */
        Abstract.prototype.getData = function () {
            return this.data_;
        };
        /** @inheritDoc */
        Abstract.prototype.getErrorMessage = function () {
            return this.errorMessage_;
        };
        /** @inheritDoc */
        Abstract.prototype.getName = function () {
            return this.name_;
        };
        /** @inheritDoc */
        Abstract.prototype.getOperationsCount = function () {
            return 1;
        };
        /** @inheritDoc */
        Abstract.prototype.getState = function () {
            return this.state_;
        };
        /** @inheritDoc */
        Abstract.prototype.getUniqueID = function () {
            return this.uniqueID_;
        };
        // Interface methods ///////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        Abstract.prototype.completed = function (callback, scope) {
            return this.on(tr.enums.Event.COMPLETED, callback, scope);
        };
        /** @inheritDoc */
        Abstract.prototype.errored = function (callback, scope) {
            return this.on(tr.enums.Event.ERRORED, callback, scope);
        };
        /** @inheritDoc */
        Abstract.prototype.final = function (callback, scope) {
            return this.on(tr.enums.Event.FINAL, callback, scope);
        };
        /** @inheritDoc */
        Abstract.prototype.interrupt = function () {
            if (this.state_ != tr.enums.State.RUNNING) {
                throw Error("Cannot interrupt a task that is not running.");
            }
            this.log('Interrupting');
            this.state_ = tr.enums.State.INTERRUPTED;
            this.interruptImpl();
            this.executeCallbacks(tr.enums.Event.INTERRUPTED);
            return this;
        };
        /** @inheritDoc */
        Abstract.prototype.interrupted = function (callback, scope) {
            return this.on(tr.enums.Event.INTERRUPTED, callback, scope);
        };
        /** @inheritDoc */
        Abstract.prototype.interruptFor = function (interruptingTask) {
            this.log('Interrupting for ' + interruptingTask);
            this.interruptingTask_ = interruptingTask;
            this.interrupt();
            var that = this;
            interruptingTask.completed(function (task) {
                if (task == that.interruptingTask_) {
                    that.interruptingTask_ = null;
                    that.run();
                }
            }, this);
            interruptingTask.errored(function (task) {
                if (task == that.interruptingTask_) {
                    that.interruptingTask_ = null;
                    // TRICKY Tasks cannot error unless they're running
                    that.state_ = tr.enums.State.RUNNING;
                    that.errorInternal(task.getData(), task.getErrorMessage());
                }
            }, this);
            return this;
        };
        /** @inheritDoc */
        Abstract.prototype.off = function (event, callback, scope) {
            this.taskCallbackMap_[event] = this.taskCallbackMap_[event] || [];
            var taskCallbacks = this.taskCallbackMap_[event];
            for (var i = 0, length = taskCallbacks.length; i < length; i++) {
                var taskCallback = taskCallbacks[i];
                if (taskCallback.matches(callback, scope)) {
                    taskCallbacks.splice(i, 1);
                    return this;
                }
            }
            return this;
        };
        /** @inheritDoc */
        Abstract.prototype.on = function (event, callback, scope) {
            this.taskCallbackMap_[event] = this.taskCallbackMap_[event] || [];
            var taskCallbacks = this.taskCallbackMap_[event];
            for (var i = 0, length = taskCallbacks.length; i < length; i++) {
                var taskCallback = taskCallbacks[i];
                if (taskCallback.matches(callback, scope)) {
                    return this;
                }
            }
            taskCallbacks.push(new TaskCallback(callback, scope));
            return this;
        };
        /** @inheritDoc */
        Abstract.prototype.reset = function () {
            if (this.state_ == tr.enums.State.RUNNING) {
                throw Error("Cannot reset a running task.");
            }
            this.log('Resetting');
            if (this.state_ != tr.enums.State.INITIALIZED) {
                this.data_ = undefined;
                this.errorMessage_ = undefined;
                this.state_ = tr.enums.State.INITIALIZED;
                this.resetImpl();
            }
            return this;
        };
        /** @inheritDoc */
        Abstract.prototype.run = function () {
            if (this.state_ == tr.enums.State.RUNNING) {
                throw Error("Cannot run a running task.");
            }
            this.log('Running');
            if (this.state_ != tr.enums.State.COMPLETED) {
                this.interruptingTask_ = null;
                this.data_ = undefined;
                this.errorMessage_ = undefined;
                this.state_ = tr.enums.State.RUNNING;
                this.executeCallbacks(tr.enums.Event.STARTED);
                this.runImpl();
            }
            return this;
        };
        /** @inheritDoc */
        Abstract.prototype.started = function (callback, scope) {
            return this.on(tr.enums.Event.STARTED, callback, scope);
        };
        // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Call this method to mark the task as complete.
         */
        Abstract.prototype.completeInternal = function (data) {
            if (this.state_ !== tr.enums.State.RUNNING) {
                throw 'Cannot complete an inactive task.';
            }
            this.log('Internal complete');
            this.data_ = data;
            this.state_ = tr.enums.State.COMPLETED;
            this.executeCallbacks(tr.enums.Event.COMPLETED);
            this.executeCallbacks(tr.enums.Event.FINAL);
        };
        /**
         * Call this method to mark the task as errored.
         */
        Abstract.prototype.errorInternal = function (data, errorMessage) {
            if (this.state_ != tr.enums.State.RUNNING) {
                throw 'Cannot error an inactive task.';
            }
            this.log('Internal error');
            this.data_ = data;
            this.errorMessage_ = errorMessage;
            this.state_ = tr.enums.State.ERRORED;
            this.executeCallbacks(tr.enums.Event.ERRORED);
            this.executeCallbacks(tr.enums.Event.FINAL);
        };
        /**
         * Executes an array of callback functions with the current task as the only parameter.
         */
        Abstract.prototype.executeCallbacks = function (event) {
            var taskCallbacks = this.taskCallbackMap_[event];
            if (taskCallbacks) {
                for (var i = 0, length = taskCallbacks.length; i < length; i++) {
                    taskCallbacks[i].execute(this);
                }
            }
        };
        // Hook methods (to override) //////////////////////////////////////////////////////////////////////////////////////
        /**
         * This method is called each time a task is interrupted.
         */
        Abstract.prototype.interruptImpl = function () {
        };
        /**
         * This method is called each time a task is reset.
         * Override it to perform custom cleanup between task-runs.
         */
        Abstract.prototype.resetImpl = function () {
        };
        /**
         * This method is called each time a task is run.
         * Call completeInternal() or errorInternal() when the task is finished.
         */
        Abstract.prototype.runImpl = function () {
            throw Error("Required methods runImpl() not implemented.");
        };
        // Auto-incremented unique ID managed by AbstractTask.
        Abstract.UNIQUE_ID_COUNTER = 0;
        return Abstract;
    })();
    tr.Abstract = Abstract;
    /**
     * A TaskCallback contains a reference to a callback function and the scope it should be called with.
     * @private
     */
    var TaskCallback = (function () {
        function TaskCallback(callback, scope) {
            this.callback_ = callback;
            this.scope_ = scope;
        }
        /**
         * Executes the callback function with the scope if it's available.
         */
        TaskCallback.prototype.execute = function (task) {
            if (this.scope_) {
                this.callback_.call(this.scope_, task);
            }
            else {
                this.callback_(task);
            }
        };
        /**
         * This object contains the specified callback and scope.
         */
        TaskCallback.prototype.matches = function (callback, scope) {
            return this.callback_ === callback && this.scope_ === scope;
        };
        return TaskCallback;
    })();
})(tr || (tr = {}));
;
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var tr;
(function (tr) {
    /**
     * Lightweight interface to create a dependency graph task.
     */
    var Chain = (function (_super) {
        __extends(Chain, _super);
        /**
         * Constructor.
         *
         * @param completedCallback Optional on-complete callback method.
         * @param erroredCallback Optional on-error callback method.
         * @param name Optional task name.
         */
        function Chain(completedCallback, erroredCallback, name) {
            _super.call(this, name || "Chain");
            this.mostRecentTaskArgs_ = [];
            this.graph_ = new tr.Graph();
            this.graph_.completed(this.completeInternal.bind(this));
            this.graph_.errored(this.errorInternal.bind(this));
            if (completedCallback !== undefined) {
                this.completed(completedCallback);
            }
            if (erroredCallback !== undefined) {
                this.errored(erroredCallback);
            }
        }
        // Public interface ////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Alias for "or".
         *
         * @param ...tasks One or more tasks
         * @return A reference to the current task.
         */
        Chain.prototype.else = function () {
            var tasks = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                tasks[_i - 0] = arguments[_i];
            }
            return this.or.apply(this, tasks);
        };
        /**
         * Add one or more tasks to the beginning of the chain.
         *
         * @param ...tasks One or more tasks
         * @return A reference to the current task.
         * @throws Error if this method is called once tasks have already been added to the chain.
         */
        Chain.prototype.first = function () {
            var tasks = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                tasks[_i - 0] = arguments[_i];
            }
            if (this.graph_.getOperationsCount() > 0) {
                throw Error("Cannot call first after tasks have been added");
            }
            this.then.apply(this, tasks);
            return this;
        };
        /**
         * Returns the inner decorated Graph task.
         */
        Chain.prototype.getDecoratedTask = function () {
            return this.graph_;
        };
        /**
         * Add one or more tasks to be run only if one of the previously-added tasks fail.
         *
         * @param ...tasks One or more tasks
         * @return A reference to the current task.
         */
        Chain.prototype.or = function () {
            var tasks = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                tasks[_i - 0] = arguments[_i];
            }
            // Remove the most recent batch of tasks (added with the previous call to or() or then()) from the Graph.
            this.graph_.removeAll(this.mostRecentTaskArgs_);
            // Use StopOnSuccess to ensure the correct continue-only-on-failure behavior.
            var stopOnSuccess = new tr.StopOnSuccess();
            // Wrap them in a parallel group (to preserve then() behavior).
            stopOnSuccess.add(new tr.Composite(true, this.mostRecentTaskArgs_));
            // Wrap the new batch of tasks in a parallel group as well.
            if (tasks.length > 1) {
                stopOnSuccess.add(new tr.Composite(true, tasks));
            }
            else {
                stopOnSuccess.add(tasks[0]);
            }
            // Re-add the new composite to the end of the Graph.
            this.graph_.addToEnd(stopOnSuccess);
            // Update our most-recent pointer to the newly-added composite in case an or() call follows.
            this.mostRecentTaskArgs_ = [stopOnSuccess];
            return this;
        };
        /**
         * Alias for "or".
         *
         * @param ...tasks One or more tasks
         * @return A reference to the current task.
         */
        Chain.prototype.otherwise = function () {
            var tasks = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                tasks[_i - 0] = arguments[_i];
            }
            return this.or.apply(this, tasks);
        };
        /**
         * Add one or more tasks to be run after the tasks already in this chain have been run.
         *
         * @param ...tasks One or more tasks
         * @return A reference to the current task.
         */
        Chain.prototype.then = function () {
            var tasks = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                tasks[_i - 0] = arguments[_i];
            }
            this.mostRecentTaskArgs_ = tasks;
            this.graph_.addAllToEnd(tasks);
            return this;
        };
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        Chain.prototype.getOperationsCount = function () {
            return this.graph_.getOperationsCount();
        };
        /** @inheritDoc */
        Chain.prototype.getCompletedOperationsCount = function () {
            return this.graph_.getCompletedOperationsCount();
        };
        /** @inheritDoc */
        Chain.prototype.runImpl = function () {
            this.graph_.run();
        };
        /** @inheritDoc */
        Chain.prototype.interruptImpl = function () {
            this.graph_.interrupt();
        };
        /** @inheritDoc */
        Chain.prototype.resetImpl = function () {
            this.graph_.reset();
        };
        return Chain;
    })(tr.Abstract);
    tr.Chain = Chain;
})(tr || (tr = {}));
var tr;
(function (tr) {
    /**
     * Invokes a callback function when run.
     *
     * <p>This type of Task can be asynchronous or asynchronous.
     * <ul>
     *  <li>
     *    Set <code>opt_synchronous</code> to TRUE for synchronous tasks.
     *    This type of task will automatically complete itself after the callback function is called.
     *    If an error occurs in the callback function, this type of task will error.
     *  <li>
     *    Set <code>opt_synchronous</code> to FALSE for asynchronous tasks.
     *    In this case the task not complete until specifically instructed to do so.
     *    To complete the task, your callback should call either complete() or error().
     * </ul>
     */
    var Closure = (function (_super) {
        __extends(Closure, _super);
        /**
         * Constructor.
         *
         * @param runImplFn The function to be executed when this Task is run.
         *                  ClosureTask will pass a reference to itself to the function.
         * @param synchronous This task should auto-complete when run.
         * @param name Optional task name.
         */
        function Closure(runImplFn, synchronous, name) {
            _super.call(this, name || "Closure");
            this.runImplFn_ = runImplFn;
            this.autoCompleteUponRun_ = !!synchronous;
        }
        /** @override */
        Closure.prototype.runImpl = function () {
            try {
                this.runImplFn_(this);
                // Don't auto-complete if the callback has already interrupted or completed this task.
                if (this.autoCompleteUponRun_ && this.getState() === tr.enums.State.RUNNING) {
                    this.completeInternal();
                }
            }
            catch (error) {
                // Edge case that could be triggered if a Closure task invokes another synchronous task that errors.
                if (this.getState() === tr.enums.State.RUNNING) {
                    this.errorInternal(error, error.message);
                }
            }
        };
        /**
         * Complete this task.
         *
         * @param data Task data to be later accessible via getData().
         */
        Closure.prototype.complete = function (data) {
            this.completeInternal(data);
        };
        /**
         * Error this task.
         *
         * @param data Error data to be later accessible via getData().
         * @param errorMessage Error message to be later accessible via getErrorMessage()
         */
        Closure.prototype.error = function (data, errorMessage) {
            this.errorInternal(data, errorMessage);
        };
        return Closure;
    })(tr.Abstract);
    tr.Closure = Closure;
})(tr || (tr = {}));
var tr;
(function (tr) {
    /**
     * Executes a set of Tasks either in parallel or one after another.
     */
    var Composite = (function (_super) {
        __extends(Composite, _super);
        /**
         * Constructor.
         *
         * @param parallel If TRUE, child tasks are run simultaneously;
         *                 otherwise they are run serially, in the order they were added.
         * @param tasks Initial set of child tasks.
         * @param name Optional task name.
         */
        function Composite(parallel, tasks, name) {
            _super.call(this, name || "Composite");
            this.completedTasks_ = [];
            this.erroredTasks_ = [];
            this.taskQueue_ = [];
            this.taskQueueIndex_ = 0;
            this.parallel_ = parallel;
            if (tasks) {
                this.addAll(tasks);
            }
        }
        // Public interface ////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Adds a task to the list of child tasks.
         *
         * @param {!tr.Task} task Child task to be run when this task is run.
         * @return {!tr.Composite} a reference to the current task.
         * @throws {Error} if task has been added more than once
         */
        Composite.prototype.add = function (task) {
            var index = this.taskQueue_.indexOf(task);
            if (index >= 0) {
                throw Error("Cannot add task more than once.");
            }
            this.taskQueue_.push(task);
            if (this.getState() == tr.enums.State.RUNNING) {
                index = this.taskQueue_.indexOf(task);
                // TRICKY If the queue was just flushed, auto-run this task.
                if (this.parallel_ || this.taskQueueIndex_ == index) {
                    this.addCallbacks_(task);
                    task.run();
                }
            }
            return this;
        };
        /**
         * Adds a set of tasks to the list of child tasks.
         *
         * @param tasks Child tasks to be added
         * @return A reference to the current task.
         * @throws Error if tasks have been added more than once
         */
        Composite.prototype.addAll = function (tasks) {
            for (var i = 0; i < tasks.length; i++) {
                this.add(tasks[i]);
            }
            return this;
        };
        /**
         * Removes a task from the list of child tasks.
         *
         * @param {!tr.Task} task Child task to be removed from the graph.
         * @return {!tr.Composite} a reference to the current task.
         * @throws {Error} if the task provided is not a child of this composite.
         */
        Composite.prototype.remove = function (task) {
            var index = this.taskQueue_.indexOf(task);
            if (index < 0) {
                throw Error("Attempted to remove an invalid task.");
            }
            this.removeCallbacks_(task);
            this.taskQueue_.splice(this.taskQueue_.indexOf(task), 1);
            if (this.getState() == tr.enums.State.RUNNING) {
                if (this.parallel_ || index <= this.taskQueueIndex_) {
                    this.taskQueueIndex_--;
                }
                if (task.getState() == tr.enums.State.RUNNING || task.getState() == tr.enums.State.INTERRUPTED) {
                    this.taskCompletedOrRemoved_(task);
                }
            }
            return this;
        };
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        Composite.prototype.getCompletedOperationsCount = function () {
            var completedOperationsCount = 0;
            this.eachTaskInQueue_(function (task) {
                completedOperationsCount += task.getCompletedOperationsCount();
            });
            return completedOperationsCount;
        };
        /** @inheritDoc */
        Composite.prototype.getOperationsCount = function () {
            var operationsCount = 0;
            this.eachTaskInQueue_(function (task) {
                operationsCount += task.getOperationsCount();
            });
            return operationsCount;
        };
        /** @inheritDoc */
        Composite.prototype.interruptImpl = function () {
            this.eachTaskInQueue_(function (task) {
                if (task.getState() == tr.enums.State.RUNNING) {
                    task.interrupt();
                }
            });
        };
        /** @inheritDoc */
        Composite.prototype.resetImpl = function () {
            this.taskQueueIndex_ = 0;
            this.completedTasks_ = [];
            this.erroredTasks_ = [];
            this.eachTaskInQueue_(function (task) {
                task.reset();
            });
        };
        /** @inheritDoc */
        Composite.prototype.runImpl = function () {
            if (this.allTasksAreCompleted_()) {
                this.completeInternal();
            }
            else {
                this.erroredTasks_ = [];
                if (this.parallel_) {
                    this.eachTaskInQueue_(function (task) {
                        // TRICKY: Check to ensure we're still running.
                        // It's possible that a child task takes an action that interrupts the graph.
                        if (this.getState() !== tr.enums.State.RUNNING) {
                            return;
                        }
                        this.addCallbacks_(task);
                        task.run();
                    }.bind(this));
                }
                else {
                    var task = this.taskQueue_[this.taskQueueIndex_];
                    this.addCallbacks_(task);
                    task.run();
                }
            }
        };
        // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Adds completed and errored callback handlers to child Task.
         *
         * @param task Child task
         */
        Composite.prototype.addCallbacks_ = function (task) {
            task.completed(this.childTaskCompleted_, this);
            task.errored(this.childTaskErrored_, this);
        };
        /**
         * Are all child tasks completed?
         */
        Composite.prototype.allTasksAreCompleted_ = function () {
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
         */
        Composite.prototype.checkForTaskCompletion_ = function () {
            // This lock will only be set to true if the flushQueue() is in-progress.
            // In this case we should ignore child task callbacks.
            if (this.flushQueueInProgress_) {
                return;
            }
            var finishedCount = this.completedTasks_.length + this.erroredTasks_.length;
            // When running in parallel, wait for all child tasks to complete (or fail)
            // before triggering our callbacks. Also be sure to count the failed tasks
            // when determining if the queue is empty.
            if (finishedCount >= this.taskQueue_.length) {
                if (this.erroredTasks_.length > 0) {
                    this.errorInternal();
                }
                else {
                    this.completeInternal();
                }
            }
        };
        /**
         * Callback for child task completions.
         *
         * @param task Task that has just completed.
         */
        Composite.prototype.childTaskCompleted_ = function (task) {
            this.completedTasks_.push(task);
            this.taskCompletedOrRemoved_(task);
        };
        /**
         * Callback for child task errors.
         *
         * @param task Task that has just errored.
         */
        Composite.prototype.childTaskErrored_ = function (task) {
            this.erroredTasks_.push(task);
            // Don't halt execution in parallel mode.
            // Allow tasks to finish running before bubbling the error.
            if (this.parallel_) {
                this.checkForTaskCompletion_();
            }
            else {
                this.errorInternal(task.getData(), task.getErrorMessage());
            }
        };
        /**
         * Invoke a callback once for each Task in the queue.
         *
         * @param callback Callback function
         */
        Composite.prototype.eachTaskInQueue_ = function (callback) {
            for (var i = 0; i < this.taskQueue_.length; i++) {
                var task = this.taskQueue_[i];
                callback(task);
            }
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
         * @param doNotComplete Task should not complete itself nor invoke completion callbacks once the queue is empty.
         */
        Composite.prototype.flushQueue = function (doNotComplete) {
            // Prevent completion callbacks from being invoked once the queue is empty.
            // See checkForTaskCompletion_() for more information.
            this.flushQueueInProgress_ = !!doNotComplete;
            // Manually interrupt any Task that are running.
            this.eachTaskInQueue_(function (task) {
                if (task.getState() == tr.enums.State.RUNNING) {
                    task.interrupt();
                }
            });
            while (this.taskQueue_.length > 0) {
                var task = this.taskQueue_[this.taskQueue_.length - 1];
                this.remove(task);
            }
            this.completedTasks_ = [];
            this.erroredTasks_ = [];
            this.flushQueueInProgress_ = false;
        };
        /**
         * Removes completed and errored callback handlers from child Task.
         *
         * @param task Child task
         */
        Composite.prototype.removeCallbacks_ = function (task) {
            task.off(tr.enums.Event.COMPLETED, this.childTaskCompleted_, this);
            task.off(tr.enums.Event.ERRORED, this.childTaskErrored_, this);
        };
        /**
         * Convenience method for handling a completed Task and executing the next.
         *
         * @param task Task that has either been removed from the queue or has completed successfully.
         */
        Composite.prototype.taskCompletedOrRemoved_ = function (task) {
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
                    this.addCallbacks_(nextTask);
                    nextTask.run();
                }
            }
        };
        return Composite;
    })(tr.Abstract);
    tr.Composite = Composite;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    /**
     * Executes of a set of Tasks in a specific order.
     *
     * <p>This type of task allows a dependency graph (of child tasks) to be created.
     * It then executes all of its children in the order needed to satisfy dependencies,
     * and completes (or fails) once the child tasks have completed (or failed).
     *
     * <p>In the event of an error, the graph will stop and error.
     * All tasks that are running will be interrupted.
     * If the graph is re-run, any incomplete child tasks will be resumed.
     */
    var Graph = (function (_super) {
        __extends(Graph, _super);
        /**
         * Constructor.
         *
         * @param name Optional task name.
         */
        function Graph(name) {
            _super.call(this, name || "Graph");
            this.erroredTasks_ = [];
            this.taskIdToDependenciesMap_ = {};
            this.tasks_ = [];
        }
        // Public interface ////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Adds a child task to the dependency graph and ensures that its blocking dependencies (if any) are valid.
         *
         * @param task Child task to be run when this task is run.
         * @param blockers Blocking tasks that must complete successfully before this task can be run.
         *                 This parameter can be omitted for tasks that do not have blocking dependencies.
         * @return A reference to the current task.
         * @throws Error if task has been added more than once.
         * @throws Error if cyclic dependencies are detected.
         */
        Graph.prototype.add = function (task, blockers) {
            return this.addAll([task], blockers);
        };
        /**
         * Adds child tasks to the dependency graph and ensures that their blocking dependencies (if any) are valid.
         *
         * @param tasks Child tasks to be run when this task is run.
         * @param blockers Blocking tasks that must complete successfully before this task can be run.
         *                 This parameter can be omitted for tasks that do not have blocking dependencies.
         * @return A reference to the current task.
         * @throws Error if task has been added more than once.
         * @throws Error if cyclic dependencies are detected.
         */
        Graph.prototype.addAll = function (tasks, blockers) {
            for (var i = 0, length = tasks.length; i < length; i++) {
                var task = tasks[i];
                if (this.tasks_.indexOf(task) >= 0) {
                    throw Error("Cannot add task more than once.");
                }
                this.tasks_.push(task);
                this.updateBlockers_([task], blockers);
                this.validateDependencies_(task);
            }
            if (this.getState() == tr.enums.State.RUNNING) {
                this.runAllReadyTasks_();
            }
            return this;
        };
        /**
         * Convenience method for adding a task to the "end" of the dependency graph.
         * In other words, this task will be blocked by all tasks already in the graph.
         *
         * @param task Child task to be run when this task is run.
         * @return A reference to the current task.
         * @throws Error if task has been added more than once.
         * @throws Error if cyclic dependencies are detected.
         */
        Graph.prototype.addToEnd = function (task) {
            return this.add(task, this.tasks_.slice(0));
        };
        /**
         * Convenience method for adding multiple tasks to the "end" of the dependency graph.
         * In other words, these tasks will be blocked by all tasks already in the graph.
         *
         * @param tasks Child tasks to be run when this task is run.
         * @return A reference to the current task.
         * @throws Error if task has been added more than once.
         */
        Graph.prototype.addAllToEnd = function (tasks) {
            return this.addAll(tasks, this.tasks_.slice(0));
        };
        /**
         * Adds blocking dependencies (tasks) to tasks in the graph.
         *
         * <p>If the graph is running, blockers must not be added to tasks that are already running.
         *
         * @param blockers Blocking dependencies to add.
         * @param tasks Tasks from which to add the blockers.
         * @return A reference to the current task.
         * @throws Error if either the blockers or the tasks are not in the graph.
         * @throws Error if blockers have been added to tasks that are already running.
         */
        Graph.prototype.addBlockersTo = function (blockers, tasks) {
            this.updateBlockers_(tasks, blockers);
            return this;
        };
        /**
         * Removes a child task from the dependency graph and ensures that the remaining dependencies are still valid.
         *
         * @param task Child task to be removed from the graph.
         * @return A reference to the current task.
         * @throws Error if the task provided is not within the dependency graph,
         *         or if removing the task invalidates any other, blocked tasks.
         */
        Graph.prototype.remove = function (task) {
            return this.removeAll([task]);
        };
        /**
         * Removes child tasks from the dependency graph and ensures that the remaining dependencies are still valid.
         *
         * @param {!Array.<!tr.Task>} tasks Child tasks to be removed.
         * @return {!tr.Graph} a reference to the current task.
         * @throws Error if any of the tasks provided is not within the dependency graph,
         *         or if removing them invalidates any other, blocked tasks.
         */
        Graph.prototype.removeAll = function (tasks) {
            this.verifyInGraph_(tasks, "Cannot remove tasks not in graph.");
            for (var i = 0, length = tasks.length; i < length; i++) {
                var task = tasks[i];
                this.removeCallbacksFrom_(task);
                this.tasks_.splice(this.tasks_.indexOf(task), 1);
                delete this.taskIdToDependenciesMap_[task.getUniqueID()];
            }
            for (var i = 0, length = this.tasks_.length; i < length; i++) {
                this.validateDependencies_(this.tasks_[i]);
            }
            if (this.getState() == tr.enums.State.RUNNING) {
                this.completeOrRunNext_();
            }
            return this;
        };
        /**
         * Removes blocking dependencies (tasks) from tasks in the graph.
         *
         * <p>If the graph is running, any newly-unblocked tasks will be automatically run.
         *
         * @param blockers Blocking dependencies to remove.
         * @param tasks Tasks from which to remove the blockers.
         * @return A reference to the current task.
         * @throws Error if either the blockers or the tasks are not in the graph.
         */
        Graph.prototype.removeBlockersFrom = function (blockers, tasks) {
            this.verifyInGraph_(blockers, "Cannot remove blockers not in graph.");
            this.verifyInGraph_(tasks, "Cannot remove tasks not in graph.");
            var taskIdToDependenciesMap = this.taskIdToDependenciesMap_;
            for (var i = 0, length = tasks.length; i < length; i++) {
                var task = tasks[i];
                var dependencies = taskIdToDependenciesMap[task.getUniqueID()] || [];
                for (var i = 0, length = blockers.length; i < length; i++) {
                    var blocker = blockers[i];
                    var index = dependencies.indexOf(blocker);
                    if (index >= 0) {
                        dependencies.splice(index, 1);
                    }
                }
                taskIdToDependenciesMap[task.getUniqueID()] = dependencies;
            }
            if (this.getState() === tr.enums.State.RUNNING) {
                this.completeOrRunNext_();
            }
            return this;
        };
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        Graph.prototype.getOperationsCount = function () {
            var operationsCount = 0;
            for (var i in this.tasks_) {
                operationsCount += this.tasks_[i].getOperationsCount();
            }
            return operationsCount;
        };
        /** @inheritDoc */
        Graph.prototype.getCompletedOperationsCount = function () {
            var completedOperationsCount = 0;
            for (var i in this.tasks_) {
                completedOperationsCount += this.tasks_[i].getCompletedOperationsCount();
            }
            return completedOperationsCount;
        };
        /** @inheritDoc */
        Graph.prototype.runImpl = function () {
            this.erroredTasks_ = [];
            if (!this.beforeFirstRunInvoked_) {
                this.beforeFirstRun();
                this.beforeFirstRunInvoked_ = true;
            }
            this.completeOrRunNext_();
        };
        /** @inheritDoc */
        Graph.prototype.interruptImpl = function () {
            for (var i in this.tasks_) {
                var task = this.tasks_[i];
                if (task.getState() == tr.enums.State.RUNNING) {
                    this.removeCallbacksFrom_(task);
                    task.interrupt();
                }
            }
        };
        /** @inheritDoc */
        Graph.prototype.resetImpl = function () {
            this.erroredTasks_ = [];
            for (var i in this.tasks_) {
                this.tasks_[i].reset();
            }
        };
        // Hook methods ////////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Subclasses may override this method to just-in-time add child Tasks before the composite is run.
         */
        Graph.prototype.beforeFirstRun = function () {
            // No-op
        };
        // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Add callbacks to the specified task.
         *
         * @param task Child task
         */
        Graph.prototype.addCallbacksTo_ = function (task) {
            task.completed(this.childTaskCompleted_, this);
            task.errored(this.childTaskErrored_, this);
        };
        /**
         * @return {boolean} All child tasks have completed.
         * @private
         */
        Graph.prototype.areAllTasksCompleted_ = function () {
            for (var i in this.tasks_) {
                if (this.tasks_[i].getState() != tr.enums.State.COMPLETED) {
                    return false;
                }
            }
            return true;
        };
        /**
         * Callback for child task completions.
         *
         * @param task Task that has just completed.
         */
        Graph.prototype.childTaskCompleted_ = function (task) {
            this.removeCallbacksFrom_(task);
            this.completeOrRunNext_();
        };
        /**
         * Callback for child task errors.
         *
         * @param task Task that has just errored.
         */
        Graph.prototype.childTaskErrored_ = function (task) {
            this.removeCallbacksFrom_(task);
            this.erroredTasks_.push(task);
            this.completeOrRunNext_();
        };
        /**
         * Check child tasks to see if the graph has completed or errored.
         * If not, this method will run the next task(s).
         */
        Graph.prototype.completeOrRunNext_ = function () {
            // Handle edge-case where :started handler results in an interruption of this Graph
            if (this.getState() !== tr.enums.State.RUNNING) {
                return;
            }
            if (this.areAllTasksCompleted_()) {
                this.completeInternal();
            }
            else if (this.erroredTasks_.length == 0) {
                this.runAllReadyTasks_();
            }
            else {
                for (var i in this.tasks_) {
                    var task = this.tasks_[i];
                    if (task.getState() === tr.enums.State.RUNNING) {
                        task.interrupt();
                    }
                }
                this.errorInternal();
            }
        };
        /**
         * Determines if a task is safe to run by analyzing its blocking dependencies.
         *
         * @param task Child task
         * @return The specified task has incomplete blocking tasks.
         */
        Graph.prototype.hasIncompleteBlockers_ = function (task) {
            var blockers = this.taskIdToDependenciesMap_[task.getUniqueID()];
            if (blockers) {
                for (var i in blockers) {
                    var blockingTask = blockers[i];
                    if (blockingTask.getState() != tr.enums.State.COMPLETED) {
                        return true;
                    }
                }
            }
            return false;
        };
        /**
         * Is at least one child task is running?
         */
        Graph.prototype.isAnyTaskRunning_ = function () {
            for (var i in this.tasks_) {
                if (this.tasks_[i].getState() == tr.enums.State.RUNNING) {
                    return true;
                }
            }
            return false;
        };
        /**
         * Add callbacks from the specified task.
         *
         * @param task Child task
         */
        Graph.prototype.removeCallbacksFrom_ = function (task) {
            task.off(tr.enums.Event.COMPLETED, this.childTaskCompleted_, this);
            task.off(tr.enums.Event.ERRORED, this.childTaskErrored_, this);
        };
        /**
         * Run every non-running task that is not blocked by another incomplete task.
         */
        Graph.prototype.runAllReadyTasks_ = function () {
            for (var i in this.tasks_) {
                var task = this.tasks_[i];
                // TRICKY: Check to ensure we're still running.
                // It's possible that a child task takes an action that interrupts the graph.
                if (this.getState() !== tr.enums.State.RUNNING) {
                    return;
                }
                // TRICKY: If a task synchronously completes it will lead to another, simultaneous invocation of this method.
                // If this 2nd invocation starts a task that synchronously errors,
                // we run the risk of re-executing that failed Task when we return to this method.
                // To avoid this, check to make sure that the Task we are examining has not already errored.
                // Don't rely on task.getState() to check for an error,
                // because it may have errored on a previous run in which case we should retry it now.
                if (this.erroredTasks_.indexOf(task) >= 0) {
                    continue;
                }
                if (this.hasIncompleteBlockers_(task)) {
                    continue;
                }
                if (task.getState() != tr.enums.State.RUNNING && task.getState() != tr.enums.State.COMPLETED) {
                    this.addCallbacksTo_(task);
                    task.run();
                }
            }
        };
        /**
         * Helper function to updates blocking dependencies for the specified task.
         *
         * @param tasks Array of tasks for which to add blockers.
         * @param blockers Array of blocking tasks to be added.
         * @throws Error if either tasks or blockers are not already in the graph.
         * @throws Error if blockers have been added to tasks that are already running.
         */
        Graph.prototype.updateBlockers_ = function (tasks, blockers) {
            if (!blockers || blockers.length === 0) {
                return;
            }
            this.verifyInGraph_(tasks, "Cannot add blockers to tasks not in graph.");
            this.verifyInGraph_(blockers, "Cannot block on tasks not in graph.");
            for (var i = 0, length = tasks.length; i < length; i++) {
                var task = tasks[i];
                if (task.getState() !== tr.enums.State.INITIALIZED) {
                    throw Error("Cannot add blocking dependency to running task.");
                }
                var dependencies = this.taskIdToDependenciesMap_[task.getUniqueID()] || [];
                for (var i = 0, length = blockers.length; i < length; i++) {
                    var blocker = blockers[i];
                    if (dependencies.indexOf(blocker) < 0) {
                        dependencies.push(blocker);
                    }
                }
                this.taskIdToDependenciesMap_[task.getUniqueID()] = dependencies;
            }
        };
        /**
         * Checks the specified task to ensure that it does not have any cyclic
         * dependencies (tasks that are mutually dependent) or dependencies on tasks
         * that are not in the current graph.
         *
         * @param task Child task
         * @throws Error if cyclic or invalid dependencies are detected.
         */
        Graph.prototype.validateDependencies_ = function (task) {
            var blockers = this.taskIdToDependenciesMap_[task.getUniqueID()];
            if (blockers) {
                // Task cannot depend on itself
                if (blockers.indexOf(task) >= 0) {
                    throw Error("Cyclic dependency detected.");
                }
                // Task cannot depend on blocking tasks that aren't within the graph
                this.verifyInGraph_(blockers, "Task depends on blocker that is not in the graph");
            }
        };
        /**
         * Verifies that all of the specified tasks are within the graph.
         *
         * @param tasks Array of tasks.
         * @param errorMessage Error message if one or more tasks not in graph.
         * @throws Error if any of the tasks are not in the graph.
         */
        Graph.prototype.verifyInGraph_ = function (tasks, errorMessage) {
            for (var i = 0, length = tasks.length; i < length; i++) {
                if (this.tasks_.indexOf(tasks[i]) < 0) {
                    throw Error(errorMessage);
                }
            }
        };
        return Graph;
    })(tr.Abstract);
    tr.Graph = Graph;
})(tr || (tr = {}));
;
/// <reference path="graph.ts" />
var tr;
(function (tr) {
    /**
     * Runs a series of tasks and chooses the highest priority resolution (task) based on their outcome.
     *
     * <p>Once a resolution is chosen, it is added to the graph and run (last) before completion.
     * This type of task can be used to creating branching logic within the flow or a larger sequence of tasks.
     *
     * <p>If no resolutions are valid, this task will error.
     */
    var Conditional = (function (_super) {
        __extends(Conditional, _super);
        /**
         * Constructor.
         *
         * @param chooseFirstAvailableOutcome If TRUE, the first available outcome will be run.
         *                                    All remaining conditions will be interrupted and ignored.
         *                                    This value defaults to FALSE,
         *                                    Meaning that all pre-conditions will be allowed to finish before an outcome is chosen.
         * @param name Optional task name.
         */
        function Conditional(chooseFirstAvailableOutcome, name) {
            _super.call(this, name || "Conditional");
            this.conditionIdsToFailsafeWrappersMap_ = {};
            this.conditions_ = [];
            this.prioritizedOutcomes_ = [];
            this.taskIdToBlockingTasksMap_ = {};
            this.chooseFirstAvailableOutcome_ = !!chooseFirstAvailableOutcome;
        }
        /**
         * The outcome that was chosen based on the result of the condition tasks.
         * This method may return `undefined` if no outcome has been chosen.
         */
        Conditional.prototype.getChosenOutcome = function () {
            return this.chosenOutcome_;
        };
        /**
         * Adds a conditional outcome to the task.
         * The outcome's conditions are in the form of {@link tr.Task}.
         * If all of the specified conditions succeed, the outcome will be run.
         *
         L* ike an IF/ELSE block, conditions should be added in the order of highest-to-lowest priority.
         * Also like an IF/ELSE block, only one outcome is chosen as a result of this task.
         *
         * Note that priority (order) will be ignored if `runFirstAvailableResolution` is set to true.
         *
         * @param outcome Task to be chosen if all of the specified conditions succeed.
         * @param conditions Tasks that are pre-requisites to complete before the outcome can be entered.
         * @return A reference to the resolver.
         */
        Conditional.prototype.addOutcome = function (outcome, conditions) {
            conditions = conditions || [];
            this.prioritizedOutcomes_.push(outcome);
            this.taskIdToBlockingTasksMap_[outcome.getUniqueID()] = conditions;
            for (var i = 0, length = conditions.length; i < length; i++) {
                var condition = conditions[i];
                if (this.conditions_.indexOf(condition) >= 0) {
                    continue;
                }
                if (this.chooseFirstAvailableOutcome_) {
                    condition.completed(this.maybeChooseEarlyOutcome_, this);
                }
                // Wrap it in a Failsafe so that a condition-failure won't interrupt the other conditions tasks.
                var failsafe = new tr.Failsafe(condition);
                // @see maybeChooseEarlyOutcome_ for why we store these references
                this.conditionIdsToFailsafeWrappersMap_[condition.getUniqueID()] = failsafe;
                this.conditions_.push(condition);
                this.add(failsafe);
            }
            return this;
        };
        Conditional.prototype.allConditionsHaveCompleted_ = function () {
            this.chooseOutcomeIfValid_();
            if (this.chosenOutcome_) {
                this.addToEnd(this.chosenOutcome_);
            }
            else {
                this.errorInternal("No valid outcomes found.");
            }
        };
        /** @inheritDoc */
        Conditional.prototype.beforeFirstRun = function () {
            this.allConditionsHaveCompletedClosure_ = new tr.Closure(this.allConditionsHaveCompleted_.bind(this), true, "Outcome-choosing-Closure");
            // Once all of the blocker-tasks have completed, choose the most appropriate resolution.
            // This task may be short-circuited if the first available resolution is chosen.
            this.addToEnd(this.allConditionsHaveCompletedClosure_);
        };
        /**
         * Picks the highest priority resolution (task) that meets all blocking dependencies.
         * @private
         */
        Conditional.prototype.chooseOutcomeIfValid_ = function () {
            for (var i = 0; i < this.prioritizedOutcomes_.length; i++) {
                var resolution = this.prioritizedOutcomes_[i];
                var blockers = this.taskIdToBlockingTasksMap_[resolution.getUniqueID()];
                var blockersSatisfied = true;
                for (var x = 0; x < blockers.length; x++) {
                    var blockingTask = blockers[x];
                    if (blockingTask.getState() === tr.enums.State.ERRORED) {
                        blockersSatisfied = false;
                        break;
                    }
                }
                if (blockersSatisfied) {
                    this.chosenOutcome_ = resolution;
                    return;
                }
            }
        };
        Conditional.prototype.maybeChooseEarlyOutcome_ = function () {
            this.chooseOutcomeIfValid_();
            if (this.chosenOutcome_) {
                var placeholder = new tr.Stub();
                // Interrupt and remove all blockers before running the the resolution.
                // Add a temporary placeholder stub to prevent the Graph from auto-completing once blockers are removed.
                this.add(placeholder);
                // Remove Closure task first to avoid any invalid dependencies below.
                this.remove(this.allConditionsHaveCompletedClosure_);
                for (var i = 0, length = this.conditions_.length; i < length; i++) {
                    var blocker = this.conditions_[i];
                    if (blocker.getState() === tr.enums.State.RUNNING) {
                        blocker.off(tr.enums.Event.COMPLETED, this.maybeChooseEarlyOutcome_, this);
                        blocker.interrupt();
                    }
                    var failsafeWrapper = this.conditionIdsToFailsafeWrappersMap_[blocker.getUniqueID()];
                    this.remove(failsafeWrapper);
                }
                this.add(this.chosenOutcome_);
                this.remove(placeholder);
            }
        };
        return Conditional;
    })(tr.Graph);
    tr.Conditional = Conditional;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    /**
     * Provides a mechanism for creating tasks via composition rather than inheritance.
     *
     * <p>This task-type decorates an Object ("decorated") that defines a 'run' method.
     * This method will be passed 3 parameters:
     *
     * <ol>
     *   <li>
     *     <strong>complete</strong>:
     *     A callback to be invoked upon successful completion of the task.
     *     This callback accepts a parameter: data.
     *   <li>
     *     <strong>error</strong>:
     *     A callback to be invoked upon task failure.
     *     This callback accepts 2 parameters: data and error-message.
     *   <li>
     *     <strong>task</strong>:
     *     A reference to the decorator.
     * </ol>
     *
     * <p>The decorated Object may also implement 'interrupt' and 'reset' methods, although they are not required.
     */
    var Decorator = (function (_super) {
        __extends(Decorator, _super);
        /**
         * Constructor.
         *
         * @param decorated JavaScript object to decorate with task functionality.
         * @param name Optional task name.
         * @throws Error if required method "run" not implemented by "decorated".
         */
        function Decorator(decorated, name) {
            _super.call(this, name || "Decorator");
            this.decorated_ = decorated;
            if (!this.isFunction_("run")) {
                throw Error("Required method run() not implemented.");
            }
        }
        /**
         * Returns the decorated object.
         *
         * @return {Object}
         */
        Decorator.prototype.getDecorated = function () {
            return this.decorated_;
        };
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @override */
        Decorator.prototype.runImpl = function () {
            this.decorated_.run(this.complete_.bind(this), this.error_.bind(this));
        };
        /** @override */
        Decorator.prototype.interruptImpl = function () {
            if (this.isFunction_("interrupt")) {
                this.decorated_.interrupt();
            }
        };
        /** @override */
        Decorator.prototype.resetImpl = function () {
            if (this.isFunction_("reset")) {
                this.decorated_.reset();
            }
        };
        // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Complete this task.
         *
         * @param data Task data to be later accessible via getData().
         */
        Decorator.prototype.complete_ = function (data) {
            this.completeInternal(data);
        };
        /**
         * Error this task.
         *
         * @param data Error data to be later accessible via getData().
         * @param errorMessage Error message to be later accessible via getErrorMessage()
         */
        Decorator.prototype.error_ = function (data, errorMessage) {
            this.errorInternal(data, errorMessage);
        };
        /**
         * Is the specified decorated property a function?
         * @param property Name of property on decorated object
         */
        Decorator.prototype.isFunction_ = function (property) {
            return this.decorated_.hasOwnProperty(property) && typeof this.decorated_[property] === "function";
        };
        return Decorator;
    })(tr.Abstract);
    tr.Decorator = Decorator;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    /**
     * Creates and decorates a task returned by the callback.
     *
     * <p>Use this type of task when an important decision needs to be deferred.
     * For example if you need a task to load some data, but the specifics aren't known when your application is initialized.
     * This type of task allows for just-in-time evaluation of data resolved by previous Tasks.
     */
    var Factory = (function (_super) {
        __extends(Factory, _super);
        /**
         * Constructor.
         *
         * @param taskFactoryFunction The function to create an Task object.
         * @param thisArg Optional 'this' argument to invoke taskFactoryFn with.
         * @param argsArray Optional arguments array to invoke taskFactoryFn with.
         * @param name Optional task name.
         */
        function Factory(taskFactoryFunction, thisArg, argsArray, name) {
            _super.call(this, name || "Factory");
            this.recreateDeferredTaskAfterError_ = false;
            this.deferredTaskErrored_ = false;
            this.argsArray_ = argsArray;
            this.taskFactoryFn_ = taskFactoryFunction;
            this.thisArg_ = this;
        }
        /**
         * Returns the decorated Task, created by the factory function.
         */
        Factory.prototype.getDecoratedTask = function () {
            return this.deferredTask_;
        };
        /**
         * Set whether to recreate the deferred task after an error occurred.
         * This property is sticky for all consecutive reruns until set again.
         */
        Factory.prototype.recreateDeferredTaskAfterError = function (value) {
            this.recreateDeferredTaskAfterError_ = value;
        };
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        Factory.prototype.resetImpl = function () {
            this.removeCallbacks_();
            if (this.deferredTask_) {
                this.deferredTask_ = null;
            }
        };
        /** @inheritDoc */
        Factory.prototype.interruptImpl = function () {
            if (!this.deferredTask_) {
                return;
            }
            this.removeCallbacks_();
            this.deferredTask_.interrupt();
        };
        /** @inheritDoc */
        Factory.prototype.runImpl = function () {
            if (!this.deferredTask_ || this.recreateDeferredTaskAfterError_ && this.deferredTaskErrored_) {
                if (this.thisArg_) {
                    this.deferredTask_ = this.taskFactoryFn_.apply(this.thisArg_, this.argsArray_ || []);
                }
                else {
                    this.deferredTask_ = this.taskFactoryFn_();
                }
            }
            if (this.deferredTask_.getState() == tr.enums.State.COMPLETED) {
                this.onDeferredTaskCompleted_(this.deferredTask_);
            }
            else if (this.deferredTask_.getState() == tr.enums.State.ERRORED) {
                this.onDeferredTaskErrored_(this.deferredTask_);
            }
            else {
                this.deferredTask_.completed(this.onDeferredTaskCompleted_, this);
                this.deferredTask_.errored(this.onDeferredTaskErrored_, this);
                this.deferredTask_.interrupted(this.onDeferredTaskInterrupted_, this);
                this.deferredTask_.run();
            }
        };
        // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Event handler for when the deferred task is complete.
         */
        Factory.prototype.onDeferredTaskCompleted_ = function (task) {
            this.removeCallbacks_();
            this.completeInternal(task.getData());
        };
        /**
         * Event handler for when the deferred task errored.
         */
        Factory.prototype.onDeferredTaskErrored_ = function (task) {
            this.removeCallbacks_();
            this.deferredTaskErrored_ = true;
            this.errorInternal(task.getData(), task.getErrorMessage());
        };
        /**
         * Event handler for when the deferred task is interrupted.
         */
        Factory.prototype.onDeferredTaskInterrupted_ = function (task) {
            this.interrupt();
        };
        /**
         * Removes the deferred task callbacks.
         */
        Factory.prototype.removeCallbacks_ = function () {
            if (!this.deferredTask_) {
                return;
            }
            this.deferredTask_.off(tr.enums.Event.COMPLETED, this.onDeferredTaskCompleted_, this);
            this.deferredTask_.off(tr.enums.Event.ERRORED, this.onDeferredTaskErrored_, this);
            this.deferredTask_.off(tr.enums.Event.INTERRUPTED, this.onDeferredTaskInterrupted_, this);
        };
        return Factory;
    })(tr.Abstract);
    tr.Factory = Factory;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    /**
     * Decorates a task and re-dispatches errors as successful completions.
     *
     * <p>This can be used to decorate tasks that are not essential.
     */
    var Failsafe = (function (_super) {
        __extends(Failsafe, _super);
        /**
         * Constructor.
         *
         * @param decoratedTask Decorated task to be run when this task is run.
         * @param name Optional task name.
         */
        function Failsafe(decoratedTask, name) {
            _super.call(this, name || "Failsafe for " + decoratedTask.getName());
            this.decoratedTask_ = decoratedTask;
        }
        /**
         * Returns the inner decorated Task.
         */
        Failsafe.prototype.getDecoratedTask = function () {
            return this.decoratedTask_;
        };
        /** @inheritDoc */
        Failsafe.prototype.interruptImpl = function () {
            this.decoratedTask_.interrupt();
        };
        /** @inheritDoc */
        Failsafe.prototype.resetImpl = function () {
            this.decoratedTask_.reset();
        };
        /** @inheritDoc */
        Failsafe.prototype.runImpl = function () {
            this.decoratedTask_.completed(function (task) {
                this.completeInternal();
            }.bind(this));
            this.decoratedTask_.errored(function (task) {
                this.completeInternal();
            }.bind(this));
            this.decoratedTask_.run();
        };
        return Failsafe;
    })(tr.Abstract);
    tr.Failsafe = Failsafe;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    /**
     * Waits for an event-dispatching target to trigger a specific type of event.
     */
    var Listener = (function (_super) {
        __extends(Listener, _super);
        /**
         * Constructor.
         *
         * @param eventTarget Event-dispatching target.
         * @param eventType Type of event to wait for.
         * @param name Optional task name.
         */
        function Listener(eventTarget, eventType, name) {
            _super.call(this, name || "Listener");
            this.eventTarget_ = eventTarget;
            this.eventType_ = eventType;
        }
        /** @inheritDoc */
        Listener.prototype.interruptImpl = function () {
            this.eventTarget_.removeEventListener(this.eventType_, this.listener_);
        };
        /** @inheritDoc */
        Listener.prototype.resetImpl = function () {
            // No-op
        };
        /** @inheritDoc */
        Listener.prototype.runImpl = function () {
            var that = this;
            this.listener_ = function (event) {
                that.eventTarget_.removeEventListener(that.eventType_, that.listener_);
                that.completeInternal(event);
            };
            this.eventTarget_.addEventListener(this.eventType_, this.listener_);
        };
        return Listener;
    })(tr.Abstract);
    tr.Listener = Listener;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
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
     */
    var Observer = (function (_super) {
        __extends(Observer, _super);
        /**
         * Constructor.
         *
         * @param tasks The array of Tasks to observe.
         * @param failUponFirstError Whether to error the observer task immediately when one of the observed tasks errors.
         * @param name Optional task name.
         */
        function Observer(tasks, failUponFirstError, name) {
            _super.call(this, name || "Observer");
            this.failUponFirstError_ = failUponFirstError;
            this.observedTasks_ = [];
            if (tasks) {
                for (var i in tasks) {
                    var task = tasks[i];
                    if (this.observedTasks_.indexOf(task) == -1) {
                        this.observedTasks_.push(task);
                    }
                }
            }
        }
        /**
         * Returns a list of observed tasks.
         */
        Observer.prototype.getObservedTasks = function () {
            return this.observedTasks_;
        };
        /**
         * Add an additional Task to observe.
         * @param task
         * @return A reference to the current task.
         */
        Observer.prototype.observe = function (task) {
            if (this.observedTasks_.indexOf(task) == -1) {
                this.observedTasks_.push(task);
            }
            if (this.getState() == tr.enums.State.RUNNING) {
                task.completed(this.onObservedTaskCompleted_, this);
                task.errored(this.onObservedTaskErrored_, this);
            }
            return this;
        };
        /**
         * Stops a Task from being observed.
         * @param task
         * @return A reference to the current task.
         */
        Observer.prototype.stopObserving = function (task) {
            var index = this.observedTasks_.indexOf(task);
            if (index >= 0) {
                task.off(tr.enums.Event.COMPLETED, this.onObservedTaskCompleted_, this);
                task.off(tr.enums.Event.ERRORED, this.onObservedTaskErrored_, this);
                this.observedTasks_.splice(index, 1);
                this.tryToFinalize_();
            }
            return this;
        };
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @override */
        Observer.prototype.getCompletedOperationsCount = function () {
            var count = 0;
            for (var i in this.observedTasks_) {
                var task = this.observedTasks_[i];
                count += task.getCompletedOperationsCount();
            }
            return count;
        };
        /** @override */
        Observer.prototype.getOperationsCount = function () {
            var count = 0;
            for (var i in this.observedTasks_) {
                var task = this.observedTasks_[i];
                count += task.getOperationsCount();
            }
            return count;
        };
        /** @override */
        Observer.prototype.runImpl = function () {
            if (!this.tryToFinalize_()) {
                for (var i in this.observedTasks_) {
                    var task = this.observedTasks_[i];
                    this.observe(task);
                }
            }
        };
        // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Event handler for when the observed task is complete.
         */
        Observer.prototype.onObservedTaskCompleted_ = function (task) {
            this.tryToFinalize_();
        };
        /**
         * Event handler for when the observed task errored.
         */
        Observer.prototype.onObservedTaskErrored_ = function (task) {
            this.tryToFinalize_();
        };
        /**
         * Try to complete or error the observer task based on the states of the observed tasks, if the observer is running.
         */
        Observer.prototype.tryToFinalize_ = function () {
            if (this.getState() != tr.enums.State.RUNNING) {
                return false;
            }
            var allFinal = true;
            var firstError = null;
            for (var i in this.observedTasks_) {
                var task = this.observedTasks_[i];
                if (task.getState() == tr.enums.State.ERRORED) {
                    firstError = firstError || task;
                }
                else if (task.getState() != tr.enums.State.COMPLETED) {
                    allFinal = false;
                }
            }
            if (firstError && this.failUponFirstError_) {
                this.errorInternal(firstError.getData(), firstError.getErrorMessage());
                return true;
            }
            else if (firstError && allFinal) {
                this.errorInternal();
                return true;
            }
            else if (allFinal) {
                this.completeInternal();
                return true;
            }
            return false;
        };
        return Observer;
    })(tr.Abstract);
    tr.Observer = Observer;
})(tr || (tr = {}));
;
/// <reference path="../../definitions/angular.d.ts" />
/// <reference path="../../definitions/jquery.d.ts" />
/// <reference path="../../definitions/promise.d.ts" />
/// <reference path="../../definitions/q.d.ts" />
var tr;
(function (tr) {
    /**
     * Acts as an adapter between Task Runner and several popular Promise libraries.
     *
     * <p>The following promise libraries are supported:
     *
     * <ul>
     * <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise">ES6 (Promise.prototype)</a>
     * <li><a href="https://docs.angularjs.org/api/ng/service/$q">Angular $q</a>
     * <li><a href="https://github.com/kriskowal/q">Q</a>
     * <li><a href="http://api.jquery.com/deferred.promise/">jQuery</a>
     * </ul>
     *
     * <p>Note that depending on specific promises, reset/rerun behavior may not function as desired.
     */
    var Promise = (function (_super) {
        __extends(Promise, _super);
        /**
         * Constructor.
         *
         * @param promise A Promise object
         * @param name Optional task name.
         * @throws Erorr if invalid Promise object provided.
         * @throws Erorr if no supported Promise libraries are detected.
         */
        function Promise(promise, name) {
            _super.call(this, name || "Promise");
            if (!promise) {
                throw Error("Invalid promise provided");
            }
            this.promise_ = promise;
            if (Promise.isAngularDetected()) {
                this.observeForAngular_(promise);
            }
            else if (Promise.isES6Detected()) {
                this.observeForES6_(promise);
            }
            else if (Promise.isJQueryDetected()) {
                this.observeForJQuery_(promise);
            }
            else if (Promise.isQDetected()) {
                this.observeForQ_(promise);
            }
            else {
                throw 'No supported Promise libraries detected.';
            }
        }
        /** @inheritDoc */
        Promise.prototype.runImpl = function () {
            // No-op
        };
        // Static methods //////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Wraps a Promise and returns a Task that will complete/error when the promise is resolved/rejected.
         *
         * <p>If you're working with a library that returns Promises, you can convert any Promise to a Task using this method.
         *
         * @param promise A Promise object
         * @param name Optional task name.
         * @throws Error if invalid Promise object provided.
         * @throws Error if no supported Promise libraries are detected.
         */
        Promise.promiseToTask = function (promise, name) {
            return new Promise(promise, name);
        };
        /**
         * Wraps a Task and returns a Promise that will resolve/reject when the task is completed/errored.
         *
         * <p>If you're working with a library that expects Promises (e.g. Angular's UI Router),
         * you can convert any Task to a Promise using this method.
         *
         * @param task Task to wrap
         * @param $q Angular $q service.
         *           This parameter is only required if Angular Promises are being used.
         *           It is necessary because there is no global $injector from which to get $q.
         * @throws Error if invalid Task object provided.
         * @throws Error if no supported Promise libraries are detected.
         * @throws Error if Angular is detected but no $q implementation is provided
         */
        Promise.taskToPromise = function (task, $q) {
            if (!task) {
                throw Error("Invalid task provided");
            }
            if (this.isAngularDetected()) {
                return this.createAngularPromise_(task, $q);
            }
            else if (this.isES6Detected()) {
                return this.createES6PromisePromise_(task);
            }
            else if (this.isJQueryDetected()) {
                return this.createJQueryPromise_(task);
            }
            else if (this.isQDetected()) {
                return this.createQPromise_(task);
            }
            else {
                throw Error("No supported Promise libraries detected.");
            }
        };
        /**
         * Detects is Angular is present.
         */
        Promise.isAngularDetected = function () {
            return window["angular"] !== undefined;
        };
        /**
         * Detects is ES6 Promise.prototype is supported.
         */
        Promise.isES6Detected = function () {
            return window["Promise"] !== undefined;
        };
        /**
         * Detects is jQuery is present.
         */
        Promise.isJQueryDetected = function () {
            return window["jQuery"] !== undefined && window["jQuery"]["Deferred"] !== undefined;
        };
        /**
         * Detects is Q is present.
         */
        Promise.isQDetected = function () {
            return window["Q"] !== undefined && window["Q"]["defer"] !== undefined;
        };
        // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Completes with the specified data only if/once the task is running.
         * @param data Data
         */
        Promise.prototype.completeIfRunning_ = function (data) {
            if (this.getState() === tr.enums.State.RUNNING) {
                this.completeInternal(data);
            }
            else {
                var callback = function () {
                    this.completeInternal(data);
                    this.off(callback, tr.enums.Event.STARTED);
                }.bind(this);
                this.started(callback);
            }
        };
        /**
         * Errors with the specified data and message only if/once the task is running.
         * @param data Data
         * @param errorMessage Error message
         * @private
         */
        Promise.prototype.errorIfRunning_ = function (data, errorMessage) {
            if (this.getState() === tr.enums.State.RUNNING) {
                this.errorInternal(data, errorMessage);
            }
            else {
                var callback = function () {
                    this.errorInternal(data, errorMessage);
                    this.off(callback, tr.enums.Event.STARTED);
                }.bind(this);
                this.started(callback);
            }
        };
        /**
         * @see https://docs.angularjs.org/api/ng/service/$q
         */
        Promise.prototype.observeForAngular_ = function (promise) {
            var that = this;
            promise.then(function (data) {
                that.completeIfRunning_(data);
            }, function (data) {
                that.errorIfRunning_(data, data);
            });
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
         */
        Promise.prototype.observeForES6_ = function (promise) {
            var that = this;
            promise.then(function (data) {
                that.completeIfRunning_(data);
            }, function (data) {
                that.errorIfRunning_(data, data);
            });
        };
        /**
         * @see http://api.jquery.com/deferred.promise/
         */
        Promise.prototype.observeForJQuery_ = function (promise) {
            var that = this;
            promise.then(function (data) {
                that.completeIfRunning_(data);
            }, function (data) {
                that.errorIfRunning_(data, data);
            });
        };
        /**
         * @see https://github.com/kriskowal/q
         */
        Promise.prototype.observeForQ_ = function (promise) {
            var that = this;
            promise.then(function (data) {
                that.completeIfRunning_(data);
            }, function (data) {
                that.errorIfRunning_(data, data.message || data);
            });
        };
        // Static helpers //////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * @see https://docs.angularjs.org/api/ng/service/$q
         */
        Promise.createAngularPromise_ = function (task, $q) {
            if (!$q) {
                throw Error("Invalid $q provided");
            }
            var deferred = $q.defer();
            task.completed(function (task) {
                deferred.resolve(task.getData());
            });
            task.errored(function (task) {
                deferred.reject(task.getErrorMessage());
            });
            return deferred.promise;
        };
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
         */
        Promise.createES6PromisePromise_ = function (task) {
            return new window["Promise"](function (resolve, reject) {
                task.completed(function (task) {
                    resolve(task.getData());
                });
                task.errored(function (task) {
                    reject(task.getErrorMessage());
                });
            });
        };
        /**
         * @see http://api.jquery.com/deferred.promise/
         */
        Promise.createJQueryPromise_ = function (task) {
            var deferred = new window["jQuery"]["Deferred"]();
            task.completed(function (task) {
                deferred.resolve(task.getData());
            });
            task.errored(function (task) {
                deferred.reject(task.getErrorMessage());
            });
            return deferred.promise();
        };
        /**
         * @see https://github.com/kriskowal/q
         */
        Promise.createQPromise_ = function (task) {
            var deferred = window["Q"].defer();
            task.completed(function (task) {
                deferred.resolve(task.getData());
            });
            task.errored(function (task) {
                deferred.reject(task.getErrorMessage());
            });
            return deferred.promise;
        };
        return Promise;
    })(tr.Abstract);
    tr.Promise = Promise;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    /**
     * Decorator for tasks that should be retried on error.
     *
     * <p>For example, you may wish to decorator a Task that relies on Internet connectivity in order to complete.
     * The decorated Task is allowed to fail a specified number of times before the error condition is reported externally.
     *
     * <p>This decorator can also be configured to delay for a set amount of time before re-running its internal tasks.
     * This delay may allow certain types of external error conditions (e.g. temporary loss of Internet connectivity)
     * to resolve before the operation is attempted again.
     */
    var Retry = (function (_super) {
        __extends(Retry, _super);
        /**
         * Constructor.
         *
         * @param task The task to decorate.
         * @param maxRetries Number of times to reset and re-run the decorated Task before erroring the retry task.
         *                   If not specified this defaults to 5.
         * @param retryDelay The amount of time to delay before resetting and re-running the decorated Task.
         *                   A value < 0 seconds will result in a synchronous retry.
         *                   If not specified this defaults to 1000 ms.
         * @param name Optional task name.
         */
        function Retry(task, maxRetries, retryDelay, name) {
            _super.call(this, name || "Retry");
            this.retries_ = 0;
            this.decoratedTask_ = task;
            this.maxRetries_ = maxRetries || 5;
            this.retryDelay_ = retryDelay || 1000;
        }
        /**
         * The inner decorated Task.
         */
        Retry.prototype.getDecoratedTask = function () {
            return this.decoratedTask_;
        };
        /**
         * The number of retries attempted.
         */
        Retry.prototype.getRetries = function () {
            return this.retries_;
        };
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        Retry.prototype.interruptImpl = function () {
            this.stopTimer_();
            this.retries_ = 0; // Interruption resets the number of retries.
            this.removeCallbacks_();
            if (this.decoratedTask_.getState() == tr.enums.State.RUNNING) {
                this.decoratedTask_.interrupt();
            }
        };
        /** @inheritDoc */
        Retry.prototype.resetImpl = function () {
            this.stopTimer_();
            this.retries_ = 0;
            this.removeCallbacks_();
            this.decoratedTask_.reset();
        };
        /** @inheritDoc */
        Retry.prototype.runImpl = function () {
            this.decoratedTask_.completed(this.onDecoratedTaskCompleted_, this);
            this.decoratedTask_.errored(this.onDecoratedTaskErrored_, this);
            if (this.decoratedTask_.getState() == tr.enums.State.COMPLETED) {
                this.onDecoratedTaskCompleted_(this.decoratedTask_);
                return;
            }
            if (this.decoratedTask_.getState() == tr.enums.State.ERRORED) {
                this.decoratedTask_.reset();
            }
            this.decoratedTask_.run();
        };
        // Private methods /////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Event handler for when the deferred task is complete.
         * @param {!tr.Task} task
         * @private
         */
        Retry.prototype.onDecoratedTaskCompleted_ = function (task) {
            this.stopTimer_();
            this.removeCallbacks_();
            this.completeInternal(task.getData());
        };
        /**
         * Event handler for when the deferred task errored.
         * @param {!tr.Task} task
         * @private
         */
        Retry.prototype.onDecoratedTaskErrored_ = function (task) {
            if (this.retries_ >= this.maxRetries_) {
                this.stopTimer_();
                this.removeCallbacks_();
                this.errorInternal(task.getData(), task.getErrorMessage());
                return;
            }
            this.retries_++;
            if (this.retryDelay_ >= 0) {
                this.timeoutId_ = setTimeout(this.runImpl.bind(this), this.retryDelay_);
            }
            else {
                this.runImpl();
            }
        };
        /**
         * Removes the decorated task callbacks.
         */
        Retry.prototype.removeCallbacks_ = function () {
            this.decoratedTask_.off(tr.enums.Event.COMPLETED, this.onDecoratedTaskCompleted_, this);
            this.decoratedTask_.off(tr.enums.Event.ERRORED, this.onDecoratedTaskErrored_, this);
        };
        /**
         * Stops the running timer.
         */
        Retry.prototype.stopTimer_ = function () {
            if (this.timeoutId_) {
                clearTimeout(this.timeoutId_);
                this.timeoutId_ = null;
            }
        };
        /**
         * The default max number of times to reset and re-run the decorated Task before erroring the retry task.
         */
        Retry.MAX_RETRIES_ = 5;
        /**
         * The default amount of time to delay before resetting and re-running the decorated Task.
         */
        Retry.RETRY_DELAY_ = 5;
        return Retry;
    })(tr.Abstract);
    tr.Retry = Retry;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    /**
     * Waits for an amount of time to pass before completing.
     *
     * <p>Resuming an interrupted task can either restart the timer at the beginning or resume from the interrupted point.
     */
    var Sleep = (function (_super) {
        __extends(Sleep, _super);
        /**
         * Constructor.
         *
         * @param timeout Time in milliseconds to wait before completing.
         * @param resetTimerAfterInterruption Reset the timer after interruption; defaults to false.
         * @param name Optional task name.
         */
        function Sleep(timeout, resetTimerAfterInterruption, name) {
            _super.call(this, name || "Sleep");
            this.timeoutPause_ = -1;
            this.timeoutStart_ = -1;
            this.resetTimerAfterInterruption_ = !!resetTimerAfterInterruption;
            this.timeout_ = timeout;
        }
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        Sleep.prototype.resetImpl = function () {
            this.stopTimer_();
            this.timeoutStart_ = -1;
            this.timeoutPause_ = -1;
        };
        /** @inheritDoc */
        Sleep.prototype.interruptImpl = function () {
            this.stopTimer_();
            this.timeoutPause_ = new Date().getTime();
        };
        /** @inheritDoc */
        Sleep.prototype.runImpl = function () {
            if (this.timeoutId_) {
                throw 'A timeout for this task already exists.';
            }
            var timeout = this.timeout_;
            // Increment counter unless the task has been configured to restart after interruptions.
            if (!this.resetTimerAfterInterruption_ && this.timeoutStart_ > -1 && this.timeoutPause_ > -1) {
                timeout += (this.timeoutStart_ - this.timeoutPause_);
            }
            timeout = Math.max(timeout, 0);
            this.timeoutId_ = setTimeout(this.onTimeout_.bind(this), timeout);
            this.timeoutStart_ = new Date().getTime();
        };
        // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Stops the running timer.
         * @private
         */
        Sleep.prototype.stopTimer_ = function () {
            if (this.timeoutId_) {
                clearTimeout(this.timeoutId_);
                this.timeoutId_ = null;
            }
        };
        /**
         * Event handler for when the deferred task is complete.
         * @private
         */
        Sleep.prototype.onTimeout_ = function () {
            this.stopTimer_();
            this.completeInternal();
        };
        return Sleep;
    })(tr.Abstract);
    tr.Sleep = Sleep;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    /**
     * Runs a series of tasks until one of them successfully completes.
     *
     * <p>This type of task completes successfully if at least one of its children complete.
     * If all of its children error, this task will also error.
     */
    var StopOnSuccess = (function (_super) {
        __extends(StopOnSuccess, _super);
        /**
         * Constructor.
         *
         * @param tasks Initial set of child tasks.
         * @param name Optional task name.
         */
        function StopOnSuccess(tasks, name) {
            _super.call(this, name || "StopOnSuccess");
            this.completedTasks_ = [];
            this.erroredTasks_ = [];
            this.taskQueue_ = [];
            this.taskQueueIndex_ = 0;
            if (tasks) {
                this.addAll(tasks);
            }
        }
        // Public interface ////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Adds a set of tasks to the list of child tasks.
         *
         * <p>This method should only be called before the task is run.
         * Adding child tasks while running is not a supported operation.
         *
         * @param tasks Child tasks to be added
         * @return A reference to the current task.
         * @throws Error if the composite task has already been run.
         * @throws Error if tasks have been added more than once.
         */
        StopOnSuccess.prototype.addAll = function (tasks) {
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
         * @param task Child task to be run when this task is run.
         * @return A reference to the current task.
         * @throws Error if the composite task has already been run.
         * @throws Error if task has been added more than once
         */
        StopOnSuccess.prototype.add = function (task) {
            if (this.getState() === tr.enums.State.RUNNING) {
                throw Error("Cannot add task while running.");
            }
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
        StopOnSuccess.prototype.remove = function (task) {
            if (this.getState() === tr.enums.State.RUNNING) {
                throw Error("Cannot remove  task while running.");
            }
            var index = this.taskQueue_.indexOf(task);
            if (index < 0) {
                throw Error("Attempted to remove an invalid task.");
            }
            this.removeCallbacks_(task);
            this.taskQueue_.splice(this.taskQueue_.indexOf(task), 1);
            return this;
        };
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        StopOnSuccess.prototype.getCompletedOperationsCount = function () {
            if (this.getState() === tr.enums.State.COMPLETED) {
                return this.getOperationsCount();
            }
            else {
                var completedOperationsCount = 0;
                this.eachTaskInQueue_(function (task) {
                    completedOperationsCount += task.getCompletedOperationsCount();
                });
                return completedOperationsCount;
            }
        };
        /** @inheritDoc */
        StopOnSuccess.prototype.getOperationsCount = function () {
            var operationsCount = 0;
            this.eachTaskInQueue_(function (task) {
                operationsCount += task.getOperationsCount();
            });
            return operationsCount;
        };
        /** @inheritDoc */
        StopOnSuccess.prototype.runImpl = function () {
            if (this.allTasksAreCompleted_()) {
                this.completeInternal();
            }
            else {
                this.erroredTasks_ = [];
                var task = this.taskQueue_[this.taskQueueIndex_];
                this.addCallbacks_(task);
                task.run();
            }
        };
        /** @inheritDoc */
        StopOnSuccess.prototype.interruptImpl = function () {
            this.eachTaskInQueue_(function (task) {
                if (task.getState() == tr.enums.State.RUNNING) {
                    task.interrupt();
                }
            });
        };
        /** @inheritDoc */
        StopOnSuccess.prototype.resetImpl = function () {
            this.taskQueueIndex_ = 0;
            this.completedTasks_ = [];
            this.erroredTasks_ = [];
            this.eachTaskInQueue_(function (task) {
                task.reset();
            });
        };
        // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Adds completed and errored callback handlers to child Task.
         *
         * @param task Child task
         */
        StopOnSuccess.prototype.addCallbacks_ = function (task) {
            task.completed(this.childTaskCompleted_, this);
            task.errored(this.childTaskErrored_, this);
        };
        /**
         * Are all child tasks completed?
         */
        StopOnSuccess.prototype.allTasksAreCompleted_ = function () {
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
         */
        StopOnSuccess.prototype.checkForTaskCompletion_ = function () {
            if (this.completedTasks_.length > 0) {
                this.completeInternal();
            }
            else {
                var finishedCount = this.completedTasks_.length + this.erroredTasks_.length;
                if (finishedCount >= this.taskQueue_.length) {
                    if (this.erroredTasks_.length > 0) {
                        this.errorInternal();
                    }
                    else {
                        this.completeInternal();
                    }
                }
            }
        };
        /**
         * Callback for child task completions.
         *
         * @param task Task that has just completed.
         */
        StopOnSuccess.prototype.childTaskCompleted_ = function (task) {
            this.completedTasks_.push(task);
            this.taskCompletedOrRemoved_(task);
        };
        /**
         * Callback for child task errors.
         *
         * @param task Task that has just errored.
         */
        StopOnSuccess.prototype.childTaskErrored_ = function (task) {
            this.erroredTasks_.push(task);
            this.taskCompletedOrRemoved_(task);
        };
        /**
         * Invoke a callback once for each Task in the queue.
         *
         * @param callback Callback function
         */
        StopOnSuccess.prototype.eachTaskInQueue_ = function (callback) {
            for (var i = 0; i < this.taskQueue_.length; i++) {
                var task = this.taskQueue_[i];
                callback(task);
            }
        };
        /**
         * Removes completed and errored callback handlers from child Task.
         *
         * @param task Child task
         */
        StopOnSuccess.prototype.removeCallbacks_ = function (task) {
            task.off(tr.enums.Event.COMPLETED, this.childTaskCompleted_, this);
            task.off(tr.enums.Event.ERRORED, this.childTaskErrored_, this);
        };
        /**
         * Convenience method for handling a completed Task and executing the next.
         *
         * @param task Task that has either been removed from the queue or has completed successfully.
         */
        StopOnSuccess.prototype.taskCompletedOrRemoved_ = function (task) {
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
        return StopOnSuccess;
    })(tr.Abstract);
    tr.StopOnSuccess = StopOnSuccess;
})(tr || (tr = {}));
var tr;
(function (tr) {
    /**
     * No-op task primarily useful for unit testing.
     *
     * <p>This type of task can also be useful in a composite when a default, no-op behavior is desired.
     * Simply replace the placeholder null task with one that does actual work.
     *
     * <p>This task can be configured to auto-complete when it is executed.
     * Otherwise it will not complete or error until specifically told to do so.
     */
    var Stub = (function (_super) {
        __extends(Stub, _super);
        /**
         * Constructor.
         *
         * @param autoCompleteUponRun Task should auto-complete when run.
         * @param name Optional task name.
         */
        function Stub(autoCompleteUponRun, name) {
            _super.call(this, function () {
                // No-op
            }, autoCompleteUponRun, name || "Stub");
        }
        return Stub;
    })(tr.Closure);
    tr.Stub = Stub;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    /**
     * Decorates a Task and enforces a max-execution time limit.
     *
     * <p>If specified time interval elapses before the decorated Task has complete it is considered to be an error.
     * The decorated Task will be interrupted in that event.
     */
    var Timeout = (function (_super) {
        __extends(Timeout, _super);
        /**
         * Constructor.
         *
         * @param task The task to decorate.
         * @param timeout Time in milliseconds to wait before timing out the decorated task.
         * @param name Optional task name.
         */
        function Timeout(task, timeout, name) {
            _super.call(this, name || "Timeout");
            this.timeoutPause_ = -1;
            this.timeoutStart_ = -1;
            this.decoratedTask_ = task;
            this.timeout_ = timeout;
        }
        /**
         * Returns the inner decorated Task.
         *
         * @return {tr.Task}
         */
        Timeout.prototype.getDecoratedTask = function () {
            return this.decoratedTask_;
        };
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        Timeout.prototype.interruptImpl = function () {
            this.stopTimer_();
            this.removeCallbacks_();
            this.decoratedTask_.interrupt();
            this.timeoutPause_ = new Date().getTime();
        };
        /** @inheritDoc */
        Timeout.prototype.resetImpl = function () {
            this.stopTimer_();
            this.removeCallbacks_();
            this.decoratedTask_.reset();
            this.timeoutStart_ = -1;
            this.timeoutPause_ = -1;
        };
        /** @inheritDoc */
        Timeout.prototype.runImpl = function () {
            if (this.timeoutId_) {
                throw 'A timeout for this task already exists.';
            }
            var timeout = this.timeout_;
            if (this.timeoutStart_ > -1 && this.timeoutPause_ > -1) {
                timeout += (this.timeoutStart_ - this.timeoutPause_);
            }
            timeout = Math.max(timeout, 0);
            this.timeoutId_ = setTimeout(this.onTimeout_.bind(this), timeout);
            this.timeoutStart_ = new Date().getTime();
            if (this.decoratedTask_.getState() == tr.enums.State.COMPLETED) {
                this.onDecoratedTaskCompleted_(this.decoratedTask_);
            }
            else if (this.decoratedTask_.getState() == tr.enums.State.ERRORED) {
                this.onDecoratedTaskErrored_(this.decoratedTask_);
            }
            else {
                this.decoratedTask_.completed(this.onDecoratedTaskCompleted_, this);
                this.decoratedTask_.errored(this.onDecoratedTaskErrored_, this);
                this.decoratedTask_.run();
            }
        };
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * Event handler for when the deferred task is complete.
         * @param {!tr.Task} task
         * @private
         */
        Timeout.prototype.onDecoratedTaskCompleted_ = function (task) {
            this.stopTimer_();
            this.removeCallbacks_();
            this.completeInternal(task.getData());
        };
        /**
         * Event handler for when the deferred task errored.
         * @param {!tr.Task} task
         * @private
         */
        Timeout.prototype.onDecoratedTaskErrored_ = function (task) {
            this.stopTimer_();
            this.removeCallbacks_();
            this.errorInternal(task.getData(), task.getErrorMessage());
        };
        /**
         * Event handler for when the deferred task is complete.
         * @private
         */
        Timeout.prototype.onTimeout_ = function () {
            this.stopTimer_();
            this.removeCallbacks_();
            this.decoratedTask_.interrupt();
            this.errorInternal(this.decoratedTask_.getData(), 'Task timed out after ' + this.timeout_ + 'ms');
        };
        /**
         * Removes the decorated task callbacks.
         */
        Timeout.prototype.removeCallbacks_ = function () {
            this.decoratedTask_.off(tr.enums.Event.COMPLETED, this.onDecoratedTaskCompleted_, this);
            this.decoratedTask_.off(tr.enums.Event.ERRORED, this.onDecoratedTaskErrored_, this);
        };
        /**
         * Stops the running timer.
         */
        Timeout.prototype.stopTimer_ = function () {
            if (this.timeoutId_) {
                clearTimeout(this.timeoutId_);
                this.timeoutId_ = null;
            }
        };
        return Timeout;
    })(tr.Abstract);
    tr.Timeout = Timeout;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    /**
     * Animation-frame-based task for tweening properties.
     *
     * <p>This task invokes a callback on each animation frame and passes a 0..1 value representing the progress of the overall tween.
     */
    var Tween = (function (_super) {
        __extends(Tween, _super);
        /**
         * Constructor.
         *
         * @param callback Callback invoked on animation frame with a number (0..1) representing the position of the tween.
         * @param duration Duration of tween in milliseconds.
         * @param easingFunction Optional easing function used to convert input time to an eased time.
         *                       If no function is specified, a linear ease (no ease) will be used.
         * @param name Optional task name.
         */
        function Tween(callback, duration, easingFunction, name) {
            _super.call(this, name || "Tween");
            this.elapsed_ = 0;
            this.lastUpdateTimestamp_ = 0;
            if (isNaN(duration) || duration <= 0) {
                throw Error("Invalid tween duration provided.");
            }
            this.callback_ = callback;
            this.duration_ = duration;
            this.easingFunction_ = easingFunction || this.linearEase_;
        }
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        Tween.prototype.interruptImpl = function () {
            this.cancelCurrentAnimationFrame_();
        };
        /** @inheritDoc */
        Tween.prototype.resetImpl = function () {
            this.elapsed_ = 0;
            this.lastUpdateTimestamp_ = 0;
            // One final animation frame to reset the progress value to 0.
            this.queueAnimationFrame_(this.updateReset_.bind(this));
        };
        /** @inheritDoc */
        Tween.prototype.runImpl = function () {
            this.lastUpdateTimestamp_ = new Date().getTime();
            this.queueAnimationFrame_(this.updateRunning_.bind(this));
        };
        // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////
        Tween.prototype.cancelCurrentAnimationFrame_ = function () {
            if (this.animationFrameId_) {
                window.cancelAnimationFrame(this.animationFrameId_);
                this.animationFrameId_ = null;
            }
        };
        Tween.prototype.linearEase_ = function (value) {
            return value;
        };
        Tween.prototype.queueAnimationFrame_ = function (callback) {
            this.cancelCurrentAnimationFrame_();
            this.animationFrameId_ = window.requestAnimationFrame(callback);
        };
        Tween.prototype.updateReset_ = function () {
            this.animationFrameId_ = null;
            this.callback_(this.easingFunction_(0));
        };
        Tween.prototype.updateRunning_ = function () {
            var timestamp = new Date().getTime();
            this.animationFrameId_ = null;
            this.elapsed_ += timestamp - this.lastUpdateTimestamp_;
            this.lastUpdateTimestamp_ = timestamp;
            var value = this.easingFunction_(Math.min(1, this.elapsed_ / this.duration_));
            this.callback_(value);
            // Check for complete or queue another animation frame.
            if (this.elapsed_ >= this.duration_) {
                this.completeInternal();
            }
            else {
                this.queueAnimationFrame_(this.updateRunning_.bind(this));
            }
        };
        return Tween;
    })(tr.Abstract);
    tr.Tween = Tween;
})(tr || (tr = {}));
var tr;
(function (tr) {
    /**
     * Creates an XHR request and completes upon successful response from the server.
     *
     * <p>The type of request created depends on whether a data object is provided:
     *
     * <ul>
     *  <li>If a data object is provided it will be converted to a URL-args string and a POST request will be created.
     *  <li>If a data object is provided a GET request will be created.
     * </ul>
     */
    var Xhr = (function (_super) {
        __extends(Xhr, _super);
        /**
         * Constructor.
         *
         * @param url URL to load.
         * @param postData_ Object containing POST data; if undefined a GET request will be used.
         * @param responseType Expected response type.
         *                     If undefined the static value set with tr.Xhr.setDefaultResponseType will be used.
         *                     If no default response-type is set this value defaults to tr.Xhr.ResponseType.TEXT.
         * @param name Optional task name.
         */
        function Xhr(url, postData_, responseType, name) {
            _super.call(this, name || "Xhr");
            this.postData_ = postData_;
            this.responseType_ = responseType || Xhr.DEFAULT_RESPONSE_TYPE || tr.enums.XhrResponseType.TEXT;
            this.url_ = url;
        }
        /**
         * Set the default response-type for all XHR requests that do not otherwise specify a response-type.
         */
        Xhr.setDefaultResponseType = function (responseType) {
            this.DEFAULT_RESPONSE_TYPE = responseType;
        };
        /**
         * The default response-type for this XHR requests.
         */
        Xhr.prototype.getResponseType = function () {
            return this.responseType_;
        };
        // Overrides ///////////////////////////////////////////////////////////////////////////////////////////////////////
        /** @inheritDoc */
        Xhr.prototype.interruptImpl = function () {
            if (this.xhr_ !== undefined) {
                this.xhr_.abort();
                this.xhr_ = undefined;
            }
        };
        /** @inheritDoc */
        Xhr.prototype.resetImpl = function () {
            this.xhr_ = undefined;
        };
        /** @inheritDoc */
        Xhr.prototype.runImpl = function () {
            try {
                var method = postDataString === undefined ? 'GET' : 'POST';
                var postDataString = this.createPostDataString_();
                this.xhr_ = new XMLHttpRequest();
                this.xhr_.addEventListener("load", this.onXhrRequestSuccess_.bind(this));
                this.xhr_.addEventListener("abort", this.onXhrRequestErrorOrTimeout_.bind(this));
                this.xhr_.addEventListener("error", this.onXhrRequestErrorOrTimeout_.bind(this));
                this.xhr_.addEventListener("timeout", this.onXhrRequestErrorOrTimeout_.bind(this));
                this.xhr_.open(method, this.url_, true);
                this.xhr_.send(postDataString);
            }
            catch (error) {
                if (this.getState() === tr.enums.State.RUNNING) {
                    this.errorInternal(error, error.message);
                }
            }
        };
        // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////
        Xhr.prototype.createPostDataString_ = function () {
            if (this.postData_ !== undefined) {
                return this.serialize(this.postData_);
            }
            return undefined;
        };
        Xhr.prototype.serialize = function (object, prefix) {
            var strings = [];
            for (var property in object) {
                if (object.hasOwnProperty(property)) {
                    var k = prefix ? prefix + "[" + property + "]" : property, v = object[property];
                    strings.push(typeof v == "object" ? this.serialize(v, k) : encodeURIComponent(k) + "=" + encodeURIComponent(v));
                }
            }
            return strings.join("&");
        };
        // Event handlers //////////////////////////////////////////////////////////////////////////////////////////////////
        /** @private */
        Xhr.prototype.onXhrRequestSuccess_ = function () {
            if (this.getState() === tr.enums.State.RUNNING) {
                try {
                    var data;
                    switch (this.responseType_) {
                        case tr.enums.XhrResponseType.JSON:
                            data = JSON.parse(this.xhr_.responseText);
                            break;
                        case tr.enums.XhrResponseType.TEXT:
                            data = this.xhr_.responseText;
                            break;
                        case tr.enums.XhrResponseType.XML:
                            data = this.xhr_.responseXML;
                            break;
                    }
                    this.completeInternal(data);
                }
                catch (error) {
                    this.errorInternal(error, "Invalid response");
                }
            }
        };
        /** @private */
        Xhr.prototype.onXhrRequestErrorOrTimeout_ = function () {
            if (this.getState() === tr.enums.State.RUNNING) {
                this.errorInternal(this.xhr_.status, this.xhr_.statusText);
            }
        };
        return Xhr;
    })(tr.Abstract);
    tr.Xhr = Xhr;
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    var enums;
    (function (enums) {
        /**
         * Enumeration of Task events.
         */
        (function (Event) {
            Event[Event["STARTED"] = "STARTED"] = "STARTED";
            Event[Event["INTERRUPTED"] = "INTERRUPTED"] = "INTERRUPTED";
            Event[Event["COMPLETED"] = "COMPLETED"] = "COMPLETED";
            Event[Event["ERRORED"] = "ERRORED"] = "ERRORED";
            Event[Event["FINAL"] = "FINAL"] = "FINAL";
        })(enums.Event || (enums.Event = {}));
        var Event = enums.Event;
        ;
    })(enums = tr.enums || (tr.enums = {}));
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    var enums;
    (function (enums) {
        /**
         * Enumeration of Task states.
         */
        (function (State) {
            State[State["INITIALIZED"] = "INITIALIZED"] = "INITIALIZED";
            State[State["RUNNING"] = "RUNNING"] = "RUNNING";
            State[State["INTERRUPTED"] = "INTERRUPTED"] = "INTERRUPTED";
            State[State["COMPLETED"] = "COMPLETED"] = "COMPLETED";
            State[State["ERRORED"] = "ERRORED"] = "ERRORED";
        })(enums.State || (enums.State = {}));
        var State = enums.State;
        ;
    })(enums = tr.enums || (tr.enums = {}));
})(tr || (tr = {}));
;
var tr;
(function (tr) {
    var enums;
    (function (enums) {
        /**
         * Enumeration of Xhr task response-types.
         */
        (function (XhrResponseType) {
            XhrResponseType[XhrResponseType["JSON"] = "JSON"] = "JSON";
            XhrResponseType[XhrResponseType["TEXT"] = "TEXT"] = "TEXT";
            XhrResponseType[XhrResponseType["XML"] = "XML"] = "XML";
        })(enums.XhrResponseType || (enums.XhrResponseType = {}));
        var XhrResponseType = enums.XhrResponseType;
        ;
    })(enums = tr.enums || (tr.enums = {}));
})(tr || (tr = {}));
;

return tr;
}));
