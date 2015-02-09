var gulp = require('gulp');
var karma = require('gulp-karma');

var sources = [
  'bower_components/closure-library/closure/goog/**/*.js',
  'source/*.js',
  'source/tr/*.js',
  'source/tr/enums/*.js'
];
var sourcesWithApps = [
  'bower_components/closure-library/closure/goog/**/*.js',
  'source/*.js',
  'source/tr/*.js',
  'source/tr/app/*.js',
  'source/tr/enums/*.js'
];
var testFiles = []; // Declared in the karma.conf.js
 
gulp.task('test', function() {
  // Be sure to return the stream 
  return gulp.src(testFiles)
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }))
    .on('error', function(err) {
      // Make sure failed tests cause gulp to exit non-zero 
      throw err;
    });
});

var buildHelper = function(sources, entryPoint, outputFile) {
  var closureCompiler = require('gulp-closure-compiler');

  gulp.src(sources)
    .pipe(closureCompiler({
      compilerPath: 'bower_components/closure-compiler/compiler.jar',
      fileName: outputFile,
      compilerFlags: {
        closure_entry_point: entryPoint,
        language_in: 'ECMASCRIPT5',
        only_closure_dependencies: true,
        formatting: 'pretty_print'
      }
    }))
    .pipe(gulp.dest('dist'));
};
 
gulp.task('build', function() {
  buildHelper(sources, 'tr', 'task-runner.js');
});
gulp.task('build:app', function() {
  buildHelper(sourcesWithApps, 'tr.app', 'task-runner-with-app.js');
});

// TODO
var depsHelper = function(sources, outputFile) {
  var closureDeps = require('gulp-closure-deps');

  gulp.src(sources)
    .pipe(closureDeps({
      fileName: outputFile,
      prefix: '',
      baseDir: 'source/'
    }))
    .pipe(gulp.dest('dist'));
};

gulp.task('deps', function() {
  depsHelper(sources, 'task-runner-deps.js');
});
gulp.task('deps:app', function() {
  depsHelper(sourcesWithApps, 'task-runner-deps-with-app.js');
});

gulp.task('watch', function() {
  gulp.src(testFiles)
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }));
});
