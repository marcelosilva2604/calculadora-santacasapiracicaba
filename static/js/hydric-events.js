/**
 * Event Listeners para Campos de Balanço Hídrico
 * Gerencia eventos de entrada, validação e acumulação
 */

class HydricEventManager {
    constructor() {
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
            this.clearFieldFeedback(fieldName, input);
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
     * Adiciona instructional text aos campos
     */
    addInstructionalText() {
        const fields = [
            'diet', 'serum', 'medication',
            'diuresis', 'gastric-residue', 'emesis', 'evacuations'
        ];

        fields.forEach(field => {
            const container = document.getElementById(`${field}-input`)?.closest('.hydric-field');
            if (container) {
                const instruction = document.createElement('div');
                instruction.className = 'hydric-instruction';
                instruction.innerHTML = `
                    <small class="text-muted">
                        <i class="bi bi-info-circle"></i>
                        Digite um valor ou expressão (ex: 150, 1.5*24, 50+30) e pressione Enter
                    </small>
                `;
                container.appendChild(instruction);
            }
        });
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.hydricEventManager = new HydricEventManager();
    
    // Adicionar texto instrucional após um pequeno delay
    setTimeout(() => {
        window.hydricEventManager.addInstructionalText();
    }, 1000);
});