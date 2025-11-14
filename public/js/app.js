// public/js/app.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend cargado y listo 🚀');

    // --- ESTADO GLOBAL ---
    let selectedRole = null;     // 'ARRENDATARIO' o 'PROPIETARIO'
    let currentUserId = null;    // id devuelto por /usuarios

    // --- REFERENCIAS A ELEMENTOS ---
    const loginModal = document.getElementById('login-modal');
    const registerSelectionModal = document.getElementById('register-modal');
    const registerFormModal = document.getElementById('register-form-modal');
    const passportModal = document.getElementById('passport-modal');

    // --- UTILIDADES MODALES ---
    function openModal(modal) {
        if (modal) modal.classList.remove('hidden');
    }
    function closeModal(modal) {
        if (modal) modal.classList.add('hidden');
    }
    function closeAllModals() {
        [loginModal, registerSelectionModal, registerFormModal, passportModal]
            .forEach(m => m && closeModal(m));
    }

    // ======================================================
    // 1. GESTIÓN DE APERTURA DE MODALES
    // ======================================================

    // Login
    document.querySelectorAll('.open-login-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal(loginModal);
        });
    });
    const closeLoginBtn = document.getElementById('close-modal');
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => closeModal(loginModal));

    // Registro Selección (abrir modal de opciones)
    document.querySelectorAll('.open-register-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal(registerSelectionModal);
        });
    });
    const closeRegSelBtn = document.getElementById('close-register');
    if (closeRegSelBtn) closeRegSelBtn.addEventListener('click', () => closeModal(registerSelectionModal));

    // ======================================================
    // 2. FLUJO DE NAVEGACIÓN ENTRE MODALES
    // ======================================================

    // Selección de rol en el modal de registro (Arrendar / Publicar)
    const optionCards = document.querySelectorAll('#register-modal .option-card');
    optionCards.forEach(card => {
        const btn = card.querySelector('.btn-blue-select');
        const titleEl = card.querySelector('h3');
        if (!btn || !titleEl) return;

        const titleText = (titleEl.textContent || '').toUpperCase();

        // Deducción del rol según el texto de la tarjeta
        let role = 'ARRENDATARIO';
        if (titleText.includes('PUBLICAR')) {
            role = 'PROPIETARIO';
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            selectedRole = role;
            console.log('Rol seleccionado:', selectedRole);
            closeModal(registerSelectionModal);
            openModal(registerFormModal);
        });
    });

    // De Formulario (Atrás) a Selección
    const backToSelectionBtn = document.getElementById('back-to-selection');
    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', () => {
            closeModal(registerFormModal);
            openModal(registerSelectionModal);
        });
    }
    const closeRegFormBtn = document.getElementById('close-register-form');
    if (closeRegFormBtn) closeRegFormBtn.addEventListener('click', () => closeModal(registerFormModal));

    // Link "Inicia sesión aquí" (en el modal de registro)
    const openLoginLink = document.querySelector('.open-login-link');
    if (openLoginLink) {
        openLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal(loginModal);
        });
    }

    // ======================================================
    // 3. SUBMITS: LOGIN Y REGISTRO (GUARDAR EN BD)
    // ======================================================

    // LOGIN → por ahora solo redirige (login real se hará después)
    const loginForm = document.querySelector('#login-modal form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Aquí en el futuro se llamará a /login
            window.location.href = '/dashboard';
        });
    }

    // REGISTRO → llamar a /usuarios y /passport/init
    const registerForm = document.querySelector('#register-form-modal form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                // TOMAR DATOS DEL FORMULARIO
                const nombreInput = registerForm.querySelector('input[placeholder="Juan Pérez"]');
                const correoInput = registerForm.querySelector('input[placeholder="tucorreo@ejemplo.com"]');
                const telInput = registerForm.querySelector('input[placeholder="+57 300 123 4567"]');
                const termsCheckbox = registerForm.querySelector('#terms');

                const passwordInput = document.getElementById('register-password');
                const passwordConfirmInput = document.getElementById('register-password-confirm');

                const nombreCompleto = nombreInput?.value.trim() || '';
                const correo = correoInput?.value.trim() || '';
                const telefono = telInput?.value.trim() || '';
                const aceptaTerminos = !!(termsCheckbox && termsCheckbox.checked);
                const password = passwordInput?.value || '';
                const passwordConfirm = passwordConfirmInput?.value || '';

                const rol = selectedRole || 'ARRENDATARIO';

                if (!nombreCompleto || !correo) {
                    alert('Por favor completa al menos nombre y correo.');
                    return;
                }

                if (!aceptaTerminos) {
                    alert('Debes aceptar los términos y condiciones.');
                    return;
                }

                if (!password || password.length < 8) {
                    alert('La contraseña debe tener mínimo 8 caracteres.');
                    return;
                }

                if (password !== passwordConfirm) {
                    alert('Las contraseñas no coinciden.');
                    return;
                }

                console.log('Enviando registro a /usuarios ...');

                const res = await fetch('/usuarios', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombreCompleto,
                        correo,
                        telefono,
                        rol,
                        aceptaTerminos,
                        password  // 👈 AQUÍ VA LA CONTRASEÑA
                    })
                });

                if (!res.ok) {
                    console.error('Error en /usuarios', res.status);
                    alert('No se pudo registrar el usuario. Inténtalo más tarde.');
                    return;
                }

                const user = await res.json();
                console.log('Usuario creado:', user);
                currentUserId = user.id;

                // Si es arrendatario, inicializar pasaporte
                if (rol === 'ARRENDATARIO' && currentUserId) {
                    console.log('Inicializando pasaporte para usuario:', currentUserId);
                    await fetch('/passport/init', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ usuarioId: currentUserId })
                    });
                }

                closeModal(registerFormModal);
                openModal(passportModal);

            } catch (err) {
                console.error('Error en submit de registro:', err);
                alert('Error inesperado al registrar. Revisa la consola.');
            }
        });
    }

    // ======================================================
    // 4. LÓGICA DE UPLOAD Y BARRA DE PROGRESO + GUARDAR EN BD
    // ======================================================

    const progressBar = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    const btnFinishPassport = document.getElementById('btn-finish-passport');
    const fileInputs = document.querySelectorAll('#passport-modal .file-input'); // inputs de archivo

    const totalDocs = fileInputs.length; // 4

    // Recalcular el progreso visual en el modal
    function updateProgressVisual() {
        let uploadedCount = 0;
        fileInputs.forEach(input => {
            if (input.files.length > 0) {
                uploadedCount++;
            }
        });

        const percentage = Math.round((uploadedCount / totalDocs) * 100);

        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `${percentage}%`;

        if (percentage > 0 && btnFinishPassport) {
            btnFinishPassport.classList.remove('btn-gray-disabled');
            btnFinishPassport.classList.add('btn-finish-active');
            btnFinishPassport.textContent = percentage === 100 ? "Finalizar" : "Continuar";
        }
    }

    // Determinar tipoDocumento según el id del input
    function getTipoDocumentoFromInputId(inputId) {
        if (inputId === 'file-id') return 'IDENTIDAD';
        if (inputId === 'file-solvency') return 'SOLVENCIA';
        if (inputId === 'file-income') return 'INGRESOS';
        if (inputId === 'file-others') return 'OTROS';
        return 'OTROS';
    }

    // Listener de cambio en cada input de archivo
    fileInputs.forEach(input => {
        input.addEventListener('change', async () => {
            const item = input.closest('.doc-item');
            if (!item) return;

            const btn = item.querySelector('.btn-upload');
            const icon = item.querySelector('.doc-icon');

            if (input.files.length > 0) {
                const file = input.files[0];

                // UI local
                icon.innerHTML = '<i class="fa-solid fa-check"></i>';
                icon.classList.add('success');
                btn.textContent = "Cambiado";
                btn.classList.add('uploaded');

                updateProgressVisual();

                // GUARDAR METADATOS EN LA BD
                if (!currentUserId) {
                    console.warn('No hay usuario actual, no se puede registrar documento en BD.');
                    return;
                }

                const tipoDocumento = getTipoDocumentoFromInputId(input.id);
                const nombreArchivo = file.name;
                const rutaArchivo = `/uploads/${file.name}`; // por ahora simbólica
                const mimeType = file.type;
                const tamanoBytes = file.size;

                try {
                    console.log(`Registrando documento ${tipoDocumento} en /passport/document ...`);
                    const res = await fetch('/passport/document', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            usuarioId: currentUserId,
                            tipoDocumento,
                            nombreArchivo,
                            rutaArchivo,
                            mimeType,
                            tamanoBytes
                        })
                    });

                    if (!res.ok) {
                        console.error('Error al registrar documento', res.status);
                        // opcional: revertir icono o mostrar alerta
                    } else {
                        const data = await res.json();
                        console.log('Documento registrado y pasaporte actualizado:', data);
                    }
                } catch (err) {
                    console.error('Error en fetch /passport/document:', err);
                }

            } else {
                // Si el usuario abrió y canceló, opcionalmente restauramos estado visual
                icon.classList.remove('success');
                btn.textContent = "Subir";
                btn.classList.remove('uploaded');
                updateProgressVisual();
            }
        });
    });

    // Acción Final: Continuar / Finalizar → ir al Dashboard
    if (btnFinishPassport) {
        btnFinishPassport.addEventListener('click', () => {
            if (btnFinishPassport.classList.contains('btn-finish-active')) {
                console.log("Pasaporte completado o en progreso. Redirigiendo al Dashboard...");
            } else {
                console.log("Sin documentos, pero redirigiendo al Dashboard...");
            }
            window.location.href = '/dashboard';
        });
    }

    // ======================================================
    // 5. CIERRE GLOBAL DE MODALES AL CLIC FUERA
    // ======================================================
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModal(loginModal);
        if (e.target === registerSelectionModal) closeModal(registerSelectionModal);
        if (e.target === registerFormModal) closeModal(registerFormModal);
        if (e.target === passportModal) closeModal(passportModal);
    });
});
