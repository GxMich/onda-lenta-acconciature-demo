const test = require('node:test');
const assert = require('node:assert/strict');
const b = require('../booking-core.js');
const now = new Date('2026-11-03T10:00:00Z');

test('non propone appuntamenti nel passato o nei giorni di chiusura', () => {
  assert.deepEqual(b.times('2026-11-02', now), []);
  assert.deepEqual(b.times('2026-11-08', now), []);
  assert.deepEqual(b.times('2026-11-09', now), []);
  assert.deepEqual(b.times('2027-03-03', now), []);
  assert.equal(b.validDate('2026-02-30'), false);
});
test('rispetta la pausa del giovedì e l’orario di chiusura', () => {
  const times = b.times('2026-11-05', now);
  assert.ok(times.includes('12:00'));
  assert.ok(times.includes('14:30'));
  assert.ok(times.includes('19:00'));
  for (const invalid of ['12:30', '13:00', '14:00', '19:30']) assert.ok(!times.includes(invalid));
  const saturday = b.times('2026-11-07', now);
  assert.equal(saturday[0], '08:30');
  assert.equal(saturday.at(-1), '16:30');
});
test('gli orari di oggi sono successivi all’ora italiana corrente', () => {
  const times = b.times('2026-11-03', now);
  assert.equal(times[0], '11:30');
  assert.equal(times.at(-1), '18:00');
  assert.deepEqual(b.times('2026-11-03', new Date('2026-11-03T17:30:00Z')), []);
});
test('usa la data italiana anche vicino a mezzanotte e al cambio di ora', () => {
  assert.equal(b.clock(new Date('2026-07-01T22:30:00Z')).date, '2026-07-02');
  assert.equal(b.clock(new Date('2026-11-03T23:30:00Z')).date, '2026-11-04');
  assert.equal(b.clock(new Date('2026-10-25T01:30:00Z')).minutes, 150);
});
test('i giorni rapidi saltano domenica, lunedì e le giornate terminate', () => {
  assert.equal(b.upcoming(new Date('2026-11-07T19:00:00Z'))[0], '2026-11-10');
  assert.equal(b.upcoming(now).length, 7);
});
test('richiede un recapito valido senza rifiutare prefissi e spazi', () => {
  assert.deepEqual(b.contactErrors({ name: 'Giulia Rossi', phone: '+39 333 123 4567' }), {});
  assert.ok(b.contactErrors({ name: 'A', phone: 'ciao' }).name);
  assert.ok(b.contactErrors({ name: 'Giulia', phone: '123' }).phone);
});
test('l’email ha un solo destinatario e conserva i dati nel corpo codificato', () => {
  const data = { service: 'colore', date: '2026-11-05', time: '15:00', name: 'Giulia & Mario', phone: '+39 333 1234567', notes: 'Colore: castano & riflessi?\nGrazie!' };
  const url = b.mailto(data);
  assert.ok(url.startsWith('mailto:info@onda-lenta-acconciature.example?subject='));
  assert.equal(url.match(/&/g).length, 1);
  const body = decodeURIComponent(url.split('&body=')[1]);
  assert.ok(body.includes('Giulia & Mario'));
  assert.ok(body.includes('15:00'));
  assert.ok(body.includes('in attesa di conferma'));
  assert.ok(body.includes('Colore: castano & riflessi?'));
});
