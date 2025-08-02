class TimekeeperAgent {
    constructor() {
        // Application state
        this.meetings = this.loadFromStorage('meetings', []);
        this.templates = this.loadFromStorage('templates', this.getDefaultTemplates());
        this.analytics = this.loadFromStorage('analytics', { completedMeetings: [], totalTime: 0 });
        this.settings = this.loadFromStorage('settings', { theme: 'light', soundEnabled: true });

        // Timer state
        this.currentTimer = null;
        this.timerInterval = null;
        this.isTimerRunning = false;
        this.currentMeeting = null;
        this.startTime = null;

        // Scheduled meeting check interval
        this.scheduledMeetingInterval = null;

        // Initialize application
        this.init();
    }

    init() {
        console.log('🚀 Initializing Timekeeper Agent...');

        // Check if first visit
        if (!localStorage.getItem('hasVisited')) {
            window.location.href = 'overview.html';
            localStorage.setItem('hasVisited', 'true');
            return;
        }

        this.applyTheme();
        this.bindEvents();
        this.renderAll();
        this.startBackgroundTasks();
        this.startScheduledMeetingChecker();
        this.initializeAnimations();

        console.log('✅ Timekeeper Agent initialized successfully');
    }

    // Initialize subtle entrance animations
    initializeAnimations() {
        // Animate header on load - more subtle
        setTimeout(() => {
            const header = document.querySelector('.main-header');
            if (header) {
                header.style.opacity = '0';
                header.style.transform = 'translateY(-10px)';
                header.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                setTimeout(() => {
                    header.style.opacity = '1';
                    header.style.transform = 'translateY(0)';
                }, 100);
            }
        }, 100);

        // Setup intersection observer for cards - fixed
        this.setupScrollAnimations();
    }

    // Fixed scroll animations
    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && entry.target.style.opacity === '0') {
                    entry.target.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        // Only observe new cards, not existing ones
        this.cardObserver = observer;
    }

    // Subtle element animation
    animateElement(element, animationType = 'pulse', duration = 300) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;

        if (animationType === 'pulse') {
            el.style.transition = `transform ${duration}ms ease`;
            el.style.transform = 'scale(1.02)';
            setTimeout(() => {
                el.style.transform = 'scale(1)';
                setTimeout(() => {
                    el.style.transition = '';
                }, duration);
            }, duration / 2);
        } else if (animationType === 'shake') {
            el.style.transition = `transform ${duration}ms ease`;
            el.style.transform = 'translateX(-2px)';
            setTimeout(() => el.style.transform = 'translateX(2px)', duration / 4);
            setTimeout(() => el.style.transform = 'translateX(-1px)', duration / 2);
            setTimeout(() => el.style.transform = 'translateX(1px)', 3 * duration / 4);
            setTimeout(() => {
                el.style.transform = 'translateX(0)';
                setTimeout(() => el.style.transition = '', 100);
            }, duration);
        }
    }

    // Check for scheduled meetings every minute
    startScheduledMeetingChecker() {
        this.scheduledMeetingInterval = setInterval(() => {
            this.checkScheduledMeetings();
        }, 60000); // Check every minute
    }

    // Check if any scheduled meeting should start now
    checkScheduledMeetings() {
        const now = new Date();
        this.meetings.forEach(meeting => {
            if (meeting.status === 'scheduled') {
                const meetingTime = new Date(meeting.dateTime);
                const timeDiff = Math.abs(now - meetingTime);

                // If meeting time is within 1 minute (accounting for check interval)
                if (timeDiff <= 60000 && now >= meetingTime) {
                    this.alertScheduledMeeting(meeting);
                    // Update meeting status to prevent multiple alerts
                    meeting.status = 'alerted';
                    this.saveAllData();
                }
            }
        });
    }

    // Alert for scheduled meeting
    alertScheduledMeeting(meeting) {
        // Play alert sound
        this.playSound('alert');

        // Show notification
        this.showNotification('Meeting Alert', `"${meeting.title}" is scheduled to start now!`, 'warning');

        // Show confirmation modal to start meeting
        this.showScheduledMeetingModal(meeting);
    }

    // Show modal for scheduled meeting
    showScheduledMeetingModal(meeting) {
        const modalHtml = `
            <div class="modal" id="scheduledMeetingModal">
                <div class="modal-overlay" onclick="this.closest('.modal').remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>⏰ Meeting Alert</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-form">
                        <p><strong>"${meeting.title}"</strong> is scheduled to start now!</p>
                        <p>Would you like to start the meeting timer?</p>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                Dismiss
                            </button>
                            <button type="button" class="btn btn-primary" onclick="agent.startMeetingFromAlert('${meeting.id}')">
                                🎯 Start Meeting
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHtml;
    }

    // Start meeting from alert
    startMeetingFromAlert(meetingId) {
        document.getElementById('scheduledMeetingModal').remove();
        this.startMeeting(meetingId);
    }

    // Bind event listeners
    bindEvents() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Space key: pause/resume timer
            if (e.code === 'Space' && this.isTimerRunning && document.getElementById('timerView').style.display !== 'none') {
                e.preventDefault();
                this.pauseResumeTimer();
            }
            
            // Escape key: close modals
            if (e.code === 'Escape') {
                const modal = document.querySelector('.modal');
                if (modal) {
                    modal.remove();
                }
            }
        });
    }

    // Theme management
    toggleTheme() {
        const currentTheme = this.settings.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.settings.theme = newTheme;
        this.applyTheme();
        this.saveAllData();
        
        this.showNotification('Theme Changed', `Switched to ${newTheme} mode`, 'success');
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.textContent = this.settings.theme === 'light' ? '🌙' : '☀️';
        }
    }

    // Tab switching
    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Render content based on tab
        switch(tabName) {
            case 'dashboard':
                this.renderMeetings();
                break;
            case 'schedule':
                this.renderTemplateOptions();
                break;
            case 'templates':
                this.renderTemplates();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
        }
    }

    // CSV Import functionality
    showImportModal() {
        const modalHtml = `
            <div class="modal" id="importModal">
                <div class="modal-overlay" onclick="this.closest('.modal').remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📊 Import Meeting Data</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-form">
                        <div class="form-group">
                            <label for="csvFile">Select CSV/Excel File</label>
                            <input type="file" id="csvFile" accept=".csv,.xlsx,.xls" required>
                            <small>Upload a CSV or Excel file with meeting data (columns: title, dateTime, duration, templateId, agenda_items)</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Expected Format:</label>
                            <pre style="background: var(--gray-100); padding: var(--space-3); border-radius: var(--radius-md); font-size: 0.75rem; overflow-x: auto;">title,dateTime,duration,templateId,agenda_items
Team Meeting,2025-02-15T09:00:00Z,30,template_standup,"Item 1 (5 min), Item 2 (10 min)"</pre>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                Cancel
                            </button>
                            <button type="button" class="btn btn-primary" onclick="agent.processImportFile()">
                                📊 Import Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHtml;
    }

    // Process the imported CSV/Excel file
    processImportFile() {
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showNotification('No File Selected', 'Please select a CSV or Excel file to import', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                let parsedData;
                
                if (file.name.toLowerCase().endsWith('.csv')) {
                    parsedData = this.parseCSV(content);
                } else {
                    // For Excel files, we'll treat them as CSV for simplicity
                    // In a full implementation, you'd use a library like SheetJS
                    parsedData = this.parseCSV(content);
                }
                
                this.importMeetingData(parsedData);
                document.getElementById('importModal').remove();
                
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification('Import Error', 'Failed to parse the file. Please check the format.', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    // Parse CSV content
    parseCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }
        
        return data;
    }
    
    // Parse a single CSV line (handles quoted values)
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }
    
    // Import meeting data from parsed CSV
    importMeetingData(data) {
        let importedCount = 0;
        let skippedCount = 0;
        
        data.forEach(row => {
            try {
                // Validate required fields
                if (!row.title || !row.dateTime || !row.duration) {
                    skippedCount++;
                    return;
                }
                
                // Parse agenda items if provided
                let agenda = [];
                if (row.agenda_items) {
                    agenda = this.parseAgendaItems(row.agenda_items, parseInt(row.duration));
                }
                
                // Create meeting object
                const meeting = {
                    id: 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    title: row.title,
                    dateTime: new Date(row.dateTime).toISOString(),
                    templateId: row.templateId || null,
                    status: 'scheduled',
                    agenda: agenda.length > 0 ? agenda : [{ title: 'Meeting discussion', duration: parseInt(row.duration) }],
                    totalDuration: parseInt(row.duration),
                    createdAt: new Date().toISOString()
                };
                
                // Validate date is in the future
                if (new Date(meeting.dateTime) <= new Date()) {
                    skippedCount++;
                    return;
                }
                
                this.meetings.push(meeting);
                importedCount++;
                
            } catch (error) {
                console.warn('Error importing row:', row, error);
                skippedCount++;
            }
        });
        
        this.saveAllData();
        this.renderMeetings();
        
        const message = `Imported ${importedCount} meetings${skippedCount > 0 ? `, skipped ${skippedCount} invalid entries` : ''}`;
        this.showNotification('Import Complete', message, 'success');
    }

    // Meeting management
    scheduleMeeting(event) {
        if (event) event.preventDefault();

        const title = document.getElementById('meetingTitle').value.trim();
        const dateTime = document.getElementById('meetingDateTime').value;
        const templateId = document.getElementById('meetingTemplate').value;
        const agendaText = document.getElementById('meetingAgenda').value.trim();

        // Validation
        if (!title || !dateTime) {
            this.showNotification('Validation Error', 'Please fill in all required fields', 'error');
            return;
        }

        const meetingDate = new Date(dateTime);
        if (meetingDate <= new Date()) {
            this.showNotification('Invalid Date', 'Meeting must be scheduled in the future', 'error');
            return;
        }

        // Create agenda
        let agenda = [];
        let totalDuration = 30; // Default duration

        if (templateId) {
            const template = this.templates.find(t => t.id === templateId);
            if (template) {
                agenda = [...template.agenda];
                totalDuration = template.duration;
            }
        } else if (agendaText) {
            agenda = this.parseAgendaItems(agendaText, totalDuration);
            totalDuration = agenda.reduce((sum, item) => sum + item.duration, 0);
        } else {
            agenda = [{ title: 'Meeting discussion', duration: totalDuration }];
        }

        // Create meeting object
        const meeting = {
            id: 'meeting_' + Date.now(),
            title: title,
            dateTime: meetingDate.toISOString(),
            templateId: templateId || null,
            status: 'scheduled',
            agenda: agenda,
            totalDuration: totalDuration,
            createdAt: new Date().toISOString()
        };

        this.meetings.push(meeting);
        this.saveAllData();
        
        // Clear form and show success
        document.getElementById('meetingForm').reset();
        this.showNotification('Meeting Scheduled', `"${title}" has been scheduled successfully`, 'success');
        
        // Switch to dashboard
        this.switchTab('dashboard');
    }

    // Parse agenda items from text
    parseAgendaItems(text, totalDuration = 30) {
        const lines = text.split('\n').filter(line => line.trim());
        const items = [];
        let allocatedTime = 0;

        // First pass: extract explicitly timed items
        lines.forEach(line => {
            const match = line.match(/^(.+?)\s*\((\d+)\s*min\)$/i);
            if (match) {
                const title = match[1].trim();
                const duration = parseInt(match[2]);
                items.push({ title, duration });
                allocatedTime += duration;
            } else {
                items.push({ title: line.trim(), duration: 0 });
            }
        });

        // Second pass: distribute remaining time to untimed items
        const untimedItems = items.filter(item => item.duration === 0);
        if (untimedItems.length > 0) {
            const remainingTime = Math.max(0, totalDuration - allocatedTime);
            const timePerItem = Math.floor(remainingTime / untimedItems.length);
            
            untimedItems.forEach(item => {
                item.duration = Math.max(5, timePerItem); // Minimum 5 minutes
            });
        }

        return items.length > 0 ? items : [{ title: 'Meeting discussion', duration: totalDuration }];
    }

    // Template management
    templateChanged() {
        const templateId = document.getElementById('meetingTemplate').value;
        const agendaField = document.getElementById('meetingAgenda');

        if (templateId) {
            const template = this.templates.find(t => t.id === templateId);
            if (template) {
                const agendaText = template.agenda
                    .map(item => `${item.title} (${item.duration} min)`)
                    .join('\n');
                agendaField.value = agendaText;
            }
        }
    }

    renderTemplateOptions() {
        const select = document.getElementById('meetingTemplate');
        if (!select) return;

        // Clear existing options (except first one)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        this.templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = `${template.name} (${template.duration} min)`;
            select.appendChild(option);
        });
    }

    showCreateTemplateModal() {
        const modalHtml = `
            <div class="modal" id="createTemplateModal">
                <div class="modal-overlay" onclick="this.closest('.modal').remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📝 Create New Template</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-form">
                        <div class="form-group">
                            <label for="templateName">Template Name*</label>
                            <input type="text" id="templateName" required maxlength="50" 
                                   placeholder="e.g., Weekly Team Sync">
                        </div>
                        
                        <div class="form-group">
                            <label for="templateDuration">Total Duration (minutes)*</label>
                            <input type="number" id="templateDuration" required min="5" max="480" value="30">
                        </div>
                        
                        <div class="form-group">
                            <label for="templateAgenda">Agenda Items*</label>
                            <textarea id="templateAgenda" rows="6" required 
                                      placeholder="Enter agenda items, one per line. Use format: 'Item Name (X min)' for timed items"></textarea>
                            <small>Format: "Welcome (5 min)", "Discussion", "Action Items (10 min)"</small>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                Cancel
                            </button>
                            <button type="button" class="btn btn-primary" onclick="agent.createTemplate()">
                                📝 Create Template
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHtml;
    }

    createTemplate() {
        const name = document.getElementById('templateName').value.trim();
        const duration = parseInt(document.getElementById('templateDuration').value);
        const agendaText = document.getElementById('templateAgenda').value.trim();

        // Validation
        if (!name || !duration || !agendaText) {
            this.showNotification('Validation Error', 'Please fill in all required fields', 'error');
            return;
        }

        // Parse agenda
        const agenda = this.parseAgendaItems(agendaText, duration);
        
        // Create template
        const template = {
            id: 'template_' + Date.now(),
            name: name,
            duration: duration,
            description: agenda.map(item => item.title).join(', '),
            agenda: agenda,
            createdAt: new Date().toISOString()
        };

        this.templates.push(template);
        this.saveAllData();
        
        // Close modal and refresh
        document.getElementById('createTemplateModal').remove();
        this.renderTemplates();
        this.showNotification('Template Created', `"${name}" template has been created`, 'success');
    }

    useTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        // Create instant meeting from template
        const meeting = {
            id: 'meeting_' + Date.now(),
            title: `${template.name} Session`,
            dateTime: new Date().toISOString(),
            templateId: template.id,
            status: 'active',
            agenda: [...template.agenda],
            totalDuration: template.duration,
            createdAt: new Date().toISOString()
        };

        this.currentMeeting = meeting;
        this.startTimerFromTemplate(template);
    }

    startTimerFromTemplate(template) {
        const totalSeconds = template.duration * 60;
        
        this.currentTimer = {
            totalDuration: totalSeconds,
            remainingTime: totalSeconds,
            startTime: performance.now()
        };

        this.showTimerView();
        this.startTimer();
        
        this.showNotification('Timer Started', `${template.name} session started`, 'success');
    }

    // Template management with edit functionality
    renderTemplates() {
        const container = document.getElementById('templatesGrid');
        const emptyState = document.getElementById('emptyTemplates');
        
        if (!container) return;

        if (this.templates.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            this.hideTemplateBulkActions();
            return;
        }

        emptyState.style.display = 'none';
        this.showTemplateBulkActions();
        
        container.innerHTML = this.templates.map(template => `
            <div class="template-card" style="opacity: 0; transform: translateY(20px); position: relative;">
                <input type="checkbox" class="template-checkbox" data-template-id="${template.id}" 
                       onchange="agent.updateTemplateSelection()" 
                       style="position: absolute; top: 10px; left: 10px; width: 18px; height: 18px; cursor: pointer;">
                
                <div onclick="agent.useTemplate('${template.id}')" style="cursor: pointer; padding-top: 20px;">
                    <h3>${template.name}</h3>
                    <div class="template-meta">⏱️ ${template.duration} minutes</div>
                    <div class="agenda-preview">${template.description}</div>
                </div>
                
                <div style="display: flex; gap: var(--space-2); margin-top: var(--space-3); justify-content: flex-end;">
                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); agent.editTemplate('${template.id}')">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); agent.deleteTemplate('${template.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');

        // Animate new cards
        setTimeout(() => {
            container.querySelectorAll('.template-card').forEach((card, index) => {
                setTimeout(() => {
                    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 50);
    }

    // Show/hide template bulk action buttons
    showTemplateBulkActions() {
        document.getElementById('selectAllTemplatesBtn').style.display = 'inline-flex';
        document.getElementById('deleteSelectedTemplatesBtn').style.display = 'inline-flex';
    }

    hideTemplateBulkActions() {
        document.getElementById('selectAllTemplatesBtn').style.display = 'none';
        document.getElementById('deleteSelectedTemplatesBtn').style.display = 'none';
    }

    // Template selection management
    updateTemplateSelection() {
        const checkboxes = document.querySelectorAll('.template-checkbox');
        const selectedCount = document.querySelectorAll('.template-checkbox:checked').length;
        
        const deleteBtn = document.getElementById('deleteSelectedTemplatesBtn');
        const selectAllBtn = document.getElementById('selectAllTemplatesBtn');
        
        if (selectedCount > 0) {
            deleteBtn.textContent = `🗑️ Delete Selected (${selectedCount})`;
            deleteBtn.style.opacity = '1';
        } else {
            deleteBtn.textContent = '🗑️ Delete Selected';
            deleteBtn.style.opacity = '0.5';
        }
        
        // Update select all button
        const totalCount = checkboxes.length;
        if (selectedCount === totalCount && totalCount > 0) {
            selectAllBtn.textContent = '☐ Unselect All';
        } else {
            selectAllBtn.textContent = '☑️ Select All';
        }
    }

    selectAllTemplates() {
        const checkboxes = document.querySelectorAll('.template-checkbox');
        const selectAllBtn = document.getElementById('selectAllTemplatesBtn');
        
        const allSelected = document.querySelectorAll('.template-checkbox:checked').length === checkboxes.length;
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allSelected;
        });
        
        this.updateTemplateSelection();
    }

    deleteSelectedTemplates() {
        const selectedCheckboxes = document.querySelectorAll('.template-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.templateId);
        
        if (selectedIds.length === 0) {
            this.showNotification('No Selection', 'Please select templates to delete', 'error');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ${selectedIds.length} selected template(s)?`)) {
            this.templates = this.templates.filter(t => !selectedIds.includes(t.id));
            this.saveAllData();
            this.renderTemplates();
            this.renderTemplateOptions();
            this.showNotification('Templates Deleted', `${selectedIds.length} template(s) have been removed`, 'success');
        }
    }

    // Edit template functionality
    editTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        const modalHtml = `
            <div class="modal" id="editTemplateModal">
                <div class="modal-overlay" onclick="this.closest('.modal').remove()"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>✏️ Edit Template</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                    </div>
                    <div class="modal-form">
                        <div class="form-group">
                            <label for="editTemplateName">Template Name*</label>
                            <input type="text" id="editTemplateName" required maxlength="50" 
                                   value="${template.name}" placeholder="e.g., Weekly Team Sync">
                        </div>
                        
                        <div class="form-group">
                            <label for="editTemplateDuration">Total Duration (minutes)*</label>
                            <input type="number" id="editTemplateDuration" required min="5" max="480" value="${template.duration}">
                        </div>
                        
                        <div class="form-group">
                            <label for="editTemplateAgenda">Agenda Items*</label>
                            <textarea id="editTemplateAgenda" rows="6" required 
                                      placeholder="Enter agenda items, one per line.">${template.agenda.map(item => `${item.title} (${item.duration} min)`).join('\n')}</textarea>
                            <small>Format: "Welcome (5 min)", "Discussion", "Action Items (10 min)"</small>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                                Cancel
                            </button>
                            <button type="button" class="btn btn-primary" onclick="agent.updateTemplate('${templateId}')">
                                ✏️ Update Template
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHtml;
    }

    updateTemplate(templateId) {
        const name = document.getElementById('editTemplateName').value.trim();
        const duration = parseInt(document.getElementById('editTemplateDuration').value);
        const agendaText = document.getElementById('editTemplateAgenda').value.trim();

        // Validation
        if (!name || !duration || !agendaText) {
            this.showNotification('Validation Error', 'Please fill in all required fields', 'error');
            return;
        }

        // Parse agenda
        const agenda = this.parseAgendaItems(agendaText, duration);
        
        // Update template
        const templateIndex = this.templates.findIndex(t => t.id === templateId);
        if (templateIndex !== -1) {
            this.templates[templateIndex] = {
                ...this.templates[templateIndex],
                name: name,
                duration: duration,
                description: agenda.map(item => item.title).join(', '),
                agenda: agenda,
                updatedAt: new Date().toISOString()
            };

            this.saveAllData();
            
            // Close modal and refresh
            document.getElementById('editTemplateModal').remove();
            this.renderTemplates();
            this.renderTemplateOptions();
            this.showNotification('Template Updated', `"${name}" template has been updated`, 'success');
        }
    }

    // Dashboard delete all functionality  
    renderMeetings() {
        const container = document.getElementById('meetingsGrid');
        const emptyState = document.getElementById('emptyDashboard');
        const deleteAllBtn = document.getElementById('deleteAllBtn');
        
        if (!container) return;

        // Filter scheduled meetings
        const scheduledMeetings = this.meetings.filter(m => m.status === 'scheduled' || m.status === 'alerted');
        
        if (scheduledMeetings.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            if (deleteAllBtn) deleteAllBtn.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        if (deleteAllBtn) deleteAllBtn.style.display = 'inline-flex';
        
        // Sort by date
        scheduledMeetings.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        
        container.innerHTML = scheduledMeetings.map(meeting => {
            const meetingDate = new Date(meeting.dateTime);
            const now = new Date();
            const isOverdue = meetingDate < now;
            
            return `
                <div class="meeting-card ${isOverdue ? 'overdue' : ''}" style="opacity: 0; transform: translateY(20px);">
                    <div class="meeting-title">${meeting.title}</div>
                    <div class="meeting-meta">
                        📅 ${this.formatDateTime(meetingDate)}<br>
                        ⏱️ ${meeting.totalDuration || 30} minutes<br>
                        📋 ${meeting.agenda ? meeting.agenda.length : 1} agenda items
                    </div>
                    <div class="meeting-actions">
                        <button class="btn btn-primary" onclick="agent.startMeeting('${meeting.id}')">
                            🎯 Start Meeting
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="agent.deleteMeeting('${meeting.id}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Animate new cards
        setTimeout(() => {
            container.querySelectorAll('.meeting-card').forEach((card, index) => {
                setTimeout(() => {
                    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 50);
    }

    deleteAllMeetings() {
        const scheduledMeetings = this.meetings.filter(m => m.status === 'scheduled' || m.status === 'alerted');
        
        if (scheduledMeetings.length === 0) {
            this.showNotification('No Meetings', 'No scheduled meetings to delete', 'error');
            return;
        }
        
        if (confirm(`Are you sure you want to delete all ${scheduledMeetings.length} scheduled meeting(s)?`)) {
            this.meetings = this.meetings.filter(m => m.status !== 'scheduled' && m.status !== 'alerted');
            this.saveAllData();
            this.renderMeetings();
            this.showNotification('All Meetings Deleted', `${scheduledMeetings.length} meeting(s) have been removed`, 'success');
        }
    }

    renderAnalytics() {
        const completedMeetings = this.analytics.completedMeetings || [];
        const emptyState = document.getElementById('emptyAnalytics');
        const chartContainer = document.querySelector('.chart-container');
        
        if (completedMeetings.length === 0) {
            emptyState.style.display = 'block';
            chartContainer.style.display = 'none';
            this.updateAnalyticsKPI();
            return;
        }

        emptyState.style.display = 'none';
        chartContainer.style.display = 'block';
        
        this.updateAnalyticsKPI();
        this.renderChart();
    }

    updateAnalyticsKPI() {
        const completed = this.analytics.completedMeetings || [];
        
        // Calculate KPIs
        const totalMeetings = completed.length;
        const totalEfficiency = completed.reduce((sum, m) => sum + (m.efficiency || 0), 0);
        const avgEfficiency = totalMeetings > 0 ? Math.round(totalEfficiency / totalMeetings) : 0;
        
        const timeSaved = completed.reduce((sum, m) => {
            const saved = (m.plannedDuration || 0) - (m.actualDuration || 0);
            return sum + Math.max(0, saved);
        }, 0);
        
        const onTimeMeetings = completed.filter(m => (m.efficiency || 0) >= 100).length;
        const onTimeRate = totalMeetings > 0 ? Math.round((onTimeMeetings / totalMeetings) * 100) : 0;

        // Update UI
        document.getElementById('totalMeetings').textContent = totalMeetings;
        document.getElementById('avgEfficiency').textContent = avgEfficiency + '%';
        document.getElementById('timeSaved').textContent = timeSaved + 'm';
        document.getElementById('onTimeRate').textContent = onTimeRate + '%';
    }

    renderChart() {
        const canvas = document.getElementById('analyticsChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const completed = this.analytics.completedMeetings || [];
        
        // Clear existing chart
        if (this.analyticsChart) {
            this.analyticsChart.destroy();
        }

        // Take last 10 meetings
        const recentMeetings = completed.slice(-10);
        
        this.analyticsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: recentMeetings.map(m => m.title.length > 15 ? m.title.substring(0, 15) + '...' : m.title),
                datasets: [
                    {
                        label: 'Planned Duration',
                        data: recentMeetings.map(m => m.plannedDuration),
                        backgroundColor: 'rgba(8, 145, 178, 0.6)',
                        borderColor: 'rgba(8, 145, 178, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Actual Duration',
                        data: recentMeetings.map(m => m.actualDuration),
                        backgroundColor: 'rgba(220, 38, 38, 0.6)',
                        borderColor: 'rgba(220, 38, 38, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Meeting Duration Analysis (Last 10 Meetings)'
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Duration (minutes)'
                        }
                    }
                }
            }
        });
    }

    // Timer functionality
    startMeeting(meetingId) {
        const meeting = this.meetings.find(m => m.id === meetingId);
        if (!meeting) return;

        this.currentMeeting = meeting;
        const totalSeconds = (meeting.totalDuration || 30) * 60;
        
        this.currentTimer = {
            totalDuration: totalSeconds,
            remainingTime: totalSeconds,
            startTime: performance.now()
        };

        meeting.status = 'active';
        meeting.actualStartTime = new Date().toISOString();
        
        this.showTimerView();
        this.startTimer();
        this.saveAllData();
        
        this.showNotification('Meeting Started', `Timer started for "${meeting.title}"`, 'success');
    }

    showTimerView() {
        const timerView = document.getElementById('timerView');
        const titleElement = document.getElementById('timerTitle');
        
        if (this.currentMeeting) {
            titleElement.textContent = this.currentMeeting.title;
            this.renderTimerAgenda();
        }
        
        timerView.style.display = 'flex';
        this.updateTimerDisplay();
    }

    renderTimerAgenda() {
        const container = document.getElementById('agendaItems');
        if (!container || !this.currentMeeting) return;

        const agenda = this.currentMeeting.agenda || [];
        container.innerHTML = agenda.map((item, index) => `
            <div class="agenda-item" id="agendaItem${index}">
                <span contenteditable="true" onblur="agent.updateAgendaItem(${index}, this.textContent)">${item.title}</span>
                <span class="agenda-duration">${item.duration}m</span>
            </div>
        `).join('');
    }

    updateAgendaItem(index, newTitle) {
        if (this.currentMeeting && this.currentMeeting.agenda[index]) {
            this.currentMeeting.agenda[index].title = newTitle.trim();
            this.saveAllData();
        }
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.isTimerRunning = true;
        this.startTime = performance.now();
        
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);

        this.updateTimerStatus('Running');
    }

    updateTimer() {
        if (!this.currentTimer || !this.isTimerRunning) return;

        this.currentTimer.remainingTime -= 1;
        
        if (this.currentTimer.remainingTime <= 0) {
            this.currentTimer.remainingTime = 0;
            this.timerComplete();
            return;
        }

        this.updateTimerDisplay();
        this.checkTimerWarnings();
    }

    updateTimerDisplay() {
        if (!this.currentTimer) return;

        const minutes = Math.floor(this.currentTimer.remainingTime / 60);
        const seconds = this.currentTimer.remainingTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timerTime').textContent = timeString;
        
        // Update progress ring
        const progress = 1 - (this.currentTimer.remainingTime / this.currentTimer.totalDuration);
        const circumference = 2 * Math.PI * 120;
        const offset = circumference * (1 - progress);
        
        const progressRing = document.querySelector('.progress-ring-fill');
        if (progressRing) {
            progressRing.style.strokeDashoffset = offset;
            
            // Change color based on progress
            if (progress > 0.8) {
                progressRing.style.stroke = '#ef4444'; // Red
            } else if (progress > 0.5) {
                progressRing.style.stroke = '#f59e0b'; // Orange
            } else {
                progressRing.style.stroke = 'white'; // White
            }
        }

        // Update stats
        const elapsed = this.currentTimer.totalDuration - this.currentTimer.remainingTime;
        const elapsedMinutes = Math.floor(elapsed / 60);
        const elapsedSeconds = elapsed % 60;
        const elapsedString = `${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSeconds.toString().padStart(2, '0')}`;
        
        document.getElementById('elapsedTime').textContent = elapsedString;
        document.getElementById('progressPercent').textContent = Math.round(progress * 100) + '%';
    }

    checkTimerWarnings() {
        const remaining = this.currentTimer.remainingTime;
        
        // Play alerts at specific intervals
        if (remaining === 300) { // 5 minutes
            this.playSound('alert');
            this.showNotification('Time Alert', '5 minutes remaining', 'warning');
        } else if (remaining === 120) { // 2 minutes
            this.playSound('alert');
            this.showNotification('Time Alert', '2 minutes remaining', 'warning');
        } else if (remaining === 60) { // 1 minute
            this.playSound('alert');
            this.showNotification('Time Alert', '1 minute remaining', 'warning');
        } else if (remaining === 30) { // 30 seconds
            this.playSound('alert');
            this.showNotification('Time Alert', '30 seconds remaining', 'warning');
        }
    }

    pauseResumeTimer() {
        if (!this.currentTimer) return;

        if (this.isTimerRunning) {
            // Pause
            this.isTimerRunning = false;
            clearInterval(this.timerInterval);
            this.updateTimerStatus('Paused');
            document.getElementById('pauseResumeBtn').innerHTML = '▶️ Resume';
            this.showNotification('Timer Paused', 'Meeting timer has been paused', 'info');
        } else {
            // Resume
            this.startTimer();
            document.getElementById('pauseResumeBtn').innerHTML = '⏸️ Pause';
            this.showNotification('Timer Resumed', 'Meeting timer has been resumed', 'success');
        }
    }

    stopTimer() {
    if (!this.currentTimer) return;

    const actualDuration = Math.ceil((this.currentTimer.totalDuration - this.currentTimer.remainingTime) / 60);
    // Instead of calling completeMeeting directly, show the modal:
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
    this.updateTimerStatus('Stopped');
    this.showCompletionModal(Math.ceil(this.currentTimer.totalDuration / 60), actualDuration);
}


    timerComplete() {
        this.playSound('alert');
        this.isTimerRunning = false;
        clearInterval(this.timerInterval);
        this.updateTimerStatus('Completed');
        
        const plannedDuration = Math.ceil(this.currentTimer.totalDuration / 60);
        
        this.showCompletionModal(plannedDuration, plannedDuration);
    }

    showCompletionModal(plannedDuration, actualDuration) {
        const efficiency = Math.round((plannedDuration / actualDuration) * 100);
        
        const modalHtml = `
            <div class="modal" id="completionModal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="completion-modal">
                        <div class="completion-icon">🎉</div>
                        <h2>Meeting Complete!</h2>
                        <p>
                            <strong>Duration:</strong> ${actualDuration} minutes<br>
                            <strong>Efficiency:</strong> ${efficiency}%
                        </p>
                        <div class="completion-actions">
                            <button class="btn btn-outline" onclick="agent.snoozeTimer()">
                                ⏰ Snooze 5min
                            </button>
                            <button class="btn btn-primary" onclick="agent.finishMeeting()">
                                ✅ Finish Meeting
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHtml;
    }

    snoozeTimer() {
        if (!this.currentTimer) return;

        // Add 5 minutes
        this.currentTimer.remainingTime += 300;
        this.currentTimer.totalDuration += 300;
        
        // Close modal and resume timer
        document.getElementById('completionModal').remove();
        this.startTimer();
        
        this.playSound('snooze');
        this.showNotification('Timer Snoozed', 'Added 5 minutes to the meeting', 'info');
    }

    finishMeeting() {
        const actualDuration = Math.ceil((this.currentTimer.totalDuration - this.currentTimer.remainingTime) / 60);
        document.getElementById('completionModal').remove();
        this.completeMeeting(actualDuration);
    }

    completeMeeting(actualDuration) {
        if (!this.currentMeeting) return;

        const plannedDuration = this.currentMeeting.totalDuration || 30;
        const efficiency = Math.round((plannedDuration / actualDuration) * 100);
        
        // Save to analytics
        const completedMeeting = {
            id: this.currentMeeting.id,
            title: this.currentMeeting.title,
            plannedDuration: plannedDuration,
            actualDuration: actualDuration,
            efficiency: efficiency,
            completedAt: new Date().toISOString(),
            templateId: this.currentMeeting.templateId
        };

        this.analytics.completedMeetings.push(completedMeeting);
        this.analytics.totalTime = (this.analytics.totalTime || 0) + actualDuration;

        // Remove from scheduled meetings
        this.meetings = this.meetings.filter(m => m.id !== this.currentMeeting.id);
        
        // Cleanup
        this.exitTimerView();
        this.saveAllData();
        
        this.showNotification('Meeting Completed', `"${this.currentMeeting.title}" has been completed and saved to analytics`, 'success');
        
        // Switch to analytics tab
        this.switchTab('analytics');
    }

    exitTimerView() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.isTimerRunning = false;
        this.currentTimer = null;
        this.currentMeeting = null;
        
        document.getElementById('timerView').style.display = 'none';
        document.getElementById('pauseResumeBtn').innerHTML = '⏸️ Pause';
    }

    updateTimerStatus(status) {
        const statusElement = document.getElementById('timerStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    // Utility functions
    deleteMeeting(meetingId) {
        if (confirm('Are you sure you want to delete this meeting?')) {
            this.meetings = this.meetings.filter(m => m.id !== meetingId);
            this.saveAllData();
            this.renderMeetings();
            this.showNotification('Meeting Deleted', 'Meeting has been removed', 'success');
        }
    }

    deleteTemplate(templateId) {
        if (confirm('Are you sure you want to delete this template?')) {
            this.templates = this.templates.filter(t => t.id !== templateId);
            this.saveAllData();
            this.renderTemplates();
            this.renderTemplateOptions();
            this.showNotification('Template Deleted', 'Template has been removed', 'success');
        }
    }

    formatDateTime(date) {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    // Audio functions
    playSound(soundName) {
        if (!this.settings.soundEnabled) return;

        try {
            const audio = new Audio(`assets/sounds/${soundName}.mp3`);
            audio.volume = 0.5;
            audio.play().catch(console.warn);
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    }

    // Notification system
    showNotification(title, message, type = 'info') {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Data persistence
    loadFromStorage(key, defaultValue) {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch (error) {
            console.warn(`Failed to load ${key} from storage:`, error);
            return defaultValue;
        }
    }

    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save ${key} to storage:`, error);
            this.showNotification('Storage Error', 'Failed to save data', 'error');
        }
    }

    saveAllData() {
        this.saveToStorage('meetings', this.meetings);
        this.saveToStorage('templates', this.templates);
        this.saveToStorage('analytics', this.analytics);
        this.saveToStorage('settings', this.settings);
    }

    renderAll() {
        this.renderMeetings();
        this.renderTemplates();
        this.renderTemplateOptions();
        this.renderAnalytics();
    }

    // Default templates
    getDefaultTemplates() {
        return [
            {
                id: 'template_standup',
                name: 'Daily Standup',
                duration: 15,
                description: 'Yesterday, Today, Blockers, Next Steps',
                agenda: [
                    { title: "Yesterday's Progress", duration: 5 },
                    { title: "Today's Goals", duration: 5 },
                    { title: 'Blockers & Issues', duration: 3 },
                    { title: 'Next Steps', duration: 2 }
                ],
                createdAt: new Date().toISOString()
            },
            {
                id: 'template_client_review',
                name: 'Client Review',
                duration: 45,
                description: 'Welcome, Status, Demo, Q&A',
                agenda: [
                    { title: 'Welcome & Introductions', duration: 5 },
                    { title: 'Project Status Update', duration: 15 },
                    { title: 'Demo & Presentation', duration: 20 },
                    { title: 'Q&A and Next Steps', duration: 5 }
                ],
                createdAt: new Date().toISOString()
            },
            {
                id: 'template_brainstorming',
                name: 'Brainstorming Session',
                duration: 60,
                description: 'Problem, Ideation, Sharing, Planning',
                agenda: [
                    { title: 'Problem Definition', duration: 10 },
                    { title: 'Individual Ideation', duration: 20 },
                    { title: 'Idea Sharing', duration: 20 },
                    { title: 'Next Steps Planning', duration: 10 }
                ],
                createdAt: new Date().toISOString()
            }
        ];
    }

    // Background tasks
    startBackgroundTasks() {
        // Auto-save every 5 minutes
        setInterval(() => {
            this.saveAllData();
        }, 5 * 60 * 1000);

        // Update time displays every minute
        setInterval(() => {
            this.renderMeetings();
        }, 60 * 1000);
    }
}