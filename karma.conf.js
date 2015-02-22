module.exports = function(config) {
  var sources = 'dist/task-runner-engine/task-runner.js';
  var testMocks = 'tests/mocks/*.js';
  var testPolyfills = 'tests/polyfills/*.js';
  var tests = 'tests/tr/*.js';

  config.set({
    frameworks: ['jasmine-ajax', 'jasmine'],

    files: [tests, testPolyfills, testMocks, sources],

    //what kinda reports one wants to see
    reporters: [
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
      // preprocessed for dependencies
      tests: [],

      testDependencies: [],

      // preprocessed for dependencies
      sources: []
    }
  });
};
