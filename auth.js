// ---------- Simple client-side auth (demo only, no real backend/security) ----------
const Auth = {
  usersKey: 'seven_green_users',
  sessionKey: 'seven_green_session',

  getUsers(){
    try{ return JSON.parse(localStorage.getItem(this.usersKey) || '{}'); }
    catch(e){ return {}; }
  },
  saveUsers(users){ localStorage.setItem(this.usersKey, JSON.stringify(users)); },

  currentUser(){ return localStorage.getItem(this.sessionKey) || null; },

  // older accounts stored the password as a plain string; normalize any
  // stored entry into a full profile object so the rest of the app can
  // rely on a consistent shape.
  _normalize(entry, username){
    if(typeof entry === 'string'){
      return {password: entry, displayName: username, email:'', bio:'', secQuestion:'', secAnswer:''};
    }
    return Object.assign({password:'', displayName: username, email:'', bio:'', secQuestion:'', secAnswer:''}, entry);
  },

  getProfile(username){
    username = (username || '').trim();
    const users = this.getUsers();
    if(!users[username]) return null;
    return this._normalize(users[username], username);
  },

  register(username, password, extra){
    username = (username || '').trim();
    password = (password || '').trim();
    extra = extra || {};
    if(!username || !password) return {ok:false, msg:'กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ'};
    if(password.length < 4) return {ok:false, msg:'รหัสผ่านควรมีอย่างน้อย 4 ตัวอักษร'};
    if(!extra.secQuestion || !(extra.secAnswer || '').trim()){
      return {ok:false, msg:'กรุณาเลือกคำถามและกรอกคำตอบสำหรับกู้คืนรหัสผ่าน'};
    }
    const users = this.getUsers();
    if(users[username]) return {ok:false, msg:'มีชื่อผู้ใช้นี้อยู่แล้ว ลองเข้าสู่ระบบแทน'};
    users[username] = {
      password,
      displayName: (extra.displayName || '').trim() || username,
      email: (extra.email || '').trim(),
      bio: '',
      secQuestion: extra.secQuestion,
      secAnswer: (extra.secAnswer || '').trim().toLowerCase()
    };
    this.saveUsers(users);
    localStorage.setItem(this.sessionKey, username);
    return {ok:true};
  },

  login(username, password){
    username = (username || '').trim();
    password = (password || '').trim();
    const users = this.getUsers();
    if(!users[username]) return {ok:false, msg:'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'};
    const profile = this._normalize(users[username], username);
    if(profile.password !== password) return {ok:false, msg:'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'};
    localStorage.setItem(this.sessionKey, username);
    return {ok:true};
  },

  logout(){
    localStorage.removeItem(this.sessionKey);
  },

  // update editable profile fields (display name, email, bio)
  updateProfile(username, data){
    username = (username || '').trim();
    const users = this.getUsers();
    if(!users[username]) return {ok:false, msg:'ไม่พบบัญชีผู้ใช้นี้'};
    const profile = this._normalize(users[username], username);
    if(data.displayName !== undefined) profile.displayName = (data.displayName || '').trim() || username;
    if(data.email !== undefined) profile.email = (data.email || '').trim();
    if(data.bio !== undefined) profile.bio = (data.bio || '').trim();
    users[username] = profile;
    this.saveUsers(users);
    return {ok:true};
  },

  // change password while logged in (requires current password)
  changePassword(username, oldPassword, newPassword){
    username = (username || '').trim();
    const users = this.getUsers();
    if(!users[username]) return {ok:false, msg:'ไม่พบบัญชีผู้ใช้นี้'};
    const profile = this._normalize(users[username], username);
    if(profile.password !== (oldPassword || '').trim()){
      return {ok:false, msg:'รหัสผ่านเดิมไม่ถูกต้อง'};
    }
    const next = (newPassword || '').trim();
    if(next.length < 4) return {ok:false, msg:'รหัสผ่านใหม่ควรมีอย่างน้อย 4 ตัวอักษร'};
    if(next === profile.password) return {ok:false, msg:'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม'};
    profile.password = next;
    users[username] = profile;
    this.saveUsers(users);
    return {ok:true};
  },

  // update (or set up) the security question used for password recovery
  updateSecurity(username, secQuestion, secAnswer){
    username = (username || '').trim();
    const users = this.getUsers();
    if(!users[username]) return {ok:false, msg:'ไม่พบบัญชีผู้ใช้นี้'};
    if(!secQuestion || !(secAnswer || '').trim()){
      return {ok:false, msg:'กรุณาเลือกคำถามและกรอกคำตอบให้ครบ'};
    }
    const profile = this._normalize(users[username], username);
    profile.secQuestion = secQuestion;
    profile.secAnswer = secAnswer.trim().toLowerCase();
    users[username] = profile;
    this.saveUsers(users);
    return {ok:true};
  },

  // step 1 of "forgot password": look up the account's recovery question
  getSecurityQuestion(username){
    const profile = this.getProfile(username);
    if(!profile) return {ok:false, msg:'ไม่พบชื่อผู้ใช้นี้ในระบบ'};
    if(!profile.secQuestion) return {ok:false, msg:'บัญชีนี้ยังไม่ได้ตั้งค่าคำถามกู้คืนรหัสผ่านไว้'};
    return {ok:true, question: profile.secQuestion};
  },

  // step 2 of "forgot password": verify the answer and set a new password
  resetPassword(username, answer, newPassword){
    username = (username || '').trim();
    const users = this.getUsers();
    if(!users[username]) return {ok:false, msg:'ไม่พบบัญชีผู้ใช้นี้'};
    const profile = this._normalize(users[username], username);
    if(!profile.secAnswer || profile.secAnswer !== (answer || '').trim().toLowerCase()){
      return {ok:false, msg:'คำตอบไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'};
    }
    const next = (newPassword || '').trim();
    if(next.length < 4) return {ok:false, msg:'รหัสผ่านใหม่ควรมีอย่างน้อย 4 ตัวอักษร'};
    profile.password = next;
    users[username] = profile;
    this.saveUsers(users);
    return {ok:true};
  },

  // require login before an action; shows an inline message with a login link
  // inside the given element and returns false if no user is signed in.
  requireLogin(messageEl){
    if(this.currentUser()) return true;
    if(messageEl){
      messageEl.className = 'feedback no';
      messageEl.innerHTML = 'กรุณา <a href="login.html" style="color:var(--red);text-decoration:underline;">เข้าสู่ระบบ</a> ก่อนบันทึกคะแนน';
    }
    return false;
  },

  renderHeader(){
    const area = document.getElementById('authArea');
    if(!area) return;
    const user = this.currentUser();
    if(user){
      const profile = this.getProfile(user) || {displayName:user};
      const displayName = profile.displayName || user;
      area.innerHTML =
        '<div class="user-chip">' +
          '<span class="avatar">' + displayName.charAt(0).toUpperCase() + '</span>' +
          '<a class="uname" href="profile.html" title="แก้ไขโปรไฟล์">' + displayName + '</a>' +
          '<button class="logout-btn" id="logoutBtn" type="button">ออกจากระบบ</button>' +
        '</div>';
      document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
        if(typeof GreenPoints !== 'undefined') GreenPoints.render();
        location.href = 'index.html';
      });
    } else {
      area.innerHTML = '<a href="login.html" class="btn-login">เข้าสู่ระบบ</a>';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Auth.renderHeader());
