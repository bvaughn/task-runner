goog.provide('taskrunner.StateTask');

goog.require('taskrunner.DependencyGraphTask');
goog.require('taskrunner.TaskState');
goog.require('taskrunner.WaitTask');



/**
 * A runtime state of an {@link taskrunner.ApplicationTask}s.
 * Extend this base class to implement custom application states.
 *
 * @example
 * taskrunner.InitializationStateTask = function(applicationTask) {
 *   goog.base(this, applicationTask, "Initialization state");
 * 
 *   // Queue state sub-tasks
 *   this.addTask(new LoadSessionTask());
 *   this.addTask(new LoadContentJSONTask());
 * };
 * goog.inherits(taskrunner.InitializationStateTask, taskrunner.StateTask);
 *
 * @param {!taskrunner.ApplicationTask} applicationTask A reference to the {@link taskrunner.ApplicationTask} this state belongs to.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.DepdencyGraph}
 * @constructor
 * @struct
 */
taskrunner.StateTask = function(applicationTask, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {!taskrunner.ApplicationTask} */
  this.applicationTask_ = applicationTask;

  /** @private {!taskrunner.WaitTask} */
  this.waitTask_ = new taskrunner.WaitTask();

  // Leave the state open until explicitly exited.
  // This prevents the application state from "completing" and leaving the application in a hung-state.
  this.addTask(this.waitTask_);
};
goog.inherits(taskrunner.StateTask, taskrunner.DependencyGraphTask);


/**
 * This method is called when a state has been started.
 * Override it to implement custom start behavior.
 */
//taskrunner.StateTask.prototype.stateStarted = goog.nullFunction;


/**
 * This method is called when a state has been interrupted.
 * Override it to implement custom interrupt behavior.
 */
//taskrunner.StateTask.prototype.stateInterrupted = goog.nullFunction;


/**
 * This method is called when a state has been reset.
 * Override it to implement custom reset behavior.
 */
//taskrunner.StateTask.prototype.stateReset = goog.nullFunction;
