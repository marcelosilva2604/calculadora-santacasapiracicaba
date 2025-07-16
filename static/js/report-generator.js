/**
 * Gerador de Relatórios - Santa Casa Piracicaba
 * Responsável por coletar dados e gerar relatórios do balanço hídrico
 */

class ReportGenerator {
    constructor() {
        this.reportData = {};
    }

    /**
     * Coleta dados do paciente
     */
    collectPatientData() {
        return {
            name: document.getElementById('patient-name')?.value || 'Não informado',
            bed: document.getElementById('patient-bed')?.value || 'Não informado',
            weight: document.getElementById('patient-weight')?.value || 'Não informado',
            timeframe: document.querySelector('input[name="timeframe"]:checked')?.value || '24'
        };
    }

    /**
     * Calcula o balanço hídrico completo
     */
    calculateHydricBalance(patientData) {
        const weight = parseFloat(patientData.weight) || 0;
        const timeframe = parseInt(patientData.timeframe) || 24;
        
        if (weight <= 0) {
            return {
                error: 'Peso do paciente necessário para cálculo',
                hasData: false
            };
        }
        
        // Coletar dados do HydricAccumulator
        const hydricData = {
            // Entradas (ml)
            diet: window.hydricAccumulator?.getFieldTotal('diet') || 0,
            serum: window.hydricAccumulator?.getFieldTotal('serum') || 0,
            medication: window.hydricAccumulator?.getFieldTotal('medication') || 0,
            
            // Saídas (ml)
            diuresis: window.hydricAccumulator?.getFieldTotal('diuresis') || 0,
            gastricResidue: window.hydricAccumulator?.getFieldTotal('gastric-residue') || 0,
            
            // Contadores (vezes)
            emesis: window.hydricAccumulator?.getFieldTotal('emesis') || 0,
            evacuations: window.hydricAccumulator?.getFieldTotal('evacuations') || 0
        };
        
        // Calcular totais de entrada (Oferta Hídrica)
        const totalInputML = hydricData.diet + hydricData.serum + hydricData.medication;
        const totalInputMLPerKg = totalInputML / weight;
        
        // Calcular totais de saída (Perdas)
        const totalOutputML = hydricData.diuresis + hydricData.gastricResidue;
        const totalOutputMLPerKg = totalOutputML / weight;
        
        // Calcular balanço hídrico final
        const balanceML = totalInputML - totalOutputML;
        const balanceMLPerKg = balanceML / weight;
        
        // Calcular diurese por ml/kg/h
        const diuresisMLPerKgPerHour = hydricData.diuresis / weight / timeframe;
        
        // Determinar status do balanço
        let balanceStatus = 'neutro';
        if (balanceML > 0) balanceStatus = 'positivo';
        else if (balanceML < 0) balanceStatus = 'negativo';
        
        return {
            hasData: true,
            weight: weight,
            timeframe: timeframe,
            
            // Entradas individuais
            diet: {
                ml: hydricData.diet,
                mlPerKg: hydricData.diet / weight
            },
            serum: {
                ml: hydricData.serum,
                mlPerKg: hydricData.serum / weight
            },
            medication: {
                ml: hydricData.medication,
                mlPerKg: hydricData.medication / weight
            },
            
            // Saídas individuais
            diuresis: {
                ml: hydricData.diuresis,
                mlPerKg: hydricData.diuresis / weight,
                mlPerKgPerHour: diuresisMLPerKgPerHour
            },
            gastricResidue: {
                ml: hydricData.gastricResidue,
                mlPerKg: hydricData.gastricResidue / weight
            },
            
            // Contadores
            emesis: hydricData.emesis,
            evacuations: hydricData.evacuations,
            
            // Totais
            totalInput: {
                ml: totalInputML,
                mlPerKg: totalInputMLPerKg
            },
            totalOutput: {
                ml: totalOutputML,
                mlPerKg: totalOutputMLPerKg
            },
            
            // Balanço final
            balance: {
                ml: balanceML,
                mlPerKg: balanceMLPerKg,
                status: balanceStatus
            }
        };
    }

    /**
     * Coleta dados dos sinais vitais (versão simplificada)
     */
    collectVitalSigns() {
        const vitalSigns = [
            {
                id: 'heart-rate',
                name: 'Frequência Cardíaca',
                unit: 'bpm',
                icon: 'bi-heart'
            },
            {
                id: 'respiratory-rate',
                name: 'Frequência Respiratória',
                unit: 'irpm',
                icon: 'bi-wind'
            },
            {
                id: 'oxygen-saturation',
                name: 'Saturação de Oxigênio',
                unit: '%',
                icon: 'bi-heart-pulse-fill'
            },
            {
                id: 'temperature',
                name: 'Temperatura',
                unit: '°C',
                icon: 'bi-thermometer-half'
            },
            {
                id: 'mean-arterial-pressure',
                name: 'Pressão Arterial Média',
                unit: 'mmHg',
                icon: 'bi-activity'
            },
            {
                id: 'blood-glucose',
                name: 'Glicemia',
                unit: 'mg/dL',
                icon: 'bi-droplet'
            }
        ];

        const collectedData = [];

        vitalSigns.forEach(vital => {
            const inputElement = document.getElementById(vital.id);
            const value = inputElement?.value?.trim();
            
            if (value && value !== '') {
                collectedData.push({
                    ...vital,
                    value: value,
                    details: value
                });
            }
        });

        return collectedData;
    }

    /**
     * Gera o HTML da seção de balanço hídrico
     */
    generateHydricBalanceHTML(hydricBalance) {
        const formatNumber = (num) => {
            return Math.round(num * 100) / 100;
        };

        let html = `
            <div class="report-section">
                <h3>
                    <i class="bi bi-droplet"></i>
                    Balanço Hídrico
                </h3>
                
                <!-- Entradas -->
                <div class="report-subsection">
                    <h4 style="color: #0066cc; margin-bottom: 10px;">
                        <i class="bi bi-arrow-down-circle"></i>
                        Entradas
                    </h4>
        `;

        // Dieta
        if (hydricBalance.diet.ml > 0) {
            html += `
                <div class="report-item">
                    <span class="report-item-label">Dieta:</span>
                    <span class="report-item-value">${formatNumber(hydricBalance.diet.ml)} ml (${formatNumber(hydricBalance.diet.mlPerKg)} ml/kg)</span>
                </div>
            `;
        }

        // Soro
        if (hydricBalance.serum.ml > 0) {
            html += `
                <div class="report-item">
                    <span class="report-item-label">Soro:</span>
                    <span class="report-item-value">${formatNumber(hydricBalance.serum.ml)} ml (${formatNumber(hydricBalance.serum.mlPerKg)} ml/kg)</span>
                </div>
            `;
        }

        // Medicação
        if (hydricBalance.medication.ml > 0) {
            html += `
                <div class="report-item">
                    <span class="report-item-label">Medicação:</span>
                    <span class="report-item-value">${formatNumber(hydricBalance.medication.ml)} ml (${formatNumber(hydricBalance.medication.mlPerKg)} ml/kg)</span>
                </div>
            `;
        }

        // Total de Entradas (Oferta Hídrica)
        html += `
                <div class="report-item total-item" style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; font-weight: bold;">
                    <span class="report-item-label">Oferta Hídrica Total:</span>
                    <span class="report-item-value">${formatNumber(hydricBalance.totalInput.ml)} ml (${formatNumber(hydricBalance.totalInput.mlPerKg)} ml/kg)</span>
                </div>
            </div>
            
            <!-- Saídas -->
            <div class="report-subsection">
                <h4 style="color: #cc6600; margin-bottom: 10px;">
                    <i class="bi bi-arrow-up-circle"></i>
                    Saídas
                </h4>
        `;

        // Diurese
        if (hydricBalance.diuresis.ml > 0) {
            html += `
                <div class="report-item">
                    <span class="report-item-label">Diurese:</span>
                    <span class="report-item-value">${formatNumber(hydricBalance.diuresis.ml)} ml (${formatNumber(hydricBalance.diuresis.mlPerKg)} ml/kg) - ${formatNumber(hydricBalance.diuresis.mlPerKgPerHour)} ml/kg/h</span>
                </div>
            `;
        }

        // Resíduo Gástrico
        if (hydricBalance.gastricResidue.ml > 0) {
            html += `
                <div class="report-item">
                    <span class="report-item-label">Resíduo Gástrico:</span>
                    <span class="report-item-value">${formatNumber(hydricBalance.gastricResidue.ml)} ml (${formatNumber(hydricBalance.gastricResidue.mlPerKg)} ml/kg)</span>
                </div>
            `;
        }

        // Êmese (apenas contador)
        if (hydricBalance.emesis > 0) {
            html += `
                <div class="report-item">
                    <span class="report-item-label">Êmese:</span>
                    <span class="report-item-value">${hydricBalance.emesis} vezes</span>
                </div>
            `;
        }

        // Evacuações (apenas contador)
        if (hydricBalance.evacuations > 0) {
            html += `
                <div class="report-item">
                    <span class="report-item-label">Evacuações:</span>
                    <span class="report-item-value">${hydricBalance.evacuations} vezes</span>
                </div>
            `;
        }

        // Total de Saídas (Perdas)
        html += `
                <div class="report-item total-item" style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; font-weight: bold;">
                    <span class="report-item-label">Perdas Total:</span>
                    <span class="report-item-value">${formatNumber(hydricBalance.totalOutput.ml)} ml (${formatNumber(hydricBalance.totalOutput.mlPerKg)} ml/kg)</span>
                </div>
            </div>
            
            <!-- Balanço Final -->
            <div class="report-subsection">
                <h4 style="color: ${hydricBalance.balance.status === 'positivo' ? '#009900' : hydricBalance.balance.status === 'negativo' ? '#cc0000' : '#666666'}; margin-bottom: 10px;">
                    <i class="bi bi-calculator"></i>
                    Balanço Hídrico Final
                </h4>
                <div class="report-item balance-item" style="border: 2px solid ${hydricBalance.balance.status === 'positivo' ? '#009900' : hydricBalance.balance.status === 'negativo' ? '#cc0000' : '#666666'}; padding: 15px; border-radius: 8px; background-color: ${hydricBalance.balance.status === 'positivo' ? '#f0fff0' : hydricBalance.balance.status === 'negativo' ? '#fff0f0' : '#f5f5f5'};">
                    <span class="report-item-label" style="font-size: 16px; font-weight: bold;">Balanço ${hydricBalance.balance.status.charAt(0).toUpperCase() + hydricBalance.balance.status.slice(1)}:</span>
                    <span class="report-item-value" style="font-size: 16px; font-weight: bold;">${formatNumber(hydricBalance.balance.ml)} ml (${formatNumber(hydricBalance.balance.mlPerKg)} ml/kg)</span>
                </div>
            </div>
        </div>
        `;

        return html;
    }

    /**
     * Gera o HTML do relatório
     */
    generateReportHTML() {
        const patientData = this.collectPatientData();
        const vitalSigns = this.collectVitalSigns();
        const hydricBalance = this.calculateHydricBalance(patientData);
        const currentDate = new Date().toLocaleDateString('pt-BR');
        const currentTime = new Date().toLocaleTimeString('pt-BR');

        let html = `
            <div class="report-section">
                <h3>
                    <i class="bi bi-person"></i>
                    Dados do Paciente
                </h3>
                <div class="report-item">
                    <span class="report-item-label">Nome:</span>
                    <span class="report-item-value">${patientData.name}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">Leito:</span>
                    <span class="report-item-value">${patientData.bed}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">Peso:</span>
                    <span class="report-item-value">${patientData.weight} ${patientData.weight !== 'Não informado' ? 'kg' : ''}</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">Período de Avaliação:</span>
                    <span class="report-item-value">${patientData.timeframe} horas</span>
                </div>
                <div class="report-item">
                    <span class="report-item-label">Data/Hora do Relatório:</span>
                    <span class="report-item-value">${currentDate} - ${currentTime}</span>
                </div>
            </div>
        `;

        // Adicionar seção de balanço hídrico
        if (hydricBalance.hasData) {
            html += this.generateHydricBalanceHTML(hydricBalance);
        } else {
            html += `
                <div class="report-section">
                    <h3>
                        <i class="bi bi-droplet"></i>
                        Balanço Hídrico
                    </h3>
                    <p class="text-muted">${hydricBalance.error || 'Dados insuficientes para cálculo do balanço hídrico.'}</p>
                </div>
            `;
        }

        if (vitalSigns.length > 0) {
            html += `
                <div class="report-section">
                    <h3>
                        <i class="bi bi-heart-pulse"></i>
                        Sinais Vitais
                    </h3>
            `;

            vitalSigns.forEach(vital => {
                html += `
                    <div class="report-vital-sign">
                        <div>
                            <div class="report-vital-sign-name">
                                <i class="bi ${vital.icon}"></i>
                                ${vital.name}
                            </div>
                            <div class="report-vital-sign-detail">
                                ${vital.details} ${vital.unit}
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        } else {
            html += `
                <div class="report-section">
                    <h3>
                        <i class="bi bi-heart-pulse"></i>
                        Sinais Vitais
                    </h3>
                    <p class="text-muted">Nenhum sinal vital foi registrado.</p>
                </div>
            `;
        }

        return html;
    }

    /**
     * Exibe o relatório no modal centralizado
     */
    showReport() {
        console.log('showReport() chamado');
        
        const reportContent = document.getElementById('report-content');
        const reportModal = document.getElementById('report-modal');
        
        console.log('reportContent:', reportContent);
        console.log('reportModal:', reportModal);
        
        if (!reportContent || !reportModal) {
            console.error('Elementos do modal não encontrados');
            alert('Erro: Elementos do modal não encontrados');
            return;
        }

        // Gerar conteúdo do relatório
        const reportHTML = this.generateReportHTML();
        console.log('reportHTML gerado:', reportHTML);
        reportContent.innerHTML = reportHTML;

        // Verificar se Bootstrap está disponível
        if (typeof bootstrap === 'undefined') {
            console.error('Bootstrap não está carregado');
            alert('Erro: Bootstrap não está carregado');
            return;
        }

        // Exibir modal centralizado
        try {
            // Criar backdrop opaco
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            backdrop.style.position = 'fixed';
            backdrop.style.top = '0';
            backdrop.style.left = '0';
            backdrop.style.width = '100vw';
            backdrop.style.height = '100vh';
            backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            backdrop.style.zIndex = '1040';
            document.body.appendChild(backdrop);
            
            // Adicionar classe show para aplicar o CSS de centralização
            reportModal.classList.add('show');
            
            // Usar Bootstrap Modal sem backdrop próprio
            const modal = new bootstrap.Modal(reportModal, {
                backdrop: false, // Usamos nosso backdrop customizado
                keyboard: true,
                focus: true
            });
            
            console.log('Modal criado:', modal);
            modal.show();
            console.log('Modal.show() chamado');
            
            // Fechar modal ao clicar no backdrop
            backdrop.addEventListener('click', () => {
                modal.hide();
            });
            
            // Remover classe show e backdrop quando modal for fechado
            reportModal.addEventListener('hidden.bs.modal', () => {
                reportModal.classList.remove('show');
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, { once: true });
            
        } catch (error) {
            console.error('Erro ao exibir modal:', error);
            alert('Erro ao exibir relatório: ' + error.message);
        }
    }
}

// Funções globais para os botões do modal
function printReport() {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Relatório de Balanço Hídrico</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
            <link href="static/css/healthcare-theme.css" rel="stylesheet">
            <style>
                body { padding: 20px; }
                .report-section { margin-bottom: 30px; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>Relatório de Balanço Hídrico - Santa Casa Piracicaba</h1>
            ${reportContent.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function copyReport() {
    const reportContent = document.getElementById('report-content');
    if (!reportContent) return;

    // Gerar texto formatado customizado
    const textContent = generateTextForCopy();
    
    // Copiar para clipboard
    navigator.clipboard.writeText(textContent).then(() => {
        alert('Relatório copiado para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar o relatório.');
    });
}

function generateTextForCopy() {
    const patientData = window.reportGenerator.collectPatientData();
    const vitalSigns = window.reportGenerator.collectVitalSigns();
    const hydricBalance = window.reportGenerator.calculateHydricBalance(patientData);
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const currentTime = new Date().toLocaleTimeString('pt-BR');
    
    const formatNumber = (num) => {
        return Math.round(num * 100) / 100;
    };
    
    let text = `Dados do Paciente\n`;
    text += `Nome: ${patientData.name}\n`;
    text += `Leito: ${patientData.bed} Peso: ${patientData.weight} ${patientData.weight !== 'Não informado' ? 'kg' : ''}\n`;
    text += `\n`;
    
    if (vitalSigns.length > 0) {
        text += `Sinais Vitais\n`;
        vitalSigns.forEach(vital => {
            text += `${vital.name}: ${vital.details} ${vital.unit}\n`;
        });
        text += `\n`;
    }
    
    if (hydricBalance.hasData) {
        text += `Balanço Hídrico\n`;
        text += `Entradas\n`;
        
        if (hydricBalance.diet.ml > 0) {
            text += `Dieta: ${formatNumber(hydricBalance.diet.ml)} ml (${formatNumber(hydricBalance.diet.mlPerKg)} ml/kg)\n`;
        }
        if (hydricBalance.serum.ml > 0) {
            text += `Soro: ${formatNumber(hydricBalance.serum.ml)} ml (${formatNumber(hydricBalance.serum.mlPerKg)} ml/kg)\n`;
        }
        if (hydricBalance.medication.ml > 0) {
            text += `Medicação: ${formatNumber(hydricBalance.medication.ml)} ml (${formatNumber(hydricBalance.medication.mlPerKg)} ml/kg)\n`;
        }
        text += `Oferta Hídrica Total: ${formatNumber(hydricBalance.totalInput.ml)} ml (${formatNumber(hydricBalance.totalInput.mlPerKg)} ml/kg)\n`;
        text += `\n`;
        text += `Saídas\n`;
        if (hydricBalance.diuresis.ml > 0) {
            text += `Diurese: ${formatNumber(hydricBalance.diuresis.ml)} ml (${formatNumber(hydricBalance.diuresis.mlPerKg)} ml/kg) - ${formatNumber(hydricBalance.diuresis.mlPerKgPerHour)} ml/kg/h\n`;
        }
        if (hydricBalance.gastricResidue.ml > 0) {
            text += `Resíduo Gástrico: ${formatNumber(hydricBalance.gastricResidue.ml)} ml (${formatNumber(hydricBalance.gastricResidue.mlPerKg)} ml/kg)\n`;
        }
        if (hydricBalance.emesis > 0) {
            text += `Êmese: ${hydricBalance.emesis} vezes\n`;
        }
        if (hydricBalance.evacuations > 0) {
            text += `Evacuações: ${hydricBalance.evacuations} vezes\n`;
        }
        text += `Perdas Total: ${formatNumber(hydricBalance.totalOutput.ml)} ml (${formatNumber(hydricBalance.totalOutput.mlPerKg)} ml/kg)\n`;
        text += `\n`;
        text += `Balanço Hídrico Final\n`;
        text += `Balanço ${hydricBalance.balance.status.charAt(0).toUpperCase() + hydricBalance.balance.status.slice(1)}: ${formatNumber(hydricBalance.balance.ml)} ml (${formatNumber(hydricBalance.balance.mlPerKg)} ml/kg)\n`;
        text += `\n`;
    }
    
    text += `Período de Avaliação: ${patientData.timeframe} horas\n`;
    text += `Data/Hora do Relatório: ${currentDate} - ${currentTime}\n`;
    
    return text;
}

// Instância global do gerador de relatórios
window.reportGenerator = new ReportGenerator();
console.log('Report Generator carregado em:', new Date().toLocaleTimeString());