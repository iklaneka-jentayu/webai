// Admin Panel JavaScript
class GoogleSheetsAdmin {
    constructor() {
        // Configuration
        this.GOOGLE_SHEET_ID = '11BD5wrEdO_EdvKwLlttDe1cPRh9O8zIm89kwrIMfrKQ'; // Replace with your Google Sheet ID
        this.GOOGLE_API_KEY = 'AIzaSyAZTKOvYgtkChdJRMaV3knNtiuTdLLGQWw'; // Replace with your Google API Key
        this.SHEET_NAME = 'Sheet1'; // Default sheet name
        
        // Data storage
        this.submissions = [];
        this.filteredSubmissions = [];
        this.selectedSubmissions = new Set();
        
        // Pagination
        this.currentPage = 1;
        this.rowsPerPage = 25;
        this.totalPages = 1;
        
        // Sorting
        this.sortColumn = 'timestamp';
        this.sortDirection = 'desc';
        
        // Filters
        this.filters = {
            search: '',
            date: 'all',
            subject: 'all',
            status: 'all'
        };
        
        // Initialize
        this.init();
    }
    
    init() {
        // Initialize event listeners
        this.initEventListeners();
        
        // Load data from Google Sheets
        this.loadData();
        
        // Update last updated time
        this.updateLastUpdated();
    }
    
    // Initialize all event listeners
    initEventListeners() {
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadData());
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToCSV());
        
        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.filterData();
        });
        
        // Filter selects
        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.filters.date = e.target.value;
            this.filterData();
        });
        
        document.getElementById('subjectFilter').addEventListener('change', (e) => {
            this.filters.subject = e.target.value;
            this.filterData();
        });
        
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.filterData();
        });
        
        // Rows per page
        document.getElementById('rowsPerPage').addEventListener('change', (e) => {
            this.rowsPerPage = parseInt(e.target.value);
            this.currentPage = 1;
            this.renderTable();
        });
        
        // Select all checkbox
        document.getElementById('selectAll').addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });
        
        // Bulk action buttons
        document.getElementById('markReadBtn').addEventListener('click', () => this.markSelectedAsRead());
        document.getElementById('markRepliedBtn').addEventListener('click', () => this.markSelectedAsReplied());
        document.getElementById('deleteSelectedBtn').addEventListener('click', () => this.deleteSelected());
        
        // Pagination buttons
        document.getElementById('firstPage').addEventListener('click', () => this.goToPage(1));
        document.getElementById('prevPage').addEventListener('click', () => this.goToPage(this.currentPage - 1));
        document.getElementById('nextPage').addEventListener('click', () => this.goToPage(this.currentPage + 1));
        document.getElementById('lastPage').addEventListener('click', () => this.goToPage(this.totalPages));
        
        // Modal
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.querySelector('.btn-close').addEventListener('click', () => this.closeModal());
        document.getElementById('replyBtn').addEventListener('click', () => this.replyToSubmission());
        document.getElementById('markAsReadBtn').addEventListener('click', () => this.markCurrentAsRead());
        
        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = 'index.html';
            }
        });
        
        // Hamburger menu
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');
        
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.querySelector('i').classList.toggle('fa-bars');
            hamburger.querySelector('i').classList.toggle('fa-times');
        });
    }
    
    // Load data from Google Sheets
    async loadData() {
        try {
            this.showLoading(true);
            
            // Using Google Sheets API v4
			alert("Using Google Sheets API v4");
			//const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.GOOGLE_SHEET_ID}/values/${this.SHEET_NAME}?key=${this.GOOGLE_API_KEY}`;
			const url = `https://script.google.com/macros/s/AKfycbwIBnW1AyNovvo1AXfwdG3p_Py7EMN5GRnyC35neSCRFhZBtUTB0PjBRJaCJvRqPRc/exec`;
			alert("url=" + url);
            const response = await fetch(url);
            const data = await response.json();
            alert("data=" + data);
            if (data.values && data.values.length > 0) {
                this.processData(data.values);
            } else {
                this.submissions = [];
                this.showNoDataMessage();
            }
            
            this.filterData();
            this.showLoading(false);
            
        } catch (error) {
            console.error('Error loading data from Google Sheets:', error);
            this.showError('Failed to load data from Google Sheets. Please check your configuration.');
            this.showLoading(false);
            
            // Fallback: Load mock data for demonstration
            this.loadMockData();
        }
    }
    
    // Process the raw data from Google Sheets
    processData(rawData) {
        // Extract headers (first row)
        const headers = rawData[0];
        
        // Process rows
        this.submissions = rawData.slice(1).map((row, index) => {
            const submission = {
                id: index + 1,
                status: 'unread' // Default status
            };
            
            // Map each column to the corresponding header
            headers.forEach((header, colIndex) => {
                const key = header.toLowerCase().replace(/\s+/g, '_');
                submission[key] = row[colIndex] || '';
            });
            
            // Ensure all required fields exist
            if (!submission.status) {
                submission.status = 'unread';
            }
            
            return submission;
        });
        
        // Update stats
        this.updateStats();
    }
    
    // Filter data based on current filters
    filterData() {
        this.filteredSubmissions = this.submissions.filter(submission => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchFields = [
                    submission.name,
                    submission.email,
                    submission.phone,
                    submission.subject,
                    submission.message
                ].join(' ').toLowerCase();
                
                if (!searchFields.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Date filter
            if (this.filters.date !== 'all' && submission.timestamp) {
                const submissionDate = new Date(submission.timestamp);
                const today = new Date();
                
                switch (this.filters.date) {
                    case 'today':
                        if (submissionDate.toDateString() !== today.toDateString()) {
                            return false;
                        }
                        break;
                    case 'week':
                        const weekAgo = new Date(today);
                        weekAgo.setDate(today.getDate() - 7);
                        if (submissionDate < weekAgo) {
                            return false;
                        }
                        break;
                    case 'month':
                        const monthAgo = new Date(today);
                        monthAgo.setMonth(today.getMonth() - 1);
                        if (submissionDate < monthAgo) {
                            return false;
                        }
                        break;
                }
            }
            
            // Subject filter
            if (this.filters.subject !== 'all' && submission.subject) {
                if (submission.subject.toLowerCase() !== this.filters.subject.toLowerCase()) {
                    return false;
                }
            }
            
            // Status filter
            if (this.filters.status !== 'all' && submission.status) {
                if (submission.status !== this.filters.status) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Sort data
        this.sortData();
        
        // Render table
        this.renderTable();
    }
    
    // Sort data
    sortData() {
        this.filteredSubmissions.sort((a, b) => {
            let valueA = a[this.sortColumn] || '';
            let valueB = b[this.sortColumn] || '';
            
            // Convert to lowercase for case-insensitive sorting
            if (typeof valueA === 'string') valueA = valueA.toLowerCase();
            if (typeof valueB === 'string') valueB = valueB.toLowerCase();
            
            // Handle dates
            if (this.sortColumn === 'timestamp') {
                valueA = new Date(valueA).getTime();
                valueB = new Date(valueB).getTime();
            }
            
            if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    // Render the table with current data
    renderTable() {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        if (this.filteredSubmissions.length === 0) {
            this.showNoDataMessage();
            return;
        }
        
        // Calculate pagination
        this.totalPages = Math.ceil(this.filteredSubmissions.length / this.rowsPerPage);
        const startIndex = (this.currentPage - 1) * this.rowsPerPage;
        const endIndex = Math.min(startIndex + this.rowsPerPage, this.filteredSubmissions.length);
        
        // Update pagination info
        document.getElementById('startRow').textContent = startIndex + 1;
        document.getElementById('endRow').textContent = endIndex;
        document.getElementById('totalRows').textContent = this.filteredSubmissions.length;
        document.getElementById('tableCount').textContent = this.filteredSubmissions.length;
        
        // Render rows
        for (let i = startIndex; i < endIndex; i++) {
            const submission = this.filteredSubmissions[i];
            const row = this.createTableRow(submission);
            tableBody.appendChild(row);
        }
        
        // Update pagination controls
        this.updatePagination();
        
        // Hide no data message
        document.getElementById('noDataMessage').style.display = 'none';
    }
    
    // Create a table row for a submission
    createTableRow(submission) {
        const row = document.createElement('tr');
        row.className = submission.status || 'unread';
        row.dataset.id = submission.id;
        
        // Format timestamp
        const timestamp = submission.timestamp ? 
            new Date(submission.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';
        
        // Format message preview
        const messagePreview = submission.message ? 
            (submission.message.length > 50 ? 
                submission.message.substring(0, 50) + '...' : 
                submission.message) : 
            '-';
        
        // Status badge
        const statusClass = `status-${submission.status || 'unread'}`;
        const statusText = (submission.status || 'unread').charAt(0).toUpperCase() + 
                          (submission.status || 'unread').slice(1);
        
        // Newsletter badge
        const newsletterClass = submission.newsletter === 'Yes' ? 'newsletter-yes' : 'newsletter-no';
        
        row.innerHTML = `
            <td>
                <input type="checkbox" class="row-checkbox" data-id="${submission.id}">
            </td>
            <td>${timestamp}</td>
            <td>${submission.name || '-'}</td>
            <td>${submission.email || '-'}</td>
            <td>${submission.phone || '-'}</td>
            <td>${submission.subject || '-'}</td>
            <td>
                <span class="message-preview" data-id="${submission.id}">
                    ${messagePreview}
                </span>
            </td>
            <td>
                <span class="newsletter-badge ${newsletterClass}">
                    ${submission.newsletter || 'No'}
                </span>
            </td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td class="action-buttons-cell">
                <button class="action-btn view" data-id="${submission.id}" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete" data-id="${submission.id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        // Add event listeners
        row.querySelector('.row-checkbox').addEventListener('change', (e) => {
            this.toggleRowSelection(submission.id, e.target.checked);
        });
        
        row.querySelector('.message-preview').addEventListener('click', () => {
            this.viewSubmissionDetails(submission.id);
        });
        
        row.querySelector('.action-btn.view').addEventListener('click', () => {
            this.viewSubmissionDetails(submission.id);
        });
        
        row.querySelector('.action-btn.delete').addEventListener('click', () => {
            this.deleteSubmission(submission.id);
        });
        
        // Add click listener for row to view details
        row.addEventListener('click', (e) => {
            if (!e.target.closest('.action-btn') && !e.target.closest('.row-checkbox')) {
                this.viewSubmissionDetails(submission.id);
            }
        });
        
        return row;
    }
    
    // View submission details in modal
    viewSubmissionDetails(id) {
        const submission = this.submissions.find(s => s.id == id);
        if (!submission) return;
        
        // Update modal content
        document.getElementById('detailName').textContent = submission.name || '-';
        document.getElementById('detailEmail').textContent = submission.email || '-';
        document.getElementById('detailPhone').textContent = submission.phone || '-';
        document.getElementById('detailSubject').textContent = submission.subject || '-';
        document.getElementById('detailMessage').textContent = submission.message || '-';
        document.getElementById('detailNewsletter').textContent = submission.newsletter || 'No';
        
        // Format timestamp
        const timestamp = submission.timestamp ? 
            new Date(submission.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) : '-';
        document.getElementById('detailTimestamp').textContent = timestamp;
        
        // Store current submission ID
        this.currentModalSubmissionId = id;
        
        // Show modal
        document.getElementById('detailsModal').style.display = 'flex';
        
        // Mark as read when viewed
        if (submission.status === 'unread') {
            this.updateSubmissionStatus(id, 'read');
        }
    }
    
    // Close modal
    closeModal() {
        document.getElementById('detailsModal').style.display = 'none';
        this.currentModalSubmissionId = null;
    }
    
    // Toggle row selection
    toggleRowSelection(id, checked) {
        if (checked) {
            this.selectedSubmissions.add(id);
        } else {
            this.selectedSubmissions.delete(id);
            document.getElementById('selectAll').checked = false;
        }
        
        this.updateBulkActions();
    }
    
    // Toggle select all
    toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
            const id = checkbox.dataset.id;
            
            if (checked) {
                this.selectedSubmissions.add(id);
            } else {
                this.selectedSubmissions.delete(id);
            }
        });
        
        this.updateBulkActions();
    }
    
    // Update bulk actions UI
    updateBulkActions() {
        const count = this.selectedSubmissions.size;
        document.getElementById('selectedCount').textContent = count;
        
        const buttons = [
            document.getElementById('markReadBtn'),
            document.getElementById('markRepliedBtn'),
            document.getElementById('deleteSelectedBtn')
        ];
        
        buttons.forEach(btn => {
            btn.disabled = count === 0;
        });
    }
    
    // Mark selected submissions as read
    markSelectedAsRead() {
        this.selectedSubmissions.forEach(id => {
            this.updateSubmissionStatus(id, 'read');
        });
        this.selectedSubmissions.clear();
        this.updateBulkActions();
        this.filterData();
    }
    
    // Mark selected submissions as replied
    markSelectedAsReplied() {
        this.selectedSubmissions.forEach(id => {
            this.updateSubmissionStatus(id, 'replied');
        });
        this.selectedSubmissions.clear();
        this.updateBulkActions();
        this.filterData();
    }
    
    // Delete selected submissions
    deleteSelected() {
        if (this.selectedSubmissions.size === 0) return;
        
        if (confirm(`Are you sure you want to delete ${this.selectedSubmissions.size} submission(s)? This action cannot be undone.`)) {
            this.selectedSubmissions.forEach(id => {
                this.deleteSubmission(id);
            });
            this.selectedSubmissions.clear();
            this.updateBulkActions();
        }
    }
    
    // Update submission status
    updateSubmissionStatus(id, status) {
        const index = this.submissions.findIndex(s => s.id == id);
        if (index !== -1) {
            this.submissions[index].status = status;
            this.updateStats();
        }
    }
    
    // Delete a submission
    deleteSubmission(id) {
        if (confirm('Are you sure you want to delete this submission?')) {
            this.submissions = this.submissions.filter(s => s.id != id);
            this.selectedSubmissions.delete(id);
            this.filterData();
            this.updateStats();
        }
    }
    
    // Reply to current submission
    replyToSubmission() {
        const submission = this.submissions.find(s => s.id == this.currentModalSubmissionId);
        if (!submission || !submission.email) {
            alert('No email address found for this submission.');
            return;
        }
        
        const subject = encodeURIComponent(`Re: Your inquiry about ${submission.subject || 'Second-Hitch'}`);
        const body = encodeURIComponent(`Dear ${submission.name},\n\nThank you for contacting Second-Hitch.\n\n` +
                                       `Regarding your message: "${submission.message}"\n\n` +
                                       `We'll get back to you soon with a detailed response.\n\n` +
                                       `Best regards,\nThe Second-Hitch Team`);
        
        window.location.href = `mailto:${submission.email}?subject=${subject}&body=${body}`;
        
        // Mark as replied
        this.updateSubmissionStatus(this.currentModalSubmissionId, 'replied');
        this.closeModal();
    }
    
    // Mark current submission as read
    markCurrentAsRead() {
        if (this.currentModalSubmissionId) {
            this.updateSubmissionStatus(this.currentModalSubmissionId, 'read');
            this.closeModal();
            this.filterData();
        }
    }
    
    // Update stats
    updateStats() {
        const total = this.submissions.length;
        const today = new Date().toDateString();
        const todayCount = this.submissions.filter(s => {
            if (!s.timestamp) return false;
            return new Date(s.timestamp).toDateString() === today;
        }).length;
        
        const unreadCount = this.submissions.filter(s => s.status === 'unread').length;
        
        document.getElementById('totalSubmissions').textContent = total;
        document.getElementById('todaySubmissions').textContent = todayCount;
        document.getElementById('unreadSubmissions').textContent = unreadCount;
    }
    
    // Update pagination controls
    updatePagination() {
        // Update button states
        document.getElementById('firstPage').disabled = this.currentPage === 1;
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === this.totalPages;
        document.getElementById('lastPage').disabled = this.currentPage === this.totalPages;
        
        // Update page numbers
        const pageNumbers = document.getElementById('pageNumbers');
        pageNumbers.innerHTML = '';
        
        // Show up to 5 page numbers
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(this.totalPages, startPage + 4);
        
        // Adjust if we're near the end
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => this.goToPage(i));
            pageNumbers.appendChild(pageBtn);
        }
    }
    
    // Go to specific page
    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        
        this.currentPage = page;
        this.renderTable();
    }
    
    // Export to CSV
    exportToCSV() {
        if (this.filteredSubmissions.length === 0) {
            alert('No data to export.');
            return;
        }
        
        // Create CSV content
        const headers = ['ID', 'Timestamp', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Newsletter', 'Status'];
        const rows = this.filteredSubmissions.map(submission => [
            submission.id,
            submission.timestamp || '',
            submission.name || '',
            submission.email || '',
            submission.phone || '',
            submission.subject || '',
            submission.message ? `"${submission.message.replace(/"/g, '""')}"` : '',
            submission.newsletter || 'No',
            submission.status || 'unread'
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `second-hitch-submissions-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Update last updated time
    updateLastUpdated() {
        const now = new Date();
        const formattedTime = now.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        document.getElementById('lastUpdated').textContent = formattedTime;
    }
    
    // Show loading state
    showLoading(show) {
        const loadingRow = document.getElementById('loadingRow');
        if (loadingRow) {
            loadingRow.style.display = show ? '' : 'none';
        }
    }
    
    // Show no data message
    showNoDataMessage() {
        document.getElementById('noDataMessage').style.display = 'block';
        document.getElementById('tableCount').textContent = '0';
        document.getElementById('startRow').textContent = '0';
        document.getElementById('endRow').textContent = '0';
        document.getElementById('totalRows').textContent = '0';
    }
    
    // Show error message
    showError(message) {
        alert(`Error: ${message}`);
    }
    
    // Load mock data for demonstration
    loadMockData() {
        console.log('Loading mock data for demonstration...');
        
        const mockData = [
            {
                id: 1,
                timestamp: new Date().toISOString(),
                name: 'John Doe',
                email: 'john@example.com',
                phone: '(123) 456-7890',
                subject: 'General Inquiry',
                message: 'Hello, I would like to know more about your clothing bundles.',
                newsletter: 'Yes',
                status: 'unread'
            },
            {
                id: 2,
                timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '(234) 567-8901',
                subject: 'Order Question',
                message: 'I have a question about my recent order. When will it be shipped?',
                newsletter: 'No',
                status: 'read'
            },
            {
                id: 3,
                timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                name: 'Bob Johnson',
                email: 'bob@example.com',
                phone: '(345) 678-9012',
                subject: 'Sizing Help',
                message: 'Can you help me choose the right size for the casual essentials bundle?',
                newsletter: 'Yes',
                status: 'replied'
            }
        ];
        
        this.submissions = mockData;
        this.updateStats();
        this.filterData();
    }
}

// Initialize the admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const admin = new GoogleSheetsAdmin();
    
    // Make admin instance available globally for debugging
    window.adminPanel = admin;

});

