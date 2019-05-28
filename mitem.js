(function () {
    "use strict";

    let _globalScope,
        miTem = {
            name: "miTem",
            version: "1.0.4",
        };

    let templateSettings = {
        statement: /\{\%([\s\S]+?)\%\}/g,
        expression: /\{\{([\s\S]+?)\}\}/g,
        filter_param: /([\s\S]+?)(\(([^)]*)\))$/
    };

    miTem.partials = {};

    miTem.registerPartial = (name, partial) => {
        miTem.partials[name] = (typeof partial == "string") ? miTem.compile(partial) : partial;
    };

    let statements = {
        "partial": (...args) => {
            return "o+=m.partials['" + args[1] + "'].apply(null, ["
                + ((typeof args[2] !== 'undefined') ? ("c." + args[2]) : "c") + "]);"
        },
        "if": (...args) => {
            return "if(c." + args[1] + "){";
        },
        "else": (...args) => {
            return "}else " + (args[1] == "if" ? statements.if("", args[2]) : "{");
        },
        "endif": () => {
            return "}"
        },
        "endfor": () => {
            return "}c=c.loop.parent;"
        },
        "for": (...args) => {
            let code = "if (typeof c." + args[3] + "=== 'undefined') return '';";
            code += "var t={loop:{parent:c,length:c." + args[3] + ".length}};c=t;var i=0;";
            code += "if(typeof c.loop.parent." + args[3] + ".length === 'undefined')";
            code += "{c.loop.length=m.objSize(c.loop.parent." + args[3] + ")}";
            code += "for(" + args[1] + " in c.loop.parent." + args[3] + "){";
            code += "if (!c.loop.parent." + args[3] + ".hasOwnProperty(" + args[1] + "))continue;";
            code += "c." + args[1] + "=c.loop.parent." + args[3] + "[" + args[1] + "];";
            code += "c.loop.last=(i===c.loop.length-1);";
            code += "c.loop.first=(i===0);";
            code += "c.loop.key=" + args[1] + ";";
            code += "c.loop.index0=i; c.loop.index=i+1;i++;";

            return code;
        }
    };

    miTem.objSize = (obj) => {
        let size = 0, key;
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
        },
        abs: function () {
            return Math.abs(this);
        },
        capitalize: function () {
            return this.charAt(0).toUpperCase() + this.slice(1);
        },
        nl2br: function () {
            return this.replace(/\n/gi, "<br />");
        },
        title: function () {
            return this.split(" ").map((val) => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()).join(" ");
        }
    };

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

    miTem.processFilters = expression => {
        let lexemes = expression.trim().split("|");
        let variable = "c." + lexemes[0];
        let filters = lexemes.slice(1);
        let filterRegexLexemes;
        for (const filter of filters) {
            filterRegexLexemes = templateSettings.filter_param.exec(filter.trim()) || ["", filter.trim(), "", ""];
            let parameters = filterRegexLexemes[3].split(",");
            let str = "(typeof s.m.filters['" + filterRegexLexemes[1] + "']!=='undefined')?";
            str += "s.m.filters['" + filterRegexLexemes[1] + "'].apply(" + variable + ",[" + parameters.toString() + "]):";
            str += variable + "." + filterRegexLexemes[1] + "(" + filterRegexLexemes[3] + ")";

            variable = str;
        }
        return variable;
    };

    miTem.compile = tmpl => {
        let returnFunctionStr = "var c=d;var m=this.miTem;var o='";
        let strings = tmpl.split("\n");
        let newLine = "";
        let compiled = true;
        for (const [i, line] of strings.entries()) {
            returnFunctionStr += newLine;
            let currentLine = line.replace(/'/gi,"\\'");
            returnFunctionStr += currentLine.replace(templateSettings.statement, function () {
                let lexemes = arguments[1].trim().split(" ");
                let retStr = "';";
                if (typeof statements[lexemes[0]] === 'undefined') {
                    console.error("Line: " + i + "; Error in " + arguments[0] + "; Unknown tag '" + lexemes[0] + "'");
                    compiled = false;
                } else retStr += statements[lexemes[0]].apply(null, lexemes);
                return retStr + "o+='";
            }).replace(templateSettings.expression, function () {
                let key = arguments[1];
                let calculatedValue = miTem.processFilters(key.replace(/\\'/gi, "'"));
                calculatedValue = "(function(){var s=this,t;s.m=m;try{return " + calculatedValue +
                    "}catch(e){console.error('Line: " + (parseInt(i) + 1) + "; Error in "
                    + arguments[0] + "');";
                if (miTem.settings.stopOnError) calculatedValue += "throw e;";
                calculatedValue += "}})()";
                return "'+" + calculatedValue + "+'";
            });
            newLine = "'+\"\\n\"+'";
        }

        returnFunctionStr += "'; return o;";

        if (compiled) {
            return (data) => {
                let returnFunction;
                try {
                    returnFunction = new Function("d", returnFunctionStr);
                } catch (e) {
                    console.error(returnFunctionStr);
                    console.error(e);
                }
                let scope = {};
                scope.miTem = miTem;
                return returnFunction.apply(scope, [data]);
            };
        }
        else return () => "";

    }
})();




