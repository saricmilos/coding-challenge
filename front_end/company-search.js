/**
 * Company Search System - Enhanced Version with Table and Edit
 * © 2025 Milos Saric. All rights reserved.
 * Handles company search, display, and editing via FastAPI
 */

// Configuration
const CONFIG = {
    API_BASE_URL: 'https://coding-challenge-ancient-surf-1603.fly.dev',
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    SEARCH_DEBOUNCE: 300,
    SERVER_WAKEUP_TIMEOUT: 30000
};

// State management
const state = {
    selectedCompany: null,
    currentSearchRequest: null,
    currentDetailsRequest: null,
    selectedIndex: -1,
    isSearching: false,
    retryCount: 0,
    searchDebounceTimer: null,
    serverReady: false,
    allCompanies: [],
    filteredCompanies: [],
    currentPage: 1,
    itemsPerPage: 20,
    currentFilter: '',
    currentEditCompany: null
};

// DOM Elements
const elements = {
    searchInput: document.getElementById('companySearchInput'),
    companyDropdown: document.getElementById('companyDropdown'),
    searchButton: document.getElementById('searchButton'),
    loadingState: document.getElementById('loadingState'),
    companyDetailsSection: document.getElementById('companyDetailsSection'),
    errorState: document.getElementById('errorState'),
    selectedCompanyName: document.getElementById('selectedCompanyName'),
    companyDetailsContent: document.getElementById('companyDetailsContent'),
    errorMessage: document.getElementById('errorMessage'),
    retryButton: document.getElementById('retryButton'),
    serverWakeupNotification: document.getElementById('serverWakeupNotification'),
    
    // Table elements
    companiesTableLoading: document.getElementById('companiesTableLoading'),
    companiesTableWrapper: document.getElementById('companiesTableWrapper'),
    companiesTable: document.getElementById('companiesTable'),
    companiesTableBody: document.getElementById('companiesTableBody'),
    companiesTableError: document.getElementById('companiesTableError'),
    companiesTableErrorMessage: document.getElementById('companiesTableErrorMessage'),
    itemsPerPage: document.getElementById('itemsPerPage'),
    tableInfo: document.getElementById('tableInfo'),
    pageInfo: document.getElementById('pageInfo'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    paginationControls: document.getElementById('paginationControls'),
    
    // Edit form elements
    companyEditSection: document.getElementById('companyEditSection'),
    companyEditForm: document.getElementById('companyEditForm'),
    editCompanyName: document.getElementById('editCompanyName'),
    editCompanyNameInput: document.getElementById('editCompanyNameInput'),
    editCibId: document.getElementById('editCibId'),
    editHqCountryId: document.getElementById('editHqCountryId'),
    editOperation: document.getElementById('editOperation'),
    editOperationDate: document.getElementById('editOperationDate'),
    editSectorId: document.getElementById('editSectorId'),
    closeEditBtn: document.getElementById('closeEditBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    editSuccessMessage: document.getElementById('editSuccessMessage'),
    editErrorMessage: document.getElementById('editErrorMessage'),
    editErrorText: document.getElementById('editErrorText')
};

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Utility: Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Debug logger
function debugLog(message, data = null) {
    console.log(`[CompanySearch] ${message}`, data || '');
}

// ==================== SERVER WAKEUP FUNCTIONALITY ====================

async function wakeUpServer() {
    debugLog('Waking up server...');
    
    const startTime = Date.now();
    const maxAttempts = 15;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const elapsedTime = Date.now() - startTime;
                debugLog(`Server is ready! (${elapsedTime}ms)`);
                state.serverReady = true;
                hideServerWakeupNotification();
                return true;
            }
        } catch (error) {
            debugLog(`Server wake attempt ${attempts + 1} failed:`, error.message);
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (Date.now() - startTime > CONFIG.SERVER_WAKEUP_TIMEOUT) {
            debugLog('Server wakeup timeout exceeded');
            showServerWakeupError();
            return false;
        }
    }
    
    debugLog('Max server wake attempts reached');
    showServerWakeupError();
    return false;
}

function hideServerWakeupNotification() {
    if (elements.serverWakeupNotification) {
        elements.serverWakeupNotification.classList.add('hidden');
        setTimeout(() => {
            elements.serverWakeupNotification.style.display = 'none';
        }, 500);
    }
}

function showServerWakeupError() {
    if (elements.serverWakeupNotification) {
        const content = elements.serverWakeupNotification.querySelector('.wakeup-content');
        if (content) {
            content.innerHTML = `
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h2 style="color: #ef4444;">SERVER TIMEOUT</h2>
                <p>The server is taking too long to respond. Please refresh the page to try again.</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                    Refresh Page
                </button>
            `;
        }
    }
}

// ==================== TABLE FUNCTIONALITY ====================

async function loadAllCompaniesForTable() {
    debugLog('Loading all companies for table...');
    
    try {
        elements.companiesTableLoading.style.display = 'block';
        elements.companiesTableWrapper.style.display = 'none';
        elements.companiesTableError.style.display = 'none';
        elements.paginationControls.style.display = 'none';
        
        const url = `${CONFIG.API_BASE_URL}/companies_with_sectors?limit=1000`;
        console.log('Fetching companies from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Companies list response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to load companies (Status ${response.status})`);
        }
        
        const data = await response.json();
        console.log('Companies data received:', data);
        debugLog(`Loaded ${data.length} companies`);
        
        state.allCompanies = data;
        state.filteredCompanies = data;
        state.currentPage = 1;
        
        renderTable();
        
    } catch (error) {
        console.error('Error loading companies:', error);
        debugLog('Error loading companies:', error);
        showTableError(error.message);
    } finally {
        elements.companiesTableLoading.style.display = 'none';
    }
}

function filterCompaniesBySearch(searchTerm) {
    if (!searchTerm || searchTerm.length === 0) {
        state.filteredCompanies = state.allCompanies;
    } else {
        const searchLower = searchTerm.toLowerCase();
        state.filteredCompanies = state.allCompanies.filter(item => {
            const companyName = item.company.company_name.toLowerCase();
            return companyName.startsWith(searchLower);
        });
    }
    
    state.currentPage = 1;
    state.currentFilter = searchTerm;
    renderTable();
}

function renderTable() {
    const { filteredCompanies, currentPage, itemsPerPage } = state;
    
    if (!filteredCompanies || filteredCompanies.length === 0) {
        showTableError('No companies found');
        return;
    }
    
    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredCompanies.length);
    const pageCompanies = filteredCompanies.slice(startIndex, endIndex);
    
    // Render table rows with View and Edit buttons
    elements.companiesTableBody.innerHTML = pageCompanies.map(item => {
        const company = item.company;
        const sector = item.sector;
        
        return `
            <tr>
                <td>${escapeHtml(company.company_name)}</td>
                <td>${escapeHtml(company.cib_id)}</td>
                <td>${escapeHtml(company.hq_country_id || 'N/A')}</td>
                <td>${escapeHtml(company.operation || 'N/A')}</td>
                <td>
                    <span class="table-sector-badge">${escapeHtml(sector.sector_name)}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="view-details-btn" onclick="viewCompanyDetails('${escapeHtml(company.company_name)}')">
                            View
                        </button>
                        <button class="edit-details-btn" onclick="editCompanyDetails('${escapeHtml(company.cib_id)}', '${escapeHtml(company.company_name)}')">
                            Edit
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update table info
    elements.tableInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredCompanies.length} companies`;
    
    // Update pagination
    elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    elements.prevPageBtn.disabled = currentPage === 1;
    elements.nextPageBtn.disabled = currentPage === totalPages;
    
    // Show table
    elements.companiesTableWrapper.style.display = 'block';
    elements.paginationControls.style.display = 'flex';
    elements.companiesTableError.style.display = 'none';
}

function showTableError(message) {
    elements.companiesTableErrorMessage.textContent = message;
    elements.companiesTableError.style.display = 'block';
    elements.companiesTableWrapper.style.display = 'none';
    elements.paginationControls.style.display = 'none';
}

function changePage(direction) {
    const totalPages = Math.ceil(state.filteredCompanies.length / state.itemsPerPage);
    
    if (direction === 'next' && state.currentPage < totalPages) {
        state.currentPage++;
        renderTable();
        scrollToTable();
    } else if (direction === 'prev' && state.currentPage > 1) {
        state.currentPage--;
        renderTable();
        scrollToTable();
    }
}

function changeItemsPerPage(newItemsPerPage) {
    state.itemsPerPage = parseInt(newItemsPerPage);
    state.currentPage = 1;
    renderTable();
}

function scrollToTable() {
    const tableSection = document.querySelector('.companies-table-section');
    if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Make function globally accessible
window.viewCompanyDetails = function(companyName) {
    debugLog(`View details clicked: ${companyName}`);
    state.selectedCompany = companyName;
    getCompanyDetails(companyName);
};

// ==================== SEARCH FUNCTIONALITY (NO DROPDOWN) ====================

async function handleSearchInput(e) {
    const input = e.target.value.trim();
    debugLog(`Input changed: "${input}"`);
    
    if (state.searchDebounceTimer) {
        clearTimeout(state.searchDebounceTimer);
    }
    
    // Filter the table as user types (real-time filtering)
    filterCompaniesBySearch(input);
    
    // Enable/disable search button
    elements.searchButton.disabled = input.length === 0;
    
    // Hide dropdown (we don't use it anymore)
    hideCompanyDropdown();
    hideError();
}

function hideCompanyDropdown() {
    // Dropdown is now permanently hidden via CSS
    if (elements.companyDropdown) {
        elements.companyDropdown.style.display = 'none';
        elements.companyDropdown.innerHTML = '';
    }
    state.selectedIndex = -1;
}

function handleKeyboardNavigation(e) {
    // Remove keyboard navigation for dropdown since we no longer use it
    if (e.key === 'Escape') {
        elements.searchInput.blur();
    }
}

async function getCompanyDetails(companyName) {
    if (!companyName) {
        debugLog('No company selected');
        return;
    }
    
    debugLog(`Getting details for: ${companyName}`);
    
    if (state.currentDetailsRequest) {
        state.currentDetailsRequest.abort();
    }
    
    const controller = new AbortController();
    state.currentDetailsRequest = controller;
    
    showLoading();
    hideError();
    hideDetails();
    
    try {
        const url = `${CONFIG.API_BASE_URL}/company_info/${encodeURIComponent(companyName)}`;
        console.log('Fetching company details URL:', url);
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Company details response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Company not found in database');
            }
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to get company details (Status ${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Company details received:', data);
        debugLog('Company details received:', data);
        displayCompanyDetails(data);
        
    } catch (error) {
        if (error.name === 'AbortError') {
            debugLog('Request was cancelled');
            return;
        }
        console.error('Error getting company details:', error);
        debugLog('Error getting company details:', error);
        showError(error.message);
    } finally {
        hideLoading();
        state.currentDetailsRequest = null;
    }
}

function displayCompanyDetails(data) {
    hideLoading();
    hideError();
    
    const company = data.company;
    const sector = data.sector;
    
    elements.selectedCompanyName.textContent = company.company_name;
    
    elements.companyDetailsContent.innerHTML = `
        <div class="company-info-card">
            <div class="info-row">
                <span class="info-label">Company Name</span>
                <span class="info-value">${escapeHtml(company.company_name)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">CIB ID</span>
                <span class="info-value">${escapeHtml(company.cib_id)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Headquarters</span>
                <span class="info-value">${escapeHtml(company.hq_country_id || 'N/A')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Operation</span>
                <span class="info-value">
                    <span class="status-badge">${escapeHtml(company.operation || 'N/A')}</span>
                </span>
            </div>
            <div class="info-row">
                <span class="info-label">Operation Date</span>
                <span class="info-value">${formatDate(company.operation_date)}</span>
            </div>
        </div>
        
        <div class="sector-info-card">
            <h3>Sector Information</h3>
            <div class="info-row">
                <span class="info-label">Sector Name</span>
                <span class="info-value">${escapeHtml(sector.sector_name)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Sector ID</span>
                <span class="info-value">${sector.sector_id}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Sector Radius</span>
                <span class="info-value">${sector.sector_radius_km ? sector.sector_radius_km + ' km' : 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Parent Sector</span>
                <span class="info-value">${sector.parent_sector_id || 'None'}</span>
            </div>
        </div>
    `;
    
    if (!document.querySelector('.close-details-btn')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-details-btn';
        closeBtn.setAttribute('aria-label', 'Close company details');
        closeBtn.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        closeBtn.onclick = closeDetails;
        elements.companyDetailsSection.appendChild(closeBtn);
    }
    
    elements.companyDetailsSection.style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('details-active');
}

function closeDetails() {
    elements.companyDetailsSection.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('details-active');
    const closeBtn = document.querySelector('.close-details-btn');
    if (closeBtn) closeBtn.remove();
}

function showLoading() {
    elements.loadingState.style.display = 'block';
    elements.searchButton.disabled = true;
}

function hideLoading() {
    elements.loadingState.style.display = 'none';
    elements.searchButton.disabled = elements.searchInput.value.trim().length === 0;
}

function hideDetails() {
    elements.companyDetailsSection.style.display = 'none';
    document.body.style.overflow = '';
    const closeBtn = document.querySelector('.close-details-btn');
    if (closeBtn) closeBtn.remove();
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorState.style.display = 'block';
    hideLoading();
}

function hideError() {
    elements.errorState.style.display = 'none';
}

async function performSearch() {
    const input = elements.searchInput.value.trim();
    if (!input) return;
    
    // Just filter the table - no need for API call
    filterCompaniesBySearch(input);
    
    // Scroll to table
    scrollToTable();
}

// ==================== EDIT FUNCTIONALITY ====================

/**
 * Open the edit form with company data
 */
async function openEditForm(cibId, companyName) {
    debugLog(`Opening edit form for: ${companyName} (${cibId})`);
    
    try {
        // First, fetch the full company details
        const url = `${CONFIG.API_BASE_URL}/company_info/${encodeURIComponent(companyName)}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load company details (Status ${response.status})`);
        }
        
        const data = await response.json();
        const company = data.company;
        const sector = data.sector;
        
        // Store current edit data
        state.currentEditCompany = {
            cib_id: company.cib_id,
            original_data: { ...company, sector_id: sector.sector_id }
        };
        
        // Populate form fields
        elements.editCompanyName.textContent = company.company_name;
        elements.editCompanyNameInput.value = company.company_name || '';
        elements.editCibId.value = company.cib_id || '';
        elements.editHqCountryId.value = company.hq_country_id || '';
        elements.editOperation.value = company.operation || '';
        
        // Format date for input field
        if (company.operation_date) {
            const date = new Date(company.operation_date);
            const formattedDate = date.toISOString().split('T')[0];
            elements.editOperationDate.value = formattedDate;
        } else {
            elements.editOperationDate.value = '';
        }
        
        elements.editSectorId.value = sector.sector_id || '';
        
        // Hide any previous messages
        elements.editSuccessMessage.style.display = 'none';
        elements.editErrorMessage.style.display = 'none';
        
        // Show edit section
        elements.companyEditSection.style.display = 'block';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('details-active');
        
    } catch (error) {
        console.error('Error loading company for edit:', error);
        showError(`Failed to load company details: ${error.message}`);
    }
}

/**
 * Close the edit form
 */
function closeEditForm() {
    debugLog('Closing edit form');
    elements.companyEditSection.style.display = 'none';
    document.body.style.overflow = '';
    document.body.classList.remove('details-active');
    state.currentEditCompany = null;
    elements.companyEditForm.reset();
}

/**
 * Handle form submission
 */
async function handleEditFormSubmit(e) {
    e.preventDefault();
    
    if (!state.currentEditCompany) {
        showEditError('No company selected for editing');
        return;
    }
    
    const cibId = state.currentEditCompany.cib_id;
    
    // Collect form data - only include fields that have changed
    const updateData = {};
    
    const companyName = elements.editCompanyNameInput.value.trim();
    if (companyName && companyName !== state.currentEditCompany.original_data.company_name) {
        updateData.company_name = companyName;
    }
    
    const hqCountryId = elements.editHqCountryId.value.trim();
    if (hqCountryId && hqCountryId !== state.currentEditCompany.original_data.hq_country_id) {
        updateData.hq_country_id = hqCountryId;
    }
    
    const operation = elements.editOperation.value;
    if (operation && operation !== state.currentEditCompany.original_data.operation) {
        updateData.operation = operation;
    }
    
    const operationDate = elements.editOperationDate.value;
    if (operationDate) {
        const originalDate = state.currentEditCompany.original_data.operation_date 
            ? new Date(state.currentEditCompany.original_data.operation_date).toISOString().split('T')[0]
            : null;
        if (operationDate !== originalDate) {
            updateData.operation_date = operationDate;
        }
    }
    
    const sectorId = elements.editSectorId.value;
    if (sectorId && parseInt(sectorId) !== state.currentEditCompany.original_data.sector_id) {
        updateData.sector_id = parseInt(sectorId);
    }
    
    // Check if there are any changes
    if (Object.keys(updateData).length === 0) {
        showEditError('No changes detected');
        return;
    }
    
    debugLog('Submitting update:', updateData);
    
    try {
        // Hide previous messages
        elements.editSuccessMessage.style.display = 'none';
        elements.editErrorMessage.style.display = 'none';
        
        // Disable submit button during request
        const submitBtn = document.getElementById('saveEditBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        
        const url = `${CONFIG.API_BASE_URL}/update_company_full/${encodeURIComponent(cibId)}`;
        console.log('PATCH URL:', url);
        console.log('Update data:', updateData);
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Update failed (Status ${response.status}): ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Update successful:', result);
        
        // Show success message
        showEditSuccess();
        
        // Reload the companies table to show updated data
        setTimeout(() => {
            loadAllCompaniesForTable();
            closeEditForm();
        }, 2000);
        
    } catch (error) {
        console.error('Error updating company:', error);
        showEditError(error.message);
    } finally {
        // Re-enable submit button
        const submitBtn = document.getElementById('saveEditBtn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Save Changes
        `;
    }
}

/**
 * Show success message
 */
function showEditSuccess() {
    elements.editSuccessMessage.style.display = 'flex';
    elements.editErrorMessage.style.display = 'none';
}

/**
 * Show error message
 */
function showEditError(message) {
    elements.editErrorText.textContent = message;
    elements.editErrorMessage.style.display = 'flex';
    elements.editSuccessMessage.style.display = 'none';
}

/**
 * Make function globally accessible for onclick in table
 */
window.editCompanyDetails = function(cibId, companyName) {
    debugLog(`Edit button clicked: ${companyName} (${cibId})`);
    openEditForm(cibId, companyName);
};

// ==================== EVENT LISTENERS ====================

// Search event listeners
elements.searchInput.addEventListener('input', handleSearchInput);
elements.searchInput.addEventListener('keydown', handleKeyboardNavigation);
elements.searchButton.addEventListener('click', performSearch);
elements.retryButton.addEventListener('click', () => {
    hideError();
    loadAllCompaniesForTable();
});

// Table event listeners
elements.itemsPerPage.addEventListener('change', (e) => {
    changeItemsPerPage(e.target.value);
});

elements.prevPageBtn.addEventListener('click', () => {
    changePage('prev');
});

elements.nextPageBtn.addEventListener('click', () => {
    changePage('next');
});

// Edit form event listeners
elements.companyEditForm.addEventListener('submit', handleEditFormSubmit);
elements.closeEditBtn.addEventListener('click', closeEditForm);
elements.cancelEditBtn.addEventListener('click', closeEditForm);

// Global event listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (elements.companyDetailsSection.style.display === 'block') {
            closeDetails();
        } else if (elements.companyEditSection.style.display === 'block') {
            closeEditForm();
        }
    }
});

// ==================== INITIALIZATION ====================

async function initializeApp() {
    debugLog('Company Search initialized');
    debugLog(`API Base URL: ${CONFIG.API_BASE_URL}`);
    
    const serverReady = await wakeUpServer();
    
    if (serverReady) {
        await loadAllCompaniesForTable();
    }
    
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        elements.searchInput.focus();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// ==================== EXPORT FOR DEBUGGING ====================

window.CompanySearch = {
    state,
    elements,
    searchCompaniesByLetter,
    getCompanyDetails,
    closeDetails,
    debugLog,
    CONFIG,
    loadAllCompaniesForTable,
    wakeUpServer,
    filterCompaniesBySearch,
    renderTable,
    openEditForm,
    closeEditForm
};