/**
 * Entry point for Closure Compiler.
 * Responsible for requiring all of the Task Runner tasks.
 * @ignore
 */
goog.provide('tr.app');

goog.require('tr');
goog.require('tr.app.Application');
goog.require('tr.app.ApplicationRouter');
goog.require('tr.app.State');
goog.require('tr.app.TransitionState');
goog.require('tr.app.UrlMatcher');