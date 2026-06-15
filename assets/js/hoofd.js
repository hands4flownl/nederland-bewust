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

  // ===================== AFSTAND HULPFUNCTIE =====================
  function berekenKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const d = Math.PI / 180;
    const dlat = (lat2 - lat1) * d;
    const dlon = (lon2 - lon1) * d;
    const a = Math.sin(dlat/2) * Math.sin(dlat/2) +
              Math.cos(lat1 * d) * Math.cos(lat2 * d) *
              Math.sin(dlon/2) * Math.sin(dlon/2);
    return R * 2 * Math.asin(Math.sqrt(a));
  }

  // ===================== ZOEK & FILTER BEWUST-MAKERS =====================
  const zoekInput    = document.getElementById('zoek-naam');
  const zoekProv     = document.getElementById('zoek-provincie');
  const filterTags   = document.querySelectorAll('.js-tag-filter');
  const makerItems   = document.querySelectorAll('.js-maker');
  const resultaatTxt = document.getElementById('zoek-resultaat');
  const afstandWrap  = document.getElementById('afstand-wrap');
  const afstandSlider = document.getElementById('afstand-slider');
  const afstandLabel = document.getElementById('afstand-label');
  const afstandWis   = document.getElementById('afstand-wis');
  const provinciVeld = document.getElementById('provincie-veld');

  let gebruikerLat = null;
  let gebruikerLon = null;

  function filterMakers() {
    const naam   = zoekInput ? zoekInput.value.toLowerCase().trim() : '';
    const prov   = zoekProv  ? zoekProv.value : '';
    const actTag = document.querySelector('.js-tag-filter.actief');
    const tag    = actTag ? actTag.dataset.filter : 'alles';
    const maxKm  = afstandSlider ? parseInt(afstandSlider.value) : null;
    const locActief = gebruikerLat !== null && afstandWrap && afstandWrap.style.display !== 'none';

    let zichtbaar = 0;
    makerItems.forEach(function (item) {
      // Tekstzoeken: naam + omschrijving + methoden + tags
      const zoekVeld = [
        item.dataset.naam        || '',
        item.dataset.omschrijving || '',
        item.dataset.methoden    || '',
        item.dataset.tags        || ''
      ].join(' ').toLowerCase();
      const naamMatch = !naam || zoekVeld.includes(naam);

      // Provincie (alleen als geen locatiefilter actief)
      const provMatch = locActief || !prov || item.dataset.provincie === prov;

      // Methode-tag
      const tagMatch = tag === 'alles' || (item.dataset.tags && item.dataset.tags.includes(tag));

      // Afstand
      let afstandMatch = true;
      if (locActief && maxKm) {
        const mLat = parseFloat(item.dataset.lat);
        const mLon = parseFloat(item.dataset.lon);
        if (!isNaN(mLat) && !isNaN(mLon)) {
          afstandMatch = berekenKm(gebruikerLat, gebruikerLon, mLat, mLon) <= maxKm;
        } else {
          // Geen coördinaten: toon altijd (valt buiten filter)
          afstandMatch = true;
        }
      }

      const toon = naamMatch && provMatch && tagMatch && afstandMatch;
      item.style.display = toon ? '' : 'none';
      if (toon) zichtbaar++;
    });

    if (resultaatTxt) {
      resultaatTxt.textContent = makerItems.length > 0
        ? zichtbaar + ' bewust-maker' + (zichtbaar !== 1 ? 's' : '') + ' gevonden'
        : '';
    }
  }

  if (zoekInput)  zoekInput.addEventListener('input', filterMakers);
  if (zoekProv)   zoekProv.addEventListener('change', filterMakers);
  if (afstandSlider) {
    afstandSlider.addEventListener('input', function () {
      if (afstandLabel) afstandLabel.textContent = 'Binnen ' + this.value + ' km';
      filterMakers();
    });
  }

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
        gebruikerLat = pos.coords.latitude;
        gebruikerLon = pos.coords.longitude;

        // Toon afstand-slider, verberg provincie-dropdown
        if (afstandWrap)  afstandWrap.style.display = 'block';
        if (provinciVeld) provinciVeld.style.display = 'none';
        if (zoekProv)     zoekProv.value = '';
        if (afstandLabel) afstandLabel.textContent = 'Binnen ' + (afstandSlider ? afstandSlider.value : 20) + ' km';

        locatieKnop.textContent = '📍 Locatie gevonden';
        locatieKnop.disabled = false;
        filterMakers();
      }, function () {
        alert('Kon locatie niet ophalen. Selecteer je provincie handmatig.');
        locatieKnop.textContent = '📍 Zoek op afstand';
        locatieKnop.disabled = false;
      });
    });
  }

  // Locatiefilter verwijderen
  if (afstandWis) {
    afstandWis.addEventListener('click', function () {
      gebruikerLat = null;
      gebruikerLon = null;
      if (afstandWrap)  afstandWrap.style.display = 'none';
      if (provinciVeld) provinciVeld.style.display = '';
      if (locatieKnop)  locatieKnop.textContent = '📍 Zoek op afstand';
      filterMakers();
    });
  }

});

// ===================== BEHEER KNOP (simpel) =====================
document.addEventListener('DOMContentLoaded', function() {
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

  var navKnop     = document.getElementById('nav-beheer-item');
  var loginLink   = document.getElementById('footer-login-link');
  var beheerLink  = document.getElementById('footer-beheer-link');

  if (ingelogd) {
    if (navKnop)    navKnop.style.display = 'block';
    if (loginLink)  loginLink.style.display = 'none';
    if (beheerLink) beheerLink.style.display = 'inline';
  } else {
    if (navKnop)    navKnop.style.display = 'none';
    if (loginLink)  loginLink.style.display = 'inline';
    if (beheerLink) beheerLink.style.display = 'none';
  }
});
