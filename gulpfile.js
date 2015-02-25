var gulp = require('gulp');
var karma = require('gulp-karma');
var runSequence = require('run-sequence');

var sources = [
  'source/**/*.ts'
];
var testFiles = []; // Declared in the karma.conf.js
var distDirectory = 'dist';

/**
 * Main task: cleans, builds, run tests, and bundles up for distribution.
 */
gulp.task('all', function(callback) {
  runSequence(
    'clean',
    'build',
    'test',
    callback);
});

gulp.task('build', function(callback) {
  runSequence(
    'compile',
    'uglify',
    'umdify',
    'map',
    callback);
});

gulp.task('compile', function() {
  return buildHelper(sources, distDirectory , 'task-runner.js');
});

gulp.task('clean', function() {
  var clean = require('gulp-clean');

  return gulp.src(distDirectory ).pipe(clean());
});

gulp.task('map', function() {
  var shell = require('gulp-shell');

  console.log('CWD: ' + process.cwd() + '/dist');

  return shell.task(
    'uglifyjs --compress --mangle --source-map task-runner.min.js.map --source-map-root . -o task-runner.min.js -- task-runner.js',
    {cwd: process.cwd() + '/dist'}
  )();
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
  return gulp.src(testFiles)
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }));
});

gulp.task('uglify', function() {
  var fs = require('fs');
  var uglifyJs = require('uglify-js2');

  var code = fs.readFileSync('dist/task-runner.js', 'utf8');

  var parsed = uglifyJs.parse(code);
  parsed.figure_out_scope();

  var compressed = parsed.transform(uglifyJs.Compressor());
  compressed.figure_out_scope();
  compressed.compute_char_frequency();
  compressed.mangle_names();

  var finalCode = compressed.print_to_string();

  fs.writeFileSync('dist/task-runner.min.js', finalCode);
});

gulp.task('umdify', function() {
  umdHelper('dist/task-runner.js', 'dist');
  umdHelper('dist/task-runner.min.js', 'dist');
});

var buildHelper = function(sources, directory, outputFile) {
  var typeScriptCompiler = require('gulp-tsc');
  var uglify = require('gulp-uglify');
  var rename = require('gulp-rename');

  return gulp
    .src(sources)
    .pipe(typeScriptCompiler({
      module: "CommonJS",
      emitError: false,
      out: outputFile
    }))
    .pipe(gulp.dest(directory));
};

var umdHelper = function(sources, directory) {
  var umd = require('gulp-umd');

  return gulp
    .src(sources)
    .pipe(umd({
      exports: function(file) {
        return 'tr';
      },
      namespace: function(file) {
        return 'tr';
      }
      //template: path.join(__dirname, 'templates/returnExports.js')
    }))
    .pipe(gulp.dest(directory));
};