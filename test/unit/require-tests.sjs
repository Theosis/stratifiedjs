var testUtil = require('../lib/testUtil');
var testEq = testUtil.test;
var global = require('sjs:sys').getGlobal();
var http = require('sjs:http');
var logging = require('sjs:logging');
var { merge } = require('sjs:object');
var {test, assert, context} = require('sjs:test/suite');

var dataRoot = './fixtures';

testEq('force extension/sjs', "a=1&b=2", function() {
  return require('sjs:url.sjs').buildQuery({a:1},{b:2});
});

testEq('force extension/js', 42, function() {
  return require(dataRoot + '/testmodule.js').foo(1);
});

testEq('"this" object in modules', this, function() {
  return require(dataRoot + '/testmodule.js').bar.apply(global);
});

context("server-side") {||
  var child_process = require('sjs:nodejs/child-process');
  var path = require('nodejs:path');
  var url = require('sjs:url');

  var modulePath = path.join(url.toPath(module.id), '../');
  var sjsPath = require('sjs:sys').executable;
  var dataPath = path.join(modulePath, dataRoot);

  var run_with_env = function(args, env)
  {
    return child_process.run(sjsPath, args, {
      env: merge(process.env, env || process.env)
    });
  }
  
  test('sjs -e') {|s|
    var result = run_with_env(['-e', 'require("util").puts("hi");'], null);
    result .. assert.eq({stdout: 'hi\n', stderr: ''})
  }
  
  test('hub resolution via $SJS_INIT') {|s|
    var hub_path = path.join(dataPath, 'literal-hub.sjs');
    var script = 'require("util").puts(require("literal:exports.hello=\'HELLO!\'").hello);';
    var result = run_with_env(['-e', script], {SJS_INIT: hub_path});
    result .. assert.eq({stdout: 'HELLO!\n', stderr: ''});
  }

  test('loading .sjs from NODE_PATH') {|s|
    var script = 'try{}or{}; require("util").puts(require("nodejs:child1.sjs").child1_function1());';
    var result = run_with_env(['-e', script], {NODE_PATH: dataPath});
    result .. assert.eq({stdout: '42\n', stderr: ''});
  }

  test('loading .sjs (without an extension) from NODE_PATH') {|s|
    var script = 'waitfor{}or{}; require("util").puts(require("nodejs:child1").child1_function1());';
    var result = run_with_env(['-e', script], {NODE_PATH: dataPath});
    result .. assert.eq({stdout: '42\n', stderr: ''});
  }

  test('export to "this" (when requiring a nodeJS module)') {|s|
    var script = 'require("nodejs:testmodule", {copyTo: this}); require("util").puts(foo(1));';
    var result = run_with_env(['-e', script], {NODE_PATH: dataPath});
    result .. assert.eq({stdout: '42\n', stderr: ''});
  }

  test('require inside a .js file is synchronous') {||
    require('./fixtures/testmodule.js').dynamicRequire() .. assert.eq(1);
  }.skip('BROKEN');

}.serverOnly();

testEq('export to "this"', 42, function() {
  return require(dataRoot + '/parent').export_to_this;
}).ignoreLeaks('child1_function1');

testEq('utf8 characters in modules: U+00E9', 233, function() {
  var data = require(dataRoot + '/utf8').test1();
  return data.charCodeAt(data.length-1);
});

testEq('utf8 characters in modules: U+0192', 402, function() {
  var data = require(dataRoot + '/utf8').test2();
  return data.charCodeAt(data.length-1);
});

test('circular reference throws an exception') {||
  assert.raises(
    {message: /^Circular module dependency loading .*circular_a\.sjs$/},
    -> require('./fixtures/circular_a'));
};

context('hubs.defined()') {||
  test('sjs:', -> require.hubs.defined("sjs:") .. assert.eq(true));
  test('github:', -> require.hubs.defined("github:") .. assert.eq(true));
  test('sj', -> require.hubs.defined("sj") .. assert.eq(true));
  test('sjs:somemod', -> require.hubs.defined("sjs:somemod") .. assert.eq(true));
  test('sjs_', -> require.hubs.defined("sjs_") .. assert.eq(false));
}

context('hubs.addDefault()') {||
  test.beforeEach {|s|
    s.hublen = require.hubs.length;
  }
  test.afterEach {|s|
    while(require.hubs.length > s.hublen) require.hubs.pop();
  }

  test('for new hub') {|s|
    require.hubs.addDefault(['newhub:', 'file:///']) .. assert.ok();
    require.hubs.length .. assert.eq(s.hublen + 1);
  }

  test('for existing hub') {|s|
    require.hubs.addDefault(['sjs:somemod', 'file:///']) .. assert.notOk();
    require.hubs.addDefault(['sj', 'file:///']) .. assert.notOk();
    require.hubs.length .. assert.eq(s.hublen);
  }
}
