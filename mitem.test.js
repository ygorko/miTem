const mitem = require('./mitem');

test("Set variable", function () {
    let template = mitem.compile("hello {{who}}");
    expect(template({who: "world!"})).toBe("hello world!");
    expect(template({who: "me"})).toBe("hello me");

    template = mitem.compile("hello {{ who }}");
    expect(template({who: "world!"})).toBe("hello world!");
    expect(template({who: "me"})).toBe("hello me");
});

test("Complex variable", function () {
    let template = mitem.compile("hello {{person.name}}");
    expect(template({person: {name:"Alex"}})).toBe("hello Alex");
    expect(template({person: {}})).toBe("hello undefined");
});


test("Set multiple variables", function () {
    let template = mitem.compile("{{hi}} {{ who }}");
    expect(template({who: "me", hi:"hello"})).toBe("hello me");

    template = mitem.compile("{{who }} {{hi}} {{ who }}");
    expect(template({who: "me", hi:"hello"})).toBe("me hello me");
});

test("IF statement", function () {
    let template = mitem.compile("{% if condition %} test {% endif %}");
    expect(template({condition: false})).toBe("");
    expect(template({condition: true})).toBe(" test ");

    template = mitem.compile("qw {% if condition %} test {% endif %}er");
    expect(template({condition: false})).toBe("qw er");

    template = mitem.compile("qw {% if condition %} test {% endif %}er");
    expect(template({condition: true})).toBe("qw  test er");

    template = mitem.compile("{% if cond1 %} test1 {% endif %}{% if cond2 %} test2 {% endif %}");
    expect(template({cond2: true,cond1:false})).toBe(" test2 ");
});

test("IF ELSE statement", function () {
    let template = mitem.compile("{% if cond %} test1 {% else %} test2 {% endif %}");
    expect(template({cond: true})).toBe(" test1 ");
    expect(template({cond: false})).toBe(" test2 ");

    template = mitem.compile("{% if cond1 %}t1{% else if cond2 %}t2{%else%}t3{% endif %}");
    expect(template({cond1: true,cond2: true})).toBe("t1");
    expect(template({cond1: false,cond2: true})).toBe("t2");
    expect(template({cond1: true,cond2: false})).toBe("t1");
    expect(template({cond1: false,cond2: false})).toBe("t3");

    template = mitem.compile("{% if cond %} {{var}} {% endif %}");
    expect(template({cond: true,var: "asd"})).toBe(" asd ");
});

test("Expression with statement", function () {
    let template = mitem.compile("{{text}}");
    expect(template({text: "{% if cond %} test1 {% else %} test2 {% endif %}"}))
        .toBe("{% if cond %} test1 {% else %} test2 {% endif %}");
});

test("Multiline template", function () {
    let template = mitem.compile(`hello {{who}}
hello {{who}}
hello {{who}}
hello {{who}}
hello {{who}}
`);
    expect(template({who: "world!"})).toBe(`hello world!
hello world!
hello world!
hello world!
hello world!
`);

});

test("Filter default", function () {
    let template = mitem.compile("hello {{who|default('Value not set')}}");
    expect(template({})).toBe("hello Value not set");

    template = mitem.compile("hello {{who|default('Value not set')}}");
    expect(template({who:"value"})).toBe("hello value");
});

test("String function as filter", function () {
    let template = mitem.compile("hello {{who|repeat(2)}}");
    expect(template({who:"value"})).toBe("hello valuevalue");
});

test("Array function as filter", function () {
    let template = mitem.compile("hello {{who|join(',')}}");
    expect(template({who:["qw", "er"]})).toBe("hello qw,er");
});

test("Several filters", function () {
    let template = mitem.compile("hello {{who|join(',')|repeat(2)}}");
    expect(template({who:["qw", "er"]})).toBe("hello qw,erqw,er");

    template = mitem.compile("{{ arr | join(',') | toUpperCase }}");
    expect(template({arr:["qw", "er"]})).toBe("QW,ER");
});

test("Filter is not exists", function () {
    let outputData = "";
    const storeLog = inputs => (outputData += inputs);
    console["error"] = jest.fn(storeLog);
    mitem.settings.stopOnError = true;

    let template = mitem.compile("hello {{who|qwe}}");
    expect(()=>{template({who:["qw", "er"]})}).toThrowError("c.who.qwe is not a function");
    expect(outputData).toBe("Line: 1; Error in {{who|qwe}}");

    outputData = "";
    template = mitem.compile("hello {{who|qwe(5)}}");
    expect(()=>{template({who:["qw", "er"]})}).toThrowError("c.who.qwe is not a function");
    expect(outputData).toBe("Line: 1; Error in {{who|qwe(5)}}");

    mitem.settings.stopOnError = false;
    outputData = "";
    template = mitem.compile("hello {{who|qwe(5)}} world");
    expect(template({who:["qw", "er"]})).toBe("hello undefined world")
    expect(outputData).toBe("Line: 1; Error in {{who|qwe(5)}}");
});

test("FOR statement (array)", function () {
    let template = mitem.compile("{% for item in arr %}test{% endfor %}");
    expect(template({arr: []})).toBe("");
    expect(template({arr: [1]})).toBe("test");
    expect(template({arr: [1,2]})).toBe("testtest");
});

test("FOR statement (object)", function () {
    let template = mitem.compile("{% for item in arr %}test{% endfor %}");
    expect(template({arr: {} })).toBe("");
    expect(template({arr: {a:1} })).toBe("test");
    expect(template({arr: {a:1,b:2} })).toBe("testtest");
});

test("FOR statement with variable", function () {
    let template = mitem.compile("{% for item in arr %}{{item.foo}}{% endfor %}");
    expect(template({arr: [] })).toBe("");
    expect(template({arr: [{foo:"test"}]})).toBe("test");
    expect(template({arr: [{foo:"test "}, {foo:"test2"}]})).toBe("test test2");
});

test("FOR statement loop index", function () {
    let template = mitem.compile("{% for item in arr %}{{loop.index}}{% endfor %}");
    expect(template({arr: [{foo:"test "}, {foo:"test2"}]})).toBe("12");

    template = mitem.compile("{% for item in arr %}{{loop.index0}}{% endfor %}");
    expect(template({arr: [{foo:"test "}, {foo:"test2"}]})).toBe("01");

    template = mitem.compile("{% for item in arr %}{{loop.index}}{% endfor %}");
    expect(template({arr: {x:{foo:"test "}, y:{foo:"test2"}}})).toBe("12");

    template = mitem.compile("{% for item in arr %}{{loop.index0}}{% endfor %}");
    expect(template({arr: {x:{foo:"test "}, y:{foo:"test2"}}})).toBe("01");
});

test("FOR statement loop length", function () {
    let template = mitem.compile("{% for item in arr %}{{loop.length}} {% endfor %}");
    expect(template({arr: [{foo:"test"}]})).toBe("1 ");
    expect(template({arr: [{foo:"test "}, {foo:"test2"}]})).toBe("2 2 ");

    expect(template({arr: {a:{foo:"test"}}})).toBe("1 ");
    expect(template({arr: {a:{foo:"test "}, b:{foo:"test2"}}})).toBe("2 2 ");
});

test("FOR statement loop key", function () {
    let template = mitem.compile("{% for item in arr %}{{loop.key}} {% endfor %}");
    expect(template({arr: {a:1,b:2} })).toBe("a b ");
});

test("FOR statement loop first element", function () {
    let template = mitem.compile("{% for item in arr %}{% if loop.first %}first{%else%} not first{%endif%}{% endfor %}");
    expect(template({arr: [{foo: "test"}]})).toBe("first");
    expect(template({arr: [{foo: "test "}, {foo: "test2"}]})).toBe("first not first");
    expect(template({arr: [1,2,3]})).toBe("first not first not first");
});

test("FOR statement loop last element", function () {
    let template = mitem.compile("{% for item in arr %}{% if loop.last %}last{%else%}not last {%endif%}{% endfor %}");
    expect(template({arr: [{foo: "test"}]})).toBe("last");
    expect(template({arr: [{foo: "test "}, {foo: "test2"}]})).toBe("not last last");
    expect(template({arr: [1,2,3]})).toBe("not last not last last");
});

test("FOR statement parent context", function () {
    let template = mitem.compile("{% for item in arr %}{{item.foo}} {{loop.parent.bar}}{% endfor %}");
    expect(template({arr: [{foo: "test"}], bar: "b"})).toBe("test b");
});

test("Nested FOR statement", function () {
    let template = mitem.compile(
        "{% for item in arr %}{{item.foo}} {{loop.parent.bar}} " +
        "{% for item2 in item.n_arr %}{{item2}} {{loop.parent.item.foo}} {% endfor %}" +
        "{% endfor %}");
    expect(template({arr: [{foo: "test", n_arr:[4,6]}], bar: "b"})).toBe("test b 4 test 6 test ");
});

test("Partials", function () {
    const mitem = require('./mitem');
    let partial = mitem.compile("hello {{who}}");
    mitem.registerPartial("hello", partial);
    let template = mitem.compile("{% partial hello %} - {% partial hello %}");
    expect(template({who: "test"})).toBe("hello test - hello test");

    template = mitem.compile("" +
        "{% for item in arr %}" +
        "{% partial hello item %} " +
        "{% endfor %}" +
        "");
    expect(template({arr:[{who: "test"},{who: "test2"}]})).toBe("hello test hello test2 ");
});

test("FOR thru undefined", function () {
    let template = mitem.compile("{% for item in val %}111{% endfor %}");
    expect(template({})).toBe("");
});

test("String with quotes", function () {
    let template = mitem.compile("hello '{{who}}'");
    expect(template({who: "world!"})).toBe("hello 'world!'");
});

test("Filter abs", function () {
    let template = mitem.compile("hello '{{num|abs}}'");
    expect(template({num: 5})).toBe("hello '5'");
    expect(template({num: -5})).toBe("hello '5'");
    expect(template({num: 0})).toBe("hello '0'");
});

test("Filter capitalize", function () {
    let template = mitem.compile("hello '{{who|capitalize}}'");
    expect(template({who: "test"})).toBe("hello 'Test'");
    expect(template({who: "test test"})).toBe("hello 'Test test'");
    expect(template({who: "test   test"})).toBe("hello 'Test   test'");
    expect(template({who: ""})).toBe("hello ''");
});

test("Filter nl2br", function () {
    let template = mitem.compile("hello '{{who|nl2br}}'");
    expect(template({who: `test
test`})).toBe("hello 'test<br />test'");
    expect(template({who: "test\ntest"})).toBe("hello 'test<br />test'");
});

test("Filter title", function () {
    let template = mitem.compile("hello '{{who|title}}'");
    expect(template({who: "test"})).toBe("hello 'Test'");
    expect(template({who: "test   test"})).toBe("hello 'Test   Test'");
});

test("Unknown tag", function () {
    let outputData = "";
    const storeLog = inputs => (outputData += inputs);
    console["error"] = jest.fn(storeLog);

    let template = mitem.compile("\n\n\n{% iff cnd %} text {% endif %} qwe");
    expect(template({})).toBe("");
    expect(outputData).toBe("Line: 3; Error in {% iff cnd %}; Unknown tag 'iff'");
});