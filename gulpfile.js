var gulp       = require('gulp')
  , connect    = require('gulp-connect')
  , babel      = require('gulp-babel')
  , size       = require('gulp-size')
  , uglify     = require('gulp-uglify')
  , rename     = require('gulp-rename')
  , browserify = require('browserify')
  , source     = require('vinyl-source-stream')
  , babelify   = require('babelify')
;



gulp.task('build:es6', function() {
  return gulp.src('src/**/*.js')
    //.pipe(babel({loose: 'all', optional: ['runtime']}))
    .pipe(babel({loose: 'all'}))
    .pipe(gulp.dest('build'));
});

gulp.task('build', ['build:es6'], function () {
  return browserify({ entries: './build/index.js', standalone: 'Papi' })
    //.transform(babelify)
    .bundle()
    .pipe(source('papi.js'))
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
});

gulp.task('dist:minify', ['build'], function() {
  return gulp.src('build/papi.js')
  .pipe(size({showFiles: true}))
  .pipe(rename('papi.min.js'))
  .pipe(uglify({mangle: true, preserveComments: 'some'}))
  .pipe(size({showFiles: true}))
  .pipe(size({showFiles: true, gzip: true}))
  .pipe(gulp.dest('dist'));
});

gulp.task('dist', ['build', 'dist:minify'], function() {
  return gulp.src('build/**/*')
  .pipe(gulp.dest('dist'));
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
