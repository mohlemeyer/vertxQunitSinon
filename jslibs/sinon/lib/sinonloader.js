/**
 * Sinon loader for Vert.x 2
 *
 * @author Matthias Ohlemeyer (mohlemeyer@gmail.com)
 * @license BSD
 *
 * Copyright (c) 2013 Matthias Ohlemeyer
 */
var sinon = require('./sinon');

sinon.spy = require("./sinon/spy");
sinon.spyCall = require("./sinon/call");
sinon.stub = require("./sinon/stub");
sinon.mock = require("./sinon/mock");
sinon.collection = require("./sinon/collection");
sinon.sandbox = require("./sinon/sandbox");
sinon.test = require("./sinon/test");
sinon.testCase = require("./sinon/test_case");
sinon.assert = require("./sinon/assert");
sinon.match = require("./sinon/match");

module.exports = sinon;