// ---------- Green Point store (per user, shared across pages via localStorage) ----------
const GreenPoints = {
  keyFor(user){ return 'seven_green_points_' + (user || 'guest'); },
  get(){
    const user = (typeof Auth !== 'undefined') ? Auth.currentUser() : null;
    return parseInt(localStorage.getItem(this.keyFor(user)) || '0', 10);
  },
  set(v){
    const user = (typeof Auth !== 'undefined') ? Auth.currentUser() : null;
    localStorage.setItem(this.keyFor(user), String(Math.max(0, v)));
    this.render();
  },
  add(v){ this.set(this.get() + v); },
  render(){
    document.querySelectorAll('[data-green-points]').forEach(el => {
      el.textContent = this.get() + ' Green Point';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  GreenPoints.render();

  // highlight active aisle nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.aisle-nav a').forEach(a => {
    if(a.getAttribute('href') === path) a.classList.add('active');
  });
});
