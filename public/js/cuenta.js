// public/js/cuenta.js
import { cargarContratosInquilino } from './contratos-tenant.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('👤 Página Mi Cuenta cargada');

    // 1. Verificar Sesión
    const userStr = localStorage.getItem('inmoapp_user');
    if (!userStr) {
        window.location.href = '/';
        return;
    }
    const user = JSON.parse(userStr);

    // 2. Llenar datos del perfil (Sidebar)
    document.querySelector('.user-name').textContent = user.nombre_completo;
    document.querySelector('.user-email').textContent = user.correo;
    document.querySelector('.user-avatar-lg').textContent = user.nombre_completo.charAt(0).toUpperCase();

    // 3. Manejo de Pestañas (Tabs)
    const tabs = document.querySelectorAll('.account-nav-item');
    const panels = document.querySelectorAll('.account-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Manejo especial para Cerrar Sesión
            if(tab.textContent.includes('Cerrar Sesión')) {
                localStorage.removeItem('inmoapp_user');
                localStorage.removeItem('inmoapp_token');
                window.location.href = '/';
                return;
            }

            // Cambiar UI de Tabs
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.dataset.target;
            document.getElementById(targetId).classList.add('active');

            // 🔥 CARGAR DATOS SI ES LA PESTAÑA CONTRATOS
            if (targetId === 'panel-contratos') {
                cargarContratosInquilino(user.id);
            }
        });
    });

    // Cargar contratos automáticamente si se inicia en esa pestaña (opcional)
    // if (document.getElementById('panel-contratos').classList.contains('active')) {
    //     cargarContratosInquilino(user.id);
    // }
});