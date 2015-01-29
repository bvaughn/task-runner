module.exports = function(config) {
  config.set({
    frameworks: ['jasmine', 'closure'],
    files: [
      // Closure Library base.
      'bower_components/closure-library/closure/goog/base.js',

      // Tests.
      'tests/*.js',

      // Source files are watched and served, but not parsed for tests.
      {pattern: 'source/*.js', included: false},

      // Closure Library dependencies, neither served nor watched.
      {pattern: 'bower_components/closure-library/closure/goog/deps.js', included: false, served: false}
    ],

    preprocessors: {
      'tests/*.js': ['closure', 'closure-iit'], // preprocessed for dependencies (closure) and for iits
      'source/*.js': ['closure'], // preprocessed for dependencies
      'bower_components/closure-library/closure/goog/deps.js': ['closure-deps'] // external deps
    }
  });
};
