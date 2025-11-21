document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend cargado y listo 🚀');

    // ======================================================
    // 1. REFERENCIAS GLOBALES Y UTILIDADES
    // ======================================================
    const loginModal = document.getElementById('login-modal');
    const registerSelectionModal = document.getElementById('register-modal');
    const registerFormModal = document.getElementById('register-form-modal');
    const passportModal = document.getElementById('passport-modal');
    const publisherModal = document.getElementById('publisher-modal');
    
    // Variable para saber si es Arrendatario o Propietario
    let selectedRole = 'renter'; 

    function openModal(modal) { if(modal) modal.classList.remove('hidden'); }
    function closeModal(modal) { if(modal) modal.classList.add('hidden'); }
    
    function closeAllModals() {
        const modals = [loginModal, registerSelectionModal, registerFormModal, passportModal, publisherModal];
        modals.forEach(m => { if(m) closeModal(m); });
        
        // También cerrar modales opcionales si existen
        const contractModal = document.getElementById('contract-modal');
        const compareModal = document.getElementById('compare-modal');
        if(contractModal) closeModal(contractModal);
        if(compareModal) closeModal(compareModal);
    }

    // ======================================================
    // 2. GESTIÓN DE APERTURA (LOGIN / REGISTRO)
    // ======================================================
    
    // Botones "Iniciar Sesión"
    document.querySelectorAll('.open-login-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
            openModal(loginModal);
        });
    });
    const closeLoginBtn = document.getElementById('close-modal');
    if (closeLoginBtn) closeLoginBtn.addEventListener('click', () => closeModal(loginModal));

    // Botones "Registrarse"
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

    // Opción B: "Quiero Publicar"
    const selectPublishBtn = document.querySelector('.btn-publish-select'); 
    if (selectPublishBtn) {
        selectPublishBtn.addEventListener('click', (e) => {
            e.preventDefault();
            selectedRole = 'PROPIETARIO'; // ✅ este es el valor correcto
            closeModal(registerSelectionModal);
            openModal(registerFormModal);
        });
    }

    // Botón Atrás en el formulario
    const backToSelectionBtn = document.getElementById('back-to-selection');
    if (backToSelectionBtn) {
        backToSelectionBtn.addEventListener('click', () => {
            closeModal(registerFormModal);
            openModal(registerSelectionModal);
        });
    }
    const closeRegFormBtn = document.getElementById('close-register-form');
    if (closeRegFormBtn) closeRegFormBtn.addEventListener('click', () => closeModal(registerFormModal));

    // ======================================================
    // 4. ENVÍO DE FORMULARIOS (SUBMITS)
    // ======================================================

    // =======================================
    // LOGIN REAL CONTRA LA BASE DE DATOS (+ GUARDAR SESIÓN)
    // =======================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        const loginError = document.getElementById('login-error');

        function showLoginError(msg) {
            if (!loginError) return alert(msg);
            loginError.textContent = msg;
            loginError.style.display = 'block';
        }
        function clearLoginError() {
            if (!loginError) return;
            loginError.textContent = '';
            loginError.style.display = 'none';
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearLoginError();

            const correo = emailInput.value.trim();
            const password = passInput.value;

            if (!correo || !password) {
                return showLoginError("Debes ingresar correo y contraseña.");
            }

            try {
                const resp = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo, password })
                });

                const data = await resp.json();

                if (!resp.ok || !data.ok) {
                    return showLoginError(data.error || "Correo o contraseña incorrectos.");
                }

                // 🔥 GUARDAR USUARIO EN SESIÓN
                localStorage.setItem('inmoapp_user', JSON.stringify(data.usuario));

                const rol = (data.usuario?.rol || '').toUpperCase();
                if (rol === 'PROPIETARIO') {
                    window.location.href = '/dashboard-propietario';
                } else {
                    window.location.href = '/dashboard';
                }

            } catch (err) {
                console.error("❌ Error en login:", err);
                showLoginError("No se pudo conectar con el servidor.");
            }
        });
    }


    // ======================================================
    // 5. LÓGICA DE CARGA DE ARCHIVOS (UPLOAD)
    // ======================================================
    
    // Función reutilizable para ambos modales
    function setupUploadLogic(inputSelector, barId, textId, btnId) {
        const inputs = document.querySelectorAll(inputSelector);
        const bar = document.getElementById(barId);
        const text = document.getElementById(textId);
        const btn = document.getElementById(btnId);

        if(inputs.length === 0) return;

        function update() {
            let count = 0;
            inputs.forEach(inp => { if(inp.files.length > 0) count++; });
            
            const pct = Math.round((count / inputs.length) * 100);
            if(bar) bar.style.width = `${pct}%`;
            if(text) text.textContent = `${pct}%`;

            if(pct > 0 && btn) {
                btn.classList.remove('btn-gray-disabled');
                btn.classList.add('btn-finish-active');
                btn.textContent = pct === 100 ? "Finalizar" : "Continuar";
            }
        }

        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const item = input.closest('.doc-item');
                if (!item) return;
                const btnUp = item.querySelector('.btn-upload');
                const icon = item.querySelector('.doc-icon');

                if (input.files.length > 0) {
                    icon.innerHTML = '<i class="fa-solid fa-check"></i>';
                    icon.classList.add('success');
                    btnUp.textContent = "Listo";
                    btnUp.classList.add('uploaded');
                } else {
                    // Icono por defecto simple si se borra
                    icon.innerHTML = '<i class="fa-regular fa-file"></i>'; 
                    icon.classList.remove('success');
                    btnUp.textContent = "Subir";
                    btnUp.classList.remove('uploaded');
                }
                update();
            });
        });

        if(btn) {
            btn.addEventListener('click', () => {
                // Al finalizar, ir al dashboard
                window.location.href = '/dashboard';
            });
        }
    }

    // Configurar Arrendatario
    setupUploadLogic('#passport-modal .file-input', 'progress-bar-fill', 'progress-text', 'btn-finish-passport');
    
    // Configurar Propietario
    setupUploadLogic('#publisher-modal .file-input', 'pub-progress-bar-fill', 'pub-progress-text', 'btn-finish-publisher');

    const closePassportBtn = document.getElementById('close-passport');
    if(closePassportBtn) closePassportBtn.addEventListener('click', () => closeModal(passportModal));

    const closePubBtn = document.getElementById('close-publisher');
    if(closePubBtn) closePubBtn.addEventListener('click', () => closeModal(publisherModal));


    // ======================================================
    // 6. FAVORITOS Y COMPARACIÓN
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
                openModal(compareModal);
            });
        }

        const closeCompareBtn = document.getElementById('close-compare');
        const compareModal = document.getElementById('compare-modal');
        if (closeCompareBtn && compareModal) {
            closeCompareBtn.addEventListener('click', () => closeModal(compareModal));
        }
    }

    // ======================================================
    // 7. CHAT / MENSAJERÍA (MOCK)
    // ======================================================
    const MOCK_DB_MESSAGES = {
        "CM": [
            { type: 'received', text: 'Hola, ¿sigue disponible el apartamento?', time: '10:30 AM' },
            { type: 'sent', text: 'Hola Carlos, sí, todavía está disponible.', time: '10:35 AM' },
            { type: 'received', text: '¡Genial! ¿Podríamos agendar una visita?', time: '10:36 AM' },
            { type: 'sent', text: 'Claro, ¿te parece bien mañana a las 10:00 AM?', time: '10:40 AM' },
            { type: 'received', text: 'Perfecto, nos vemos mañana a las 10:00 AM', time: '10:42 AM' }
        ],
        "MG": [
            { type: 'received', text: 'Buenas tardes, vi su anuncio en Ñuñoa.', time: 'Ayer' },
            { type: 'sent', text: 'Hola María, gusto en saludarte.', time: 'Ayer' },
            { type: 'received', text: 'Gracias por tu interés. Te enviaré más fotos en un momento.', time: 'Ayer' }
        ],
        "RS": [
            { type: 'received', text: '¿El precio del Penthouse es conversable?', time: '2 días' },
            { type: 'sent', text: 'Hola Roberto, depende del tiempo de contrato.', time: '2 días' },
            { type: 'received', text: 'El precio es negociable para arriendo largo plazo', time: '2 días' }
        ],
        "JT": [
            { type: 'received', text: 'Hola, necesito oficina para 5 personas.', time: '5 días' },
            { type: 'sent', text: 'Tenemos varias opciones en el centro.', time: '5 días' },
            { type: 'received', text: '¿Sigue disponible para visitar el lunes?', time: '5 días' }
        ]
    };

    const chatBody = document.getElementById('chat-body-scroll');
    const emptyState = document.getElementById('empty-state');
    const chatInterface = document.getElementById('chat-interface');

    // Función Global para cargar chat
    window.loadChat = function(element) {
        document.querySelectorAll('.msg-item').forEach(item => item.classList.remove('active'));
        element.classList.add('active');
        element.classList.remove('unread');

        const name = element.getAttribute('data-name');
        const prop = element.getAttribute('data-prop');
        const initials = element.getAttribute('data-initials');

        const headerName = document.getElementById('chat-header-name');
        const headerProp = document.getElementById('chat-header-prop');
        const headerAvatar = document.getElementById('chat-header-avatar');

        if(headerName) headerName.textContent = name;
        if(headerProp) headerProp.textContent = prop;
        if(headerAvatar) headerAvatar.textContent = initials;

        if (chatBody) {
            chatBody.innerHTML = '';
            const messages = MOCK_DB_MESSAGES[initials] || [];
            messages.forEach(msg => {
                const bubbleHTML = `<div class="message-bubble ${msg.type}">${msg.text}<span class="msg-time-stamp">${msg.time}</span></div>`;
                chatBody.insertAdjacentHTML('beforeend', bubbleHTML);
            });
            setTimeout(() => { chatBody.scrollTop = chatBody.scrollHeight; }, 50);
        }

        if(emptyState) emptyState.classList.add('hidden');
        if(chatInterface) chatInterface.classList.remove('hidden');
    };

    // Enviar Mensaje
    const btnSend = document.getElementById('btn-send-message');
    const inputMsg = document.getElementById('message-input');

    if (btnSend && inputMsg && chatBody) {
        const sendMessage = () => {
            const text = inputMsg.value.trim();
            if (text === "") return;
            const now = new Date();
            const timeString = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
            
            const bubbleHTML = `<div class="message-bubble sent">${text}<span class="msg-time-stamp">${timeString}</span></div>`;
            chatBody.insertAdjacentHTML('beforeend', bubbleHTML);
            inputMsg.value = "";
            chatBody.scrollTop = chatBody.scrollHeight;
        };

        btnSend.addEventListener('click', sendMessage);
        inputMsg.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // ======================================================
    // 8. PESTAÑAS DE "MI CUENTA" (TABS)
    // ======================================================
    const accountTabs = document.querySelectorAll('.account-nav-item');
    const accountPanels = document.querySelectorAll('.account-panel');

    if(accountTabs.length > 0) {
        accountTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                if(tab.textContent.includes('Cerrar Sesión')) {
                    window.location.href = '/';
                    return;
                }
                // Switch Tabs
                accountTabs.forEach(t => t.classList.remove('active'));
                accountPanels.forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                const targetId = tab.getAttribute('data-target');
                const targetPanel = document.getElementById(targetId);
                if(targetPanel) targetPanel.classList.add('active');
            });
        });
    }

    // Links de Header a Cuenta
    const profileBtns = document.querySelectorAll('.icon-action.profile');
    profileBtns.forEach(btn => btn.addEventListener('click', () => window.location.href = '/cuenta'));
    
    const notifBtns = document.querySelectorAll('.icon-action.notification');
    notifBtns.forEach(btn => btn.addEventListener('click', () => window.location.href = '/cuenta'));

    // CIERRE GLOBAL (Cualquier clic fuera de modales)
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModal(loginModal);
        if (e.target === registerSelectionModal) closeModal(registerSelectionModal);
        if (e.target === registerFormModal) closeModal(registerFormModal);
        if (e.target === passportModal) closeModal(passportModal);
        if (e.target === publisherModal) closeModal(publisherModal);
        
        const contractModal = document.getElementById('contract-modal');
        if (e.target === contractModal) closeModal(contractModal);
        const compareModal = document.getElementById('compare-modal');
        if (e.target === compareModal) closeModal(compareModal);
    });

}); // <-- FIN DOMContentLoaded


// ======================================================
// 9. LÓGICA DE CONTRATOS (FUERA DEL DOMContentLoaded)
// ======================================================

const MOCK_CONTRACTS = {
    "CNT-2025-001": {
        id: "CNT-2025-001", prop: "Av. Providencia 1234, Santiago", status: "Vigente", statusClass: "approved",
        price: "$850.000", start: "01 Marzo 2025", end: "28 Febrero 2026", landlord: "Patricia Rojas", landlordInitials: "PR"
    },
    "CNT-2024-890": {
        id: "CNT-2024-890", prop: "Calle Los Leones 45, Providencia", status: "Finalizado", statusClass: "rejected",
        price: "$780.000", start: "01 Marzo 2024", end: "28 Febrero 2025", landlord: "Roberto Fernández", landlordInitials: "RF"
    }
};

window.openContractModal = function(contractId) {
    const data = MOCK_CONTRACTS[contractId];
    if(!data) return;

    const modalTitle = document.getElementById('modal-c-title');
    if(modalTitle) modalTitle.textContent = `Contrato #${data.id}`;
    
    const modalProp = document.getElementById('modal-c-prop');
    if(modalProp) modalProp.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${data.prop}`;
    
    const statusBadge = document.getElementById('modal-c-status');
    if(statusBadge) {
        statusBadge.textContent = data.status;
        statusBadge.className = `status-badge ${data.statusClass}`;
    }

    if(document.getElementById('modal-c-price')) document.getElementById('modal-c-price').textContent = data.price;
    if(document.getElementById('modal-c-start')) document.getElementById('modal-c-start').textContent = data.start;
    if(document.getElementById('modal-c-end')) document.getElementById('modal-c-end').textContent = data.end;
    if(document.getElementById('modal-c-landlord')) document.getElementById('modal-c-landlord').textContent = data.landlord;
    
    const avatar = document.querySelector('.party-box .p-avatar:not(.me)');
    if(avatar) avatar.textContent = data.landlordInitials;

    const contractModal = document.getElementById('contract-modal');
    if(contractModal) contractModal.classList.remove('hidden');
};

// Listeners de botones de contrato (se agregan dinámicamente)
document.addEventListener('DOMContentLoaded', () => {
    const viewContractBtns = document.querySelectorAll('.btn-view-contract');
    viewContractBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            openContractModal(id);
        });
    });
    
    const closeContractBtns = [document.getElementById('close-contract-modal'), document.getElementById('btn-close-c-modal')];
    closeContractBtns.forEach(btn => {
        if(btn) {
            btn.addEventListener('click', () => {
                const cm = document.getElementById('contract-modal');
                if(cm) cm.classList.add('hidden');
            });
        }
    });
});

// ======================================================
    // 10. LÓGICA DASHBOARD PROPIETARIO (NUEVO)
    // ======================================================

    const btnNewProp = document.getElementById('btn-new-property');
    const modalNewProp = document.getElementById('new-property-modal');
    const closeNewPropBtns = [
        document.getElementById('close-new-prop'),
        document.getElementById('cancel-new-prop')
    ];
    const formNewProp = document.getElementById('form-new-property');
    const submitNewPropBtn = document.getElementById('submit-new-prop');

    // Abrir Modal Publicar
    if(btnNewProp && modalNewProp) {
        btnNewProp.addEventListener('click', () => {
            modalNewProp.classList.remove('hidden');
        });
    }

    // Cerrar Modal Publicar
    if(modalNewProp) {
        closeNewPropBtns.forEach(btn => {
            if(btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    modalNewProp.classList.add('hidden');
                });
            }
        });
    }

    // =======================================
    // ENVÍO REAL DE PUBLICACIÓN A LA BASE DE DATOS
    // =======================================
    if (submitNewPropBtn && formNewProp) {
        submitNewPropBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // 1️⃣ Obtener usuario logueado
            const storedUser = localStorage.getItem('inmoapp_user');
            if (!storedUser) return alert("Debes iniciar sesión.");
            const user = JSON.parse(storedUser);

            // 2️⃣ Capturar datos del formulario
            const payload = {
                correoPropietario: user.correo,
                tipoInmueble: document.getElementById('prop-tipo')?.value,
                operacion: document.getElementById('prop-operacion')?.value,
                direccion: document.getElementById('prop-direccion')?.value.trim(),
                habitaciones: Number(document.getElementById('prop-habitaciones')?.value || 0),
                banos: Number(document.getElementById('prop-banos')?.value || 0),
                areaM2: Number(document.getElementById('prop-area')?.value || 0),
                descripcion: document.getElementById('prop-descripcion')?.value.trim(),
                precioCanon: document.getElementById('prop-precio')?.value.trim(),
                imagenUrl: document.getElementById('prop-imagen-url')?.value.trim()
            };

            if (!payload.direccion || !payload.precioCanon) {
                return alert("La dirección y el precio son obligatorios.");
            }

            submitNewPropBtn.disabled = true;
            submitNewPropBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publicando...';

            try {
                const resp = await fetch('/propiedades', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await resp.json();

                if (!resp.ok) {
                    alert(data.error || "Error registrando propiedad.");
                } else {
                    alert("Inmueble enviado a revisión.");
                    modalNewProp.classList.add('hidden');
                    formNewProp.reset();
                }

            } catch (err) {
                console.error("❌ Error publicando propiedad:", err);
                alert("No se pudo conectar con el servidor.");
            } finally {
                submitNewPropBtn.disabled = false;
                submitNewPropBtn.innerHTML = 'Enviar a Revisión';
            }
        });
    }


    // ======================================================
    // 11. LOGICA DE NOTIFICACIONES (TOGGLE)
    // ======================================================
    
    const btnBell = document.getElementById('btn-bell');
    const notifWindow = document.getElementById('notif-window');

    if (btnBell && notifWindow) {
        // 1. Al hacer clic en la campana
        btnBell.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que el clic cierre la ventana inmediatamente
            notifWindow.classList.toggle('hidden');
        });

        // 2. Al hacer clic en cualquier otro lado de la pantalla -> CERRAR
        document.addEventListener('click', (e) => {
            if (!notifWindow.contains(e.target) && e.target !== btnBell) {
                notifWindow.classList.add('hidden');
            }
        });

        // 3. Al hacer clic dentro de la ventana -> NO CERRAR
        notifWindow.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
