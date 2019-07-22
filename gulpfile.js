const gulp = require('gulp');
const babel = require('gulp-babel');
const sourceMap = require('gulp-sourcemaps');

gulp.task('default', () => gulp
  .src('./src/**/*.js')
  .pipe(sourceMap.init())
  .pipe(babel())
  .pipe(
    sourceMap.write('./', {
      sourceRoot(file) {
        return `${file.cwd}/src`;
      }
    })
  )
  .pipe(gulp.dest('./built')));
