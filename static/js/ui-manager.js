/**
 * UI Manager - Gerenciamento de Interface
 * Responsável por todas as operações de manipulação da interface
 */

class UIManager {
    
    constructor() {
        this.elements = this.initializeElements();
    }

    /**
     * Inicializa todas as referências dos elementos DOM
     */
    initializeElements() {
        return {
            // Botões principais
            calculateBtn: document.getElementById('calculateBtn'),
            copyResultBtn: document.getElementById('copyResultBtn'),
            newPatientBtn: document.getElementById('newPatientBtn'),
            
            // Áreas principais
            resultArea: document.getElementById('resultArea'),
            
            // Campos do paciente
            patientName: document.getElementById('patientName'),
            patientBed: document.getElementById('patientBed'),
            patientWeight: document.getElementById('patientWeight'),
            
            // Medições
            heartRate: document.getElementById('heartRate'),
            respiratoryRate: document.getElementById('respiratoryRate'),
            oxygenSaturation: document.getElementById('oxygenSaturation'),
            temperature: document.getElementById('temperature'),
            meanArterialPressure: document.getElementById('meanArterialPressure'),
            capillaryGlycemia: document.getElementById('capillaryGlycemia'),
            
            // Campos de resultado
            result: {
                patientName: document.getElementById('patientNameResult'),
                patientBed: document.getElementById('patientBedResult'),
                patientWeight: document.getElementById('patientWeightResult'),
                timeframe: document.getElementById('timeframeResult'),
                
                // Medições resultado
                heartRate: document.getElementById('heartRateResult'),
                respiratoryRate: document.getElementById('respiratoryRateResult'),
                oxygenSaturation: document.getElementById('oxygenSaturationResult'),
                temperature: document.getElementById('temperatureResult'),
                meanArterialPressure: document.getElementById('meanArterialPressureResult'),
                capillaryGlycemia: document.getElementById('capillaryGlycemiaResult'),
                
                // Entradas
                diet: document.getElementById('dietResult'),
                dietPerKg: document.getElementById('dietPerKgResult'),
                serum: document.getElementById('serumResult'),
                serumPerKg: document.getElementById('serumPerKgResult'),
                medication: document.getElementById('medicationResult'),
                medicationPerKg: document.getElementById('medicationPerKgResult'),
                totalInput: document.getElementById('totalInputResult'),
                liquidIntake: document.getElementById('liquidIntakeResult'),
                
                // Saídas
                diuresis: document.getElementById('diuresisResult'),
                diuresisPerKgHour: document.getElementById('diuresisPerKgHourResult'),
                gastricResidue: document.getElementById('gastricResidueResult'),
                gastricResiduePerKg: document.getElementById('gastricResiduePerKgResult'),
                emesisCount: document.getElementById('emesisCountResult'),
                evacuationsCount: document.getElementById('evacuationsCountResult'),
                totalOutput: document.getElementById('totalOutputResult'),
                outputPerKg: document.getElementById('outputPerKgResult'),
                
                // Balanço
                balance: document.getElementById('balanceResult'),
                balancePerKg: document.getElementById('balancePerKgResult')
            }
        };
    }

    /**
     * Exibe os resultados do cálculo na interface
     */
    displayResults(data, formData) {
        // Dados do paciente
        this.elements.result.patientName.textContent = data.patient.name || 'Paciente';
        this.elements.result.patientBed.textContent = formData.patientInfo.bed || 'N/A';
        this.elements.result.patientWeight.textContent = formData.patientInfo.weight;
        this.elements.result.timeframe.textContent = data.patient.timeframe;

        // Medições
        this.displayMeasurements(data.measurements);

        // Entradas
        this.displayInputResults(data);

        // Saídas
        this.displayOutputResults(data);

        // Balanço
        this.displayBalanceResults(data);

        // Exibir área de resultados
        this.showResults();
    }

    /**
     * Exibe as medições nos resultados
     */
    displayMeasurements(measurements) {
        const measurementMap = {
            heartRate: { element: this.elements.result.heartRate, label: 'Frequência cardíaca', unit: 'bpm' },
            respiratoryRate: { element: this.elements.result.respiratoryRate, label: 'Frequência respiratória', unit: 'irpm' },
            oxygenSaturation: { element: this.elements.result.oxygenSaturation, label: 'Saturação de Oxigênio', unit: '%' },
            temperature: { element: this.elements.result.temperature, label: 'Temperatura', unit: '°C' },
            meanArterialPressure: { element: this.elements.result.meanArterialPressure, label: 'Pressão arterial média', unit: 'mmHg' },
            capillaryGlycemia: { element: this.elements.result.capillaryGlycemia, label: 'Glicemia Capilar', unit: 'mg/dL' }
        };

        Object.entries(measurementMap).forEach(([key, config]) => {
            const value = measurements[key] || 'N/A';
            config.element.textContent = `${config.label}: ${value} ${config.unit}`;
        });
    }

    /**
     * Exibe os resultados das entradas
     */
    displayInputResults(data) {
        this.elements.result.diet.textContent = data.diet;
        this.elements.result.dietPerKg.textContent = data.diet_per_kg;
        this.elements.result.serum.textContent = data.serum;
        this.elements.result.serumPerKg.textContent = data.serum_per_kg;
        this.elements.result.medication.textContent = data.medication;
        this.elements.result.medicationPerKg.textContent = data.medication_per_kg;
        this.elements.result.totalInput.textContent = data.total_input;
        this.elements.result.liquidIntake.textContent = data.liquid_intake;
    }

    /**
     * Exibe os resultados das saídas
     */
    displayOutputResults(data) {
        this.elements.result.diuresis.textContent = data.diuresis;
        this.elements.result.diuresisPerKgHour.textContent = data.diuresis_per_kg_hour;
        this.elements.result.gastricResidue.textContent = data.gastric_residue;
        this.elements.result.gastricResiduePerKg.textContent = data.gastric_residue_per_kg;
        this.elements.result.emesisCount.textContent = data.emesis_count;
        this.elements.result.evacuationsCount.textContent = data.evacuations_count;
        this.elements.result.totalOutput.textContent = data.total_output;
        this.elements.result.outputPerKg.textContent = data.output_per_kg;
    }

    /**
     * Exibe os resultados do balanço com cores apropriadas
     */
    displayBalanceResults(data) {
        this.elements.result.balance.textContent = data.balance;
        this.elements.result.balancePerKg.textContent = data.balance_per_kg;

        // Aplicar cores baseadas no status
        const color = this.getBalanceColor(data.status);
        this.elements.result.balance.style.color = color;
        this.elements.result.balancePerKg.style.color = color;
    }

    /**
     * Retorna a cor apropriada para o status do balanço
     */
    getBalanceColor(status) {
        const colorMap = {
            'positivo': 'green',
            'negativo': 'red',
            'neutro': 'black'
        };
        return colorMap[status] || 'black';
    }

    /**
     * Exibe a área de resultados e faz scroll suave
     */
    showResults() {
        this.elements.resultArea.style.display = 'block';
        this.elements.resultArea.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Limpa todos os campos do formulário
     */
    clearForm() {
        // Limpar dados do paciente
        this.elements.patientName.value = '';
        this.elements.patientBed.value = '';
        this.elements.patientWeight.value = '';

        // Limpar medições
        const measurementFields = [
            this.elements.temperature, this.elements.heartRate, this.elements.respiratoryRate,
            this.elements.oxygenSaturation, this.elements.meanArterialPressure, this.elements.capillaryGlycemia
        ];
        measurementFields.forEach(field => field.value = '');

        // Ocultar área de resultados
        this.elements.resultArea.style.display = 'none';

        // Focar no nome do paciente
        this.elements.patientName.focus();

        // Voltar para a primeira aba
        document.getElementById('patient-tab').click();
    }

    /**
     * Copia o relatório para a área de transferência
     */
    async copyReport() {
        try {
            const reportText = this.formatReportForCopy();
            await navigator.clipboard.writeText(reportText);
            this.showCopyFeedback();
        } catch (err) {
            console.error('Falha ao copiar texto:', err);
            alert('Não foi possível copiar o resultado. Por favor, tente novamente.');
        }
    }

    /**
     * Formata o relatório para cópia em texto
     */
    formatReportForCopy() {
        const getValue = (element) => element?.textContent || 'N/A';

        const report = [
            getValue(this.elements.result.patientName),
            `Leito: ${getValue(this.elements.result.patientBed)} / Peso: ${getValue(this.elements.result.patientWeight)} kg`,
            '',
            'Medições:',
            getValue(this.elements.result.heartRate),
            getValue(this.elements.result.respiratoryRate),
            getValue(this.elements.result.oxygenSaturation),
            getValue(this.elements.result.temperature),
            getValue(this.elements.result.meanArterialPressure),
            getValue(this.elements.result.capillaryGlycemia),
            '',
            'Entradas:',
            `Dieta = ${getValue(this.elements.result.diet)} ml / ${getValue(this.elements.result.dietPerKg)} ml/kg`,
            `Soro = ${getValue(this.elements.result.serum)} ml / ${getValue(this.elements.result.serumPerKg)} ml/kg`,
            `Medicação = ${getValue(this.elements.result.medication)} ml / ${getValue(this.elements.result.medicationPerKg)} ml/kg`,
            `Oferta hídrica = ${getValue(this.elements.result.totalInput)} ml / ${getValue(this.elements.result.liquidIntake)} ml/kg`,
            '',
            'Saídas:',
            `Diurese = ${getValue(this.elements.result.diuresis)} ml / ${getValue(this.elements.result.diuresisPerKgHour)} ml/kg/h`,
            `Resíduo Gástrico = ${getValue(this.elements.result.gastricResidue)} ml / ${getValue(this.elements.result.gastricResiduePerKg)} ml/kg`,
            `Êmese = ${getValue(this.elements.result.emesisCount)} vezes`,
            `Evacuação = ${getValue(this.elements.result.evacuationsCount)} vezes`,
            `Débito Hídrico = ${getValue(this.elements.result.totalOutput)} ml / ${getValue(this.elements.result.outputPerKg)} ml/kg`,
            '',
            `Balanço Hídrico = ${getValue(this.elements.result.balance)} ml / ${getValue(this.elements.result.balancePerKg)} ml/kg`,
            `Período: ${getValue(this.elements.result.timeframe)} horas`
        ];

        return report.join('\n');
    }

    /**
     * Mostra feedback visual de cópia realizada
     */
    showCopyFeedback() {
        const originalText = this.elements.copyResultBtn.innerHTML;
        this.elements.copyResultBtn.innerHTML = '<i class="bi bi-check"></i> Copiado!';
        
        setTimeout(() => {
            this.elements.copyResultBtn.innerHTML = originalText;
        }, 2000);
    }

    /**
     * Exibe mensagem de erro
     */
    showError(message) {
        alert(message);
    }
}

// Exportar para uso global
window.UIManager = UIManager;