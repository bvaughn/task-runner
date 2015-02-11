goog.provide('tr.Decorator');

/**
 * This type of task decorates another tr.
 * Exposing the decorated task via the interface allows for useful debugging and reporting of error conditions.
 *
 * @extends {tr.Task}
 * @interface
 */
tr.Decorator = function() {};

/**
 * Returns the inner decorated Task.
 *
 * @return {tr.Task}
 */
tr.Decorator.prototype.getDecoratedTask = goog.abstractMethod;
