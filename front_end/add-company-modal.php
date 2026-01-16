<!-- Add Company Modal -->
<div id="addCompanyModal" class="add-company-modal" style="display: none;">
    <div class="add-modal-overlay"></div>
    <div class="add-modal-content">
        <!-- Modal Header -->
        <div class="add-modal-header">
            <h2>Add New Company</h2>
            <button class="close-add-modal-btn" id="closeAddModalBtn" aria-label="Close modal">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>

        <!-- Password Section (shown first) -->
        <div id="passwordSection" class="password-section">
            <div class="password-content">
                <div class="password-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                <h3>Authentication Required</h3>
                <p>Please enter the password to add a new company</p>
                
                <form id="passwordForm" class="password-form">
                    <div class="password-input-group">
                        <input 
                            type="password" 
                            id="passwordInput" 
                            class="password-input" 
                            placeholder="Enter password"
                            autocomplete="off"
                            required
                        >
                        <button type="button" id="togglePasswordBtn" class="toggle-password-btn" aria-label="Toggle password visibility">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                    
                    <button type="submit" id="submitPasswordBtn" class="submit-password-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"></path>
                        </svg>
                        Continue
                    </button>
                </form>

                <!-- Password Error Message -->
                <div id="passwordErrorMessage" class="password-error-message" style="display: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span id="passwordErrorText">Incorrect password. Please try again.</span>
                </div>
            </div>
        </div>

        <!-- Form Section (hidden until password is correct) -->
        <div id="formSection" class="form-section-container" style="display: none;">
            <form id="addCompanyForm" class="add-company-form">
                <div class="add-form-section">
                    <h3>Company Information</h3>
                    
                    <div class="add-form-group">
                        <label for="addCibId" class="add-form-label">CIB ID *</label>
                        <input 
                            type="text" 
                            id="addCibId" 
                            class="add-form-input"
                            placeholder="Enter CIB ID (e.g., COMP001)"
                            required
                        >
                    </div>

                    <div class="add-form-group">
                        <label for="addCompanyName" class="add-form-label">Company Name *</label>
                        <input 
                            type="text" 
                            id="addCompanyName" 
                            class="add-form-input"
                            placeholder="Enter company name"
                            required
                        >
                    </div>

                    <div class="add-form-group">
                        <label for="addHqCountryId" class="add-form-label">Headquarters Country</label>
                        <input 
                            type="text" 
                            id="addHqCountryId" 
                            class="add-form-input"
                            placeholder="Enter country code (e.g., US, GB)"
                            maxlength="2"
                        >
                        <small class="add-form-hint">Optional - 2 letter country code</small>
                    </div>

                    <div class="add-form-group">
                        <label for="addOperation" class="add-form-label">Operation Status</label>
                        <select id="addOperation" class="add-form-select">
                            <option value="">Select status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Pending">Pending</option>
                            <option value="Suspended">Suspended</option>
                        </select>
                    </div>

                    <div class="add-form-group">
                        <label for="addOperationDate" class="add-form-label">Operation Date</label>
                        <input 
                            type="date" 
                            id="addOperationDate" 
                            class="add-form-input"
                        >
                    </div>
                </div>

                <div class="add-form-section">
                    <h3>Sector Information</h3>
                    
                    <div class="add-form-group">
                        <label for="addSectorId" class="add-form-label">Sector ID</label>
                        <input 
                            type="number" 
                            id="addSectorId" 
                            class="add-form-input"
                            placeholder="Enter sector ID"
                            min="1"
                        >
                        <small class="add-form-hint">Optional - Enter a valid sector ID from the database</small>
                    </div>
                </div>

                <div class="add-form-actions">
                    <button type="button" id="cancelAddBtn" class="add-btn-secondary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Cancel
                    </button>
                    <button type="submit" id="submitAddBtn" class="add-btn-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Add Company
                    </button>
                </div>
            </form>

            <!-- Success Message -->
            <div id="addSuccessMessage" class="add-message success" style="display: none;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Company added successfully!</span>
            </div>

            <!-- Error Message -->
            <div id="addErrorMessage" class="add-message error" style="display: none;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span id="addErrorText">An error occurred</span>
            </div>
        </div>
    </div>
</div>