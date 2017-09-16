var gulp = require('gulp');
var gutil = require('gulp-util');
var tinypng = require('./dist/index').default;
const resolve = require("path").resolve;


// const TINYPNG_API = "8FiQFj9oWwEyTBHMMwxjvuYNx05Fphk2";
// const TINYPNG_API = ["RsN84oBjmXxPkCB5s_ZlfA1fRS1U32LY"];
const TINYPNG_API = ["durCxw2lwQgJmxvwOnpyLrMdEsNEImOY"];

gulp.task('tinypng', function () {
	const exit_path = resolve('compressed_images');
	return gulp.src('original_images/**/*.{png,jpg,jpeg}')
		.pipe(tinypng({
			apiKeys: TINYPNG_API,
			cached: true,
			size: [
				{ name: "hd", method: "fit", width: 480, height: 320 }
			],
			exit_path
		}))
		.pipe(gulp.dest(exit_path));
});
