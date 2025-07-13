/**
 * Calculadora de Balanço Hídrico - Arquivo Principal
 * Orquestração e inicialização da aplicação
 */

class HydricBalanceApp {
    
    constructor() {
        this.uiManager = new UIManager();
        this.formHandler = new FormHandler();
        this.initialize();
    }

    /**
     * Inicializa a aplicação
     */
    initialize() {
        this.setupEventListeners();
        this.setupTabNavigation();
        this.setInitialFocus();
    }

    /**
     * Configura os event listeners principais
     */
    setupEventListeners() {
        // Botão de cálculo
        this.uiManager.elements.calculateBtn?.addEventListener('click', () => {
            this.handleCalculation();
        });

        // Botão copiar resultado
        this.uiManager.elements.copyResultBtn?.addEventListener('click', () => {
            this.uiManager.copyReport();
        });

        // Botão novo paciente
        this.uiManager.elements.newPatientBtn?.addEventListener('click', () => {
            this.handleNewPatient();
        });
    }

    /**
     * Configura navegação entre tabs
     */
    setupTabNavigation() {
        const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
        tabElements.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (event) => {
                // Bootstrap já cuida da navegação
                // Adicionar lógica personalizada se necessário
            });
        });
    }

    /**
     * Define foco inicial
     */
    setInitialFocus() {
        // Focar no campo nome do paciente ao carregar
        this.uiManager.elements.patientName?.focus();
    }

    /**
     * Manipula o cálculo do balanço hídrico
     */
    async handleCalculation() {
        try {
            // Coletar dados do formulário
            const formData = this.formHandler.collectFormData();
            
            // Validar dados
            const validation = this.formHandler.validateForm(formData);
            if (!validation.isValid) {
                this.uiManager.showError(validation.message);
                this.formHandler.focusElement(validation.focusElement);
                return;
            }

            // Calcular balanço hídrico
            const calculationResult = HydricBalanceCalculator.calculate(formData);
            
            // Verificar se houve erro no cálculo
            if (calculationResult.error) {
                this.uiManager.showError(calculationResult.error);
                return;
            }

            // Exibir resultados
            this.uiManager.displayResults(calculationResult, formData);

        } catch (error) {
            console.error('Erro no cálculo:', error);
            this.uiManager.showError('Ocorreu um erro ao calcular o balanço hídrico. Por favor, tente novamente.');
        }
    }

    /**
     * Manipula a criação de novo paciente
     */
    handleNewPatient() {
        // Limpar formulário
        this.uiManager.clearForm();
        
        // Resetar campos de cálculo
        this.formHandler.resetAllCalculationFields();
    }
}

/**
 * Inicialização da aplicação quando DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se todas as dependências estão carregadas
    if (typeof HydricBalanceCalculator === 'undefined') {
        console.error('HydricBalanceCalculator não foi carregado');
        return;
    }
    
    if (typeof UIManager === 'undefined') {
        console.error('UIManager não foi carregado');
        return;
    }
    
    if (typeof FormHandler === 'undefined') {
        console.error('FormHandler não foi carregado');
        return;
    }

    // Inicializar aplicação
    try {
        window.hydricBalanceApp = new HydricBalanceApp();
        console.log('Calculadora de Balanço Hídrico inicializada com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar aplicação:', error);
        alert('Erro ao carregar a aplicação. Por favor, recarregue a página.');
    }
});