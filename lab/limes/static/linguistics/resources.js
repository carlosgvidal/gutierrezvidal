const BASE = new URL('../resources/', import.meta.url);
let cache = null;
async function loadJSON(name){
  const r = await fetch(new URL(name, BASE));
  if(!r.ok) throw new Error(`No se pudo cargar el recurso lingüístico ${name} (HTTP ${r.status}).`);
  return r.json();
}
export async function loadLinguisticResources(){
  if(!cache){
    cache = Promise.all([
      loadJSON('morphology.json'),
      loadJSON('morph_features.json'),
      loadJSON('dependencies.json'),
      loadJSON('valency.json')
    ]).then(([morphology,morphFeatures,dependencies,valency])=>({morphology,morphFeatures,dependencies,valency}));
  }
  return cache;
}
