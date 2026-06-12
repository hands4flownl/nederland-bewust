/* Nederland-Bewust – Hoofd JavaScript */

document.addEventListener('DOMContentLoaded', function () {

  // ===================== MOBIEL MENU =====================
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      const open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', false);
      });
    });
  }

  // ===================== ACTIEVE NAV =====================
  const huidigPad = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (!href) return;
    if (href !== '/' && huidigPad.endsWith(href.replace(/^\/nederland-bewust/, ''))) {
      link.classList.add('actief');
    }
  });

  // ===================== TELLER ANIMATIE =====================
  function animeerTeller(el, eindwaarde, duur) {
    let start = 0;
    const stap = eindwaarde / (duur / 16);
    const interval = setInterval(function () {
      start += stap;
      if (start >= eindwaarde) { start = eindwaarde; clearInterval(interval); }
      el.textContent = Math.floor(start);
    }, 16);
  }
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !entry.target.dataset.geanimeerd) {
        entry.target.dataset.geanimeerd = 'true';
        animeerTeller(entry.target, parseInt(entry.target.dataset.doel, 10), 1400);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.teller__getal[data-doel]').forEach(function (el) { observer.observe(el); });

  // ===================== FORMULIER VIA FORMSPREE =====================
  document.querySelectorAll('.js-formulier').forEach(function (formulier) {
    formulier.addEventListener('submit', async function (e) {
      e.preventDefault();
      const knop = formulier.querySelector('button[type="submit"]');
      const melding = formulier.querySelector('.formulier-melding');
      const ot = knop ? knop.textContent : '';
      if (knop) { knop.textContent = 'Verzenden...'; knop.disabled = true; }
      if (melding) { melding.className = 'formulier-melding'; melding.textContent = ''; }
      try {
        const response = await fetch(formulier.action, {
          method: 'POST', body: new FormData(formulier),
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          if (melding) { melding.className = 'formulier-melding succes'; melding.textContent = 'Bedankt! Je bericht is ontvangen. We nemen zo snel mogelijk contact op.'; }
          formulier.reset();
        } else { throw new Error(); }
      } catch {
        if (melding) { melding.className = 'formulier-melding fout'; melding.textContent = 'Er is iets misgegaan. Mail naar info@nederland-bewust.nl'; }
      } finally {
        if (knop) { knop.textContent = ot; knop.disabled = false; }
      }
    });
  });

  // ===================== ZOEK & FILTER BEWUST-MAKERS =====================
  const zoekInput = document.getElementById('zoek-naam');
  const zoekProvincie = document.getElementById('zoek-provincie');
  const zoekMethode = document.getElementById('zoek-methode');
  const filterTags = document.querySelectorAll('.js-tag-filter');
  const makerItems = document.querySelectorAll('.js-maker');
  const resultaatTekst = document.getElementById('zoek-resultaat');

  function filterMakers() {
    const naam = zoekInput ? zoekInput.value.toLowerCase() : '';
    const provincie = zoekProvincie ? zoekProvincie.value : '';
    const methode = zoekMethode ? zoekMethode.value : '';
    const actieveTag = document.querySelector('.js-tag-filter.actief');
    const tag = actieveTag ? actieveTag.dataset.filter : 'alles';

    let zichtbaar = 0;
    makerItems.forEach(function (item) {
      const naamMatch = !naam || item.dataset.naam.toLowerCase().includes(naam);
      const provMatch = !provincie || item.dataset.provincie === provincie;
      const methMatch = !methode || (item.dataset.methoden && item.dataset.methoden.includes(methode));
      const tagMatch = tag === 'alles' || (item.dataset.tags && item.dataset.tags.includes(tag));
      const toon = naamMatch && provMatch && methMatch && tagMatch;
      item.style.display = toon ? '' : 'none';
      if (toon) zichtbaar++;
    });
    if (resultaatTekst) {
      resultaatTekst.textContent = makerItems.length > 0
        ? zichtbaar + ' bewust-maker' + (zichtbaar !== 1 ? 's' : '') + ' gevonden'
        : '';
    }
  }

  if (zoekInput) zoekInput.addEventListener('input', filterMakers);
  if (zoekProvincie) zoekProvincie.addEventListener('change', filterMakers);
  if (zoekMethode) zoekMethode.addEventListener('change', filterMakers);

  filterTags.forEach(function (knop) {
    knop.addEventListener('click', function () {
      filterTags.forEach(function (k) { k.classList.remove('actief'); });
      this.classList.add('actief');
      filterMakers();
    });
  });

  // ===================== LOCATIE ZOEKEN =====================
  const locatieKnop = document.getElementById('gebruik-locatie');
  if (locatieKnop) {
    locatieKnop.addEventListener('click', function () {
      if (!navigator.geolocation) {
        alert('Locatie wordt niet ondersteund door jouw browser.');
        return;
      }
      locatieKnop.textContent = '📍 Locatie bepalen...';
      locatieKnop.disabled = true;
      navigator.geolocation.getCurrentPosition(function (pos) {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        // Bepaal provincie via Open Nominatim
        fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon)
          .then(function(r) { return r.json(); })
          .then(function(data) {
            const prov = data.address && data.address.state ? data.address.state : '';
            const provMap = {
              'Drenthe': 'Drenthe', 'Groningen': 'Groningen', 'Friesland': 'Friesland',
              'Overijssel': 'Overijssel', 'Gelderland': 'Gelderland', 'Utrecht': 'Utrecht',
              'Noord-Holland': 'Noord-Holland', 'Zuid-Holland': 'Zuid-Holland',
              'Zeeland': 'Zeeland', 'Noord-Brabant': 'Noord-Brabant',
              'Limburg': 'Limburg', 'Flevoland': 'Flevoland'
            };
            const gevonden = provMap[prov] || '';
            if (gevonden && zoekProvincie) {
              zoekProvincie.value = gevonden;
              filterMakers();
              locatieKnop.textContent = '📍 ' + gevonden;
            } else {
              locatieKnop.textContent = '📍 Gebruik locatie';
            }
          })
          .catch(function() { locatieKnop.textContent = '📍 Gebruik locatie'; })
          .finally(function() { locatieKnop.disabled = false; });
      }, function () {
        alert('Kon locatie niet ophalen. Selecteer je provincie handmatig.');
        locatieKnop.textContent = '📍 Gebruik locatie';
        locatieKnop.disabled = false;
      });
    });
  }

});

// ===================== LOGIN STATUS: NAV + FOOTER =====================
(function() {
  function updateLoginUI(ingelogd) {
    // Nav knop
    var navKnop = document.getElementById('nav-beheer-item');
    if (navKnop) navKnop.style.display = ingelogd ? 'block' : 'none';
    // Footer: wissel login <-> beheer link
    var loginLink = document.getElementById('footer-login-link');
    var beheerLink = document.getElementById('footer-beheer-link');
    if (loginLink) loginLink.style.display = ingelogd ? 'none' : 'inline';
    if (beheerLink) beheerLink.style.display = ingelogd ? 'inline' : 'none';
  }

  function checkStatus() {
    var ingelogd = false;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key && key.indexOf('gotrue') !== -1) {
          try {
            var val = JSON.parse(localStorage.getItem(key));
            if (val && val.access_token) { ingelogd = true; break; }
          } catch(e) {}
        }
      }
    } catch(e) {}
    updateLoginUI(ingelogd);
  }

  document.addEventListener('DOMContentLoaded', checkStatus);

  if (window.netlifyIdentity) {
    window.netlifyIdentity.on('login', function() {
      setTimeout(function() { updateLoginUI(true); }, 600);
    });
    window.netlifyIdentity.on('logout', function() {
      updateLoginUI(false);
    });
  }
})();
