module("expand");

test("Test expand", function(){
	var t = {a: {a: {a: [{a: "{a}"}, {a: "{b}"}, {a: "{c}"}]}}};
	$.expand(t, {a: 1, b: 2, c: 3});
	equals(t.a.a.a[0].a, 1);
	equals(t.a.a.a[1].a, 2);
	equals(t.a.a.a[2].a, 3);
});
