// ==========================================
// 1. KONFIGURASI FIREBASE & GLOBAL STATE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDlucMVwMUbw7Ab3t2AVzI13EOHUrqDNZw",
    authDomain: "web-kelas-5b83a.firebaseapp.com",
    databaseURL: "https://web-kelas-5b83a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "web-kelas-5b83a",
    storageBucket: "web-kelas-5b83a.firebasestorage.app",
    messagingSenderId: "711947014423",
    appId: "1:711947014423:web:d8cb787c503d7d7538e752",
    measurementId: "G-RYNNLZCGY5"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// State Global & Session Management
const me = localStorage.getItem('savedUser') || "Guest";
// Generate token unik untuk tiap perangkat yang login
let myToken = localStorage.getItem('sessionToken');
if (!myToken) {
    myToken = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('sessionToken', myToken);
}

const bypassUsers = ["admin", "Tya", "9¹", "Kontol"];

// ==========================================
// 2. LIVE MONITORING (BAN, MULTI-LOGIN, & PING)
// ==========================================
if (me !== "Guest") {
    
    // A. LIVE BAN CHECK: Jika admin ban, user langsung ditendang
    database.ref('status_user/' + me).on('value', snap => {
        if (snap.val() === "banned") {
            alert("🚫 Akun Anda telah diblokir oleh Admin!");
            logout();
        }
    });

    // B. ANTI-MULTI LOGIN: 1 User 1 Perangkat (Kecuali Admin/Bypass)
    if (!bypassUsers.includes(me)) {
        database.ref('sessions/' + me).on('value', snap => {
            const activeToken = snap.val();
            if (activeToken && activeToken !== myToken) {
                alert("⚠️ Akun ini baru saja login di perangkat lain!");
                logout();
            }
        });
    }

    // C. PING ONLINE 5 DETIK: Lapor ke database
    if (window.location.href.includes("page91.html")) {
        const userStatusRef = database.ref('log_online/' + me);
        
        const sendPing = () => {
            userStatusRef.set({
                username: me,
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });
        };

        sendPing(); // Ping pertama
        setInterval(sendPing, 5000); // Rutin tiap 5 detik
        userStatusRef.onDisconnect().remove();
    }
}

// ==========================================
// 3. MONITORING MAINTENANCE (LIVE KICK)
// ==========================================
database.ref('maintenance/isLive').on('value', snap => {
    const isMT = snap.val();
    const elStatus = document.getElementById('mtStatus');
    
    if (elStatus) {
        elStatus.innerText = isMT ? "Status: AKTIF" : "Status: NON-AKTIF";
        elStatus.style.color = isMT ? "#ff4d4d" : "#2ecc71";
    }

    if (isMT === true && !bypassUsers.includes(me)) {
        if (!window.location.href.includes("index.html")) {
            alert("🚨 Server sedang Maintenance!");
            logout();
        }
    }
});

// ==========================================
// 4. SISTEM LOGIN
// ==========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const uInput = document.getElementById('username').value.trim();
        const pInput = document.getElementById('password').value.trim();

        // 1. Cek Maintenance
        const snapM = await database.ref('maintenance/isLive').once('value');
        if (snapM.val() === true && !bypassUsers.includes(uInput)) {
            return alert("⛔ Server sedang Maintenance!");
        }

        // 2. Cek Banned
        const snapBan = await database.ref('status_user/' + uInput).once('value');
        if (snapBan.val() === "banned") return alert("AKSES DIBLOKIR!");

        // 3. Validasi User (Default & Custom)
        const snapCustom = await database.ref('users_custom/' + uInput).once('value');
        const customData = snapCustom.val();
        
        const defaultUsers = [{ user: "9¹", pass: "91" }, { user: "admin", pass: "admin123" }];
        const isDefault = defaultUsers.find(u => u.user === uInput && u.pass === pInput);
        const isCustom = customData && customData.pass === pInput;

        if (isDefault || isCustom) {
            localStorage.setItem('savedUser', uInput);
            
            // Simpan Session Token untuk kunci 1 perangkat
            database.ref('sessions/' + uInput).set(myToken);
            
            // Catat log online
            database.ref('log_online/' + uInput).set({
                username: uInput, 
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });

            if (uInput === "admin") { 
                tampilkanLogAdmin(); 
            } else { 
                window.location.href = "page91.html"; 
            }
        } else {
            alert('Username atau Password Salah!');
        }
    });
}

// ==========================================
// 5. FUNGSI PANEL ADMIN
// ==========================================

window.updateWebSekarang = function() {
    const teks = document.getElementById('inputTeks').value;
    if (!teks) return alert("Pesan kosong!");
    database.ref('konten_web').update({ pesan: teks, waktu: new Date().toLocaleTimeString() })
    .then(() => alert("📢 Pengumuman diperbarui!"));
};

window.tambahUserCustom = function() {
    const u = document.getElementById('customUser').value.trim();
    const p = document.getElementById('customPass').value.trim();
    if (!u || !p) return alert("Isi User & Pass!");
    database.ref('users_custom/' + u).set({ pass: p }).then(() => {
        alert("✅ User " + u + " tersimpan!");
        document.getElementById('customUser').value = "";
        document.getElementById('customPass').value = "";
    });
};

window.updateJadwalSistem = function() {
    const jenis = document.getElementById('pilihJenisJadwal').value;
    const hari = document.getElementById('pilihHari').value;
    const isi = document.getElementById('isiJadwalBaru').value;
    database.ref('data_kelas/' + jenis + '/' + hari).set(isi).then(() => alert("📅 Jadwal diperbarui!"));
};

window.setMaintenance = function(s) {
    database.ref('maintenance/isLive').set(s).then(() => alert("Maintenance: " + (s ? "ON" : "OFF")));
};

window.banUser = (u) => {
    if(confirm("Ban permanent " + u + "?")) {
        database.ref('status_user/' + u).set('banned');
        database.ref('sessions/' + u).remove(); // Hapus session supaya ditendang
        alert(u + " telah diblokir.");
    }
};

// Monitoring List Online di UI Admin
database.ref('log_online').on('value', snap => {
    const list = document.getElementById('onlineList');
    if (list) {
        list.innerHTML = "";
        snap.forEach(c => {
            list.innerHTML += `
                <li class="list-item">
                    <span>🟢 ${c.key}</span>
                    <button onclick="banUser('${c.key}')" style="background:#ff4d4d; color:white; border:none; padding:2px 6px; border-radius:4px; font-size:10px; cursor:pointer;">BAN</button>
                </li>`;
        });
    }
});

function logout() {
    if (me !== "Guest") database.ref('log_online/' + me).remove();
    localStorage.clear();
    window.location.replace("index.html");
}

function tampilkanLogAdmin() {
    const p = document.getElementById('adminPanel');
    if (p) p.style.display = 'block';
}

// Cleanup Otomatis User yang tidak aktif (Refresh tiap 5 detik)
setInterval(() => {
    const skrg = Date.now();
    database.ref('log_online').once('value', s => {
        s.forEach(c => {
            // Jika tidak ping dalam 10 detik, anggap offline
            if (skrg - (c.val().last_seen || 0) > 10000) {
                c.ref.remove();
            }
        });
    });
}, 5000);
