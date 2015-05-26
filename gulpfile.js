var gulp       = require('gulp')
  , connect    = require('gulp-connect')
  , browserify = require('browserify')
  , source     = require('vinyl-source-stream')
  , babelify   = require('babelify')
  , babel      = require('gulp-babel');

gulp.task('build:es6', function() {
  return gulp.src('src/**/*.js')
    .pipe(babel())
    .pipe(gulp.dest('build'));
});

gulp.task('build:bundle', ['build:es6'], function () {
  return browserify({ entries: './build/index.js' })
    //.transform(babelify)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./build/'))
    .pipe(connect.reload());
});

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
