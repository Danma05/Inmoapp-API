// public/js/app.js
import { obtenerUsuarios } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Frontend cargado 🚀');

    // Lógica del Modal de Login
    const loginBtn = document.getElementById('btn-login');
    const modal = document.getElementById('login-modal');
    const closeBtn = document.getElementById('close-modal');

    // 1. Abrir modal
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que el enlace recargue la página
        modal.classList.remove('hidden');
    });

    // 2. Cerrar modal con la X
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    // 3. Cerrar modal si haces clic fuera de la cajita blanca
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // ... resto de tu código anterior ...
});