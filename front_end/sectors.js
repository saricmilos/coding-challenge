/**
 * Sectors View Functionality
 * © 2025 Miloš Sarić. All rights reserved.
 * Handles sector search, filtering, and display
 */

// Configuration
const SECTORS_CONFIG = {
    API_BASE_URL: 'https://coding-challenge-ancient-surf-1603.fly.dev',
    SEARCH_DEBOUNCE: 300
};

// State management
const sectorsState = {
    allSectors: [],
    filteredSectors: [],
    currentPage: 1,
    itemsPerPage: 20,
    currentFilter: '',
    showCompanyCounts: false,
    searchDebounceTimer: null
};

// DOM Elements
const sectorsElements = {
    sectorSearchInput: document.getElementById('sectorSearchInput'),
    sectorSearchButton: document.getElementById('sectorSearchButton'),
    showCompanyCountsBtn: document.getElementById('showCompanyCountsBtn'),
    sectorsLoadingState: document.getElementById('sectorsLoadingState'),
    sectorsErrorState: document.getElementById('sectorsErrorState'),
    sectorsErrorMessage: document.getElementById('sectorsErrorMessage'),
    sectorsRetryButton: document.getElementById('sectorsRetryButton'),
    
    // Table elements
    sectorsTableLoading: document.getElementById('sectorsTableLoading'),
    sectorsTableWrapper: document.getElementById('sectorsTableWrapper'),
    sectorsTable: document.getElementById('sectorsTable'),
    sectorsTableBody: document.getElementById('sectorsTableBody'),
    sectorsTableError: document.getElementById('sectorsTableError'),
    sectorsTableErrorMessage: document.getElementById('sectorsTableErrorMessage'),
    sectorsItemsPerPage: document.getElementById('sectorsItemsPerPage'),
    sectorsTableInfo: document.getElementById('sectorsTableInfo'),
    sectorsPageInfo: document.getElementById('sectorsPageInfo'),
    sectorsPrevPageBtn: document.getElementById('sectorsPrevPageBtn'),
    sectorsNextPageBtn: document.getElementById('sectorsNextPageBtn'),
    sectorsPaginationControls: document.getElementById('sectorsPaginationControls'),
    companyCountHeader: document.getElementById('companyCountHeader')
};

// Utility: Escape HTML
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

// Debug logger
function debugLog(message, data = null) {
    console.log(`[SectorsView] ${message}`, data || '');
}

// ==================== LOAD SECTORS ====================

async function loadAllSectorsForTable() {
    debugLog('Loading all sectors for table...');
    
    try {
        sectorsElements.sectorsTableLoading.style.display = 'block';
        sectorsElements.sectorsTableWrapper.style.display = 'none';
        sectorsElements.sectorsTableError.style.display = 'none';
        sectorsElements.sectorsPaginationControls.style.display = 'none';
        
        // Determine which endpoint to use
        // When not showing counts and no filter, we need to fetch all letters or use a different approach
        let url;
        if (sectorsState.showCompanyCounts) {
            url = `${SECTORS_CONFIG.API_BASE_URL}/sectors_with_counts/`;
        } else {
            // Instead of empty letter, fetch all sectors by using a common starting letter
            // or modify to fetch all at once. For now, let's use sectors_with_counts 
            // even when counts aren't shown, then just hide the column
            url = `${SECTORS_CONFIG.API_BASE_URL}/sectors_with_counts/`;
        }
        
        console.log('Fetching sectors from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Sectors list response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to load sectors (Status ${response.status})`);
        }
        
        const data = await response.json();
        console.log('Sectors data received:', data);
        debugLog(`Loaded ${data.length} sectors`);
        
        sectorsState.allSectors = data;
        sectorsState.filteredSectors = data;
        sectorsState.currentPage = 1;
        
        renderSectorsTable();
        
    } catch (error) {
        console.error('Error loading sectors:', error);
        debugLog('Error loading sectors:', error);
        showSectorsTableError(error.message);
    } finally {
        sectorsElements.sectorsTableLoading.style.display = 'none';
    }
}

// ==================== FILTER SECTORS ====================

function filterSectorsBySearch(searchTerm) {
    if (!searchTerm || searchTerm.length === 0) {
        sectorsState.filteredSectors = sectorsState.allSectors;
    } else {
        const searchLower = searchTerm.toLowerCase();
        sectorsState.filteredSectors = sectorsState.allSectors.filter(sector => {
            const sectorName = sector.sector_name.toLowerCase();
            return sectorName.includes(searchLower);
        });
    }
    
    sectorsState.currentPage = 1;
    sectorsState.currentFilter = searchTerm;
    renderSectorsTable();
}

async function searchSectorsByLetter(letter) {
    if (!letter || letter.length === 0) {
        loadAllSectorsForTable();
        return;
    }
    
    debugLog(`Searching sectors by letter: ${letter}`);
    
    try {
        sectorsElements.sectorsLoadingState.style.display = 'block';
        sectorsElements.sectorsTableWrapper.style.display = 'none';
        sectorsElements.sectorsTableError.style.display = 'none';
        
        const endpoint = sectorsState.showCompanyCounts 
            ? `/sectors_with_counts/` 
            : `/sectors_by_letter/?letter=${encodeURIComponent(letter)}`;
        
        const url = `${SECTORS_CONFIG.API_BASE_URL}${endpoint}`;
        console.log('Fetching sectors from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to search sectors (Status ${response.status})`);
        }
        
        const data = await response.json();
        console.log('Sectors search results:', data);
        
        sectorsState.allSectors = data;
        
        // If showing counts, don't filter by letter since endpoint already handles it
        if (sectorsState.showCompanyCounts) {
            // Filter by letter client-side
            sectorsState.filteredSectors = data.filter(sector => 
                sector.sector_name.toLowerCase().includes(letter.toLowerCase())
            );
        } else {
            sectorsState.filteredSectors = data;
        }
        
        sectorsState.currentPage = 1;
        renderSectorsTable();
        
    } catch (error) {
        console.error('Error searching sectors:', error);
        showSectorsError(error.message);
    } finally {
        sectorsElements.sectorsLoadingState.style.display = 'none';
    }
}

// ==================== RENDER TABLE ====================

function renderSectorsTable() {
    const { filteredSectors, currentPage, itemsPerPage, showCompanyCounts } = sectorsState;
    
    if (!filteredSectors || filteredSectors.length === 0) {
        showSectorsTableError('No sectors found');
        return;
    }
    
    const totalPages = Math.ceil(filteredSectors.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredSectors.length);
    const pageSectors = filteredSectors.slice(startIndex, endIndex);
    
    // Toggle company count column visibility
    if (showCompanyCounts) {
        sectorsElements.companyCountHeader.classList.remove('hidden');
    } else {
        sectorsElements.companyCountHeader.classList.add('hidden');
    }
    
    // Render table rows
    sectorsElements.sectorsTableBody.innerHTML = pageSectors.map(sector => {
        const companyCountCell = showCompanyCounts 
            ? `<td><span class="company-count-badge">${sector.company_count || 0}</span></td>`
            : `<td class="hidden"></td>`;
        
        return `
            <tr>
                <td>${sector.sector_id}</td>
                <td>${escapeHtml(sector.sector_name)}</td>
                ${companyCountCell}
            </tr>
        `;
    }).join('');
    
    // Update table info
    sectorsElements.sectorsTableInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${filteredSectors.length} sectors`;
    
    // Update pagination
    sectorsElements.sectorsPageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    sectorsElements.sectorsPrevPageBtn.disabled = currentPage === 1;
    sectorsElements.sectorsNextPageBtn.disabled = currentPage === totalPages;
    
    // Show table
    sectorsElements.sectorsTableWrapper.style.display = 'block';
    sectorsElements.sectorsPaginationControls.style.display = 'flex';
    sectorsElements.sectorsTableError.style.display = 'none';
}

function showSectorsTableError(message) {
    sectorsElements.sectorsTableErrorMessage.textContent = message;
    sectorsElements.sectorsTableError.style.display = 'block';
    sectorsElements.sectorsTableWrapper.style.display = 'none';
    sectorsElements.sectorsPaginationControls.style.display = 'none';
}

function showSectorsError(message) {
    sectorsElements.sectorsErrorMessage.textContent = message;
    sectorsElements.sectorsErrorState.style.display = 'block';
    sectorsElements.sectorsLoadingState.style.display = 'none';
}

function hideSectorsError() {
    sectorsElements.sectorsErrorState.style.display = 'none';
}

// ==================== PAGINATION ====================

function changeSectorsPage(direction) {
    const totalPages = Math.ceil(sectorsState.filteredSectors.length / sectorsState.itemsPerPage);
    
    if (direction === 'next' && sectorsState.currentPage < totalPages) {
        sectorsState.currentPage++;
        renderSectorsTable();
        scrollToSectorsTable();
    } else if (direction === 'prev' && sectorsState.currentPage > 1) {
        sectorsState.currentPage--;
        renderSectorsTable();
        scrollToSectorsTable();
    }
}

function changeSectorsItemsPerPage(newItemsPerPage) {
    sectorsState.itemsPerPage = parseInt(newItemsPerPage);
    sectorsState.currentPage = 1;
    renderSectorsTable();
}

function scrollToSectorsTable() {
    const tableSection = document.querySelector('.sectors-table-section');
    if (tableSection) {
        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==================== TOGGLE COMPANY COUNTS ====================

function toggleCompanyCounts() {
    sectorsState.showCompanyCounts = !sectorsState.showCompanyCounts;
    
    // Update button appearance
    if (sectorsState.showCompanyCounts) {
        sectorsElements.showCompanyCountsBtn.classList.add('active');
        sectorsElements.showCompanyCountsBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Counts Active</span>
        `;
    } else {
        sectorsElements.showCompanyCountsBtn.classList.remove('active');
        sectorsElements.showCompanyCountsBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="9"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <span>Show Counts</span>
        `;
    }
    
    // Reload data with appropriate endpoint
    loadAllSectorsForTable();
}

// ==================== EVENT HANDLERS ====================

function handleSectorSearchInput(e) {
    const input = e.target.value.trim();
    debugLog(`Sector search input changed: "${input}"`);
    
    if (sectorsState.searchDebounceTimer) {
        clearTimeout(sectorsState.searchDebounceTimer);
    }
    
    // Enable/disable search button
    sectorsElements.sectorSearchButton.disabled = input.length === 0;
    
    // Debounced search
    sectorsState.searchDebounceTimer = setTimeout(() => {
        if (input.length > 0) {
            searchSectorsByLetter(input);
        } else {
            loadAllSectorsForTable();
        }
    }, SECTORS_CONFIG.SEARCH_DEBOUNCE);
    
    hideSectorsError();
}

function performSectorSearch() {
    const input = sectorsElements.sectorSearchInput.value.trim();
    if (!input) return;
    
    searchSectorsByLetter(input);
    scrollToSectorsTable();
}

// ==================== EVENT LISTENERS ====================

// Search event listeners
sectorsElements.sectorSearchInput.addEventListener('input', handleSectorSearchInput);
sectorsElements.sectorSearchButton.addEventListener('click', performSectorSearch);
sectorsElements.showCompanyCountsBtn.addEventListener('click', toggleCompanyCounts);
sectorsElements.sectorsRetryButton.addEventListener('click', () => {
    hideSectorsError();
    loadAllSectorsForTable();
});

// Table event listeners
sectorsElements.sectorsItemsPerPage.addEventListener('change', (e) => {
    changeSectorsItemsPerPage(e.target.value);
});

sectorsElements.sectorsPrevPageBtn.addEventListener('click', () => {
    changeSectorsPage('prev');
});

sectorsElements.sectorsNextPageBtn.addEventListener('click', () => {
    changeSectorsPage('next');
});

// Enter key to search
sectorsElements.sectorSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        performSectorSearch();
    } else if (e.key === 'Escape') {
        sectorsElements.sectorSearchInput.blur();
    }
});

// ==================== EXPORT ====================

window.SectorsView = {
    state: sectorsState,
    elements: sectorsElements,
    loadAllSectorsForTable,
    searchSectorsByLetter,
    filterSectorsBySearch,
    renderSectorsTable,
    toggleCompanyCounts,
    debugLog,
    CONFIG: SECTORS_CONFIG
};