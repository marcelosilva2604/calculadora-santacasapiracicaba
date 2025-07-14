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
     * Coleta dados dos sinais vitais
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
            const formHandler = window.hydricBalanceApp?.formHandler;
            const fieldHandler = formHandler?.calculationFields?.get(vital.id);
            
            if (fieldHandler && fieldHandler.values && fieldHandler.values.length > 0) {
                const values = fieldHandler.values;
                const hasRangeOrMultiple = values.some(v => v.type === 'range' || v.type === 'multiple');
                
                // Calcular média
                const average = values.reduce((sum, item) => sum + item.value, 0) / values.length;
                
                // Preparar detalhes dos valores
                const details = values.map(item => {
                    if (item.type === 'range') {
                        return `${item.expression} (média: ${Math.round(item.value)})`;
                    } else if (item.type === 'multiple') {
                        return `${item.expression} (média: ${Math.round(item.value)})`;
                    } else {
                        return item.expression;
                    }
                }).join(', ');

                collectedData.push({
                    ...vital,
                    average: Math.round(average),
                    details: details,
                    hasRangeOrMultiple: hasRangeOrMultiple,
                    valuesCount: values.length
                });
            }
        });

        return collectedData;
    }

    /**
     * Gera o HTML do relatório
     */
    generateReportHTML() {
        const patientData = this.collectPatientData();
        const vitalSigns = this.collectVitalSigns();
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
                                Valores: ${vital.details}
                            </div>
                        </div>
                        <div class="report-vital-sign-value">
                            ${vital.average} ${vital.unit}
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
     * Exibe o relatório no modal
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

        // Exibir modal (usando Bootstrap)
        try {
            const modal = new bootstrap.Modal(reportModal);
            console.log('Modal criado:', modal);
            modal.show();
            console.log('Modal.show() chamado');
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

    // Converter HTML para texto
    const textContent = reportContent.innerText;
    
    // Copiar para clipboard
    navigator.clipboard.writeText(textContent).then(() => {
        alert('Relatório copiado para a área de transferência!');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('Erro ao copiar o relatório.');
    });
}

// Instância global do gerador de relatórios
window.reportGenerator = new ReportGenerator();