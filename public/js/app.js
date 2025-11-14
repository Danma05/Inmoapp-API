// public/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend cargado y listo 🚀');

    // --- REFERENCIAS A ELEMENTOS ---
    const loginModal = document.getElementById('login-modal');
    const registerSelectionModal = document.getElementById('register-modal');
    const registerFormModal = document.getElementById('register-form-modal');
    const passportModal = document.getElementById('passport-modal');

    // --- UTILIDADES MODALES ---
    function openModal(modal) {
        if(modal) modal.classList.remove('hidden');
    }
    function closeModal(modal) {
        if(modal) modal.classList.add('hidden');
    }
    function closeAllModals() {
        [loginModal, registerSelectionModal, registerFormModal, passportModal].forEach(m => closeModal(m));
    }

    // --- 1. GESTIÓN DE APERTURA DE MODALES ---
    
    // Login
    document.querySelectorAll('.open-login-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal(loginModal);
        });
    });
    const closeLoginBtn = document.getElementById('close-modal');
    if(closeLoginBtn) closeLoginBtn.addEventListener('click', () => closeModal(loginModal));

    // Registro Selección
    document.querySelectorAll('.open-register-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal(registerSelectionModal);
        });
    });
    const closeRegSelBtn = document.getElementById('close-register');
    if(closeRegSelBtn) closeRegSelBtn.addEventListener('click', () => closeModal(registerSelectionModal));


    // --- 2. FLUJO DE NAVEGACIÓN ---

    // De Selección a Formulario (Opción Arrendar)
    const selectRentBtn = document.querySelector('#register-modal .btn-blue-select'); 
    if (selectRentBtn) {
        selectRentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(registerSelectionModal);
            openModal(registerFormModal);
        });
    }

    // De Formulario (Atrás) a Selección
    const backToSelectionBtn = document.getElementById('back-to-selection');
    if(backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', () => {
            closeModal(registerFormModal);
            openModal(registerSelectionModal);
        });
    }
    const closeRegFormBtn = document.getElementById('close-register-form');
    if(closeRegFormBtn) closeRegFormBtn.addEventListener('click', () => closeModal(registerFormModal));

    // Link "Inicia sesión aquí"
    const openLoginLink = document.querySelector('.open-login-link');
    if(openLoginLink) {
        openLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal(loginModal);
        });
    }

    // --- 3. SUBMITS Y REDIRECCIONES ---

    // Submit LOGIN -> Ir al Dashboard
    const loginForm = document.querySelector('#login-modal form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.location.href = '/dashboard';
        });
    }

    // Submit REGISTRO -> Ir a PASAPORTE
    const registerForm = document.querySelector('#register-form-modal form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            closeModal(registerFormModal);
            openModal(passportModal);
        });
    }

    // --- 4. LÓGICA DE UPLOAD Y BARRA DE PROGRESO ---
    
    const docItems = document.querySelectorAll('#passport-modal .doc-item');
    const progressBar = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    const btnFinishPassport = document.getElementById('btn-finish-passport');
    const fileInputs = document.querySelectorAll('#passport-modal .file-input'); // Seleccionamos todos los inputs

    let uploadedCount = 0;
    const totalDocs = fileInputs.length; // 4

    // Función para recalcular el progreso
    function updateProgress() {
        // Contamos cuántos inputs tienen al menos 1 archivo
        uploadedCount = 0;
        fileInputs.forEach(input => {
            if (input.files.length > 0) {
                uploadedCount++;
            }
        });

        const percentage = Math.round((uploadedCount / totalDocs) * 100);
        
        // Actualizar Barra y Texto
        if(progressBar) progressBar.style.width = `${percentage}%`;
        if(progressText) progressText.textContent = `${percentage}%`;

        // Activar botón "Continuar" si se ha subido al menos 1 documento
        if (percentage > 0 && btnFinishPassport) {
            btnFinishPassport.classList.remove('btn-gray-disabled');
            btnFinishPassport.classList.add('btn-finish-active');
            btnFinishPassport.textContent = percentage === 100 ? "Finalizar" : "Continuar";
        }
    }

    // Asignar el listener a CADA input de archivo
    fileInputs.forEach(input => {
        input.addEventListener('change', () => {
            const item = input.closest('.doc-item');
            if (!item) return;
            
            const btn = item.querySelector('.btn-upload');
            const icon = item.querySelector('.doc-icon');

            if (input.files.length > 0) {
                // Archivo seleccionado
                icon.innerHTML = '<i class="fa-solid fa-check"></i>';
                icon.classList.add('success');
                btn.textContent = "Cambiado";
                btn.classList.add('uploaded');
            } else {
                // Esto es si el usuario abre y cancela (opcional)
                icon.innerHTML = '<i class="fa-regular fa-address-card"></i>'; // O el icono original
                icon.classList.remove('success');
                btn.textContent = "Subir";
                btn.classList.remove('uploaded');
            }
            
            // Recalcular el progreso CADA VEZ que un input cambie
            updateProgress();
        });
    });

    // Acción Final: Continuar -> Ir al Dashboard
    if (btnFinishPassport) {
        btnFinishPassport.addEventListener('click', () => {
            // Solo redirige si el botón está activo (ha subido al menos 1)
            if (btnFinishPassport.classList.contains('btn-finish-active')) {
                console.log("Pasaporte completado. Redirigiendo al Dashboard...");
                window.location.href = '/dashboard';
            } else {
                // Opcional: puedes hacer que siempre redirija, incluso si no subió nada
                console.log("Saltando pasaporte. Redirigiendo al Dashboard...");
                window.location.href = '/dashboard';
            }
        });
    }

    // Cierre Global
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModal(loginModal);
        if (e.target === registerSelectionModal) closeModal(registerSelectionModal);
        if (e.target === registerFormModal) closeModal(registerFormModal);
        if (e.target === passportModal) closeModal(passportModal);
    });
});