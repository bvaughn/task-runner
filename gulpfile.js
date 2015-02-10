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
 
gulp.task('build', function() {
  buildHelper(sources, 'tr', 'dist/task-runner', 'compressed.js', false);
  buildHelper(sources, 'tr', 'dist/task-runner', 'debug.js', true);
  buildHelper(sourcesWithApps, 'tr.app', 'dist/task-runner-engine', 'compressed.js', false);
  buildHelper(sourcesWithApps, 'tr.app', 'dist/task-runner-engine', 'debug.js', true);
});

gulp.task('deps', function() {
  depsHelper(sources, 'dist/task-runner', 'deps.js');
  depsHelper(sourcesWithApps, 'dist/task-runner-engine', 'deps.js');
});
 
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

gulp.task('test:watch', function() {
  gulp.src(testFiles)
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }));
});

var buildHelper = function(sources, entryPoint, directory, outputFile, debug) {
  var closureCompiler = require('gulp-closure-compiler');

  var compilerFlags = {
    closure_entry_point: entryPoint,
    language_in: 'ECMASCRIPT5',
    only_closure_dependencies: true,
    
  };

  if (debug) {
    compilerFlags.define = ["goog.DEBUG=true"];
    compilerFlags.formatting = 'pretty_print';
  } else {
    compilerFlags.define = ["goog.DEBUG=false"];
  }

  gulp.src(sources)
    .pipe(closureCompiler({
      compilerPath: 'bower_components/closure-compiler/compiler.jar',
      fileName: outputFile,
      compilerFlags: compilerFlags
    }))
    .pipe(gulp.dest(directory));
};

var depsHelper = function(sources, directory, outputFile) {
  var closureDeps = require('gulp-closure-deps');

  gulp.src(sources)
    .pipe(closureDeps({
      fileName: outputFile,
      prefix: '',
      baseDir: 'source/'
    }))
    .pipe(gulp.dest(directory));
};