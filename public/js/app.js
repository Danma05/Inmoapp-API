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
        [loginModal, registerSelectionModal, registerFormModal, passportModal].forEach(m => {
            if(m) closeModal(m);
        });
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
    
    const progressBar = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    const btnFinishPassport = document.getElementById('btn-finish-passport');
    const fileInputs = document.querySelectorAll('#passport-modal .file-input');

    let uploadedCount = 0;
    const totalDocs = fileInputs.length; // 4

    function updateProgress() {
        uploadedCount = 0;
        fileInputs.forEach(input => {
            if (input.files.length > 0) uploadedCount++;
        });
        const percentage = Math.round((uploadedCount / totalDocs) * 100);
        if(progressBar) progressBar.style.width = `${percentage}%`;
        if(progressText) progressText.textContent = `${percentage}%`;

        if (percentage > 0 && btnFinishPassport) {
            btnFinishPassport.classList.remove('btn-gray-disabled');
            btnFinishPassport.classList.add('btn-finish-active');
            btnFinishPassport.textContent = percentage === 100 ? "Finalizar" : "Continuar";
        }
    }

    fileInputs.forEach(input => {
        input.addEventListener('change', () => {
            const item = input.closest('.doc-item');
            if (!item) return;
            const btn = item.querySelector('.btn-upload');
            const icon = item.querySelector('.doc-icon');

            if (input.files.length > 0) {
                icon.innerHTML = '<i class="fa-solid fa-check"></i>';
                icon.classList.add('success');
                btn.textContent = "Cambiado";
                btn.classList.add('uploaded');
            } else {
                icon.innerHTML = '<i class="fa-regular fa-address-card"></i>';
                icon.classList.remove('success');
                btn.textContent = "Subir";
                btn.classList.remove('uploaded');
            }
            updateProgress();
        });
    });

    if (btnFinishPassport) {
        btnFinishPassport.addEventListener('click', () => {
            if (btnFinishPassport.classList.contains('btn-finish-active')) {
                window.location.href = '/dashboard';
            } else {
                window.location.href = '/dashboard';
            }
        });
    }

    // Cierre Global Modales
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
                const checkedBoxes = document.querySelectorAll('.select-check:checked');
                const count = checkedBoxes.length;
                if (count > 4) {
                    alert('Solo puedes comparar hasta 4 propiedades.');
                    chk.checked = false;
                    return;
                }
                if (selectedCountSpan) selectedCountSpan.textContent = count;
                if (count >= 2) {
                    compareBar.classList.add('active');
                } else {
                    compareBar.classList.remove('active');
                }
            });
        });

        if(btnCompareAction) {
            btnCompareAction.addEventListener('click', () => {
                const compareModal = document.getElementById('compare-modal');
                if (compareModal) compareModal.classList.remove('hidden');
            });
        }

        const closeCompareBtn = document.getElementById('close-compare');
        const compareModal = document.getElementById('compare-modal');
        if (closeCompareBtn && compareModal) {
            closeCompareBtn.addEventListener('click', () => {
                compareModal.classList.add('hidden');
            });
            window.addEventListener('click', (e) => {
                if (e.target === compareModal) compareModal.classList.add('hidden');
            });
        }
    }

    // ======================================================
    // 7. SISTEMA DE MENSAJERÍA (SIMULACIÓN BASE DE DATOS)
    // ======================================================
    
    // 1. Definimos una "Base de Datos" falsa de mensajes
    const MOCK_DB_MESSAGES = {
        "CM": [ // Carlos Mendoza
            { type: 'received', text: 'Hola, ¿sigue disponible el apartamento?', time: '10:30 AM' },
            { type: 'sent', text: 'Hola Carlos, sí, todavía está disponible.', time: '10:35 AM' },
            { type: 'received', text: '¡Genial! ¿Podríamos agendar una visita?', time: '10:36 AM' },
            { type: 'sent', text: 'Claro, ¿te parece bien mañana a las 10:00 AM?', time: '10:40 AM' },
            { type: 'received', text: 'Perfecto, nos vemos mañana a las 10:00 AM', time: '10:42 AM' }
        ],
        "MG": [ // María González
            { type: 'received', text: 'Buenas tardes, vi su anuncio en Ñuñoa.', time: 'Ayer' },
            { type: 'sent', text: 'Hola María, gusto en saludarte.', time: 'Ayer' },
            { type: 'received', text: 'Gracias por tu interés. Te enviaré más fotos en un momento.', time: 'Ayer' }
        ],
        "RS": [ // Roberto Silva
            { type: 'received', text: '¿El precio del Penthouse es conversable?', time: '2 días' },
            { type: 'sent', text: 'Hola Roberto, depende del tiempo de contrato.', time: '2 días' },
            { type: 'received', text: 'El precio es negociable para arriendo largo plazo', time: '2 días' }
        ],
        "JT": [ // Juan Torres
            { type: 'received', text: 'Hola, necesito oficina para 5 personas.', time: '5 días' },
            { type: 'sent', text: 'Tenemos varias opciones en el centro.', time: '5 días' },
            { type: 'received', text: '¿Sigue disponible para visitar el lunes?', time: '5 días' }
        ]
    };

    const emptyState = document.getElementById('empty-state');
    const chatInterface = document.getElementById('chat-interface');
    const chatBody = document.getElementById('chat-body-scroll');

    // Función global para cargar chat
    window.loadChat = function(element) {
        // 1. UI: Activar item seleccionado
        document.querySelectorAll('.msg-item').forEach(item => item.classList.remove('active'));
        element.classList.add('active');
        element.classList.remove('unread');

        // 2. DATA: Obtener info del usuario
        const name = element.getAttribute('data-name');
        const prop = element.getAttribute('data-prop');
        const initials = element.getAttribute('data-initials'); // Usamos esto como ID (CM, MG...)

        // 3. Header: Actualizar info
        const headerName = document.getElementById('chat-header-name');
        const headerProp = document.getElementById('chat-header-prop');
        const headerAvatar = document.getElementById('chat-header-avatar');

        if(headerName) headerName.textContent = name;
        if(headerProp) headerProp.textContent = prop;
        if(headerAvatar) headerAvatar.textContent = initials;

        // 4. Body: Cargar mensajes de la "Base de Datos"
        if (chatBody) {
            // Limpiamos el chat anterior
            chatBody.innerHTML = '';

            // Buscamos los mensajes de este usuario
            const messages = MOCK_DB_MESSAGES[initials] || [];

            // Los pintamos en pantalla
            messages.forEach(msg => {
                const bubbleHTML = `
                    <div class="message-bubble ${msg.type}">
                        ${msg.text}
                        <span class="msg-time-stamp">${msg.time}</span>
                    </div>
                `;
                chatBody.insertAdjacentHTML('beforeend', bubbleHTML);
            });

            // Scroll al final
            setTimeout(() => {
                chatBody.scrollTop = chatBody.scrollHeight;
            }, 50);
        }

        // 5. Mostrar interfaz
        if(emptyState) emptyState.classList.add('hidden');
        if(chatInterface) chatInterface.classList.remove('hidden');
    };

    // Lógica de envío de mensaje (Input)
    const btnSend = document.getElementById('btn-send-message');
    const inputMsg = document.getElementById('message-input');

    if (btnSend && inputMsg && chatBody) {
        const sendMessage = () => {
            const text = inputMsg.value.trim();
            if (text === "") return;

            const now = new Date();
            const timeString = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

            // Inyectar burbuja visualmente
            const bubbleHTML = `
                <div class="message-bubble sent">
                    ${text}
                    <span class="msg-time-stamp">${timeString}</span>
                </div>
            `;

            chatBody.insertAdjacentHTML('beforeend', bubbleHTML);
            inputMsg.value = "";
            chatBody.scrollTop = chatBody.scrollHeight;

            // NOTA PARA IMPLEMENTACIÓN REAL:
            // Aquí harías: fetch('/api/mensajes/enviar', { method: 'POST', body: ... })
        };

        btnSend.addEventListener('click', sendMessage);
        inputMsg.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // ======================================================
    // 8. LÓGICA DE MI CUENTA (TABS)
    // ======================================================
    
    const accountTabs = document.querySelectorAll('.account-nav-item');
    const accountPanels = document.querySelectorAll('.account-panel');

    if(accountTabs.length > 0) {
        accountTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Si es "Cerrar sesión", no hacemos tab switch (aquí iría logout real)
                if(tab.textContent.includes('Cerrar Sesión')) {
                    window.location.href = '/'; // Volver al inicio
                    return;
                }

                // 1. Quitar activo de todos
                accountTabs.forEach(t => t.classList.remove('active'));
                accountPanels.forEach(p => p.classList.remove('active'));

                // 2. Activar el clickeado
                tab.classList.add('active');
                const targetId = tab.getAttribute('data-target');
                const targetPanel = document.getElementById(targetId);
                if(targetPanel) targetPanel.classList.add('active');
            });
        });
    }

    // Hacer que el icono de PERFIL en el header lleve a esta página
    const profileBtns = document.querySelectorAll('.icon-action.profile');
    profileBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = '/cuenta';
        });
    });
    
    // Hacer que el icono de NOTIFICACIONES lleve a esta página (Tab Notificaciones)
    const notifBtns = document.querySelectorAll('.icon-action.notification');
    notifBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = '/cuenta'; // Por defecto abre en notificaciones
        });
        
    });
    }
});

// ======================================================
    // 9. LÓGICA DE CONTRATOS (MODAL)
    // ======================================================

    // Base de datos simulada de contratos
    const MOCK_CONTRACTS = {
        "CNT-2025-001": {
            id: "CNT-2025-001",
            prop: "Av. Providencia 1234, Santiago",
            status: "Vigente",
            statusClass: "approved",
            price: "$850.000",
            start: "01 Marzo 2025",
            end: "28 Febrero 2026",
            landlord: "Patricia Rojas",
            landlordInitials: "PR"
        },
        "CNT-2024-890": {
            id: "CNT-2024-890",
            prop: "Calle Los Leones 45, Providencia",
            status: "Finalizado",
            statusClass: "rejected", // Usamos estilo rejected para gris/rojo
            price: "$780.000",
            start: "01 Marzo 2024",
            end: "28 Febrero 2025",
            landlord: "Roberto Fernández",
            landlordInitials: "RF"
        }
    };

    const contractModal = document.getElementById('contract-modal');
    const closeContractBtns = [
        document.getElementById('close-contract-modal'),
        document.getElementById('btn-close-c-modal')
    ];

    // Función para abrir modal de contrato
    window.openContractModal = function(contractId) {
        const data = MOCK_CONTRACTS[contractId];
        if(!data) return;

        // Llenar datos en el modal
        document.getElementById('modal-c-title').textContent = `Contrato #${data.id}`;
        document.getElementById('modal-c-prop').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.prop}`;
        
        const statusBadge = document.getElementById('modal-c-status');
        statusBadge.textContent = data.status;
        statusBadge.className = `status-badge ${data.statusClass}`;

        document.getElementById('modal-c-price').textContent = data.price;
        document.getElementById('modal-c-start').textContent = data.start;
        document.getElementById('modal-c-end').textContent = data.end;
        
        document.getElementById('modal-c-landlord').textContent = data.landlord;
        
        // Avatar del dueño
        const avatar = document.querySelector('.party-box .p-avatar:not(.me)');
        if(avatar) {
            avatar.textContent = data.landlordInitials;
        }

        // Mostrar
        if(contractModal) contractModal.classList.remove('hidden');
    };

    // Event Listeners para botones "Ver contrato"
    const viewContractBtns = document.querySelectorAll('.btn-view-contract');
    viewContractBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            openContractModal(id);
        });
    });

    // Cerrar Modal
    closeContractBtns.forEach(btn => {
        if(btn) {
            btn.addEventListener('click', () => {
                if(contractModal) contractModal.classList.add('hidden');
            });
        }
    });