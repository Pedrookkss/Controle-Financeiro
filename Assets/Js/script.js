document.addEventListener('DOMContentLoaded', () => {
    const elementos = {
        entradas: {
            table: document.querySelector('#entradas-table tbody'),
            form: document.getElementById('add-entrada-form'),
            descricao: document.getElementById('entrada-descricao'),
            valor: document.getElementById('entrada-valor')
        },
        gastos: {
            table: document.querySelector('#gastos-fixos-table tbody'),
            form: document.getElementById('add-gasto-form'),
            nome: document.getElementById('gasto-nome'),
            categoria: document.getElementById('gasto-categoria'),
            pagamento: document.getElementById('gasto-pagamento'),
            valor: document.getElementById('gasto-valor')
        },
        investimentos: {
            table: document.querySelector('#investimentos-table tbody'),
            form: document.getElementById('add-investimento-form'),
            nome: document.getElementById('investimento-nome'),
            tipo: document.getElementById('investimento-tipo'),
            valor: document.getElementById('investimento-valor')
        },
        opcoes: {
            form: document.getElementById('add-option-form'),
            tipo: document.getElementById('option-type'),
            valor: document.getElementById('option-value'),
            lista: document.getElementById('custom-options-list')
        },
        graficos: {
            principal: new Chart(document.getElementById('pie-chart').getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Entradas', 'Gastos', 'Investimentos', 'Total Pago'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: ['#4CAF50', '#F44336', '#FF9800', '#9C27B0']
                    }]
                },
                options: {
                    plugins: {
                        title: { display: true, text: 'Entradas x Saídas' }
                    }
                }
            }),
            investimentos: null,
            gastosCategoria: null
        },
        saldo: document.getElementById('saldo'),
        entradasTotais: document.getElementById('entradas-totais'),
        gastosTotais: document.getElementById('gastos-totais'),
        investimentosTotais: document.getElementById('investimentos-totais'),
        totalPago: document.getElementById('total-pago'),
        mesSeletor: document.getElementById('mes-seletor')
    };

    let dados = JSON.parse(localStorage.getItem('controleFinanceiro')) || {};
    let entradasTotais = 0;
    let gastosTotais = 0;
    let investimentosTotais = 0;
    let totalPago = 0;

    function salvarDados() {
        localStorage.setItem('controleFinanceiro', JSON.stringify(dados));
    }

    function calcularTotalPago(mes) {
        totalPago = dados[mes].gastos.reduce((total, gasto) => total + (gasto.pago ? gasto.valor : 0), 0);
        elementos.totalPago.textContent = `R$ ${totalPago.toFixed(2).replace('.', ',')}`;
        return totalPago;
    }

    function carregarMes(mes) {
        if (!dados[mes]) dados[mes] = { entradas: [], gastos: [], investimentos: [] };

        // Calcula o total pago (gastos marcados como pagos)
        totalPago = calcularTotalPago(mes);

        // Calcula entradas totais (entradas - gastos pagos)
        entradasTotais = dados[mes].entradas.reduce((total, entrada) => total + entrada.valor, 0) - totalPago;

        // Calcula gastos totais (gastos totais - gastos pagos)
        gastosTotais = dados[mes].gastos.reduce((total, gasto) => total + gasto.valor, 0) - totalPago;

        // Calcula investimentos totais (apenas os investidos)
        investimentosTotais = dados[mes].investimentos.reduce((total, inv) => total + (inv.investido ? inv.valor : 0), 0);

        // Limpa e recarrega as tabelas
        elementos.entradas.table.innerHTML = '';
        dados[mes].entradas.forEach((entrada, index) => {
            adicionarEntrada(entrada.descricao, entrada.valor, index, false);
        });

        elementos.gastos.table.innerHTML = '';
        dados[mes].gastos.forEach((gasto, index) => {
            adicionarGasto(gasto.nome, gasto.categoria, gasto.pagamento, gasto.valor, gasto.pago, index, false);
        });

        elementos.investimentos.table.innerHTML = '';
        dados[mes].investimentos.forEach((investimento, index) => {
            adicionarInvestimento(investimento.nome, investimento.tipo, investimento.valor, investimento.investido, index, false);
        });

        // Atualiza o saldo
        atualizarSaldo();
        atualizarGraficos();
    }

    function atualizarSaldo() {
        const saldo = entradasTotais - (gastosTotais + investimentosTotais);
        elementos.saldo.textContent = `R$ ${saldo.toFixed(2).replace('.', ',')}`;
        elementos.entradasTotais.textContent = `R$ ${entradasTotais.toFixed(2).replace('.', ',')}`;
        elementos.gastosTotais.textContent = `R$ ${gastosTotais.toFixed(2).replace('.', ',')}`;
        elementos.investimentosTotais.textContent = `R$ ${investimentosTotais.toFixed(2).replace('.', ',')}`;
        elementos.totalPago.textContent = `R$ ${totalPago.toFixed(2).replace('.', ',')}`; // Exibe o total pago
        atualizarGraficos();
    }

    function atualizarSaldo() {
        const saldo = entradasTotais - (gastosTotais + investimentosTotais);
        elementos.saldo.textContent = `R$ ${saldo.toFixed(2).replace('.', ',')}`;
        elementos.entradasTotais.textContent = `R$ ${entradasTotais.toFixed(2).replace('.', ',')}`;
        elementos.gastosTotais.textContent = `R$ ${gastosTotais.toFixed(2).replace('.', ',')}`;
        elementos.investimentosTotais.textContent = `R$ ${investimentosTotais.toFixed(2).replace('.', ',')}`;
        elementos.totalPago.textContent = `R$ ${totalPago.toFixed(2).replace('.', ',')}`; // Exibe o total pago
        atualizarGraficos();
    }

    function atualizarGraficos() {
        elementos.graficos.principal.data.datasets[0].data = [entradasTotais, gastosTotais, investimentosTotais, totalPago];
        elementos.graficos.principal.update();

        const tiposInvestimentos = {};
        dados[elementos.mesSeletor.value]?.investimentos.forEach(inv => {
            if (inv.investido) {
                tiposInvestimentos[inv.tipo] = (tiposInvestimentos[inv.tipo] || 0) + inv.valor;
            }
        });

        if (elementos.graficos.investimentos) elementos.graficos.investimentos.destroy();

        elementos.graficos.investimentos = new Chart(document.getElementById('investimentos-chart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(tiposInvestimentos),
                datasets: [{
                    data: Object.values(tiposInvestimentos),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
                }]
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Distribuição de Investimentos' }
                }
            }
        });

        const categoriasGastos = {};
        dados[elementos.mesSeletor.value]?.gastos.forEach(gasto => {
            // Agora inclui todos os gastos, independentemente de estarem pagos ou não
            categoriasGastos[gasto.categoria] = (categoriasGastos[gasto.categoria] || 0) + gasto.valor;
        });

        if (elementos.graficos.gastosCategoria) elementos.graficos.gastosCategoria.destroy();

        elementos.graficos.gastosCategoria = new Chart(document.getElementById('gastos-categoria-chart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoriasGastos),
                datasets: [{
                    data: Object.values(categoriasGastos),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
                }]
            },
            options: {
                plugins: {
                    title: { display: true, text: 'Gastos por Categoria' }
                }
            }
        });
    }

    function atualizarSaldo() {
        const saldo = entradasTotais - (gastosTotais + investimentosTotais);
        elementos.saldo.textContent = `R$ ${saldo.toFixed(2).replace('.', ',')}`;
        elementos.entradasTotais.textContent = `R$ ${entradasTotais.toFixed(2).replace('.', ',')}`;
        elementos.gastosTotais.textContent = `R$ ${gastosTotais.toFixed(2).replace('.', ',')}`;
        elementos.investimentosTotais.textContent = `R$ ${investimentosTotais.toFixed(2).replace('.', ',')}`;
        atualizarGraficos();
    }

    function adicionarEntrada(descricao, valor, index, salvar = true) {
        const mes = elementos.mesSeletor.value;
        const row = document.createElement('tr');
        row.dataset.index = index;

        row.innerHTML = `
            <td class="editable-cell" contenteditable="true">${descricao}</td>
            <td class="editable-cell" contenteditable="true">R$ ${valor.toFixed(2).replace('.', ',')}</td>
            <td><button class="excluir">Excluir</button></td>
        `;

        row.cells[0].addEventListener('blur', () => {
            dados[mes].entradas[index].descricao = row.cells[0].textContent;
            salvarDados();
        });

        row.cells[1].addEventListener('blur', () => {
            const novoValor = parseFloat(row.cells[1].textContent
                .replace('R$ ', '')
                .replace(',', '.'));
            if (!isNaN(novoValor)) {
                entradasTotais -= dados[mes].entradas[index].valor;
                dados[mes].entradas[index].valor = novoValor;
                entradasTotais += novoValor;
                row.cells[1].textContent = `R$ ${novoValor.toFixed(2).replace('.', ',')}`;
                salvarDados();
                atualizarSaldo();
            }
        });

        row.querySelector('.excluir').addEventListener('click', () => {
            entradasTotais -= dados[mes].entradas[index].valor;
            dados[mes].entradas.splice(index, 1);
            row.remove();
            salvarDados();
            atualizarSaldo();
        });

        elementos.entradas.table.appendChild(row);
        if (salvar) {
            dados[mes].entradas.push({ descricao, valor });
            entradasTotais += valor;
            salvarDados();
        }
        atualizarSaldo();
    }

    function adicionarGasto(nome, categoria, pagamento, valor, pago = false, index, salvar = true) {
        const mes = elementos.mesSeletor.value;
        const row = document.createElement('tr');
        row.dataset.index = index;

        row.innerHTML = `
            <td class="editable-cell" contenteditable="true">${nome}</td>
            <td class="editable-cell" contenteditable="true">${categoria}</td>
            <td class="editable-cell" contenteditable="true">${pagamento}</td>
            <td class="editable-cell" contenteditable="true">R$ ${valor.toFixed(2).replace('.', ',')}</td>
            <td><input type="checkbox" ${pago ? 'checked' : ''}></td>
            <td><button class="excluir">Excluir</button></td>
        `;

        row.cells[0].addEventListener('blur', () => {
            dados[mes].gastos[index].nome = row.cells[0].textContent;
            salvarDados();
        });

        row.cells[1].addEventListener('blur', () => {
            dados[mes].gastos[index].categoria = row.cells[1].textContent;
            salvarDados();
        });

        row.cells[2].addEventListener('blur', () => {
            dados[mes].gastos[index].pagamento = row.cells[2].textContent;
            salvarDados();
        });

        row.cells[3].addEventListener('blur', () => {
            const novoValor = parseFloat(row.cells[3].textContent
                .replace('R$ ', '')
                .replace(',', '.'));
            if (!isNaN(novoValor)) {
                const gasto = dados[mes].gastos[index];
                const valorAntigo = gasto.valor;

                if (gasto.pago) {
                    entradasTotais += valorAntigo; // Remove o valor antigo das entradas
                    entradasTotais -= novoValor; // Adiciona o novo valor às entradas
                } else {
                    gastosTotais -= valorAntigo;
                    gastosTotais += novoValor;
                }

                gasto.valor = novoValor;
                row.cells[3].textContent = `R$ ${novoValor.toFixed(2).replace('.', ',')}`;
                salvarDados();
                atualizarSaldo();
            }
        });

        row.querySelector('input').addEventListener('change', (e) => {
            const gasto = dados[mes].gastos[index];
            if (e.target.checked) {
                gastosTotais -= gasto.valor;
                entradasTotais -= gasto.valor;
                totalPago += gasto.valor;
            } else {
                gastosTotais += gasto.valor;
                entradasTotais += gasto.valor;
                totalPago -= gasto.valor;
            }
            gasto.pago = e.target.checked;
            salvarDados();
            calcularTotalPago(mes);
            atualizarSaldo();
        });

        row.querySelector('.excluir').addEventListener('click', () => {
            const gasto = dados[mes].gastos[index];
            if (gasto.pago) {
                entradasTotais += gasto.valor;
                totalPago -= gasto.valor;
            } else {
                gastosTotais -= gasto.valor;
            }
            dados[mes].gastos.splice(index, 1);
            row.remove();
            salvarDados();
            calcularTotalPago(mes);
            atualizarSaldo();
        });

        elementos.gastos.table.appendChild(row);
        if (salvar) {
            dados[mes].gastos.push({ nome, categoria, pagamento, valor, pago });
            if (!pago) {
                gastosTotais += valor;
            } else {
                entradasTotais -= valor;
                totalPago += valor;
            }
            salvarDados();
            calcularTotalPago(mes);
        }
        atualizarSaldo();
    }

    function adicionarInvestimento(nome, tipo, valor, investido = false, index, salvar = true) {
        const mes = elementos.mesSeletor.value;
        const row = document.createElement('tr');
        row.dataset.index = index;

        row.innerHTML = `
            <td class="editable-cell" contenteditable="true">${nome}</td>
            <td class="editable-cell" contenteditable="true">${tipo}</td>
            <td class="editable-cell" contenteditable="true">R$ ${valor.toFixed(2).replace('.', ',')}</td>
            <td><input type="checkbox" ${investido ? 'checked' : ''}></td>
            <td><button class="excluir">Excluir</button></td>
        `;

        row.cells[0].addEventListener('blur', () => {
            dados[mes].investimentos[index].nome = row.cells[0].textContent;
            salvarDados();
        });

        row.cells[1].addEventListener('blur', () => {
            dados[mes].investimentos[index].tipo = row.cells[1].textContent;
            salvarDados();
            atualizarGraficos();
        });

        row.cells[2].addEventListener('blur', () => {
            const novoValor = parseFloat(row.cells[2].textContent
                .replace('R$ ', '')
                .replace(',', '.'));
            if (!isNaN(novoValor)) {
                const investimento = dados[mes].investimentos[index];
                const valorAntigo = investimento.valor;

                if (investimento.investido) {
                    investimentosTotais -= valorAntigo;
                    investimentosTotais += novoValor;
                }

                investimento.valor = novoValor;
                row.cells[2].textContent = `R$ ${novoValor.toFixed(2).replace('.', ',')}`;
                salvarDados();
                atualizarSaldo();
            }
        });

        row.querySelector('input').addEventListener('change', (e) => {
            const investimento = dados[mes].investimentos[index];
            if (e.target.checked) {
                investimentosTotais += investimento.valor;
            } else {
                investimentosTotais -= investimento.valor;
            }
            investimento.investido = e.target.checked;
            salvarDados();
            atualizarSaldo();
        });

        row.querySelector('.excluir').addEventListener('click', () => {
            const investimento = dados[mes].investimentos[index];
            if (investimento.investido) {
                investimentosTotais -= investimento.valor;
            }
            dados[mes].investimentos.splice(index, 1);
            row.remove();
            salvarDados();
            atualizarSaldo();
        });

        elementos.investimentos.table.appendChild(row);
        if (salvar) {
            dados[mes].investimentos.push({ nome, tipo, valor, investido });
            if (investido) investimentosTotais += valor;
            salvarDados();
        }
        atualizarSaldo();
    }

    function adicionarOpcaoPersonalizada(tipo, valor) {
        const item = document.createElement('div');
        item.className = 'option-item';
        item.innerHTML = `
            <span>${tipo}: ${valor}</span>
            <button class="excluir-opcao">Excluir</button>
        `;

        item.querySelector('.excluir-opcao').addEventListener('click', () => {
            const chave = `opcoes_${tipo}`;
            const opcoesSalvas = JSON.parse(localStorage.getItem(chave)) || [];
            const index = opcoesSalvas.indexOf(valor);

            if (index !== -1) {
                opcoesSalvas.splice(index, 1);
                localStorage.setItem(chave, JSON.stringify(opcoesSalvas));

                let select;
                switch (tipo) {
                    case 'categoria':
                        select = elementos.gastos.categoria;
                        break;
                    case 'pagamento':
                        select = elementos.gastos.pagamento;
                        break;
                    case 'investimento':
                        select = elementos.investimentos.tipo;
                        break;
                }

                const optionToRemove = Array.from(select.options)
                    .find(option => option.value === valor);
                if (optionToRemove) select.remove(optionToRemove.options.indexOf(optionToRemove));
            }
            item.remove();
        });

        elementos.opcoes.lista.appendChild(item);
    }

    function carregarTodasOpcoesSalvas() {
        const tipos = ['categoria', 'pagamento', 'investimento'];

        tipos.forEach(tipo => {
            const chave = `opcoes_${tipo}`;
            const opcoesSalvas = JSON.parse(localStorage.getItem(chave)) || [];

            opcoesSalvas.forEach(opcao => {
                let select;
                switch (tipo) {
                    case 'categoria':
                        select = elementos.gastos.categoria;
                        break;
                    case 'pagamento':
                        select = elementos.gastos.pagamento;
                        break;
                    case 'investimento':
                        select = elementos.investimentos.tipo;
                        break;
                }

                if (!Array.from(select.options).some(option => option.value === opcao)) {
                    select.add(new Option(opcao, opcao));
                }
            });
        });
    }

    function carregarOpcoesSalvas() {
        const tipoSelecionado = elementos.opcoes.tipo.value;
        const chave = `opcoes_${tipoSelecionado}`;
        const opcoes = JSON.parse(localStorage.getItem(chave)) || [];

        elementos.opcoes.lista.innerHTML = '';
        opcoes.forEach(opcao => {
            adicionarOpcaoPersonalizada(tipoSelecionado, opcao);
        });
    }

    elementos.opcoes.tipo.addEventListener('change', () => {
        carregarOpcoesSalvas();
    });

    elementos.mesSeletor.addEventListener('change', () => {
        carregarMes(elementos.mesSeletor.value);
    });

    elementos.entradas.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const index = dados[elementos.mesSeletor.value].entradas.length;
        adicionarEntrada(
            elementos.entradas.descricao.value,
            parseFloat(elementos.entradas.valor.value.replace(',', '.')),
            index
        );
        e.target.reset();
    });

    elementos.gastos.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const index = dados[elementos.mesSeletor.value].gastos.length;
        adicionarGasto(
            elementos.gastos.nome.value,
            elementos.gastos.categoria.value,
            elementos.gastos.pagamento.value,
            parseFloat(elementos.gastos.valor.value.replace(',', '.')),
            false,
            index
        );
        e.target.reset();
    });

    elementos.investimentos.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const index = dados[elementos.mesSeletor.value].investimentos.length;
        adicionarInvestimento(
            elementos.investimentos.nome.value,
            elementos.investimentos.tipo.value,
            parseFloat(elementos.investimentos.valor.value.replace(',', '.')),
            false,
            index
        );
        e.target.reset();
    });

    elementos.opcoes.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const tipo = elementos.opcoes.tipo.value;
        const valor = elementos.opcoes.valor.value.trim();

        if (!valor) return;

        let select;
        switch (tipo) {
            case 'categoria':
                select = elementos.gastos.categoria;
                break;
            case 'pagamento':
                select = elementos.gastos.pagamento;
                break;
            case 'investimento':
                select = elementos.investimentos.tipo;
                break;
            default:
                return;
        }

        const existe = Array.from(select.options).some(option =>
            option.value.toLowerCase() === valor.toLowerCase()
        );

        if (!existe) {
            const option = new Option(valor, valor);
            select.add(option);

            const chave = `opcoes_${tipo}`;
            const opcoesSalvas = JSON.parse(localStorage.getItem(chave)) || [];
            opcoesSalvas.push(valor);
            localStorage.setItem(chave, JSON.stringify(opcoesSalvas));

            adicionarOpcaoPersonalizada(tipo, valor);
        }

        elementos.opcoes.valor.value = '';
    });

    carregarTodasOpcoesSalvas();
    carregarOpcoesSalvas();
    carregarMes(elementos.mesSeletor.value);
});