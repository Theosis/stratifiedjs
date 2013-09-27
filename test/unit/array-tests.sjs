var testUtil = require('../lib/testUtil');
var testEq = testUtil.test;
var {test, context, assert} = require('sjs:test/suite');

var array = require("sjs:array");

testEq("flatten recursively", "1|2|3|4|5|6|7|8|9|10", function() {
	var a = [1,2,[3,4,[5,6]],[[7,8]],[9],10];
	var b = array.flatten(a);
	return b.join("|")
});

test("contains") {||
	assert.ok([1,2,3] .. array.contains(2));
	assert.notOk([1,2,3] .. array.contains(5));
}

context("cmp") {||
	test("on two equal arrays", -> [1,2,3] .. array.cmp([1,2,3]) .. assert.eq(0));
	test("first element (a smaller)", -> [0,2,3] .. array.cmp([1,2,3]) .. assert.eq(-1));
	test("first element (b smaller)", -> [1,2,3] .. array.cmp([0,2,3]) .. assert.eq(1));
	test("last element (a smaller)", -> [1,2,2] .. array.cmp([1,2,3]) .. assert.eq(-1));
	test("last element (b smaller)", -> [1,2,3] .. array.cmp([1,2,2]) .. assert.eq(1));
	test("a shorter", -> [1,2] .. array.cmp([1,2,3]) .. assert.eq(-1));
	test("b shorter", -> [1,2,3] .. array.cmp([1,2]) .. assert.eq(1));
}
