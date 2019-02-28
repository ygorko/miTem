(function () {
    "use strict";

    let _globalScope,
        miTem = {
            name: "miTem",
            version: "0.1",
        };

    let templateSettings = {
        statement: /\{\%([\s\S]+?)\%\}/g,
        expression: /\{\{([\s\S]+?)\}\}/g,
        filter_param: /([\s\S]+?)(\(([^)]+?)\))$/
    };

    let statements = {
        "if": function () {
            return "if(c." + arguments[1] + "){";
        },
        "else": function () {
            return "}else " + (arguments[1] == "if" ? statements.if("", arguments[2]) : "{");
        },
        "end": function () {
            return "}"
        }
    };

    miTem.filters = {
        upper: function () {
            return this.toUpperCase();
        },
        repeat: function (n) {
            return this.repeat(n);
        },
        concat: function (prefix) {
            return prefix + this;
        },
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

    miTem.processFilters = function (expression) {
        let lexemes = expression.trim().split("|");
        let variable = "c." + lexemes[0];
        let filters = lexemes.slice(1).reverse();
        let filterRegexLexemes;
        for (const filter of filters) {
            filterRegexLexemes = templateSettings.filter_param.exec(filter) || ["", filter, "", ""];
            let parameters = filterRegexLexemes[3].split(",");
            variable = "s.m.filters['" + filterRegexLexemes[1] + "'].apply(" + variable + ",[" + parameters.toString() + "])";
        }
        return variable;
    };

    miTem.compiledTemplate = function (tmpl) {
        return
    };

    miTem.compile = function (tmpl) {
        let returnFunctionStr = "var c=d;var o='";
        let strings = tmpl.split("\n");
        let newLine = "";
        for (const [i, line] of strings.entries()) {
            returnFunctionStr += newLine;
            returnFunctionStr += line.replace(templateSettings.statement, function () {
                let lexemes = arguments[1].trim().split(" ");
                return "';" + statements[lexemes[0]].apply(null, lexemes) + "o+='";
            }).replace(templateSettings.expression, function () {
                let key = arguments[1];
                let calculatedValue = miTem.processFilters(key);
                calculatedValue = "(function(){var s=this;s.m=m;try{return " + calculatedValue + "}catch(e){console.error(`Line: " + (parseInt(i) + 1) + "; Error in " + arguments[0] + "`)}})()";
                return "'+" + calculatedValue + "+'";
            });
            newLine = "'+\"\\n\"+'";
        }

        returnFunctionStr += "'; return o;";
        try {
            
            //return returnFunction;
            
            return function (data) {
                let returnFunction = new Function("d", "m", returnFunctionStr);
                //console.log(returnFunction(data, miTem));
                return returnFunction(data, miTem);
            }
        } catch (e) {
            console.error(returnFunctionStr);
            console.error(e);
        }
    }
})();




