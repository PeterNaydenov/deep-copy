function e(e){let o,n=[];switch(t(e)){case"array":o=[],r(e,o,n);break;case"object":o={},r(e,o,n);break;case"simple":return e}for(const e of n)e.next();return o}function t(e){return null==e||"boolean"==typeof e?"simple":e instanceof Array?"array":"object"==typeof e?"object":"simple"}function*o(e,t,o){yield r(t,e,o)}function r(e,r,n){Object.keys(e).forEach((a=>{const c=t(e[a]);"simple"===c&&(r[a]=e[a]),"object"===c&&(r[a]={},n.push(o(r[a],e[a],n))),"array"===c&&(r[a]=[],n.push(o(r[a],e[a],n)))}))}export{e as default};
