var gulp = require('gulp');
var concat = require('gulp-concat');
var ngAnnotate = require('gulp-ng-annotate');
var plumber = require('gulp-plumber');

gulp.task('app', function() {
    return gulp.src(['public/app/**/app.js', 'public/app/**/*.module.js', 'public/app/**/*.js'])
	    .pipe(plumber())
			.pipe(concat('app.js', {newLine: ';'}))
			.pipe(ngAnnotate({add: true}))
	    .pipe(plumber.stop())
.pipe(gulp.dest('public/src/'));
});
