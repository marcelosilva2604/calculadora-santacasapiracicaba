document.addEventListener('DOMContentLoaded', function() {
    // Get tab buttons
    const patientTab = document.getElementById('patient-tab');
    const measurementsTab = document.getElementById('measurements-tab');
    const valuesTab = document.getElementById('values-tab');
    
    const calculateBtn = document.getElementById('calculateBtn');
    const resultArea = document.getElementById('resultArea');
    const copyResultBtn = document.getElementById('copyResultBtn');
    const newPatientBtn = document.getElementById('newPatientBtn');
    
    // Tab navigation usando o Bootstrap
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            // Não precisamos de lógica personalizada aqui, Bootstrap cuida da navegação
        });
    });
    
    // Configurar os campos de entrada com operações matemáticas
    setupCalculationField('diet', 'dietInput', 'dietList', 'dietTotal', 'addDietBtn', 'clearDietBtn');
    setupCalculationField('serum', 'serumInput', 'serumList', 'serumTotal', 'addSerumBtn', 'clearSerumBtn');
    setupCalculationField('medication', 'medicationInput', 'medicationList', 'medicationTotal', 'addMedicationBtn', 'clearMedicationBtn');
    setupCalculationField('diuresis', 'diuresisInput', 'diuresisList', 'diuresisTotal', 'addDiuresisBtn', 'clearDiuresisBtn');
    setupCalculationField('gastricResidue', 'gastricResidueInput', 'gastricResidueList', 'gastricResidueTotal', 'addGastricResidueBtn', 'clearGastricResidueBtn');
    setupCalculationField('emesis', 'emesisInput', 'emesisList', 'emesisTotal', 'addEmesisBtn', 'clearEmesisBtn');
    setupCalculationField('evacuations', 'evacuationsInput', 'evacuationsList', 'evacuationsTotal', 'addEvacuationsBtn', 'clearEvacuationsBtn');
    
    // Botão de cálculo
    calculateBtn.addEventListener('click', function() {
        // Coletar dados dos formulários
        const formData = {
            timeframe: document.querySelector('input[name="timeframe"]:checked').value,
            patientInfo: {
                name: document.getElementById('patientName').value,
                bed: document.getElementById('patientBed').value,
                weight: parseFloat(document.getElementById('patientWeight').value) || 0
            },
            measurements: {
                heartRate: document.getElementById('heartRate').value,
                respiratoryRate: document.getElementById('respiratoryRate').value,
                oxygenSaturation: document.getElementById('oxygenSaturation').value,
                temperature: document.getElementById('temperature').value,
                meanArterialPressure: document.getElementById('meanArterialPressure').value,
                capillaryGlycemia: document.getElementById('capillaryGlycemia').value
            },
            inputs: {
                diet: parseFloat(document.getElementById('diet').value) || 0,
                serum: parseFloat(document.getElementById('serum').value) || 0,
                medication: parseFloat(document.getElementById('medication').value) || 0
            },
            outputs: {
                diuresis: parseFloat(document.getElementById('diuresis').value) || 0,
                gastricResidue: parseFloat(document.getElementById('gastricResidue').value) || 0,
                emesis: parseFloat(document.getElementById('emesis').value) || 0,
                evacuations: parseFloat(document.getElementById('evacuations').value) || 0
            }
        };
        
        // Validar os dados
        if (!validateInputsOutputs(formData)) {
            return;
        }
        
        // Calcular localmente (sem servidor)
        try {
            const data = calculateBalance(formData);
            
            // Verificar se houve erro
            if (data.error) {
                alert(data.error);
                return;
            }
            
            // Preencher os dados do paciente
            document.getElementById('patientNameResult').textContent = data.patient.name || 'Paciente';
            document.getElementById('patientBedResult').textContent = formData.patientInfo.bed || 'N/A';
            document.getElementById('patientWeightResult').textContent = formData.patientInfo.weight;
            
            // Preencher as medições
            if (data.measurements) {
                document.getElementById('heartRateResult').textContent = `Frequência cardíaca: ${data.measurements.heartRate || 'N/A'} bpm`;
                document.getElementById('respiratoryRateResult').textContent = `Frequência respiratória: ${data.measurements.respiratoryRate || 'N/A'} irpm`;
                document.getElementById('oxygenSaturationResult').textContent = `Saturação de Oxigênio: ${data.measurements.oxygenSaturation || 'N/A'} %`;
                document.getElementById('temperatureResult').textContent = `Temperatura: ${data.measurements.temperature || 'N/A'} °C`;
                document.getElementById('meanArterialPressureResult').textContent = `Pressão arterial média: ${data.measurements.meanArterialPressure || 'N/A'} mmHg`;
                document.getElementById('capillaryGlycemiaResult').textContent = `Glicemia Capilar: ${data.measurements.capillaryGlycemia || 'N/A'} mg/dL`;
            }
            
            // Preencher as entradas
            document.getElementById('dietResult').textContent = data.diet;
            document.getElementById('dietPerKgResult').textContent = data.diet_per_kg;
            document.getElementById('serumResult').textContent = data.serum;
            document.getElementById('serumPerKgResult').textContent = data.serum_per_kg;
            document.getElementById('medicationResult').textContent = data.medication;
            document.getElementById('medicationPerKgResult').textContent = data.medication_per_kg;
            document.getElementById('totalInputResult').textContent = data.total_input;
            document.getElementById('liquidIntakeResult').textContent = data.liquid_intake;
            
            // Preencher as saídas
            document.getElementById('diuresisResult').textContent = data.diuresis;
            document.getElementById('diuresisPerKgHourResult').textContent = data.diuresis_per_kg_hour;
            document.getElementById('gastricResidueResult').textContent = data.gastric_residue;
            document.getElementById('gastricResiduePerKgResult').textContent = data.gastric_residue_per_kg;
            document.getElementById('emesisCountResult').textContent = data.emesis_count;
            document.getElementById('evacuationsCountResult').textContent = data.evacuations_count;
            document.getElementById('totalOutputResult').textContent = data.total_output;
            document.getElementById('outputPerKgResult').textContent = data.output_per_kg;
            
            // Preencher o balanço
            document.getElementById('balanceResult').textContent = data.balance;
            document.getElementById('balancePerKgResult').textContent = data.balance_per_kg;
            document.getElementById('timeframeResult').textContent = data.patient.timeframe;
            
            // Colorir o balanço conforme status
            const balanceResult = document.getElementById('balanceResult');
            const balancePerKgResult = document.getElementById('balancePerKgResult');
            
            if (data.status === 'positivo') {
                balanceResult.style.color = 'green';
                balancePerKgResult.style.color = 'green';
            } else if (data.status === 'negativo') {
                balanceResult.style.color = 'red';
                balancePerKgResult.style.color = 'red';
            } else {
                balanceResult.style.color = 'black';
                balancePerKgResult.style.color = 'black';
            }
            
            // Exibir área de resultados
            resultArea.style.display = 'block';
            
            // Scroll para os resultados
            resultArea.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao calcular o balanço hídrico. Por favor, tente novamente.');
        }
    });
    
    // Botão para copiar resultado
    copyResultBtn.addEventListener('click', function() {
        const reportEl = document.getElementById('report');
        
        // Criar um elemento temporário para copiar o texto
        const textToCopy = formatReportForCopy(reportEl);
        
        // Usar a API de Clipboard
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                // Feedback visual
                const originalText = copyResultBtn.innerHTML;
                copyResultBtn.innerHTML = '<i class="bi bi-check"></i> Copiado!';
                
                setTimeout(() => {
                    copyResultBtn.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Falha ao copiar texto: ', err);
                alert('Não foi possível copiar o resultado. Por favor, tente novamente.');
            });
    });
    
    // Botão para novo paciente
    newPatientBtn.addEventListener('click', function() {
        // Limpar todos os campos
        document.getElementById('patientName').value = '';
        document.getElementById('patientBed').value = '';
        document.getElementById('patientWeight').value = '';
        
        // Resetar medições
        document.getElementById('temperature').value = '';
        document.getElementById('heartRate').value = '';
        document.getElementById('respiratoryRate').value = '';
        document.getElementById('oxygenSaturation').value = '';
        document.getElementById('meanArterialPressure').value = '';
        document.getElementById('capillaryGlycemia').value = '';
        
        // Limpar listas e totais
        resetCalculationField('diet', 'dietList', 'dietTotal', 'dietInput');
        resetCalculationField('serum', 'serumList', 'serumTotal', 'serumInput');
        resetCalculationField('medication', 'medicationList', 'medicationTotal', 'medicationInput');
        resetCalculationField('diuresis', 'diuresisList', 'diuresisTotal', 'diuresisInput');
        resetCalculationField('gastricResidue', 'gastricResidueList', 'gastricResidueTotal', 'gastricResidueInput');
        resetCalculationField('emesis', 'emesisList', 'emesisTotal', 'emesisInput');
        resetCalculationField('evacuations', 'evacuationsList', 'evacuationsTotal', 'evacuationsInput');
        
        // Ocultar área de resultados
        resultArea.style.display = 'none';
        
        // Focar no nome do paciente
        document.getElementById('patientName').focus();
        
        // Volta para a primeira aba
        document.getElementById('patient-tab').click();
    });
    
    // Função para resetar um campo de cálculo
    function resetCalculationField(fieldId, listId, totalId, inputId) {
        document.getElementById(fieldId).value = '0';
        document.getElementById(listId).innerHTML = '';
        document.getElementById(totalId).textContent = '0';
        document.getElementById(inputId).value = '';
    }
    
    // Formatar o relatório para copiar
    function formatReportForCopy(reportEl) {
        // Obter o conteúdo do relatório
        const name = document.getElementById('patientNameResult').textContent;
        const bed = document.getElementById('patientBedResult').textContent;
        const weight = document.getElementById('patientWeightResult').textContent;
        
        // Medições
        const heartRate = document.getElementById('heartRateResult').textContent;
        const respiratoryRate = document.getElementById('respiratoryRateResult').textContent;
        const oxygenSaturation = document.getElementById('oxygenSaturationResult').textContent;
        const temperature = document.getElementById('temperatureResult').textContent;
        const meanArterialPressure = document.getElementById('meanArterialPressureResult').textContent;
        const capillaryGlycemia = document.getElementById('capillaryGlycemiaResult').textContent;
        
        // Entradas
        const diet = document.getElementById('dietResult').textContent;
        const dietPerKg = document.getElementById('dietPerKgResult').textContent;
        const serum = document.getElementById('serumResult').textContent;
        const serumPerKg = document.getElementById('serumPerKgResult').textContent;
        const medication = document.getElementById('medicationResult').textContent;
        const medicationPerKg = document.getElementById('medicationPerKgResult').textContent;
        const totalInput = document.getElementById('totalInputResult').textContent;
        const liquidIntake = document.getElementById('liquidIntakeResult').textContent;
        
        // Saídas
        const diuresis = document.getElementById('diuresisResult').textContent;
        const diuresisPerKgHour = document.getElementById('diuresisPerKgHourResult').textContent;
        const gastricResidue = document.getElementById('gastricResidueResult').textContent;
        const gastricResiduePerKg = document.getElementById('gastricResiduePerKgResult').textContent;
        const emesisCount = document.getElementById('emesisCountResult').textContent;
        const evacuationsCount = document.getElementById('evacuationsCountResult').textContent;
        const totalOutput = document.getElementById('totalOutputResult').textContent;
        const outputPerKg = document.getElementById('outputPerKgResult').textContent;
        
        // Balanço
        const balance = document.getElementById('balanceResult').textContent;
        const balancePerKg = document.getElementById('balancePerKgResult').textContent;
        const timeframe = document.getElementById('timeframeResult').textContent;
        
        // Montar o texto formatado para cópia
        let report = `${name}\n`;
        report += `Leito: ${bed} / Peso: ${weight} kg\n\n`;
        
        report += `Medições:\n`;
        report += `${heartRate}\n`;
        report += `${respiratoryRate}\n`;
        report += `${oxygenSaturation}\n`;
        report += `${temperature}\n`;
        report += `${meanArterialPressure}\n`;
        report += `${capillaryGlycemia}\n\n`;
        
        report += `Entradas:\n`;
        report += `Dieta = ${diet} ml / ${dietPerKg} ml/kg\n`;
        report += `Soro = ${serum} ml / ${serumPerKg} ml/kg\n`;
        report += `Medicação = ${medication} ml / ${medicationPerKg} ml/kg\n`;
        report += `Oferta hídrica = ${totalInput} ml / ${liquidIntake} ml/kg\n\n`;
        
        report += `Saídas:\n`;
        report += `Diurese = ${diuresis} ml / ${diuresisPerKgHour} ml/kg/h\n`;
        report += `Resíduo Gástrico = ${gastricResidue} ml / ${gastricResiduePerKg} ml/kg\n`;
        report += `Êmese = ${emesisCount} vezes\n`;
        report += `Evacuação = ${evacuationsCount} vezes\n`;
        report += `Débito Hídrico = ${totalOutput} ml / ${outputPerKg} ml/kg\n\n`;
        
        report += `Balanço Hídrico = ${balance} ml / ${balancePerKg} ml/kg\n`;
        report += `Período: ${timeframe} horas\n`;
        
        return report;
    }
    
    // Função para validar os dados
    function validateInputsOutputs(formData) {
        let isValid = true;
        
        // Verificar o peso do paciente
        if (!formData.patientInfo.weight || formData.patientInfo.weight <= 0) {
            alert('Por favor, informe o peso do paciente para calcular o balanço hídrico.');
            document.getElementById('patientWeight').focus();
            return false;
        }
        
        // Verificar se pelo menos um valor de entrada foi fornecido
        const hasInputs = formData.inputs.diet > 0 || formData.inputs.serum > 0 || formData.inputs.medication > 0;
        if (!hasInputs) {
            alert('Por favor, preencha pelo menos um valor de entrada (Dieta, Soro ou Medicação).');
            document.getElementById('values-tab').click();
            return false;
        }
        
        return isValid;
    }
    
    // Função para configurar os campos de cálculo
    function setupCalculationField(fieldId, inputId, listId, totalId, addBtnId, clearBtnId) {
        const hiddenField = document.getElementById(fieldId);
        const inputField = document.getElementById(inputId);
        const listElement = document.getElementById(listId);
        const totalElement = document.getElementById(totalId);
        const addButton = document.getElementById(addBtnId);
        const clearButton = document.getElementById(clearBtnId);
        
        // Determinar a unidade (ml ou vezes)
        const isCountField = fieldId === 'emesis' || fieldId === 'evacuations';
        const unit = isCountField ? 'vezes' : 'ml';
        
        let values = [];
        
        // Função para adicionar um valor
        function addValue() {
            const expression = inputField.value.trim();
            if (!expression) return;
            
            try {
                // Substituir vírgulas por pontos para cálculos
                const normalizedExpression = expression.replace(/,/g, '.');
                
                // Avaliar a expressão
                let result;
                if (normalizedExpression.includes('*') || 
                    normalizedExpression.includes('+') || 
                    normalizedExpression.includes('-') || 
                    normalizedExpression.includes('/')) {
                    // Avaliar expressão matemática com segurança
                    result = evaluateExpression(normalizedExpression);
                } else {
                    // É apenas um número
                    result = parseFloat(normalizedExpression);
                }
                
                if (isNaN(result)) {
                    throw new Error('Resultado não é um número válido');
                }
                
                // Arredondar para 1 casa decimal (para ml) ou inteiro (para vezes)
                if (isCountField) {
                    result = Math.round(result); // Arredondar para inteiro para contagens
                } else {
                    result = Math.round(result * 10) / 10; // 1 casa decimal para volumes
                }
                
                // Adicionar à lista
                values.push({
                    expression: expression,
                    value: result
                });
                
                // Atualizar a interface
                updateUI();
                
                // Limpar campo de entrada
                inputField.value = '';
                inputField.focus();
                
            } catch (error) {
                alert('Expressão inválida. Por favor, verifique e tente novamente.');
                console.error('Erro ao avaliar expressão:', error);
            }
        }
        
        // Função para atualizar a interface
        function updateUI() {
            // Limpar a lista
            listElement.innerHTML = '';
            
            // Calcular o total
            let total = 0;
            
            // Adicionar cada valor à lista
            values.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                // Exibir expressão e valor calculado
                const expressionSpan = document.createElement('span');
                expressionSpan.textContent = item.expression;
                
                const valueSpan = document.createElement('span');
                valueSpan.textContent = `= ${item.value} ${unit}`;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-sm btn-outline-danger';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.addEventListener('click', () => {
                    values.splice(index, 1);
                    updateUI();
                });
                
                li.appendChild(expressionSpan);
                li.appendChild(valueSpan);
                li.appendChild(deleteBtn);
                listElement.appendChild(li);
                
                // Somar ao total
                total += item.value;
            });
            
            // Atualizar total (formato depende do tipo de campo)
            if (isCountField) {
                totalElement.textContent = Math.round(total); // Sem casas decimais para contagens
            } else {
                totalElement.textContent = total.toFixed(1); // 1 casa decimal para volumes
            }
            
            // Atualizar campo oculto para o formulário
            hiddenField.value = total;
        }
        
        // Botão Adicionar
        addButton.addEventListener('click', addValue);
        
        // Limpar todos os valores
        clearButton.addEventListener('click', () => {
            values = [];
            updateUI();
            inputField.focus();
        });
        
        // Manipular tecla Enter no campo de entrada
        inputField.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Impedir o envio do formulário
                addValue();
            }
        });
    }
    
    // Função segura para avaliar expressões matemáticas simples
    function evaluateExpression(expression) {
        // Verificar se a expressão contém apenas operadores e números permitidos
        if (!/^[0-9\s\.\+\-\*\/\(\)]+$/.test(expression)) {
            throw new Error('A expressão contém caracteres não permitidos');
        }
        
        // Verificar se há funções ou métodos não permitidos
        if (/[a-zA-Z]/.test(expression)) {
            throw new Error('A expressão contém letras, o que não é permitido');
        }
        
        // Avaliar a expressão de forma segura
        return Function('"use strict"; return (' + expression + ')')();
    }
    
    // Função de cálculo do balanço hídrico (migrada do Flask)
    function calculateBalance(data) {
        const inputs = data.inputs || {};
        const outputs = data.outputs || {};
        const patientInfo = data.patientInfo || {};
        const measurements = data.measurements || {};
        
        // Obter peso do paciente e período
        const patientWeight = parseFloat(patientInfo.weight || 0);
        const timeframe = parseInt(data.timeframe || 24);
        
        // Verificar se o peso é válido
        if (patientWeight <= 0) {
            return {
                error: "O peso do paciente deve ser maior que zero para calcular o balanço hídrico."
            };
        }
        
        // Cálculos de entradas individuais
        const diet = parseFloat(inputs.diet || 0);
        const serum = parseFloat(inputs.serum || 0);
        const medication = parseFloat(inputs.medication || 0);
        
        // Calcular valores por kg
        const dietPerKg = diet / patientWeight;
        const serumPerKg = serum / patientWeight;
        const medicationPerKg = medication / patientWeight;
        
        // Cálculos de saídas
        const diuresis = parseFloat(outputs.diuresis || 0);
        const gastricResidue = parseFloat(outputs.gastricResidue || 0);
        const emesis = parseFloat(outputs.emesis || 0);
        const evacuations = parseFloat(outputs.evacuations || 0);
        
        // Calcular valores por kg
        const gastricResiduePerKg = gastricResidue / patientWeight;
        
        // Cálculos totais de entrada e saída em ml
        const totalInput = diet + serum + medication;
        const totalOutput = diuresis + gastricResidue;
        
        // Cálculo do balanço simples em ml
        const balance = totalInput - totalOutput;
        
        // Cálculos avançados
        const liquidIntake = totalInput / patientWeight;
        
        // Diurese em ml/kg/h
        let diuresisPerKgHour = 0;
        if (patientWeight > 0 && timeframe > 0) {
            diuresisPerKgHour = diuresis / timeframe / patientWeight;
        }
        
        // Balanço hídrico por peso
        const balancePerKg = balance / patientWeight;
        
        // Débito hídrico por peso
        const outputPerKg = totalOutput / patientWeight;
        
        // Determinando o status do balanço
        let status;
        if (balance > 0) {
            status = "positivo";
        } else if (balance < 0) {
            status = "negativo";
        } else {
            status = "neutro";
        }
        
        // Dados do paciente e medições
        let patientName = patientInfo.name || '';
        
        // Formatação do nome do paciente
        if (patientName) {
            // Converter para title case
            let formattedName = patientName.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            
            // Usar regex para substituir qualquer variação de "rn" por "RN"
            formattedName = formattedName.replace(/\brn\b/gi, 'RN');
            
            // Ajustar preposições para minúsculas após RN
            formattedName = formattedName.replace(/RN (De|Do|Da|Dos|Das)\b/g, (match, prep) => `RN ${prep.toLowerCase()}`);
            
            patientName = formattedName;
        }
        
        // Criando o resultado detalhado
        return {
            // Entradas
            diet: Math.round(diet * 100) / 100,
            diet_per_kg: Math.round(dietPerKg * 100) / 100,
            serum: Math.round(serum * 100) / 100,
            serum_per_kg: Math.round(serumPerKg * 100) / 100,
            medication: Math.round(medication * 100) / 100,
            medication_per_kg: Math.round(medicationPerKg * 100) / 100,
            total_input: Math.round(totalInput * 100) / 100,
            liquid_intake: Math.round(liquidIntake * 100) / 100,
            
            // Saídas
            diuresis: Math.round(diuresis * 100) / 100,
            diuresis_per_kg_hour: Math.round(diuresisPerKgHour * 100) / 100,
            gastric_residue: Math.round(gastricResidue * 100) / 100,
            gastric_residue_per_kg: Math.round(gastricResiduePerKg * 100) / 100,
            emesis_count: Math.round(emesis),
            evacuations_count: Math.round(evacuations),
            total_output: Math.round(totalOutput * 100) / 100,
            output_per_kg: Math.round(outputPerKg * 100) / 100,
            
            // Balanço
            balance: Math.round(balance * 100) / 100,
            balance_per_kg: Math.round(balancePerKg * 100) / 100,
            status: status,
            
            // Dados do paciente e medições
            patient: {
                name: patientName,
                bed: patientInfo.bed || '',
                weight: patientWeight,
                timeframe: timeframe
            },
            measurements: measurements
        };
    }
}); 