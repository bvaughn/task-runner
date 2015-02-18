module.exports = function(config) {
  config.set({
    frameworks: ['jasmine', 'closure'],

    files: [
      // Closure Library base.
      'bower_components/closure-library/closure/goog/base.js',

      // Tests.
      'tests/tr/chain.js',

      // Source files are watched and served, but not parsed for tests.
      {pattern: 'source/**/*.js', included: false},

      // Closure Library dependencies, neither served nor watched.
      {pattern: 'bower_components/closure-library/closure/goog/deps.js', included: false, served: false}
    ],

    //what kinda reports one wants to see
    reporters: [
      'coverage',
      'progress'
    ],

    //use phantomJS as a browser
    browsers: [
      'PhantomJS'
    ],

    // Auto run tests on start (when browsers are captured) and exit
    // CLI --single-run --no-single-run
    //singleRun: true,

    // report which specs are slower than 500ms
    // CLI --report-slower-than 500
    reportSlowerThan: 500,

    preprocessors: {
      // preprocessed for dependencies (closure) and for iits
      'tests/tr/chain.js': [
        'closure',
        'closure-iit'
      ],

      // preprocessed for dependencies
      'source/**/*.js': [
        'closure'
      ],

      // external deps
      'bower_components/closure-library/closure/goog/deps.js': [
        'closure-deps'
      ]
    }
  });
};
