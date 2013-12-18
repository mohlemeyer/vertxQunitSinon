module.exports = function (moduleContext) {
    moduleContext.QUnit = require('jslibs/qunit/qunit/qunit');
    moduleContext.sinon = require('jslibs/sinon/lib/sinonloader');
    
    // Expose QUnit methods as "global" methods.
    // Exclude "module" because it is already defined in the vertx
    // CommonJS environment
    ['asyncTest', 'deepEqual', 'equal', 'expect', 'notDeepEqual',
     'notEqual', 'notStrictEqual', 'ok', 'raises', 'start', 'stop',
     'strictEqual', 'test', 'throws'].forEach(function(methodName) {
         moduleContext[methodName] = moduleContext.QUnit[methodName];
     });
};

// TODO: Code documentation, Documentation in README