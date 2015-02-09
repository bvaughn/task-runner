goog.provide('tr.app.ApplicationRouter');

goog.require('goog.array');
goog.require('goog.History');
goog.require('goog.history.EventType');



/**
 * TODO
 *
 * @param {!tr.Application} application Main application
 * @constructor
 * @struct
 */
tr.ApplicationRouter = function(application) {
  this.application_ = application;

  /** @private {!Array.<!tr.ApplicationRouter.Path_>} */
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
 * @return {!tr.ApplicationRouter}
 */
tr.ApplicationRouter.prototype.addPath = function(path, factoryFunction) {
  this.paths_.push(
    new tr.ApplicationRouter.Path_(path, factoryFunction));

  return this;
};


/**
 * TODO
 *
 * @param {function(!tr.app.State)} factoryFunction Factory function responsible for creating an application state task
 * @return {!tr.ApplicationRouter}
 */
tr.ApplicationRouter.prototype.setDefaultRoute = function(factoryFunction) {
  this.defaultStateFactoryFunction_ = factoryFunction;

  return this;
};


/**
 * Start the router.
 *
 * @return {!tr.ApplicationRouter}
 */
tr.ApplicationRouter.prototype.start = function() {
  this.history_ = new goog.History();

  goog.events.listen(
    this.history_,
    goog.history.EventType.NAVIGATE,
    goog.bind(this.onNavigate_, this));

  this.history_.setEnabled(true);

  return this;
};


/** @private */
tr.ApplicationRouter.prototype.onNavigate_ = function(event) {
  for (var i = 0, length = this.paths_.length; i < length; i++) {
    var path = this.paths_[i];

    if (path.load(event.token)) {
      var state = path.createState();
      state.errored(goog.bind(this.goToDefaultState_, this));

      this.application_.enterState(state);

      break;
    }
  }
};


/** @private */
tr.ApplicationRouter.prototype.goToDefaultState_ = function(application) {
  if (this.defaultStateFactoryFunction_ !== undefined) {
    var state = this.defaultStateFactoryFunction_();

    this.application_.enterState(state);
  }
};



// TODO Support optional sub-routes.
// TODO Support query parameters.
// TODO Handle special characters in query parameters.
// TODO Write unit tests
tr.ApplicationRouter.Path_ = function(path, factoryFunction) {
  this.factoryFunction_ = factoryFunction;

  var replacements = path.match(/:[^\/]+/g);

  path = path.replace('/', '\/');

  this.factoryFunctionParamKeys_ = [];

  if (replacements) {
    for (var i = 0, length = replacements.length; i < length; i++) {
      var replacement = replacements[i];

      this.factoryFunctionParamKeys_.push(replacement.substr(1)); // Trim ":"

      path = path.replace(replacement, '([^\/]+)');
    }
  }

  this.pattern_ = new RegExp(path);
};


/**
 * TODO
 */
tr.ApplicationRouter.Path_.prototype.load = function(url) {
  this.loaded_ = false;

  var urlParams = url.match(this.pattern_);

  if (urlParams) {
    urlParams.shift();; // Base URL

    this.factoryFunctionParams_ = {};

    for (var i = 0, length = urlParams.length; i < length; i++) {
      var key = this.factoryFunctionParamKeys_[i];

      this.factoryFunctionParams_[key] = urlParams[i];
    }

    this.loaded_ = true;

    return true;
  }

  return false;
};


/**
 * TODO
 */
tr.ApplicationRouter.Path_.prototype.createState = function() {
  goog.asserts.assert(this.loaded_, 'Invalid path');

  // TODO Handle RTEs in factory function
  return this.factoryFunction_(this.factoryFunctionParams_);
};