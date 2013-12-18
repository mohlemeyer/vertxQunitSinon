/**
 * Vertx QUnit testrunner
 *
 * @author Matthias Ohlemeyer (mohlemeyer@gmail.com)
 * @license MIT
 *
 * Copyright (c) 2013 Matthias Ohlemeyer
 */
var vertx = require('vertx');
var console = require('vertx/console');
var QUnit = require('jslibs/qunit/qunit/qunit');
var xmlMapper = require('jslibs/qunit/thirdPartyDeps/node-xml-mapping/lib/xml-mapping');

/**
 * Vertx QUnit testrunner<br>
 * <br>
 * @param {object} [options] Configuration for the testrunner
 * @param {string} {startDir=.] Start directory from which to recurse into 
 * subdirectories to look for testfiles. Maximum directory recursion depth is
 * arbitrarily set fixed to 99.<br>
 * NOTE: The default start directory "." is relative to the module's
 * root directory, not the directoy from which the testrunner is called.
 * @param {string} [testFilePattern=^test_.+\\.js$] String representation of a
 * regular expression to find testfiles in the start directory and
 * subdirectories.<br>
 * NOTE: Always use a specific testfile pattern, not something like
 * <code>test_.*</code>, because the testrunner might find files you would not
 * expect, e.g. artifacts from your version control system in hidden
 * directories.
 * @param {boolean} [silent=false] Flag to suppress console output.
 * @param {function} callback Function to call after running all tests. The
 * function receives a JUnit compatible XML string as its single argument.
 */
module.exports = function (options, callback) {
	var startDir;			// Start directory from which to recurse
	var testFilePattern;	// Regex for testfilenames
	var silent;				// With silent = true no console output is produced
    var testFiles;          // Array of files (absolute path) to test
    var resultJSON;         // The result as a JSON object for later XML output
    var noModuleStartedYet; // Indicator: True until the first module is started
    var testMessages;       // Container (array) for messages in a test
    var expectedValues;     // Container (array) for expected values
    var actualValues;       // Container (array) for actual values
    var testFailed;         // Indicator: True if a test failed
    var testDied;           // Indicator: True if a test died
    var i;                  // Iterator
    
    // Constants
    var fileSep = Packages.java.lang.System.getProperty("file.separator") || "/";
    var testFilePatternDefault = '^test_.+\\.js$';
    var hr = '----------------------------------------';
    var maxDirRecursionDepth = 99;
    
    // Set defaults
    startDir = '.';
    testFilePattern = testFilePatternDefault;
    silent = false;
    
    // Set run properties
    if (arguments.length === 1 && typeof arguments[0] === 'function') {
    	callback = arguments[0];
    } else if (typeof options === 'object') {
    	startDir = (typeof options.startDir === 'string') ?
    			options.startDir : startDir;
    	testFilePattern = (typeof options.testFilePattern === 'string') ?
    			options.testFilePattern : testFilePattern;
    	silent = (typeof options.silent === 'boolean') ?
    			options.silent : silent;    	
    }
    
    if (typeof callback !== 'function') {
    	throw new Error('Must provide a callback function to start the ' +
    			'QUnit testrunner');
    }
    
    // Provid a console logger which respects the "silent" run property
    function consoleLog (logMsg) {
    	if (!silent) console.log(logMsg);
    }
    
    //==========================================================================
    // Set QUnit callbacks for console logging and JUnit compatible output
    //==========================================================================
    
    // Start with an empty <testsuites> tag
    resultJSON = {
            testsuites: {}
    };
    
    noModuleStartedYet = true;
    
    /**
     * A logging callback triggered at the start of every test module.
     * @param {Object} details An object with property "name".
     */
    QUnit.moduleStart(function (details) {
        noModuleStartedYet = false;
        
        consoleLog(hr);
        consoleLog('' + details.name);
        consoleLog(hr);

        // Start a new <testsuite>
        if (!resultJSON.testsuites.testsuite) {
            resultJSON.testsuites.testsuite = [];
        }
        resultJSON.testsuites.testsuite.push({
            name: 'QUnit.' + details.name
        });
    });
    
    /**
     * A logging callback triggered at the end of every test module.
     * @param {Object} details An object with properties "name", "failed",
     * "passed" and "total".
     */
    QUnit.moduleDone(function (details) {
        // Add attributes to the latest <testsuite> element        
        var latestTestSuite;
        if (resultJSON.testsuites.testsuite) {
            latestTestSuite = resultJSON.testsuites.
            testsuite[resultJSON.testsuites.testsuite.length - 1];
            latestTestSuite.failures = details.failed;
            latestTestSuite.tests = details.total;
        }
    });
    
    /**
     * A logging callback triggered at the start of every test.
     * @param {Object} details An object with properties "failed", "name",
     * "passed" and "total".
     */
    QUnit.testStart(function (details) {
        if (noModuleStartedYet) {
            // Start a new <testsuite>
            if (!resultJSON.testsuites.testsuite) {
                resultJSON.testsuites.testsuite = [];
            }
            resultJSON.testsuites.testsuite.push({
                name: 'QUnit.Undefined_Module'
            });

            noModuleStartedYet = false;
        }
        
        // Start a new <testcase>
        var latestTestSuite;
        latestTestSuite = resultJSON.testsuites.
        testsuite[resultJSON.testsuites.testsuite.length - 1];
        if (!latestTestSuite.testcase) {
            latestTestSuite.testcase = [];
        }
        latestTestSuite.testcase.push({
            name: details.name
        });
    });
    
    testMessages = [];
    expectedValues = [];
    actualValues = [];
    testFailed = false;
    testDied = false;
    
    /**
     * A logging callback triggered after a test is completed.
     * @param {Object} details An object with properties "failed", "name",
     * "passed" and "total".
     */
    QUnit.testDone(function (details) {
        
        if (details.failed > 0) {
            consoleLog(' FAIL - '+ details.name);
            testMessages.forEach(function(value) {
                consoleLog('    ' + value);
            });
        } else {
            consoleLog(' PASS - ' + details.name);
        }
        
        // Finalize the latest <testcase>        
        var latestTestSuite;
        var latestTestCase;
        var errorOrFailure;
        
        if (testFailed) {
            latestTestSuite = resultJSON.testsuites.
            testsuite[resultJSON.testsuites.testsuite.length - 1];
            latestTestCase =
                latestTestSuite.testcase[latestTestSuite.testcase.length - 1];
            
            errorOrFailure = {
                    message: testMessages.join('; ')
            };
            
            if (expectedValues.length > 0) {
                errorOrFailure.expected = {
                        $t: expectedValues.join('')
                };
            }
            
            if (actualValues.length > 0) {
                errorOrFailure.actual = {
                        $t: actualValues.join('')
                };
            }
            
            if (testMessages.length > 0) {
                errorOrFailure['$t'] = testMessages.join('\n');
            }

            if (testDied) {
                latestTestCase['error'] = errorOrFailure;
            } else {
                latestTestCase['failure'] = errorOrFailure;
            }
        }
        
        // Reset test case
        testFailed = false;
        testDied = false;
        testMessages = [];
        expectedValues = [];
        actualValues = [];        
    });
    
    /**
     * A logging callback triggered after every assertion.
     * @param {Object} details An object with properties "actual", "expected",
     * "message" and "result".
     */
    QUnit.log(function (details) {
        var testMsg;    // Temporary string variable to construct a test message
        
        if (!details.result) {
            testFailed = true;
            // Add "testMessages" for the failure trace overview
            testMsg =(typeof details.expected !== 'undefined') ?
                    '| EQ | ' : '| OK | ';
            if (typeof details.message !== 'undefined') {
                testMsg = testMsg + details.message;
                if (details.message.indexOf('Died on') === 0) {
                    testDied = true;
                }
            }
            testMessages.push(testMsg);
            
            // Build the messages for the detailed comparison
            // ("Result Comparison" window in eclipse)
            if (typeof details.expected !== 'undefined') {
                expectedValues.push('| EQ | ');
                if (typeof details.message !== 'undefined') {
                    expectedValues.push(details.message);
                }
                expectedValues.push('\n' + QUnit.jsDump.parse(details.expected)
                        + '\n\n');
            }
            if (typeof details.actual !== 'undefined') {
                actualValues.push('| EQ | ');
                if (typeof details.message !== 'undefined') {
                    actualValues.push(details.message);
                }
                actualValues.push('\n' + QUnit.jsDump.parse(details.actual) +
                        '\n\n');
            }
        }
    });
    
    /**
     * A logging callback triggered when all testing is completed.
     * @param {Object} details An object with properties "failed", "passed",
     * "runtime" and "total".
     */    
    QUnit.done(function (details) {
        
        consoleLog(hr);
        consoleLog('    PASS: ' + details.passed + '  FAIL: ' +
                details.failed + '  TOTAL: ' + details.total);
        consoleLog('    Finished in ' + details.runtime + ' milliseconds.');
        consoleLog(hr);

        if (typeof callback === 'function') {
            callback(xmlMapper.dump(resultJSON, {indent: true}));
        }
    });
    
    //==========================================================================
    // Initialize QUnit
    //==========================================================================
    QUnit.config.autostart = false;
    QUnit.init();

    //==========================================================================
    // Load test files
    //==========================================================================
    
    /*
     * Helper function to recursively retrieve files in the vertx filesystem.
     * 
     * @param path string Filesystem path; '.' is the top level path in the
     * vertx filesystem. Absolute paths are allowed.
     * @param filter string File filter as a regular expression in string
     * notation.
     * @param number [maxDepth=1] Maximum recursion depth.
     * Minimum value and default is 1.
     * @returns array An array of path and filenames relative to the vertx
     * filesystem root.
     */
    function recurseDirSync (path, filter, maxDepth) {
        var paths;
        var dirStack;
        var depth;
        var pathPrefixLength;
        
        function readDirAndRecurse () {
            var dir;
            var dirContents;
            var rootDirContents;
            var filteredDirContents;
            var i;
            
            depth++;
            if (depth > maxDepth || dirStack.length === 0) {
                return;
            }
            dir = dirStack.pop();
            dirContents = vertx.fileSystem.readDirSync(dir, '.*');
            
            // Determine length of the prefix of the absolute path to the
            // vertx filesystem root.
            if (depth === 1 && dirContents.length > 0) {
                rootDirContents = vertx.fileSystem.readDirSync('.', '.*');
                pathPrefixLength = rootDirContents[0].lastIndexOf(fileSep) + 1;
            }
            
            for (i = 0; i < dirContents.length; i++) {
                if (vertx.fileSystem.propsSync(dirContents[i]).isDirectory) {
                    dirStack.push(dirContents[i]);
                }
            }
            filteredDirContents = vertx.fileSystem.readDirSync(dir, filter);
            for (i = 0; i < filteredDirContents.length; i++) {
                paths.push(filteredDirContents[i].slice(pathPrefixLength));
            }
            
            readDirAndRecurse();
        } // END: readDirAndRecurse()
        
        paths = [];
        dirStack = [];
        depth = 0;
        if (typeof path === 'string' &&
                vertx.fileSystem.propsSync(path).isDirectory) {
            dirStack.push(path);
        }
        if (typeof filter !== 'string') {
            filter = '.*';
        }
        if (typeof maxDepth !== 'number' || maxDepth < 1) {
            maxDepth = 1;
        }
        
        readDirAndRecurse();
        return paths;
    } // END: recurseDirSync()
    
    testFiles = recurseDirSync(startDir, testFilePattern, maxDirRecursionDepth);
    for (i = 0; i < testFiles.length; i++) {
        consoleLog('Loading testfile: ' + testFiles[i]);
        require(testFiles[i]);
    }
    
    //==========================================================================
    // Start QUnit (necessary, when run from the command line)
    //==========================================================================
    QUnit.start();
};