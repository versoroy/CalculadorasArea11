document.addEventListener('DOMContentLoaded', () => {

    // --- Formatters and Parsers ---
    const formatCurrency = (value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
    const formatAmount = (value) => {
        if (!value) return '';
        const numberValue = parseInt(String(value).replace(/\D/g, ''), 10);
        return isNaN(numberValue) ? '' : new Intl.NumberFormat('es-ES').format(numberValue);
    };
    const parseFormattedAmount = (value) => {
        if (typeof value !== 'string') value = String(value);
        let cleanValue = value.trim();
        if (cleanValue === '' || cleanValue === '-') return 0;

        const lastDot = cleanValue.lastIndexOf('.');
        const lastComma = cleanValue.lastIndexOf(',');

        // If both separators are present, remove the one used for thousands
        if (lastDot > -1 && lastComma > -1) {
            if (lastComma > lastDot) { // Comma is decimal (Spanish format)
                cleanValue = cleanValue.replace(/\./g, ''); // remove dots
            } else { // Dot is decimal (US format)
                cleanValue = cleanValue.replace(/,/g, ''); // remove commas
            }
        }

        // Standardize decimal separator to a dot
        cleanValue = cleanValue.replace(',', '.');

        // If dots are still present, check if they are for thousands
        if (cleanValue.includes('.')) {
            const parts = cleanValue.split('.');
            // Heuristic: if the last part has 3 digits and there are more than 3 digits total,
            // it's likely a thousands separator in a number like "200.000".
            const isLastPartThreeDigits = parts[parts.length - 1].length === 3;
            const hasMoreThanThreeDigitsTotal = value.replace(/[.,]/g, '').length > 3;

            if (parts.length > 1 && isLastPartThreeDigits && hasMoreThanThreeDigitsTotal) {
                cleanValue = cleanValue.replace(/\./g, '');
            }
        }

        return parseFloat(cleanValue) || 0;
    };
    const formatResultValue = (value) => {
        if (value === 0) return '-';
        return formatCurrency(value);
    };

    // --- Payroll Specific Formatters ---
    const formatIntegerCurrency = (value) => {
        const roundedValue = Math.round(value);
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(roundedValue);
    };
    const parsePayrollAmount = (value) => {
        if (typeof value !== 'string') value = String(value);
        if (value.trim() === '-') return 0;
        const withDotDecimal = value.replace(/\./g, '').replace(',', '.');
        return Math.round(parseFloat(withDotDecimal) || 0);
    };
    const formatPayrollResultValue = (value) => {
        if (value === 0) return '-';
        return formatIntegerCurrency(value);
    };


    // --- DOM Elements ---
    const calculators = document.querySelectorAll('.calculator');
    const navLinks = document.querySelectorAll('.tool-link');

    const loanCalculator = {
        commonAmount: document.getElementById('common-amount'),
        commonTerm: document.getElementById('common-term'),
        interest1: document.getElementById('loan1-interest'),
        openingFee1: document.getElementById('loan1-opening-fee'),
        monthlyPayment1: document.getElementById('loan1-monthly-payment'),
        openingFeeAmount1: document.getElementById('loan1-opening-fee-amount'),
        interest2: document.getElementById('loan2-interest'),
        openingFee2: document.getElementById('loan2-opening-fee'),
        monthlyPayment2: document.getElementById('loan2-monthly-payment'),
        openingFeeAmount2: document.getElementById('loan2-opening-fee-amount'),
        panel1: document.getElementById('loan1-panel'),
        panel2: document.getElementById('loan2-panel'),
        savingsDisplay1: document.querySelector('#loan1-panel .loan-savings-display'),
        savingsDisplay2: document.querySelector('#loan2-panel .loan-savings-display'),
        amortizationButtons: document.querySelectorAll('.amortization-btn'),
    };
    
    const singleLoanCalculator = {
        amount: document.getElementById('sl-amount'),
        interest: document.getElementById('sl-interest'),
        term: document.getElementById('sl-term'),
        monthlyPayment: document.getElementById('sl-monthly-payment'),
        summaryPanel: document.getElementById('sl-summary-panel'),
        summaryCapital: document.getElementById('sl-summary-capital'),
        summaryInterest: document.getElementById('sl-summary-interest'),
        summaryTotal: document.getElementById('sl-summary-total'),
        chartCanvas: document.getElementById('sl-chart'),
        tablePanel: document.getElementById('sl-table-panel'),
        tableBody: document.getElementById('sl-table-body'),
    };

    const pufComparator = {
        capital: document.getElementById('puf-capital'),
        pufAmount: document.getElementById('puf-amount'),
        interest: document.getElementById('puf-interest'),
        term: document.getElementById('puf-term'),
        monthlyPaymentWith: document.getElementById('puf-monthly-payment-with'),
        monthlyPaymentWithout: document.getElementById('puf-monthly-payment-without'),
        totalCapitalWith: document.getElementById('puf-total-capital-with'),
        totalCapitalWithout: document.getElementById('puf-total-capital-without'),
        interestRateWith: document.getElementById('puf-interest-rate-with'),
        interestRateWithout: document.getElementById('puf-interest-rate-without'),
        panelWith: document.getElementById('puf-panel-with'),
        panelWithout: document.getElementById('puf-panel-without'),
        savingsDisplayWith: document.querySelector('#puf-panel-with .puf-savings-display'),
        savingsDisplayWithout: document.querySelector('#puf-panel-without .puf-savings-display'),
    };

    const payrollCalculator = {
        m1_fijos: Array.from(document.querySelectorAll('#pc-m1-salario-base, #pc-m1-pagas-extra, #pc-m1-antiguedad, #pc-m1-plus-convenio, #pc-m1-complemento-destino, #pc-m1-complemento-polivalencia, #pc-m1-complemento-especifico, #pc-m1-complemento-actividad')),
        m1_variables: Array.from(document.querySelectorAll('#pc-m1-variable-1, #pc-m1-variable-2, #pc-m1-variable-3, #pc-m1-variable-4, #pc-m1-variable-5, #pc-m1-variable-6')),
        m1_deducciones: document.getElementById('pc-m1-deducciones'),
        
        m2_fijos: Array.from(document.querySelectorAll('#pc-m2-salario-base, #pc-m2-pagas-extra, #pc-m2-antiguedad, #pc-m2-plus-convenio, #pc-m2-complemento-destino, #pc-m2-complemento-polivalencia, #pc-m2-complemento-especifico, #pc-m2-complemento-actividad')),
        m2_variables: Array.from(document.querySelectorAll('#pc-m2-variable-1, #pc-m2-variable-2, #pc-m2-variable-3, #pc-m2-variable-4, #pc-m2-variable-5, #pc-m2-variable-6')),
        m2_deducciones: document.getElementById('pc-m2-deducciones'),
        
        m1_totalFijosBrutoDisplay: document.getElementById('pc-m1-total-fijos-bruto'),
        m2_totalFijosBrutoDisplay: document.getElementById('pc-m2-total-fijos-bruto'),
        m1_totalVariablesBrutoDisplay: document.getElementById('pc-m1-total-variables-bruto'),
        m2_totalVariablesBrutoDisplay: document.getElementById('pc-m2-total-variables-bruto'),
        m1_brutoTotalDisplay: document.getElementById('pc-m1-bruto-total'),
        m2_brutoTotalDisplay: document.getElementById('pc-m2-bruto-total'),

        resultsGrid: document.getElementById('payroll-results-grid'),
        mediaFijos: document.getElementById('pc-media-fijos'),
        mediaVariables: document.getElementById('pc-media-variables'),
        mediaTotal: document.getElementById('pc-media-total'),
    };

    const modal = {
        element: document.getElementById('amortization-modal'),
        title: document.getElementById('modal-title'),
        tableBody: document.getElementById('amortization-table-body'),
        closeButton: document.querySelector('.close-button'),
    };
    
    // --- State ---
    let loanResults = { 1: null, 2: null };
    let pufResults = { with: null, without: null };
    let slChartInstance = null;

    // --- Navigation Logic ---
    function switchCalculator(targetId) {
        calculators.forEach(calc => {
            calc.classList.toggle('hidden', calc.id !== targetId);
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.calculator === targetId);
        });
        // Show/hide reset button based on active calculator
        const resetButton = document.getElementById('global-reset-btn');
        if(resetButton) {
            resetButton.classList.toggle('hidden', targetId !== 'payroll-calculator');
        }
    }

    // --- Loan Comparator Logic ---
    function calculateLoan() {
        const commonData = {
            amount: parseFormattedAmount(loanCalculator.commonAmount.value),
            loanTermMonths: parseFormattedAmount(loanCalculator.commonTerm.value),
            openingFeePercentage: 0,
        };
        const data1 = { ...commonData, annualInterestRate: parseFormattedAmount(loanCalculator.interest1.value), openingFeePercentage: parseFormattedAmount(loanCalculator.openingFee1.value) || 0 };
        const data2 = { ...commonData, annualInterestRate: parseFormattedAmount(loanCalculator.interest2.value), openingFeePercentage: parseFormattedAmount(loanCalculator.openingFee2.value) || 0 };

        loanResults[1] = performLoanCalculation(data1);
        loanResults[2] = performLoanCalculation(data2);
        
        updateLoanUI(loanResults[1], loanResults[2]);
        updateLoanSummary(loanResults[1], loanResults[2]);
    }
    
    function performLoanCalculation({ amount, annualInterestRate, loanTermMonths, openingFeePercentage }) {
        if (isNaN(amount) || isNaN(annualInterestRate) || isNaN(loanTermMonths) || amount <= 0 || annualInterestRate < 0 || loanTermMonths <= 0) return null;

        const monthlyInterestRate = (annualInterestRate / 100) / 12;
        const monthlyPayment = monthlyInterestRate === 0 ? (loanTermMonths > 0 ? amount / loanTermMonths : 0) : (amount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths)) / (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);
        
        const totalPayment = monthlyPayment * loanTermMonths;
        const totalInterest = totalPayment - amount;
        const openingFeeAmount = amount * (openingFeePercentage / 100);

        const schedule = [];
        let remainingBalance = amount;
        for (let i = 1; i <= loanTermMonths; i++) {
            const interestForMonth = remainingBalance * monthlyInterestRate;
            const principalForMonth = monthlyPayment - interestForMonth;
            remainingBalance -= principalForMonth;
            schedule.push({ month: i, payment: monthlyPayment, principal: principalForMonth, interest: interestForMonth, balance: remainingBalance > 0 ? remainingBalance : 0 });
        }
        return { monthlyPayment, totalInterest, totalPayment, openingFeeAmount, schedule, principal: amount };
    }

    function updateLoanUI(result1, result2) {
        loanCalculator.monthlyPayment1.textContent = result1 ? formatCurrency(result1.monthlyPayment) : '0,00 €';
        loanCalculator.openingFeeAmount1.textContent = result1 ? formatCurrency(result1.openingFeeAmount) : '0,00 €';
        loanCalculator.monthlyPayment2.textContent = result2 ? formatCurrency(result2.monthlyPayment) : '0,00 €';
        loanCalculator.openingFeeAmount2.textContent = result2 ? formatCurrency(result2.openingFeeAmount) : '0,00 €';
    }

    function updateLoanSummary(result1, result2) {
        // Reset panels
        loanCalculator.panel1.classList.remove('is-winner-loan');
        loanCalculator.panel2.classList.remove('is-winner-loan');
        loanCalculator.savingsDisplay1.classList.add('hidden');
        loanCalculator.savingsDisplay2.classList.add('hidden');
        loanCalculator.savingsDisplay1.innerHTML = '';
        loanCalculator.savingsDisplay2.innerHTML = '';
    
        if (!result1 || !result2) return;
    
        // --- Calculate costs for each period ---
        const cost1_monthly = result1.monthlyPayment;
        const cost2_monthly = result2.monthlyPayment;
    
        const cost1_firstYear = (result1.monthlyPayment * 12) + result1.openingFeeAmount;
        const cost2_firstYear = (result2.monthlyPayment * 12) + result2.openingFeeAmount;
        
        const cost1_total = result1.totalPayment + result1.openingFeeAmount;
        const cost2_total = result2.totalPayment + result2.openingFeeAmount;
        
        // --- Determine winners for each metric and build HTML ---
        let savingsHTML1 = '';
        let savingsHTML2 = '';
    
        // Monthly Saving
        const monthlySaving = Math.abs(cost1_monthly - cost2_monthly);
        if (monthlySaving > 0.01) {
            const savingsItem = `
                <div class="loan-savings-item">
                    <span class="label">Ahorro Mensual</span>
                    <span class="value">${formatCurrency(monthlySaving)}</span>
                </div>`;
            if (cost1_monthly < cost2_monthly) {
                savingsHTML1 += savingsItem;
            } else {
                savingsHTML2 += savingsItem;
            }
        }
    
        // First Year Saving
        const firstYearSaving = Math.abs(cost1_firstYear - cost2_firstYear);
        if (firstYearSaving > 0.01) {
            const savingsItem = `
                <div class="loan-savings-item">
                    <span class="label">Ahorro Primer Año</span>
                    <span class="value">${formatCurrency(firstYearSaving)}</span>
                </div>`;
            if (cost1_firstYear < cost2_firstYear) {
                savingsHTML1 += savingsItem;
            } else {
                savingsHTML2 += savingsItem;
            }
        }
        
        // Total Saving & Determine Overall Winner
        const totalSaving = Math.abs(cost1_total - cost2_total);
        if (totalSaving > 0.01) {
             const savingsItem = `
                <div class="loan-savings-item">
                    <span class="label">Ahorro Total</span>
                    <span class="value">${formatCurrency(totalSaving)}</span>
                </div>`;
            if (cost1_total < cost2_total) {
                savingsHTML1 += savingsItem;
                loanCalculator.panel1.classList.add('is-winner-loan');
            } else {
                savingsHTML2 += savingsItem;
                loanCalculator.panel2.classList.add('is-winner-loan');
            }
        }
    
        // --- Update DOM ---
        if (savingsHTML1) {
            loanCalculator.savingsDisplay1.innerHTML = savingsHTML1;
            loanCalculator.savingsDisplay1.classList.remove('hidden');
        }
        if (savingsHTML2) {
            loanCalculator.savingsDisplay2.innerHTML = savingsHTML2;
            loanCalculator.savingsDisplay2.classList.remove('hidden');
        }
    }

    // --- Single Loan Calculator Logic ---
    function calculateSingleLoan() {
        const data = {
            amount: parseFormattedAmount(singleLoanCalculator.amount.value),
            annualInterestRate: parseFormattedAmount(singleLoanCalculator.interest.value),
            loanTermMonths: parseFormattedAmount(singleLoanCalculator.term.value),
            openingFeePercentage: 0
        };

        const result = performLoanCalculation(data);

        if (!result) {
            singleLoanCalculator.monthlyPayment.textContent = '-';
            singleLoanCalculator.tablePanel.classList.add('hidden');
            singleLoanCalculator.summaryPanel.classList.add('hidden');
            return;
        }

        updateSingleLoanUI(result);
        updateSingleLoanSummary(result);
        updateSingleLoanTable(result);
    }

    function updateSingleLoanUI(result) {
        singleLoanCalculator.monthlyPayment.textContent = formatCurrency(result.monthlyPayment);
    }

    function updateSingleLoanSummary(result) {
        singleLoanCalculator.summaryPanel.classList.remove('hidden');
        const totalCost = result.principal + result.totalInterest;
        
        singleLoanCalculator.summaryCapital.textContent = formatCurrency(result.principal);
        singleLoanCalculator.summaryInterest.textContent = formatCurrency(result.totalInterest);
        singleLoanCalculator.summaryTotal.textContent = formatCurrency(totalCost);
        
        createOrUpdateSlChart(result);
    }

    function createOrUpdateSlChart(result) {
        const ctx = singleLoanCalculator.chartCanvas.getContext('2d');
        const chartData = {
            labels: ['Capital', 'Intereses'],
            datasets: [{
                data: [result.principal, result.totalInterest],
                backgroundColor: [
                    '#3B82F6', // Blue for Capital
                    '#10B981'  // Green for Interests
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        };

        if (slChartInstance) {
            slChartInstance.data = chartData;
            slChartInstance.update();
        } else {
            slChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 12,
                                padding: 15,
                                font: { size: 10 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) { label += ': '; }
                                    if (context.parsed !== null) {
                                        label += formatCurrency(context.parsed);
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
    }


    function updateSingleLoanTable(result) {
        singleLoanCalculator.tablePanel.classList.remove('hidden');
        singleLoanCalculator.tableBody.innerHTML = result.schedule.map(row => `
            <tr>
                <td>${row.month}</td>
                <td>${formatCurrency(row.payment)}</td>
                <td>${formatCurrency(row.principal)}</td>
                <td>${formatCurrency(row.interest)}</td>
                <td>${formatCurrency(row.balance)}</td>
            </tr>`).join('');
    }

    // --- PUF Comparator Logic ---
    function calculatePufComparison() {
        const capital = parseFormattedAmount(pufComparator.capital.value);
        const pufAmount = parseFormattedAmount(pufComparator.pufAmount.value);
        const baseInterest = parseFormattedAmount(pufComparator.interest.value);
        const term = parseFormattedAmount(pufComparator.term.value);

        const dataWith = {
            amount: capital + pufAmount,
            annualInterestRate: baseInterest - 1,
            loanTermMonths: term,
            openingFeePercentage: 0
        };
        const dataWithout = {
            amount: capital,
            annualInterestRate: baseInterest,
            loanTermMonths: term,
            openingFeePercentage: 0
        };

        pufResults.with = performLoanCalculation(dataWith);
        pufResults.without = performLoanCalculation(dataWithout);
        
        updatePufUI(pufResults.with, pufResults.without, dataWith, dataWithout);
        updatePufSummary(pufResults.with, pufResults.without);
    }

    function updatePufUI(resultWith, resultWithout, dataWith, dataWithout) {
        pufComparator.monthlyPaymentWith.textContent = resultWith ? formatCurrency(resultWith.monthlyPayment) : '-';
        pufComparator.monthlyPaymentWithout.textContent = resultWithout ? formatCurrency(resultWithout.monthlyPayment) : '-';

        pufComparator.totalCapitalWith.textContent = formatCurrency(dataWith.amount);
        pufComparator.interestRateWith.textContent = `${dataWith.annualInterestRate.toFixed(2).replace('.',',')}%`;

        pufComparator.totalCapitalWithout.textContent = formatCurrency(dataWithout.amount);
        pufComparator.interestRateWithout.textContent = `${dataWithout.annualInterestRate.toFixed(2).replace('.',',')}%`;
    }

    function updatePufSummary(resultWith, resultWithout) {
        // Reset styles and visibility first
        pufComparator.panelWith.classList.remove('is-winner');
        pufComparator.panelWithout.classList.remove('is-winner');
        pufComparator.savingsDisplayWith.classList.add('hidden');
        pufComparator.savingsDisplayWithout.classList.add('hidden');
    
        if (!resultWith || !resultWithout) {
            return; // No results, so nothing to highlight
        }
    
        const totalCostWith = resultWith.totalPayment;
        const totalCostWithout = resultWithout.totalPayment;
    
        // Check if there's a significant difference
        if (Math.abs(totalCostWith - totalCostWithout) < 0.01) {
            return; // No clear winner
        }
    
        const monthlySaving = Math.abs(resultWith.monthlyPayment - resultWithout.monthlyPayment);
        const totalSaving = Math.abs(totalCostWith - totalCostWithout);
        
        let winnerPanel, winnerSavingsDisplay;
    
        if (totalCostWith < totalCostWithout) {
            winnerPanel = pufComparator.panelWith;
            winnerSavingsDisplay = pufComparator.savingsDisplayWith;
        } else {
            winnerPanel = pufComparator.panelWithout;
            winnerSavingsDisplay = pufComparator.savingsDisplayWithout;
        }
    
        // Apply winner styles and show savings
        winnerPanel.classList.add('is-winner');
        
        const monthlySavingsEl = winnerSavingsDisplay.querySelector('[data-savings-type="monthly"]');
        const totalSavingsEl = winnerSavingsDisplay.querySelector('[data-savings-type="total"]');
    
        if(monthlySavingsEl) monthlySavingsEl.textContent = formatCurrency(monthlySaving);
        if(totalSavingsEl) totalSavingsEl.textContent = formatCurrency(totalSaving);
        
        winnerSavingsDisplay.classList.remove('hidden');
    }

    // --- Payroll Calculator Logic ---
    function calculatePayroll() {
        const getSum = (elements) => elements.reduce((sum, el) => sum + parsePayrollAmount(el.value), 0);

        const m1_totalFijosBruto = getSum(payrollCalculator.m1_fijos);
        const m1_totalVariablesBruto = getSum(payrollCalculator.m1_variables);
        const m1_brutoTotal = m1_totalFijosBruto + m1_totalVariablesBruto;
        const m1_deducciones = parsePayrollAmount(payrollCalculator.m1_deducciones.value);
        const m1_liquidoNomina = m1_brutoTotal - m1_deducciones;
        const m1_fijosNetos = m1_brutoTotal > 0 ? m1_liquidoNomina * (m1_totalFijosBruto / m1_brutoTotal) : 0;
        const m1_variablesNetos = m1_brutoTotal > 0 ? m1_liquidoNomina * (m1_totalVariablesBruto / m1_brutoTotal) : 0;

        const m2_totalFijosBruto = getSum(payrollCalculator.m2_fijos);
        const m2_totalVariablesBruto = getSum(payrollCalculator.m2_variables);
        const m2_brutoTotal = m2_totalFijosBruto + m2_totalVariablesBruto;
        const m2_deducciones = parsePayrollAmount(payrollCalculator.m2_deducciones.value);
        const m2_liquidoNomina = m2_brutoTotal - m2_deducciones;
        const m2_fijosNetos = m2_brutoTotal > 0 ? m2_liquidoNomina * (m2_totalFijosBruto / m2_brutoTotal) : 0;
        const m2_variablesNetos = m2_brutoTotal > 0 ? m2_liquidoNomina * (m2_totalVariablesBruto / m2_brutoTotal) : 0;

        const mediaIngresosFijos = (m1_fijosNetos + m2_fijosNetos) / 2;
        const mediaIngresosVariables = (m1_variablesNetos + m2_variablesNetos) / 2;
        const mediaTotal = mediaIngresosFijos + mediaIngresosVariables;
        
        const results = {
            m1: { totalFijosBruto: m1_totalFijosBruto, totalVariablesBruto: m1_totalVariablesBruto, brutoTotal: m1_brutoTotal, deducciones: m1_deducciones, liquidoNomina: m1_liquidoNomina, fijosNetos: m1_fijosNetos, variablesNetos: m1_variablesNetos },
            m2: { totalFijosBruto: m2_totalFijosBruto, totalVariablesBruto: m2_totalVariablesBruto, brutoTotal: m2_brutoTotal, deducciones: m2_deducciones, liquidoNomina: m2_liquidoNomina, fijosNetos: m2_fijosNetos, variablesNetos: m2_variablesNetos },
            avg: { fijos: mediaIngresosFijos, variables: mediaIngresosVariables, total: mediaTotal }
        };

        updatePayrollUI(results);
    }

    function updatePayrollUI(results) {
        payrollCalculator.m1_totalFijosBrutoDisplay.textContent = formatPayrollResultValue(results.m1.totalFijosBruto);
        payrollCalculator.m2_totalFijosBrutoDisplay.textContent = formatPayrollResultValue(results.m2.totalFijosBruto);
        payrollCalculator.m1_totalVariablesBrutoDisplay.textContent = formatPayrollResultValue(results.m1.totalVariablesBruto);
        payrollCalculator.m2_totalVariablesBrutoDisplay.textContent = formatPayrollResultValue(results.m2.totalVariablesBruto);
        payrollCalculator.m1_brutoTotalDisplay.textContent = formatPayrollResultValue(results.m1.brutoTotal);
        payrollCalculator.m2_brutoTotalDisplay.textContent = formatPayrollResultValue(results.m2.brutoTotal);

        const gridContent = `
            <div class="payroll-grid-row highlight payroll-special-total">
                <span class="concept-highlight">LIQUIDO NOMINA</span>
                <span class="concept-highlight">${formatPayrollResultValue(results.m1.liquidoNomina)}</span>
                <span class="concept-highlight">${formatPayrollResultValue(results.m2.liquidoNomina)}</span>
            </div>
        `;
        
        payrollCalculator.resultsGrid.innerHTML = gridContent;
        payrollCalculator.mediaFijos.textContent = formatIntegerCurrency(results.avg.fijos);
        payrollCalculator.mediaVariables.textContent = formatIntegerCurrency(results.avg.variables);
        payrollCalculator.mediaTotal.textContent = formatIntegerCurrency(results.avg.total);
    }

    function resetPayrollCalculator() {
        const allPayrollInputs = [
            ...payrollCalculator.m1_fijos,
            ...payrollCalculator.m1_variables,
            payrollCalculator.m1_deducciones,
            ...payrollCalculator.m2_fijos,
            ...payrollCalculator.m2_variables,
            payrollCalculator.m2_deducciones,
        ];
    
        allPayrollInputs.forEach(input => {
            if (input) {
                input.value = '0';
            }
        });
    
        // Recalculate everything with zeros to update totals
        calculatePayroll();
        
        // After calculating, set the input fields' display value to a hyphen for a cleaner UI
        // The focus handler will correctly interpret this as '0,00' for editing
        allPayrollInputs.forEach(input => {
            if (input) {
                input.value = '-';
            }
        });
    }

    // --- Modal Logic ---
    function populateAndShowModal(loanNumber) {
        const result = loanResults[loanNumber];
        if (!result || !result.schedule) return;
        modal.title.textContent = `Cuadro de Amortización - Préstamo ${loanNumber}`;
        modal.tableBody.innerHTML = result.schedule.map(row => `
            <tr>
                <td>${row.month}</td>
                <td>${formatCurrency(row.payment)}</td>
                <td>${formatCurrency(row.principal)}</td>
                <td>${formatCurrency(row.interest)}</td>
                <td>${formatCurrency(row.balance)}</td>
            </tr>`).join('');
        modal.element.style.display = 'block';
    }
    function closeModal() { modal.element.style.display = 'none'; }
    
    // --- Event Listeners Setup ---
    function init() {
        // Navigation
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchCalculator(e.currentTarget.dataset.calculator);
            });
        });

        // Loan Comparator Calculator
        const loanComparatorInputs = [loanCalculator.commonAmount, loanCalculator.commonTerm, loanCalculator.interest1, loanCalculator.openingFee1, loanCalculator.interest2, loanCalculator.openingFee2];
        loanComparatorInputs.forEach(input => {
            if(input) input.addEventListener('input', calculateLoan);
        });
        loanCalculator.commonAmount.addEventListener('input', (e) => e.target.value = formatAmount(e.target.value));
        loanCalculator.amortizationButtons.forEach(button => button.addEventListener('click', (e) => populateAndShowModal(e.target.dataset.loan)));
        
        // Single Loan Calculator
        const singleLoanInputs = [singleLoanCalculator.amount, singleLoanCalculator.interest, singleLoanCalculator.term];
        singleLoanInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', calculateSingleLoan);
            }
        });
        singleLoanCalculator.amount.addEventListener('input', (e) => e.target.value = formatAmount(e.target.value));
        
        // PUF Comparator
        const pufInputs = [pufComparator.capital, pufComparator.pufAmount, pufComparator.interest, pufComparator.term];
        pufInputs.forEach(input => {
            if (input) input.addEventListener('input', calculatePufComparison);
        });
        pufComparator.capital.addEventListener('input', (e) => e.target.value = formatAmount(e.target.value));
        pufComparator.pufAmount.addEventListener('input', (e) => e.target.value = formatAmount(e.target.value));

        // Payroll Calculator
        const payrollM1Inputs = Array.from(document.querySelectorAll('#payroll-calculator input[id^="pc-m1-"]'));
        const payrollM2Inputs = Array.from(document.querySelectorAll('#payroll-calculator input[id^="pc-m2-"]'));
        const payrollInputsArray = [...payrollM1Inputs, ...payrollM2Inputs];

        payrollInputsArray.forEach(input => {
            // Initial formatting to show hyphen for zero values
            const initialValue = parsePayrollAmount(input.value);
            if (initialValue === 0) {
                input.value = '-';
            } else {
                input.value = formatIntegerCurrency(initialValue);
            }

            // Format on blur to show hyphen for zero
            input.addEventListener('blur', (e) => {
                const value = parsePayrollAmount(e.target.value);
                if (value === 0) {
                    e.target.value = '-';
                } else {
                    e.target.value = formatIntegerCurrency(value);
                }
                calculatePayroll();
            });

            // Un-format on focus for easier editing, handling the hyphen
            input.addEventListener('focus', (e) => {
                const isHyphen = e.target.value.trim() === '-';
                const value = isHyphen ? 0 : parsePayrollAmount(e.target.value);
                e.target.value = value.toString();
                e.target.select();
            });

            input.addEventListener('input', calculatePayroll);

            // Custom Tab behavior
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const currentIndex = payrollInputsArray.indexOf(e.target);
                    const nextIndex = e.shiftKey
                        ? (currentIndex > 0 ? currentIndex - 1 : payrollInputsArray.length - 1)
                        : (currentIndex < payrollInputsArray.length - 1 ? currentIndex + 1 : 0);
                    
                    payrollInputsArray[nextIndex].focus();
                }
            });
        });

        // Global Print Button
        const globalPrintButton = document.getElementById('global-print-btn');
        if (globalPrintButton) {
            globalPrintButton.addEventListener('click', () => {
                window.print();
            });
        }
        
        // Global Reset Button
        const globalResetButton = document.getElementById('global-reset-btn');
        if (globalResetButton) {
            globalResetButton.addEventListener('click', resetPayrollCalculator);
        }

        // Modal
        modal.closeButton.addEventListener('click', closeModal);
        window.addEventListener('click', (e) => { if (e.target === modal.element) closeModal(); });

        // --- Initial Calculations ---
        calculateLoan();
        calculateSingleLoan();
        calculatePufComparison();
        calculatePayroll();
    }

    init();
});