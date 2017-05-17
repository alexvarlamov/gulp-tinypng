# [gulp](https://github.com/creative/gulp-tinypng)-tinypng

> Minify PNG  using [tinypng](https://tinypng.com/)



## Install

Install with [npm](https://npmjs.org/package/gulp-tinypng)

```
npm install --save-dev gulp-tinypng
```


## Example

```js
var gulp = require('gulp');
var tinypng = require('gulp-tinypng');

gulp.task('tinypng', function () {
	gulp.src('src/**/*.png')
		.pipe(tinypng({
					apiKey: ['API_KEY'],
					cached: true
		}))
		.pipe(gulp.dest('compressed_images'));
});
```


## API

### tinypng(options)


## License

MIT © [Gaurav Jassal](http://gaurav.jassal.me)
