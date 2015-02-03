goog.provide('taskrunner.ApplicationTask');

goog.require('taskrunner.CompositeTask');
goog.require('taskrunner.TaskState');



/**
 * Basic Task for encapsulating an application comprised of {@link taskrunner.StateTask}s.
 * Use the enterState() method to start the application or to transition between states.
 *
 * @example
 * var applicationTask = new taskrunner.ApplicationTask();
 * applicationTask.enterState(initializationTask);
 *
 * @extends {taskrunner.CompositeTask}
 * @constructor
 * @struct
 */
taskrunner.ApplicationTask = function() {
  goog.base(this, false);

  /** @private {taskrunner.Task|undefined} */
  this.stateTask_;
};
goog.inherits(taskrunner.ApplicationTask, taskrunner.CompositeTask);


/**
 * Interrupt the current application-state and enter a new one.
 * 
 * @param {!StateTask} stateTask State task to enter.
 * @private
 */
taskrunner.ApplicationTask.prototype.enterState = function(stateTask) {
  var previousStateTask = this.stateTask_;

  this.stateTask_ = stateTask;
  this.addTask(this.stateTask_);

  if (previousStateTask !== undefined) {
    this.removeTask(previousStateTask);

    previousStateTask.interrupt();
  }

  if (this.getState() !== taskrunner.TaskState.RUNNING) {
    this.run();
  }
};


/**
 * @return Current application {@link taskrunner.StateTask}.
 */
taskrunner.ApplicationTask.prototype.getStateTask = function() {
  return this.stateTask_;
};


/**
 * This method is called when a application has been started.
 * Override it to implement custom start behavior.
 */
//taskrunner.ApplicationTask.prototype.applicationStarted = goog.nullFunction;


/**
 * This method is called when a application has been interrupted.
 * Override it to implement custom interrupt behavior.
 */
//taskrunner.ApplicationTask.prototype.applicationInterrupted = goog.nullFunction;


/**
 * This method is called when a application has been reset.
 * Override it to implement custom reset behavior.
 */
//taskrunner.ApplicationTask.prototype.applicationReset = goog.nullFunction;
