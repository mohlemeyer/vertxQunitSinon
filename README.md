# Vert.x JavaScript Testrunner
## built on QUnit and  Sinon.JS
This module contains ports of the [QUnit](http://qunitjs.com) and
[Sinon.JS] (http://sinonjs.org) JavaScript testing frameworks for the Vert.x
platform, supplemented by an easy to use testrunner.

# Getting Started
The module has not (yet) been submitted to the Vert.x module registry, but
should be easy enough to use anyway.
* Simply clone the code or download a zip and install in a separate directory
parallel to your locally installed modules.
* Then set up the test module which will hold your test scripts and
[`include`](http://vertx.io/mods_manual.html#includes) the QUnit/Sinon module
as a resource.
* Write a short script as the [`main`](http://vertx.io/mods_manual.html#main)
of your test module to start the testrunner. In its simplest form this might
be a file in your top level directory with the following contents:

```javascript
var container = require('vertx/container');
var runTests = require('jslibs/qunit/vertxTestRnr');

runTests(
  function () {
    container.exit();
  }
);
```
* Write your test scripts in familiar QUnit/Sinon fashion. Per default, all
files in your test module starting with `test_` and ending with `.js` will be
sequentially loaded and executed by the testrunner. Test results will be
printed to the console. A simple test script might look like this:

```javascript
QUnit.module('FirstUnitTests');    // Always use "QUnit.module", not just "module"
test('should pass', function () {
  var fSpied = sinon.spy();
  fSpied();
  ok(fSpied.calledOnce, 'called once');
});
```
* Run your tests by calling `vertx runmod {name of your testmodule}`.

# A Little More Detail
## Configuring the Testrunner
For the following description the testrunner is assumed to be included by the
statement:
```javascript
var runTests = require('jslibs/qunit/vertxTestRnr');
```
The testrunner is then started by:
```javascript
runTests(config, callback);
```
where `config` is an optional configuration object and `callback` is a function
which is called after all tests are completed.

### Configuration Object
The following properties are recognized for the configuration object:
* `config.startDir`: Start directory from which to recurse into
subdirectories to find testfiles. Maximum directory recursion depth is
arbitrarily set fixed to 99.

> NOTE: The default start directory  `.` denotes the module's root directory,
provided the test module is started with
[`preserve-cwd`](http://vertx.io/mods_manual.html#preserve-cwd) set to `false`.

* `config.testFilePattern`: String representation of a regular
expression to identify testfiles in the start directory and alls subdirectories.
The default value is `^test_.+\\.js$`, which will find files starting with
`test_` and ending with `.js`.

> NOTE: Always use a specific testfile pattern, not something generic like
<code>test_.*</code>, because the testrunner might find files you would not
expect, e.g. artifacts from your version control system in "hidden" directories.

* `silent`: Flag to suppress console output. Default is `false`.

### Callback
The `callback` function receives the test results as a JUnit compatible XML
string as its single argument. A typical use case would be to write the JUnit
test results into some file, which can then be picked up by your favorite
CI tool:
```javascript
runTests(
  function (jUnitResult) {
    vertx.fileSystem.writeFileSync({Path_to_JUnit_Testfile}, jUnitResult);
    container.exit();
  }
);
```

## Writing Tests
The individual test files are imported by the testrunner using the `load`
command (in contrast to `require`), which has some notable implications:
* The testfiles will not be treated as CommonJS modules, i.e. they share the
same context and globals and they should not export anything.
* The testrunner sets up some global variables variables which can be directly
used in your test files without importing them by `require`. These are
	* `vertx`: The central vertx object.
	* `console`: The vertx console.
	* `sinon`: The Sinon.JS object providing access to spies, stubs etc.
	* `QUnit`: The QUnit object providing access to the QUnit functionality.
	Nearly all QUnit assert and test commands are provided in the global
	namespace, too. The only exception is the `module` command since that is
	a reserved word in a CommonJS environment. As a consequence you have to
	write `QUnit.module` instead of simply `module` when structuring your tests
	into QUnit modules.
* Although the test files are not themselves CommonJS modules they can (and
should) import other modules via `require`. Very probably the very first
statement in your test files is a `require` for the code/library to test.

# About the module
As noted in the introduction this Vert.x module represents just a thin wrapper
for the QUnit and Sinon.JS libraries to make them compatible with the Vert.x
runtime environment. You will find the code with the required modifications in
the `qunit` and `sinon` subdirectories respectively. The original files are
kept for easy comparison with the modified ones. They have a `_ORIG` suffix
in their file name.

Just a few files like the testrunner or a special sinon loader were written
from scratch.

## Status
The code is in a *Works for me* status.

Above that it was possible to port the QUnit self tests so there might be a
little more trust in the correct functioning of this test framework on Vert.x.
To run the tests for QUnit start this module with `vertx runmod {module_name}`.
The `main` is set to the startup script for the testrunner. Test results will be
printed to the console and written as JUnit output to
`./jslibs/qunit/test/testresult/test.xml`.

Sadly the same can not be said of Sinon.JS (which is not Sinon's fault!). The
Unit tests for Sinon.JS could not be easily ported  to Vert.x since they require
some parts of the Buster.JS testing toolkit which is not (yet) available for
Vert.x. If you like to contribute, this might be good place to start: Write some
QUnit unit tests for Sinon.JS. 

# Credits, Responsibility, Disclaimer
For the most part this Vert.x module contains work of the authors/contributors
of the QUnit and Sinon.JS testing frameworks. For everything that works, the
credits go to the people who make these great tools available as open source.

The author of this module takes responsibility for porting the tools above to
Vert.x and creating a context to make them easily accessible on this platform
with the following notice:

> **The author provides the code for this Vert.x module "as is". If you use it,
you do so at your own risk! The author makes no warranties as to performance,
correctness, fitness for a particular purpose, or any other warranties whether
expressed or implied.**