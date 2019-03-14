(function () {
    "use strict";

    var _globalScope,
        miTem = {
            name: "miTem",
            version: "0.1",
        };

    var templateSettings = {
        statement: /\{\%([\s\S]+?)\%\}/g,
        expression: /\{\{([\s\S]+?)\}\}/g,
        filter_param: /([\s\S]+?)(\(([^)]+?)\))$/
    };

    var statements = {
        "if":  function() { return "if(c." + arguments[1] + "){"; },
        "else": function() { return "}else " + (arguments[1] == "if" ? statements.if("", arguments[2]) : "{"); },
        "endif": function() { return "}" },
        "endfor": function() { return "}c=c.loop.parent;" },
        "for": function() {
            var code = "var t={loop:{parent:c,length:c." + arguments[3] + ".length}};c=t;var i=0;";
            code += "if(typeof c.loop.parent." + arguments[3] + ".length === 'undefined')";
            code += "{c.loop.length=m.objSize(c.loop.parent." + arguments[3] + ")}";
            code += "for(" + arguments[1] + " in c.loop.parent." + arguments[3] + "){";
            code += "if (!c.loop.parent." + arguments[3] + ".hasOwnProperty(" + arguments[1] + "))continue;";
            code += "c." + arguments[1] + "=c.loop.parent." + arguments[3] + "[" + arguments[1] + "];";
            code += "c.loop.last=(i===c.loop.length-1);";
            code += "c.loop.first=(i===0);";
            code += "c.loop.index0=i; c.loop.index=i+1;i++;";

            return code;
        }
    };

    miTem.objSize = function(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };

    miTem.retoreDefaultSettings = function () {
        miTem.settings = {
            stopOnError: false
        }
    };

    miTem.retoreDefaultSettings();

    miTem.filters = {
        default: function (value) {
            return (typeof this === "undefined") ? value : this;
        }
    };

    miTem.filters.prototype = String;

    _globalScope = (function () {
        return this || (0, eval)("this");
    }());

    if (typeof module !== "undefined" && module.exports) {
        module.exports = miTem;
    } else if (typeof define === "function" && define.amd) {
        define(function () {
            return miTem;
        });
    } else {
        _globalScope.miTem = miTem;
    }

    miTem.processFilters = function(expression) {
        var lexemes = expression.trim().split("|");
        var variable = "c." + lexemes[0];
        var filters = lexemes.slice(1);
        var filterRegexLexemes, i;
        for (i in filters) {
            filterRegexLexemes = templateSettings.filter_param.exec(filters[i].trim()) || ["", filters[i].trim(), "", ""];
            var parameters = filterRegexLexemes[3].split(",");
            var str = "(typeof s.m.filters['" + filterRegexLexemes[1] + "']!=='undefined')?";
            str += "s.m.filters['" + filterRegexLexemes[1] + "'].apply(" + variable + ",[" + parameters.toString() + "]):";
            str += variable + "." + filterRegexLexemes[1] + "(" + filterRegexLexemes[3] + ")";

            variable = str;
        }
        return variable;
    };

    miTem.compile = function(tmpl) {
        var returnFunctionStr = "var c=d;var m=this.miTem;var o='";
        var strings = tmpl.split("\n");
        var newLine = "", i, line;

        for (i in strings) {
            line = strings[i];
            returnFunctionStr += newLine;
            returnFunctionStr += line.replace(templateSettings.statement, function () {
                var lexemes = arguments[1].trim().split(" ");
                return "';" + statements[lexemes[0]].apply(null, lexemes) + "o+='";
            }).replace(templateSettings.expression, function () {
                var key = arguments[1];
                var calculatedValue = miTem.processFilters(key);
                calculatedValue = "(function(){var s=this,t;s.m=m;try{return " + calculatedValue +
                    "}catch(e){console.error('Line: " + (parseInt(i) + 1) + "; Error in "
                    + arguments[0].replace(/'/g, "\\'") + "');";
                if (miTem.settings.stopOnError) calculatedValue += "throw e;";
                calculatedValue += "}})()";
                return "'+" + calculatedValue + "+'";
            });
            newLine = "'+\"\\n\"+'";
        }

        returnFunctionStr += "'; return o;";
        try {
            return function (data) {
                var returnFunction = new Function("d", returnFunctionStr);
                var scope = {};
                scope.miTem = miTem;
                scope.scopeFilters = [];
                return returnFunction.apply(scope, [data]);
            };
        }
        catch (e) {
            console.error(returnFunctionStr);
            console.error(e);
        }
    }
})();



