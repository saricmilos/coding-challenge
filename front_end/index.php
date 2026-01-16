<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Dark Mode Fix -->
    <script>
    (function() {
        const savedTheme = localStorage.getItem('theme-preference');
        if (savedTheme === 'dark' || 
            (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark-mode');
        }
    })();
    </script>
  
    <!-- Cookie Utilities -->
    <script src="/js/cookies-utils.js"></script>
    
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
    <title>Company Search | Miloš Sarić</title>
    <meta name="description" content="Search and explore company information with our intelligent company database">
    
    <!-- Theme color for mobile browsers -->
    <meta name="theme-color" content="#000000">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

    <!-- Open Graph meta tags -->
    <meta property="og:title" content="Company Search | Miloš Sarić">
    <meta property="og:description" content="Search and explore company information">
    <meta property="og:url" content="https://saricmilos.com/company-search/">
    <meta property="og:type" content="website">
    
    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Company Search - Explore Companies">
    <meta name="twitter:description" content="Intelligent company database search">

    <!-- Canonical TAG -->
    <link rel="canonical" href="https://saricmilos.com/company-search/" />
    
    <!-- Global CSS -->
    <?php include $_SERVER['DOCUMENT_ROOT'] . '/PHP/global-css.php'; ?>  

    <!-- Company Search CSS -->
    <link rel="stylesheet" href="company-search.css?v=3">

    <!-- Company Search Table CSS -->
    <link rel="stylesheet" href="company-search-table.css?v=1">

    <!-- Company Search Edit CSS -->
    <link rel="stylesheet" href="company-search-edit.css?v=1">

    <!-- Add Company Modal CSS -->
    <link rel="stylesheet" href="add-company-modal.css?v=1">

    <!-- Sidebar CSS -->
    <link rel="stylesheet" href="sidebar.css?v=1">

    <!-- Sectors CSS -->
    <link rel="stylesheet" href="sectors.css?v=1">

    <!-- DARK MODE Company Search CSS -->
    <link rel="stylesheet" href="company-search-dark.css?v=3">
    

</head>

<body>

    <!-- Server Wake-up Notification -->
    <div id="serverWakeupNotification" class="server-wakeup-overlay">
        <div class="wakeup-content">
            <div class="wakeup-spinner"></div>
            <h2>PLEASE WAIT</h2>
            <p>Server is waking up...</p>
            <div class="pulse-animation"></div>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-content" id="mainContent">
        <!-- Navigation Header -->
        <?php include $_SERVER['DOCUMENT_ROOT'] . '/PHP/header.php'; ?>

        <!-- Breadcrumbs -->
        <?php include $_SERVER['DOCUMENT_ROOT'] . '/PHP/breadcrumbs.php'; ?>

        <!-- Sidebar Navigation -->
        <div class="sidebar-container">
            <!-- Mobile Toggle Button -->
            <button class="sidebar-toggle-mobile" id="sidebarToggle" aria-label="Toggle sidebar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>

            <!-- Sidebar -->
            <aside class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <h2>Navigation</h2>
                    <button class="sidebar-close" id="sidebarClose" aria-label="Close sidebar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <nav class="sidebar-nav">
                    <button class="sidebar-nav-item active" data-view="companies">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span>Companies</span>
                    </button>
                    
                    <button class="sidebar-nav-item" data-view="sectors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                            <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                        </svg>
                        <span>Sectors</span>
                    </button>
                </nav>
            </aside>

            <!-- Sidebar Overlay for Mobile -->
            <div class="sidebar-overlay" id="sidebarOverlay"></div>
        </div>

        <!-- Main Content Wrapper -->
        <div class="content-wrapper">
            <!-- COMPANIES VIEW -->
            <div id="companiesView" class="view-content active">
                <!-- Minimal ChatGPT-Style Search Section -->
                <section class="chatgpt-section">
                    <div class="chatgpt-container">
                        <!-- Minimal Text Above -->
                        <div class="minimal-header">
                            <h1>Search for a company</h1>
                            <p class="subtitle">Type a letter to see matching companies</p>
                        </div>

                        <!-- Search Box -->
                        <div class="search-box-wrapper">
                            <div class="search-input-container">
                                <input 
                                    type="text" 
                                    id="companySearchInput" 
                                    class="minimal-search-input" 
                                    placeholder="Start typing a company name (e.g., 'Apple')..."
                                    autocomplete="off"
                                >
                                <button id="searchButton" class="send-button" disabled aria-label="Search companies">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                </button>
                                <button id="addCompanyBtn" class="add-company-btn" aria-label="Add new company">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 5v14M5 12h14"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            <!-- Dropdown for company list -->
                            <div id="companyDropdown" class="minimal-dropdown" style="display: none;"></div>
                        </div>

                        <!-- Loading State -->
                        <div id="loadingState" class="minimal-loading" style="display: none;">
                            <div class="loading-spinner"></div>
                            <p>Searching companies...</p>
                        </div>

                        <!-- Error State -->
                        <div id="errorState" class="minimal-error" style="display: none;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <h3>Unable to fetch companies</h3>
                            <p id="errorMessage">Please try again or check your connection</p>
                            <button id="retryButton" class="retry-button">Try Again</button>
                        </div>
                    </div>
                </section>

                <!-- Companies Table Section -->
                <section class="companies-table-section">
                    <div class="companies-container">
                        <div class="section-header">
                            <h2>Browse Companies</h2>
                            <p class="section-subtitle">Explore our database of companies and their sector information</p>
                        </div>

                        <!-- Table Controls -->
                        <div class="table-controls">
                            <div class="items-per-page">
                                <label for="itemsPerPage">Items per page:</label>
                                <select id="itemsPerPage" class="items-select">
                                    <option value="10">10</option>
                                    <option value="20" selected>20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                            <div class="table-info">
                                <span id="tableInfo">Showing 0 of 0 companies</span>
                            </div>
                        </div>
                        
                        <!-- Loading State for Companies Table -->
                        <div id="companiesTableLoading" class="companies-table-loading">
                            <div class="loading-spinner"></div>
                            <p>Loading companies...</p>
                        </div>

                        <!-- Companies Table -->
                        <div id="companiesTableWrapper" class="table-wrapper" style="display: none;">
                            <table id="companiesTable" class="companies-table">
                                <thead>
                                    <tr>
                                        <th>Company Name</th>
                                        <th>CIB ID</th>
                                        <th>Country</th>
                                        <th>Operation</th>
                                        <th>Sector</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="companiesTableBody">
                                    <!-- Companies will be dynamically inserted here -->
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination Controls -->
                        <div id="paginationControls" class="pagination-controls" style="display: none;">
                            <button id="prevPageBtn" class="page-btn" disabled>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                                Previous
                            </button>
                            <span id="pageInfo" class="page-info">Page 1 of 1</span>
                            <button id="nextPageBtn" class="page-btn" disabled>
                                Next
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>

                        <!-- Error State for Companies Table -->
                        <div id="companiesTableError" class="companies-table-error" style="display: none;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <h3>Unable to load companies</h3>
                            <p id="companiesTableErrorMessage">Please try again later</p>
                        </div>
                    </div>
                </section>
            </div>

            <!-- SECTORS VIEW -->
            <div id="sectorsView" class="view-content">
                <!-- Sectors Search Section -->
                <section class="sectors-search-section">
                    <div class="sectors-container">
                        <div class="minimal-header">
                            <h1>Search for a sector</h1>
                            <p class="subtitle">Type to filter sectors by name</p>
                        </div>

                        <!-- Search Box -->
                        <div class="search-box-wrapper">
                            <div class="search-input-container">
                                <input 
                                    type="text" 
                                    id="sectorSearchInput" 
                                    class="minimal-search-input" 
                                    placeholder="Start typing a sector name (e.g., 'Technology')..."
                                    autocomplete="off"
                                >
                                <button id="sectorSearchButton" class="send-button" disabled aria-label="Search sectors">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <path d="m21 21-4.35-4.35"></path>
                                    </svg>
                                </button>
                                <button id="showCompanyCountsBtn" class="show-counts-btn" aria-label="Show company counts">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="9" y1="9" x2="15" y2="9"></line>
                                        <line x1="9" y1="15" x2="15" y2="15"></line>
                                    </svg>
                                    Show Counts
                                </button>
                            </div>
                        </div>

                        <!-- Loading State -->
                        <div id="sectorsLoadingState" class="minimal-loading" style="display: none;">
                            <div class="loading-spinner"></div>
                            <p>Searching sectors...</p>
                        </div>

                        <!-- Error State -->
                        <div id="sectorsErrorState" class="minimal-error" style="display: none;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <h3>Unable to fetch sectors</h3>
                            <p id="sectorsErrorMessage">Please try again or check your connection</p>
                            <button id="sectorsRetryButton" class="retry-button">Try Again</button>
                        </div>
                    </div>
                </section>

                <!-- Sectors Table Section -->
                <section class="sectors-table-section">
                    <div class="sectors-container">
                        <div class="section-header">
                            <h2>Browse Sectors</h2>
                            <p class="section-subtitle">Explore all sectors in our database</p>
                        </div>

                        <!-- Table Controls -->
                        <div class="table-controls">
                            <div class="items-per-page">
                                <label for="sectorsItemsPerPage">Items per page:</label>
                                <select id="sectorsItemsPerPage" class="items-select">
                                    <option value="10">10</option>
                                    <option value="20" selected>20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                            <div class="table-info">
                                <span id="sectorsTableInfo">Showing 0 of 0 sectors</span>
                            </div>
                        </div>
                        
                        <!-- Loading State -->
                        <div id="sectorsTableLoading" class="sectors-table-loading">
                            <div class="loading-spinner"></div>
                            <p>Loading sectors...</p>
                        </div>

                        <!-- Sectors Table -->
                        <div id="sectorsTableWrapper" class="table-wrapper" style="display: none;">
                            <table id="sectorsTable" class="sectors-table">
                                <thead>
                                    <tr>
                                        <th>Sector ID</th>
                                        <th>Sector Name</th>
                                        <th id="companyCountHeader">Company Count</th>
                                    </tr>
                                </thead>
                                <tbody id="sectorsTableBody">
                                    <!-- Sectors will be dynamically inserted here -->
                                </tbody>
                            </table>
                        </div>

                        <!-- Pagination Controls -->
                        <div id="sectorsPaginationControls" class="pagination-controls" style="display: none;">
                            <button id="sectorsPrevPageBtn" class="page-btn" disabled>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                                Previous
                            </button>
                            <span id="sectorsPageInfo" class="page-info">Page 1 of 1</span>
                            <button id="sectorsNextPageBtn" class="page-btn" disabled>
                                Next
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>

                        <!-- Error State -->
                        <div id="sectorsTableError" class="sectors-table-error" style="display: none;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <h3>Unable to load sectors</h3>
                            <p id="sectorsTableErrorMessage">Please try again later</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>

        <!-- Company Details Section (Full Screen Takeover) -->
        <div id="companyDetailsSection" style="display: none;">
            <div class="results-header-cell">
                <h2>Company Details</h2>
                <p id="selectedCompanyName" class="results-subtitle"></p>
            </div>

            <!-- Company details will be dynamically inserted here -->
            <div id="companyDetailsContent"></div>
        </div>

        <!-- Company Edit Section (Full Screen Takeover) -->
        <div id="companyEditSection" style="display: none;">
            <div class="edit-header">
                <h2>Edit Company</h2>
                <p id="editCompanyName" class="edit-subtitle"></p>
            </div>

            <div id="companyEditContent">
                <form id="companyEditForm" class="company-edit-form">
                    <div class="form-section">
                        <h3>Company Information</h3>
                        
                        <div class="form-group">
                            <label for="editCompanyNameInput" class="form-label">Company Name</label>
                            <input 
                                type="text" 
                                id="editCompanyNameInput" 
                                class="form-input"
                                placeholder="Enter company name"
                            >
                        </div>

                        <div class="form-group">
                            <label for="editCibId" class="form-label">CIB ID</label>
                            <input 
                                type="text" 
                                id="editCibId" 
                                class="form-input"
                                readonly
                                disabled
                            >
                            <small class="form-hint">CIB ID cannot be changed</small>
                        </div>

                        <div class="form-group">
                            <label for="editHqCountryId" class="form-label">Headquarters Country</label>
                            <input 
                                type="text" 
                                id="editHqCountryId" 
                                class="form-input"
                                placeholder="Enter country code (e.g., US, GB)"
                            >
                        </div>

                        <div class="form-group">
                            <label for="editOperation" class="form-label">Operation Status</label>
                            <select id="editOperation" class="form-select">
                                <option value="">Select status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Pending">Pending</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="editOperationDate" class="form-label">Operation Date</label>
                            <input 
                                type="date" 
                                id="editOperationDate" 
                                class="form-input"
                            >
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>Sector Information</h3>
                        
                        <div class="form-group">
                            <label for="editSectorId" class="form-label">Sector ID</label>
                            <input 
                                type="number" 
                                id="editSectorId" 
                                class="form-input"
                                placeholder="Enter sector ID"
                                min="1"
                            >
                            <small class="form-hint">Enter a valid sector ID from the database</small>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" id="cancelEditBtn" class="btn-secondary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Cancel
                        </button>
                        <button type="submit" id="saveEditBtn" class="btn-primary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Save Changes
                        </button>
                    </div>
                </form>

                <!-- Success Message -->
                <div id="editSuccessMessage" class="edit-message success" style="display: none;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>Company updated successfully!</span>
                </div>

                <!-- Error Message -->
                <div id="editErrorMessage" class="edit-message error" style="display: none;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span id="editErrorText">An error occurred</span>
                </div>
            </div>

            <!-- Close Button -->
            <button class="close-edit-btn" id="closeEditBtn" aria-label="Close edit form">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>

        <!-- Add Company Modal -->
        <?php include 'add-company-modal.php'; ?>

        <!-- Back to Top Button -->
        <button id="backToTop" class="button-glassy floating-top-btn">Back to Top</button>

        <!-- Cookie Consent Banner -->
        <?php include $_SERVER['DOCUMENT_ROOT'] . '/PHP/cookie-consent-banner.php'; ?>

        <!-- Footer -->
        <?php include $_SERVER['DOCUMENT_ROOT'] . '/PHP/footer.php'; ?>
    </div>
    
    <!-- JavaScript Files -->
    <?php include $_SERVER['DOCUMENT_ROOT'] . '/PHP/global-js.php'; ?>

    <!-- Company Search JavaScript -->
    <script src="company-search.js?v=5"></script>

    <!-- Add Company Modal JavaScript -->
    <script src="add-company-modal.js?v=1"></script>

    <!-- Sidebar JavaScript -->
    <script src="sidebar.js?v=1"></script>

    <!-- Sectors JavaScript -->
    <script src="sectors.js?v=1"></script>
</body>
</html>