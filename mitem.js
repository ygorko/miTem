(function () {
  const miTem = {
    name: 'miTem',
    version: '1.0.4',
  };

  const templateSettings = {
    statement: /\{%([\s\S]+?)%\}/g,
    expression: /\{\{([\s\S]+?)\}\}/g,
    filter_param: /([\s\S]+?)(\(([^)]*)\))$/,
  };

  miTem.partials = {};

  miTem.registerPartial = (name, partial) => {
    miTem.partials[name] = (typeof partial === 'string') ? miTem.compile(partial) : partial;
  };

  const statements = {
    partial: (...args) => `o+=m.partials['${args[1]}'].apply(null, [${((typeof args[2] !== 'undefined') ? (`c.${args[2]}`) : 'c')}]);`,
    if: (...args) => `if(c.${args[1]}){`,
    else: (...args) => `}else ${(args[1] === 'if' ? statements.if('', args[2]) : '{')}`,
    endif: () => '}',
    endfor: () => '}c=c.loop.parent;',
    for: (...args) => {
      const code = `if (typeof c.${args[3]}=== 'undefined') return '';
      var t={loop:{parent:c,length:c.${args[3]}.length}};c=t;var i=0;
      if(typeof c.loop.parent.${args[3]}.length === 'undefined')
      {c.loop.length=m.objSize(c.loop.parent.${args[3]})}
      for(${args[1]} in c.loop.parent.${args[3]}){
      if (!c.loop.parent.${args[3]}.hasOwnProperty(${args[1]}))continue;
      c.${args[1]}=c.loop.parent.${args[3]}[${args[1]}];
      c.loop.last=(i===c.loop.length-1);
      c.loop.first=(i===0);
      c.loop.key=${args[1]};
      c.loop.index0=i; c.loop.index=i+1;i++;`;

      return code;
    },
  };

  miTem.objSize = (obj) => {
    const keys = Object.keys(obj);
    return keys.length;
  };

  miTem.retoreDefaultSettings = function () {
    miTem.settings = {
      stopOnError: false,
    };
  };

  miTem.retoreDefaultSettings();

  miTem.filters = {
    default(value) {
      // eslint-disable-next-line strict,lines-around-directive
      'use strict';
      return (typeof this === 'undefined') ? value : this;
    },
    abs() { return Math.abs(this); },
    capitalize() { return this.charAt(0).toUpperCase() + this.slice(1); },
    nl2br() { return this.replace(/\n/gi, '<br />'); },
    title() { return this.split(' ').map(val => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()).join(' '); },
  };

  const globalScope = (function () {
    return this || (0, eval)('this');
  }());

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = miTem;
  } else if (typeof define === 'function' && define.amd) {
    define(() => miTem);
  } else {
    globalScope.miTem = miTem;
  }

  miTem.processFilters = (expression) => {
    const lexemes = expression.trim().split('|');
    let variable = `c.${lexemes[0]}`;
    const filters = lexemes.slice(1);
    let filterRegexLexemes;

    filters.forEach((filter) => {
      filterRegexLexemes = templateSettings.filter_param.exec(filter.trim()) || ['', filter.trim(), '', ''];
      const parameters = filterRegexLexemes[3].split(',');
      const str = `(typeof s.m.filters['${filterRegexLexemes[1]}']!=='undefined')?
      s.m.filters['${filterRegexLexemes[1]}'].apply(${variable},[${parameters.toString()}]):
      ${variable}.${filterRegexLexemes[1]}(${filterRegexLexemes[3]})`;

      variable = str;
    });

    return variable;
  };

  miTem.compile = (tmpl) => {
    let returnFunctionStr = "var c=d;var m=this.miTem;var o='";
    const strings = tmpl.split('\n');
    let newLine = '';
    let compiled = true;
    let lineNumber;
    let lineStr;
    const statementReplaceFn = function (...args) {
      const lexemes = args[1].trim().split(' ');
      let retStr = "';";
      if (typeof statements[lexemes[0]] === 'undefined') {
        console.error(`Line: ${lineNumber}; Error in ${args[0]}; Unknown tag '${lexemes[0]}'`);
        compiled = false;
      } else retStr += statements[lexemes[0]].apply(null, lexemes);
      retStr += "o+='";
      return retStr;
    };
    const expressionReplaceFn = function (...args) {
      const key = args[1];
      let calculatedValue = miTem.processFilters(key.replace(/\\'/gi, "'"));
      calculatedValue = `(function(){var s=this,t;s.m=m;try{return ${calculatedValue
      }}catch(e){console.error('Line: ${parseInt(lineNumber, 10) + 1}; Error in ${
        args[0]}');`;
      if (miTem.settings.stopOnError) calculatedValue += 'throw e;';
      calculatedValue += '}})()';
      return `'+${calculatedValue}+'`;
    };
    strings.forEach((line, i) => {
      lineNumber = i;
      lineStr = line;
      returnFunctionStr += newLine;
      const currentLine = lineStr.replace(/'/gi, "\\'");
      returnFunctionStr += currentLine.replace(templateSettings.statement, statementReplaceFn)
        .replace(templateSettings.expression, expressionReplaceFn);
      newLine = "'+\"\\n\"+'";
    });

    returnFunctionStr += "'; return o;";

    if (compiled) {
      return (data) => {
        let returnFunction;
        try {
          // eslint-disable-next-line no-new-func
          returnFunction = new Function('d', returnFunctionStr);
        } catch (e) {
          console.error(returnFunctionStr);
          console.error(e);
        }
        const scope = {};
        scope.miTem = miTem;
        return returnFunction.apply(scope, [data]);
      };
    }
    return () => '';
  };
}());
