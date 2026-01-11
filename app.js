// TodayInClass - Main Application Logic

class TodayInClassApp {
    constructor() {
        this.state = {
            currentUser: null,
            classes: [],
            dailyUpdates: [],
            activeTab: 'classes',
            selectedDate: this.getTodayDate(),
            isDynamicTeacher: false // Track if parent is actually a teacher
        };

        this.unsubscribers = [];
    }

    // Initialize the application
    async init() {
        console.log('🚀 App: Initializing TodayInClass...');

        console.log('🔍 App: Checking redirect result...');
        await authManager.getRedirectResult();
        // Initialize authentication

        console.log('🔧 App: Setting up auth listener...');
        authManager.init((user) => {
            console.log('📞 App: Auth callback received', user ? `User: ${user.email}` : 'No user');
            this.state.currentUser = user;
            if (user) {
                console.log('✅ App: User authenticated, showing app...');
                this.showApp();
                this.loadData();
            } else {
                console.log('🔓 App: No user, showing login...');
                this.showLogin();
            }
        });

        // Set up event listeners
        console.log('🎯 App: Setting up event listeners...');
        this.setupEventListeners();
        console.log('✅ App: Initialization complete');
    }

    // Get today's date in YYYY-MM-DD format
    getTodayDate() {
        return this.formatDateISO(new Date());
    }

    // Format date to ISO YYYY-MM-DD without UTC shift
    formatDateISO(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '-';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-IN', options);
    }

    // Format date compactly (e.g. 05 Jan)
    formatDateSmall(dateString) {
        if (!dateString) return '-';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short'
        });
    }

    // Show login screen
    showLogin() {
        console.log('🔓 App: Showing login screen');
        document.getElementById('loginContainer').classList.add('active');
        document.getElementById('appContainer').classList.remove('active');
    }

    // Show main app
    showApp() {
        console.log('✅ App: Showing main app interface');
        document.getElementById('loginContainer').classList.remove('active');
        document.getElementById('appContainer').classList.add('active');
        console.log('👤 App: Rendering user info...');
        this.renderUserInfo();
        console.log('🧭 App: Rendering navigation...');
        this.renderNavigation();

        // Ensure the correct tab content is visible on load
        this.switchTab(this.state.activeTab);

        console.log('✅ App: Main app displayed');
    }

    // Set up event listeners
    setupEventListeners() {
        // Google Sign-In
        const googleBtn = document.getElementById('googleSignInBtn');
        if (googleBtn) {
            console.log('✅ App: Google Sign-In button found');
            googleBtn.addEventListener('click', () => {
                console.log('🖱️ App: Google Sign-In button clicked');
                authManager.signInWithGoogle().catch(error => {
                    console.error('❌ App: Sign-in failed in click handler:', error);
                    alert('Sign-in failed: ' + error.message);
                });
            });
        } else {
            console.error('❌ App: Google Sign-In button NOT found in DOM');
        }

        // Sign out
        document.getElementById('signOutBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to sign out?')) {
                authManager.signOut();
            }
        });

        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add Class button
        const addClassBtn = document.getElementById('addClassBtn');
        if (addClassBtn) {
            addClassBtn.addEventListener('click', () => this.openAddClassModal());
        }

        // Add Update button
        const addUpdateBtn = document.getElementById('addUpdateBtn');
        if (addUpdateBtn) {
            addUpdateBtn.addEventListener('click', () => this.openAddUpdateModal());
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.remove('active');
            });
        });

        // Class form submit
        document.getElementById('classForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddClass();
        });

        // Update form submit
        document.getElementById('updateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddUpdate();
        });

        // Homework checkbox
        document.getElementById('hasHomework').addEventListener('change', (e) => {
            const homeworkDescGroup = document.getElementById('homeworkDescGroup');
            homeworkDescGroup.style.display = e.target.checked ? 'block' : 'none';
        });

        // Date filter
        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.state.selectedDate = e.target.value;
            this.renderDailyUpdates();
        });

        // Update modal: class or date change should refresh periods
        document.getElementById('updateClass').addEventListener('change', () => this.updatePeriodSelection());
        document.getElementById('updateDate').addEventListener('change', () => this.updatePeriodSelection());

        // Update modal: period selection should set the hidden subject field and check for existing updates
        document.getElementById('updatePeriod').addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            const subjectName = selectedOption ? selectedOption.dataset.subjectName : '';
            document.getElementById('updateSubject').value = subjectName;
            this.checkForExistingUpdate();
        });

        // Report filter listeners
        document.getElementById('reportClass').addEventListener('change', () => this.renderReports());
        document.getElementById('reportView').addEventListener('change', () => this.renderReports());
        document.getElementById('reportDate').addEventListener('change', () => this.renderReports());
    }

    // Render user info in header
    renderUserInfo() {
        const user = this.state.currentUser;
        if (!user) return;

        const roleToDisplay = this.state.isDynamicTeacher ? 'teacher' : user.role;

        document.getElementById('userAvatar').src = user.photoURL || 'https://via.placeholder.com/36';
        document.getElementById('userName').textContent = user.displayName || user.email;
        document.getElementById('userRole').textContent = roleToDisplay;
    }

    // Render navigation based on role
    renderNavigation() {
        const user = this.state.currentUser;
        if (!user) return;

        const isActuallyTeacher = authManager.isTeacher() || this.state.isDynamicTeacher;

        // Show/hide tabs based on role
        const classesTabBtn = document.querySelector('[data-tab="classes"]');
        const updatesTabBtn = document.querySelector('[data-tab="updates"]');

        if (!isActuallyTeacher) {
            if (classesTabBtn) classesTabBtn.style.display = 'none';
            if (updatesTabBtn) updatesTabBtn.style.display = 'none';
            if (this.state.activeTab === 'classes' || this.state.activeTab === 'updates') {
                this.switchTab('reports');
            }
        } else {
            if (classesTabBtn) classesTabBtn.style.display = 'inline-flex';
            if (updatesTabBtn) updatesTabBtn.style.display = 'inline-flex';
        }
    }

    // Switch between tabs
    switchTab(tabName) {
        this.state.activeTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });

        // Render content for active tab
        if (tabName === 'classes') {
            this.renderClasses();
        } else if (tabName === 'updates') {
            this.renderDailyUpdates();
        } else if (tabName === 'reports') {
            this.renderReports();
        } else if (tabName === 'profile') {
            this.renderProfile();
        }
    }

    // Load data from Firestore
    async loadData() {
        // Load classes
        this.unsubscribers.push(
            db.collection('classes').orderBy('grade').orderBy('section')
                .onSnapshot(snapshot => {
                    this.state.classes = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    this.updateDynamicRole();
                    this.renderClasses();
                    this.updateReportFilters();
                    this.renderNavigation(); // Refresh nav display
                    this.renderUserInfo(); // Refresh header display
                })
        );

        // Load daily updates
        this.unsubscribers.push(
            db.collection('dailyUpdates').orderBy('date', 'desc').orderBy('createdAt', 'desc')
                .onSnapshot(snapshot => {
                    this.state.dailyUpdates = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    this.renderDailyUpdates();
                })
        );
    }

    // Update the dynamic role based on whether the user is assigned to any class
    updateDynamicRole() {
        if (!this.state.currentUser) return;

        const email = (this.state.currentUser.email || '').trim().toLowerCase();
        const isAssignedAsTeacher = this.state.classes.some(cls => {
            const isCreator = cls.createdBy === this.state.currentUser.uid;
            const isSubjectTeacher = cls.subjects && cls.subjects.some(s =>
                s.teacherEmail.trim().toLowerCase() === email
            );
            return isCreator || isSubjectTeacher;
        });

        this.state.isDynamicTeacher = isAssignedAsTeacher;
        console.log('👤 App: Dynamic Teacher check:', isAssignedAsTeacher);
    }

    // Render classes list
    renderClasses() {
        const container = document.getElementById('classesList');
        const user = this.state.currentUser;
        const isAdmin = authManager.isAdmin();

        // Show/hide add button based on role
        const addClassBtn = document.getElementById('addClassBtn');
        if (addClassBtn) {
            addClassBtn.style.display = isAdmin ? 'inline-flex' : 'none';
        }

        // Apply filters: Teachers should only see their own classes
        let displayClasses = this.state.classes;
        if (!isAdmin) {
            const email = (user.email || '').trim().toLowerCase();
            displayClasses = this.state.classes.filter(cls => {
                const isCreator = cls.createdBy === user.uid;
                const isSubjectTeacher = cls.subjects && cls.subjects.some(s =>
                    s.teacherEmail.trim().toLowerCase() === email
                );
                return isCreator || isSubjectTeacher;
            });
        }

        if (this.state.classes.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <div class="empty-state-title">No Classes Yet</div>
          <div class="empty-state-text">
            ${authManager.isAdmin() ? 'Click the "Add Class" button to create your first class.' : 'No classes have been created yet.'}
          </div>
        </div>
      `;
            return;
        }

        container.innerHTML = displayClasses.map(cls => {
            const isTeacherForThisClass = cls.createdBy === this.state.currentUser.uid ||
                (cls.subjects && cls.subjects.some(s => s.teacherEmail.trim().toLowerCase() === this.state.currentUser.email.trim().toLowerCase()));

            return `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">${cls.grade} - ${cls.section}</h3>
            <p style="color: var(--gray-600); font-size: 0.9rem;">Class Teacher: ${cls.classTeacherName || 'Not assigned'}</p>
          </div>
          <div class="list-item-actions">
            ${isTeacherForThisClass ? `
              <button class="btn btn-primary btn-sm" onclick="app.openAddUpdateModal('${cls.id}')">
                Add Update
              </button>
            ` : ''}
            ${authManager.isAdmin() ? `
              <button class="btn btn-secondary btn-sm" onclick="app.editClass('${cls.id}')">
                Edit
              </button>
              <button class="btn btn-danger btn-sm" onclick="app.deleteClass('${cls.id}')">
                Delete
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `}).join('');
    }

    // Render daily updates
    renderDailyUpdates() {
        const container = document.getElementById('updatesList');
        const user = this.state.currentUser;

        // Set date filter to today
        document.getElementById('dateFilter').value = this.state.selectedDate;

        // Show/hide add button based on role
        const addUpdateBtn = document.getElementById('addUpdateBtn');
        if (addUpdateBtn) {
            const isActuallyTeacher = authManager.isTeacher() || this.state.isDynamicTeacher;
            addUpdateBtn.style.display = isActuallyTeacher ? 'inline-flex' : 'none';
        }

        // Filter updates by selected date
        let filteredUpdates = this.state.dailyUpdates.filter(update =>
            update.date === this.state.selectedDate
        );

        // Sort by period number
        filteredUpdates.sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0));

        if (filteredUpdates.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-title">No Updates for ${this.formatDate(this.state.selectedDate)}</div>
          <div class="empty-state-text">
            ${authManager.isTeacher() ? 'Click the "Add Update" button to add what was taught today.' : 'No updates have been posted for this date yet.'}
          </div>
        </div>
      `;
            return;
        }

        let html = `
            <div class="report-view-container">
                <div class="report-table-wrapper">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Period / Subject</th>
                                <th>What was Taught</th>
                                <th>Homework</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        html += filteredUpdates.map(update => `
            <tr>
                <td><strong>${update.className}</strong></td>
                <td>
                    <span class="update-period-badge">P${update.periodNumber || '-'}</span>
                    <span class="report-subject">${update.subjectName}</span>
                </td>
                <td class="report-taught">${update.whatWasTaught}</td>
                <td class="report-homework">${update.hasHomework ? update.homeworkDescription : '-'}</td>
                <td>
                    ${update.teacherId === this.state.currentUser.uid ? `
                        <div class="list-item-actions">
                            <button class="btn btn-secondary btn-sm" onclick="app.editUpdate('${update.id}')">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="app.deleteUpdate('${update.id}')">Delete</button>
                        </div>
                    ` : '-'}
                </td>
            </tr>
        `).join('');

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // Render profile
    renderProfile() {
        const container = document.getElementById('profileContent');
        const user = this.state.currentUser;

        container.innerHTML = `
      <div class="card">
        <div class="card-body" style="text-align: center;">
          <img src="${user.photoURL || 'https://via.placeholder.com/120'}" 
               alt="${user.displayName}" 
               style="width: 120px; height: 120px; border-radius: 50%; margin-bottom: 1rem; border: 4px solid var(--primary-blue);">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">${user.displayName}</h2>
          <p style="color: var(--gray-600); margin-bottom: 0.5rem;">${user.email}</p>
          <span class="badge badge-primary" style="font-size: 0.9rem; padding: 0.5rem 1rem; text-transform: capitalize;">
            ${this.state.isDynamicTeacher ? 'teacher' : user.role}
          </span>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">About TodayInClass</h3>
        </div>
        <div class="card-body">
          <p style="margin-bottom: 1rem;">TodayInClass is a communication platform for Chinmaya Vidyalaya Taliparamba that connects teachers and parents.</p>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
              <strong>Version:</strong> 1.0.0
            </li>
            <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100);">
              <strong>Your Role:</strong> ${this.state.isDynamicTeacher ? 'Teacher' : (user.role.charAt(0).toUpperCase() + user.role.slice(1))}
            </li>
            <li style="padding: 0.5rem 0;">
              <strong>School:</strong> Chinmaya Vidyalaya Taliparamba
            </li>
          </ul>
          
          <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid var(--gray-100);">
            <button class="btn btn-secondary w-full" onclick="app.checkForUpdate(event)">
              <span style="margin-right: 8px;">🔄</span> Check for Updates
            </button>
            <p style="font-size: 0.75rem; color: var(--gray-500); text-align: center; margin-top: 0.5rem;">
              Click to manually refresh the app to the latest version.
            </p>
          </div>
        </div>
      </div>
    `;
    }

    // Open add class modal
    openAddClassModal() {
        document.getElementById('classForm').reset();
        document.getElementById('classModalTitle').textContent = 'Add New Class';
        document.getElementById('subjectsList').innerHTML = '';
        this.addSubjectField(); // Add one subject field by default

        // Initialize timetable grid
        this.initializeTimetableGrid();

        document.getElementById('classModal').classList.add('active');
    }

    // Initialize the timetable grid in the modal
    initializeTimetableGrid() {
        const tbody = document.getElementById('timetableInputBody');
        tbody.innerHTML = '';
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        days.forEach(day => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="day-label">${day}</td>
                ${Array.from({ length: 8 }).map((_, i) => `
                    <td><input type="text" class="timetable-input" data-day="${day}" data-period="${i + 1}" placeholder="Subject"></td>
                `).join('')}
            `;
            tbody.appendChild(row);
        });
    }

    // Open edit class modal
    async editClass(classId) {
        const cls = this.state.classes.find(c => c.id === classId);
        if (!cls) return;

        document.getElementById('classForm').reset();
        document.getElementById('classModalTitle').textContent = 'Edit Class';
        document.getElementById('classId').value = classId;
        document.getElementById('classGrade').value = cls.grade;
        document.getElementById('classSection').value = cls.section;
        document.getElementById('classTeacher').value = cls.classTeacherName || '';

        // Populate subjects
        const container = document.getElementById('subjectsList');
        container.innerHTML = '';
        if (cls.subjects && cls.subjects.length > 0) {
            cls.subjects.forEach(subject => {
                this.addSubjectField();
                const lastEntry = container.lastElementChild;
                lastEntry.querySelector('.subject-name').value = subject.name;
                lastEntry.querySelector('.teacher-name').value = subject.teacherName;
                lastEntry.querySelector('.teacher-email').value = subject.teacherEmail;
            });
        } else {
            this.addSubjectField();
        }

        // Initialize timetable grid
        this.initializeTimetableGrid();

        // Fill timetable grid
        if (cls.timetable) {
            document.querySelectorAll('.timetable-input').forEach(input => {
                const day = input.dataset.day;
                const period = input.dataset.period;
                if (cls.timetable[day] && cls.timetable[day][period]) {
                    input.value = cls.timetable[day][period];
                }
            });
        }

        document.getElementById('classModal').classList.add('active');
    }

    // Add subject field
    addSubjectField() {
        const container = document.getElementById('subjectsList');
        const index = container.children.length;

        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'subject-entry';
        subjectDiv.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.75rem; align-items: flex-start;';
        subjectDiv.innerHTML = `
      <div style="flex: 1;">
        <input type="text" class="form-input subject-name" placeholder="Subject name" required>
      </div>
      <div style="flex: 1;">
        <input type="text" class="form-input teacher-name" placeholder="Teacher name" required>
      </div>
      <div style="flex: 1;">
        <input type="email" class="form-input teacher-email" placeholder="Teacher email" required>
      </div>
      <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">×</button>
    `;

        container.appendChild(subjectDiv);
    }

    // Handle add/edit class
    async handleAddClass() {
        const classId = document.getElementById('classId').value;
        const grade = document.getElementById('classGrade').value;
        const section = document.getElementById('classSection').value;
        const classTeacher = document.getElementById('classTeacher').value;

        // Get all subjects
        const subjectEntries = document.querySelectorAll('.subject-entry');
        const subjects = Array.from(subjectEntries).map(entry => ({
            id: db.collection('classes').doc().id,
            name: entry.querySelector('.subject-name').value,
            teacherName: entry.querySelector('.teacher-name').value,
            teacherEmail: entry.querySelector('.teacher-email').value.toLowerCase()
        }));

        if (subjects.length === 0) {
            alert('Please add at least one subject.');
            return;
        }

        // Get timetable data
        const timetable = {};
        document.querySelectorAll('.timetable-input').forEach(input => {
            const day = input.dataset.day;
            const period = input.dataset.period;
            if (!timetable[day]) timetable[day] = {};
            timetable[day][period] = input.value.trim();
        });

        try {
            const classData = {
                grade,
                section,
                classTeacher: this.state.currentUser.uid,
                classTeacherName: classTeacher || this.state.currentUser.displayName,
                subjects,
                timetable,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (classId) {
                // Update existing
                await db.collection('classes').doc(classId).update(classData);
                alert('Class updated successfully!');
            } else {
                // Create new
                classData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                classData.createdBy = this.state.currentUser.uid;
                await db.collection('classes').add(classData);
                alert('Class created successfully!');
            }

            // Update teacher roles
            for (const subject of subjects) {
                const userQuery = await db.collection('users')
                    .where('email', '==', subject.teacherEmail)
                    .get();

                if (!userQuery.empty) {
                    const userDoc = userQuery.docs[0];
                    await userDoc.ref.update({
                        role: 'teacher'
                    });
                }
            }

            document.getElementById('classModal').classList.remove('active');
        } catch (error) {
            console.error('Error creating class:', error);
            alert('Error creating class: ' + error.message);
        }
    }

    // Update report filters with available classes
    updateReportFilters() {
        const reportClassSelect = document.getElementById('reportClass');
        const currentValue = reportClassSelect.value;

        reportClassSelect.innerHTML = '<option value="">Select Class...</option>';
        this.state.classes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = `${c.grade} - ${c.section}`;
            reportClassSelect.appendChild(option);
        });

        if (currentValue) reportClassSelect.value = currentValue;

        // Set default date and view for reports if not set
        const reportDateInput = document.getElementById('reportDate');
        if (!reportDateInput.value) {
            reportDateInput.value = this.getTodayDate();
        }

        const reportViewSelect = document.getElementById('reportView');
        if (reportViewSelect && !reportViewSelect.value) {
            reportViewSelect.value = 'week';
        }
    }

    // Render reports tab content
    renderReports() {
        const container = document.getElementById('reportContainer');
        const classId = document.getElementById('reportClass').value;
        const viewMode = document.getElementById('reportView').value;
        const selectedDate = document.getElementById('reportDate').value;

        if (!classId) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-title">Select a class to view report</div>
                </div>
            `;
            return;
        }

        const selectedClass = this.state.classes.find(c => c.id === classId);
        if (!selectedClass) return;

        let startDate, endDate;
        const [year, month, dayNum] = selectedDate.split('-').map(Number);
        const date = new Date(year, month - 1, dayNum);

        if (viewMode === 'day') {
            startDate = selectedDate;
            endDate = selectedDate;
        } else {
            // Week view (Monday to Friday)
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date.getFullYear(), date.getMonth(), diff);
            startDate = this.formatDateISO(monday);

            const Friday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4);
            endDate = this.formatDateISO(Friday);
        }

        const filteredUpdates = this.state.dailyUpdates.filter(u =>
            u.classId === classId && u.date >= startDate && u.date <= endDate
        );

        if (viewMode === 'day') {
            this.renderDayReport(container, selectedClass, selectedDate, filteredUpdates);
        } else {
            this.renderWeekReport(container, selectedClass, startDate, endDate, filteredUpdates);
        }

        // Show/hide WhatsApp share button for Teachers/Admins
        const reportActions = document.getElementById('reportActions');
        const reportNav = document.getElementById('reportNav');
        const reportRangeText = document.getElementById('reportRangeText');

        if (reportNav && reportRangeText) {
            reportNav.style.display = 'flex';
            if (viewMode === 'day') {
                reportRangeText.textContent = this.formatDate(selectedDate);
            } else {
                reportRangeText.textContent = `${this.formatDateSmall(startDate)} - ${this.formatDateSmall(endDate)}`;
            }
        }

        if (reportActions) {
            const canShare = authManager.isAdmin() || authManager.isTeacher() || this.state.isDynamicTeacher;
            // Always show if teacher has selected a class, even if no updates exist yet
            reportActions.style.display = (classId && canShare) ? 'flex' : 'none';
        }
    }

    // Change report date by offset (days)
    changeReportDate(offsetDays) {
        const dateInput = document.getElementById('reportDate');
        const viewMode = document.getElementById('reportView').value;
        if (!dateInput.value) return;

        const [y, m, d] = dateInput.value.split('-').map(Number);
        const currentDate = new Date(y, m - 1, d);

        // If offset is 7, and we are in day view, maybe we should move 1 day?
        // Actually, let's stick to the offset but maybe adjust it.
        // User asked for "next week or previous week", so 7 is fine for Week View.
        // For Day view, 1 day is better.
        const actualOffset = viewMode === 'day' ? (offsetDays > 0 ? 1 : -1) : offsetDays;

        currentDate.setDate(currentDate.getDate() + actualOffset);

        dateInput.value = this.formatDateISO(currentDate);
        this.renderReports();
    }

    renderDayReport(container, cls, dateStr, updates) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const [year, month, dayNum] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, dayNum);
        const dayName = dayNames[date.getDay()];
        const timetable = cls.timetable ? cls.timetable[dayName] || {} : {};

        let html = `
            <div class="report-view-container">
                <div class="report-header-info">
                    <h2 class="report-header-title">${cls.grade} - ${cls.section}</h2>
                    <p class="report-header-date">${dayName}, ${this.formatDate(dateStr)}</p>
                </div>
                <div class="report-table-wrapper">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Subject</th>
                                <th>What was Taught</th>
                                <th>Homework</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        // Loop through 8 periods
        for (let i = 1; i <= 8; i++) {
            const subjectInTimetable = timetable[i] || '-';
            const update = updates.find(u => u.periodNumber == i);

            html += `
                <tr>
                    <td class="report-period">P${i}</td>
                    <td class="report-subject">${subjectInTimetable}</td>
                    <td class="report-taught">${update ? update.whatWasTaught : '<span style="color: var(--gray-400)">No update</span>'}</td>
                    <td class="report-homework">${update && update.hasHomework ? update.homeworkDescription : '-'}</td>
                </tr>
            `;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    renderWeekReport(container, cls, startDate, endDate, updates) {
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        // Prepare column metadata
        const columns = dayNames.map((day, index) => {
            const [y, m, d] = startDate.split('-').map(Number);
            const currentDate = new Date(y, m - 1, d + index);
            const dateStr = this.formatDateISO(currentDate);
            const shortDay = day.substring(0, 3).toUpperCase();
            return {
                day,
                dateStr,
                display: `${shortDay}<br><small>${this.formatDateSmall(dateStr)}</small>`
            };
        });

        let html = `
            <div class="report-view-container">
                <div class="report-header-info">
                    <h2 class="report-header-title">${cls.grade} - ${cls.section}</h2>
                    <p class="report-header-date">Weekly Status: ${this.formatDateSmall(startDate)} to ${this.formatDateSmall(endDate)}</p>
                </div>
                <div class="report-table-wrapper">
                    <table class="report-table report-matrix">
                        <thead>
                            <tr>
                                <th style="width: 80px;">Period</th>
                                ${columns.map(col => `<th>${col.display}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
        `;

        // Rows are Periods 1-8
        for (let i = 1; i <= 8; i++) {
            html += `<tr>`;
            // Period header cell
            html += `<td class="matrix-day-cell" style="width: 80px;">P${i}</td>`;

            // Data cells for each day
            columns.forEach(col => {
                const timetable = cls.timetable ? cls.timetable[col.day] || {} : {};
                const subjectInTimetable = timetable[i];
                const update = updates.find(u => u.date === col.dateStr && u.periodNumber == i);

                html += `<td class="matrix-cell">`;
                if (subjectInTimetable) {
                    html += `<span class="matrix-subject">${subjectInTimetable}</span>`;
                    if (update) {
                        html += `<span class="matrix-taught">${update.whatWasTaught}</span>`;
                        if (update.hasHomework) {
                            html += `<span class="matrix-homework">${update.homeworkDescription}</span>`;
                        }
                    } else {
                        html += `<span class="matrix-empty">No update</span>`;
                    }
                } else {
                    html += `<span class="matrix-empty">-</span>`;
                }
                html += `</td>`;
            });
            html += `</tr>`;
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // Unified share handler
    async handleShare(event) {
        // Detect if the browser can share files (typically mobile)
        const canShareFiles = navigator.canShare && navigator.canShare({ files: [new File([], 'test.png', { type: 'image/png' })] });

        if (canShareFiles) {
            console.log('📱 App: Mobile detected, sharing as image');
            await this.shareAsImage(event);
        } else {
            console.log('💻 App: Desktop detected, sharing as text');
            this.shareToWhatsApp();
        }
    }

    // Share report as image
    async shareAsImage(event) {
        const container = document.getElementById('reportContainer');
        const reportClass = document.getElementById('reportClass');
        const className = reportClass.options[reportClass.selectedIndex].text;
        const reportDate = document.getElementById('reportDate').value;
        const viewMode = document.getElementById('reportView').value;

        try {
            // Show loading state
            const btn = event ? event.currentTarget : null;
            let originalText = '';
            if (btn) {
                originalText = btn.innerHTML;
                btn.innerHTML = '⌛ Generating...';
                btn.disabled = true;
            }

            // Get the actual table or content inside the container
            const reportTable = container.querySelector('.report-table') || container;
            const scrollWidth = reportTable.scrollWidth;
            const scrollHeight = reportTable.scrollHeight;

            // Generate canvas from report container with full dimensions
            const canvas = await html2canvas(container, {
                scale: 2, // Higher quality
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                width: scrollWidth,
                height: scrollHeight,
                windowWidth: scrollWidth,
                windowHeight: scrollHeight,
                onclone: (clonedDoc) => {
                    // Ensure the cloned container is visible and fully expanded
                    const clonedContainer = clonedDoc.getElementById('reportContainer');
                    const wrapper = clonedContainer.querySelector('.report-table-wrapper');
                    if (wrapper) {
                        wrapper.style.overflow = 'visible';
                        wrapper.style.width = 'auto';
                        wrapper.style.maxWidth = 'none';
                    }
                    const table = clonedContainer.querySelector('.report-table');
                    if (table) {
                        table.style.width = scrollWidth + 'px';
                    }
                }
            });

            const fileName = `Report_${className.replace(/\s+/g, '_')}_${reportDate}_${viewMode}.png`;

            // Convert to blob for sharing
            canvas.toBlob(async (blob) => {
                const file = new File([blob], fileName, { type: 'image/png' });

                // Try Web Share API first (best for mobile)
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `Report - ${className}`,
                            text: `Academic report for ${className} (${reportDate})`
                        });
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            console.error('Sharing failed:', err);
                            this.downloadBlob(blob, fileName);
                        }
                    }
                } else {
                    // Fallback to download for desktop
                    this.downloadBlob(blob, fileName);
                    alert('Report image generated and downloaded! You can now upload it to WhatsApp.');
                }

                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }, 'image/png');

        } catch (error) {
            console.error('Error generating image:', error);
            alert('Could not generate image. Please try the text share option.');
        }
    }

    // Helper for downloading
    downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Share report to WhatsApp (Text version)
    shareToWhatsApp() {
        const classId = document.getElementById('reportClass').value;
        const viewMode = document.getElementById('reportView').value;
        const selectedDate = document.getElementById('reportDate').value;

        const selectedClass = this.state.classes.find(c => c.id === classId);
        if (!selectedClass) return;

        let startDate, endDate;
        const [year, month, dayNum] = selectedDate.split('-').map(Number);
        const date = new Date(year, month - 1, dayNum);

        if (viewMode === 'day') {
            startDate = selectedDate;
            endDate = selectedDate;
        } else {
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date.getFullYear(), date.getMonth(), diff);
            startDate = this.formatDateISO(monday);
            const Friday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4);
            endDate = this.formatDateISO(Friday);
        }

        const updates = this.state.dailyUpdates.filter(u =>
            u.classId === classId && u.date >= startDate && u.date <= endDate
        );

        if (updates.length === 0) {
            alert('No data to share.');
            return;
        }

        let message = `📝 *TodayInClass Report*\n`;
        message += `🏫 *Class:* ${selectedClass.grade} - ${selectedClass.section}\n`;

        if (viewMode === 'day') {
            message += `📅 *Date:* ${this.formatDate(selectedDate)}\n\n`;

            // Sort updates by period
            updates.sort((a, b) => a.periodNumber - b.periodNumber);

            updates.forEach(u => {
                message += `*P${u.periodNumber}:* ${u.subjectName}\n`;
                message += `👉 ${u.whatWasTaught}\n`;
                if (u.hasHomework) {
                    message += `📚 *HW:* ${u.homeworkDescription}\n`;
                }
                message += `\n`;
            });
        } else {
            message += `📅 *Week:* ${this.formatDate(startDate)} to ${this.formatDate(endDate)}\n\n`;

            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            days.forEach((day, index) => {
                const [y, m, d] = startDate.split('-').map(Number);
                const currentDate = new Date(y, m - 1, d + index);
                const dateStr = this.formatDateISO(currentDate);
                const dayUpdates = updates.filter(u => u.date === dateStr);

                if (dayUpdates.length > 0) {
                    message += `*--- ${day} (${this.formatDate(dateStr)}) ---*\n`;
                    dayUpdates.sort((a, b) => a.periodNumber - b.periodNumber);
                    dayUpdates.forEach(u => {
                        message += `*P${u.periodNumber} (${u.subjectName}):* ${u.whatWasTaught}\n`;
                        if (u.hasHomework) {
                            message += `📚 *HW:* ${u.homeworkDescription}\n`;
                        }
                    });
                    message += `\n`;
                }
            });
        }

        message += `_Shared via TodayInClass_`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }

    // Delete class
    async deleteClass(classId) {
        if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
            return;
        }

        try {
            await db.collection('classes').doc(classId).delete();
            alert('Class deleted successfully!');
        } catch (error) {
            console.error('Error deleting class:', error);
            alert('Error deleting class: ' + error.message);
        }
    }

    // Open add update modal
    async openAddUpdateModal(classId = null) {
        document.getElementById('updateForm').reset();
        document.getElementById('updateModalTitle').textContent = 'Add Daily Update';
        document.getElementById('homeworkDescGroup').style.display = 'none';
        document.getElementById('updateId').value = '';

        // Populate class and date dropdowns
        await this.initializeUpdateForm(classId);

        document.getElementById('updateModal').classList.add('active');
    }

    // Populate update form dropdowns
    async initializeUpdateForm(prefillClassId = null) {
        const classSelect = document.getElementById('updateClass');
        classSelect.innerHTML = '<option value="">Select class...</option>';

        // Filter classes where current user is a teacher
        const teacherClasses = this.state.classes.filter(c =>
            c.createdBy === this.state.currentUser.uid ||
            (c.subjects && c.subjects.some(s => s.teacherEmail.trim().toLowerCase() === this.state.currentUser.email.trim().toLowerCase()))
        );

        teacherClasses.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = `${c.grade} - ${c.section}`;
            classSelect.appendChild(option);
        });

        // Set default date to currently filtered date or today
        document.getElementById('updateDate').value = this.state.selectedDate || this.getTodayDate();

        // Prefill class if provided
        if (prefillClassId) {
            classSelect.value = prefillClassId;
            this.updatePeriodSelection();
        } else {
            // Clear periods initially
            document.getElementById('updatePeriod').innerHTML = '<option value="">Select period...</option>';
        }
    }

    // Update period selection based on selected class and date
    updatePeriodSelection() {
        const classId = document.getElementById('updateClass').value;
        const dateString = document.getElementById('updateDate').value;
        const periodSelect = document.getElementById('updatePeriod');

        if (!classId || !dateString) {
            periodSelect.innerHTML = '<option value="">Select period...</option>';
            return;
        }

        const selectedClass = this.state.classes.find(c => c.id === classId);
        if (!selectedClass || !selectedClass.timetable) {
            periodSelect.innerHTML = '<option value="">No timetable found for this class</option>';
            return;
        }

        // Safer date parsing to avoid timezone shifts
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[date.getDay()];

        const dayTimetable = selectedClass.timetable[dayName];

        periodSelect.innerHTML = '<option value="">Select period...</option>';
        if (dayTimetable) {
            console.log(`📅 App: Found timetable for ${dayName}`, dayTimetable);
            Object.entries(dayTimetable).forEach(([period, subject]) => {
                if (!subject) return;

                // Admin/Creator sees everything; Teacher only sees their own subjects
                const isAdmin = authManager.isAdmin();
                const isClassCreator = selectedClass.createdBy === this.state.currentUser.uid;
                const isTeacherForSubject = selectedClass.subjects && selectedClass.subjects.some(s =>
                    s.name.trim().toLowerCase() === subject.trim().toLowerCase() &&
                    s.teacherEmail.trim().toLowerCase() === (this.state.currentUser.email || '').trim().toLowerCase()
                );

                if (isAdmin || isClassCreator || isTeacherForSubject) {
                    const option = document.createElement('option');
                    option.value = period;
                    option.dataset.subjectName = subject;
                    option.textContent = `Period ${period}: ${subject}`;
                    periodSelect.appendChild(option);
                }
            });

            if (periodSelect.options.length === 1) { // Only the "Select period..." option
                const opt = document.createElement('option');
                opt.disabled = true;
                opt.textContent = 'No subjects scheduled for you this day';
                periodSelect.appendChild(opt);
            }
        } else {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.textContent = 'No timetable for this day (e.g. Weekend)';
            periodSelect.appendChild(opt);
        }
    }

    // Check for existing update for selected class, date, and period
    checkForExistingUpdate() {
        const classId = document.getElementById('updateClass').value;
        const date = document.getElementById('updateDate').value;
        const periodNumber = document.getElementById('updatePeriod').value;

        if (!classId || !date || !periodNumber) return;

        // Look for existing update in state
        const existingUpdate = this.state.dailyUpdates.find(u =>
            u.classId === classId &&
            u.date === date &&
            u.periodNumber == periodNumber
        );

        const taughtInput = document.getElementById('whatWasTaught');
        const hasHomeworkCheckbox = document.getElementById('hasHomework');
        const homeworkDesc = document.getElementById('homeworkDescription');
        const homeworkDescGroup = document.getElementById('homeworkDescGroup');
        const updateIdInput = document.getElementById('updateId');
        const modalTitle = document.getElementById('updateModalTitle');

        if (existingUpdate) {
            console.log('📝 App: Found existing update, pre-filling form');
            taughtInput.value = existingUpdate.whatWasTaught;
            hasHomeworkCheckbox.checked = existingUpdate.hasHomework;
            homeworkDesc.value = existingUpdate.homeworkDescription || '';
            homeworkDescGroup.style.display = existingUpdate.hasHomework ? 'block' : 'none';
            updateIdInput.value = existingUpdate.id;
            modalTitle.textContent = 'Edit Daily Update';
        } else {
            // Only reset if it was previously an "Edit" mode
            if (updateIdInput.value) {
                taughtInput.value = '';
                hasHomeworkCheckbox.checked = false;
                homeworkDesc.value = '';
                homeworkDescGroup.style.display = 'none';
                updateIdInput.value = '';
                modalTitle.textContent = 'Add Daily Update';
            }
        }
    }

    // Handle add/edit update
    async handleAddUpdate() {
        const updateId = document.getElementById('updateId').value;
        const classId = document.getElementById('updateClass').value;
        const periodSelect = document.getElementById('updatePeriod');
        const periodNumber = periodSelect.value;
        const subjectName = document.getElementById('updateSubject').value; // Hidden field set by period selection
        const whatWasTaught = document.getElementById('whatWasTaught').value;
        const hasHomework = document.getElementById('hasHomework').checked;
        const homeworkDescription = document.getElementById('homeworkDescription').value;
        const date = document.getElementById('updateDate').value;

        if (!classId || !periodNumber) {
            alert('Please select both class and period.');
            return;
        }

        const selectedClass = this.state.classes.find(c => c.id === classId);
        const className = `${selectedClass.grade} - ${selectedClass.section}`;

        const updateData = {
            classId,
            className,
            periodNumber: parseInt(periodNumber),
            subjectName,
            teacherId: this.state.currentUser.uid,
            teacherName: this.state.currentUser.displayName,
            date,
            whatWasTaught,
            hasHomework,
            homeworkDescription: hasHomework ? homeworkDescription : '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (updateId) {
                // Update existing
                await db.collection('dailyUpdates').doc(updateId).update(updateData);
                alert('Update saved successfully!');
            } else {
                // Create new
                updateData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('dailyUpdates').add(updateData);
                alert('Update added successfully!');
            }

            document.getElementById('updateModal').classList.remove('active');
            this.switchTab('updates');
        } catch (error) {
            console.error('Error saving update:', error);
            alert('Error saving update: ' + error.message);
        }
    }

    // Edit update
    async editUpdate(updateId) {
        const update = this.state.dailyUpdates.find(u => u.id === updateId);
        if (!update) return;

        document.getElementById('updateModalTitle').textContent = 'Edit Daily Update';
        document.getElementById('updateId').value = updateId;

        await this.initializeUpdateForm();

        // Set form values
        document.getElementById('updateClass').value = update.classId;
        document.getElementById('updateDate').value = update.date;

        // Manually trigger period selection update
        this.updatePeriodSelection();

        setTimeout(() => {
            document.getElementById('updatePeriod').value = update.periodNumber;
            document.getElementById('updateSubject').value = update.subjectName;
            document.getElementById('whatWasTaught').value = update.whatWasTaught;
            document.getElementById('hasHomework').checked = update.hasHomework;
            document.getElementById('homeworkDescription').value = update.homeworkDescription || '';
            document.getElementById('homeworkDescGroup').style.display = update.hasHomework ? 'block' : 'none';
        }, 100);

        document.getElementById('updateModal').classList.add('active');
    }

    // Delete update
    async deleteUpdate(updateId) {
        if (!confirm('Are you sure you want to delete this update?')) {
            return;
        }

        try {
            await db.collection('dailyUpdates').doc(updateId).delete();
            alert('Update deleted successfully!');
        } catch (error) {
            console.error('Error deleting update:', error);
            alert('Error deleting update: ' + error.message);
        }
    }

    // Check for updates manually
    async checkForUpdate(event) {
        const btn = event.currentTarget;
        const originalText = btn.innerHTML;

        try {
            btn.innerHTML = '⌛ Updating App...';
            btn.disabled = true;

            // 1. Clear all Cache API storage
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                console.log('SW: Caches cleared');
            }

            // 2. Unregister Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (let registration of registrations) {
                    await registration.unregister();
                }
                console.log('SW: Service workers unregistered');
            }

            // 3. Force a hard reload with a cache-buster
            const bustUrl = window.location.origin + window.location.pathname + '?v=' + Date.now();
            window.location.replace(bustUrl);

        } catch (error) {
            console.error('Update failed:', error);
            btn.innerHTML = originalText;
            btn.disabled = false;
            alert('Update failed. Please manually refresh the page.');
        }
    }

    // Cleanup
    destroy() {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TodayInClassApp();
    app.init();
});
