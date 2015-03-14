/// <reference path="../definitions/angular.d.ts" />
/// <reference path="../definitions/jquery.d.ts" />
/// <reference path="../definitions/promise.d.ts" />
/// <reference path="../definitions/q.d.ts" />
declare module tr {
    /**
     * Abstract implementation of Task.
     *
     * <p>To create a Task extend this class and override runImpl(), interruptImpl(), and resetImpl().
     *
     * <p>Your Task should call completeInternal() or errorInternal() when it is done.
     */
    class Abstract implements tr.Task {
        static UNIQUE_ID_COUNTER: number;
        private creationContext_;
        private data_;
        private errorMessage_;
        private interruptingTask_;
        private console_;
        private name_;
        private state_;
        private taskCallbackMap_;
        private uniqueID_;
        /**
         * Constructor.
         *
         * @param name Optional task name, useful for automated testing or debugging.
         *             Sub-classes should specify a default equal to the name of the class.
         */
        constructor(name?: string);
        /**
         * Debug logger for tasks.
         *
         * <p>Messages are logged with task information (id and name) for debugging purposes.
         * These log messages are disabled in production builds.
         *
         * @param text String to log to the console (if in debug mode)
         */
        protected log(text: string): void;
        /** @inheritDoc */
        toString(): string;
        /** @inheritDoc */
        getCompletedOperationsCount(): number;
        /** @inheritDoc */
        getCreationContext(): string;
        /** @inheritDoc */
        getData(): any;
        /** @inheritDoc */
        getErrorMessage(): string;
        /** @inheritDoc */
        getName(): string;
        /** @inheritDoc */
        getOperationsCount(): number;
        /** @inheritDoc */
        getState(): tr.enums.State;
        /** @inheritDoc */
        getUniqueID(): number;
        /** @inheritDoc */
        completed(callback: (task: tr.Task) => void, scope?: any): tr.Task;
        /** @inheritDoc */
        errored(callback: (task: tr.Task) => void, scope?: any): tr.Task;
        /** @inheritDoc */
        final(callback: (task: tr.Task) => void, scope?: any): tr.Task;
        /** @inheritDoc */
        interrupt(): tr.Task;
        /** @inheritDoc */
        interrupted(callback: (task: tr.Task) => void, scope?: Object): tr.Task;
        /** @inheritDoc */
        interruptFor(interruptingTask: tr.Task): tr.Task;
        /** @inheritDoc */
        off(event: tr.enums.Event, callback: (task: tr.Task) => void, scope?: any): tr.Task;
        /** @inheritDoc */
        on(event: tr.enums.Event, callback: (task: tr.Task) => void, scope?: any): tr.Task;
        /** @inheritDoc */
        reset(): tr.Task;
        /** @inheritDoc */
        run(): tr.Task;
        /** @inheritDoc */
        started(callback: (task: tr.Task) => void, scope?: any): tr.Task;
        isCompleted(): boolean;
        isErrored(): boolean;
        isInitialized(): boolean;
        isInterrupted(): boolean;
        isRunning(): boolean;
        /**
         * Call this method to mark the task as complete.
         */
        protected completeInternal(data?: any): void;
        /**
         * Call this method to mark the task as errored.
         */
        protected errorInternal(data?: any, errorMessage?: string): void;
        /**
         * Executes an array of callback functions with the current task as the only parameter.
         */
        protected executeCallbacks(event: tr.enums.Event): void;
        /**
         * This method is called each time a task is interrupted.
         */
        protected interruptImpl(): void;
        /**
         * This method is called each time a task is reset.
         * Override it to perform custom cleanup between task-runs.
         */
        protected resetImpl(): void;
        /**
         * This method is called each time a task is run.
         * Call completeInternal() or errorInternal() when the task is finished.
         */
        protected runImpl(): void;
    }
}
declare module tr {
    /**
     * Lightweight interface to create a dependency graph task.
     */
    class Chain extends tr.Abstract {
        private graph_;
        private mostRecentTaskArgs_;
        /**
         * Constructor.
         *
         * @param completedCallback Optional on-complete callback method.
         * @param erroredCallback Optional on-error callback method.
         * @param name Optional task name.
         */
        constructor(completedCallback?: (task: tr.Task) => void, erroredCallback?: (task: tr.Task) => void, name?: string);
        /**
         * Alias for "or".
         *
         * @param ...tasks One or more tasks
         * @return A reference to the current task.
         */
        else(...tasks: tr.Task[]): tr.Chain;
        /**
         * Add one or more tasks to the beginning of the chain.
         *
         * @param ...tasks One or more tasks
         * @return A reference to the current task.
         * @throws Error if this method is called once tasks have already been added to the chain.
         */
        first(...tasks: tr.Task[]): tr.Chain;
        /**
         * Returns the inner decorated Graph task.
         */
        getDecoratedTask(): tr.Graph;
        /**
         * Add one or more tasks to be run only if one of the previously-added tasks fail.
         *
         * @param ...tasks One or more tasks
         * @return A reference to the current task.
         */
        or(...tasks: tr.Task[]): tr.Chain;
        /**
         * Alias for "or".
         *
         * @param ...tasks One or more tasks
         * @return A reference to the current task.
         */
        otherwise(...tasks: tr.Task[]): tr.Chain;
        /**
         * Add one or more tasks to be run after the tasks already in this chain have been run.
         *
         * @param ...tasks One or more tasks
         * @return A reference to the current task.
         */
        then(...tasks: tr.Task[]): tr.Chain;
        /** @inheritDoc */
        getOperationsCount(): number;
        /** @inheritDoc */
        getCompletedOperationsCount(): number;
        /** @inheritDoc */
        protected runImpl(): void;
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected resetImpl(): void;
    }
}
declare module tr {
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
    class Closure extends tr.Abstract {
        autoCompleteUponRun_: boolean;
        protected runImplFn_: (task: tr.Closure) => void;
        /**
         * Constructor.
         *
         * @param runImplFn The function to be executed when this Task is run.
         *                  ClosureTask will pass a reference to itself to the function.
         * @param synchronous This task should auto-complete when run.
         * @param name Optional task name.
         */
        constructor(runImplFn: (task: tr.Closure) => void, synchronous?: boolean, name?: string);
        /** @override */
        protected runImpl(): void;
        /**
         * Complete this task.
         *
         * @param data Task data to be later accessible via getData().
         */
        complete(data?: any): void;
        /**
         * Error this task.
         *
         * @param data Error data to be later accessible via getData().
         * @param errorMessage Error message to be later accessible via getErrorMessage()
         */
        error(data?: any, errorMessage?: string): void;
    }
}
declare module tr {
    /**
     * Executes a set of Tasks either in parallel or one after another.
     */
    class Composite extends tr.Abstract {
        private completedTasks_;
        private erroredTasks_;
        private flushQueueInProgress_;
        private parallel_;
        private taskQueue_;
        private taskQueueIndex_;
        /**
         * Constructor.
         *
         * @param parallel If TRUE, child tasks are run simultaneously;
         *                 otherwise they are run serially, in the order they were added.
         * @param tasks Initial set of child tasks.
         * @param name Optional task name.
         */
        constructor(parallel: boolean, tasks?: Array<tr.Task>, name?: string);
        /**
         * Adds a task to the list of child tasks.
         *
         * @param {!tr.Task} task Child task to be run when this task is run.
         * @return {!tr.Composite} a reference to the current task.
         * @throws {Error} if task has been added more than once
         */
        add(task: tr.Task): tr.Composite;
        /**
         * Adds a set of tasks to the list of child tasks.
         *
         * @param tasks Child tasks to be added
         * @return A reference to the current task.
         * @throws Error if tasks have been added more than once
         */
        addAll(tasks: Array<tr.Task>): tr.Composite;
        /**
         * Removes a task from the list of child tasks.
         *
         * @param {!tr.Task} task Child task to be removed from the graph.
         * @return {!tr.Composite} a reference to the current task.
         * @throws {Error} if the task provided is not a child of this composite.
         */
        remove(task: tr.Task): tr.Composite;
        /** @inheritDoc */
        getCompletedOperationsCount(): number;
        /** @inheritDoc */
        getOperationsCount(): number;
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected resetImpl(): void;
        /** @inheritDoc */
        protected runImpl(): void;
        /**
         * Adds completed and errored callback handlers to child Task.
         *
         * @param task Child task
         */
        private addCallbacks_(task);
        /**
         * Are all child tasks completed?
         */
        private allTasksAreCompleted_();
        /**
         * Checks for completion (or failure) of child tasks and triggers callbacks.
         */
        private checkForTaskCompletion_();
        /**
         * Callback for child task completions.
         *
         * @param task Task that has just completed.
         */
        private childTaskCompleted_(task);
        /**
         * Callback for child task errors.
         *
         * @param task Task that has just errored.
         */
        private childTaskErrored_(task);
        /**
         * Invoke a callback once for each Task in the queue.
         *
         * @param callback Callback function
         */
        private eachTaskInQueue_(callback);
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
        protected flushQueue(doNotComplete: any): void;
        /**
         * Removes completed and errored callback handlers from child Task.
         *
         * @param task Child task
         */
        private removeCallbacks_(task);
        /**
         * Convenience method for handling a completed Task and executing the next.
         *
         * @param task Task that has either been removed from the queue or has completed successfully.
         */
        private taskCompletedOrRemoved_(task);
    }
}
declare module tr {
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
    class Graph extends tr.Abstract {
        private beforeFirstRunInvoked_;
        private erroredTasks_;
        private taskIdToDependenciesMap_;
        private tasks_;
        /**
         * Constructor.
         *
         * @param name Optional task name.
         */
        constructor(name?: any);
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
        add(task: tr.Task, blockers?: Array<tr.Task>): tr.Graph;
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
        addAll(tasks: Array<tr.Task>, blockers?: Array<tr.Task>): tr.Graph;
        /**
         * Convenience method for adding a task to the "end" of the dependency graph.
         * In other words, this task will be blocked by all tasks already in the graph.
         *
         * @param task Child task to be run when this task is run.
         * @return A reference to the current task.
         * @throws Error if task has been added more than once.
         * @throws Error if cyclic dependencies are detected.
         */
        addToEnd(task: tr.Task): tr.Graph;
        /**
         * Convenience method for adding multiple tasks to the "end" of the dependency graph.
         * In other words, these tasks will be blocked by all tasks already in the graph.
         *
         * @param tasks Child tasks to be run when this task is run.
         * @return A reference to the current task.
         * @throws Error if task has been added more than once.
         */
        addAllToEnd(tasks: Array<tr.Task>): tr.Graph;
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
        addBlockersTo(blockers: Array<tr.Task>, tasks: Array<tr.Task>): tr.Graph;
        /**
         * Removes a child task from the dependency graph and ensures that the remaining dependencies are still valid.
         *
         * @param task Child task to be removed from the graph.
         * @return A reference to the current task.
         * @throws Error if the task provided is not within the dependency graph,
         *         or if removing the task invalidates any other, blocked tasks.
         */
        remove(task: tr.Task): tr.Graph;
        /**
         * Removes child tasks from the dependency graph and ensures that the remaining dependencies are still valid.
         *
         * @param {!Array.<!tr.Task>} tasks Child tasks to be removed.
         * @return {!tr.Graph} a reference to the current task.
         * @throws Error if any of the tasks provided is not within the dependency graph,
         *         or if removing them invalidates any other, blocked tasks.
         */
        removeAll(tasks: Array<tr.Task>): tr.Graph;
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
        removeBlockersFrom(blockers: Array<tr.Task>, tasks: Array<tr.Task>): tr.Graph;
        /** @inheritDoc */
        getOperationsCount(): number;
        /** @inheritDoc */
        getCompletedOperationsCount(): number;
        /** @inheritDoc */
        protected runImpl(): void;
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected resetImpl(): void;
        /**
         * Subclasses may override this method to just-in-time add child Tasks before the composite is run.
         */
        protected beforeFirstRun(): void;
        /**
         * Add callbacks to the specified task.
         *
         * @param task Child task
         */
        private addCallbacksTo_(task);
        /**
         * @return {boolean} All child tasks have completed.
         * @private
         */
        private areAllTasksCompleted_();
        /**
         * Callback for child task completions.
         *
         * @param task Task that has just completed.
         */
        private childTaskCompleted_(task);
        /**
         * Callback for child task errors.
         *
         * @param task Task that has just errored.
         */
        private childTaskErrored_(task);
        /**
         * Check child tasks to see if the graph has completed or errored.
         * If not, this method will run the next task(s).
         */
        private completeOrRunNext_();
        /**
         * Determines if a task is safe to run by analyzing its blocking dependencies.
         *
         * @param task Child task
         * @return The specified task has incomplete blocking tasks.
         */
        private hasIncompleteBlockers_(task);
        /**
         * Is at least one child task is running?
         */
        private isAnyTaskRunning_();
        /**
         * Add callbacks from the specified task.
         *
         * @param task Child task
         */
        private removeCallbacksFrom_(task);
        /**
         * Run every non-running task that is not blocked by another incomplete task.
         */
        private runAllReadyTasks_();
        /**
         * Helper function to updates blocking dependencies for the specified task.
         *
         * @param tasks Array of tasks for which to add blockers.
         * @param blockers Array of blocking tasks to be added.
         * @throws Error if either tasks or blockers are not already in the graph.
         * @throws Error if blockers have been added to tasks that are already running.
         */
        private updateBlockers_(tasks, blockers);
        /**
         * Checks the specified task to ensure that it does not have any cyclic
         * dependencies (tasks that are mutually dependent) or dependencies on tasks
         * that are not in the current graph.
         *
         * @param task Child task
         * @throws Error if cyclic or invalid dependencies are detected.
         */
        private validateDependencies_(task);
        /**
         * Verifies that all of the specified tasks are within the graph.
         *
         * @param tasks Array of tasks.
         * @param errorMessage Error message if one or more tasks not in graph.
         * @throws Error if any of the tasks are not in the graph.
         */
        private verifyInGraph_(tasks, errorMessage);
    }
}
declare module tr {
    /**
     * Runs a series of tasks and chooses the highest priority resolution (task) based on their outcome.
     *
     * <p>Once a resolution is chosen, it is added to the graph and run (last) before completion.
     * This type of task can be used to creating branching logic within the flow or a larger sequence of tasks.
     *
     * <p>If no resolutions are valid, this task will error.
     */
    class Conditional extends tr.Graph {
        private allConditionsHaveCompletedClosure_;
        private chooseFirstAvailableOutcome_;
        private chosenOutcome_;
        private conditionIdsToFailsafeWrappersMap_;
        private conditions_;
        private outcomeIdToBlockingTasksMap_;
        private prioritizedOutcomes_;
        /**
         * Constructor.
         *
         * @param chooseFirstAvailableOutcome If TRUE, the first available outcome will be run.
         *                                    All remaining conditions will be interrupted and ignored.
         *                                    This value defaults to FALSE,
         *                                    Meaning that all pre-conditions will be allowed to finish before an outcome is chosen.
         * @param name Optional task name.
         */
        constructor(chooseFirstAvailableOutcome?: boolean, name?: string);
        /**
         * The outcome that was chosen based on the result of the condition tasks.
         * This method may return `undefined` if no outcome has been chosen.
         */
        getChosenOutcome(): tr.Task;
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
         * @throws Error if more than one outcome is added without conditions.
         * @throws Error if chooseFirstAvailableOutcome is TRUE and no conditions are specified.
         */
        addOutcome(outcome: tr.Task, conditions?: Array<tr.Task>): tr.Conditional;
        /**
         * Alias for addOutcome().
         *
         * @see addOutcome()
         */
        addIf(outcome: tr.Task, conditions: Array<tr.Task>): tr.Conditional;
        /**
         * Alias for addOutcome().
         *
         * @see addOutcome()
         */
        addElse(outcome: tr.Task): tr.Conditional;
        private allConditionsHaveCompleted_();
        /** @inheritDoc */
        protected beforeFirstRun(): void;
        /**
         * Picks the highest priority resolution (task) that meets all blocking dependencies.
         * @private
         */
        private chooseOutcomeIfValid_();
        private maybeChooseEarlyOutcome_();
    }
}
declare module tr {
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
    class Decorator extends tr.Abstract {
        private decorated_;
        /**
         * Constructor.
         *
         * @param decorated JavaScript object to decorate with task functionality.
         * @param name Optional task name.
         * @throws Error if required method "run" not implemented by "decorated".
         */
        constructor(decorated: tr.Task, name?: string);
        /**
         * Returns the decorated object.
         *
         * @return {Object}
         */
        getDecorated(): void;
        /** @override */
        protected runImpl(): void;
        /** @override */
        protected interruptImpl(): void;
        /** @override */
        protected resetImpl(): void;
        /**
         * Complete this task.
         *
         * @param data Task data to be later accessible via getData().
         */
        private complete_(data);
        /**
         * Error this task.
         *
         * @param data Error data to be later accessible via getData().
         * @param errorMessage Error message to be later accessible via getErrorMessage()
         */
        private error_(data, errorMessage);
        /**
         * Is the specified decorated property a function?
         * @param property Name of property on decorated object
         */
        private isFunction_(property);
    }
}
declare module tr {
    /**
     * Creates and decorates a task returned by the callback.
     *
     * <p>Use this type of task when an important decision needs to be deferred.
     * For example if you need a task to load some data, but the specifics aren't known when your application is initialized.
     * This type of task allows for just-in-time evaluation of data resolved by previous Tasks.
     */
    class Factory extends tr.Abstract {
        private taskFactoryFn_;
        private thisArg_;
        private argsArray_;
        private deferredTask_;
        private recreateDeferredTaskAfterError_;
        private deferredTaskErrored_;
        /**
         * Constructor.
         *
         * @param taskFactoryFunction The function to create an Task object.
         * @param thisArg Optional 'this' argument to invoke taskFactoryFn with.
         * @param argsArray Optional arguments array to invoke taskFactoryFn with.
         * @param name Optional task name.
         */
        constructor(taskFactoryFunction: (...args: any[]) => tr.Task, thisArg?: any, argsArray?: Array<any>, name?: string);
        /**
         * Returns the decorated Task, created by the factory function.
         */
        getDecoratedTask(): tr.Task;
        /**
         * Set whether to recreate the deferred task after an error occurred.
         * This property is sticky for all consecutive reruns until set again.
         */
        recreateDeferredTaskAfterError(value: boolean): void;
        /** @inheritDoc */
        protected resetImpl(): void;
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected runImpl(): void;
        /**
         * Event handler for when the deferred task is complete.
         */
        private onDeferredTaskCompleted_(task);
        /**
         * Event handler for when the deferred task errored.
         */
        private onDeferredTaskErrored_(task);
        /**
         * Event handler for when the deferred task is interrupted.
         */
        private onDeferredTaskInterrupted_(task);
        /**
         * Removes the deferred task callbacks.
         */
        private removeCallbacks_();
    }
}
declare module tr {
    /**
     * Decorates a task and re-dispatches errors as successful completions.
     *
     * <p>This can be used to decorate tasks that are not essential.
     */
    class Failsafe extends tr.Abstract {
        private decoratedTask_;
        /**
         * Constructor.
         *
         * @param decoratedTask Decorated task to be run when this task is run.
         * @param name Optional task name.
         */
        constructor(decoratedTask: tr.Task, name?: string);
        /**
         * Returns the inner decorated Task.
         */
        getDecoratedTask(): tr.Task;
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected resetImpl(): void;
        /** @inheritDoc */
        protected runImpl(): void;
    }
}
declare module tr {
    /**
     * Invokes a callback at an interval until instructed to stop.
     *
     * <p>This type of task can be used to perform open-ended or non-deterministic actions.
     * It will run until instructed to complete (or error) by the provided callback.
     */
    class Interval extends tr.Abstract {
        protected callback_: (task: tr.Interval) => void;
        private interval_;
        private timeoutId_;
        /**
         * Constructor.
         *
         * @param callback Callback invoked once per timer tick.
         * @param interval Time in milliseconds between ticks.
         * @param name Optional task name.
         */
        constructor(callback: (task: tr.Interval) => void, interval: number, name?: string);
        /**
         * Complete this task.
         *
         * @param data Task data to be later accessible via getData().
         */
        complete(data?: any): void;
        /**
         * Error this task.
         *
         * @param data Error data to be later accessible via getData().
         * @param errorMessage Error message to be later accessible via getErrorMessage()
         */
        error(data?: any, errorMessage?: string): void;
        /**
         * Adjust the interval between timer ticks.
         */
        setInterval(interval: number): void;
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected resetImpl(): void;
        /** @inheritDoc */
        protected runImpl(): void;
        private queueNextTick_();
        private stopTimer_();
        private onTimeout_();
    }
}
declare module tr {
    /**
     * Waits for an event-dispatching target to trigger a specific type of event.
     */
    class Listener extends tr.Abstract {
        private eventTarget_;
        private eventType_;
        private listener_;
        /**
         * Constructor.
         *
         * @param eventTarget Event-dispatching target.
         * @param eventType Type of event to wait for.
         * @param name Optional task name.
         */
        constructor(eventTarget: HTMLElement, eventType: string, name?: string);
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected resetImpl(): void;
        /** @inheritDoc */
        protected runImpl(): void;
    }
}
declare module tr {
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
    class Observer extends tr.Abstract {
        private failUponFirstError_;
        private observedTasks_;
        /**
         * Constructor.
         *
         * @param tasks The array of Tasks to observe.
         * @param failUponFirstError Whether to error the observer task immediately when one of the observed tasks errors.
         * @param name Optional task name.
         */
        constructor(tasks: Array<tr.Task>, failUponFirstError: boolean, name?: string);
        /**
         * Returns a list of observed tasks.
         */
        getObservedTasks(): Array<tr.Task>;
        /**
         * Add an additional Task to observe.
         * @param task
         * @return A reference to the current task.
         */
        observe(task: tr.Task): tr.Observer;
        /**
         * Stops a Task from being observed.
         * @param task
         * @return A reference to the current task.
         */
        stopObserving(task: tr.Task): tr.Observer;
        /** @override */
        getCompletedOperationsCount(): number;
        /** @override */
        getOperationsCount(): number;
        /** @override */
        protected runImpl(): void;
        /**
         * Event handler for when the observed task is complete.
         */
        private onObservedTaskCompleted_(task);
        /**
         * Event handler for when the observed task errored.
         */
        private onObservedTaskErrored_(task);
        /**
         * Try to complete or error the observer task based on the states of the observed tasks, if the observer is running.
         */
        private tryToFinalize_();
    }
}
declare module tr {
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
    class Promise extends tr.Abstract {
        private promise_;
        /**
         * Constructor.
         *
         * @param promise A Promise object
         * @param name Optional task name.
         * @throws Erorr if invalid Promise object provided.
         * @throws Erorr if no supported Promise libraries are detected.
         */
        constructor(promise: any, name?: string);
        /** @inheritDoc */
        protected runImpl(): void;
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
        static promiseToTask(promise: any, name?: string): Promise;
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
        static taskToPromise(task: tr.Task, $q?: ng.IQService): any;
        /**
         * @see https://docs.angularjs.org/api/ng/service/$q
         */
        static createAngularPromise_: (task: Task, $q: ng.IQService) => ng.IPromise<any>;
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
         */
        static createES6PromisePromise_: (task: Task) => es6.Promise;
        /**
         * @see http://api.jquery.com/deferred.promise/
         */
        static createJQueryPromise_: (task: Task) => JQueryPromise<any>;
        /**
         * @see https://github.com/kriskowal/q
         */
        static createQPromise_: (task: Task) => Object;
        /**
         * Detects is Angular is present.
         */
        private static isAngularDetected();
        /**
         * Detects is ES6 Promise.prototype is supported.
         */
        private static isES6Detected();
        /**
         * Detects is jQuery is present.
         */
        private static isJQueryDetected();
        /**
         * Detects is Q is present.
         */
        private static isQDetected();
        /**
         * Completes with the specified data only if/once the task is running.
         * @param data Data
         */
        private completeIfRunning_(data);
        /**
         * Errors with the specified data and message only if/once the task is running.
         * @param data Data
         * @param errorMessage Error message
         * @private
         */
        private errorIfRunning_(data, errorMessage);
        /**
         * @see https://docs.angularjs.org/api/ng/service/$q
         */
        private observeForAngular_(promise);
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
         */
        private observeForES6_(promise);
        /**
         * @see http://api.jquery.com/deferred.promise/
         */
        private observeForJQuery_(promise);
        /**
         * @see https://github.com/kriskowal/q
         */
        private observeForQ_(promise);
    }
}
declare module tr {
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
    class Retry extends tr.Abstract {
        /**
         * The default max number of times to reset and re-run the decorated Task before erroring the retry task.
         */
        static MAX_RETRIES_: Number;
        /**
         * The default amount of time to delay before resetting and re-running the decorated Task.
         */
        static RETRY_DELAY_: number;
        private decoratedTask_;
        private maxRetries_;
        private retries_;
        private retryDelay_;
        private timeoutId_;
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
        constructor(task: tr.Task, maxRetries: number, retryDelay: number, name?: string);
        /**
         * The inner decorated Task.
         */
        getDecoratedTask(): tr.Task;
        /**
         * The number of retries attempted.
         */
        getRetries(): number;
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected resetImpl(): void;
        /** @inheritDoc */
        protected runImpl(): void;
        /**
         * Event handler for when the deferred task is complete.
         * @param {!tr.Task} task
         * @private
         */
        private onDecoratedTaskCompleted_(task);
        /**
         * Event handler for when the deferred task errored.
         * @param {!tr.Task} task
         * @private
         */
        private onDecoratedTaskErrored_(task);
        /**
         * Removes the decorated task callbacks.
         */
        private removeCallbacks_();
        /**
         * Stops the running timer.
         */
        private stopTimer_();
    }
}
declare module tr {
    /**
     * Waits for an amount of time to pass before completing.
     *
     * <p>Resuming an interrupted task can either restart the timer at the beginning or resume from the interrupted point.
     */
    class Sleep extends tr.Abstract {
        private resetTimerAfterInterruption_;
        private timeout_;
        private timeoutId_;
        private timeoutPause_;
        private timeoutStart_;
        /**
         * Constructor.
         *
         * @param timeout Time in milliseconds to wait before completing.
         * @param resetTimerAfterInterruption Reset the timer after interruption; defaults to false.
         * @param name Optional task name.
         */
        constructor(timeout: number, resetTimerAfterInterruption: boolean, name?: string);
        /** @inheritDoc */
        protected resetImpl(): void;
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected runImpl(): void;
        /**
         * Stops the running timer.
         * @private
         */
        stopTimer_(): void;
        /**
         * Event handler for when the deferred task is complete.
         * @private
         */
        onTimeout_(): void;
    }
}
declare module tr {
    /**
     * Runs a series of tasks until one of them successfully completes.
     *
     * <p>This type of task completes successfully if at least one of its children complete.
     * If all of its children error, this task will also error.
     */
    class StopOnSuccess extends tr.Abstract {
        private completedTasks_;
        private erroredTasks_;
        private taskQueue_;
        private taskQueueIndex_;
        /**
         * Constructor.
         *
         * @param tasks Initial set of child tasks.
         * @param name Optional task name.
         */
        constructor(tasks?: Array<tr.Task>, name?: string);
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
        addAll(tasks: Array<tr.Task>): tr.StopOnSuccess;
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
        add(task: tr.Task): tr.StopOnSuccess;
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
        remove(task: tr.Task): tr.StopOnSuccess;
        /** @inheritDoc */
        getCompletedOperationsCount(): number;
        /** @inheritDoc */
        getOperationsCount(): number;
        /** @inheritDoc */
        protected runImpl(): void;
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected resetImpl(): void;
        /**
         * Adds completed and errored callback handlers to child Task.
         *
         * @param task Child task
         */
        private addCallbacks_(task);
        /**
         * Are all child tasks completed?
         */
        private allTasksAreCompleted_();
        /**
         * Checks for completion (or failure) of child tasks and triggers callbacks.
         */
        private checkForTaskCompletion_();
        /**
         * Callback for child task completions.
         *
         * @param task Task that has just completed.
         */
        private childTaskCompleted_(task);
        /**
         * Callback for child task errors.
         *
         * @param task Task that has just errored.
         */
        private childTaskErrored_(task);
        /**
         * Invoke a callback once for each Task in the queue.
         *
         * @param callback Callback function
         */
        private eachTaskInQueue_(callback);
        /**
         * Removes completed and errored callback handlers from child Task.
         *
         * @param task Child task
         */
        private removeCallbacks_(task);
        /**
         * Convenience method for handling a completed Task and executing the next.
         *
         * @param task Task that has either been removed from the queue or has completed successfully.
         */
        private taskCompletedOrRemoved_(task);
    }
}
declare module tr {
    /**
     * No-op task primarily useful for unit testing.
     *
     * <p>This type of task can also be useful in a composite when a default, no-op behavior is desired.
     * Simply replace the placeholder null task with one that does actual work.
     *
     * <p>This task can be configured to auto-complete when it is executed.
     * Otherwise it will not complete or error until specifically told to do so.
     */
    class Stub extends tr.Closure {
        /**
         * Constructor.
         *
         * @param autoCompleteUponRun Task should auto-complete when run.
         * @param name Optional task name.
         */
        constructor(autoCompleteUponRun?: boolean, name?: string);
    }
}
declare module tr {
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
    interface Task {
        /**
         * Optional data value passed to the Task complete/error/interruption method.
         */
        getData(): any;
        /**
         * Additional information about the cause of a task error.
         */
        getErrorMessage(): string;
        /**
         * Number of internal operations conducted by this task.
         */
        getOperationsCount(): number;
        /**
         * Number of internal operations that have completed.
         */
        getCompletedOperationsCount(): number;
        /**
         * Context information about where this task was created.
         * This information can help locate and debug errored tasks.
         *
         * <p>This property is only available in the debug build of Task Runner.
         */
        getCreationContext(): string;
        /**
         * Optional human-readable name, typically useful for debug purposes.
         */
        getName(): string;
        /**
         * Returns the state of the task.
         */
        getState(): tr.enums.State;
        /**
         * Globally unique ID for the current Task-instance.
         *
         * <p>Tasks should be assigned a unique ID when they are created.
         * IDs remain with their Tasks as long as the Tasks exist and are not reused.
         */
        getUniqueID(): number;
        /**
         * Starts a task.
         *
         * <p>This method may also be used to re-run a task that has errorred or to resume
         * a task that has been interrupted.
         *
         * @throws Error if run() is called while a task is already running.
         * @return A reference to the current task.
         */
        run(): tr.Task;
        /**
         * Interrupts a running task.
         * An interrupted task can be resumed by calling run().
         *
         * @throws Error if called while a task is not running.
         * @return A reference to the current task.
         */
        interrupt(): tr.Task;
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
        interruptFor(task: tr.Task): tr.Task;
        /**
         * Resets the task to it's initialized TaskState so that it can be re-run.
         * This method should not be called on a task that is running.
         *
         * @throws Error if reset() is for a task that is currently running.
         * @return A reference to the current task.
         */
        reset(): tr.Task;
        /**
         * Attach a callback function to a task event.
         *
         * @param taskEvent
         * @param callback
         * @param optional Optional scope
         * @return A reference to the current task.
         */
        on(event: tr.enums.Event, callback: (task: tr.Task) => void, scope?: any): tr.Task;
        /**
         * Dettach a callback function from a task event.
         *
         * @param taskEvent
         * @param callback
         * @param optional Optional scope
         * @return A reference to the current task.
         */
        off(event: tr.enums.Event, callback: (task: tr.Task) => void, scope?: any): tr.Task;
        /**
         * This callback will be invoked when a task is started.
         *
         * @param callback
         * @param optional Optional scope
         * @return A reference to the current task.
         */
        started(callback: (task: tr.Task) => void, scope?: any): tr.Task;
        /**
         * This callback will be invoked whenever this task is interrupted.
         *
         * @param callback
         * @param optional Optional scope
         * @return A reference to the current task.
         */
        interrupted(callback: (task: tr.Task) => void, scope?: any): tr.Task;
        /**
         * This callback will be invoked only upon successful completion of the task.
         * Callbacks may be called multiple times (if the task is run more than once).
         * Multiple callbacks may be registered with a task as well.
         *
         * @param callback
         * @param optional Optional scope
         * @return A reference to the current task.
         */
        completed(callback: (task: tr.Task) => void, scope?: any): tr.Task;
        /**
         * This callback will be invoked only upon a task error.
         * Callbacks may be called multiple times (if the task is run more than once).
         * Multiple callbacks may be registered with a task as well.
         *
         * @param callback
         * @param optional Optional scope
         * @return A reference to the current task.
         */
        errored(callback: (task: tr.Task) => void, scope?: any): tr.Task;
        /**
         * This callback will be invoked after a task has completed or errored.
         *
         * @param callback
         * @param optional Optional scope
         * @return A reference to the current task.
         */
        final(callback: (task: tr.Task) => void, scope?: any): tr.Task;
    }
}
declare module tr {
    /**
     * Decorates a Task and enforces a max-execution time limit.
     *
     * <p>If specified time interval elapses before the decorated Task has complete it is considered to be an error.
     * The decorated Task will be interrupted in that event.
     */
    class Timeout extends tr.Abstract {
        private decoratedTask_;
        private timeout_;
        private timeoutId_;
        private timeoutPause_;
        private timeoutStart_;
        /**
         * Constructor.
         *
         * @param task The task to decorate.
         * @param timeout Time in milliseconds to wait before timing out the decorated task.
         * @param name Optional task name.
         */
        constructor(task: tr.Task, timeout: number, name?: string);
        /**
         * Returns the inner decorated Task.
         *
         * @return {tr.Task}
         */
        getDecoratedTask(): tr.Task;
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected resetImpl(): void;
        /** @inheritDoc */
        protected runImpl(): void;
        /**
         * Event handler for when the deferred task is complete.
         * @param {!tr.Task} task
         * @private
         */
        private onDecoratedTaskCompleted_(task);
        /**
         * Event handler for when the deferred task errored.
         * @param {!tr.Task} task
         * @private
         */
        private onDecoratedTaskErrored_(task);
        /**
         * Event handler for when the deferred task is complete.
         * @private
         */
        private onTimeout_();
        /**
         * Removes the decorated task callbacks.
         */
        private removeCallbacks_();
        /**
         * Stops the running timer.
         */
        private stopTimer_();
    }
}
declare module tr {
    /**
     * Animation-frame-based task for tweening properties.
     *
     * <p>This task invokes a callback on each animation frame and passes a 0..1 value representing the progress of the overall tween.
     */
    class Tween extends tr.Abstract {
        private animationFrameId_;
        private callback_;
        private duration_;
        private easingFunction_;
        private elapsed_;
        private lastUpdateTimestamp_;
        /**
         * Constructor.
         *
         * @param callback Callback invoked on animation frame with a number (0..1) representing the position of the tween.
         * @param duration Duration of tween in milliseconds.
         * @param easingFunction Optional easing function used to convert input time to an eased time.
         *                       If no function is specified, a linear ease (no ease) will be used.
         * @param name Optional task name.
         */
        constructor(callback: (val: number) => void, duration: number, easingFunction: (val: number) => number, name?: string);
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected resetImpl(): void;
        /** @inheritDoc */
        protected runImpl(): void;
        private cancelCurrentAnimationFrame_();
        private linearEase_(value);
        private queueAnimationFrame_(callback);
        private updateReset_();
        private updateRunning_();
    }
}
declare module tr {
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
    class Xhr extends tr.Abstract {
        private static DEFAULT_RESPONSE_TYPE;
        private postData_;
        private responseType_;
        private url_;
        private xhr_;
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
        constructor(url: string, postData_?: Object, responseType?: tr.enums.XhrResponseType, name?: string);
        /**
         * Set the default response-type for all XHR requests that do not otherwise specify a response-type.
         */
        static setDefaultResponseType(responseType: tr.enums.XhrResponseType): void;
        /**
         * The default response-type for this XHR requests.
         */
        getResponseType(): tr.enums.XhrResponseType;
        /** @inheritDoc */
        protected interruptImpl(): void;
        /** @inheritDoc */
        protected resetImpl(): void;
        /** @inheritDoc */
        protected runImpl(): void;
        private createPostDataString_();
        private serialize(object, prefix?);
        /** @private */
        private onXhrRequestSuccess_();
        /** @private */
        private onXhrRequestErrorOrTimeout_();
    }
}
declare module tr.enums {
    /**
     * Enumeration of Task events.
     */
    enum Event {
        STARTED,
        INTERRUPTED,
        COMPLETED,
        ERRORED,
        FINAL,
    }
}
declare module tr.enums {
    /**
     * Enumeration of Task states.
     */
    enum State {
        INITIALIZED,
        RUNNING,
        INTERRUPTED,
        COMPLETED,
        ERRORED,
    }
}
declare module tr.enums {
    /**
     * Enumeration of Xhr task response-types.
     */
    enum XhrResponseType {
        JSON,
        TEXT,
        XML,
    }
}
