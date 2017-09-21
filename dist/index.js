"use strict";

Object.defineProperty(exports, "__esModule", {
	value: !0
});
exports.gulpTiny = void 0;

var _regenerator = require("babel-runtime/regenerator"),
    _regenerator2 = _interopRequireDefault(_regenerator),
    _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator"),
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

var PLUGIN_NAME = "gulp-tiny",
    TEMP_DIR = '.gulp/tinypng',
    CURRENT_KEY = 0,
    CURRENT_COUNT = null,
    MAX_COUNT = 499,
    cleanTemp = function cleanTemp() {
	(0, _rmdir2.default)(TEMP_DIR, function (err) {
		if (err) {
			console.error('Error creating temp folder');
		}
		(0, _mkdirp2.default)(TEMP_DIR, function (err) {
			if (err) {
				console.error('Error creating temp folder');
			}
		});
	});
},
    createTempDir = function createTempDir() {
	(0, _fs.access)(TEMP_DIR, _fs.F_OK, function (err) {
		if (err) {
			(0, _mkdirp2.default)(TEMP_DIR, function (err) {
				if (err) {
					console.error('Error creating temp folder');
				}
			});
		}
	});
},
    readTemp = function readTemp(filename, cb) {
	(0, _fs.readFile)((0, _path2.join)(TEMP_DIR, filename), function (err, data) {
		if (err) {
			return cb(new _gulpUtil.PluginError(PLUGIN_NAME, err));
		}
		cb(null, data);
	});
},
    download = function download(uri, filename) {
	return new _promise2.default(function (resolve, reject) {
		_request2.default.head(uri, function (err) {
			if (err) {
				reject(err);
			} else {
				var path = (0, _path2.join)(TEMP_DIR, filename);
				(0, _request2.default)({ url: uri, strictSSL: !1 }).pipe((0, _fs.createWriteStream)(path)).on('close', resolve);
			}
		});
	});
},
    compile = function () {
	var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(file) {
		var size = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [],
		    apiKey = arguments[2],
		    cb = arguments[3],
		    data_return = void 0,
		    AUTH_TOKEN = void 0;
		return _regenerator2.default.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						_context2.prev = 0;
						data_return = [], AUTH_TOKEN = new Buffer('api:' + apiKey).toString('base64');

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
						}, function () {
							var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(err, resp, body) {
								var answer, answ, count, filename, nsize;
								return _regenerator2.default.wrap(function _callee$(_context) {
									while (1) {
										switch (_context.prev = _context.next) {
											case 0:
												_context.prev = 0;

												if (!(err !== null)) {
													_context.next = 3;
													break;
												}

												throw new _gulpUtil.PluginError(PLUGIN_NAME, err);

											case 3:
												answer = JSON.parse(body), answ = resp.toJSON(), count = parseInt(answ.headers['compression-count']);

												CURRENT_COUNT = count;

												if (!(answer.output && answer.output.url)) {
													_context.next = 13;
													break;
												}

												filename = (0, _md2.default)(file.contents);
												_context.next = 9;
												return download(answer.output.url, filename);

											case 9:
												_context.next = 11;
												return new _promise2.default(function (resolve) {
													(0, _fs.readFile)((0, _path2.join)(TEMP_DIR, filename), function (err, content) {
														if (err) throw new _gulpUtil.PluginError(PLUGIN_NAME, err);
														data_return.push({ content: content });
														resolve();
													});
												});

											case 11:
												nsize = size.map(function (_ref3) {
													var name = _ref3.name,
													    method = _ref3.method,
													    width = _ref3.width,
													    height = _ref3.height;

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
																resize: { method: method, width: width, height: height }
															}
														}, function (err, resp) {
															if (!err) {
																var _answ = resp.toJSON(),
																    _count = parseInt(_answ.headers['compression-count']);

																CURRENT_COUNT = _count;
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

											case 13:
												_context.next = 18;
												break;

											case 15:
												_context.prev = 15;
												_context.t0 = _context["catch"](0);
												throw new _gulpUtil.PluginError(PLUGIN_NAME, _context.t0);

											case 18:
											case "end":
												return _context.stop();
										}
									}
								}, _callee, void 0, [[0, 15]]);
							}));

							return function (_x3, _x4, _x5) {
								return _ref2.apply(this, arguments);
							};
						}());
						_context2.next = 8;
						break;

					case 5:
						_context2.prev = 5;
						_context2.t0 = _context2["catch"](0);
						throw new _gulpUtil.PluginError(PLUGIN_NAME, _context2.t0);

					case 8:
					case "end":
						return _context2.stop();
				}
			}
		}, _callee2, void 0, [[0, 5]]);
	}));

	return function compile(_x) {
		return _ref.apply(this, arguments);
	};
}(),
    compileTest = function () {
	var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(keys, file, size, cb) {
		var apiKey;
		return _regenerator2.default.wrap(function _callee3$(_context3) {
			while (1) {
				switch (_context3.prev = _context3.next) {
					case 0:
						_context3.prev = 0;
						_context3.next = 3;
						return new _promise2.default(function (resolve) {
							if (CURRENT_COUNT == null) {
								var apiKey = keys[CURRENT_KEY],
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
										var answer = response.toJSON(),
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

					case 3:
						if (!(CURRENT_COUNT >= MAX_COUNT)) {
							_context3.next = 12;
							break;
						}

						if (!(keys.length <= CURRENT_KEY + 1)) {
							_context3.next = 6;
							break;
						}

						throw new _gulpUtil.PluginError(PLUGIN_NAME, "All api keys used!");

					case 6:
						CURRENT_KEY++;
						CURRENT_COUNT = null;
						_context3.next = 10;
						return compileTest(keys, file, cb);

					case 10:
						_context3.next = 14;
						break;

					case 12:
						apiKey = keys[CURRENT_KEY];

						compile(file, size, apiKey, cb);

					case 14:
						_context3.next = 19;
						break;

					case 16:
						_context3.prev = 16;
						_context3.t0 = _context3["catch"](0);
						throw new _gulpUtil.PluginError(PLUGIN_NAME, _context3.t0);

					case 19:
					case "end":
						return _context3.stop();
				}
			}
		}, _callee3, void 0, [[0, 16]]);
	}));

	return function compileTest(_x6, _x7, _x8, _x9) {
		return _ref4.apply(this, arguments);
	};
}(),
    tinypng = function tinypng(keys, file) {
	var size = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [],
	    exit_path = arguments[3],
	    cb = arguments[4],
	    tmpFileName = (0, _md2.default)(file.contents);

	readTemp(tmpFileName, function (err, tmpFile) {
		if (err) {
			compileTest(keys, file, size, cb);
		} else {
			try {
				var _path = (0, _path2.parse)(file.path);
				size.forEach(function (_ref5) {
					var name = _ref5.name,
					    dir = (0, _path2.join)(exit_path, name);

					(0, _fs.access)(dir, _fs.F_OK, function (err) {
						if (err) {
							(0, _mkdirp2.default)(dir, function (err) {
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
var gulpTiny = exports.gulpTiny = function gulpTiny() {
	var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
	    apiKeys = options.apiKeys,
	    cached = options.cached,
	    max_count = options.max_count,
	    size = options.size,
	    exit_path = options.exit_path;


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
			var prevLength = file.contents.length,
			    self = this;


			tinypng(apiKeys, file, size, exit_path, function (data) {
				var _path = (0, _path2.parse)(file.path);
				file.contents = data[0].content;
				self.push(file);

				data.forEach(function (_ref6) {
					var filename = _ref6.filename,
					    folder = _ref6.folder;

					if (folder) {
						var dir = (0, _path2.join)(exit_path, folder);
						(0, _fs.access)(dir, _fs.F_OK, function (err) {
							if (err) {
								(0, _mkdirp2.default)(dir, function (err) {
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