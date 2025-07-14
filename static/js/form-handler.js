/**
 * Form Handler - Manipulação de Formulários
 * Responsável por toda lógica de campos de entrada com cálculos
 */

class FormHandler {
    
    constructor() {
        this.calculationFields = new Map();
        this.initializeCalculationFields();
    }

    /**
     * Inicializa todos os campos de cálculo
     */
    initializeCalculationFields() {
        const fieldConfigs = [
            { fieldId: 'heart-rate', inputId: 'heart-rate-input', listId: 'heart-rate-list', totalId: 'heart-rate-total', unit: 'bpm' },
            { fieldId: 'respiratory-rate', inputId: 'respiratory-rate-input', listId: 'respiratory-rate-list', totalId: 'respiratory-rate-total', unit: 'irpm' },
            { fieldId: 'oxygen-saturation', inputId: 'oxygen-saturation-input', listId: 'oxygen-saturation-list', totalId: 'oxygen-saturation-total', unit: '%' },
            { fieldId: 'temperature', inputId: 'temperature-input', listId: 'temperature-list', totalId: 'temperature-total', unit: '°C' },
            { fieldId: 'mean-arterial-pressure', inputId: 'mean-arterial-pressure-input', listId: 'mean-arterial-pressure-list', totalId: 'mean-arterial-pressure-total', unit: 'mmHg' },
            { fieldId: 'blood-glucose', inputId: 'blood-glucose-input', listId: 'blood-glucose-list', totalId: 'blood-glucose-total', unit: 'mg/dL' },
            { fieldId: 'diet', inputId: 'diet-input', listId: 'diet-list', totalId: 'diet-total', unit: 'ml' },
            { fieldId: 'serum', inputId: 'serum-input', listId: 'serum-list', totalId: 'serum-total', unit: 'ml' },
            { fieldId: 'medication', inputId: 'medication-input', listId: 'medication-list', totalId: 'medication-total', unit: 'ml' },
            { fieldId: 'diuresis', inputId: 'diuresis-input', listId: 'diuresis-list', totalId: 'diuresis-total', unit: 'ml' },
            { fieldId: 'gastric-residue', inputId: 'gastric-residue-input', listId: 'gastric-residue-list', totalId: 'gastric-residue-total', unit: 'ml' },
            { fieldId: 'emesis', inputId: 'emesis-input', listId: 'emesis-list', totalId: 'emesis-total', unit: 'vezes' },
            { fieldId: 'evacuations', inputId: 'evacuations-input', listId: 'evacuations-list', totalId: 'evacuations-total', unit: 'vezes' }
        ];

        fieldConfigs.forEach(config => {
            this.setupCalculationField(config);
        });
    }

    /**
     * Configura um campo de cálculo individual
     */
    setupCalculationField(config) {
        const field = new CalculationField(config);
        this.calculationFields.set(config.fieldId, field);
    }

    /**
     * Coleta todos os dados do formulário
     */
    collectFormData() {
        return {
            timeframe: document.querySelector('input[name="timeframe"]:checked')?.value || '24',
            patientInfo: this.collectPatientInfo(),
            vitalSigns: this.collectVitalSigns(),
            inputs: this.collectInputValues(),
            outputs: this.collectOutputValues()
        };
    }

    /**
     * Coleta informações do paciente
     */
    collectPatientInfo() {
        return {
            name: document.getElementById('patient-name')?.value || '',
            bed: document.getElementById('patient-bed')?.value || '',
            weight: parseFloat(document.getElementById('patient-weight')?.value) || 0
        };
    }

    /**
     * Coleta sinais vitais
     */
    collectVitalSigns() {
        return {
            heartRate: parseFloat(document.getElementById('heart-rate')?.value) || 0,
            respiratoryRate: parseFloat(document.getElementById('respiratory-rate')?.value) || 0,
            oxygenSaturation: parseFloat(document.getElementById('oxygen-saturation')?.value) || 0,
            temperature: parseFloat(document.getElementById('temperature')?.value) || 0,
            meanArterialPressure: parseFloat(document.getElementById('mean-arterial-pressure')?.value) || 0,
            bloodGlucose: parseFloat(document.getElementById('blood-glucose')?.value) || 0
        };
    }

    /**
     * Coleta todas as medições (removidas)
     */
    collectMeasurements() {
        return {};
    }

    /**
     * Coleta valores de entrada
     */
    collectInputValues() {
        return {
            diet: parseFloat(document.getElementById('diet')?.value) || 0,
            serum: parseFloat(document.getElementById('serum')?.value) || 0,
            medication: parseFloat(document.getElementById('medication')?.value) || 0
        };
    }

    /**
     * Coleta valores de saída
     */
    collectOutputValues() {
        return {
            diuresis: parseFloat(document.getElementById('diuresis')?.value) || 0,
            gastricResidue: parseFloat(document.getElementById('gastricResidue')?.value) || 0,
            emesis: parseFloat(document.getElementById('emesis')?.value) || 0,
            evacuations: parseFloat(document.getElementById('evacuations')?.value) || 0
        };
    }

    /**
     * Valida os dados do formulário
     */
    validateForm(formData) {
        // Verificar peso do paciente
        if (!formData.patientInfo.weight || formData.patientInfo.weight <= 0) {
            return {
                isValid: false,
                message: 'Por favor, informe o peso do paciente para calcular o balanço hídrico.',
                focusElement: 'patient-weight'
            };
        }

        // Verificar se pelo menos uma entrada foi fornecida
        const hasInputs = formData.inputs.diet > 0 || formData.inputs.serum > 0 || formData.inputs.medication > 0;
        if (!hasInputs) {
            return {
                isValid: false,
                message: 'Por favor, preencha pelo menos um valor de entrada (Dieta, Soro ou Medicação).',
                focusElement: 'values-tab'
            };
        }

        return { isValid: true };
    }

    /**
     * Limpa todos os campos de cálculo
     */
    resetAllCalculationFields() {
        this.calculationFields.forEach(field => {
            field.reset();
        });
    }

    /**
     * Foca em um elemento específico
     */
    focusElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            if (elementId.includes('-tab')) {
                element.click(); // Para tabs
            } else {
                element.focus(); // Para inputs
            }
        }
    }
}

/**
 * Classe para gerenciar campos de cálculo individuais
 */
class CalculationField {
    
    constructor(config) {
        this.config = config;
        this.values = [];
        this.elements = this.initializeElements();
        this.setupEventListeners();
    }

    /**
     * Inicializa referências dos elementos DOM
     */
    initializeElements() {
        return {
            hiddenField: document.getElementById(this.config.fieldId),
            inputField: document.getElementById(this.config.inputId),
            listElement: document.getElementById(this.config.listId),
            totalElement: document.getElementById(this.config.totalId),
            addButton: document.getElementById(this.config.addBtnId),
            clearButton: document.getElementById(this.config.clearBtnId)
        };
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Botão adicionar
        this.elements.addButton?.addEventListener('click', () => this.addValue());
        
        // Botão limpar
        this.elements.clearButton?.addEventListener('click', () => this.reset());
        
        // Enter no campo de entrada
        this.elements.inputField?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.addValue();
            }
        });
    }

    /**
     * Adiciona um valor à lista
     */
    addValue() {
        const expression = this.elements.inputField?.value?.trim();
        if (!expression) return;

        try {
            const result = this.evaluateExpression(expression);
            
            if (isNaN(result)) {
                throw new Error('Resultado não é um número válido');
            }

            // Arredondar baseado no tipo de campo
            const roundedResult = this.isCountField() 
                ? Math.round(result) 
                : Math.round(result * 10) / 10;

            // Adicionar à lista
            this.values.push({
                expression: expression,
                value: roundedResult
            });

            // Atualizar interface
            this.updateUI();
            
            // Limpar campo e focar
            this.elements.inputField.value = '';
            this.elements.inputField.focus();

        } catch (error) {
            alert('Expressão inválida. Por favor, verifique e tente novamente.');
            console.error('Erro ao avaliar expressão:', error);
        }
    }

    /**
     * Avalia uma expressão matemática de forma segura
     * SECURITY: Implementação com zero-trust para prevenir code injection
     */
    evaluateExpression(expression) {
        // SECURITY FIX: Usar parser matemático seguro em vez de Function()
        if (!window.SecureMathParser) {
            throw new Error('SECURITY: Secure math parser not loaded');
        }
        
        try {
            const parser = new SecureMathParser();
            return parser.evaluate(expression);
        } catch (error) {
            // Log tentativas de ataque para monitoramento
            if (error.message.includes('SECURITY:')) {
                console.warn('Security violation attempt:', {
                    expression: expression,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Retornar erro user-friendly
            throw new Error('Expressão matemática inválida. Use apenas números e operadores (+, -, *, /).');
        }
    }

    /**
     * Verifica se é um campo de contagem
     */
    isCountField() {
        return this.config.unit === 'vezes';
    }

    /**
     * Verifica se é um campo de sinais vitais que precisa de média
     */
    isVitalSignField() {
        return this.config.unit === 'bpm' || 
               this.config.unit === 'irpm' || 
               this.config.unit === '%' || 
               this.config.unit === '°C' || 
               this.config.unit === 'mmHg' || 
               this.config.unit === 'mg/dL';
    }

    /**
     * Atualiza a interface do campo
     */
    updateUI() {
        // Limpar lista
        this.elements.listElement.innerHTML = '';
        
        // Calcular total
        let total = 0;
        
        // Adicionar cada valor à lista
        this.values.forEach((item, index) => {
            const li = this.createListItem(item, index);
            this.elements.listElement.appendChild(li);
            total += item.value;
        });

        // Atualizar total ou média
        let displayValue;
        let displayText;
        
        if (this.isVitalSignField() && this.values.length > 0) {
            // Para sinais vitais, calcular e exibir média
            const average = total / this.values.length;
            displayValue = average;
            displayText = `Média: ${Math.round(average)} ${this.config.unit}`;
        } else {
            // Para outros campos, exibir total
            displayValue = total;
            const formattedTotal = this.isCountField() 
                ? Math.round(total).toString()
                : total.toFixed(1);
            displayText = `Total: ${formattedTotal} ${this.config.unit}`;
        }
        
        this.elements.totalElement.textContent = displayText;
        
        // Atualizar campo oculto (usar média para sinais vitais, total para outros)
        this.elements.hiddenField.value = this.isVitalSignField() && this.values.length > 0 
            ? Math.round(total / this.values.length) 
            : total;
    }

    /**
     * Cria um item da lista
     */
    createListItem(item, index) {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        const expressionSpan = document.createElement('span');
        expressionSpan.textContent = item.expression;
        
        const valueSpan = document.createElement('span');
        valueSpan.textContent = `= ${item.value} ${this.config.unit}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', () => {
            this.values.splice(index, 1);
            this.updateUI();
        });
        
        li.appendChild(expressionSpan);
        li.appendChild(valueSpan);
        li.appendChild(deleteBtn);
        
        return li;
    }

    /**
     * Reseta o campo
     */
    reset() {
        this.values = [];
        this.updateUI();
        this.elements.inputField?.focus();
    }
}

// Exportar para uso global
window.FormHandler = FormHandler;