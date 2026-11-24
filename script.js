(() => {
  const header = document.querySelector('#header');
  const menu = document.querySelector('#menu');
  const pill = menu?.querySelector('.pill');
  const toggle = document.querySelector('#toggle');
  const links = [...(menu?.querySelectorAll('a[data-target]') || [])];
  if (!header || !menu || !pill || !links.length) return;

  let active = menu.querySelector('.active') || links[0];
  const isMobile = () => window.matchMedia('(max-width:620px)').matches;

  function movePill(link) {
    if (!link) return;
    const menuRect = menu.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    pill.style.left = `${linkRect.left - menuRect.left}px`;
    pill.style.top = `${linkRect.top - menuRect.top}px`;
    pill.style.width = `${linkRect.width}px`;
    pill.style.height = `${linkRect.height}px`;
    menu.classList.add('show-pill');
  }

  function setActive(link) {
    if (!link) return;
    active = link;
    links.forEach(item => {
      const selected = item === link;
      item.classList.toggle('active', selected);
      if (selected) item.setAttribute('aria-current', 'location');
      else item.removeAttribute('aria-current');
    });
    if (!isMobile() || menu.classList.contains('open')) movePill(link);
  }

  function closeMenu() {
    menu.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', '메뉴 열기');
  }

  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      if (!isMobile()) movePill(link);
    });
    link.addEventListener('focus', () => movePill(link));
    link.addEventListener('click', () => {
      setActive(link);
      closeMenu();
    });
  });

  menu.addEventListener('mouseleave', () => {
    if (!isMobile()) movePill(active);
  });

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    menu.classList.toggle('open', open);
    if (open) requestAnimationFrame(() => movePill(active));
  });

  document.addEventListener('click', event => {
    if (isMobile() && !menu.contains(event.target) && !toggle?.contains(event.target)) closeMenu();
  });

  function updateHeader() {
    header.classList.toggle('glass', window.scrollY > 20);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Reliable scroll spy: choose the last section whose top has crossed the header line.
  const sectionLinks = links
    .map(link => ({ link, section: document.getElementById(link.dataset.target) }))
    .filter(item => item.section);

  let ticking = false;
  function updateCurrentSection() {
    ticking = false;
    const marker = Math.max(100, window.innerHeight * 0.30);
    let current = sectionLinks[0];
    for (const item of sectionLinks) {
      if (item.section.getBoundingClientRect().top <= marker) current = item;
      else break;
    }
    if (current) setActive(current.link);
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateCurrentSection);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Clicking a menu item updates the selected state immediately; scroll spy confirms it on arrival.
  links.forEach(link => {
    link.addEventListener('click', () => {
      const target = document.getElementById(link.dataset.target);
      if (target) {
        setActive(link);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  window.addEventListener('resize', () => {
    if (isMobile()) {
      menu.classList.remove('show-pill');
      if (!menu.classList.contains('open')) closeMenu();
    } else {
      closeMenu();
      movePill(active);
    }
    updateCurrentSection();
  });

  setActive(active);
  updateCurrentSection();
})();


// Reusable image viewer for kiosk and app work samples.
(() => {
  const modal = document.getElementById('imageLightbox');
  if (!modal) return;
  const image = modal.querySelector('figure img');
  const caption = modal.querySelector('figcaption');
  const closeButton = modal.querySelector('.lightbox-close');
  const prevButton = modal.querySelector('.lightbox-prev');
  const nextButton = modal.querySelector('.lightbox-next');
  let imageList = [];
  let currentIndex = 0;
  let returnFocus = null;

  function render() {
    const src = imageList[currentIndex];
    image.src = src;
    image.alt = `작업 이미지 ${currentIndex + 1}`;
    caption.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(imageList.length).padStart(2, '0')}`;
    const multiple = imageList.length > 1;
    prevButton.hidden = !multiple;
    nextButton.hidden = !multiple;
  }
  function open(button) {
    imageList = (button.dataset.images || '').split(',').map(v => v.trim()).filter(Boolean);
    if (!imageList.length) return;
    currentIndex = 0;
    returnFocus = button;
    render();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  }
  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    image.removeAttribute('src');
    returnFocus?.focus();
  }
  function step(direction) {
    if (!imageList.length) return;
    currentIndex = (currentIndex + direction + imageList.length) % imageList.length;
    render();
  }
  document.querySelectorAll('.image-button[data-images]').forEach(button => {
    button.addEventListener('click', () => open(button));
    if (button.matches('[role="button"]')) {
      button.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(button);
        }
      });
    }
  });
  closeButton.addEventListener('click', close);
  prevButton.addEventListener('click', () => step(-1));
  nextButton.addEventListener('click', () => step(1));
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  document.addEventListener('keydown', event => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  });
})();
