/* Nederland-Bewust – Hoofd JavaScript */

document.addEventListener('DOMContentLoaded', function () {

  // =====================
  // MOBIEL MENU
  // =====================
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      const open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });

    // Sluit menu bij klik op link
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', false);
      });
    });
  }

  // =====================
  // ACTIEVE NAV LINK
  // =====================
  const huidigPad = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    const href = link.getAttribute('href');
    if (href && href !== '/' && huidigPad.startsWith(href)) {
      link.classList.add('actief');
    } else if (href === '/' && huidigPad === '/') {
      link.classList.add('actief');
    }
  });

  // =====================
  // TELLER ANIMATIE
  // =====================
  function animeerTeller(el, eindwaarde, duur) {
    let start = 0;
    const stap = eindwaarde / (duur / 16);
    const interval = setInterval(function () {
      start += stap;
      if (start >= eindwaarde) {
        start = eindwaarde;
        clearInterval(interval);
      }
      el.textContent = Math.floor(start);
    }, 16);
  }

  const tellers = document.querySelectorAll('.teller__getal[data-doel]');

  if (tellers.length > 0) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !entry.target.dataset.geanimeerd) {
          entry.target.dataset.geanimeerd = 'true';
          const doel = parseInt(entry.target.dataset.doel, 10);
          animeerTeller(entry.target, doel, 1500);
        }
      });
    }, { threshold: 0.4 });

    tellers.forEach(function (teller) {
      observer.observe(teller);
    });
  }

  // =====================
  // FORMULIER VIA FORMSPREE
  // =====================
  document.querySelectorAll('.js-formulier').forEach(function (formulier) {
    formulier.addEventListener('submit', async function (e) {
      e.preventDefault();

      const knop = formulier.querySelector('button[type="submit"]');
      const melding = formulier.querySelector('.formulier-melding');
      const oorspronkelijkeTekst = knop ? knop.textContent : '';

      if (knop) {
        knop.textContent = 'Verzenden...';
        knop.disabled = true;
      }

      if (melding) {
        melding.className = 'formulier-melding';
        melding.textContent = '';
      }

      try {
        const data = new FormData(formulier);
        const response = await fetch(formulier.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          if (melding) {
            melding.className = 'formulier-melding succes';
            melding.textContent = 'Bedankt! Jouw bericht is verzonden. We nemen zo snel mogelijk contact op.';
          }
          formulier.reset();
        } else {
          throw new Error('Serverfout');
        }
      } catch (err) {
        if (melding) {
          melding.className = 'formulier-melding fout';
          melding.textContent = 'Er is iets misgegaan. Probeer het opnieuw of mail naar info@nederland-bewust.nl';
        }
      } finally {
        if (knop) {
          knop.textContent = oorspronkelijkeTekst;
          knop.disabled = false;
        }
      }
    });
  });

  // =====================
  // TAG FILTER (kennisbank / inspiratie)
  // =====================
  const tagKnoppen = document.querySelectorAll('.js-tag-filter');
  const filterItems = document.querySelectorAll('.js-filterbaar');

  if (tagKnoppen.length > 0 && filterItems.length > 0) {
    tagKnoppen.forEach(function (knop) {
      knop.addEventListener('click', function () {
        tagKnoppen.forEach(function (k) { k.classList.remove('actief'); });
        this.classList.add('actief');

        const filter = this.dataset.filter;

        filterItems.forEach(function (item) {
          if (filter === 'alles' || item.dataset.tags.includes(filter)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

});
