import {resolve, join, parse} from "path";
import {PluginError, log, colors} from "gulp-util";
import through from "through2";
import rmdir from "rmdir";
import mkdirp from "mkdirp";
import md5 from "md5";
import prettyBytes from "pretty-bytes";
import request from "request";
import {access, F_OK, readFile, createWriteStream, writeFileSync, readFileSync} from "fs";

const PLUGIN_NAME = "gulp-tiny";
const TEMP_DIR = '.gulp/tinypng';
let CURRENT_KEY = 0;
let CURRENT_COUNT = null;
let MAX_COUNT = 499;

const cleanTemp = () => {
	rmdir(TEMP_DIR, (err) => {
		if (err) {
			console.error('Error creating temp folder');
		}
		mkdirp(TEMP_DIR, (err) => {
			if (err) {
				console.error('Error creating temp folder');
			}
		});
	});
};

const createTempDir = () => {
	access(TEMP_DIR, F_OK, (err) => {
		if (err) {
			mkdirp(TEMP_DIR, (err) => {
				if (err) {
					console.error('Error creating temp folder');
				}
			});
		}
	});
};

const readTemp = (filename, cb) => {
	readFile(join(TEMP_DIR, filename), (err, data) => {
		if (err) {
			return cb(new PluginError(PLUGIN_NAME, err));
		}
		cb(null, data);
	});
};

const download = (uri, filename) => {
	return new Promise((resolve, reject) => {
		request.head(uri, (err) => {
			if (err) {
				reject(err);
			} else {
				const path = join(TEMP_DIR, filename);
				request({url: uri, strictSSL: false})
					.pipe(createWriteStream(path))
					.on('close', resolve);
			}
		});
	});
};

const compile = async (file, size = [], apiKey, cb) => {
	try {
		const data_return = [];
		const AUTH_TOKEN = new Buffer('api:' + apiKey).toString('base64');
		request({
			url: 'https://api.tinypng.com/shrink',
			method: 'POST',
			strictSSL: false,
			headers: {
				'Accept': '*/*',
				'Cache-Control': 'no-cache',
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': 'Basic ' + AUTH_TOKEN
			},
			body: file.contents
		}, async (err, resp, body) => {
			const answer = JSON.parse(body);
			const answ = resp.toJSON();
			const count = parseInt(answ.headers['compression-count']);
			CURRENT_COUNT = count;

			if (answer.output && answer.output.url) {
				const filename = md5(file.contents);
				await download(answer.output.url, filename);
				await new Promise((resolve) => {
					readFile(join(TEMP_DIR, filename), (err, content) => {
						if (err) throw new PluginError(PLUGIN_NAME, err);
						data_return.push({content});
						resolve();
					});
				});
				const nsize = size.map(({name, method, width, height}) => {
					return new Promise((resolve) => {
						request({
							url: answer.output.url,
							method: 'GET',
							strictSSL: false,
							headers: {
								'Accept': '*/*',
								'Cache-Control': 'no-cache',
								'Content-Type': 'application/json',
								'Authorization': 'Basic ' + AUTH_TOKEN
							},
							json: {
								resize: {method, width, height}
							}
						}, (err, resp) => {
							if (!err) {
								const answ = resp.toJSON();
								const count = parseInt(answ.headers['compression-count']);
								CURRENT_COUNT = count;
							}
						})
							.pipe(createWriteStream(join(TEMP_DIR, filename + "_" + name)))
							.on('close', () => {
								data_return.push({filename: filename + "_" + name, folder: name});
								resolve();
							});

					})
				});
				Promise.all(nsize).then(() => {
					cb(data_return);
				});
			}

		});
	} catch (error) {
		throw new PluginError(PLUGIN_NAME, error);
	}
};

const compileTest = async (keys, file, size, cb) => {
	try {
		await new Promise((resolve) => {
			if (CURRENT_COUNT == null) {
				const apiKey = keys[CURRENT_KEY];
				const AUTH_TOKEN = new Buffer('api:' + apiKey).toString('base64');

				request({
					url: 'https://api.tinypng.com/shrink',
					method: 'POST',
					strictSSL: false,
					headers: {
						'Accept': '*/*',
						'Cache-Control': 'no-cache',
						'Authorization': 'Basic ' + AUTH_TOKEN
					}
				}, (error, response, body) => {
					const answer = response.toJSON();
					const count = parseInt(answer.headers['compression-count']);
					CURRENT_COUNT = count;
					resolve();
				});
			} else {
				resolve();
			}
		});
		if (CURRENT_COUNT >= MAX_COUNT) {
			if (keys.length <= (CURRENT_KEY + 1)) throw new PluginError(PLUGIN_NAME, "All api keys used!");
			CURRENT_KEY++;
			CURRENT_COUNT = null;
			await compileTest(keys, file, cb);
		} else {
			const apiKey = keys[CURRENT_KEY];
			compile(file, size, apiKey, cb);
		}

	} catch (error) {
		throw new PluginError(PLUGIN_NAME, error);
	}
};

const tinypng = (keys, file, size = [], exit_path, cb) => {
	const tmpFileName = md5(file.contents);
	readTemp(tmpFileName, (err, tmpFile) => {
		if (err) {
			compileTest(keys, file, size, cb)
		} else {
			try {
				const _path = parse(file.path);
				size.forEach(({name}) => {
					const dir = join(exit_path, name);
					access(dir, F_OK, (err) => {
						if (err) {
							mkdirp(dir, (err) => {
								if (err) {
									console.error('Error creating temp folder', err);
								} else {
									writeFileSync(join(dir, _path.base), readFileSync(join(TEMP_DIR, tmpFileName+"_"+name)));
								}
							});
						} else {
							writeFileSync(join(dir, _path.base), readFileSync(join(TEMP_DIR, tmpFileName+"_"+name)));
						}
					});
				});
				cb([{content: tmpFile}]);
			} catch (err) {
				compileTest(keys, file, size, cb)
			}
		}
	});
};

export const gulpTiny = (options = {}) => {
	const {apiKeys, cached, max_count, size, exit_path} = options;

	MAX_COUNT = max_count || MAX_COUNT;

	if (!(apiKeys instanceof Array && apiKeys.length)) throw new PluginError(PLUGIN_NAME, "Missing api key!");
	if (!exit_path) throw new PluginError(PLUGIN_NAME, "Exit path is empty!");

	if (!cached) {
		cleanTemp();
	}
	else {
		createTempDir();
	}

	return through.obj(function (file, enc, callback) {
		if (file.isNull()) {
			this.push(file); // Do nothing if no contents
			return callback();
		}

		if (file.isBuffer()) {
			const prevLength = file.contents.length;
			const self = this;

			tinypng(apiKeys, file, size, exit_path, (data) => {
				const _path = parse(file.path);
				file.contents = data[0].content;
				self.push(file);

				data.forEach(({filename, folder}) => {
					if (folder) {
						const dir = join(exit_path, folder);
						access(dir, F_OK, (err) => {
							if (err) {
								mkdirp(dir, (err) => {
									if (err) {
										console.error('Error creating temp folder', err);
									} else {
										writeFileSync(join(dir, _path.base), readFileSync(join(TEMP_DIR, filename)));
									}
								});
							} else {
								writeFileSync(join(dir, _path.base), readFileSync(join(TEMP_DIR, filename)));
							}
						});
					}
				});

				log('gulp-tinypng: ', colors.green('✔ ') + file.relative + ' (saved ' + prettyBytes(prevLength - file.contents.length) + ' - ' + ((1 - file.contents.length / prevLength) * 100).toFixed(0) + '%)  --- KEY USED: ' +(CURRENT_COUNT == null ? "From cache" : CURRENT_COUNT + '/' + MAX_COUNT));

				return callback();
			});
		}

		if (file.isStream()) {
			throw new PluginError(PLUGIN_NAME, "Stream is not supported");
			return callback();
		}
	});
};

export default gulpTiny;
