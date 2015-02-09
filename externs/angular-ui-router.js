/**
 * {UrlMatcher}
 */
var $$UMFP = {};

/**
 * @constructor
 * @struct
 */
function $UrlMatcherFactory() {};
/**
 * @param {boolean}
 * @returns {boolean}
 */
$UrlMatcherFactory.prototype.caseInsensitive = function(value) {};
/**
 * @param {boolean=}
 * @returns {boolean}
 */
$UrlMatcherFactory.prototype.strictMode = function(value) {};
/**
 * @param {string}
 */
$UrlMatcherFactory.prototype.defaultSquashPolicy = function(value) {};
/**
 * @param {string}
 * @param {Object}
 * @returns {UrlMatcher}
 */
$UrlMatcherFactory.prototype.compile = function(pattern, config) {};
/**
 * @param {Object}
 * @returns {Boolean}
 */
$UrlMatcherFactory.prototype.isMatcher = function(o) {};
/**
 * @param {string}
 * @param {Object|Function}
 * @param {Object|Function}
 * @returns {Object}
 */
$UrlMatcherFactory.prototype.type = function(name, definition, definitionFn) {};
// $UrlMatcherFactory.$get
// $UrlMatcherFactory.Param
// $UrlMatcherFactory.ParamSet

/**
 * @param {Object}
 * @constructor
 * @struct
 */
function Type(config) {};
/**
 * @param {*}
 * @param {*}
 * @returns {*}
 */
Type.prototype.$asArray = function(mode, isSearch) {};
/**
 * @param {*}
 * @returns {*}
 */
Type.prototype.$normalize = function(val) {};
/**
 * @returns {string}
 */
Type.prototype.$subPattern = function() {};
/**
 * @param {*}
 * @param {string}
 * @returns {string}
 */
Type.prototype.encode = function(val, key) {};
/**
 * @param {string}
 * @param {string}
 * @returns {*}
 */
Type.prototype.decode = function(val, key) {};
/**
 * @param {*}
 * @param {*}
 * @returns {Boolean}
 */
Type.prototype.equals = function(a, b) {};
/**
 * @param {*}
 * @param {string}
 * @returns {Boolean}
 */
Type.prototype.is = function(val, key) {};
/**
 * {RegExp}
 */
Type.prototype.pattern;
/**
 * @returns {string}
 */
Type.prototype.toString = function() {};

/**
 * @param {string}
 * @param {Object}
 * @param {Object=}
 * @constructor
 * @struct
 */
function UrlMatcher(pattern, config, parentMatcher) {};
UrlMatcher.prototype.$$paramNames = function() {};
/**
 * @param {string}
 * @param {Object}
 * @returns {UrlMatcher}
 */
UrlMatcher.prototype.concat = function(pattern, config) {};
/**
 * @param {string}
 * @param {Object}
 * @returns {Object}
 */
UrlMatcher.prototype.exec = function(path, searchParams) {};
/**
 * @param {Object}
 * @returns {string}
 */
UrlMatcher.prototype.format = function(values) {};
/**
 * @returns {Array.<string>}
 */
UrlMatcher.prototype.parameters = function(param) {};
// UrlMatcher.params
// UrlMatcher.prefix
// UrlMatcher.regexp
// UrlMatcher.segments
// UrlMatcher.source
// UrlMatcher.sourcePath
// UrlMatcher.sourceSearch
/**
 * @returns {string}
 */
UrlMatcher.prototype.toString = function() {};
/**
 * @param {Object}
 * @returns {boolean}
 */
UrlMatcher.prototype.validates = function(params) {};