var gulp = require('gulp');
var karma = require('gulp-karma');
 
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
 
gulp.task('build', function() {
  var closureCompiler = require('gulp-closure-compiler');

  gulp.src([
      //'bower_components/closure-library/closure/goog/**/*.js',
      'source/**/*.js'
    ])
    .pipe(closureCompiler({
      compilerPath: 'bower_components/closure-compiler/compiler.jar',
      fileName: 'task-runner.js',
      compilerFlags: {
        closure_entry_point: 'taskrunner',
        language_in: 'ECMASCRIPT5',
        only_closure_dependencies: true,
        formatting: 'pretty_print'
      }
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
  gulp.src(testFiles)
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }));
});
