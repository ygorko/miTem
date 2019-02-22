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
        filter_param:      /([\s\S]+?)(\(([\s\S]+?)\))$/g
    };

    let statements = {
        "if": function () { return "if(mitem_context."+arguments[1]+"){"; },
        "else": function () {return "}else "+(arguments[1]=="if"?statements.if("",arguments[2]):"{");},
        "end": function () {return "}"}
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
        }
    };

    miTem.filters.prototype = String;


    _globalScope = (function(){ return this || (0,eval)("this"); }());

    if (typeof module !== "undefined" && module.exports) {
        module.exports = miTem;
    } else if (typeof define === "function" && define.amd) {
        define(function(){return miTem;});
    } else {
        _globalScope.miTem = miTem;
    }

    miTem.processFilters = function (expression) {
        let lexemes = expression.trim().split("|");
        let variable = "mitem_context." + lexemes[0];
        let filters = lexemes.slice(1).reverse();
        for (const filter of filters) {
            let filterRegexLexemes = templateSettings.filter_param.exec(filter) || ["",filter,"",""];
            let parameters = filterRegexLexemes[3].split(",");
            variable = "miTem.filters['" + filterRegexLexemes[1] + "'].apply(" + variable + ",[" + parameters.toString() + "])";
        }
        return variable;
    };

    miTem.compile = function (tmpl) {
        let returnFunctionStr = "var mitem_context=__mitem_tmpl_data__;var __mitem_out__='";
        let error_messages = [];
        returnFunctionStr += tmpl.replace(templateSettings.statement, function () {
            let lexemes = arguments[1].trim().split(" ");
            return "';" + statements[lexemes[0]].apply(null, lexemes) + "__mitem_out__+='";
        }).replace(templateSettings.expression, function () {
            let key = arguments[1];
            let calculatedValue = miTem.processFilters(key);
            calculatedValue = "(function(){try{return " + calculatedValue + "}catch(e){console.error(`Error in " + arguments[0] + "`)}})()";
            console.log(arguments);
            console.log(calculatedValue);
            return "'+" + calculatedValue + "+'";
        });

        returnFunctionStr += "'; return __mitem_out__;";
        try {
            return new Function("__mitem_tmpl_data__", returnFunctionStr);
        } catch (e) {
            console.error(returnFunctionStr);
            console.error(e);
        }
    }
})();


