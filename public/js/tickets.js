// Ticket durumunu güncelleme fonksiyonu
function updateTicketStatus(ticketId, newStatus) {
    fetch(`/tickets/${ticketId}/status`, { 
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (!data.succeeded) {
            throw new Error('Status update failed on server');
        }
        const statusElement = document.querySelector(`tr[data-ticket-id="${ticketId}"] .status`);
        if (statusElement) {
            updateStatusElement(statusElement, data.ticket.status);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Status güncellenirken hata oluştu: ' + error.message);
        
        const statusElement = document.querySelector(`tr[data-ticket-id="${ticketId}"] .status`);
        if (statusElement) {
            const currentStatus = statusElement.dataset.currentStatus;
            updateStatusElement(statusElement, currentStatus);
        }
    });
}

// Status elementini güncelleme fonksiyonu
function updateStatusElement(element, newStatus) {
    if (!element || !newStatus) return;

    // Tüm durum class'larını temizle (hem tireli hem tiresiz)
    element.className = element.className
        .split(' ')
        .filter(cls => !['open', 'processing', 'closed', 'status-open', 'status-processing', 'status-closed'].includes(cls))
        .join(' ');

    // Temel class'ı ve yeni durumu ekle
    element.classList.add('status', newStatus.toLowerCase());
    element.textContent = newStatus;
    element.dataset.currentStatus = newStatus;
}

// Status güncelleme işlevini kurma (hem admin hem kullanıcı sayfaları için)
function setupStatusUpdates(selector) {
    const statusElements = document.querySelectorAll(selector);
    
    statusElements.forEach(statusElement => {
        // Mevcut durumu kaydet
        statusElement.dataset.currentStatus = statusElement.textContent.trim();
        
        statusElement.addEventListener('click', function(e) {
            e.preventDefault();
            
            const row = this.closest('tr');
            if (!row) {
                console.error("TR elementi bulunamadı!");
                return;
            }
            
            const ticketId = row.getAttribute('data-ticket-id');
            if (!ticketId) {
                console.error("Ticket ID bulunamadı");
                return;
            }
            
            const currentStatus = this.textContent.trim();
            const statusOrder = ["Open", "Processing", "Closed"];
            const currentIndex = statusOrder.indexOf(currentStatus);
            
            if (currentIndex === -1) {
                console.error("Geçersiz durum:", currentStatus);
                return;
            }
            
            const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
            
            updateStatusElement(this, nextStatus);
            updateTicketStatus(ticketId, nextStatus);
        });
    });
}

// Diğer yardımcı fonksiyonlar
function getTicketId(element) {
    if (!element) return null;
    const row = element.closest('tr');
    return row ? row.getAttribute('data-ticket-id') : null;
}

function getNextStatus(currentStatus) {
    const statusOrder = ["Open", "Processing", "Closed"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    return currentIndex >= 0 ? statusOrder[(currentIndex + 1) % statusOrder.length] : currentStatus;
}

// Yardımcı tarih dönüştürme fonksiyonu
function parseDate(dateStr) {
    // Tarih formatlama hatalarını önle
    if (!dateStr) return new Date(0);
    
    try {
        // Doğrudan Date nesnesine dönüştürmeyi dene
        const date = new Date(dateStr);
        
        // Geçerli bir tarih ise kullan
        if (!isNaN(date.getTime())) {
            return date;
        }
        
        // Özel formatlar için parçalama işlemleri
        // Formata göre uyarla
        const parts = dateStr.split(/[.\-/\s:]/);
        
        // Türkçe tarih formatı kontrolü (GG.AA.YYYY)
        if (parts.length >= 3) {
            // Ay değerini 0-11 aralığına çevir
            const month = parseInt(parts[1]) - 1;
            return new Date(parts[2], month, parts[0]);
        }
    } catch (e) {
        console.error("Tarih ayrıştırma hatası:", e);
    }
    
    // Varsayılan olarak şimdiki zamanı döndür
    return new Date();
}

// DOM yüklendiğinde çalışacak ana fonksiyon
document.addEventListener('DOMContentLoaded', function() {

    const filterToggleBtn = document.getElementById('filterToggleBtn');
    if (filterToggleBtn) {
        filterToggleBtn.addEventListener('click', function() {
            const filterPanel = document.getElementById('filterPanel');
            if (filterPanel) filterPanel.classList.toggle('active');
            
            const tableContainer = document.getElementById('tableContainer');
            if (tableContainer) tableContainer.classList.toggle('with-filter');
        });
    }

    const isAdminPage = document.querySelector('.recent-tickets-table') !== null;
    const isTicketsPage = document.querySelector('.tickets-table') !== null;

    if (isAdminPage) {
        setupStatusUpdates('.recent-tickets-table .status');
    } 
    else if (isTicketsPage) {
        
        // Debug: Önce HTML'deki tabloyu logla
        const ticketRows = document.querySelectorAll('.tickets-table tbody tr');
        
        // Tüm bilet verilerini yükle
        const allTickets = Array.from(ticketRows).map(row => {
            // Hücre sayısını kontrol et
            if (row.cells.length < 8) {
                console.warn("Yetersiz sayıda hücre:", row);
            }
            
            // Değerleri doğru şekilde al ve debug için logla
            const priorityValue = row.cells[7] ? row.cells[7].textContent.trim() : '';
            const categoryValue = row.cells[8] ? row.cells[8].textContent.trim() : '';
            
            return {
                id: row.getAttribute('data-ticket-id'),
                status: row.cells[1] ? row.cells[1].textContent.trim() : '',
                date: row.cells[2] ? row.cells[2].textContent.trim() : '',
                name: row.cells[3] ? row.cells[3].textContent.trim() : '',
                email: row.cells[4] ? row.cells[4].textContent.trim() : '',
                title: row.cells[5] ? row.cells[5].textContent.trim() : '',
                department: row.cells[6] ? row.cells[6].textContent.trim() : '',
                priority: priorityValue,
                category: categoryValue
            };
        });
        
        // Filtreleme sistemini kur
        initializeFilterSystem(allTickets);
        
        // Status güncellemelerini ayarla
        setupStatusUpdates('.tickets-table .status');
    }
    else {
        console.log("Bilinmeyen sayfa tipi");
    }
});

// Filtreleme sistemini başlatma fonksiyonu
function initializeFilterSystem(allTickets) {
    // Benzersiz filtre değerlerini bul
    const uniqueCompanies = [...new Set(allTickets.map(ticket => ticket.category))].filter(Boolean);
    const uniqueDepartments = [...new Set(allTickets.map(ticket => ticket.department))].filter(Boolean);
    const uniquePriorities = [...new Set(allTickets.map(ticket => ticket.priority))].filter(Boolean);
    
    // Şirket filtre butonlarını oluştur
    const companyFilterContainer = document.querySelector('.quick-filter-grid');
    if (companyFilterContainer) {
        companyFilterContainer.innerHTML = '';
        
        // All butonu
        const allBtn = document.createElement('button');
        allBtn.className = 'filter-all-btn active';
        allBtn.textContent = 'ALL';
        allBtn.setAttribute('data-filter', 'all');
        companyFilterContainer.appendChild(allBtn);
        
        // Şirket butonları
        uniqueCompanies.forEach(company => {
            const btn = document.createElement('button');
            btn.className = 'quick-filter-panel-btn';
            btn.textContent = company;
            btn.setAttribute('data-filter', company);
            companyFilterContainer.appendChild(btn);
        });
    }
    
    // Departman filtre butonlarını oluştur
    const departmentFilterSection = document.createElement('div');
    departmentFilterSection.className = 'filter-section';
    
    const departmentTitle = document.createElement('h3');
    departmentTitle.textContent = 'Department';
    departmentFilterSection.appendChild(departmentTitle);
    
    const departmentFilters = document.createElement('div');
    departmentFilters.className = 'department-filters';
    
    // All departman butonu
    const allDeptBtn = document.createElement('button');
    allDeptBtn.className = 'department-filter-btn active';
    allDeptBtn.textContent = 'ALL';
    allDeptBtn.setAttribute('data-department', 'all');
    departmentFilters.appendChild(allDeptBtn);
    
    // Departman butonları
    uniqueDepartments.forEach(department => {
        const btn = document.createElement('button');
        btn.className = 'department-filter-btn';
        btn.textContent = department;
        btn.setAttribute('data-department', department);
        departmentFilters.appendChild(btn);
    });
    
    departmentFilterSection.appendChild(departmentFilters);
    
    // Öncelik filtre butonlarını kontrol et ve güncelle
    const priorityFilterSection = document.querySelector('.priority-filters');
    if (priorityFilterSection) {
        // Mevcut butonları kaldır
        priorityFilterSection.innerHTML = '';
        
        // All öncelik butonu
        const allPriorityBtn = document.createElement('button');
        allPriorityBtn.className = 'priority-filter-btn active';
        allPriorityBtn.textContent = 'ALL';
        allPriorityBtn.setAttribute('data-priority', 'all');
        priorityFilterSection.appendChild(allPriorityBtn);
        
        // Öncelik butonları - veritabanından gelen değerleri kullan
        uniquePriorities.forEach(priority => {
            const btn = document.createElement('button');
            btn.className = 'priority-filter-btn';
            btn.textContent = priority;
            btn.setAttribute('data-priority', priority);
            priorityFilterSection.appendChild(btn);
            
        });

    } else {
        console.warn("Öncelik filtre bölümü bulunamadı!");
    }
    
    // Departman filtresini sayfaya ekle
    if (priorityFilterSection && priorityFilterSection.closest('.filter-section')?.parentNode) {
        priorityFilterSection.closest('.filter-section')?.parentNode.insertBefore(
            departmentFilterSection, 
            priorityFilterSection.closest('.filter-section')
        );
    }
    
    // Filtreleme işlevlerini başlat
    setupFilterEvents(allTickets);
}

// Filtre event'lerini ayarlama fonksiyonu
function setupFilterEvents(allTickets) {
    // Aktif filtreler
    const activeFilters = {
        category: 'all',
        department: 'all',
        priority: 'all',
        sort: null,
        id: '',
        name: '',
        email: '',
        title: ''
    };
    
    // Filtre buton event'leri
    document.querySelectorAll('.quick-filter-panel-btn, .filter-all-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.quick-filter-panel-btn, .filter-all-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            activeFilters.category = this.getAttribute('data-filter');
            applyFilters(allTickets, activeFilters);
        });
    });
    
    document.querySelectorAll('.department-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.department-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            activeFilters.department = this.getAttribute('data-department');
            applyFilters(allTickets, activeFilters);
        });
    });
    
    document.querySelectorAll('.priority-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            
            document.querySelectorAll('.priority-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            activeFilters.priority = this.getAttribute('data-priority');
            applyFilters(allTickets, activeFilters);
        });
    });
    
    document.querySelectorAll('.sort-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            
            document.querySelectorAll('.sort-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            activeFilters.sort = this.getAttribute('data-sort');
            applyFilters(allTickets, activeFilters);
        });
    });
    
    // Arama input'ları
    document.querySelectorAll('.search-filter-group input').forEach(input => {
        input.addEventListener('input', function() {
            const fieldId = this.id;
            const searchValue = this.value.trim().toLowerCase();
            
            if (fieldId === 'filterById') activeFilters.id = searchValue;
            else if (fieldId === 'filterByName') activeFilters.name = searchValue;
            else if (fieldId === 'filterByEmail') activeFilters.email = searchValue;
            else if (fieldId === 'filterByTitle') activeFilters.title = searchValue;
            
            applyFilters(allTickets, activeFilters);
        });
    });
    
    // Filtreleri uygula butonu
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            activeFilters.id = document.getElementById('filterById').value.trim().toLowerCase();
            activeFilters.name = document.getElementById('filterByName').value.trim().toLowerCase();
            activeFilters.email = document.getElementById('filterByEmail').value.trim().toLowerCase();
            activeFilters.title = document.getElementById('filterByTitle').value.trim().toLowerCase();
            applyFilters(allTickets, activeFilters);
        });
    }
    
    // Filtreleri sıfırla butonu
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            // Filtreleri sıfırla
            Object.keys(activeFilters).forEach(key => {
                if (key === 'category' || key === 'department' || key === 'priority') {
                    activeFilters[key] = 'all';
                } else if (key === 'sort') {
                    activeFilters[key] = null;
                } else {
                    activeFilters[key] = '';
                }
            });
            
            // UI'yı sıfırla
            resetFilterUI();
            applyFilters(allTickets, activeFilters);
        });
    }
}

// Filtre UI'sını sıfırlama fonksiyonu
function resetFilterUI() {
    // Butonları sıfırla
    document.querySelectorAll('.filter-all-btn, .department-filter-btn[data-department="all"], .priority-filter-btn[data-priority="all"]')
        .forEach(btn => btn.classList.add('active'));
    
    document.querySelectorAll('.quick-filter-panel-btn, .department-filter-btn:not([data-department="all"]), .priority-filter-btn:not([data-priority="all"]), .sort-filter-btn')
        .forEach(btn => btn.classList.remove('active'));
    
    // Input'ları temizle
    document.getElementById('filterById').value = '';
    document.getElementById('filterByName').value = '';
    document.getElementById('filterByEmail').value = '';
    document.getElementById('filterByTitle').value = '';
}

// Filtreleme uygulama fonksiyonu
function applyFilters(allTickets, activeFilters) {
    if (!allTickets || allTickets.length === 0) {
        console.error("Bilet verisi yüklenmedi!");
        return;
    }
        
    // Önceki boş sonuç mesajını temizle
    const existingEmptyRow = document.querySelector('.empty-results');
    if (existingEmptyRow) existingEmptyRow.remove();
    
    const rows = document.querySelectorAll('.tickets-table tbody tr');
    
    // Tüm satırları gizle
    rows.forEach(row => row.style.display = 'none');
    
    // Filtrele
    let filteredTickets = allTickets.filter(ticket => {
        // Debug: Her ticket için kıyaslama sonuçlarını logla
        const categoryMatch = activeFilters.category === 'all' || 
                           ticket.category.toLowerCase() === activeFilters.category.toLowerCase();
        
        const departmentMatch = activeFilters.department === 'all' || 
                             ticket.department.toLowerCase() === activeFilters.department.toLowerCase();
        
        const priorityMatch = activeFilters.priority === 'all' || 
                           ticket.priority.toLowerCase() === activeFilters.priority.toLowerCase();
        
        const idMatch = !activeFilters.id || 
                     ticket.id.toLowerCase().includes(activeFilters.id.toLowerCase());
        
        const nameMatch = !activeFilters.name || 
                       ticket.name.toLowerCase().includes(activeFilters.name.toLowerCase());
        
        const emailMatch = !activeFilters.email || 
                        ticket.email.toLowerCase().includes(activeFilters.email.toLowerCase());
        
        const titleMatch = !activeFilters.title || 
                        ticket.title.toLowerCase().includes(activeFilters.title.toLowerCase());
        
        // Debug: Kritik bir eşleşme olmazsa logla
        if (activeFilters.priority !== 'all' && !priorityMatch) {
            console.log(`Öncelik eşleşmedi - Ticket: ${ticket.id}, Öncelik: ${ticket.priority}, Filter: ${activeFilters.priority}`);
        }
        
        return categoryMatch && departmentMatch && priorityMatch && 
               idMatch && nameMatch && emailMatch && titleMatch;
    });
        
    // Sıralama işlemi
    if (activeFilters.sort) {
        filteredTickets.sort((a, b) => {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            
            return activeFilters.sort === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }
    
    // Mevcut satırları bir haritada saklayalım
    const rowsMap = new Map();
    document.querySelectorAll('.tickets-table tbody tr').forEach(row => {
        rowsMap.set(row.getAttribute('data-ticket-id'), row);
    });
    
    const tableBody = document.querySelector('.tickets-table tbody');
    tableBody.innerHTML = ''; // Temizle

    filteredTickets.forEach(ticket => {
        const row = document.createElement('tr');
        row.setAttribute('data-ticket-id', ticket.id);
    
    // Hücreleri oluştur (mevcut HTML yapısına uygun şekilde)
    const cells = [
        ticket.id, ticket.status, ticket.date, ticket.name, 
        ticket.email, ticket.title, ticket.department, 
        ticket.priority, ticket.category
    ];
    
    cells.forEach(cellText => {
        const td = document.createElement('td');
        td.textContent = cellText;
        
        if (cellText === ticket.status) {
            td.className = 'status';
            updateStatusElement(td, ticket.status);
        }
        row.appendChild(td);
    });
    
    tableBody.appendChild(row);

    setTimeout(() => {
        document.querySelectorAll('.status').forEach(el => {
            // Zorunlu reflow tetikleme
            void el.offsetHeight;
            
            // Class'ları yeniden uygula
            const status = el.textContent.trim();
            el.className = 'status';
            el.classList.add(`status-${status.toLowerCase()}`);
        });
    }, 0);
});

// Status güncellemelerini yeniden ayarla
setupStatusUpdates('.tickets-table .status');
    
    // Boş sonuç mesajı
    if (filteredTickets.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-results';
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 9;
        emptyCell.textContent = 'Filtrelere uygun sonuç bulunamadı.';
        emptyCell.style.textAlign = 'center';
        emptyCell.style.padding = '30px';
        emptyRow.appendChild(emptyCell);
        tableBody.appendChild(emptyRow);
    }
    
    // Sonuç sayısını göster
    const resultCount = document.getElementById('resultCount');
    if (resultCount) {
        resultCount.textContent = `${filteredTickets.length} sonuç bulundu`;
    }// Sayfaya geçici bir style elementi ekleyelim
const styleElement = document.createElement('style');
styleElement.textContent = `
  .status { 
    padding: 5px 10px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    display: inline-block;
  }
  .status-open { background-color: #e3f7df; color: #2e7d32; }
  .status-processing { background-color: #fff8e1; color: #ff8f00; }
  .status-closed { background-color: #ffebee; color: #c62828; }
`;
document.head.appendChild(styleElement);
}