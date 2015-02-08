/**
 * Entry point for Closure Compiler.
 * Responsible for requiring all of the Task Runner tasks.
 */
goog.provide('tr');

goog.require('tr.Abstract');
goog.require('tr.Closure');
goog.require('tr.Composite');
goog.require('tr.Decorator');
goog.require('tr.Factory');
goog.require('tr.Failsafe');
goog.require('tr.Graph');
goog.require('tr.Listener');
goog.require('tr.Observer');
goog.require('tr.Retry');
goog.require('tr.Sleep');
goog.require('tr.Stub');
goog.require('tr.Task');
goog.require('tr.Timeout');
goog.require('tr.Tween');
goog.require('tr.Xhr');
goog.require('tr.enums.Event');
goog.require('tr.enums.State');