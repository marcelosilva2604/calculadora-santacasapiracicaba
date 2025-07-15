/**
 * Calculadora de Balanço Hídrico - Módulo de Cálculos
 * Responsável por toda a lógica de cálculo do balanço hídrico
 */

class HydricBalanceCalculator {
    
    /**
     * Calcula o balanço hídrico com base nos dados fornecidos
     * @param {Object} data - Dados do paciente e medições
     * @returns {Object} Resultado dos cálculos
     */
    static calculate(data) {
        try {
            // Validar dados de entrada
            const validation = this.validateInput(data);
            if (!validation.isValid) {
                return { error: validation.message };
            }

            // Extrair dados
            const { inputs, outputs, patientInfo, measurements, timeframe } = data;
            const patientWeight = parseFloat(patientInfo.weight);

            // Calcular entradas
            const inputCalculations = this.calculateInputs(inputs, patientWeight);
            
            // Calcular saídas
            const outputCalculations = this.calculateOutputs(outputs, patientWeight, timeframe);
            
            // Calcular balanço final
            const balanceCalculations = this.calculateBalance(
                inputCalculations.totalInput, 
                outputCalculations.totalOutput, 
                patientWeight
            );

            // Formatar nome do paciente
            const formattedPatientName = this.formatPatientName(patientInfo.name || '');

            // Arredondar todos os valores
            const result = this.roundResults({
                ...inputCalculations,
                ...outputCalculations,
                ...balanceCalculations,
                patient: {
                    name: formattedPatientName,
                    bed: patientInfo.bed || '',
                    weight: patientWeight,
                    timeframe: parseInt(timeframe || 24)
                },
                measurements: measurements
            });

            return result;

        } catch (error) {
            console.error('Erro no cálculo:', error);
            return { error: 'Erro interno no cálculo. Tente novamente.' };
        }
    }

    /**
     * Valida os dados de entrada
     */
    static validateInput(data) {
        const patientWeight = parseFloat(data.patientInfo?.weight || 0);
        
        if (patientWeight <= 0) {
            return {
                isValid: false,
                message: "O peso do paciente deve ser maior que zero para calcular o balanço hídrico."
            };
        }

        return { isValid: true };
    }

    /**
     * Calcula todas as entradas (dieta, soro, medicação)
     */
    static calculateInputs(inputs, patientWeight) {
        // Usar dados do HydricAccumulator se disponível
        let diet, serum, medication;
        
        if (window.hydricAccumulator) {
            diet = window.hydricAccumulator.getFieldTotal('diet');
            serum = window.hydricAccumulator.getFieldTotal('serum');
            medication = window.hydricAccumulator.getFieldTotal('medication');
        } else {
            // Fallback para sistema antigo
            diet = parseFloat(inputs.diet || 0);
            serum = parseFloat(inputs.serum || 0);
            medication = parseFloat(inputs.medication || 0);
        }

        const totalInput = diet + serum + medication;
        const liquidIntake = totalInput / patientWeight;

        return {
            diet,
            diet_per_kg: diet / patientWeight,
            serum,
            serum_per_kg: serum / patientWeight,
            medication,
            medication_per_kg: medication / patientWeight,
            total_input: totalInput,
            liquid_intake: liquidIntake
        };
    }

    /**
     * Calcula todas as saídas (diurese, resíduo gástrico, etc.)
     */
    static calculateOutputs(outputs, patientWeight, timeframe) {
        // Usar dados do HydricAccumulator se disponível
        let diuresis, gastricResidue, emesis, evacuations;
        
        if (window.hydricAccumulator) {
            diuresis = window.hydricAccumulator.getFieldTotal('diuresis');
            gastricResidue = window.hydricAccumulator.getFieldTotal('gastric-residue');
            emesis = window.hydricAccumulator.getFieldTotal('emesis');
            evacuations = window.hydricAccumulator.getFieldTotal('evacuations');
        } else {
            // Fallback para sistema antigo
            diuresis = parseFloat(outputs.diuresis || 0);
            gastricResidue = parseFloat(outputs.gastricResidue || 0);
            emesis = parseFloat(outputs.emesis || 0);
            evacuations = parseFloat(outputs.evacuations || 0);
        }

        const totalOutput = diuresis + gastricResidue;
        const outputPerKg = totalOutput / patientWeight;
        
        // Diurese em ml/kg/h
        const diuresisPerKgHour = (patientWeight > 0 && timeframe > 0) 
            ? diuresis / timeframe / patientWeight 
            : 0;

        return {
            diuresis,
            diuresis_per_kg_hour: diuresisPerKgHour,
            gastric_residue: gastricResidue,
            gastric_residue_per_kg: gastricResidue / patientWeight,
            emesis_count: emesis,
            evacuations_count: evacuations,
            total_output: totalOutput,
            output_per_kg: outputPerKg
        };
    }

    /**
     * Calcula o balanço hídrico final
     */
    static calculateBalance(totalInput, totalOutput, patientWeight) {
        const balance = totalInput - totalOutput;
        const balancePerKg = balance / patientWeight;

        // Determinar status do balanço
        let status;
        if (balance > 0) {
            status = "positivo";
        } else if (balance < 0) {
            status = "negativo";
        } else {
            status = "neutro";
        }

        return {
            balance,
            balance_per_kg: balancePerKg,
            status
        };
    }

    /**
     * Formata o nome do paciente seguindo as regras médicas
     */
    static formatPatientName(name) {
        if (!name) return '';

        // Converter para title case
        let formattedName = name.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');

        // Substituir variações de "rn" por "RN"
        formattedName = formattedName.replace(/\brn\b/gi, 'RN');

        // Ajustar preposições para minúsculas após RN
        formattedName = formattedName.replace(
            /RN (De|Do|Da|Dos|Das)\b/g, 
            (match, prep) => `RN ${prep.toLowerCase()}`
        );

        return formattedName;
    }

    /**
     * Arredonda todos os valores numéricos para 2 casas decimais
     */
    static roundResults(results) {
        const roundedResults = { ...results };

        // Campos numéricos para arredondar
        const numericFields = [
            'diet', 'diet_per_kg', 'serum', 'serum_per_kg', 'medication', 'medication_per_kg',
            'total_input', 'liquid_intake', 'diuresis', 'diuresis_per_kg_hour', 
            'gastric_residue', 'gastric_residue_per_kg', 'total_output', 'output_per_kg',
            'balance', 'balance_per_kg'
        ];

        numericFields.forEach(field => {
            if (typeof roundedResults[field] === 'number') {
                roundedResults[field] = Math.round(roundedResults[field] * 100) / 100;
            }
        });

        // Arredondar contadores para inteiros
        roundedResults.emesis_count = Math.round(roundedResults.emesis_count || 0);
        roundedResults.evacuations_count = Math.round(roundedResults.evacuations_count || 0);

        return roundedResults;
    }
}

// Exportar para uso global
window.HydricBalanceCalculator = HydricBalanceCalculator;