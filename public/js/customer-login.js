        // Tarih ve saat güncellemesi (saniyede bir)
        function updateDateTime() {
            const now = new Date();
            const options = { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            document.getElementById('datetime').textContent = now.toLocaleDateString('tr-TR', options);
        }
        // Sayfa yüklendiğinde ve her saniyede bir tarih/saat güncelle
        updateDateTime();
        setInterval(updateDateTime, 1000);

        // Dropdown aç/kapa fonksiyonu
        function toggleDropdown(element) {
            const dropdownMenu = element.nextElementSibling;
            const isOpen = dropdownMenu.classList.contains('show');
            
            // Tüm dropdown menüleri kapat
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
            
            // Eğer tıklanan menü kapalıysa aç
            if (!isOpen) {
                dropdownMenu.classList.add('show');
                // Dropdown menüyü görünür hale getir
                setTimeout(() => {
                    dropdownMenu.style.transform = 'translateY(0)';
                }, 10);
            }
        }

        // Dropdown item seçme fonksiyonu
        function selectItem(element, value) {
            const dropdownMenu = element.parentElement;
            const dropdownToggle = dropdownMenu.previousElementSibling;
            const selectedValueSpan = dropdownToggle.querySelector('.selected-value');
            
            // Önceki seçimleri temizle
            dropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            // Yeni seçimi işaretle
            element.classList.add('selected');
            
            // Seçilen değeri göster
            selectedValueSpan.textContent = value;
            dropdownToggle.classList.add('active');
            
            // Dropdown'u kapat
            dropdownMenu.classList.remove('show');
        }

        // Sayfa dışına tıklandığında dropdown'ları kapat
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
            });
        }
    });
       
        // Ticket gönderme fonksiyonu
        async function submitTicket() {
            const submitBtn = document.querySelector('.submit-btn');
            submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Processing...';
            submitBtn.disabled = true;

            if (document.querySelector('.submit-btn.processing')) return;
    
            lockSubmitButton();
        
            try {
                const title = document.getElementById('ticket-title').value.trim();
                const description = document.getElementById('description').value.trim();
                const department = document.querySelector('#priority-dropdown .selected-value').textContent;
                const priority = document.querySelectorAll('.dropdown')[1].querySelector('.selected-value').textContent;
                const category = document.querySelectorAll('.dropdown')[2].querySelector('.selected-value').textContent;
        
                // Daha detaylı doğrulama
                if (!title || title.length < 5) {
                    throw new Error('Başlık en az 5 karakter olmalıdır');
                }
                if (!description || description.length < 10) {
                    throw new Error('Açıklama en az 10 karakter olmalıdır');
                }
                if (department === 'Select department') {
                    throw new Error('Departman seçmelisiniz');
                }
                if (priority === 'Select priority') {
                    throw new Error('Öncelik seçmelisiniz');
                }
                if (category === 'Select category') {
                    throw new Error('Kategori seçmelisiniz');
                }
        
                // Müşteri bilgilerini EJS'den al
                const customerName = document.getElementById('customer-name').value;
                const customerEmail = document.getElementById('customer-email').value;
        
                const ticketData = {
                    name: customerName,
                    email: customerEmail,
                    ticket: {
                        title,
                        department,
                        description,
                        priority,
                        category
                    }
                };
        
                // API'ye POST isteği gönder
                const response = await fetch('/tickets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(ticketData)
                });
        
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ticket oluşturulamadı');
                }
        
                // Başarılıysa sayfayı yenile
                window.location.reload();
        
            } catch (error) {
                console.error('Hata:', error);
                alert(error.message);
                submitBtn.innerHTML = 'Submit Ticket';
                submitBtn.disabled = false;
            } finally {
                // Sadece sayfa yenilenmediyse kilidi aç
                if (!window.location.href.includes('reload=true')) {
                    unlockSubmitButton();
                }
            }
        }


        // Submit butonunu kilitleyen fonksiyon
        function lockSubmitButton() {
            const submitBtn = document.querySelector('.submit-btn');
            submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Processing...';
            submitBtn.disabled = true;
            submitBtn.classList.add('processing');
        }

        // Submit butonunun kilidini açan fonksiyon
        function unlockSubmitButton() {
            const submitBtn = document.querySelector('.submit-btn');
            submitBtn.innerHTML = 'Submit Ticket';
            submitBtn.disabled = false;
            submitBtn.classList.remove('processing');
        }

        // Dropdown değerlerini kontrol etmek için yardımcı fonksiyon
        function getSelectedDropdownValue(dropdownIndex) {
            const dropdown = document.querySelectorAll('.dropdown')[dropdownIndex];
            const selectedValue = dropdown.querySelector('.selected-value');
            
            // Eğer seçim yapılmamışsa veya default text seçiliyse
            if (!selectedValue.dataset.value || 
                selectedValue.textContent.includes('Select')) {
                return null;
            }
            
            return selectedValue.textContent;
        }

        // Kullanımı:
        const department = getSelectedDropdownValue(0);
        const priority = getSelectedDropdownValue(1);
        const category = getSelectedDropdownValue(2);

        // Hata mesajlarını göstermek için modal
        function showErrorModal(message) {
            const modal = document.createElement('div');
            modal.className = 'error-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <p>${message}</p>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            modal.querySelector('.close-modal').onclick = () => {
                modal.remove();
            };
            
            setTimeout(() => {
                modal.remove();
            }, 5000);
        }