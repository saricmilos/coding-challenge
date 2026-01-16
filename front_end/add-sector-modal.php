<!-- Add Sector Modal -->
<div id="addSectorModal" class="add-sector-modal" style="display: none;">
    <div class="add-sector-modal-overlay"></div>
    <div class="add-sector-modal-content">
        <!-- Modal Header -->
        <div class="add-sector-modal-header">
            <h2>Add New Sector</h2>
            <button class="close-add-sector-modal-btn" id="closeAddSectorModalBtn" aria-label="Close modal">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>

        <!-- Password Section (shown first) -->
        <div id="sectorPasswordSection" class="sector-password-section">
            <div class="sector-password-content">
                <div class="sector-password-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <h3>Authentication Required</h3>
                <p>Please enter the password to add a new sector</p>
                
                <form id="sectorPasswordForm" class="sector-password-form">
                    <div class="sector-password-input-group">
                        <input 
                            type="password" 
                            id="sectorPasswordInput" 
                            class="sector-password-input" 
                            placeholder="Enter password"
                            autocomplete="off"
                            required
                        >
                        <button type="button" id="toggleSectorPasswordBtn" class="toggle-sector-password-btn" aria-label="Toggle password visibility">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                    
                    <button type="submit" id="submitSectorPasswordBtn" class="submit-sector-password-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"></path>
                        </svg>
                        Continue
                    </button>
                </form>

                <!-- Password Error Message -->
                <div id="sectorPasswordErrorMessage" class="sector-password-error-message" style="display: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span id="sectorPasswordErrorText">Incorrect password. Please try again.</span>
                </div>
            </div>
        </div>

        <!-- Form Section (hidden until password is correct) -->
        <div id="sectorFormSection" class="sector-form-section-container" style="display: none;">
            <form id="addSectorForm" class="add-sector-form">
                <div class="add-sector-form-section">
                    <h3>Sector Information</h3>
                    
                    <div class="add-sector-form-group">
                        <label for="addSectorName" class="add-sector-form-label">Sector Name *</label>
                        <input 
                            type="text" 
                            id="addSectorName" 
                            class="add-sector-form-input"
                            placeholder="Enter sector name (e.g., Technology)"
                            required
                        >
                    </div>

                    <div class="add-sector-form-group">
                        <label for="addSectorRadiusKm" class="add-sector-form-label">Sector Radius (km)</label>
                        <input 
                            type="number" 
                            id="addSectorRadiusKm" 
                            class="add-sector-form-input"
                            placeholder="Enter radius in kilometers"
                            step="0.01"
                            min="0"
                        >
                        <small class="add-sector-form-hint">Optional - Geographical radius in kilometers</small>
                    </div>

                    <div class="add-sector-form-group">
                        <label for="addParentSectorId" class="add-sector-form-label">Parent Sector ID</label>
                        <input 
                            type="number" 
                            id="addParentSectorId" 
                            class="add-sector-form-input"
                            placeholder="Enter parent sector ID"
                            min="1"
                        >
                        <small class="add-sector-form-hint">Optional - For sub-sectors, enter the parent sector ID</small>
                    </div>
                </div>

                <div class="add-sector-form-actions">
                    <button type="button" id="cancelAddSectorBtn" class="add-sector-btn-secondary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cancel
                    </button>
                    <button type="submit" id="submitAddSectorBtn" class="add-sector-btn-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Add Sector
                    </button>
                </div>
            </form>

            <!-- Success Message -->
            <div id="addSectorSuccessMessage" class="add-sector-message success" style="display: none;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Sector added successfully!</span>
            </div>

            <!-- Error Message -->
            <div id="addSectorErrorMessage" class="add-sector-message error" style="display: none;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span id="addSectorErrorText">An error occurred</span>
            </div>
        </div>
    </div>
</div>