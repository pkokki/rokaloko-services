const gulp = require('gulp');
const tslint = require('gulp-tslint');
const rimraf = require('gulp-rimraf');
const mocha = require('gulp-mocha');
const log = require('gulplog');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

/**
 * Lint typeScript source files.
 */
gulp.task('tslint', () => {
    return gulp.src('src/**/*.ts')
        .pipe(tslint({
            formatter: 'prose'
        }))
        .pipe(tslint.report());
});

/**
 * Remove build directory.
 */
gulp.task('clean', () => {
    return gulp.src('dist/', { read: false, allowEmpty: true })
        .pipe(rimraf());
});

/**
 * Compile typescript
 */
gulp.task('compile', () => {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest('dist'));
});

/**
 * Copy assets files
 */
gulp.task('assets', () => {
    return gulp.src('src/assets/*.*')
        .pipe(gulp.dest('./dist/src/assets'));
});

/**
 * Build the project.
 */
gulp.task('build', gulp.series('tslint', 'clean', 'compile', 'assets'));


/**
 * Run tests with mocha.
 */
gulp.task('test', () => {
    return gulp.src(['dist/test/**/*.spec.js'], { read: false })
        .pipe(mocha({ reporter: 'spec', fullTrace: false, exit: true }))
        .on('error', log.error);
});

/**
 * Build the project & run tests with mocha.
 */
gulp.task('build-test', gulp.series('build', 'test'));


/**
 * Watch source changes and run tests
 */
gulp.task('tdd', () => {
    gulp.watch(['src/**', 'test/**'], gulp.series('build-test'));
});
