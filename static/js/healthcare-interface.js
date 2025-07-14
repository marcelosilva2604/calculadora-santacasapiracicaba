/**
 * Healthcare Interface Controller
 * Optimized for clinical workflows and accessibility
 */

class HealthcareInterface {
    constructor() {
        this.currentSection = 'patient';
        this.completedSections = new Set();
        this.fieldValues = new Map();
        this.progressSteps = ['patient', 'measurements', 'values'];
        this.isOnline = navigator.onLine;
        
        this.initializeInterface();
        this.setupEventListeners();
        this.setupAccessibility();
        this.setupOfflineHandling();
    }

    /**
     * Initialize the healthcare interface
     */
    initializeInterface() {
        // Hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }, 800);

        // Set initial focus
        this.setInitialFocus();
        
        // Update progress
        this.updateProgress();
        
        // Initialize calculation fields
        this.initializeCalculationFields();
        
        // Setup form validation
        this.setupFormValidation();
    }

    /**
     * Setup event listeners for healthcare-specific interactions
     */
    setupEventListeners() {
        // Section headers for collapsible behavior
        document.querySelectorAll('.healthcare-section-header').forEach(header => {
            header.addEventListener('click', (e) => this.toggleSection(e.target.closest('.healthcare-section')));
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleSection(e.target.closest('.healthcare-section'));
                }
            });
        });

        // Form inputs for progress tracking
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', () => this.handleInputChange(input));
            input.addEventListener('blur', () => this.validateField(input));
        });

        // Period selection
        document.querySelectorAll('input[name="timeframe"]').forEach(radio => {
            radio.addEventListener('change', () => this.handlePeriodChange());
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Online/offline status
        window.addEventListener('online', () => this.updateConnectionStatus(true));
        window.addEventListener('offline', () => this.updateConnectionStatus(false));
    }

    /**
     * Setup accessibility enhancements
     */
    setupAccessibility() {
        // Skip links
        const skipLink = document.querySelector('.sr-only');
        if (skipLink) {
            skipLink.addEventListener('focus', function() {
                this.classList.remove('sr-only');
            });
            skipLink.addEventListener('blur', function() {
                this.classList.add('sr-only');
            });
        }

        // Announce section changes
        this.setupAriaAnnouncements();
        
        // Focus management
        this.setupFocusManagement();
        
        // High contrast mode detection
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }
    }

    /**
     * Setup offline handling and PWA features
     */
    setupOfflineHandling() {
        // Update connection status
        this.updateConnectionStatus(this.isOnline);
        
        // Cache form data locally
        this.setupLocalStorage();
        
        // Show offline notification
        if (!this.isOnline) {
            this.showToast('Modo offline ativado. Os dados serão salvos localmente.', 'info');
        }
    }

    /**
     * Handle section navigation
     */
    nextSection(sectionId) {
        // Validate current section
        if (!this.validateCurrentSection()) {
            return;
        }

        // Mark current section as completed
        this.markSectionCompleted(this.currentSection);
        
        // Activate next section
        this.activateSection(sectionId);
        
        // Update progress
        this.updateProgress();
        
        // Announce change
        this.announceChange(`Avançando para: ${this.getSectionTitle(sectionId)}`);
    }

    previousSection(sectionId) {
        this.activateSection(sectionId);
        this.updateProgress();
        this.announceChange(`Voltando para: ${this.getSectionTitle(sectionId)}`);
    }

    /**
     * Activate a specific section
     */
    activateSection(sectionId) {
        // Deactivate all sections
        document.querySelectorAll('.healthcare-section').forEach(section => {
            section.classList.remove('active');
            const header = section.querySelector('.healthcare-section-header');
            header.setAttribute('aria-expanded', 'false');
            const content = section.querySelector('.healthcare-section-content');
            content.style.display = 'none';
        });

        // Activate target section
        const targetSection = document.getElementById(`section-${sectionId}`);
        if (targetSection) {
            targetSection.classList.add('active');
            const header = targetSection.querySelector('.healthcare-section-header');
            header.setAttribute('aria-expanded', 'true');
            const content = targetSection.querySelector('.healthcare-section-content');
            content.style.display = 'block';
            
            // Focus first input in section
            const firstInput = content.querySelector('input, select, textarea, button');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 300);
            }
        }

        this.currentSection = sectionId;
    }

    /**
     * Toggle section collapse/expand
     */
    toggleSection(section) {
        const isActive = section.classList.contains('active');
        const content = section.querySelector('.healthcare-section-content');
        const header = section.querySelector('.healthcare-section-header');
        const icon = header.querySelector('.section-icon');

        if (isActive) {
            section.classList.remove('active');
            header.setAttribute('aria-expanded', 'false');
            content.style.display = 'none';
            icon.classList.replace('bi-chevron-up', 'bi-chevron-down');
        } else {
            section.classList.add('active');
            header.setAttribute('aria-expanded', 'true');
            content.style.display = 'block';
            icon.classList.replace('bi-chevron-down', 'bi-chevron-up');
        }
    }

    /**
     * Handle input changes and update progress
     */
    handleInputChange(input) {
        const value = input.value.trim();
        const fieldName = input.id;
        
        // Store field value
        this.fieldValues.set(fieldName, value);
        
        // Update field styling
        if (value) {
            input.classList.add('success');
        } else {
            input.classList.remove('success');
        }
        
        // Update parent calculation field if applicable
        const calculationField = input.closest('.calculation-field');
        if (calculationField) {
            const hasValue = calculationField.querySelector('.calculation-total').textContent !== 'Total: 0 ml' &&
                            calculationField.querySelector('.calculation-total').textContent !== 'Total: 0 vezes';
            calculationField.classList.toggle('has-value', hasValue);
        }
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        // Update progress
        this.updateProgress();
    }

    /**
     * Update overall progress
     */
    updateProgress() {
        const totalFields = this.getTotalRequiredFields();
        const completedFields = this.getCompletedFields();
        const progressPercent = Math.round((completedFields / totalFields) * 100);
        
        // Update progress bar
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar && progressText) {
            progressBar.style.width = `${progressPercent}%`;
            progressText.textContent = `${progressPercent}% concluído`;
            
            // Update ARIA
            const progressContainer = progressBar.closest('.progress-container');
            if (progressContainer) {
                progressContainer.setAttribute('aria-valuenow', progressPercent);
            }
        }
    }

    /**
     * Handle calculation field operations
     */
    addCalculationValue(fieldType) {
        const input = document.getElementById(`${fieldType}-input`);
        if (!input.value.trim()) return;

        const formHandler = window.hydricBalanceApp?.formHandler;
        if (!formHandler) {
            this.showToast('Erro: Sistema de cálculo não carregado', 'error');
            return;
        }

        const field = formHandler.calculationFields.get(fieldType);
        if (field) {
            field.addValue();
            this.handleInputChange(input);
        }
    }

    clearCalculationField(fieldType) {
        const formHandler = window.hydricBalanceApp?.formHandler;
        if (!formHandler) return;

        const field = formHandler.calculationFields.get(fieldType);
        if (field) {
            field.reset();
            const calculationField = document.querySelector(`[data-field="${fieldType}"]`);
            if (calculationField) {
                calculationField.classList.remove('has-value');
            }
        }
    }

    /**
     * Calculate hydric balance
     */
    async calculateBalance() {
        console.log('calculateBalance() chamado');
        
        try {
            // Show loading state
            const button = document.getElementById('calculate-button');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Gerando relatório...';
            button.disabled = true;

            // Validar dados mínimos para o relatório
            const patientName = document.getElementById('patient-name')?.value;
            console.log('patientName:', patientName);
            
            if (!patientName || patientName.trim() === '') {
                console.log('Nome do paciente não informado');
                this.showToast('Por favor, informe o nome do paciente.', 'error');
                button.innerHTML = originalText;
                button.disabled = false;
                return;
            }

            // Gerar e exibir relatório
            console.log('window.reportGenerator:', window.reportGenerator);
            
            if (window.reportGenerator) {
                console.log('Chamando reportGenerator.showReport()');
                window.reportGenerator.showReport();
                this.announceChange('Relatório gerado com sucesso.');
            } else {
                console.error('Gerador de relatório não disponível');
                throw new Error('Gerador de relatório não disponível');
            }

            // Restore button
            button.innerHTML = originalText;
            button.disabled = false;

        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            alert('Erro ao gerar relatório: ' + error.message);
            this.showToast('Erro ao gerar relatório. Tente novamente.', 'error');
            
            // Restore button
            const button = document.getElementById('calculate-button');
            button.innerHTML = '<i class="bi bi-calculator"></i> Calcular Balanço';
            button.disabled = false;
        }
    }

    /**
     * Show results section
     */
    showResults() {
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
            
            // Focus on results
            setTimeout(() => {
                const resultsTitle = document.getElementById('results-title');
                if (resultsTitle) {
                    resultsTitle.focus();
                }
            }, 500);
        }
    }

    /**
     * Copy results to clipboard
     */
    async copyResults() {
        try {
            const uiManager = window.hydricBalanceApp?.uiManager;
            if (uiManager) {
                await uiManager.copyReport();
                this.showToast('Relatório copiado para a área de transferência', 'success');
            }
        } catch (error) {
            this.showToast('Erro ao copiar relatório', 'error');
        }
    }

    /**
     * Print results
     */
    printResults() {
        window.print();
    }

    /**
     * Reset for new patient
     */
    newPatient() {
        if (confirm('Tem certeza que deseja iniciar um novo paciente? Todos os dados atuais serão perdidos.')) {
            // Clear all fields
            document.querySelectorAll('input').forEach(input => {
                input.value = '';
                input.classList.remove('success');
            });

            // Clear calculation fields
            if (window.hydricBalanceApp?.formHandler) {
                window.hydricBalanceApp.formHandler.resetAllCalculationFields();
            }

            // Reset sections
            this.completedSections.clear();
            this.fieldValues.clear();
            
            // Hide results
            const resultsContainer = document.getElementById('results-container');
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
            }

            // Go to first section
            this.activateSection('patient');
            this.updateProgress();
            
            // Clear localStorage
            this.clearLocalStorage();
            
            this.showToast('Pronto para novo paciente', 'success');
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toastId = type === 'error' ? 'error-toast' : 'success-toast';
        const messageId = type === 'error' ? 'error-message' : 'success-message';
        
        const toast = document.getElementById(toastId);
        const messageElement = document.getElementById(messageId);
        
        if (toast && messageElement) {
            messageElement.textContent = message;
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }

    /**
     * Keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter = Calculate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (this.currentSection === 'values') {
                this.calculateBalance();
            }
        }
        
        // Ctrl/Cmd + N = New patient
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.newPatient();
        }
        
        // Ctrl/Cmd + C = Copy results (when results visible)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.getElementById('results-container').style.display !== 'none') {
            e.preventDefault();
            this.copyResults();
        }
    }

    /**
     * Validation helpers
     */
    validateCurrentSection() {
        switch (this.currentSection) {
            case 'patient':
                return this.validatePatientSection();
            case 'measurements':
                return true; // Optional section
            case 'values':
                return this.validateValuesSection();
            default:
                return true;
        }
    }

    validatePatientSection() {
        const name = document.getElementById('patient-name').value.trim();
        const weight = parseFloat(document.getElementById('patient-weight').value);

        if (!name) {
            this.showToast('Nome do paciente é obrigatório', 'error');
            document.getElementById('patient-name').focus();
            return false;
        }

        if (!weight || weight <= 0) {
            this.showToast('Peso do paciente deve ser maior que zero', 'error');
            document.getElementById('patient-weight').focus();
            return false;
        }

        return true;
    }

    validateValuesSection() {
        const diet = parseFloat(document.getElementById('diet').value) || 0;
        const serum = parseFloat(document.getElementById('serum').value) || 0;
        const medication = parseFloat(document.getElementById('medication').value) || 0;

        if (diet === 0 && serum === 0 && medication === 0) {
            this.showToast('Informe pelo menos um valor de entrada (Dieta, Soro ou Medicação)', 'error');
            return false;
        }

        return true;
    }

    /**
     * Utility methods
     */
    getSectionTitle(sectionId) {
        const titles = {
            'patient': 'Dados do Paciente',
            'measurements': 'Sinais Vitais e Medições',
            'values': 'Entradas e Saídas'
        };
        return titles[sectionId] || sectionId;
    }

    getTotalRequiredFields() {
        return 8; // name, weight, diet/serum/medication (at least one), etc.
    }

    getCompletedFields() {
        let completed = 0;
        
        // Required fields
        if (this.fieldValues.get('patient-name')) completed++;
        if (parseFloat(document.getElementById('patient-weight')?.value) > 0) completed++;
        
        // At least one input
        const diet = parseFloat(document.getElementById('diet')?.value) || 0;
        const serum = parseFloat(document.getElementById('serum')?.value) || 0;
        const medication = parseFloat(document.getElementById('medication')?.value) || 0;
        if (diet > 0 || serum > 0 || medication > 0) completed++;
        
        return Math.min(completed, this.getTotalRequiredFields());
    }

    /**
     * Local storage management
     */
    saveToLocalStorage() {
        if (typeof Storage !== 'undefined') {
            const data = {
                fieldValues: Array.from(this.fieldValues.entries()),
                timestamp: Date.now()
            };
            localStorage.setItem('hydric-balance-data', JSON.stringify(data));
        }
    }

    loadFromLocalStorage() {
        if (typeof Storage !== 'undefined') {
            const data = localStorage.getItem('hydric-balance-data');
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    this.fieldValues = new Map(parsed.fieldValues);
                    
                    // Restore field values
                    this.fieldValues.forEach((value, fieldId) => {
                        const field = document.getElementById(fieldId);
                        if (field) {
                            field.value = value;
                            this.handleInputChange(field);
                        }
                    });
                } catch (e) {
                    console.warn('Error loading from localStorage:', e);
                }
            }
        }
    }

    clearLocalStorage() {
        if (typeof Storage !== 'undefined') {
            localStorage.removeItem('hydric-balance-data');
        }
    }

    /**
     * Connection status management
     */
    updateConnectionStatus(isOnline) {
        this.isOnline = isOnline;
        const statusElement = document.getElementById('connection-status');
        const indicator = statusElement?.querySelector('.status-indicator');
        const text = statusElement?.querySelector('.status-text');
        
        if (indicator && text) {
            if (isOnline) {
                indicator.className = 'status-indicator online';
                text.textContent = 'Online';
            } else {
                indicator.className = 'status-indicator offline';
                text.textContent = 'Offline';
            }
        }
    }

    /**
     * Accessibility helpers
     */
    announceChange(message) {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.textContent = message;
        
        document.body.appendChild(announcer);
        
        setTimeout(() => {
            document.body.removeChild(announcer);
        }, 1000);
    }

    setInitialFocus() {
        const firstInput = document.getElementById('patient-name');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    setupAriaAnnouncements() {
        // Set up live regions for dynamic content
        const liveRegions = document.querySelectorAll('[aria-live]');
        liveRegions.forEach(region => {
            // Ensure proper ARIA setup
            if (!region.getAttribute('aria-atomic')) {
                region.setAttribute('aria-atomic', 'true');
            }
        });
    }

    setupFocusManagement() {
        // Trap focus in modals if any
        // Manage focus order for complex interactions
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                // Custom tab order management if needed
            }
        });
    }

    initializeCalculationFields() {
        // Initialize calculation field behaviors
        document.querySelectorAll('.calculation-field').forEach(field => {
            const input = field.querySelector('.calculation-input');
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const addButton = field.querySelector('.calculation-button.primary');
                        if (addButton) {
                            addButton.click();
                        }
                    }
                });
            }
        });
    }

    setupFormValidation() {
        // Real-time validation for all form fields
        document.querySelectorAll('input[required]').forEach(input => {
            input.addEventListener('invalid', (e) => {
                e.preventDefault();
                this.showFieldError(input, 'Este campo é obrigatório');
            });
        });
    }

    validateField(input) {
        // Custom validation logic
        if (input.hasAttribute('required') && !input.value.trim()) {
            this.showFieldError(input, 'Este campo é obrigatório');
            return false;
        }
        
        if (input.type === 'number') {
            const value = parseFloat(input.value);
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);
            
            if (input.value && (isNaN(value) || (min && value < min) || (max && value > max))) {
                this.showFieldError(input, 'Valor inválido para este campo');
                return false;
            }
        }
        
        this.clearFieldError(input);
        return true;
    }

    showFieldError(input, message) {
        input.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        
        // Show error message
        let errorElement = input.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.setAttribute('role', 'alert');
            input.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    clearFieldError(input) {
        input.classList.remove('error');
        input.setAttribute('aria-invalid', 'false');
        
        const errorElement = input.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    markSectionCompleted(sectionId) {
        this.completedSections.add(sectionId);
        const section = document.getElementById(`section-${sectionId}`);
        if (section) {
            const header = section.querySelector('.healthcare-section-header');
            const step = header.querySelector('.healthcare-section-step');
            header.classList.add('completed');
            step.classList.add('completed');
            step.innerHTML = '<i class="bi bi-check"></i>';
        }
    }

    validateAllSections() {
        return this.validatePatientSection() && this.validateValuesSection();
    }
}

// Global functions for HTML onclick handlers
window.nextSection = (sectionId) => window.healthcareInterface?.nextSection(sectionId);
window.previousSection = (sectionId) => window.healthcareInterface?.previousSection(sectionId);
window.addCalculationValue = (fieldType) => window.healthcareInterface?.addCalculationValue(fieldType);
window.clearCalculationField = (fieldType) => window.healthcareInterface?.clearCalculationField(fieldType);
window.calculateBalance = () => window.healthcareInterface?.calculateBalance();
window.copyResults = () => window.healthcareInterface?.copyResults();
window.printResults = () => window.healthcareInterface?.printResults();
window.newPatient = () => window.healthcareInterface?.newPatient();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.healthcareInterface = new HealthcareInterface();
});