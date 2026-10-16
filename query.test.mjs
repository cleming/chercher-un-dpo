import assert from 'node:assert/strict';
import { buildQuery } from './query.js';

const params = f => [...new URL(buildQuery(f).url).searchParams].filter(([k]) => !k.startsWith('page'));

assert.equal(buildQuery({}), null);
assert.deepEqual(params({ q: '780 129 987' }), [['SIREN organisme désignant__exact', '780129987']]);
assert.deepEqual(params({ q: '78012998700014', dans: 'dpo' }), [['SIREN organisme désigné__exact', '780129987']]);
assert.deepEqual(params({ q: '@renault' }), [['Moyen contact DPO email__contains', '@renault']]);
assert.deepEqual(params({ q: ' mairie  Néoules ' }), [
  ['Nom organisme désignant__contains', 'mairie'],
  ['Nom organisme désignant__contains', 'N_oules'],
]);
assert.deepEqual(params({ lieu: '75007' }), [['Code postal organisme désignant__exact', '75007']]);
assert.deepEqual(params({ lieu: '09' }), [
  ['Code postal organisme désignant__greater', '09000'],
  ['Code postal organisme désignant__strictly_less', '10000'],
]);
assert.deepEqual(params({ lieu: '2b' }).map(p => p[1]), ['20000', '21000']);
assert.deepEqual(params({ lieu: '971' }).map(p => p[1]), ['97100', '97200']);
assert.deepEqual(params({ lieu: 'Saint Malo' }).map(p => p[1]), ['SAINT', 'MALO']);
assert.deepEqual(params({ type: 'Personne morale', secteur: 'Q', tri: 'date' }), [
  ['Type de DPO__exact', 'Personne morale'],
  ['Secteur activité organisme désignant__exact', 'Q'],
  ['Date de la désignation__sort', 'desc'],
]);

assert.equal(buildQuery({ lieu: '69' }).hint, 'Département 69.');
assert.equal(buildQuery({ q: 'mairie', lieu: '2b' }).hint, 'Organismes dont le nom contient ce mot. Corse.');
console.log('ok');
