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
        if (window.debugLogger) {
            window.debugLogger.log('HYDRIC_REMOVAL', `Iniciando remoção - Campo: ${fieldName}, Índice: ${index}`);
        }
        
        if (!this.fields.has(fieldName)) {
            if (window.debugLogger) {
                window.debugLogger.log('ERROR', `Campo ${fieldName} não encontrado`);
            }
            return false;
        }

        const field = this.fields.get(fieldName);
        if (window.debugLogger) {
            window.debugLogger.log('HYDRIC_REMOVAL', `Campo antes da remoção`, {
                expressions: field.expressions,
                values: field.values,
                total: field.total
            });
        }
        
        if (index >= 0 && index < field.values.length) {
            const removedValue = field.values[index];
            const removedExpression = field.expressions[index];
            
            if (window.debugLogger) {
                window.debugLogger.log('HYDRIC_REMOVAL', `Removendo valor ${removedValue} (${removedExpression})`);
            }
            
            // Remover dos arrays
            field.values.splice(index, 1);
            field.expressions.splice(index, 1);
            
            // Recalcular total para evitar problemas de precisão
            field.total = field.values.reduce((sum, value) => sum + value, 0);
            field.total = Math.round(field.total * 100) / 100;
            
            if (window.debugLogger) {
                window.debugLogger.log('HYDRIC_REMOVAL', `Campo após remoção`, {
                    expressions: field.expressions,
                    values: field.values,
                    total: field.total
                });
            }
            
            // Atualizar interface
            this.updateFieldDisplay(fieldName);
            
            // Manter o foco no campo após remoção (com pequeno delay)
            setTimeout(() => {
                if (window.hydricEventManager) {
                    window.hydricEventManager.setFocusedField(fieldName);
                }
            }, 10);
            
            // Força a atualização da interface após remoção
            setTimeout(() => {
                this.updateFieldDisplay(fieldName);
            }, 50);
            
            // Feedback visual
            this.showRemovalFeedback(fieldName, removedExpression, removedValue);
            
            if (window.debugLogger) {
                window.debugLogger.log('HYDRIC_REMOVAL', `Remoção concluída com sucesso`);
            }
            
            return true;
        }
        
        if (window.debugLogger) {
            window.debugLogger.log('ERROR', `Índice ${index} inválido para o campo ${fieldName}. Máximo: ${field.values.length - 1}`);
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
        if (!field) {
            if (window.debugLogger) {
                window.debugLogger.log('ERROR', `Campo ${fieldName} não encontrado no updateFieldDisplay`);
            }
            return;
        }

        if (window.debugLogger) {
            window.debugLogger.log('HYDRIC_DISPLAY', `Atualizando display para ${fieldName}`, {
                total: field.total,
                values: field.values,
                expressions: field.expressions
            });
        }

        // Atualizar total
        const totalElement = document.getElementById(`${fieldName}-total`);
        if (totalElement) {
            totalElement.textContent = `Total: ${field.total.toLocaleString('pt-BR')} ${this.getFieldUnit(fieldName)}`;
            if (window.debugLogger) {
                window.debugLogger.log('HYDRIC_DISPLAY', `Total atualizado para ${fieldName}: ${field.total}`);
            }
        } else {
            if (window.debugLogger) {
                window.debugLogger.log('WARNING', `Elemento ${fieldName}-total não encontrado`);
            }
        }

        // Atualizar histórico
        const historyElement = document.getElementById(`${fieldName}-history`);
        if (historyElement) {
            this.updateHistoryDisplay(fieldName, historyElement);
        } else {
            if (window.debugLogger) {
                window.debugLogger.log('WARNING', `Elemento ${fieldName}-history não encontrado`);
            }
        }

        // Atualizar campo oculto para compatibilidade
        const hiddenField = document.getElementById(fieldName);
        if (hiddenField) {
            hiddenField.value = field.total;
            if (window.debugLogger) {
                window.debugLogger.log('HYDRIC_DISPLAY', `Campo oculto ${fieldName} atualizado para ${field.total}`);
            }
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

        // Limpar conteúdo anterior
        historyElement.innerHTML = '';
        
        // Criar elementos dinamicamente para evitar problemas com template strings
        field.expressions.forEach((expr, index) => {
            const value = field.values[index];
            
            // Criar container do item
            const itemDiv = document.createElement('div');
            itemDiv.className = 'history-item';
            
            // Criar span para expressão
            const exprSpan = document.createElement('span');
            exprSpan.className = 'history-expression';
            exprSpan.textContent = expr;
            
            // Criar span para valor
            const valueSpan = document.createElement('span');
            valueSpan.className = 'history-value';
            valueSpan.textContent = value.toLocaleString('pt-BR');
            
            // Criar botão de remoção
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'history-remove';
            removeBtn.title = 'Remover';
            removeBtn.innerHTML = '<i class="bi bi-x"></i>';
            
            // Adicionar event listener ao botão
            removeBtn.addEventListener('mousedown', (e) => e.preventDefault());
            removeBtn.addEventListener('click', (e) => {
                if (window.debugLogger) {
                    window.debugLogger.log('HYDRIC_BUTTON', `Botão clicado para remover índice ${index} do campo ${fieldName}`);
                }
                e.stopPropagation();
                if (window.hydricAccumulator) {
                    window.hydricAccumulator.removeValue(fieldName, index);
                }
                return false;
            });
            
            // Montar o item
            itemDiv.appendChild(exprSpan);
            itemDiv.appendChild(valueSpan);
            itemDiv.appendChild(removeBtn);
            
            // Adicionar ao histórico
            historyElement.appendChild(itemDiv);
        });

        // Deixar que o HydricEventManager controle a visibilidade
        if (window.hydricEventManager) {
            window.hydricEventManager.updateDetailedViewsVisibility();
        } else {
            // Fallback se o event manager não existir ainda
            historyElement.style.display = 'block';
        }
    }

    /**
     * Mostra feedback visual quando um item é removido
     */
    showRemovalFeedback(fieldName, expression, value) {
        const container = document.getElementById(`${fieldName}-input`)?.closest('.hydric-field');
        if (!container) return;
        
        // Remover feedback anterior
        const existingFeedback = container.querySelector('.removal-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // Criar novo feedback
        const feedback = document.createElement('div');
        feedback.className = 'removal-feedback';
        feedback.style.cssText = `
            background: #fee2e2;
            border: 1px solid #fca5a5;
            color: #991b1b;
            padding: 4px 8px;
            margin-top: 2px;
            border-radius: 4px;
            font-size: 11px;
            animation: fadeIn 0.3s ease;
        `;
        feedback.innerHTML = `
            <i class="bi bi-check-circle"></i>
            Removido: ${expression} (${value.toLocaleString('pt-BR')} ${this.getFieldUnit(fieldName)})
        `;
        
        container.appendChild(feedback);
        
        // Remover após 3 segundos
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 3000);
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