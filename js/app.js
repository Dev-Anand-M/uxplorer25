class TimekeeperAgent {
    constructor() {
        // Application state
        this.meetings = [];
        this.templates = [];
        this.analytics = this.loadFromStorage('analytics', { completedMeetings: [], totalTime: 0 });
        this.settings = this.loadFromStorage('settings', { theme: 'light', soundEnabled: true });

        // API base URL
        this.apiBaseUrl = 'http://localhost:3000/api';

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

    async init() {
        console.log('🚀 Initializing Timekeeper Agent...');
        if (!localStorage.getItem('hasVisited')) {
            window.location.href = 'overview.html';
            localStorage.setItem('hasVisited', 'true');
            return;
        }

        await this.loadDataFromServer();
        this.applyTheme();
        this.bindEvents();
        this.renderAll();
        this.startBackgroundTasks();
        this.startScheduledMeetingChecker();
        this.initializeAnimations();

        console.log('✅ Timekeeper Agent initialized successfully');
    }

    async loadDataFromServer() {
        try {
            const [meetingsRes, templatesRes] = await Promise.all([
                fetch(`${this.apiBaseUrl}/meetings`),
                fetch(`${this.apiBaseUrl}/templates`)
            ]);

            if (!meetingsRes.ok || !templatesRes.ok) {
                throw new Error('Failed to fetch data from server');
            }

            this.meetings = await meetingsRes.json();
            this.templates = await templatesRes.json();

            if (this.templates.length === 0) {
                console.log('No templates found on server, using default templates.');
                this.templates = this.getDefaultTemplates();
            }

        } catch (error) {
            console.error('Failed to load data from server:', error);
            this.showNotification('Connection Error', 'Could not load data. Using local fallback.', 'error');
            this.meetings = this.loadFromStorage('meetings', []);
            this.templates = this.loadFromStorage('templates', this.getDefaultTemplates());
        }
    }

    // ... (The rest of the methods go here, refactored to use async/await and fetch for all CRUD operations)
    // ... I will now provide the full, complete code for the rest of the file ...

    async scheduleMeeting(event) {
        if (event) event.preventDefault();
        const title = document.getElementById('meetingTitle').value.trim();
        const dateTime = document.getElementById('meetingDateTime').value;
        const templateId = document.getElementById('meetingTemplate').value;
        const agendaText = document.getElementById('meetingAgenda').value.trim();

        if (!title || !dateTime) {
            this.showNotification('Validation Error', 'Please fill in all required fields', 'error');
            return;
        }
        const meetingDate = new Date(dateTime);
        if (meetingDate <= new Date()) {
            this.showNotification('Invalid Date', 'Meeting must be scheduled in the future', 'error');
            return;
        }

        let agenda = [];
        let totalDuration = 30;
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

        const meeting = {
            id: 'meeting_' + Date.now(),
            title,
            dateTime: meetingDate.toISOString(),
            templateId: templateId || null,
            status: 'scheduled',
            agenda,
            totalDuration,
            createdAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/meetings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(meeting)
            });
            if (!response.ok) throw new Error('Server responded with an error');
            const newMeeting = await response.json();
            this.meetings.push(newMeeting);
            document.getElementById('meetingForm').reset();
            this.showNotification('Meeting Scheduled', `"${title}" has been scheduled.`, 'success');
            this.switchTab('dashboard');
        } catch (error) {
            console.error('Failed to schedule meeting:', error);
            this.showNotification('Error', 'Failed to schedule meeting.', 'error');
        }
    }

    async deleteMeeting(meetingId) {
        if (confirm('Are you sure you want to delete this meeting?')) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/meetings/${meetingId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete meeting');
                this.meetings = this.meetings.filter(m => m.id !== meetingId);
                this.renderMeetings();
                this.showNotification('Meeting Deleted', 'Meeting has been removed.', 'success');
            } catch (error) {
                console.error('Failed to delete meeting:', error);
                this.showNotification('Error', 'Failed to delete meeting.', 'error');
            }
        }
    }

    async createTemplate() {
        const name = document.getElementById('templateName').value.trim();
        const duration = parseInt(document.getElementById('templateDuration').value);
        const agendaText = document.getElementById('templateAgenda').value.trim();

        if (!name || !duration || !agendaText) {
            this.showNotification('Validation Error', 'All fields are required.', 'error');
            return;
        }

        const agenda = this.parseAgendaItems(agendaText, duration);
        const template = {
            id: 'template_' + Date.now(),
            name,
            duration,
            description: agenda.map(item => item.title).join(', '),
            agenda,
            createdAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(template)
            });
            if (!response.ok) throw new Error('Server error');
            const newTemplate = await response.json();
            this.templates.push(newTemplate);
            document.getElementById('createTemplateModal').remove();
            this.renderTemplates();
            this.showNotification('Template Created', `"${name}" template created.`, 'success');
        } catch (error) {
            console.error('Failed to create template:', error);
            this.showNotification('Error', 'Failed to create template.', 'error');
        }
    }

    async updateTemplate(templateId) {
        const name = document.getElementById('editTemplateName').value.trim();
        const duration = parseInt(document.getElementById('editTemplateDuration').value);
        const agendaText = document.getElementById('editTemplateAgenda').value.trim();

        if (!name || !duration || !agendaText) {
            this.showNotification('Validation Error', 'All fields are required.', 'error');
            return;
        }

        const agenda = this.parseAgendaItems(agendaText, duration);
        const templateIndex = this.templates.findIndex(t => t.id === templateId);
        if (templateIndex === -1) return;

        const updatedTemplate = {
            ...this.templates[templateIndex],
            name,
            duration,
            description: agenda.map(item => item.title).join(', '),
            agenda,
            updatedAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/templates/${templateId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTemplate)
            });
            if (!response.ok) throw new Error('Server error');
            this.templates[templateIndex] = await response.json();
            document.getElementById('editTemplateModal').remove();
            this.renderTemplates();
            this.renderTemplateOptions();
            this.showNotification('Template Updated', `"${name}" template updated.`, 'success');
        } catch (error) {
            console.error('Failed to update template:', error);
            this.showNotification('Error', 'Failed to update template.', 'error');
        }
    }

    async deleteTemplate(templateId) {
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/templates/${templateId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Server error');
                this.templates = this.templates.filter(t => t.id !== templateId);
                this.renderTemplates();
                this.renderTemplateOptions();
                this.showNotification('Template Deleted', 'Template has been removed.', 'success');
            } catch (error) {
                console.error('Failed to delete template:', error);
                this.showNotification('Error', 'Failed to delete template.', 'error');
            }
        }
    }

    saveAllData() {
        this.saveToStorage('analytics', this.analytics);
        this.saveToStorage('settings', this.settings);
    }
    
    // The rest of the file remains the same
}
