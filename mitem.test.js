const mitem = require('./mitem');

test("Set variable", function () {
    let template = mitem.compile("hello {{who}}");
    expect(template({who: "world!"})).toBe("hello world!");
    expect(template({who: "me"})).toBe("hello me");

    template = mitem.compile("hello {{ who }}");
    expect(template({who: "world!"})).toBe("hello world!");
    expect(template({who: "me"})).toBe("hello me");
});

test("Set multiple variables", function () {
    let template = mitem.compile("{{hi}} {{ who }}");
    expect(template({who: "me", hi:"hello"})).toBe("hello me");

    template = mitem.compile("{{who }} {{hi}} {{ who }}");
    expect(template({who: "me", hi:"hello"})).toBe("me hello me");
});

test("If statement", function () {
    let template = mitem.compile("{% if condition %} test {% end %}");
    expect(template({condition: false})).toBe("");
    expect(template({condition: true})).toBe(" test ");

    template = mitem.compile("qw {% if condition %} test {% end %}er");
    expect(template({condition: false})).toBe("qw er");

    template = mitem.compile("qw {% if condition %} test {% end if %}er");
    expect(template({condition: true})).toBe("qw  test er");

    template = mitem.compile("{% if cond1 %} test1 {% end %}{% if cond2 %} test2 {% end %}");
    expect(template({cond2: true,cond1:false})).toBe(" test2 ");
});

test("If else statement", function () {
    let template = mitem.compile("{% if cond %} test1 {% else %} test2 {% end %}");
    expect(template({cond: true})).toBe(" test1 ");
    expect(template({cond: false})).toBe(" test2 ");

    template = mitem.compile("{% if cond1 %}t1{% else if cond2 %}t2{%else%}t3{% end %}");
    expect(template({cond1: true,cond2: true})).toBe("t1");
    expect(template({cond1: false,cond2: true})).toBe("t2");
    expect(template({cond1: true,cond2: false})).toBe("t1");
    expect(template({cond1: false,cond2: false})).toBe("t3");

    template = mitem.compile("{% if cond %} {{var}} {% end %}");
    expect(template({cond: true,var: "asd"})).toBe(" asd ");
});

test("Expression with statement", function () {
    let template = mitem.compile("{{text}}");
    expect(template({text: "{% if cond %} test1 {% else %} test2 {% end %}"}))
        .toBe("{% if cond %} test1 {% else %} test2 {% end %}");
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

    template = mitem.compile("{{ arr | join(',') | toUpperCase }}")
    expect(template({arr:["qw", "er"]})).toBe("QW,ER");
});

test("Filter is not exists", function () {
    let outputData = "";
    let storeLog = inputs => (outputData += inputs);
    console["error"] = jest.fn(storeLog);

    let template = mitem.compile("hello {{who|qwe}}");
    expect(()=>{template({who:["qw", "er"]})}).toThrowError("c.who.qwe is not a function");
    expect(outputData).toBe("Line: 1; Error in {{who|qwe}}");


    outputData = "";
    template = mitem.compile("hello {{who|qwe(5)}}");
    expect(()=>{template({who:["qw", "er"]})}).toThrowError("c.who.qwe is not a function");
    expect(outputData).toBe("Line: 1; Error in {{who|qwe(5)}}");
});
