//add hovered class to selected list item 

let list = document.querySelectorAll(".navigation li");

function activeLink() {
    list.forEach((item) => {
        item.classList.remove("hovered");
    });
    this.classList.add("hovered");
}
list.forEach((item) => item.addEventListener("mouseover", activeLink));


// menu toggle 
let toggle = document.querySelector(".toggle");
let navigation = document.querySelector(".navigation");
let main = document.querySelector(".main");

document.addEventListener('DOMContentLoaded', function() {
    navigation.classList.add("active");
    main.classList.add("active");

    // Customer row click event
    document.querySelectorAll('.recentCustomers tr.customer-row').forEach(row => {
        // Styling
        row.style.cursor = 'pointer';
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        // Click event
        row.addEventListener('click', function(e) {
            // Eğer bir bağlantıya tıklanmadıysa devam et
            if (e.target.tagName !== 'A') {
                const customerId = this.getAttribute('data-customer-id');
                if (customerId) {
                    window.location.href = `/customers/id/${customerId}`;
                }
            }
        });
    });
});

function checkScreenSize() {
    if (window.innerWidth <= 991) {  
        navigation.classList.remove("active");
        main.classList.remove("active");
    } else {
        // Büyük ekranlarda kapalı durumda başlasın
        navigation.classList.add("active");
        main.classList.add("active");
    }
};

toggle.onclick = function () {
    navigation.classList.toggle("active");
    main.classList.toggle("active");
};

window.addEventListener("resize", checkScreenSize);
checkScreenSize();



