var gulp        = require('gulp');
var connect     = require('gulp-connect');
var runSequence = require('run-sequence');

/** BUILD *********************************************************************/
gulp.task('build', function(cb) {
  return runSequence('build:clean', 'build:lib', 'build:es6', 'build:bundle', cb);
  //return runSequence('build:clean', 'build:bundle-babelify', cb);
});

gulp.task('build:clean', function(cb) {
  require('del')(['build'], cb);
});

gulp.task('build:lib', function() {
  return gulp.src('./lib/*')
    .pipe(gulp.dest('build/lib'))
});

gulp.task('build:es6', function() {
  return gulp.src('./src/index.js')
    .pipe(require('gulp-rollup')())
    .pipe(require('gulp-babel')())
    .pipe(gulp.dest('build/src'));
});

// gulp.task('build:es6', function() {
//   return gulp.src('src/**/*.js')
//     .pipe(require('gulp-babel')())
//     .pipe(gulp.dest('build/src'));
// });

gulp.task('build:bundle', function () {
  return require('browserify')({ entries: './build/src/index.js', standalone: 'Papi'})
    .bundle()
    .pipe(require('vinyl-source-stream')('papi.js'))
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
});

gulp.task('build:bundle-babelify', function () {
  return require('browserify')({ entries: './src/index.js', standalone: 'Papi'})
    .transform('babelify')
    .bundle()
    .pipe(require('vinyl-source-stream')('papi.js'))
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
});

/** DIST **********************************************************************/
gulp.task('dist', ['build'], function(cb) {
  return runSequence('dist:clean', 'dist:copy', 'dist:minify', cb);
});

gulp.task('dist:clean', function(cb) {
  return require('del')(['dist'], cb);
})

gulp.task('dist:copy', function() {
  return gulp.src('build/**/*')
  .pipe(gulp.dest('dist'));
});

gulp.task('dist:minify', function() {
  return gulp.src('build/papi.js')
  .pipe(require('gulp-size')({showFiles: true}))
  .pipe(require('gulp-rename')('papi.min.js'))
  .pipe(require('gulp-uglify')({
    mangle: true
  }))
  .pipe(require('gulp-size')({showFiles: true}))
  .pipe(require('gulp-size')({showFiles: true, gzip: true}))
  .pipe(gulp.dest('dist'));
});

/** WATCH and SERVER **********************************************************/
gulp.task('connect', function() {
  connect.server({
    root: '.',
    port: '5555',
    livereload: true
  });
});

gulp.task('watch', function () {
  gulp.watch('src/**/*.js', { debounceDelay: 2000 }, ['build:bundle']);
});

gulp.task('default', ['connect', 'watch']);
