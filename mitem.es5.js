"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

(function () {
    "use strict";

    var _globalScope = void 0,
        miTem = {
        name: "miTem",
        version: "0.1"
    };

    var templateSettings = {
        statement: /\{\%([\s\S]+?)\%\}/g,
        expression: /\{\{([\s\S]+?)\}\}/g,
        filter_param: /([\s\S]+?)(\(([^)]+?)\))$/
    };

    miTem.partials = {};

    miTem.registerPartial = function (name, partial) {
        miTem.partials[name] = typeof partial == "string" ? miTem.compile(partial) : partial;
    };

    var statements = {
        "partial": function partial() {
            return "o+=m.partials['" + (arguments.length <= 1 ? undefined : arguments[1]) + "'].apply(null, [" + (typeof (arguments.length <= 2 ? undefined : arguments[2]) !== 'undefined' ? "c." + (arguments.length <= 2 ? undefined : arguments[2]) : "c") + "]);";
        },
        "if": function _if() {
            return "if(c." + (arguments.length <= 1 ? undefined : arguments[1]) + "){";
        },
        "else": function _else() {
            return "}else " + ((arguments.length <= 1 ? undefined : arguments[1]) == "if" ? statements.if("", arguments.length <= 2 ? undefined : arguments[2]) : "{");
        },
        "endif": function endif() {
            return "}";
        },
        "endfor": function endfor() {
            return "}c=c.loop.parent;";
        },
        "for": function _for() {
            var code = "var t={loop:{parent:c,length:c." + (arguments.length <= 3 ? undefined : arguments[3]) + ".length}};c=t;var i=0;";
            code += "if(typeof c.loop.parent." + (arguments.length <= 3 ? undefined : arguments[3]) + ".length === 'undefined')";
            code += "{c.loop.length=m.objSize(c.loop.parent." + (arguments.length <= 3 ? undefined : arguments[3]) + ")}";
            code += "for(" + (arguments.length <= 1 ? undefined : arguments[1]) + " in c.loop.parent." + (arguments.length <= 3 ? undefined : arguments[3]) + "){";
            code += "if (!c.loop.parent." + (arguments.length <= 3 ? undefined : arguments[3]) + ".hasOwnProperty(" + (arguments.length <= 1 ? undefined : arguments[1]) + "))continue;";
            code += "c." + (arguments.length <= 1 ? undefined : arguments[1]) + "=c.loop.parent." + (arguments.length <= 3 ? undefined : arguments[3]) + "[" + (arguments.length <= 1 ? undefined : arguments[1]) + "];";
            code += "c.loop.last=(i===c.loop.length-1);";
            code += "c.loop.first=(i===0);";
            code += "c.loop.index0=i; c.loop.index=i+1;i++;";

            return code;
        }
    };

    miTem.objSize = function (obj) {
        var size = 0,
            key = void 0;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    miTem.retoreDefaultSettings = function () {
        miTem.settings = {
            stopOnError: false
        };
    };

    miTem.retoreDefaultSettings();

    miTem.filters = {
        default: function _default(value) {
            return typeof this === "undefined" ? value : this;
        }
    };

    miTem.filters.prototype = String;

    _globalScope = function () {
        return this || (0, eval)("this");
    }();

    if (typeof module !== "undefined" && module.exports) {
        module.exports = miTem;
    } else if (typeof define === "function" && define.amd) {
        define(function () {
            return miTem;
        });
    } else {
        _globalScope.miTem = miTem;
    }

    miTem.processFilters = function (expression) {
        var lexemes = expression.trim().split("|");
        var variable = "c." + lexemes[0];
        var filters = lexemes.slice(1);
        var filterRegexLexemes = void 0;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = filters[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var filter = _step.value;

                filterRegexLexemes = templateSettings.filter_param.exec(filter.trim()) || ["", filter.trim(), "", ""];
                var parameters = filterRegexLexemes[3].split(",");
                var str = "(typeof s.m.filters['" + filterRegexLexemes[1] + "']!=='undefined')?";
                str += "s.m.filters['" + filterRegexLexemes[1] + "'].apply(" + variable + ",[" + parameters.toString() + "]):";
                str += variable + "." + filterRegexLexemes[1] + "(" + filterRegexLexemes[3] + ")";

                variable = str;
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return variable;
    };

    miTem.compile = function (tmpl) {
        var returnFunctionStr = "var c=d;var m=this.miTem;var o='";
        var strings = tmpl.split("\n");
        var newLine = "";
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            var _loop = function _loop() {
                var _step2$value = _slicedToArray(_step2.value, 2),
                    i = _step2$value[0],
                    line = _step2$value[1];

                returnFunctionStr += newLine;
                returnFunctionStr += line.replace(templateSettings.statement, function () {
                    var lexemes = arguments[1].trim().split(" ");
                    return "';" + statements[lexemes[0]].apply(null, lexemes) + "o+='";
                }).replace(templateSettings.expression, function () {
                    var key = arguments[1];
                    var calculatedValue = miTem.processFilters(key);
                    calculatedValue = "(function(){var s=this,t;s.m=m;try{return " + calculatedValue + "}catch(e){console.error('Line: " + (parseInt(i) + 1) + "; Error in " + arguments[0].replace(/'/g, "\\'") + "');";
                    if (miTem.settings.stopOnError) calculatedValue += "throw e;";
                    calculatedValue += "}})()";
                    return "'+" + calculatedValue + "+'";
                });
                newLine = "'+\"\\n\"+'";
            };

            for (var _iterator2 = strings.entries()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                _loop();
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }

        returnFunctionStr += "'; return o;";

        return function (data) {
            var returnFunction = void 0;
            try {
                returnFunction = new Function("d", returnFunctionStr);
            } catch (e) {
                console.error(returnFunctionStr);
                console.error(e);
            }
            var scope = {};
            scope.miTem = miTem;
            return returnFunction.apply(scope, [data]);
        };
    };
})();
