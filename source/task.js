goog.provide('tr.Task');



/**
 * Represents a unit of work.
 * 
 * <p>Tasks can be either synchronous or asynchronous.
 * They can be a single operation or a composite of other tasks.
 * This interface defines the minimum API that must be implemented by any job
 * within the Task Runner framework.
 *
 * 
 * <p>The lifecycle of a task is as follows:
 * <ol>
 * <li>First, to start a task the run() method is called.
 * <li>Once a task is running 3 things can happen:
 * <ol>
 * <li>It can complete successfully
 * <li>It can fail
 * <li>It can be interrupted (or paused)
 * </ol>
 * </ol>
 *
 * <p>When a task fails or is explicitly interrupted, it goes into an idle state.
 * It can be resumed from this state by calling run() again.
 * Tasks that complete (successfully) may also be run again if desired.
 *
 * <p>Tasks may also be reset explicitly (using the reset() method) in which case
 * they should discard any pending data and go back to their initialized state.
 *
 * <p>It is important to design your task with the above concepts in mind.
 * Plan for the fact that your task may be executed more than once, or
 * interrupted before it is ever able to complete execution.
 *
 * @interface
 */
tr.Task = function() {};


/**
 * Optional data value passed to the Task complete/error/interruption method.
 *
 * @return {!Object|undefined}
 */
tr.Task.prototype.getData = goog.abstractMethod;


/**
 * Additional information about the cause of a task error.
 *
 * @return {string|undefined}
 */
tr.Task.prototype.getErrorMessage = goog.abstractMethod;


/**
 * Number of internal operations conducted by this tr.
 *
 * @return {number}
 */
tr.Task.prototype.getOperationsCount = goog.abstractMethod;


/**
 * Number of internal operations that have completed.
 *
 * @return {number}
 */
tr.Task.prototype.getCompletedOperationsCount = goog.abstractMethod;


/**
 * Returns the state of the tr.
 *
 * @return {!tr.enums.State}
 */
tr.Task.prototype.getState = goog.abstractMethod;


/**
 * Optional human-readable name, typically useful for debug purposes.
 *
 * @return {string|undefined}
 */
tr.Task.prototype.getTaskName = goog.abstractMethod;


/**
 * Globally unique ID for the current Task-instance.
 *
 * Tasks should be assigned a unique ID when they are created.
 * IDs remain with their Tasks as long as the Tasks exist and are not reused.
 *
 * @return {number}
 */
tr.Task.prototype.getUniqueID = goog.abstractMethod;


/**
 * Starts a tr.
 * This method may also be used to re-run a task that has errorred or to resume
 * a task that has been interrupted.
 *
 * @throws {Error} if run() is called while a task is already running.
 * @return {!tr.Task} a reference to the current task
 */
tr.Task.prototype.run = goog.abstractMethod;


/**
 * Interrupts a running tr.
 * An interrupted task can be resumed by calling run().
 *
 * @throws {Error} if called while a task is not running.
 * @return {!tr.Task} a reference to the current task
 */
tr.Task.prototype.interrupt = goog.abstractMethod;


/**
 * Interrupts a running task until another task has completed.
 * There can only be 1 active interrupting Task at a time.
 * Use a composite to interrupt for multiple tasks.
 *
 * This method will not start an interrupting tr.
 * It must be run by the caller.
 *
 * @param {!tr.Task} task to wait for
 * @throws {Error} if called while a task is not running.
 * @return {!tr.Task} a reference to the current task
 */
tr.Task.prototype.interruptForTask = goog.abstractMethod;


/**
 * Resets the task to it's initialized TaskState so that it can be re-run.
 * This method should not be called on a task that is running.
 *
 * @throws {Error} if reset() is for a task that is currently running.
 * @return {!tr.Task} a reference to the current task
 */
tr.Task.prototype.reset = goog.abstractMethod;


/**
 * Attach a callback function to a task event.
 *
 * @param {!tr.enums.Event} taskEvent
 * @param {function(!tr.Task)} callback
 * @param {Object=} opt_scope
 * @return {!tr.Task} a reference to the current task
 */
tr.Task.prototype.on = goog.abstractMethod;


/**
 * Dettach a callback function from a task event.
 *
 * @param {!tr.enums.Event} taskEvent
 * @param {function(!tr.Task)} callback
 * @param {Object=} opt_scope
 * @return {!tr.Task} a reference to the current task
 */
tr.Task.prototype.off = goog.abstractMethod;


/**
 * This callback will be invoked when a task is started.
 *
 * @param {function(!tr.Task)} callback
 * @param {Object=} opt_scope
 * @return {!tr.Task} a reference to the current task
 */
tr.Task.prototype.started = goog.abstractMethod;


/**
 * This callback will be invoked whenever this task is interrupted.
 *
 * @param {function(!tr.Task)} callback
 * @param {Object=} opt_scope
 * @return {!tr.Task} a reference to the current task
 */
tr.Task.prototype.interrupted = goog.abstractMethod;


/**
 * This callback will be invoked only upon successful completion of the tr.
 * Callbacks may be called multiple times (if the task is run more than once).
 * Multiple callbacks may be registered with a task as well.
 *
 * @param {function(!tr.Task)} callback
 * @param {Object=} opt_scope
 * @return {!tr.Task} a reference to the current task
 */
tr.Task.prototype.completed = goog.abstractMethod;


/**
 * This callback will be invoked only upon a task error.
 * Callbacks may be called multiple times (if the task is run more than once).
 * Multiple callbacks may be registered with a task as well.
 *
 * @param {function(!tr.Task)} callback
 * @param {Object=} opt_scope
 * @return {!tr.Task} a reference to the current task
 */
tr.Task.prototype.errored = goog.abstractMethod;


/**
 * This callback will be invoked after a task has completed or errorred.
 *
 * @param {function(!tr.Task)} callback
 * @param {Object=} opt_scope
 * @return {!tr.Task} a reference to the current task
 */
tr.Task.prototype.final = goog.abstractMethod;
