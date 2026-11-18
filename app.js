(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const Booking = window.SalonBooking;
  const menu = $('mobile-menu');
  const toggle = document.querySelector('.menu-toggle');
  const booking = $('booking-dialog');
  const form = $('booking-form');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 701px)');
  const openOverlays = new Set();
  const closing = new WeakMap();
  let savedScroll = 0;
  let step = 0;
  let reachedStep = 0;
  let period = 'morning';
  const data = { service: '', date: '', time: '', name: '', phone: '', notes: '' };

  const lockPage = dialog => {
    if (!openOverlays.size) {
      savedScroll = window.scrollY;
      const gutter = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.top = `-${savedScroll}px`;
      document.body.style.paddingRight = gutter ? `${gutter}px` : '';
      document.documentElement.classList.add('scroll-locked');
      document.body.classList.add('overlay-open');
    }
    openOverlays.add(dialog);
  };
  const unlockPage = dialog => {
    if (!openOverlays.has(dialog)) return;
    openOverlays.delete(dialog);
    if (openOverlays.size) return;
    document.body.classList.remove('overlay-open');
    document.body.style.top = '';
    document.body.style.paddingRight = '';
    document.documentElement.classList.remove('scroll-locked');
    window.scrollTo({ top: savedScroll, left: 0, behavior: 'instant' });
  };
  const animate = (element, keyframes, duration) => {
    if (reducedMotion.matches || !element.animate) return null;
    return element.animate(keyframes, { duration, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
  };
  const closeDialog = dialog => {
    if (!dialog.open) return Promise.resolve();
    if (closing.has(dialog)) return closing.get(dialog);
    const animation = animate(dialog, [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: `translateY(${dialog === menu ? 12 : 18}px)` }
    ], 170);
    const finish = () => {
      dialog.close();
      unlockPage(dialog);
      closing.delete(dialog);
      if (dialog === menu) toggle.setAttribute('aria-expanded', 'false');
    };
    const promise = animation ? animation.finished.catch(() => {}).then(finish) : Promise.resolve().then(finish);
    closing.set(dialog, promise);
    return promise;
  };
  const openDialog = async (id, service) => {
    const dialog = $(id);
    if (!dialog) return;
    if (closing.has(dialog)) await closing.get(dialog);
    if (dialog.open) return;
    for (const current of document.querySelectorAll('dialog[open]')) await closeDialog(current);
    if (id === 'booking-dialog') prepareBooking(service);
    lockPage(dialog);
    dialog.showModal();
    if (dialog === booking) updatePanelViewport();
    if (dialog === menu) {
      toggle.setAttribute('aria-expanded', 'true');
      const links = dialog.querySelectorAll('nav a');
      links.forEach((link, index) => {
        if (reducedMotion.matches || !link.animate) return;
        link.animate([{ opacity: 0.6, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], {
          duration: 330, delay: index * 24, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards'
        });
      });
    }
    animate(dialog, [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], 340);
  };

  toggle.addEventListener('click', () => menu.open ? closeDialog(menu) : openDialog('mobile-menu'));
  const updatePanelViewport = () => {
    if (!booking.open || desktop.matches) return;
    const height = Math.round(window.visualViewport?.height || window.innerHeight);
    booking.style.setProperty('--panel-height', `${height}px`);
    booking.classList.toggle('is-compact', height < 620);
  };
  window.visualViewport?.addEventListener('resize', updatePanelViewport);
  window.addEventListener('resize', updatePanelViewport);
  desktop.addEventListener('change', event => { if (event.matches) closeDialog(menu); });
  document.querySelectorAll('[data-dialog]').forEach(button => {
    button.addEventListener('click', () => openDialog(button.dataset.dialog));
  });
  document.querySelectorAll('[data-service]').forEach(button => {
    button.addEventListener('click', () => openDialog('booking-dialog', button.dataset.service));
  });
  document.querySelectorAll('[data-menu-link]').forEach(link => {
    link.addEventListener('click', async event => {
      event.preventDefault();
      await closeDialog(menu);
      const target = link.hash ? document.querySelector(link.hash) : document.body;
      if (!target) return;
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
      if (target !== document.body) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeDialog(dialog)));
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog || dialog === menu) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog(dialog);
    });
    dialog.addEventListener('close', () => {
      if (dialog.open) return;
      unlockPage(dialog);
      if (dialog === menu) toggle.setAttribute('aria-expanded', 'false');
    });
  });

  const shortDate = value => new Intl.DateTimeFormat('it-IT', { weekday: 'short', timeZone: 'Europe/Rome' }).format(new Date(`${value}T12:00:00Z`));
  const monthName = value => new Intl.DateTimeFormat('it-IT', { month: 'short', timeZone: 'Europe/Rome' }).format(new Date(`${value}T12:00:00Z`));
  const renderDates = () => {
    const list = $('quick-dates');
    list.replaceChildren();
    for (const date of Booking.upcoming()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.date = date;
      button.setAttribute('aria-pressed', String(date === data.date));
      button.setAttribute('aria-label', Booking.formatDate(date));
      for (const [tag, text] of [['span', shortDate(date)], ['strong', String(Number(date.slice(8)))], ['small', monthName(date)]]) {
        const node = document.createElement(tag); node.textContent = text; button.append(node);
      }
      button.addEventListener('click', () => selectDate(date));
      list.append(button);
    }
  };
  const setDateError = message => {
    $('date-error').textContent = message;
    $('date-error').hidden = !message;
    $('booking-date').setAttribute('aria-invalid', String(!!message));
  };
  const selectDate = value => {
    data.date = value;
    data.time = '';
    reachedStep = Math.min(reachedStep, 1);
    $('booking-date').value = value;
    const current = Booking.clock();
    let error = '';
    if (!Booking.validDate(value)) error = 'Scegli un giorno per vedere gli orari.';
    else if (value < current.date) error = 'Questa data è già passata. Scegli un giorno da oggi in poi.';
    else if (value > Booking.addDays(current.date, 90)) error = 'Puoi richiedere un appuntamento entro i prossimi 90 giorni.';
    else if (!Booking.intervals(value).length) error = 'Domenica e lunedì il salone è chiuso. Scegli un altro giorno.';
    else if (!Booking.times(value).length) error = 'Per oggi non ci sono più orari da proporre. Scegli un altro giorno.';
    setDateError(error);
    const available = Booking.times(value);
    period = available.some(time => time < '13:00') ? 'morning' : 'afternoon';
    document.querySelectorAll('[data-date]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.date === value)));
    renderTimes();
    updateControls();
  };
  const renderTimes = () => {
    const all = Booking.times(data.date);
    const visible = all.filter(time => period === 'morning' ? time < '13:00' : time >= '13:00');
    const list = $('time-slots');
    list.replaceChildren();
    document.querySelectorAll('[data-period]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.period === period));
      button.disabled = !all.some(time => button.dataset.period === 'morning' ? time < '13:00' : time >= '13:00');
    });
    for (const time of visible) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = time;
      button.dataset.time = time;
      button.setAttribute('aria-pressed', String(time === data.time));
      button.addEventListener('click', () => {
        data.time = time;
        document.querySelectorAll('[data-time]').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.time === time)));
        updateControls();
      });
      list.append(button);
    }
    $('time-empty').hidden = !!visible.length;
    $('time-empty').textContent = !data.date ? 'Scegli prima il giorno che preferisci.' : 'Nessun orario in questa fascia. Scegli un’altra fascia o un altro giorno.';
  };
  const readContact = () => {
    data.name = $('booking-name').value.trim();
    data.phone = $('booking-phone').value.trim();
    data.notes = $('booking-notes').value.trim();
  };
  const validateContact = () => {
    readContact();
    const errors = Booking.contactErrors(data);
    for (const name of ['name', 'phone', 'notes']) {
      const error = $(`${name}-error`);
      error.textContent = errors[name] || '';
      error.hidden = !errors[name];
      $(`booking-${name}`).setAttribute('aria-invalid', String(!!errors[name]));
    }
    if (Object.keys(errors).length) {
      $(`booking-${Object.keys(errors)[0]}`).focus();
      return false;
    }
    return true;
  };
  const renderSummary = () => {
    const list = $('booking-summary-details');
    list.replaceChildren();
    const rows = [
      ['Il tuo servizio', Booking.services.find(service => service.id === data.service).name],
      ['Giorno preferito', Booking.formatDate(data.date)],
      ['Orario preferito', data.time], ['Il tuo nome', data.name], ['Telefono', data.phone],
      ...(data.notes ? [['Il tuo messaggio', data.notes]] : [])
    ];
    for (const [label, value] of rows) {
      const row = document.createElement('div');
      const term = document.createElement('dt'); term.textContent = label;
      const detail = document.createElement('dd'); detail.textContent = value;
      row.append(term, detail); list.append(row);
    }
    $('request-text').value = Booking.summary(data);
    $('email-status').hidden = true;
    $('copy-fallback').hidden = true;
  };
  const updateControls = () => {
    const service = Booking.services.find(item => item.id === data.service);
    $('booking-selection').textContent = service ? `${service.name}${data.time ? ` · ${data.time}` : ''}` : 'Il tuo prossimo bel momento';
    $('booking-back').hidden = step === 0;
    $('booking-next').hidden = step === 3;
    $('booking-email').hidden = step !== 3;
    $('booking-next').disabled = step === 0 ? !data.service : step === 1 ? !(data.date && data.time && Booking.times(data.date).includes(data.time)) : false;
    const labels = ['Giorno e orario', 'I tuoi dati', 'Rivedi la richiesta'];
    $('booking-next').firstChild.textContent = `${labels[step] || ''} `;
    $('booking-footer-note').textContent = step === 3 ? 'Sito dimostrativo: l’invio è simulato.' : 'Nessun pagamento online. Il prezzo te lo diciamo prima di iniziare.';
    document.querySelectorAll('.booking-progress [data-step-target]').forEach(button => {
      const value = Number(button.dataset.stepTarget);
      button.disabled = value > reachedStep;
      if (value === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.classList.toggle('step-complete', value < step);
    });
  };
  const goToStep = (next, focus = true) => {
    const direction = next >= step ? 1 : -1;
    step = next;
    reachedStep = Math.max(reachedStep, step);
    document.querySelectorAll('[data-booking-step]').forEach(panel => { panel.hidden = Number(panel.dataset.bookingStep) !== step; });
    const current = document.querySelector(`[data-booking-step="${step}"]`);
    booking.querySelector('.booking-scroll').scrollTop = 0;
    if (step === 3) renderSummary();
    updateControls();
    if (focus) current.querySelector('h3').focus({ preventScroll: true });
    animate(current, [{ opacity: .4, transform: `translateX(${direction * 12}px)` }, { opacity: 1, transform: 'none' }], 220);
  };
  const prepareBooking = serviceName => {
    const service = Booking.services.find(item => item.name === serviceName);
    if (service) {
      data.service = service.id;
      const radio = form.querySelector(`input[name="service"][value="${service.id}"]`);
      radio.checked = true;
    }
    const today = Booking.clock().date;
    $('booking-date').min = today;
    $('booking-date').max = Booking.addDays(today, 90);
    if (!data.date || !Booking.times(data.date).length) {
      data.date = Booking.upcoming()[0];
      data.time = '';
    }
    if (data.time && !Booking.times(data.date).includes(data.time)) data.time = '';
    $('booking-date').value = data.date;
    period = data.time ? data.time < '13:00' ? 'morning' : 'afternoon' : Booking.times(data.date).some(time => time < '13:00') ? 'morning' : 'afternoon';
    setDateError(''); renderDates(); renderTimes();
    goToStep(serviceName ? 0 : Math.min(step, 2), false);
  };

  form.querySelectorAll('input[name="service"]').forEach(input => input.addEventListener('change', () => {
    data.service = input.value;
    reachedStep = Math.min(reachedStep, 0);
    updateControls();
  }));
  $('booking-date').addEventListener('change', event => selectDate(event.target.value));
  document.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
    period = button.dataset.period;
    renderTimes();
  }));
  $('booking-next').addEventListener('click', () => {
    if (step === 0 && !data.service) return;
    if (step === 1 && !Booking.times(data.date).includes(data.time)) {
      selectDate(data.date); return;
    }
    if (step === 2 && !validateContact()) return;
    goToStep(Math.min(step + 1, 3));
  });
  $('booking-back').addEventListener('click', () => goToStep(Math.max(step - 1, 0)));
  document.querySelectorAll('[data-step-target]').forEach(button => button.addEventListener('click', () => {
    const next = Number(button.dataset.stepTarget);
    if (next <= reachedStep) goToStep(next);
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (step < 3) $('booking-next').click();
  });
  for (const name of ['name', 'phone', 'notes']) {
    $(`booking-${name}`).addEventListener('input', () => {
      reachedStep = Math.min(reachedStep, 2);
      if ($(`booking-${name}`).getAttribute('aria-invalid') === 'true') {
        $(`booking-${name}`).removeAttribute('aria-invalid');
        $(`${name}-error`).hidden = true;
      }
      updateControls();
    });
  }
  $('booking-email').addEventListener('click', event => {
    event.preventDefault();
    if (!Booking.times(data.date).includes(data.time)) {
      goToStep(1); selectDate(data.date); return;
    }
    // Sito dimostrativo: la richiesta non viene inviata a nessuno.
    $('email-status').textContent = 'Richiesta simulata: in un salone vero adesso arriverebbe a Marta, che ti richiama per confermare. Qui non è stato inviato nulla.';
    $('email-status').hidden = false;
  });
  $('copy-request').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(Booking.summary(data));
      $('email-status').textContent = 'Richiesta copiata negli appunti. Questo è un sito dimostrativo: non c’è un salone a cui inviarla.';
      $('email-status').hidden = false;
    } catch {
      $('copy-fallback').hidden = false;
      $('request-text').focus(); $('request-text').select();
    }
  });
  const photo = document.querySelector('.hero-photo img');
  if (photo && !reducedMotion.matches) {
    animate(photo, [{ transform: 'scale(1.035)' }, { transform: 'scale(1)' }], 550);
  }
  document.querySelectorAll('.faq-list details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (details.open) animate(details.querySelector('p'), [{ opacity: .45, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], 180);
    });
  });
})();
