/**
 * Add Sector Modal Functionality with Password Protection
 * © 2025 Miloš Sarić. All rights reserved.
 * Handles password verification and adding new sectors to the database
 */

(function() {
    'use strict';

    // Configuration
    const API_BASE_URL = 'https://coding-challenge-ancient-surf-1603.fly.dev';
    const API_PASSWORD = 'supersecret123';

    // State
    let isPasswordVerified = false;
    let currentPassword = '';

    // DOM Elements
    const elements = {
        addSectorBtn: document.getElementById('addSectorBtn'),
        addSectorModal: document.getElementById('addSectorModal'),
        closeAddSectorModalBtn: document.getElementById('closeAddSectorModalBtn'),
        
        // Password section
        sectorPasswordSection: document.getElementById('sectorPasswordSection'),
        sectorPasswordForm: document.getElementById('sectorPasswordForm'),
        sectorPasswordInput: document.getElementById('sectorPasswordInput'),
        toggleSectorPasswordBtn: document.getElementById('toggleSectorPasswordBtn'),
        submitSectorPasswordBtn: document.getElementById('submitSectorPasswordBtn'),
        sectorPasswordErrorMessage: document.getElementById('sectorPasswordErrorMessage'),
        sectorPasswordErrorText: document.getElementById('sectorPasswordErrorText'),
        
        // Form section
        sectorFormSection: document.getElementById('sectorFormSection'),
        addSectorForm: document.getElementById('addSectorForm'),
        cancelAddSectorBtn: document.getElementById('cancelAddSectorBtn'),
        submitAddSectorBtn: document.getElementById('submitAddSectorBtn'),
        addSectorSuccessMessage: document.getElementById('addSectorSuccessMessage'),
        addSectorErrorMessage: document.getElementById('addSectorErrorMessage'),
        addSectorErrorText: document.getElementById('addSectorErrorText'),
        
        // Form inputs
        addSectorName: document.getElementById('addSectorName'),
        addSectorRadiusKm: document.getElementById('addSectorRadiusKm'),
        addParentSectorId: document.getElementById('addParentSectorId')
    };

    // Debug logger
    function debugLog(message, data = null) {
        console.log(`[AddSector] ${message}`, data || '');
    }

    /**
     * Reset modal state
     */
    function resetModalState() {
        isPasswordVerified = false;
        currentPassword = '';
        
        // Show password section, hide form section
        elements.sectorPasswordSection.style.display = 'block';
        elements.sectorFormSection.style.display = 'none';
        
        // Reset password form
        if (elements.sectorPasswordForm) {
            elements.sectorPasswordForm.reset();
        }
        
        // Reset sector form
        if (elements.addSectorForm) {
            elements.addSectorForm.reset();
        }
        
        // Hide all messages
        elements.sectorPasswordErrorMessage.style.display = 'none';
        elements.addSectorSuccessMessage.style.display = 'none';
        elements.addSectorErrorMessage.style.display = 'none';
        
        // Reset password input type
        elements.sectorPasswordInput.type = 'password';
    }

    /**
     * Open the add sector modal
     */
    function openAddSectorModal() {
        debugLog('Opening add sector modal');
        
        // Reset state
        resetModalState();
        
        // Show modal
        elements.addSectorModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on password input
        setTimeout(() => {
            elements.sectorPasswordInput.focus();
        }, 100);
    }

    /**
     * Close the add sector modal
     */
    function closeAddSectorModal() {
        debugLog('Closing add sector modal');
        elements.addSectorModal.style.display = 'none';
        document.body.style.overflow = '';
        resetModalState();
    }

    /**
     * Toggle password visibility
     */
    function togglePasswordVisibility() {
        const type = elements.sectorPasswordInput.type === 'password' ? 'text' : 'password';
        elements.sectorPasswordInput.type = type;
        
        // Update icon
        const svg = elements.toggleSectorPasswordBtn.querySelector('svg');
        if (type === 'text') {
            // Eye off icon
            svg.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            `;
        } else {
            // Eye on icon
            svg.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            `;
        }
    }

    /**
     * Handle password form submission
     */
    function handlePasswordSubmit(e) {
        e.preventDefault();
        
        const enteredPassword = elements.sectorPasswordInput.value.trim();
        
        debugLog('Verifying password');
        
        // Hide previous error
        elements.sectorPasswordErrorMessage.style.display = 'none';
        
        // Verify password
        if (enteredPassword === API_PASSWORD) {
            debugLog('Password verified successfully');
            
            isPasswordVerified = true;
            currentPassword = enteredPassword;
            
            // Hide password section, show form section
            elements.sectorPasswordSection.style.display = 'none';
            elements.sectorFormSection.style.display = 'block';
            
            // Focus on first form input
            setTimeout(() => {
                elements.addSectorName.focus();
            }, 100);
            
        } else {
            debugLog('Invalid password');
            
            // Show error
            elements.sectorPasswordErrorMessage.style.display = 'flex';
            
            // Clear password input
            elements.sectorPasswordInput.value = '';
            elements.sectorPasswordInput.focus();
        }
    }

    /**
     * Show success message
     */
    function showAddSuccess() {
        elements.addSectorSuccessMessage.style.display = 'flex';
        elements.addSectorErrorMessage.style.display = 'none';
    }

    /**
     * Show error message
     */
    function showAddError(message) {
        elements.addSectorErrorText.textContent = message;
        elements.addSectorErrorMessage.style.display = 'flex';
        elements.addSectorSuccessMessage.style.display = 'none';
    }

    /**
     * Handle sector form submission
     */
    async function handleAddSectorSubmit(e) {
        e.preventDefault();
        
        if (!isPasswordVerified) {
            showAddError('Password verification required');
            return;
        }
        
        debugLog('Submitting new sector');
        
        // Collect form data - start with required field
        const formData = {
            sector_name: elements.addSectorName.value.trim()
        };

        // Add optional fields only if they have values
        const radiusKm = elements.addSectorRadiusKm.value;
        if (radiusKm) {
            formData.sector_radius_km = parseFloat(radiusKm);
        }

        const parentSectorId = elements.addParentSectorId.value;
        if (parentSectorId) {
            formData.parent_sector_id = parseInt(parentSectorId);
        }

        // Validate required field
        if (!formData.sector_name) {
            showAddError('Sector Name is required');
            return;
        }

        debugLog('Form data:', formData);

        try {
            // Hide previous messages
            elements.addSectorSuccessMessage.style.display = 'none';
            elements.addSectorErrorMessage.style.display = 'none';

            // Disable submit button during request
            elements.submitAddSectorBtn.disabled = true;
            elements.submitAddSectorBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                    <path d="M12 2 A10 10 0 0 1 22 12" opacity="0.75">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                    </path>
                </svg>
                Adding...
            `;

            const url = `${API_BASE_URL}/add_sector`;
            debugLog('POST URL:', url);
            debugLog('Using password:', currentPassword);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Password': currentPassword
                },
                body: JSON.stringify(formData)
            });

            debugLog('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                debugLog('Error response:', errorText);
                
                // Handle specific error codes
                if (response.status === 401) {
                    throw new Error('Authentication failed. Please try again.');
                }
                
                if (response.status === 400) {
                    // Try to parse the error message
                    try {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.detail) {
                            throw new Error(errorJson.detail);
                        }
                    } catch (e) {
                        // If parsing fails, use generic message
                    }
                    throw new Error('Sector with this name already exists or invalid data provided');
                }
                
                // Try to parse error message
                let errorMessage = `Failed to add sector (Status ${response.status})`;
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.detail) {
                        errorMessage = errorJson.detail;
                    }
                } catch (e) {
                    // If not JSON, use the text
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            debugLog('Sector added successfully:', result);

            // Show success message
            showAddSuccess();

            // Reload the sectors table to show the new sector
            setTimeout(() => {
                if (window.SectorsView && window.SectorsView.loadAllSectorsForTable) {
                    window.SectorsView.loadAllSectorsForTable();
                }
                closeAddSectorModal();
            }, 2000);

        } catch (error) {
            console.error('Error adding sector:', error);
            showAddError(error.message);
        } finally {
            // Re-enable submit button
            elements.submitAddSectorBtn.disabled = false;
            elements.submitAddSectorBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"></path>
                </svg>
                Add Sector
            `;
        }
    }

    /**
     * Initialize event listeners
     */
    function initializeAddSectorModal() {
        debugLog('Initializing add sector modal');

        // Open modal button
        if (elements.addSectorBtn) {
            elements.addSectorBtn.addEventListener('click', openAddSectorModal);
        }

        // Close modal buttons
        if (elements.closeAddSectorModalBtn) {
            elements.closeAddSectorModalBtn.addEventListener('click', closeAddSectorModal);
        }

        if (elements.cancelAddSectorBtn) {
            elements.cancelAddSectorBtn.addEventListener('click', closeAddSectorModal);
        }

        // Password form
        if (elements.sectorPasswordForm) {
            elements.sectorPasswordForm.addEventListener('submit', handlePasswordSubmit);
        }

        // Toggle password visibility
        if (elements.toggleSectorPasswordBtn) {
            elements.toggleSectorPasswordBtn.addEventListener('click', togglePasswordVisibility);
        }

        // Sector form submission
        if (elements.addSectorForm) {
            elements.addSectorForm.addEventListener('submit', handleAddSectorSubmit);
        }

        // Close modal on overlay click
        if (elements.addSectorModal) {
            elements.addSectorModal.addEventListener('click', (e) => {
                if (e.target === elements.addSectorModal || e.target.classList.contains('add-sector-modal-overlay')) {
                    closeAddSectorModal();
                }
            });
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.addSectorModal.style.display === 'flex') {
                closeAddSectorModal();
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAddSectorModal);
    } else {
        initializeAddSectorModal();
    }

    // Export for debugging
    window.AddSectorModal = {
        openAddSectorModal,
        closeAddSectorModal,
        debugLog,
        resetModalState
    };

})();