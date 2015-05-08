var gulp       = require('gulp')
  , connect    = require('gulp-connect')
  , browserify = require('browserify')
  , source     = require('vinyl-source-stream')
  , babelify   = require('babelify');

gulp.task('browserify', function () {
  return browserify({ entries: './src/papi.es6' })
    .transform(babelify)
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
  gulp.watch('src/*.es6', { debounceDelay: 2000 }, ['browserify']);
});

gulp.task('default', ['connect', 'watch']);
