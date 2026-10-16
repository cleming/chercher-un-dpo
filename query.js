export const API = 'https://tabular-api.data.gouv.fr/api/resources/c5d02b42-1008-4406-83f5-3a81c8b936a3/data/';
export const PAGE_SIZE = 20;

const ORG = ' organisme désignant', DPO = ' organisme désigné';

// The API ANDs repeated keys and does not escape `_`, so accented letters become a LIKE wildcard.
const words = s => s.normalize('NFD').replace(/\p{L}\p{M}+/gu, '_').split(/\s+/).filter(Boolean);

function byText(q, scope) {
  q = q.trim();
  if (!q) return { filters: [] };
  const digits = q.replace(/\s/g, '');
  const col = scope === 'dpo' ? DPO : ORG;
  if (/^\d{9}(\d{5})?$/.test(digits))
    return { hint: 'Recherche par SIREN.', filters: [[`SIREN${col}__exact`, digits.slice(0, 9)]] };
  if (q.includes('@'))
    return { hint: 'Recherche dans les adresses e-mail des DPO.', filters: [['Moyen contact DPO email__contains', q]] };
  const w = words(q);
  return {
    hint: (scope === 'dpo' ? 'Organismes dont le DPO externe a ' : 'Organismes dont le nom contient ')
      + (w.length > 1 ? 'tous ces mots' : 'ce mot') + (scope === 'dpo' ? ' dans son nom.' : '.'),
    filters: w.map(x => [`Nom${col}__contains`, x]),
  };
}

function byPlace(l) {
  l = l.trim().toUpperCase();
  const cp = 'Code postal' + ORG;
  if (!l) return { filters: [] };
  if (/^\d{5}$/.test(l)) return { hint: `Code postal ${l}.`, filters: [[`${cp}__exact`, l]] };
  if (/^(\d{2,3}|2[AB])$/.test(l)) {
    const d = l.replace(/^2[AB]$/, '20');
    const next = String(+d + 1).padStart(d.length, '0');
    return {
      hint: d === '20' ? 'Corse.' : `Département ${d}.`,
      filters: [[`${cp}__greater`, d.padEnd(5, '0')], [`${cp}__strictly_less`, next.padEnd(5, '0')]],
    };
  }
  return { hint: `Ville contenant « ${l.trim().toLowerCase()} ».`, filters: words(l).map(x => [`Ville${ORG}__contains`, x]) };
}

const SORT = { nom: `Nom${ORG}__sort`, date: 'Date de la désignation__sort' };

export function buildQuery(f, page = 1) {
  const text = byText(f.q || '', f.dans), place = byPlace(f.lieu || '');
  const filters = [...text.filters, ...place.filters];
  if (f.type) filters.push(['Type de DPO__exact', f.type]);
  if (f.secteur) filters.push([`Secteur activité${ORG}__exact`, f.secteur]);
  if (!filters.length) return null;
  if (SORT[f.tri]) filters.push([SORT[f.tri], f.tri === 'date' ? 'desc' : 'asc']);
  filters.push(['page', String(page)], ['page_size', String(PAGE_SIZE)]);
  return { hint: [text.hint, place.hint].filter(Boolean).join(' '), url: API + '?' + new URLSearchParams(filters) };
}
