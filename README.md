# [gulp](https://github.com/iHaiduk/gulp-tinypng)-tinypng

> Minify PNG  using [tinypng](https://tinypng.com/)


## Install

Install with [npm](https://github.com/iHaiduk/gulp-tinypng)

```
npm install --save-dev https://github.com/iHaiduk/gulp-tinypng
```

## Example

```js
var gulp = require('gulp');
var tinypng = require('gulp-tiny');

gulp.task('tinypng', function () {
	const exit_path = resolve('compressed_images');
	return gulp.src('original_images/**/*.{png,jpg,jpeg}')
		.pipe(tinypng({
			apiKeys: ['API_KEY'],
			cached: true,
			size: [
				{ name: "hd", method: "fit", width: 480, height: 320 }
			],
			exit_path
		}))
		.pipe(gulp.dest(exit_path));
});
```

## License

MIT
