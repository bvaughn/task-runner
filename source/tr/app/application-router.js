goog.provide('tr.app.ApplicationRouter');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.Uri');
goog.require('goog.window');
goog.require('tr.app.UrlMatcher');

/**
 * <p class="alert alert-info">This class is only available in the <em>task-runner-engine</em> target.
 *
 * Watches for changes in the current URL and maps them to the appropriate application state.
 *
 * @param {!tr.app.Application} application Main application
 * @constructor
 * @struct
 */
tr.app.ApplicationRouter = function(application) {
  this.application_ = application;

  /**
   * @type {!Array.<!tr.app.ApplicationRouter.Path_>}
   * @private
   */
  this.paths_ = [];

  /** {function(!tr.app.State)|undefined} */
  this.defaultStateFactoryFunction_;

  /** {Object} */
  this.window_ = goog.window.location ? goog.window : window;
};

/**
 * Register an application route.
 * When this route is matched the provided factory function will be invoked to create an application state.
 *
 * @param {!string} path Application route/path
 * @param {function(!tr.app.State)} factoryFunction Factory function responsible for creating an application state task
 * @return {!tr.app.ApplicationRouter}
 */
tr.app.ApplicationRouter.prototype.addPath = function(path, factoryFunction) {
  this.paths_.push(
    new tr.app.ApplicationRouter.Path_(path, factoryFunction, this.window_));

  return this;
};

/**
 * Factory function responsible for creating the default application state.
 * This factory function is invoked any time the user visits a URL that can't be matched.
 *
 * <p>The router must be configured with a default state before being run.
 * This state is entered if a URL cannot be matched with a route, or if a route fails to load a valid state.
 * It's improtant for this state to have no dependencies.
 *
 * <p>This router is based on UI Router (and shares much of its code under the hood).
 * This means that UI Router's parameter formatting is supported.
 * For more information see https://github.com/angular-ui/ui-router/wiki/URL-Routing
 *
 * @param {function(!tr.app.State)} factoryFunction Factory function responsible for creating an application state task
 * @return {!tr.app.ApplicationRouter}
 */
tr.app.ApplicationRouter.prototype.setDefaultRoute = function(factoryFunction) {
  this.defaultStateFactoryFunction_ = factoryFunction;

  return this;
};

/**
 * Start the router.
 *
 * @return {!tr.app.ApplicationRouter}
 */
tr.app.ApplicationRouter.prototype.start = function() {
  goog.asserts.assert(!!this.defaultStateFactoryFunction_, 'Default route required.');

  goog.events.listen(
    this.window_,
    goog.events.EventType.HASHCHANGE,
    goog.bind(this.ohHashChange_, this));

  // Process current URL
  this.ohHashChange_();

  return this;
};

/** @private */
tr.app.ApplicationRouter.prototype.ohHashChange_ = function() {
  // TODO Handle both hash paths and full locations; support HTML5 mode like UI Router.
  var url = this.window_.location.hash.substring(1);

  for (var i = 0, length = this.paths_.length; i < length; i++) {
    var path = this.paths_[i];

    if (path.load(url)) {
      var state = path.createState();
      state.errored(goog.bind(this.goToDefaultState_, this));

      this.application_.enterState(state);

      return;
    }
  }

  this.goToDefaultState_();
};

/** @private */
tr.app.ApplicationRouter.prototype.goToDefaultState_ = function(application) {
  if (this.defaultStateFactoryFunction_ !== undefined) {
    var state = this.defaultStateFactoryFunction_();

    this.application_.enterState(state);
  }
};


// TODO Support optional sub-routes.
// TODO Support query parameters.
// TODO Handle special characters in query parameters.
// TODO Write unit tests


/**
 * Private wrapper class used to associate a route definition and a factory function responsible for creating an application state.
 *
 * @param {string} path
 * @param {function(*):tr.app.State} factoryFunction
 * @private
 * @constructor
 * @struct
 */
tr.app.ApplicationRouter.Path_ = function(path, factoryFunction, window) {
  this.factoryFunction_ = factoryFunction;
  this.urlMatcher_ = new tr.app.UrlMatcher(path, {});
  this.window_ = window;
};

/**
 * Parse the specifiec URL and extract state information if relevant.
 *
 * @return {boolean} The specified URL matches the decorated state.
 */
tr.app.ApplicationRouter.Path_.prototype.load = function(url) {
  var search = this.window_.location.search;

  if (search && search.length > 0) {
    var queryData = new goog.Uri.QueryData(search.substring(1));
    var keys = queryData.getKeys();
    var searchParams = {};

    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];

      searchParams[key] = queryData.get(key);
    }
}
  
  /** {Object|null} */
  this.factoryFunctionParams_ = this.urlMatcher_.exec(url, searchParams);

  return !!this.factoryFunctionParams_;
};

/**
 * Create and enter the decorated application state.
 *
 * @return {!tr.app.State}
 */
tr.app.ApplicationRouter.Path_.prototype.createState = function() {
  goog.asserts.assert(this.factoryFunctionParams_, 'Invalid path');

  // TODO Handle RTEs in factory function
  // If we're not entering a default state when an error occurs, enter the default state.
  // If we're entering a default state then just let the error be thrown.
  // Test this thoroughly!
  return this.factoryFunction_(this.factoryFunctionParams_);
};