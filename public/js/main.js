// Toggle sidebar
document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar')?.classList.toggle('active');
});

// Format currency VND
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Auto-hide alerts after 3s
document.querySelectorAll('.alert-dismissible').forEach(alert => {
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    }, 3000);
});

// Confirm delete
function confirmDelete(url, name) {
    if (confirm(`Bạn có chắc muốn xóa "${name}" không?`)) {
        window.location.href = url;
    }
}
