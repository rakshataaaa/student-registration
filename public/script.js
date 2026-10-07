const API_URL = '/api/students';

const studentForm = document.getElementById('student-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formMessage = document.getElementById('form-message');
const studentsTbody = document.getElementById('students-tbody');

const studentIdInput = document.getElementById('student-id');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const courseInput = document.getElementById('course');

// Fetch and render students on page load
document.addEventListener('DOMContentLoaded', fetchStudents);

async function fetchStudents() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch students');
        
        const students = await response.json();
        renderStudents(students);
    } catch (err) {
        console.error(err);
        studentsTbody.innerHTML = `<tr><td colspan="6" class="loading-text error">Error loading student records.</td></tr>`;
    }
}

function renderStudents(students) {
    if (students.length === 0) {
        studentsTbody.innerHTML = `<tr><td colspan="6" class="loading-text">No registered students found.</td></tr>`;
        return;
    }

    studentsTbody.innerHTML = students.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${escapeHTML(s.name)}</td>
            <td>${escapeHTML(s.email)}</td>
            <td>${escapeHTML(s.phone)}</td>
            <td>${escapeHTML(s.course)}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editStudent(${s.id}, '${escapeQuote(s.name)}', '${escapeQuote(s.email)}', '${escapeQuote(s.phone)}', '${escapeQuote(s.course)}')">Edit</button>
                <button class="action-btn delete-btn" onclick="deleteStudent(${s.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Handle Form Submit (Create or Update)
studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = studentIdInput.value;
    const studentData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        course: courseInput.value.trim()
    };

    // Basic client-side validation
    if (!studentData.name || !studentData.email || !studentData.phone || !studentData.course) {
        showMessage('Please fill out all fields.', 'error');
        return;
    }

    try {
        const url = id ? `${API_URL}/${id}` : API_URL;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Something went wrong');

        showMessage(result.message, 'success');
        resetForm();
        fetchStudents();
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

// Edit Student: Populate form
window.editStudent = function(id, name, email, phone, course) {
    studentIdInput.value = id;
    nameInput.value = name;
    emailInput.value = email;
    phoneInput.value = phone;
    courseInput.value = course;

    formTitle.textContent = 'Edit Student Record';
    submitBtn.textContent = 'Update Student';
    cancelBtn.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Cancel Edit Mode
cancelBtn.addEventListener('click', resetForm);

function resetForm() {
    studentForm.reset();
    studentIdInput.value = '';
    formTitle.textContent = 'Register New Student';
    submitBtn.textContent = 'Register Student';
    cancelBtn.style.display = 'none';
}

// Delete Student
window.deleteStudent = async function(id) {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to delete student');

        showMessage(result.message, 'success');
        fetchStudents();
    } catch (err) {
        showMessage(err.message, 'error');
    }
};

function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = `message ${type}`;
    setTimeout(() => {
        formMessage.textContent = '';
        formMessage.className = 'message';
    }, 4000);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function escapeQuote(str) {
    return str.replace(/'/g, "\\'");
}