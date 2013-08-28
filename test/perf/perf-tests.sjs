var http = require('sjs:http');
var testUtil = require('../lib/testUtil');
var test = testUtil.test;
var time = testUtil.time;
var testCompilation = testUtil.testCompilation;

var context = require('sjs:test/suite').context;

var getHttpURL = require("../lib/testContext").getHttpURL;

function testJsonpRequest(opts) {
    return http.jsonp(getHttpURL("data/returnJsonp.template"), [{query: {data:"bananas"}},opts]);
}

time("10 sequential jsonp in-doc requests",
     function() {  for (var i=0;i<10;++i) { testJsonpRequest({iframe:false,query:{cb:Math.random()}}) } }).skip("machinery for this test is not in place atm");

time("10 sequential jsonp iframe requests",
     function() {  for (var i=0;i<10;++i) { testJsonpRequest({iframe:true,query:{cb:Math.random()}}) } }).skip("machinery for this test is not in place atm");

var iter;
eval("iter = function(f,reps) { for (var i=0; i<reps; ++i) f(); }");

var bl_1;
eval("function foo() { var a = 1; return ++a;} bl_1 = function() { iter(foo,1000000);}");


var bl_2;
eval("function bar() { var a = 1; return ++a; a=Math.sin(a)*10; if (a>100)a = 10; else a+=100; try{a/=0}catch(e) {a=1;}finally{if(a) {dump(a);}}} bl_2 = function() { iter(bar,1000000);}");


function small() {
  var a = 1;
  return ++a;
}

function small_addendum() {
  var a = 1;
  return ++a;
  // this code is never reached, but it still adds to the time
  a = Math.sin(a) * 10;
  if (a > 100) a = 10; else a+=100;
  try { a/=0 }catch(e) { a=1; }finally{ if(a) { dump(a); } }
}

time("baseline small * 1000000", function() { bl_1(); });
time("small function *  100000", function() { iter(small, 100000); });
time("baseline small+addendum * 1000000", function() { bl_2(); });
time("small+addendum function *  100000", function() { iter(small_addendum,100000); });

function calculatePi(d) {
  d = Math.floor(d/4)*14;
  var carry = 0;
  var arr = [];
  var sum;
  var i, j;
  for (i = d; i > 0; i -= 14) {
    sum = 0;
    for (j = i; j > 0; --j) {
      sum = sum * j + 10000 * (arr[j] === undefined ? 2000 : arr[j]);
      arr[j] = sum % (j * 2 - 1);
      sum = Math.floor(sum/(j * 2 - 1));
    }
    hold(0);
    carry = sum % 10000;
  }
}

time("pi to 700 digits", function() { calculatePi(700); });

var seq = require('sjs:sequence');

time("sequence", function() {
  var dummy;
  seq.integers() .. 
    seq.transform(x => x*x) ..
    seq.pack(next => [next(), next()]) ..
    seq.transform([x,y] => [x*y, x+y]) ..
    seq.unpack(x=>x) ..
    seq.take(10000) ..
    seq.each { 
      |x|
      dummy = x;
    }
});

time("seq.each(arr*200)*200)", function() {
  var arr = [];
  for (var i=0; i<200; ++i) arr.push(i);
  var accu = 0;
  seq.each(arr, function() { seq.each(arr, function(v) { accu += v; }) });
});

time("integers.. take(100000) .. filter .. transform .. each", function() {
  var accu = 0;
  seq.integers() .. seq.take(100000) .. seq.filter(x -> x%2) ..
    seq.transform(x -> x*x) .. seq.each { |x| accu+=x }
});

test("collection module", '', function() {}).skip('module retired');
testCompilation("debug module",
                http.get("http://code.onilabs.com/sjs/latest/modules/debug.sjs"));
testCompilation("http module",
                http.get("http://code.onilabs.com/sjs/latest/modules/http.sjs"));
//testCompilation("sequence module",
//                http.get("http://code.onilabs.com/sjs/latest/modules/sequence.sjs"));


var arr = [];
for (var i=0; i<10000;++i)
  arr.push(i);

var {waitforFirst} = require('sjs:cutil');

function alt_test() {
  waitforFirst(function(a) { if(a==arr.length-1) return; hold(); }, arr);
  return 1;
}
time("waitforFirst/10000", alt_test);

time("tail recursion", function() {
  
  function r(level) {
    hold(0);
    if (level)
      r(level-1);
    else return 1;
  }

  return r(100000);
});

time("waitfor/and tail recursion", function() {
  
  function r(level) {
    hold(0);
    waitfor {
      var x = level;
    }
    and {
      if (level)
        r(level-1);
      else
        return 1;
    }
  }

  return r(100000);
});

time("custom constructor", function() {
  function Cls(a) {
    if(a != 1) throw new Error("wrong argument");
  }

  for (var i=0; i<20000; i++) {
    new Cls(1);
  }
});

time("builtin constructor", function() {
  for (var i=0; i<20000; i++) {
    new Array();
  }
});
