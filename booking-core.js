(function (root) {
  'use strict';
  const services = [
    { id: 'taglio', name: 'Taglio e piega', detail: 'Donna, uomo e bambino', icon: 'scissors' },
    { id: 'colore', name: 'Colore', detail: 'Nuove sfumature, nuova luce', icon: 'spark' },
    { id: 'cura', name: 'Trattamenti capelli', detail: 'Nutrizione, morbidezza e volume', icon: 'leaf' },
    { id: 'forma', name: 'Forma e styling', detail: 'Ricci, liscio e acconciature', icon: 'waves' }
  ];
  // Attività di fantasia: il dominio .example non recapita posta. Il sito non usa mailto(), resta per i test.
  const email = 'info@onda-lenta-acconciature.example';
  const clock = (now = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(now);
    const value = type => parts.find(part => part.type === type).value;
    return { date: `${value('year')}-${value('month')}-${value('day')}`, minutes: Number(value('hour')) * 60 + Number(value('minute')) };
  };
  const validDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  };
  const addDays = (value, amount) => {
    const date = new Date(`${value}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  };
  const intervals = value => {
    if (!validDate(value)) return [];
    const day = new Date(`${value}T12:00:00Z`).getUTCDay();
    if (day === 0 || day === 1) return [];
    if (day === 4) return [[540, 750], [870, 1170]];
    if (day === 6) return [[510, 1020]];
    return [[540, 1110]];
  };
  const times = (value, now = new Date()) => {
    const current = clock(now);
    if (!validDate(value) || value < current.date || value > addDays(current.date, 90)) return [];
    const result = [];
    for (const [start, end] of intervals(value)) {
      for (let minute = start; minute < end; minute += 30) {
        if (value === current.date && minute < current.minutes + 30) continue;
        result.push(`${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`);
      }
    }
    return result;
  };
  const upcoming = (now = new Date(), count = 7) => {
    const result = [];
    const today = clock(now).date;
    for (let offset = 0; result.length < count && offset < 30; offset++) {
      const value = addDays(today, offset);
      if (times(value, now).length) result.push(value);
    }
    return result;
  };
  const formatDate = value => new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(`${value}T12:00:00Z`));
  const contactErrors = ({ name, phone, notes = '' }) => {
    const errors = {};
    if (!name || name.trim().length < 2 || name.trim().length > 80) errors.name = 'Inserisci il tuo nome (da 2 a 80 caratteri).';
    const digits = (phone || '').replace(/\D/g, '');
    if (!/^[+\d\s().-]+$/.test(phone || '') || digits.length < 7 || digits.length > 15) errors.phone = 'Inserisci un numero di telefono valido, anche con prefisso.';
    if (notes.length > 350) errors.notes = 'Accorcia il messaggio a 350 caratteri.';
    return errors;
  };
  const summary = data => [
    'Buongiorno Marta,', '', 'vorrei richiedere un appuntamento:', '',
    `Servizio: ${services.find(service => service.id === data.service)?.name || ''}`,
    `Giorno preferito: ${formatDate(data.date)}`,
    `Orario preferito: ${data.time}`, '',
    `Nome: ${data.name.trim()}`, `Telefono: ${data.phone.trim()}`,
    ...(data.notes.trim() ? ['', `Messaggio: ${data.notes.trim()}`] : []), '',
    'Resto in attesa di conferma del giorno, dell’orario e del prezzo del servizio.',
    'Grazie!', '', 'Richiesta preparata dal sito dimostrativo di Onda Lenta Acconciature.'
  ].join('\n');
  const mailto = data => `mailto:${email}?subject=${encodeURIComponent('Richiesta appuntamento · Onda Lenta')}&body=${encodeURIComponent(summary(data))}`;
  const api = { services, email, clock, validDate, addDays, intervals, times, upcoming, formatDate, contactErrors, summary, mailto };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SalonBooking = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
