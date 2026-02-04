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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// State Global
const me = localStorage.getItem('savedUser') || "Guest";
let isMaintenanceActive = false;

/** * PERBAIKAN UTAMA: 
 * Daftar bypass harus mencakup semua variasi penulisan 
 * atau pastikan database/localStorage menggunakan huruf yang sama.
 */
const bypassUsers = ["admin", "Tya", "9¹", "Kontol"]; 

// ==========================================
// 2. MONITORING MAINTENANCE (LIVE KICK)
// ==========================================
database.ref('maintenance/isLive').on('value', snap => {
    isMaintenanceActive = snap.val();
    
    // Update teks status di panel admin secara real-time
    const elStatus = document.getElementById('mtStatus');
    if (elStatus) {
        elStatus.innerText = isMaintenanceActive ? "Status: AKTIF" : "Status: NON-AKTIF";
        elStatus.style.color = isMaintenanceActive ? "#ff4d4d" : "#2ecc71";
        elStatus.style.fontWeight = "bold";
    }

    // CEK APAKAH HARUS DITENDANG?
    // User ditendang HANYA JIKA: Maintenance ON DAN (User bukan di daftar bypass)
    if (isMaintenanceActive === true) {
        if (!bypassUsers.includes(me)) {
            // Jika sedang di dalam dashboard (bukan halaman login), tendang keluar
            if (!window.location.href.includes("index.html")) {
                alert("🚨 SERVER MAINTENANCE!\nSistem sedang diperbarui, Anda dialihkan ke halaman utama.");
                window.location.href = "index.html";
            }
        }
    }
});

// ==========================================
// 3. SISTEM LOGIN (HARD-LOCKED SECURITY)
// ==========================================
const defaultUsers = [
    { user: "9¹", pass: "91" }, 
    { user: "admin", pass: "admin123" }, 
    { user: "Tya", pass: "tya123" }
];
for (let i = 1; i <= 25; i++) { defaultUsers.push({ user: "user" + i, pass: "pass" + i }); }

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const uInput = document.getElementById('username').value.trim();
        const pInput = document.getElementById('password').value.trim();

        // CEK MAINTENANCE DULU
        const snapM = await database.ref('maintenance/isLive').once('value');
        if (snapM.val() === true && !bypassUsers.includes(uInput)) {
            return alert("⛔ MAINTENANCE MODE\nMaaf, hanya Admin & Staf Khusus yang bisa masuk.");
        }

        // Cek User di Database (Custom/Registrasi)
        const snapCustom = await database.ref('users_custom/' + uInput).once('value');
        const customData = snapCustom.val();
        
        const isDefault = defaultUsers.find(u => u.user === uInput && u.pass === pInput);
        const isCustom = customData && customData.pass === pInput;

        if (isDefault || isCustom) {
            const snapBan = await database.ref('status_user/' + uInput).once('value');
            if (snapBan.val() === "banned") return alert("AKSES DIBLOKIR!");

            // Login Berhasil: Simpan ke localStorage
            localStorage.setItem('savedUser', uInput);
            
            database.ref('log_online/' + uInput).set({
                username: uInput, 
                last_seen: firebase.database.ServerValue.TIMESTAMP
            });

            if (uInput === "admin") { 
                if(typeof tampilkanLogAdmin === 'function') tampilkanLogAdmin(); 
            } else { 
                window.location.href = "page91.html"; 
            }
        } else {
            alert('Username atau Password Salah!');
        }
    });
}

// ==========================================
// 4. ADMIN CONTROL FUNCTIONS
// ==========================================
window.setMaintenance = function(status) {
    database.ref('maintenance/isLive').set(status).then(() => {
        alert("Maintenance Berhasil Diubah!");
    });
};

function tampilkanLogAdmin() {
    const p = document.getElementById('adminPanel');
    if (p) p.style.display = 'block';
}

// Cleanup Log Online Otomatis
setInterval(() => {
    const skrg = Date.now();
    database.ref('log_online').once('value', s => {
        s.forEach(c => { if (skrg - (c.val().last_seen || 0) > 20000) c.ref.remove(); });
    });
}, 10000);
