/**
 * Startup script to run the QUnit unit tests in test.js and deepEqual.js
 * 
 * @author Matthias Ohlemeyer (mohlemeyer@gmail.com)
 * @license MIT
 *
 * Copyright (c) 2013 Matthias Ohlemeyer
 */
var vertx = require('vertx');
var container = require('vertx/container');
var runTests = require('../vertxTestRnr');

runTests(
		{
			startDir: 'jslibs/qunit/test',
			testFilePattern: '^test.js$|^deepEqual.js$'
		},
		function (junitResult) {
			vertx.fileSystem.writeFileSync('jslibs/qunit/test/testResult/test.xml',
					junitResult);
			container.exit();
		}
);