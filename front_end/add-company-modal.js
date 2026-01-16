/**
 * Add Company Modal Functionality with Password Protection
 * © 2025 Miloš Sarić. All rights reserved.
 * Handles password verification and adding new companies to the database
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
        addCompanyBtn: document.getElementById('addCompanyBtn'),
        addCompanyModal: document.getElementById('addCompanyModal'),
        closeAddModalBtn: document.getElementById('closeAddModalBtn'),
        
        // Password section
        passwordSection: document.getElementById('passwordSection'),
        passwordForm: document.getElementById('passwordForm'),
        passwordInput: document.getElementById('passwordInput'),
        togglePasswordBtn: document.getElementById('togglePasswordBtn'),
        submitPasswordBtn: document.getElementById('submitPasswordBtn'),
        passwordErrorMessage: document.getElementById('passwordErrorMessage'),
        passwordErrorText: document.getElementById('passwordErrorText'),
        
        // Form section
        formSection: document.getElementById('formSection'),
        addCompanyForm: document.getElementById('addCompanyForm'),
        cancelAddBtn: document.getElementById('cancelAddBtn'),
        submitAddBtn: document.getElementById('submitAddBtn'),
        addSuccessMessage: document.getElementById('addSuccessMessage'),
        addErrorMessage: document.getElementById('addErrorMessage'),
        addErrorText: document.getElementById('addErrorText'),
        
        // Form inputs
        addCibId: document.getElementById('addCibId'),
        addCompanyName: document.getElementById('addCompanyName'),
        addHqCountryId: document.getElementById('addHqCountryId'),
        addOperation: document.getElementById('addOperation'),
        addOperationDate: document.getElementById('addOperationDate'),
        addSectorId: document.getElementById('addSectorId')
    };

    // Debug logger
    function debugLog(message, data = null) {
        console.log(`[AddCompany] ${message}`, data || '');
    }

    /**
     * Reset modal state
     */
    function resetModalState() {
        isPasswordVerified = false;
        currentPassword = '';
        
        // Show password section, hide form section
        elements.passwordSection.style.display = 'block';
        elements.formSection.style.display = 'none';
        
        // Reset password form
        if (elements.passwordForm) {
            elements.passwordForm.reset();
        }
        
        // Reset company form
        if (elements.addCompanyForm) {
            elements.addCompanyForm.reset();
        }
        
        // Hide all messages
        elements.passwordErrorMessage.style.display = 'none';
        elements.addSuccessMessage.style.display = 'none';
        elements.addErrorMessage.style.display = 'none';
        
        // Reset password input type
        elements.passwordInput.type = 'password';
    }

    /**
     * Open the add company modal
     */
    function openAddCompanyModal() {
        debugLog('Opening add company modal');
        
        // Reset state
        resetModalState();
        
        // Show modal
        elements.addCompanyModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on password input
        setTimeout(() => {
            elements.passwordInput.focus();
        }, 100);
    }

    /**
     * Close the add company modal
     */
    function closeAddCompanyModal() {
        debugLog('Closing add company modal');
        elements.addCompanyModal.style.display = 'none';
        document.body.style.overflow = '';
        resetModalState();
    }

    /**
     * Toggle password visibility
     */
    function togglePasswordVisibility() {
        const type = elements.passwordInput.type === 'password' ? 'text' : 'password';
        elements.passwordInput.type = type;
        
        // Update icon
        const svg = elements.togglePasswordBtn.querySelector('svg');
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
        
        const enteredPassword = elements.passwordInput.value.trim();
        
        debugLog('Verifying password');
        
        // Hide previous error
        elements.passwordErrorMessage.style.display = 'none';
        
        // Verify password
        if (enteredPassword === API_PASSWORD) {
            debugLog('Password verified successfully');
            
            isPasswordVerified = true;
            currentPassword = enteredPassword;
            
            // Hide password section, show form section
            elements.passwordSection.style.display = 'none';
            elements.formSection.style.display = 'block';
            
            // Focus on first form input
            setTimeout(() => {
                elements.addCibId.focus();
            }, 100);
            
        } else {
            debugLog('Invalid password');
            
            // Show error
            elements.passwordErrorMessage.style.display = 'flex';
            
            // Clear password input
            elements.passwordInput.value = '';
            elements.passwordInput.focus();
        }
    }

    /**
     * Show success message
     */
    function showAddSuccess() {
        elements.addSuccessMessage.style.display = 'flex';
        elements.addErrorMessage.style.display = 'none';
    }

    /**
     * Show error message
     */
    function showAddError(message) {
        elements.addErrorText.textContent = message;
        elements.addErrorMessage.style.display = 'flex';
        elements.addSuccessMessage.style.display = 'none';
    }

    /**
     * Handle company form submission
     */
    async function handleAddCompanySubmit(e) {
        e.preventDefault();
        
        if (!isPasswordVerified) {
            showAddError('Password verification required');
            return;
        }
        
        debugLog('Submitting new company');
        
        // Collect form data
        const formData = {
            cib_id: elements.addCibId.value.trim(),
            company_name: elements.addCompanyName.value.trim()
        };

        // Add optional fields only if they have values
        const hqCountryId = elements.addHqCountryId.value.trim();
        if (hqCountryId) {
            formData.hq_country_id = hqCountryId;
        }

        const operation = elements.addOperation.value;
        if (operation) {
            formData.operation = operation;
        }

        const operationDate = elements.addOperationDate.value;
        if (operationDate) {
            formData.operation_date = operationDate;
        }

        const sectorId = elements.addSectorId.value;
        if (sectorId) {
            formData.sector_id = parseInt(sectorId);
        }

        // Validate required fields
        if (!formData.cib_id || !formData.company_name) {
            showAddError('CIB ID and Company Name are required');
            return;
        }

        debugLog('Form data:', formData);

        try {
            // Hide previous messages
            elements.addSuccessMessage.style.display = 'none';
            elements.addErrorMessage.style.display = 'none';

            // Disable submit button during request
            elements.submitAddBtn.disabled = true;
            elements.submitAddBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                    <path d="M12 2 A10 10 0 0 1 22 12" opacity="0.75">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                    </path>
                </svg>
                Adding...
            `;

            const url = `${API_BASE_URL}/add_company`;
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
                
                // Try to parse error message
                let errorMessage = `Failed to add company (Status ${response.status})`;
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
            debugLog('Company added successfully:', result);

            // Show success message
            showAddSuccess();

            // Reload the companies table to show the new company
            setTimeout(() => {
                if (window.CompanySearch && window.CompanySearch.loadAllCompaniesForTable) {
                    window.CompanySearch.loadAllCompaniesForTable();
                }
                closeAddCompanyModal();
            }, 2000);

        } catch (error) {
            console.error('Error adding company:', error);
            showAddError(error.message);
        } finally {
            // Re-enable submit button
            elements.submitAddBtn.disabled = false;
            elements.submitAddBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"></path>
                </svg>
                Add Company
            `;
        }
    }

    /**
     * Initialize event listeners
     */
    function initializeAddCompanyModal() {
        debugLog('Initializing add company modal');

        // Open modal button
        if (elements.addCompanyBtn) {
            elements.addCompanyBtn.addEventListener('click', openAddCompanyModal);
        }

        // Close modal buttons
        if (elements.closeAddModalBtn) {
            elements.closeAddModalBtn.addEventListener('click', closeAddCompanyModal);
        }

        if (elements.cancelAddBtn) {
            elements.cancelAddBtn.addEventListener('click', closeAddCompanyModal);
        }

        // Password form
        if (elements.passwordForm) {
            elements.passwordForm.addEventListener('submit', handlePasswordSubmit);
        }

        // Toggle password visibility
        if (elements.togglePasswordBtn) {
            elements.togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
        }

        // Company form submission
        if (elements.addCompanyForm) {
            elements.addCompanyForm.addEventListener('submit', handleAddCompanySubmit);
        }

        // Close modal on overlay click
        if (elements.addCompanyModal) {
            elements.addCompanyModal.addEventListener('click', (e) => {
                if (e.target === elements.addCompanyModal || e.target.classList.contains('add-modal-overlay')) {
                    closeAddCompanyModal();
                }
            });
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.addCompanyModal.style.display === 'flex') {
                closeAddCompanyModal();
            }
        });

        // Uppercase country code input
        if (elements.addHqCountryId) {
            elements.addHqCountryId.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        // Uppercase CIB ID input
        if (elements.addCibId) {
            elements.addCibId.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAddCompanyModal);
    } else {
        initializeAddCompanyModal();
    }

    // Export for debugging
    window.AddCompanyModal = {
        openAddCompanyModal,
        closeAddCompanyModal,
        debugLog,
        resetModalState
    };

})();