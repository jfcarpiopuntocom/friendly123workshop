const fixture=require('./fixture.cjs');
const replace=(s,a,b)=>{if(s.split(a).length!==2)throw Error('non-unique patch: '+a);return s.replace(a,b)};
const B=replace(fixture,"const abierto = !anterior || anterior.open;","const abierto = !!(anterior && anterior.open);");
const C=replace(B,"  renderListaPromotorasViva(queryAnterior);\n  if (buscarPromEl && !buscarPromEl.dataset.listo) {","  const directorio = box.querySelector(\"[data-comm-directory-fold]\");\n  let pintado = false;\n  const pintar = () => {\n    renderListaPromotorasViva(buscarPromEl ? buscarPromEl.value : \"\");\n    pintado = true;\n  };\n  if (directorio.open) pintar();\n  directorio.addEventListener(\"toggle\", () => {\n    if (directorio.open && !pintado && directorio.isConnected) pintar();\n  });\n  if (buscarPromEl && !buscarPromEl.dataset.listo) {");
module.exports={A:fixture,B,C};
