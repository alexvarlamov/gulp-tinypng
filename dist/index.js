"use strict";

Object.defineProperty(exports, "__esModule", {
	value: !0
});
exports.gulpTiny = void 0;

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator"),
    _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2),
    _promise = require("babel-runtime/core-js/promise"),
    _promise2 = _interopRequireDefault(_promise),
    _path2 = require("path"),
    _gulpUtil = require("gulp-util"),
    _through = require("through2"),
    _through2 = _interopRequireDefault(_through),
    _rmdir = require("rmdir"),
    _rmdir2 = _interopRequireDefault(_rmdir),
    _mkdirp = require("mkdirp"),
    _mkdirp2 = _interopRequireDefault(_mkdirp),
    _md = require("md5"),
    _md2 = _interopRequireDefault(_md),
    _prettyBytes = require("pretty-bytes"),
    _prettyBytes2 = _interopRequireDefault(_prettyBytes),
    _request = require("request"),
    _request2 = _interopRequireDefault(_request),
    _fs = require("fs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PLUGIN_NAME = "gulp-tiny",
      TEMP_DIR = '.gulp/tinypng';

let CURRENT_KEY = 0,
    CURRENT_COUNT = null,
    MAX_COUNT = 499;


const cleanTemp = () => {
	(0, _rmdir2.default)(TEMP_DIR, err => {
		if (err) {
			console.error('Error creating temp folder');
		}
		(0, _mkdirp2.default)(TEMP_DIR, err => {
			if (err) {
				console.error('Error creating temp folder');
			}
		});
	});
},
      createTempDir = () => {
	(0, _fs.access)(TEMP_DIR, _fs.F_OK, err => {
		if (err) {
			(0, _mkdirp2.default)(TEMP_DIR, err => {
				if (err) {
					console.error('Error creating temp folder');
				}
			});
		}
	});
},
      readTemp = (filename, cb) => {
	(0, _fs.readFile)((0, _path2.join)(TEMP_DIR, filename), (err, data) => {
		if (err) {
			return cb(new _gulpUtil.PluginError(PLUGIN_NAME, err));
		}
		cb(null, data);
	});
},
      download = (uri, filename) => {
	return new _promise2.default((resolve, reject) => {
		_request2.default.head(uri, err => {
			if (err) {
				reject(err);
			} else {
				const path = (0, _path2.join)(TEMP_DIR, filename);
				(0, _request2.default)({ url: uri, strictSSL: !1 }).pipe((0, _fs.createWriteStream)(path)).on('close', resolve);
			}
		});
	});
},
      compile = (() => {
	var _ref = (0, _asyncToGenerator3.default)(function* (file, size = [], apiKey, cb) {
		try {
			const data_return = [],
			      AUTH_TOKEN = new Buffer('api:' + apiKey).toString('base64');

			(0, _request2.default)({
				url: 'https://api.tinypng.com/shrink',
				method: 'POST',
				strictSSL: !1,
				headers: {
					Accept: '*/*',
					"Cache-Control": 'no-cache',
					"Content-Type": 'application/x-www-form-urlencoded',
					Authorization: 'Basic ' + AUTH_TOKEN
				},
				body: file.contents
			}, (() => {
				var _ref2 = (0, _asyncToGenerator3.default)(function* (err, resp, body) {
					try {
						if (err !== null) throw new _gulpUtil.PluginError(PLUGIN_NAME, err);
						const answer = JSON.parse(body),
						      answ = resp.toJSON(),
						      count = parseInt(answ.headers['compression-count']);

						CURRENT_COUNT = count;

						if (answer.output && answer.output.url) {
							const filename = (0, _md2.default)(file.contents);
							yield download(answer.output.url, filename);
							yield new _promise2.default(function (resolve) {
								(0, _fs.readFile)((0, _path2.join)(TEMP_DIR, filename), function (err, content) {
									if (err) throw new _gulpUtil.PluginError(PLUGIN_NAME, err);
									data_return.push({ content });
									resolve();
								});
							});
							const nsize = size.map(function ({ name, method, width, height }) {
								return new _promise2.default(function (resolve) {
									(0, _request2.default)({
										url: answer.output.url,
										method: 'GET',
										strictSSL: !1,
										headers: {
											Accept: '*/*',
											"Cache-Control": 'no-cache',
											"Content-Type": 'application/json',
											Authorization: 'Basic ' + AUTH_TOKEN
										},
										json: {
											resize: { method, width, height }
										}
									}, function (err, resp) {
										if (!err) {
											const answ = resp.toJSON(),
											      count = parseInt(answ.headers['compression-count']);

											CURRENT_COUNT = count;
										}
									}).pipe((0, _fs.createWriteStream)((0, _path2.join)(TEMP_DIR, filename + "_" + name))).on('close', function () {
										data_return.push({ filename: filename + "_" + name, folder: name });
										resolve();
									});
								});
							});
							_promise2.default.all(nsize).then(function () {
								cb(data_return);
							});
						}
					} catch (err) {
						throw new _gulpUtil.PluginError(PLUGIN_NAME, err);
					}
				});

				return function (_x2, _x3, _x4) {
					return _ref2.apply(this, arguments);
				};
			})());
		} catch (error) {
			throw new _gulpUtil.PluginError(PLUGIN_NAME, error);
		}
	});

	return function compile(_x) {
		return _ref.apply(this, arguments);
	};
})(),
      compileTest = (() => {
	var _ref3 = (0, _asyncToGenerator3.default)(function* (keys, file, size, cb) {
		try {
			yield new _promise2.default(function (resolve) {
				if (CURRENT_COUNT == null) {
					const apiKey = keys[CURRENT_KEY],
					      AUTH_TOKEN = new Buffer('api:' + apiKey).toString('base64');


					(0, _request2.default)({
						url: 'https://api.tinypng.com/shrink',
						method: 'POST',
						strictSSL: !1,
						headers: {
							Accept: '*/*',
							"Cache-Control": 'no-cache',
							Authorization: 'Basic ' + AUTH_TOKEN
						}
					}, function (error, response, body) {
						try {
							if (error !== null) throw new _gulpUtil.PluginError(PLUGIN_NAME, error);
							const answer = response.toJSON(),
							      count = parseInt(answer.headers['compression-count']);

							CURRENT_COUNT = count;
							resolve();
						} catch (err) {
							throw new _gulpUtil.PluginError(PLUGIN_NAME, err);
						}
					});
				} else {
					resolve();
				}
			});
			if (CURRENT_COUNT >= MAX_COUNT) {
				if (keys.length <= CURRENT_KEY + 1) throw new _gulpUtil.PluginError(PLUGIN_NAME, "All api keys used!");
				CURRENT_KEY++;
				CURRENT_COUNT = null;
				yield compileTest(keys, file, cb);
			} else {
				const apiKey = keys[CURRENT_KEY];
				compile(file, size, apiKey, cb);
			}
		} catch (error) {
			throw new _gulpUtil.PluginError(PLUGIN_NAME, error);
		}
	});

	return function compileTest(_x5, _x6, _x7, _x8) {
		return _ref3.apply(this, arguments);
	};
})(),
      tinypng = (keys, file, size = [], exit_path, cb) => {
	const tmpFileName = (0, _md2.default)(file.contents);
	readTemp(tmpFileName, (err, tmpFile) => {
		if (err) {
			compileTest(keys, file, size, cb);
		} else {
			try {
				const _path = (0, _path2.parse)(file.path);
				size.forEach(({ name }) => {
					const dir = (0, _path2.join)(exit_path, name);
					(0, _fs.access)(dir, _fs.F_OK, err => {
						if (err) {
							(0, _mkdirp2.default)(dir, err => {
								if (err) {
									console.error('Error creating temp folder', err);
								} else {
									(0, _fs.writeFileSync)((0, _path2.join)(dir, _path.base), (0, _fs.readFileSync)((0, _path2.join)(TEMP_DIR, tmpFileName + "_" + name)));
								}
							});
						} else {
							(0, _fs.writeFileSync)((0, _path2.join)(dir, _path.base), (0, _fs.readFileSync)((0, _path2.join)(TEMP_DIR, tmpFileName + "_" + name)));
						}
					});
				});
				cb([{ content: tmpFile }]);
			} catch (err) {
				compileTest(keys, file, size, cb);
			}
		}
	});
};

const gulpTiny = exports.gulpTiny = (options = {}) => {
	const { apiKeys, cached, max_count, size, exit_path } = options;

	MAX_COUNT = max_count || MAX_COUNT;

	if (!(apiKeys instanceof Array && apiKeys.length)) throw new _gulpUtil.PluginError(PLUGIN_NAME, "Missing api key!");
	if (!exit_path) throw new _gulpUtil.PluginError(PLUGIN_NAME, "Exit path is empty!");

	if (!cached) {
		cleanTemp();
	} else {
		createTempDir();
	}

	return _through2.default.obj(function (file, enc, callback) {
		if (file.isNull()) {
			this.push(file); // Do nothing if no contents
			return callback();
		}

		if (file.isBuffer()) {
			const prevLength = file.contents.length,
			      self = this;


			tinypng(apiKeys, file, size, exit_path, data => {
				const _path = (0, _path2.parse)(file.path);
				file.contents = data[0].content;
				self.push(file);

				data.forEach(({ filename, folder }) => {
					if (folder) {
						const dir = (0, _path2.join)(exit_path, folder);
						(0, _fs.access)(dir, _fs.F_OK, err => {
							if (err) {
								(0, _mkdirp2.default)(dir, err => {
									if (err) {
										console.error('Error creating temp folder', err);
									} else {
										(0, _fs.writeFileSync)((0, _path2.join)(dir, _path.base), (0, _fs.readFileSync)((0, _path2.join)(TEMP_DIR, filename)));
									}
								});
							} else {
								(0, _fs.writeFileSync)((0, _path2.join)(dir, _path.base), (0, _fs.readFileSync)((0, _path2.join)(TEMP_DIR, filename)));
							}
						});
					}
				});

				(0, _gulpUtil.log)('gulp-tinypng: ', _gulpUtil.colors.green('✔ ') + file.relative + ' (saved ' + (0, _prettyBytes2.default)(prevLength - file.contents.length) + ' - ' + ((1 - file.contents.length / prevLength) * 100).toFixed(0) + '%)  --- KEY USED: ' + (CURRENT_COUNT == null ? "From cache" : CURRENT_COUNT + '/' + MAX_COUNT + " (" + apiKeys[CURRENT_KEY] + ")"));

				return callback();
			});
		}

		if (file.isStream()) {
			throw new _gulpUtil.PluginError(PLUGIN_NAME, "Stream is not supported");
			return callback();
		}
	});
};

exports.default = gulpTiny;