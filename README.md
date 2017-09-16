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
	gulp.src('src/**/*.png')
		.pipe(tinypng({
			apiKey: ['API_KEY'],
			cached: true,
			size: [
				{ name: "hd", "method": "fit", "width": 1280, "height": 720 }
			]
		}))
		.pipe(gulp.dest('compressed_images'));
});
```

## License

MIT
