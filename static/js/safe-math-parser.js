/**
 * Parser Matemático Seguro - Sem eval()
 * Avalia expressões matemáticas simples de forma segura
 * Compatível com Content Security Policy
 */

class SafeMathParser {
    constructor() {
        this.operators = {
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '*': (a, b) => a * b,
            '/': (a, b) => a / b
        };
        
        this.precedence = {
            '+': 1,
            '-': 1,
            '*': 2,
            '/': 2
        };
    }

    /**
     * Avalia uma expressão matemática
     * @param {string} expression - Expressão matemática (ex: "30*4", "150+50")
     * @returns {number} - Resultado da expressão
     */
    evaluate(expression) {
        try {
            // Limpar e validar
            const cleanExpression = this.cleanExpression(expression);
            this.validateExpression(cleanExpression);
            
            // Converter para tokens
            const tokens = this.tokenize(cleanExpression);
            
            // Converter para notação pós-fixa (RPN)
            const rpn = this.toRPN(tokens);
            
            // Avaliar a expressão RPN
            const result = this.evaluateRPN(rpn);
            
            // Validar resultado
            if (typeof result !== 'number' || !isFinite(result)) {
                throw new Error('Resultado inválido');
            }
            
            if (result < 0) {
                throw new Error('Valores negativos não são permitidos');
            }
            
            return Math.round(result * 100) / 100; // 2 casas decimais
            
        } catch (error) {
            throw new Error(`Erro na expressão: ${error.message}`);
        }
    }

    /**
     * Limpa e normaliza a expressão
     */
    cleanExpression(expression) {
        return expression
            .replace(/\s+/g, '') // Remove espaços
            .replace(/,/g, '.') // Converte vírgulas para pontos
            .toLowerCase();
    }

    /**
     * Valida a expressão
     */
    validateExpression(expression) {
        // Apenas números, operadores e parênteses
        const allowedChars = /^[0-9+\-*/.()]+$/;
        if (!allowedChars.test(expression)) {
            throw new Error('Expressão contém caracteres inválidos');
        }

        // Verificar parênteses balanceados
        let parenthesesCount = 0;
        for (let char of expression) {
            if (char === '(') parenthesesCount++;
            if (char === ')') parenthesesCount--;
            if (parenthesesCount < 0) {
                throw new Error('Parênteses desbalanceados');
            }
        }
        
        if (parenthesesCount !== 0) {
            throw new Error('Parênteses desbalanceados');
        }

        // Verificar operadores consecutivos
        if (/[+\-*/]{2,}/.test(expression)) {
            throw new Error('Operadores consecutivos não são permitidos');
        }

        // Verificar divisão por zero
        if (/\/0(?!\d)/.test(expression)) {
            throw new Error('Divisão por zero não é permitida');
        }
    }

    /**
     * Converte a expressão em tokens
     */
    tokenize(expression) {
        const tokens = [];
        let currentNumber = '';
        
        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];
            
            if (/\d/.test(char) || char === '.') {
                // Número
                currentNumber += char;
            } else if (this.operators[char] || char === '(' || char === ')') {
                // Operador ou parêntese
                if (currentNumber) {
                    tokens.push(parseFloat(currentNumber));
                    currentNumber = '';
                }
                tokens.push(char);
            } else {
                throw new Error(`Caractere inválido: ${char}`);
            }
        }
        
        // Adicionar último número
        if (currentNumber) {
            tokens.push(parseFloat(currentNumber));
        }
        
        return tokens;
    }

    /**
     * Converte tokens para notação pós-fixa (RPN)
     * Algoritmo Shunting Yard
     */
    toRPN(tokens) {
        const output = [];
        const operatorStack = [];
        
        for (let token of tokens) {
            if (typeof token === 'number') {
                // Número
                output.push(token);
            } else if (this.operators[token]) {
                // Operador
                while (
                    operatorStack.length > 0 &&
                    operatorStack[operatorStack.length - 1] !== '(' &&
                    this.precedence[operatorStack[operatorStack.length - 1]] >= this.precedence[token]
                ) {
                    output.push(operatorStack.pop());
                }
                operatorStack.push(token);
            } else if (token === '(') {
                // Parêntese de abertura
                operatorStack.push(token);
            } else if (token === ')') {
                // Parêntese de fechamento
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                    output.push(operatorStack.pop());
                }
                
                if (operatorStack.length === 0) {
                    throw new Error('Parênteses desbalanceados');
                }
                
                operatorStack.pop(); // Remove o '('
            }
        }
        
        // Adicionar operadores restantes
        while (operatorStack.length > 0) {
            const operator = operatorStack.pop();
            if (operator === '(' || operator === ')') {
                throw new Error('Parênteses desbalanceados');
            }
            output.push(operator);
        }
        
        return output;
    }

    /**
     * Avalia expressão em notação pós-fixa (RPN)
     */
    evaluateRPN(rpn) {
        const stack = [];
        
        for (let token of rpn) {
            if (typeof token === 'number') {
                stack.push(token);
            } else if (this.operators[token]) {
                if (stack.length < 2) {
                    throw new Error('Expressão inválida');
                }
                
                const b = stack.pop();
                const a = stack.pop();
                
                if (token === '/' && b === 0) {
                    throw new Error('Divisão por zero');
                }
                
                const result = this.operators[token](a, b);
                stack.push(result);
            }
        }
        
        if (stack.length !== 1) {
            throw new Error('Expressão inválida');
        }
        
        return stack[0];
    }

    /**
     * Testa se uma expressão é válida
     */
    isValidExpression(expression) {
        try {
            this.evaluate(expression);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Instância global
window.safeMathParser = new SafeMathParser();