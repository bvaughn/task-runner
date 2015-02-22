module tr {

  /**
   * Represents a unit of work.
   *
   * <p>Tasks can be either synchronous or asynchronous.
   * They can be a single operation or a composite of other tasks.
   * This interface defines the minimum API that must be implemented by any job
   * within the Task Runner framework.
   *
   * <p>The lifecycle of a task is as follows:
   *
   * <ol>
   *   <li>First, to start a task the run() method is called.
   *   <li>Once a task is running 3 things can happen:
   *   <ol>
   *     <li>It can complete successfully
   *     <li>It can fail
   *     <li>It can be interrupted (or paused)
   *   </ol>
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
   */
  export interface Task {

    /**
     * Optional data value passed to the Task complete/error/interruption method.
     */
    getData():any;

    /**
     * Additional information about the cause of a task error.
     */
    getErrorMessage():string;

    /**
     * Number of internal operations conducted by this task.
     */
    getOperationsCount():number;

    /**
     * Number of internal operations that have completed.
     */
    getCompletedOperationsCount():number;

    /**
     * Context information about where this task was created.
     * This information can help locate and debug errored tasks.
     *
     * <p>This property is only available in the debug build of Task Runner.
     */
    getCreationContext():string;

    /**
     * Optional human-readable name, typically useful for debug purposes.
     */
    getName():string;

    /**
     * Returns the state of the task.
     */
    getState():tr.enums.State;

    /**
     * Globally unique ID for the current Task-instance.
     *
     * <p>Tasks should be assigned a unique ID when they are created.
     * IDs remain with their Tasks as long as the Tasks exist and are not reused.
     */
    getUniqueID():number;

    /**
     * Starts a task.
     *
     * <p>This method may also be used to re-run a task that has errorred or to resume
     * a task that has been interrupted.
     *
     * @throws Error if run() is called while a task is already running.
     * @return A reference to the current task.
     */
    run():tr.Task;

    /**
     * Interrupts a running task.
     * An interrupted task can be resumed by calling run().
     *
     * @throws Error if called while a task is not running.
     * @return A reference to the current task.
     */
    interrupt():tr.Task;

    /**
     * Interrupts a running task until another task has completed.
     * There can only be 1 active interrupting Task at a time.
     * Use a composite to interrupt for multiple tasks.
     *
     * <p>This method will not start an interrupting task.
     * It must be run by the caller.
     *
     * @param task to wait for
     * @throws Error if called while a task is not running.
     * @return A reference to the current task.
     */
    interruptFor(task:tr.Task):tr.Task;

    /**
     * Resets the task to it's initialized TaskState so that it can be re-run.
     * This method should not be called on a task that is running.
     *
     * @throws Error if reset() is for a task that is currently running.
     * @return A reference to the current task.
     */
    reset():tr.Task;

    /**
     * Attach a callback function to a task event.
     *
     * @param taskEvent
     * @param callback
     * @param optional Optional scope
     * @return A reference to the current task.
     */
    on(event:tr.enums.Event, callback:Function, scope?:any):tr.Task;

    /**
     * Dettach a callback function from a task event.
     *
     * @param taskEvent
     * @param callback
     * @param optional Optional scope
     * @return A reference to the current task.
     */
    off(event:tr.enums.Event, callback:Function, scope?:any):tr.Task;

    /**
     * This callback will be invoked when a task is started.
     *
     * @param callback
     * @param optional Optional scope
     * @return A reference to the current task.
     */
    started(callback:Function, scope?:any):tr.Task;

    /**
     * This callback will be invoked whenever this task is interrupted.
     *
     * @param callback
     * @param optional Optional scope
     * @return A reference to the current task.
     */
    interrupted(callback:Function, scope?:any):tr.Task;

    /**
     * This callback will be invoked only upon successful completion of the task.
     * Callbacks may be called multiple times (if the task is run more than once).
     * Multiple callbacks may be registered with a task as well.
     *
     * @param callback
     * @param optional Optional scope
     * @return A reference to the current task.
     */
    completed(callback:Function, scope?:any):tr.Task;

    /**
     * This callback will be invoked only upon a task error.
     * Callbacks may be called multiple times (if the task is run more than once).
     * Multiple callbacks may be registered with a task as well.
     *
     * @param callback
     * @param optional Optional scope
     * @return A reference to the current task.
     */
    errored(callback:Function, scope?:any):tr.Task;

    /**
     * This callback will be invoked after a task has completed or errored.
     *
     * @param callback
     * @param optional Optional scope
     * @return A reference to the current task.
     */
    final(callback:Function, scope?:any):tr.Task;
  }
};