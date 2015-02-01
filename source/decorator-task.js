goog.provide('taskrunner.DecoratorTask');



/**
 * This type of task decorates another task.
 * Exposing the decorated task via the interface allows for useful debugging and reporting of error conditions.
 *
 * @extends {taskrunner.Task}
 * @interface
 */
taskrunner.DecoratorTask = function() {};


/**
 * Returns the inner decorated Task.
 *
 * @return {taskrunner.Task}
 */
taskrunner.DecoratorTask.prototype.getDecoratedTask = goog.abstractMethod;
