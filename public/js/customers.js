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

function updateStatusElement(element, newStatus) {
    element.classList.remove('status-open', 'status-processing', 'status-closed');
    element.textContent = newStatus;
    element.dataset.currentStatus = newStatus;
    const statusClass = 'status-' + newStatus.toLowerCase().replace(' ', '-');
    element.classList.add(statusClass);
}

document.addEventListener("DOMContentLoaded", () => {
    // Değişken tanımlamaları
    const closeFilterModal = document.getElementById("closeFilterModal");
    const deleteBtn = document.querySelector('.btn-delete');
    const deleteModal = document.getElementById("deleteModal");
    const messageModal = document.getElementById("messageModal");
    const messageText = document.getElementById("messageText");
    const addCustomerBtn = document.getElementById("addCustomerBtn");
    const addCustomerModal = document.getElementById("addCustomerModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const addCustomerForm = document.getElementById("addCustomerForm");
    const filterModal = document.getElementById('filterModal');
    const filterButton = document.querySelector('.btn-outline');
    const refreshButton = document.querySelector('.btn-refresh');
    const applyFiltersBtn = document.getElementById('apply-filters');
    
    let selectedCustomerId = null;
    let selectedCustomerCard = null;
    let isDeleteMode = false;

    // Silme işlemleri
    function setupDeleteFunctionality() {
        // Silme butonuna tıklama
        deleteBtn.addEventListener('click', toggleDeleteMode);
        
        // Silme onayı
        document.getElementById("confirmDelete").addEventListener("click", confirmDelete);
        
        // Silme iptali
        document.getElementById("cancelDelete").addEventListener("click", () => {
            deleteModal.style.display = "none";
        });
        
        // Modal dışına tıklama
        window.addEventListener("click", (event) => {
            if (event.target === deleteModal) {
                deleteModal.style.display = "none";
            }
        });
    }

    function toggleDeleteMode() {
        isDeleteMode = !isDeleteMode;
        
        if (isDeleteMode) {
            deleteBtn.classList.add('delete-active');
            document.querySelectorAll('.trash-button').forEach(button => {
                button.style.display = 'block';
            });
        } else {
            deleteBtn.classList.remove('delete-active');
            document.querySelectorAll('.trash-button').forEach(button => {
                button.style.display = 'none';
            });
        }
        
        // Silme butonlarına event listener ekle
        addDeleteListeners();
    }

    function addDeleteListeners() {
        document.querySelectorAll(".trash-button").forEach(button => {
            // Önce mevcut listener'ları kaldır
            button.removeEventListener("click", handleDeleteClick);
            // Yeni listener ekle
            button.addEventListener("click", handleDeleteClick);
        });
    }

    function handleDeleteClick(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const customerCard = event.currentTarget.closest(".customer-card");
        selectedCustomerId = customerCard.getAttribute("data-id");
        selectedCustomerCard = customerCard;
        deleteModal.style.display = "flex";
    }

    async function confirmDelete() {
        if (!selectedCustomerId) return;
        
        try {
            const response = await fetch(`/customers/${selectedCustomerId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                selectedCustomerCard.remove();
                showMessage("Müşteri başarıyla silindi", true);
                resetDeleteMode();
            } else {
                showMessage("Silme işlemi başarısız oldu.", false);
            }
        } catch (error) {
            console.error("Silme hatası:", error);
            showMessage("Bir hata oluştu", false);
        }
        
        deleteModal.style.display = "none";
    }

    function resetDeleteMode() {
        isDeleteMode = false;
        deleteBtn.classList.remove('delete-active');
        document.querySelectorAll('.trash-button').forEach(button => {
            button.style.display = 'none';
        });
    }

    // Mesaj gösterimi
    function showMessage(message, isSuccess) {
        messageText.textContent = message;
        messageText.style.color = isSuccess ? 'green' : 'red';
        messageModal.style.display = "flex";
        
        // 3 saniye sonra otomatik kapat
        setTimeout(() => {
            messageModal.style.display = "none";
        }, 3000);
    }

    // Diğer fonksiyonlar
    function setupModalFunctionality() {
        // Müşteri ekleme modalı
        addCustomerBtn.addEventListener("click", () => {
            addCustomerModal.style.display = "flex";
        });

        closeModalBtn.addEventListener("click", () => {
            addCustomerModal.style.display = "none";
        });

        addCustomerForm.addEventListener("submit", async (event) => {
            event.preventDefault();
        
            const name = document.getElementById("name").value;
            const password = document.getElementById("password").value;
            const email = document.getElementById("email").value;
            const company = document.getElementById("company").value;
            const department = document.getElementById("department").value;
        
            const newCustomer = {
                name,
                password,
                email,
                company,
                department,
            };
            try {
                const response = await fetch("/customers", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(newCustomer),
                });
                if (response.ok) {
                    const data = await response.json();
                    showMessage("Müşteri başarıyla eklendi", true); // showMessageModal yerine showMessage kullanılıyor
                    addCustomerModal.style.display = "none";
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showMessage("Müşteri ekleme başarısız oldu", false); // showMessageModal yerine showMessage
                }
            } catch (error) {
                console.error("Hata:", error);
                showMessage("Bir hata oluştu", false); // showMessageModal yerine showMessage
            }
        });

        // Filtre modalı
        if (filterButton) {
            filterButton.addEventListener('click', () => {
                filterModal.style.display = 'flex';
            });
        }

        if (closeFilterModal) {
            closeFilterModal.addEventListener("click", () => {
                filterModal.style.display = "none";
                messageModal.style.display = "none";
            });
        }

        // Modal dışına tıklama
        window.addEventListener("click", (event) => {
            if (event.target === addCustomerModal) {
                addCustomerModal.style.display = "none";
            }
            if (event.target === filterModal) {
                filterModal.style.display = "none";
            }
            if (event.target === messageModal) {
                messageModal.style.display = "none";
            }
        });
    }

    function setupFilterFunctionality() {
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                window.history.pushState({}, '', '/customers');
                window.location.reload();
            });
        }

        document.querySelectorAll('.filter-item').forEach(filter => {
            filter.addEventListener('click', function (event) {
                event.preventDefault();
                this.classList.toggle('active');
            });
        });

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener("click", function (event) {
                event.preventDefault();
        const selectedDepartments = [];
        const selectedCompanies = [];
        const selectedFilterTypes = [];
        const selectedSort = [];
        const idFilter = document.getElementById('id').value;

        if (idFilter) {
            window.location.href = `/customers/id/${idFilter}`;
            return;
        }

        document.querySelectorAll('.filter-column .filter-item.active').forEach(item => {

            const category = item.closest('.filter-column').querySelector('h3').textContent.toLowerCase();
            const value = item.getAttribute('data-filter');

            if (category.includes('department')) {
                selectedDepartments.push(value);
            } else if (category.includes('company')) {
                selectedCompanies.push(value);
            } else if (category.includes('added date') || category.includes('date')) {
                selectedFilterTypes.push(value);
            } else if (category.includes('sort')) {
                selectedSort.push(value);
           }
        });

        const filterDisplay = document.getElementById('selectedFilters');

        if (filterDisplay) {
            filterDisplay.innerHTML = '';

            selectedDepartments.forEach(department => {
                filterDisplay.innerHTML += `<span>${department} (Departman)</span><br>`;
            });

            selectedCompanies.forEach(company => {
                filterDisplay.innerHTML += `<span>${company} (Şirket)</span><br>`;
            });

            selectedFilterTypes.forEach(filterType => {
                filterDisplay.innerHTML += `<span>${filterType} (Tarih)</span><br>`;
            });

            selectedSort.forEach(sort => {
                filterDisplay.innerHTML += `<span>${sort} (Sıralama)</span><br>`;
            });
        }

        const queryParams = new URLSearchParams();

        if (selectedDepartments.length) queryParams.append("department", selectedDepartments.join(","));

        if (selectedCompanies.length) queryParams.append("company", selectedCompanies.join(","));

        if (selectedFilterTypes.length) queryParams.append("filterType", selectedFilterTypes.join(","));

        if (selectedSort.length) queryParams.append("sort", selectedSort.join(","));

        if (queryParams.toString()) {
            window.location.href = `/customers/filter?${queryParams.toString()}`;
        }});
        }}

    function setupTicketStatusUpdates() {
        document.querySelectorAll('.ticket-status').forEach(statusElement => {
            statusElement.dataset.currentStatus = statusElement.textContent.trim();
            
            statusElement.addEventListener('click', function(e) {
                e.preventDefault();
                const ticketId = this.closest('.ticket-item').getAttribute('data-ticket-id');
                const currentStatus = this.textContent.trim();
                const statusOrder = ["Open", "Processing", "Closed"];
                const currentIndex = statusOrder.indexOf(currentStatus);
                const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
                
                updateStatusElement(this, nextStatus);
                updateTicketStatus(ticketId, nextStatus);
            });
        });
    }

    // Tüm fonksiyonları başlat
    setupDeleteFunctionality();
    setupModalFunctionality();
    setupFilterFunctionality();
    setupTicketStatusUpdates();
    
    // İlk yüklemede silme butonlarını gizle
    document.querySelectorAll('.trash-button').forEach(button => {
        button.style.display = 'none';
    });
});