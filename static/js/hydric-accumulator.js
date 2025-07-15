/**
 * Hydric Accumulator - Sistema de Acumulação de Valores
 * Gerencia valores acumulados para campos de balanço hídrico
 */

class HydricAccumulator {
    constructor() {
        this.fields = new Map();
        this.initializeFields();
    }

    /**
     * Inicializa os campos de balanço hídrico
     */
    initializeFields() {
        const hydricFields = [
            // Entradas
            'diet', 'serum', 'medication',
            // Saídas  
            'diuresis', 'gastric-residue', 'emesis', 'evacuations'
        ];

        hydricFields.forEach(field => {
            this.fields.set(field, {
                values: [],
                expressions: [],
                total: 0
            });
        });
    }

    /**
     * Adiciona valor a um campo específico
     */
    addValue(fieldName, expression) {
        if (!this.fields.has(fieldName)) {
            throw new Error(`Campo ${fieldName} não encontrado`);
        }

        const field = this.fields.get(fieldName);
        
        try {
            // Avaliar expressão matemática
            const value = this.evaluateExpression(expression);
            
            // Adicionar aos arrays
            field.values.push(value);
            field.expressions.push(expression);
            field.total += value;
            
            // Atualizar interface
            this.updateFieldDisplay(fieldName);
            
            return {
                success: true,
                value: value,
                total: field.total,
                count: field.values.length
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Remove valor específico de um campo
     */
    removeValue(fieldName, index) {
        if (!this.fields.has(fieldName)) return false;

        const field = this.fields.get(fieldName);
        
        if (index >= 0 && index < field.values.length) {
            const removedValue = field.values[index];
            field.values.splice(index, 1);
            field.expressions.splice(index, 1);
            field.total -= removedValue;
            
            this.updateFieldDisplay(fieldName);
            return true;
        }
        
        return false;
    }

    /**
     * Limpa todos os valores de um campo
     */
    clearField(fieldName) {
        if (!this.fields.has(fieldName)) return false;

        const field = this.fields.get(fieldName);
        field.values = [];
        field.expressions = [];
        field.total = 0;
        
        this.updateFieldDisplay(fieldName);
        return true;
    }

    /**
     * Obtém dados de um campo
     */
    getFieldData(fieldName) {
        return this.fields.get(fieldName) || null;
    }

    /**
     * Obtém total de um campo
     */
    getFieldTotal(fieldName) {
        const field = this.fields.get(fieldName);
        return field ? field.total : 0;
    }

    /**
     * Avalia expressão matemática de forma segura (sem eval)
     */
    evaluateExpression(expression) {
        // Usar o parser seguro
        if (window.safeMathParser) {
            return window.safeMathParser.evaluate(expression);
        }
        
        // Fallback simples se o parser não estiver disponível
        const cleanExpression = expression.replace(/\s+/g, '').replace(',', '.');
        
        // Apenas números simples como fallback
        const numberMatch = cleanExpression.match(/^(\d+\.?\d*)$/);
        if (numberMatch) {
            const result = parseFloat(numberMatch[1]);
            if (result < 0) {
                throw new Error('Valores negativos não são permitidos');
            }
            return Math.round(result * 100) / 100;
        }
        
        throw new Error('Parser matemático não disponível. Use apenas números simples.');
    }

    /**
     * Atualiza display do campo na interface
     */
    updateFieldDisplay(fieldName) {
        const field = this.fields.get(fieldName);
        if (!field) return;

        // Atualizar total
        const totalElement = document.getElementById(`${fieldName}-total`);
        if (totalElement) {
            totalElement.textContent = `Total: ${field.total.toLocaleString('pt-BR')} ${this.getFieldUnit(fieldName)}`;
        }

        // Atualizar histórico
        const historyElement = document.getElementById(`${fieldName}-history`);
        if (historyElement) {
            this.updateHistoryDisplay(fieldName, historyElement);
        }

        // Atualizar campo oculto para compatibilidade
        const hiddenField = document.getElementById(fieldName);
        if (hiddenField) {
            hiddenField.value = field.total;
        }
    }

    /**
     * Atualiza display do histórico
     */
    updateHistoryDisplay(fieldName, historyElement) {
        const field = this.fields.get(fieldName);
        if (!field || field.expressions.length === 0) {
            historyElement.style.display = 'none';
            return;
        }

        historyElement.style.display = 'block';
        historyElement.innerHTML = field.expressions.map((expr, index) => {
            const value = field.values[index];
            return `
                <div class="history-item">
                    <span class="history-expression">${expr}</span>
                    <span class="history-value">${value.toLocaleString('pt-BR')}</span>
                    <button type="button" class="history-remove" onclick="window.hydricAccumulator.removeValue('${fieldName}', ${index})" title="Remover">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    /**
     * Obtém unidade do campo
     */
    getFieldUnit(fieldName) {
        const units = {
            'diet': 'ml',
            'serum': 'ml', 
            'medication': 'ml',
            'diuresis': 'ml',
            'gastric-residue': 'ml',
            'emesis': 'vezes',
            'evacuations': 'vezes'
        };
        return units[fieldName] || '';
    }

    /**
     * Exporta dados para o sistema de cálculo
     */
    exportData() {
        const data = {};
        this.fields.forEach((field, fieldName) => {
            data[fieldName] = field.total;
        });
        return data;
    }

    /**
     * Importa dados (para restaurar sessão)
     */
    importData(data) {
        Object.keys(data).forEach(fieldName => {
            if (this.fields.has(fieldName) && typeof data[fieldName] === 'number') {
                const field = this.fields.get(fieldName);
                field.total = data[fieldName];
                field.values = [data[fieldName]];
                field.expressions = [data[fieldName].toString()];
                this.updateFieldDisplay(fieldName);
            }
        });
    }

    /**
     * Reseta todos os campos
     */
    reset() {
        this.fields.forEach((field, fieldName) => {
            field.values = [];
            field.expressions = [];
            field.total = 0;
            this.updateFieldDisplay(fieldName);
        });
    }
}

// Instância global
window.hydricAccumulator = new HydricAccumulator();