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

    // ======================================================
    // 6. LÓGICA DE FAVORITOS Y COMPARACIÓN
    // ======================================================
    
    const checkboxes = document.querySelectorAll('.select-check');
    const compareBar = document.getElementById('compare-bar');
    const selectedCountSpan = document.getElementById('selected-count');
    const btnCompareAction = document.getElementById('btn-compare-action');

    if (checkboxes.length > 0 && compareBar) {
        checkboxes.forEach(chk => {
            chk.addEventListener('change', () => {
                // 1. Contar cuántos hay seleccionados
                const checkedBoxes = document.querySelectorAll('.select-check:checked');
                const count = checkedBoxes.length;

                // 2. Validar máximo 4
                if (count > 4) {
                    alert('Solo puedes comparar hasta 4 propiedades.');
                    chk.checked = false; // Desmarcar el último
                    return;
                }

                // 3. Actualizar texto
                if (selectedCountSpan) selectedCountSpan.textContent = count;

                // 4. Mostrar/Ocultar barra
                if (count >= 2) {
                    compareBar.classList.add('active');
                } else {
                    compareBar.classList.remove('active');
                }
            });
        });

       // ... (dentro de la lógica de favoritos que agregamos antes)

        if(btnCompareAction) {
            btnCompareAction.addEventListener('click', () => {
                // 1. Referencia al nuevo modal
                const compareModal = document.getElementById('compare-modal');
                
                // 2. Abrirlo
                if (compareModal) {
                    compareModal.classList.remove('hidden');
                }
            });
        }

        // 3. Lógica para cerrar el modal de comparación
        const closeCompareBtn = document.getElementById('close-compare');
        const compareModal = document.getElementById('compare-modal');

        if (closeCompareBtn && compareModal) {
            // Cerrar con la X
            closeCompareBtn.addEventListener('click', () => {
                compareModal.classList.add('hidden');
            });

            // Cerrar haciendo clic fuera (overlay)
            window.addEventListener('click', (e) => {
                if (e.target === compareModal) {
                    compareModal.classList.add('hidden');
                }
            });
        }
    
        // ======================================================
    // 7. SISTEMA DE MENSAJERÍA (UI)
    // ======================================================
    
    // Referencias globales para que las funciones las vean
    const emptyState = document.getElementById('empty-state');
    const chatInterface = document.getElementById('chat-interface');
    
    // Función global para cargar chat (llamada desde el HTML onclick)
    window.loadChat = function(element) {
        // 1. Gestión de clases visuales (activo/inactivo)
        document.querySelectorAll('.msg-item').forEach(item => item.classList.remove('active'));
        element.classList.add('active');
        element.classList.remove('unread'); // Marcar como leído

        // 2. Obtener datos del elemento clicado
        const name = element.getAttribute('data-name');
        const prop = element.getAttribute('data-prop');
        const initials = element.getAttribute('data-initials');

        // 3. Actualizar la cabecera del chat
        document.getElementById('chat-header-name').textContent = name;
        document.getElementById('chat-header-prop').textContent = prop;
        document.getElementById('chat-header-avatar').textContent = initials;

        // 4. Cambiar vistas
        if(emptyState) emptyState.classList.add('hidden');
        if(chatInterface) chatInterface.classList.remove('hidden');

        // 5. Scroll al final
        const chatBody = document.getElementById('chat-body-scroll');
        chatBody.scrollTop = chatBody.scrollHeight;
    };

    // Lógica de envío de mensaje
    const btnSend = document.getElementById('btn-send-message');
    const inputMsg = document.getElementById('message-input');
    const chatBody = document.getElementById('chat-body-scroll');

    if (btnSend && inputMsg && chatBody) {
        
        // Función interna para agregar burbuja
        const sendMessage = () => {
            const text = inputMsg.value.trim();
            if (text === "") return;

            // Crear HTML de la burbuja
            const now = new Date();
            const timeString = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

            const bubbleHTML = `
                <div class="message-bubble sent">
                    ${text}
                    <span class="msg-time-stamp">${timeString}</span>
                </div>
            `;

            // Insertar y limpiar
            chatBody.insertAdjacentHTML('beforeend', bubbleHTML);
            inputMsg.value = "";
            
            // Scroll automático al fondo
            chatBody.scrollTop = chatBody.scrollHeight;
        };

        // Evento Click Botón
        btnSend.addEventListener('click', sendMessage);

        // Evento Enter en Input
        inputMsg.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    }
});