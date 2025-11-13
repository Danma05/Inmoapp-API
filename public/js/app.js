// public/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend cargado y listo 🚀');

    // --- 1. LÓGICA DE LA VENTANA MODAL (Abrir y Cerrar) ---
    const loginBtn = document.getElementById('btn-login');
    const modal = document.getElementById('login-modal');
    const closeBtn = document.getElementById('close-modal');

    // Verificación de seguridad
    if (loginBtn && modal && closeBtn) {
        
        // Abrir modal
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            modal.classList.remove('hidden');
        });

        // Cerrar modal con la X
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        // Cerrar modal clicando fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    } else {
        console.error("Error: No se encontraron los elementos del modal.");
    }

    // --- 2. LÓGICA DE INICIO DE SESIÓN (Redirección al Dashboard) ---
    const loginForm = document.querySelector('.login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Evita que el formulario intente enviar datos al servidor real por ahora
            
            console.log("Credenciales enviadas. Redirigiendo al Dashboard...");
            
            // Aquí ocurre la magia: Cambiamos la página manualmente
            window.location.href = '/dashboard';
        });
    }
});