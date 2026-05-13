// Dynamically match the hostname (localhost or 127.0.0.1) to avoid cookie/CORS issues
const BACKEND_BASE_URL = `http://${window.location.hostname}:3000`;
const API_URL = `${BACKEND_BASE_URL}/api`;

// State
let user = null;
let currentComplaint = {
    text: '',
    aiQuestion: '',
    userAnswer: ''
};

// Selectors
const appContent = document.getElementById('content');
const mainNav = document.getElementById('main-nav');
const navMyComplaints = document.getElementById('nav-my-complaints');
const navAdminDashboard = document.getElementById('nav-admin-dashboard');
const logoutBtn = document.getElementById('logout-btn');
const toastContainer = document.getElementById('toast-container');

// --- Utilities ---

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    // Credentials true for cookies
    options.credentials = 'include';

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Something went wrong');
        return data;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

function render(templateId) {
    const template = document.getElementById(templateId);
    const clone = template.content.cloneNode(true);
    appContent.innerHTML = '';
    appContent.appendChild(clone);
}

// --- Auth Check ---

async function checkSession() {
    try {
        const userData = await apiCall('/auth/me');
        user = userData;
        updateUI();
        if (user.role === 'admin') {
            navigateTo('admin-dashboard');
        } else {
            navigateTo('my-complaints');
        }
    } catch (error) {
        user = null;
        updateUI();
        navigateTo('login');
    }
}

function updateUI() {
    if (user) {
        mainNav.classList.remove('hidden');
        if (user.role === 'admin') {
            navAdminDashboard.classList.remove('hidden');
            navMyComplaints.classList.add('hidden');
        } else {
            navAdminDashboard.classList.add('hidden');
            navMyComplaints.classList.remove('hidden');
        }
    } else {
        mainNav.classList.add('hidden');
    }
}

// --- Navigation ---

function navigateTo(page) {
    switch (page) {
        case 'register':
            render('register-template');
            setupRegisterForm();
            break;
        case 'otp':
            render('otp-template');
            setupOTPForm();
            break;
        case 'password-setup':
            render('password-setup-template');
            setupPasswordForm();
            break;
        case 'login':
            render('login-template');
            setupLoginForm();
            break;
        case 'my-complaints':
            render('my-complaints-template');
            loadMyComplaints();
            break;
        case 'submit-complaint':
            render('submit-complaint-template');
            setupComplaintForm();
            break;
        case 'admin-dashboard':
            render('admin-dashboard-template');
            loadAllComplaints();
            break;
    }
}

// --- Form Handlers ---

function setupRegisterForm() {
    const form = document.getElementById('register-form');
    const goToLogin = document.getElementById('go-to-login');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        try {
            await apiCall('/auth/send-otp', 'POST', { name, email });
            localStorage.setItem('pendingEmail', email);
            showToast('OTP sent to your email.');
            navigateTo('otp');
        } catch (err) { }
    });

    goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('login');
    });
}

function setupOTPForm() {
    const form = document.getElementById('otp-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = document.getElementById('otp-code').value;
        localStorage.setItem('pendingOTP', otp);
        navigateTo('password-setup');
    });
}

function setupPasswordForm() {
    const form = document.getElementById('password-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('setup-password').value;
        const confirm = document.getElementById('confirm-password').value;

        if (password !== confirm) {
            return showToast('Passwords do not match.', 'error');
        }

        const email = localStorage.getItem('pendingEmail');
        const otp = localStorage.getItem('pendingOTP');

        try {
            await apiCall('/auth/register', 'POST', { email, otp, password });
            showToast('Registration successful! Please login.');
            localStorage.removeItem('pendingEmail');
            localStorage.removeItem('pendingOTP');
            navigateTo('login');
        } catch (err) { }
    });
}

function setupLoginForm() {
    const form = document.getElementById('login-form');
    const goToRegister = document.getElementById('go-to-register');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const userData = await apiCall('/auth/login', 'POST', { email, password });
            user = userData;
            showToast(`Welcome back, ${user.name}!`);
            updateUI();
            if (user.role === 'admin') navigateTo('admin-dashboard');
            else navigateTo('my-complaints');
        } catch (err) { }
    });

    goToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('register');
    });
}

// --- Complaints Logic ---

async function loadMyComplaints() {
    document.getElementById('new-complaint-btn').addEventListener('click', () => navigateTo('submit-complaint'));
    const list = document.getElementById('complaints-list');

    try {
        const complaints = await apiCall('/complaints/my');
        if (complaints.length === 0) {
            list.innerHTML = '<p class="subtitle">No complaints submitted yet.</p>';
            return;
        }

        list.innerHTML = complaints.map(c => `
            <div class="complaint-card">
                <div class="complaint-header">
                    <span>ID: #${c.id}</span>
                    <span>${new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <p class="complaint-text">${c.complaintText}</p>
                <div class="ai-section">
                    <p class="ai-q">Q: ${c.aiQuestion}</p>
                    <p class="user-a">A: ${c.userAnswer}</p>
                </div>
            </div>
        `).join('');
    } catch (err) { }
}

function setupComplaintForm() {
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const getAiBtn = document.getElementById('get-ai-question-btn');
    const finalSubmitBtn = document.getElementById('final-submit-btn');

    getAiBtn.addEventListener('click', async () => {
        const text = document.getElementById('complaint-text').value;
        if (!text) return showToast('Please enter your complaint.', 'error');

        getAiBtn.disabled = true;
        getAiBtn.textContent = 'Generating...';

        try {
            const data = await apiCall('/ai/question', 'POST', { complaint_text: text });
            currentComplaint.text = text;
            currentComplaint.aiQuestion = data.question;

            document.getElementById('ai-question-display').textContent = data.question;
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
        } catch (err) {
            getAiBtn.disabled = false;
            getAiBtn.textContent = 'Next: AI Follow-up';
        }
    });

    finalSubmitBtn.addEventListener('click', async () => {
        const answer = document.getElementById('user-answer').value;
        if (!answer) return showToast('Please answer the follow-up question.', 'error');

        finalSubmitBtn.disabled = true;

        try {
            await apiCall('/complaints', 'POST', {
                complaint_text: currentComplaint.text,
                ai_question: currentComplaint.aiQuestion,
                user_answer: answer
            });
            showToast('Complaint submitted successfully!');
            navigateTo('my-complaints');
        } catch (err) {
            finalSubmitBtn.disabled = false;
        }
    });
}

async function loadAllComplaints() {
    const list = document.getElementById('admin-complaints-list');
    try {
        const complaints = await apiCall('/admin/complaints');
        if (complaints.length === 0) {
            list.innerHTML = '<p class="subtitle">No complaints in the system.</p>';
            return;
        }

        list.innerHTML = complaints.map(c => `
            <div class="admin-complaint-row">
                <div class="user-info">
                    <span class="user-name">${c.userName}</span>
                    <span class="user-email">${c.userEmail}</span>
                    <span class="user-email" style="margin-left: auto">${new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p class="complaint-text"><strong>Issue:</strong> ${c.complaintText}</p>
                <div class="ai-section">
                    <p class="ai-q">AI Q: ${c.aiQuestion}</p>
                    <p class="user-a">User A: ${c.userAnswer}</p>
                </div>
            </div>
        `).join('');
    } catch (err) { }
}

// --- Event Listeners ---

navMyComplaints.addEventListener('click', () => navigateTo('my-complaints'));
navAdminDashboard.addEventListener('click', () => navigateTo('admin-dashboard'));

logoutBtn.addEventListener('click', async () => {
    try {
        await apiCall('/auth/logout', 'POST');
        user = null;
        updateUI();
        navigateTo('login');
        showToast('Logged out successfully.');
    } catch (err) { }
});

// Init
checkSession();
