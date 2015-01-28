goog.provide('taskrunner.Task');



/**
 * A Task represents a job.
 * Tasks can be either synchronous or asynchronous.
 * They can be a single operation or a composite of other tasks.
 * This interface defines the minimum API that must be implemented by any job
 * within the Task Runner framework.
 *
 * The lifecycle of a task is as follows:
 * First, to start a task the run() method is called.
 * Once a task is running 3 things can happen:
 * (1) It can complete successfully
 * (2) It can fail
 * (3) It can be interrupted (or paused)
 *
 * When a task fails or is explicitly interrupted, it goes into an idle state.
 * It can be resumed from this state by calling run() again.
 * Tasks that complete (successfully) may also be run again if desired.
 *
 * Tasks may also be reset explicitly (using the reset() method) in which case
 * they should discard any pending data and go back to their initialized state.
 *
 * It is important to design your task with the above concepts in mind.
 * Plan for the fact that your task may be executed more than once, or
 * interrupted before it is ever able to complete execution.
 *
 * @interface
 */
taskrunner.Task = function() {};


/**
 * Optional data value passed to the Task complete/error/interruption method.
 *
 * @return {!Object|undefined}
 */
taskrunner.Task.prototype.getData = goog.abstractMethod;


/**
 * Additional information about the cause of a task error.
 *
 * @return {string|undefined}
 */
taskrunner.Task.prototype.getErrorMessage = goog.abstractMethod;


/**
 * Number of internal operations conducted by this task.
 *
 * @return {number}
 */
taskrunner.Task.prototype.getOperationsCount = goog.abstractMethod;


/**
 * Number of internal operations that have completed.
 *
 * @return {number}
 */
taskrunner.Task.prototype.getCompletedOperationsCount = goog.abstractMethod;


/**
 * Returns the state of the task.
 *
 * @return {!taskrunner.TaskState}
 */
taskrunner.Task.prototype.getState = goog.abstractMethod;


/**
 * Optional human-readable name, typically useful for debug purposes.
 *
 * @return {string|undefined}
 */
taskrunner.Task.prototype.getTaskName = goog.abstractMethod;


/**
 * Globally unique ID for the current Task-instance.
 *
 * Tasks should be assigned a unique ID when they are created.
 * IDs remain with their Tasks as long as the Tasks exist and are not reused.
 *
 * @return {number}
 */
taskrunner.Task.prototype.getUniqueID = goog.abstractMethod;


/**
 * Starts a task.
 * This method may also be used to re-run a task that has errorred or to resume
 * a task that has been interrupted.
 *
 * @throws {Error} if run() is called while a task is already running.
 * @return {!taskrunner.Task} a reference to the current task
 */
taskrunner.Task.prototype.run = goog.abstractMethod;


/**
 * Interrupts a running task.
 * An interrupted task can be resumed by calling run().
 *
 * @throws {Error} if called while a task is not running.
 * @return {!taskrunner.Task} a reference to the current task
 */
taskrunner.Task.prototype.interrupt = goog.abstractMethod;


/**
 * Interrupts a running task until another task has completed.
 * There can only be 1 active interrupting Task at a time.
 * Use a composite to interrupt for multiple tasks.
 *
 * This method will not start an interrupting task.
 * It must be run by the caller.
 *
 * @param {!taskrunner.Task} task to wait for
 * @throws {Error} if called while a task is not running.
 * @return {!taskrunner.Task} a reference to the current task
 */
taskrunner.Task.prototype.interruptForTask = goog.abstractMethod;


/**
 * Resets the task to it's initialized TaskState so that it can be re-run.
 * This method should not be called on a task that is running.
 *
 * @throws {Error} if reset() is for a task that is currently running.
 * @return {!taskrunner.Task} a reference to the current task
 */
taskrunner.Task.prototype.reset = goog.abstractMethod;


/**
 * Attach a callback function to a task event.
 *
 * @param {!taskrunner.TaskEvent} taskEvent
 * @param {function(!taskrunner.Task)} callback
 * @param {?=} opt_scope
 * @return {!taskrunner.Task} a reference to the current task
 */
taskrunner.Task.prototype.on = goog.abstractMethod;


/**
 * Dettach a callback function from a task event.
 *
 * @param {!taskrunner.TaskEvent} taskEvent
 * @param {function(!taskrunner.Task)} callback
 * @param {?=} opt_scope
 * @return {!taskrunner.Task} a reference to the current task
 */
taskrunner.Task.prototype.off = goog.abstractMethod;


/**
 * This callback will be invoked when a task is started.
 *
 * @param {function(!taskrunner.Task)} callback
 * @param {?=} opt_scope
 * @return {!taskrunner.Task} a reference to the current task
 */
taskrunner.Task.prototype.started = goog.abstractMethod;


/**
 * This callback will be invoked whenever this task is interrupted.
 *
 * @param {function(!taskrunner.Task)} callback
 * @param {?=} opt_scope
 * @return {!taskrunner.Task} a reference to the current task
 */
taskrunner.Task.prototype.interrupted = goog.abstractMethod;


/**
 * This callback will be invoked only upon successful completion of the task.
 * Callbacks may be called multiple times (if the task is run more than once).
 * Multiple callbacks may be registered with a task as well.
 *
 * @param {function(!taskrunner.Task)} callback
 * @param {?=} opt_scope
 * @return {!taskrunner.Task} a reference to the current task
 */
taskrunner.Task.prototype.completed = goog.abstractMethod;


/**
 * This callback will be invoked only upon a task error.
 * Callbacks may be called multiple times (if the task is run more than once).
 * Multiple callbacks may be registered with a task as well.
 *
 * @param {function(!taskrunner.Task)} callback
 * @param {?=} opt_scope
 * @return {!taskrunner.Task} a reference to the current task
 */
taskrunner.Task.prototype.errored = goog.abstractMethod;


/**
 * This callback will be invoked after a task has completed or errorred.
 *
 * @param {function(!taskrunner.Task)} callback
 * @param {?=} opt_scope
 * @return {!taskrunner.Task} a reference to the current task
 */
taskrunner.Task.prototype.final = goog.abstractMethod;
