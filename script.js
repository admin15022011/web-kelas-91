// 1. Fungsi Hujan (Tetap sama seperti awal)
function createRain() {
    const container = document.querySelector('.background-container');
    if (!container) return; // Keamanan agar tidak error jika elemen hilang

    const dropCount = 100;
    for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement('div');
        drop.classList.add('drop');
        drop.style.left = Math.random() * 100 + 'vw';
        drop.style.animationDuration = Math.random() * 2 + 1 + 's';
        drop.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(drop);
    }
}

// 2. Jalankan hujan segera setelah halaman dimuat
window.onload = createRain;

// 3. Logika Login dengan Validasi IF
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    // Pastikan ID 'username' dan 'password' ada di HTML kamu
    if (user === "9¹" && pass === "91") {
        alert('Login Berhasil! Selamat datang.');
        alert('PERINGATAN! JANGAN SEBAR USER DAN PASS !.');
        window.location.href = "page91.html"; 
    } else {
        alert('Username atau Password salah!');
    }
});
