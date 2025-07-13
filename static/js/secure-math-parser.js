/**
 * Secure Mathematical Expression Parser
 * Defense against code injection attacks - Zero Trust implementation
 * 
 * Security Controls:
 * - Whitelist-only character validation
 * - Manual parsing without eval() or Function()
 * - Input length limits
 * - Operator precedence enforcement
 * - Arithmetic overflow protection
 */

class SecureMathParser {
    
    constructor() {
        // Security constraints
        this.MAX_EXPRESSION_LENGTH = 100;
        this.MAX_NUMBER_VALUE = 999999;
        this.MIN_NUMBER_VALUE = -999999;
        
        // Allowed characters (strict whitelist)
        this.ALLOWED_CHARS = /^[0-9+\-*/.() ]+$/;
        
        // Operator precedence
        this.PRECEDENCE = {
            '+': 1,
            '-': 1,
            '*': 2,
            '/': 2
        };
    }

    /**
     * Safely evaluate mathematical expression
     * @param {string} expression - Mathematical expression to evaluate
     * @returns {number} - Calculated result
     * @throws {Error} - On security violation or invalid input
     */
    evaluate(expression) {
        // Security validation phase
        this.validateSecurity(expression);
        
        // Normalize input
        const normalized = this.normalizeExpression(expression);
        
        // Tokenize expression
        const tokens = this.tokenize(normalized);
        
        // Parse and evaluate with operator precedence
        const result = this.parseExpression(tokens);
        
        // Validate result bounds
        this.validateResult(result);
        
        return result;
    }

    /**
     * Phase 1: Security validation (Defense Layer 1)
     */
    validateSecurity(expression) {
        // Null/undefined check
        if (!expression || typeof expression !== 'string') {
            throw new Error('SECURITY: Invalid expression type');
        }

        // Length limit (prevent DoS)
        if (expression.length > this.MAX_EXPRESSION_LENGTH) {
            throw new Error('SECURITY: Expression too long');
        }

        // Character whitelist (prevent injection)
        if (!this.ALLOWED_CHARS.test(expression)) {
            throw new Error('SECURITY: Unauthorized characters detected');
        }

        // Function/method detection (prevent code injection)
        const dangerousPatterns = [
            /function/i, /eval/i, /constructor/i, /prototype/i,
            /document/i, /window/i, /alert/i, /console/i,
            /fetch/i, /xhr/i, /script/i, /iframe/i
        ];
        
        for (const pattern of dangerousPatterns) {
            if (pattern.test(expression)) {
                throw new Error('SECURITY: Potential code injection detected');
            }
        }

        // Balanced parentheses check
        let parenthesesCount = 0;
        for (const char of expression) {
            if (char === '(') parenthesesCount++;
            if (char === ')') parenthesesCount--;
            if (parenthesesCount < 0) {
                throw new Error('SECURITY: Unbalanced parentheses');
            }
        }
        if (parenthesesCount !== 0) {
            throw new Error('SECURITY: Unbalanced parentheses');
        }
    }

    /**
     * Phase 2: Expression normalization
     */
    normalizeExpression(expression) {
        return expression
            .replace(/,/g, '.') // Replace commas with dots
            .replace(/\s+/g, '') // Remove all whitespace
            .trim();
    }

    /**
     * Phase 3: Tokenization (Defense Layer 2)
     */
    tokenize(expression) {
        const tokens = [];
        let currentNumber = '';
        
        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];
            
            if (this.isDigit(char) || char === '.') {
                currentNumber += char;
            } else if (this.isOperator(char) || char === '(' || char === ')') {
                // Push accumulated number
                if (currentNumber) {
                    const num = parseFloat(currentNumber);
                    if (isNaN(num)) {
                        throw new Error('SECURITY: Invalid number format');
                    }
                    if (num > this.MAX_NUMBER_VALUE || num < this.MIN_NUMBER_VALUE) {
                        throw new Error('SECURITY: Number out of allowed range');
                    }
                    tokens.push({ type: 'number', value: num });
                    currentNumber = '';
                }
                
                // Push operator/parenthesis
                if (this.isOperator(char)) {
                    tokens.push({ type: 'operator', value: char });
                } else {
                    tokens.push({ type: 'parenthesis', value: char });
                }
            } else {
                throw new Error(`SECURITY: Unauthorized character '${char}'`);
            }
        }
        
        // Push final number
        if (currentNumber) {
            const num = parseFloat(currentNumber);
            if (isNaN(num)) {
                throw new Error('SECURITY: Invalid number format');
            }
            tokens.push({ type: 'number', value: num });
        }
        
        return tokens;
    }

    /**
     * Phase 4: Secure parsing with operator precedence
     */
    parseExpression(tokens) {
        const output = [];
        const operators = [];
        
        // Shunting Yard algorithm (secure implementation)
        for (const token of tokens) {
            if (token.type === 'number') {
                output.push(token.value);
            } else if (token.type === 'operator') {
                while (
                    operators.length > 0 &&
                    operators[operators.length - 1] !== '(' &&
                    this.PRECEDENCE[operators[operators.length - 1]] >= this.PRECEDENCE[token.value]
                ) {
                    const op = operators.pop();
                    const b = output.pop();
                    const a = output.pop();
                    
                    if (a === undefined || b === undefined) {
                        throw new Error('SECURITY: Invalid expression structure');
                    }
                    
                    output.push(this.performOperation(a, b, op));
                }
                operators.push(token.value);
            } else if (token.value === '(') {
                operators.push(token.value);
            } else if (token.value === ')') {
                while (operators.length > 0 && operators[operators.length - 1] !== '(') {
                    const op = operators.pop();
                    const b = output.pop();
                    const a = output.pop();
                    
                    if (a === undefined || b === undefined) {
                        throw new Error('SECURITY: Invalid expression structure');
                    }
                    
                    output.push(this.performOperation(a, b, op));
                }
                
                if (operators.length === 0) {
                    throw new Error('SECURITY: Mismatched parentheses');
                }
                
                operators.pop(); // Remove '('
            }
        }
        
        // Process remaining operators
        while (operators.length > 0) {
            const op = operators.pop();
            if (op === '(' || op === ')') {
                throw new Error('SECURITY: Mismatched parentheses');
            }
            
            const b = output.pop();
            const a = output.pop();
            
            if (a === undefined || b === undefined) {
                throw new Error('SECURITY: Invalid expression structure');
            }
            
            output.push(this.performOperation(a, b, op));
        }
        
        if (output.length !== 1) {
            throw new Error('SECURITY: Invalid expression result');
        }
        
        return output[0];
    }

    /**
     * Secure arithmetic operations with overflow protection
     */
    performOperation(a, b, operator) {
        let result;
        
        switch (operator) {
            case '+':
                result = a + b;
                break;
            case '-':
                result = a - b;
                break;
            case '*':
                result = a * b;
                break;
            case '/':
                if (b === 0) {
                    throw new Error('SECURITY: Division by zero');
                }
                result = a / b;
                break;
            default:
                throw new Error(`SECURITY: Unknown operator '${operator}'`);
        }
        
        // Overflow protection
        if (!isFinite(result)) {
            throw new Error('SECURITY: Arithmetic overflow detected');
        }
        
        if (result > this.MAX_NUMBER_VALUE || result < this.MIN_NUMBER_VALUE) {
            throw new Error('SECURITY: Result out of allowed range');
        }
        
        return result;
    }

    /**
     * Phase 5: Result validation (Defense Layer 3)
     */
    validateResult(result) {
        if (typeof result !== 'number' || isNaN(result)) {
            throw new Error('SECURITY: Invalid calculation result');
        }
        
        if (!isFinite(result)) {
            throw new Error('SECURITY: Non-finite result detected');
        }
    }

    /**
     * Utility methods
     */
    isDigit(char) {
        return char >= '0' && char <= '9';
    }

    isOperator(char) {
        return ['+', '-', '*', '/'].includes(char);
    }
}

// Export secure parser globally
window.SecureMathParser = SecureMathParser;