goog.provide('tr.app.ApplicationRouter');

goog.require('goog.array');
goog.require('goog.events.EventType');



/**
 * Tracks application routes and maps them to the appropriate application state.
 *
 * @param {!tr.app.Application} application Main application
 * @constructor
 * @struct
 */
tr.app.ApplicationRouter = function(application) {
  this.application_ = application;

  /** @private {!Array.<!tr.app.ApplicationRouter.Path_>} */
  this.paths_ = [];

  /** {function(!tr.app.State)|undefined} */
  this.defaultStateFactoryFunction_;
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
    new tr.app.ApplicationRouter.Path_(path, factoryFunction));

  return this;
};


/**
 * Factory function responsible for creating the default application state.
 * This factory function is invoked any time the user visits a URL that can't be matched.
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
  goog.events.listen(
    window,
    goog.events.EventType.HASHCHANGE,
    goog.bind(this.ohHashChange_, this));

  // Process current URL
  this.ohHashChange_();

  return this;
};


/** @private */
tr.app.ApplicationRouter.prototype.ohHashChange_ = function() {
  // TODO Handle hash paths and full locations? How does UI Router do it?
  var url = window.location.hash.substring(1);

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
tr.app.ApplicationRouter.Path_ = function(path, factoryFunction) {
  this.factoryFunction_ = factoryFunction;

  if (!tr.app.ApplicationRouter.Path_.$urlMatcherFactory_) {
    tr.app.ApplicationRouter.Path_.$urlMatcherFactory_ = new $UrlMatcherFactory();
  }

  this.urlMatcher = tr.app.ApplicationRouter.Path_.$urlMatcherFactory_.compile(path);
};


tr.app.ApplicationRouter.Path_.$urlMatcherFactory_ = null;


/**
 * Parse the specifiec URL and extract state information if relevant.
 *
 * @return {boolean} The specified URL matches the decorated state.
 */
tr.app.ApplicationRouter.Path_.prototype.load = function(url) {
  var searchParams = goog.Uri.QueryData(window.location.search);
  
  /** {Object|null} */
  this.factoryFunctionParams_ = this.urlMatcher.exec(url, searchParams);

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
  return this.factoryFunction_(this.factoryFunctionParams_);
};