/**
 * Event Listeners para Campos de Balanço Hídrico
 * Gerencia eventos de entrada, validação e acumulação
 */

class HydricEventManager {
    constructor() {
        this.currentFocusedField = null;
        this.setupEventListeners();
    }

    /**
     * Configura todos os event listeners
     */
    setupEventListeners() {
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeFieldListeners();
            });
        } else {
            this.initializeFieldListeners();
        }
    }

    /**
     * Inicializa listeners para todos os campos
     */
    initializeFieldListeners() {
        const fields = [
            'diet', 'serum', 'medication',
            'diuresis', 'gastric-residue', 'emesis', 'evacuations'
        ];

        fields.forEach(field => {
            const input = document.getElementById(`${field}-input`);
            if (input) {
                this.setupFieldListeners(field, input);
            }
        });

        // Adicionar listener para cliques fora dos campos
        this.setupGlobalClickListener();
    }

    /**
     * Configura listener global para cliques fora dos campos
     */
    setupGlobalClickListener() {
        document.addEventListener('click', (e) => {
            // Verificar se o clique foi dentro de um campo de balanço hídrico
            const hydricField = e.target.closest('.hydric-field');
            const hydricInput = e.target.closest('.hydric-input');
            const hydricTotal = e.target.closest('.hydric-total');
            const historyRemove = e.target.closest('.history-remove');
            const historyItem = e.target.closest('.history-item');
            
            // Se clicou no botão de remoção, manter o foco no campo
            if (historyRemove || historyItem) {
                console.log('🔘 Clique no botão de remoção - mantendo foco');
                // Identificar qual campo está sendo usado
                const fieldContainer = e.target.closest('.hydric-field');
                if (fieldContainer) {
                    const fieldName = fieldContainer.getAttribute('data-field');
                    if (fieldName) {
                        this.setFocusedField(fieldName);
                    }
                }
                return; // Não remover o foco
            }
            
            // Se não clicou em nenhum elemento relacionado ao balanço hídrico, remover foco
            if (!hydricField && !hydricInput && !hydricTotal) {
                this.setFocusedField(null);
            }
        });
    }

    /**
     * Configura listeners para um campo específico
     */
    setupFieldListeners(fieldName, input) {
        // Enter para adicionar valor
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleEnterKey(fieldName, input);
            }
        });

        // Validação em tempo real
        input.addEventListener('input', (e) => {
            this.handleInput(fieldName, input, e.target.value);
        });

        // Limpar feedback ao focar
        input.addEventListener('focus', () => {
            this.handleFocus(fieldName, input);
        });

        // Validação ao sair do campo
        input.addEventListener('blur', () => {
            this.handleBlur(fieldName, input);
        });
    }

    /**
     * Manipula evento de Enter
     */
    handleEnterKey(fieldName, input) {
        const value = input.value.trim();
        if (!value) return;

        const result = window.hydricAccumulator.addValue(fieldName, value);
        
        if (result.success) {
            // Sucesso - limpar campo e mostrar feedback
            input.value = '';
            this.showSuccessFeedback(fieldName, input, result);
            this.clearFieldFeedback(fieldName, input);
        } else {
            // Erro - mostrar mensagem
            this.showErrorFeedback(fieldName, input, result.error);
        }
    }

    /**
     * Manipula entrada de texto
     */
    handleInput(fieldName, input, value) {
        // Validação básica em tempo real
        if (value.trim()) {
            try {
                // Testar se a expressão é válida
                window.hydricAccumulator.evaluateExpression(value);
                this.clearFieldFeedback(fieldName, input);
            } catch (error) {
                // Não mostrar erro constantemente, apenas visual sutil
                this.showInputWarning(fieldName, input);
            }
        } else {
            this.clearFieldFeedback(fieldName, input);
        }
    }

    /**
     * Manipula evento de focus
     */
    handleFocus(fieldName, input) {
        this.clearFieldFeedback(fieldName, input);
        this.setFocusedField(fieldName);
    }

    /**
     * Manipula evento de blur
     */
    handleBlur(fieldName, input) {
        const value = input.value.trim();
        if (value) {
            // Apenas mostrar preview do que seria calculado
            try {
                const result = window.hydricAccumulator.evaluateExpression(value);
                this.showPreviewFeedback(fieldName, input, result);
            } catch (error) {
                this.showErrorFeedback(fieldName, input, error.message);
            }
        }
        
    }

    /**
     * Mostra feedback de sucesso
     */
    showSuccessFeedback(fieldName, input, result) {
        const container = input.closest('.hydric-field');
        const feedback = container.querySelector('.hydric-feedback');
        
        if (feedback) {
            feedback.remove();
        }

        const successElement = document.createElement('div');
        successElement.className = 'hydric-feedback success';
        successElement.innerHTML = `
            <i class="bi bi-check-circle"></i>
            Adicionado: ${result.value.toLocaleString('pt-BR')} ${window.hydricAccumulator.getFieldUnit(fieldName)}
        `;
        
        container.appendChild(successElement);
        
        // Remover após 3 segundos
        setTimeout(() => {
            successElement.remove();
        }, 3000);
    }

    /**
     * Mostra feedback de erro
     */
    showErrorFeedback(fieldName, input, message) {
        const container = input.closest('.hydric-field');
        const feedback = container.querySelector('.hydric-feedback');
        
        if (feedback) {
            feedback.remove();
        }

        const errorElement = document.createElement('div');
        errorElement.className = 'hydric-feedback error';
        errorElement.innerHTML = `
            <i class="bi bi-exclamation-circle"></i>
            ${message}
        `;
        
        container.appendChild(errorElement);
        
        // Destacar campo com erro
        input.classList.add('hydric-error');
        
        // Remover após 5 segundos
        setTimeout(() => {
            errorElement.remove();
            input.classList.remove('hydric-error');
        }, 5000);
    }

    /**
     * Mostra preview do valor
     */
    showPreviewFeedback(fieldName, input, value) {
        const container = input.closest('.hydric-field');
        const feedback = container.querySelector('.hydric-feedback');
        
        if (feedback) {
            feedback.remove();
        }

        const previewElement = document.createElement('div');
        previewElement.className = 'hydric-feedback preview';
        previewElement.innerHTML = `
            <i class="bi bi-eye"></i>
            Pressione Enter para adicionar: ${value.toLocaleString('pt-BR')} ${window.hydricAccumulator.getFieldUnit(fieldName)}
        `;
        
        container.appendChild(previewElement);
    }

    /**
     * Mostra aviso de entrada
     */
    showInputWarning(fieldName, input) {
        input.classList.add('hydric-warning');
        
        // Remover após 2 segundos
        setTimeout(() => {
            input.classList.remove('hydric-warning');
        }, 2000);
    }

    /**
     * Limpa feedback do campo
     */
    clearFieldFeedback(fieldName, input) {
        const container = input.closest('.hydric-field');
        const feedback = container.querySelector('.hydric-feedback');
        
        if (feedback) {
            feedback.remove();
        }
        
        input.classList.remove('hydric-error', 'hydric-warning');
    }

    /**
     * Define o campo em foco e controla visibilidade dos detalhes
     */
    setFocusedField(fieldName) {
        this.currentFocusedField = fieldName;
        this.updateDetailedViewsVisibility();
    }

    /**
     * Atualiza visibilidade dos valores detalhados baseado no foco
     */
    updateDetailedViewsVisibility() {
        const fields = [
            'diet', 'serum', 'medication',
            'diuresis', 'gastric-residue', 'emesis', 'evacuations'
        ];

        fields.forEach(field => {
            const historyElement = document.getElementById(`${field}-history`);
            if (historyElement) {
                const fieldData = window.hydricAccumulator?.getFieldData(field);
                
                if (fieldData && fieldData.expressions && fieldData.expressions.length > 0) {
                    // Se o campo tem valores e está em foco, mostrar detalhes
                    if (this.currentFocusedField === field) {
                        historyElement.style.display = 'block';
                        historyElement.classList.add('detailed-view');
                    } else {
                        // Se não está em foco, ocultar detalhes
                        historyElement.style.display = 'none';
                        historyElement.classList.remove('detailed-view');
                    }
                } else {
                    // Se não tem valores, sempre ocultar
                    historyElement.style.display = 'none';
                    historyElement.classList.remove('detailed-view');
                }
            }
        });
    }

    /**
     * Permite mostrar detalhes ao clicar no total
     */
    setupTotalClickListeners() {
        const fields = [
            'diet', 'serum', 'medication',
            'diuresis', 'gastric-residue', 'emesis', 'evacuations'
        ];

        fields.forEach(field => {
            const totalElement = document.getElementById(`${field}-total`);
            if (totalElement) {
                totalElement.style.cursor = 'pointer';
                totalElement.addEventListener('click', () => {
                    this.setFocusedField(field);
                    
                    // Opcionalmente, focar no input também
                    const input = document.getElementById(`${field}-input`);
                    if (input) {
                        input.focus();
                    }
                });
            }
        });
    }

}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.hydricEventManager = new HydricEventManager();
    
    // Configurar listeners após um pequeno delay
    setTimeout(() => {
        window.hydricEventManager.setupTotalClickListeners();
    }, 1000);
});