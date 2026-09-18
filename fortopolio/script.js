/* Theme Detection & Toggle */
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (event.matches) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});

const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
});

/* Intersection Observer for Scroll Animations */
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
    }
  });
}, observerOptions);

document.querySelectorAll('.link-button, .social-icon').forEach(el => {
  observer.observe(el);
});

/* Easter Egg: Avatar Party Mode */
let clickCount = 0;
const avatar = document.querySelector('.avatar');

avatar.addEventListener('click', () => {
  clickCount++;

  if (clickCount >= 5) {
    document.querySelectorAll('.bubble').forEach((bubble) => {
      bubble.style.animationDuration = '2s';
      bubble.style.opacity = '0.9';
    });

    setTimeout(() => {
      document.querySelectorAll('.bubble').forEach((bubble) => {
        bubble.style.animationDuration = '';
        bubble.style.opacity = '';
      });
      clickCount = 0;
    }, 3000);
  }
});
