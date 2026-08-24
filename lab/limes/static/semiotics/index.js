import {buildActants} from './actants.js';
import {buildOperations} from './operations.js';
import {buildValueObjects} from './value-objects.js';
import {buildSEDHEvidence} from './sedh.js';
import {buildPrograms} from './programs.js';
import {buildBoundaries} from './boundaries.js';
export function analyzeSemiotics(sentence){
  sentence.actants=buildActants(sentence);
  sentence.operations=buildOperations(sentence);
  sentence.value_objects=buildValueObjects(sentence);
  sentence.sedh_evidence=buildSEDHEvidence(sentence);
  sentence.programs=buildPrograms(sentence);
  sentence.boundaries=buildBoundaries(sentence);
  return sentence;
}
