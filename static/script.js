document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.dataset.view;

            // Update Active State
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Switch View with Animation
            views.forEach(v => {
                v.classList.remove('active', 'fade-in-up');
                if (v.id === `view-${targetView}`) {
                    v.classList.add('active', 'fade-in-up');
                    // Trigger counter animation if dashboard
                    if (targetView === 'dashboard') runCounters();
                }
            });

            // Update Title
            pageTitle.textContent = item.innerText.trim();
        });
    });

    // Number Counting Animation
    function runCounters() {
        const counters = document.querySelectorAll('.count-up');
        counters.forEach(counter => {
            const target = +counter.dataset.target;
            const duration = 1500; // ms
            const increment = target / (duration / 16);

            let current = 0;
            const updateCount = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    requestAnimationFrame(updateCount);
                } else {
                    counter.innerText = target;
                }
            };
            updateCount();
        });
    }

    // Initial run
    fetchDashboardStats();

    // Chart Instance
    let activityChart = null;

    async function fetchDashboardStats() {
        try {
            const response = await fetch('/dashboard_stats');
            const data = await response.json();

            // Update Counters
            const totalEl = document.getElementById('stat-total-generated');
            if (totalEl) {
                totalEl.dataset.target = data.total_generated;
                totalEl.innerText = data.total_generated; // Update immediately for now
            }

            // Update Top Tool
            const usage = data.usage_breakdown;
            let topTool = '-';
            let maxCount = 0;
            for (const [tool, count] of Object.entries(usage)) {
                if (count > maxCount) {
                    maxCount = count;
                    topTool = tool;
                }
            }
            document.getElementById('stat-top-tool').innerText = topTool;

            // Update Chart
            updateChart(usage);

            // Update Activity Feed
            updateActivityFeed(data.recent_activity);

        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        }
    }

    function updateChart(usageData) {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        const labels = Object.keys(usageData);
        const values = Object.values(usageData);

        if (activityChart) {
            activityChart.destroy();
        }

        activityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['No Data'],
                datasets: [{
                    data: values.length ? values : [1],
                    backgroundColor: [
                        '#00f2ff', // Neon Cyan
                        '#bc13fe', // Neon Purple
                        '#ff007a', // Pink
                        '#444'     // Fallback
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#fff', font: { family: 'Outfit' } }
                    }
                }
            }
        });
    }

    function updateActivityFeed(activities) {
        const list = document.getElementById('activity-list');
        if (!list) return;

        if (!activities || activities.length === 0) {
            list.innerHTML = '<li class="empty-state">No recent activity.</li>';
            return;
        }

        list.innerHTML = activities.map(act => `
            <li>
                <span class="type">${act.tool_type}</span>
                <span class="summary">${act.input_summary || 'Generated content'}</span>
                <span class="time">${new Date(act.timestamp).toLocaleTimeString()}</span>
            </li>
        `).join('');
    }

    // Form Handling Logic (Generic)
    setupForm('campaign-form', '/generate_campaign', 'campaign-result-container');
    setupForm('pitch-form', '/generate_pitch', 'pitch-result-container');
    setupForm('lead-form', '/lead_score', 'lead-result-container');

    function setupForm(formId, endpoint, resultContainerId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const container = document.getElementById(resultContainerId);
            const contentArea = container.querySelector('.results-content');
            const placeholder = container.querySelector('.placeholder-state');

            // Show Loading State
            contentArea.classList.add('hidden');
            placeholder.classList.remove('hidden');
            placeholder.innerHTML = `
                <div class="pulse-ring"></div>
                <div style="text-align:center">
                    <p style="color: var(--neon-cyan); margin-bottom: 5px;">AI Neural Network Processing...</p>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">Analyzing parameters & generating optimized copy</p>
                </div>`;

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                // Render Result
                placeholder.classList.add('hidden');
                contentArea.classList.remove('hidden');
                contentArea.innerHTML = ''; // Clear previous content

                await renderResultWithTyping(result, contentArea);

                // Auto-save the result
                saveGeneration(endpoint, data, result);

                contentArea.classList.add('fade-in-up'); // Re-trigger animation

            } catch (error) {
                placeholder.innerHTML = `<p style="color: #ff007a">System Error: ${error.message}</p>`;
            }
        });
    }

    async function renderResultWithTyping(data, container) {
        if (data.error) {
            container.innerHTML = `<h3 style="color: #ff007a">Error</h3><p>${data.error.message || data.error}</p>`;
            return;
        }

        for (const [key, value] of Object.entries(data)) {
            // Create Section (card)
            const section = document.createElement('div');
            section.className = 'result-section';

            const title = document.createElement('h3');
            title.textContent = key;
            section.appendChild(title);

            container.appendChild(section);

            // Handle Content
            if (Array.isArray(value)) {
                const ul = document.createElement('ul');
                section.appendChild(ul);

                for (const item of value) {
                    const li = document.createElement('li');
                    ul.appendChild(li);
                    await typeText(li, item, 10); // Type list items faster
                }
            } else {
                const p = document.createElement('p');
                section.appendChild(p);
                await typeText(p, String(value), 5); // Type paragraphs
            }

            // Small pause between sections
            await new Promise(r => setTimeout(r, 100));
        }
    }

    function typeText(element, text, speed) {
        return new Promise(resolve => {
            element.classList.add('typing-cursor');
            let i = 0;
            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    element.classList.remove('typing-cursor');
                    resolve();
                }
            }
            type();
        });
    }

    // Template Functions
    window.useTemplate = function (templateId) {
        const templates = {
            'product-launch': {
                product: 'New Product',
                audience: 'Early adopters and tech enthusiasts',
                platform: 'Instagram',
                goal: 'Brand Awareness',
                tone: 'Professional'
            },
            'free-trial': {
                product: 'SaaS Platform',
                audience: 'Small business owners',
                platform: 'LinkedIn',
                goal: 'Lead Generation',
                tone: 'Professional'
            },
            'linkedin': {
                product: 'B2B Service',
                audience: 'Decision makers and executives',
                platform: 'LinkedIn',
                goal: 'Lead Generation',
                tone: 'Professional'
            },
            'seasonal': {
                product: 'Retail Products',
                audience: 'General consumers',
                platform: 'Any',
                goal: 'Direct Sales',
                tone: 'Urgent/FOMO'
            },
            'consultation': {
                product: 'Professional Services',
                audience: 'Business professionals',
                platform: 'Email',
                goal: 'Lead Generation',
                tone: 'Empathetic'
            },
            'webinar': {
                product: 'Educational Webinar',
                audience: 'Industry professionals',
                platform: 'Email',
                goal: 'Engagement',
                tone: 'Professional'
            }
        };

        const template = templates[templateId];
        if (template) {
            // Switch to campaign view
            document.querySelector('[data-view="campaign"]').click();

            // Fill form
            setTimeout(() => {
                document.getElementById('c-product').value = template.product;
                document.getElementById('c-audience').value = template.audience;
                document.querySelector('[name="platform"]').value = template.platform;
                document.querySelector('[name="goal"]').value = template.goal;
                document.querySelector('[name="tone"]').value = template.tone;
            }, 300);
        }
    };

    // Saved Campaigns Functions
    window.clearAllSaved = function () {
        if (confirm('Are you sure you want to clear all saved campaigns?')) {
            localStorage.removeItem('savedCampaigns');
            loadSavedCampaigns();
        }
    };

    function loadSavedCampaigns() {
        const saved = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');
        const grid = document.getElementById('saved-campaigns-grid');

        if (saved.length === 0) {
            grid.innerHTML = `
                <div class="empty-state-large glass-panel">
                    <div class="empty-icon">💾</div>
                    <h3>No Saved Campaigns Yet</h3>
                    <p>Generate campaigns and save them for future reference</p>
                </div>
            `;
        } else {
            grid.innerHTML = saved.map((campaign, index) => `
                <div class="template-card glass-panel">
                    <div class="template-badge">${campaign.type || 'Campaign'}</div>
                    <h3>${campaign.title || 'Untitled Campaign'}</h3>
                    <p>${campaign.summary || 'No description'}</p>
                    <button class="btn-use-template" onclick="viewSavedCampaign(${index})">View Details</button>
                </div>
            `).join('');
        }
    }

    window.viewSavedCampaign = function (index) {
        const saved = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');
        const campaign = saved[index];
        alert('Saved Campaign:\n\n' + JSON.stringify(campaign, null, 2));
    };

    // Initialize saved campaigns view
    loadSavedCampaigns();

    // Save Generation Function
    function saveGeneration(endpoint, inputData, result) {
        if (result.error) return; // Don't save errors

        const saved = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');

        let type = 'Unknown';
        let title = 'Untitled';
        let summary = '';

        // Determine type and extract key info
        if (endpoint === '/generate_campaign') {
            type = 'Campaign';
            title = `${inputData.product} - ${inputData.platform}`;
            summary = `Goal: ${inputData.goal || 'N/A'}, Tone: ${inputData.tone || 'N/A'}`;
        } else if (endpoint === '/generate_pitch') {
            type = 'Sales Pitch';
            title = `${inputData.product} Pitch`;
            summary = `Format: ${inputData.format || 'N/A'}`;
        } else if (endpoint === '/lead_score') {
            type = 'Lead Score';
            title = `${inputData.name}`;
            summary = `Score: ${result.Score || 'N/A'}, Budget: $${inputData.budget}`;
        }

        const generation = {
            id: Date.now(),
            type: type,
            title: title,
            summary: summary,
            timestamp: new Date().toISOString(),
            input: inputData,
            output: result
        };

        saved.unshift(generation); // Add to beginning

        // Keep only last 50 generations
        if (saved.length > 50) {
            saved.pop();
        }

        localStorage.setItem('savedCampaigns', JSON.stringify(saved));

        // Show notification
        showNotification(`✓ ${type} saved successfully!`);
    }

    // Update loadSavedCampaigns to show more details
    function loadSavedCampaigns() {
        const saved = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');
        const grid = document.getElementById('saved-campaigns-grid');

        if (!grid) return; // Exit if not on saved campaigns page

        if (saved.length === 0) {
            grid.innerHTML = `
                <div class="empty-state-large glass-panel">
                    <div class="empty-icon">💾</div>
                    <h3>No Saved Items Yet</h3>
                    <p>All your AI generations will be automatically saved here</p>
                </div>
            `;
        } else {
            grid.innerHTML = saved.map((item, index) => {
                const date = new Date(item.timestamp);
                const timeAgo = getTimeAgo(date);

                return `
                <div class="saved-campaign-card glass-panel">
                    <div class="saved-header">
                        <div class="template-badge">${item.type}</div>
                        <button class="delete-btn" onclick="deleteSaved(${index})" title="Delete">🗑️</button>
                    </div>
                    <h3>${item.title}</h3>
                    <p class="saved-summary">${item.summary}</p>
                    <div class="saved-meta">
                        <span class="time-ago">⏱️ ${timeAgo}</span>
                    </div>
                    <button class="btn-use-template" onclick="viewSavedCampaign(${index})">View Details</button>
                </div>
            `}).join('');
        }
    }

    // Enhanced viewSavedCampaign
    window.viewSavedCampaign = function (index) {
        const saved = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');
        const item = saved[index];

        if (!item) return;

        // Create modal to display details
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content glass-panel">
                <div class="modal-header">
                    <h2>${item.title}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="modal-section">
                        <h3>Type</h3>
                        <p>${item.type}</p>
                    </div>
                    <div class="modal-section">
                        <h3>Generated</h3>
                        <p>${new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                    <div class="modal-section">
                        <h3>Input</h3>
                        <pre>${JSON.stringify(item.input, null, 2)}</pre>
                    </div>
                    <div class="modal-section">
                        <h3>Output</h3>
                        <div class="output-content">
                            ${formatOutput(item.output)}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="copyToClipboard(${index})">📋 Copy</button>
                    <button class="btn-danger" onclick="deleteSaved(${index}); this.closest('.modal-overlay').remove();">🗑️ Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    // Delete saved item
    window.deleteSaved = function (index) {
        if (confirm('Delete this saved item?')) {
            const saved = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');
            saved.splice(index, 1);
            localStorage.setItem('savedCampaigns', JSON.stringify(saved));
            loadSavedCampaigns();
            showNotification('Item deleted');
        }
    };

    // Copy to clipboard
    window.copyToClipboard = function (index) {
        const saved = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');
        const item = saved[index];
        const text = JSON.stringify(item.output, null, 2);

        navigator.clipboard.writeText(text).then(() => {
            showNotification('✓ Copied to clipboard!');
        });
    };

    // Helper: Format output for display
    function formatOutput(output) {
        let html = '';
        for (const [key, value] of Object.entries(output)) {
            html += `<div class="result-section"><h3>${key}</h3>`;
            if (Array.isArray(value)) {
                html += `<ul>${value.map(item => `<li>${item}</li>`).join('')}</ul>`;
            } else {
                html += `<p>${value}</p>`;
            }
            html += `</div>`;
        }
        return html;
    }

    // Helper: Time ago
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
        return date.toLocaleDateString();
    }

    // Notification system
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Search functionality
    const searchInput = document.getElementById('search-saved');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const saved = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');

            const filtered = saved.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.type.toLowerCase().includes(query) ||
                item.summary.toLowerCase().includes(query)
            );

            displayFilteredResults(filtered);
        });
    }

    function displayFilteredResults(items) {
        const grid = document.getElementById('saved-campaigns-grid');
        if (!grid) return;

        if (items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state-large glass-panel">
                    <div class="empty-icon">🔍</div>
                    <h3>No Results Found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
        } else {
            const saved = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');
            grid.innerHTML = items.map((item) => {
                const index = saved.indexOf(item);
                const date = new Date(item.timestamp);
                const timeAgo = getTimeAgo(date);

                return `
                <div class="saved-campaign-card glass-panel">
                    <div class="saved-header">
                        <div class="template-badge">${item.type}</div>
                        <button class="delete-btn" onclick="deleteSaved(${index})" title="Delete">🗑️</button>
                    </div>
                    <h3>${item.title}</h3>
                    <p class="saved-summary">${item.summary}</p>
                    <div class="saved-meta">
                        <span class="time-ago">⏱️ ${timeAgo}</span>
                    </div>
                    <button class="btn-use-template" onclick="viewSavedCampaign(${index})">View Details</button>
                </div>
            `}).join('');
        }
    }

    // Settings Functions
    window.clearAllData = function () {
        if (confirm('⚠️ This will delete ALL saved campaigns, pitches, and lead scores. This action cannot be undone.\n\nAre you sure you want to continue?')) {
            localStorage.removeItem('savedCampaigns');
            showNotification('✓ All data cleared successfully');
            loadSavedCampaigns();
        }
    };

    window.exportAllData = function () {
        const saved = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');

        if (saved.length === 0) {
            showNotification('⚠️ No data to export');
            return;
        }

        // Create export data
        const exportData = {
            exportDate: new Date().toISOString(),
            totalItems: saved.length,
            data: saved
        };

        // Convert to JSON
        const jsonString = JSON.stringify(exportData, null, 2);

        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `marketai-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification(`✓ Exported ${saved.length} items successfully`);
    };

    // Color picker functionality
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function () {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');

            const color = this.style.background;
            document.documentElement.style.setProperty('--neon-cyan', color);
            showNotification('✓ Accent color updated');
        });
    });

    // Theme selector
    const themeSelect = document.querySelector('.settings-section select');
    if (themeSelect && themeSelect.previousElementSibling?.textContent === 'Theme') {
        themeSelect.addEventListener('change', function () {
            const theme = this.value;
            if (theme === 'Light') {
                showNotification('💡 Light theme coming soon!');
            } else if (theme === 'Auto') {
                showNotification('🌓 Auto theme coming soon!');
            } else {
                showNotification('✓ Dark theme active');
            }
        });
    }
});
