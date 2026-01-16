/**
 * Sidebar Navigation Logic
 * © 2025 Miloš Sarić. All rights reserved.
 * Handles view switching between Companies and Sectors
 */

(function() {
    'use strict';

    // DOM Elements
    const elements = {
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        sidebarClose: document.getElementById('sidebarClose'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        sidebarNavItems: document.querySelectorAll('.sidebar-nav-item'),
        companiesView: document.getElementById('companiesView'),
        sectorsView: document.getElementById('sectorsView')
    };

    // State
    let currentView = 'companies';

    /**
     * Debug logger
     */
    function debugLog(message, data = null) {
        console.log(`[Sidebar] ${message}`, data || '');
    }

    /**
     * Open sidebar (mobile)
     */
    function openSidebar() {
        elements.sidebar.classList.add('active');
        elements.sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        debugLog('Sidebar opened');
    }

    /**
     * Close sidebar (mobile)
     */
    function closeSidebar() {
        elements.sidebar.classList.remove('active');
        elements.sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
        debugLog('Sidebar closed');
    }

    /**
     * Switch view between Companies and Sectors
     */
    function switchView(viewName) {
        debugLog(`Switching to view: ${viewName}`);

        // Update active state on nav items
        elements.sidebarNavItems.forEach(item => {
            if (item.dataset.view === viewName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Switch views
        if (viewName === 'companies') {
            elements.companiesView.classList.add('active');
            elements.sectorsView.classList.remove('active');
            currentView = 'companies';
        } else if (viewName === 'sectors') {
            elements.companiesView.classList.remove('active');
            elements.sectorsView.classList.add('active');
            currentView = 'sectors';

            // Load sectors when switching to sectors view
            if (window.SectorsView && window.SectorsView.loadAllSectorsForTable) {
                window.SectorsView.loadAllSectorsForTable();
            }
        }

        // Close sidebar on mobile after switching
        if (window.innerWidth <= 768) {
            closeSidebar();
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Initialize sidebar
     */
    function initializeSidebar() {
        debugLog('Initializing sidebar');

        // Mobile toggle button
        if (elements.sidebarToggle) {
            elements.sidebarToggle.addEventListener('click', openSidebar);
        }

        // Close button
        if (elements.sidebarClose) {
            elements.sidebarClose.addEventListener('click', closeSidebar);
        }

        // Overlay click to close
        if (elements.sidebarOverlay) {
            elements.sidebarOverlay.addEventListener('click', closeSidebar);
        }

        // Navigation items
        elements.sidebarNavItems.forEach(item => {
            item.addEventListener('click', () => {
                const viewName = item.dataset.view;
                switchView(viewName);
            });
        });

        // Close sidebar on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.sidebar.classList.contains('active')) {
                closeSidebar();
            }
        });

        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768) {
                    closeSidebar();
                }
            }, 250);
        });

        debugLog('Sidebar initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSidebar);
    } else {
        initializeSidebar();
    }

    // Export for debugging
    window.Sidebar = {
        openSidebar,
        closeSidebar,
        switchView,
        getCurrentView: () => currentView,
        debugLog
    };

})();