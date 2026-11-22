/* ===== CONFIGURAÇÕES GERAIS ===== */

const CHAVES = {
    clientes: 'obralink:clientes',
    obras: 'obralink:obras',
    precos: 'obralink:media-precos',
    status: 'obralink:status',
    orcamentos: 'obralink:orcamentos'
};

function carregarDados(chave) {
    try {
        return JSON.parse(localStorage.getItem(chave)) || [];
    } catch {
        return [];
    }
}

function salvarDados(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatarData(data) {
    if (!data) return 'Não informado';

    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
}

/* ===== NAVEGAÇÃO ===== */

(function () {
    const arquivo = location.pathname.split('/').pop();

    document.querySelectorAll('nav .link').forEach(link => {
        const destino = link.getAttribute('href').split('/').pop();

        if (destino === arquivo) {
            link.setAttribute('aria-current', 'page');
        }
    });
})();

/* ===== CALCULADORA ===== */

const campo = document.getElementById('meuInput');
let mostrandoResultado = false;
const OPERADORES = '+-×÷';

function ehOperador(caractere) {
    return OPERADORES.includes(caractere);
}

function adicionarCaractere(caractere) {
    if (!campo) return;

    let valor = campo.value;

    if (valor === 'Erro') valor = '';

    if (mostrandoResultado) {
        if (!ehOperador(caractere)) valor = '';
        mostrandoResultado = false;
    }

    const ultimo = valor.slice(-1);

    if (ehOperador(caractere)) {
        if (!valor && caractere !== '-') return;

        if (ehOperador(ultimo)) {
            if (caractere === '-' && (ultimo === '×' || ultimo === '÷')) {
                campo.value = valor + caractere;
                return;
            }

            campo.value = valor.slice(0, -1) + caractere;
            return;
        }

        campo.value = valor + caractere;
        return;
    }

    if (caractere === ',') {
        const numeros = valor.split(/[+\-×÷]/);
        const atual = numeros[numeros.length - 1];

        if (atual.includes(',')) return;

        campo.value = valor + (atual === '' ? '0,' : ',');
        return;
    }

    campo.value = valor + caractere;
}

function limpar() {
    if (!campo) return;

    campo.value = '';
    mostrandoResultado = false;
}

function apagar() {
    if (!campo) return;

    if (mostrandoResultado || campo.value === 'Erro') {
        limpar();
        return;
    }

    campo.value = campo.value.slice(0, -1);
}

function avaliar(expressao) {
    const numeros = [];
    let numero = '';

    for (let i = 0; i < expressao.length; i++) {
        const caractere = expressao[i];

        if (/[0-9,]/.test(caractere)) {
            numero += caractere === ',' ? '.' : caractere;
        } else if (
            caractere === '-' &&
            numero === '' &&
            (numeros.length === 0 || ehOperador(numeros[numeros.length - 1]))
        ) {
            numero = '-';
        } else {
            if (numero !== '' && numero !== '-') {
                numeros.push(parseFloat(numero));
                numero = '';
            }

            numeros.push(caractere);
        }
    }

    if (numero !== '' && numero !== '-') {
        numeros.push(parseFloat(numero));
    }

    if (!numeros.length || typeof numeros[0] !== 'number') {
        throw new Error('Expressão inválida');
    }

    const resultado = [numeros[0]];

    for (let i = 1; i < numeros.length; i += 2) {
        const operador = numeros[i];
        const proximo = numeros[i + 1];

        if (typeof proximo !== 'number' || !Number.isFinite(proximo)) {
            throw new Error('Expressão inválida');
        }

        if (operador === '×') {
            resultado[resultado.length - 1] *= proximo;
        } else if (operador === '÷') {
            if (proximo === 0) throw new Error('Divisão por zero');

            resultado[resultado.length - 1] /= proximo;
        } else {
            resultado.push(operador, proximo);
        }
    }

    let total = resultado[0];

    for (let i = 1; i < resultado.length; i += 2) {
        total = resultado[i] === '+'
            ? total + resultado[i + 1]
            : total - resultado[i + 1];
    }

    return total;
}

function calcular() {
    if (!campo || !campo.value) return;

    let expressao = campo.value;

    while (ehOperador(expressao.slice(-1)) || expressao.slice(-1) === ',') {
        expressao = expressao.slice(0, -1);
    }

    try {
        const resultado = avaliar(expressao);

        if (!Number.isFinite(resultado)) throw new Error();

        campo.value = String(Number(resultado.toFixed(10))).replace('.', ',');
        mostrandoResultado = true;
    } catch {
        campo.value = 'Erro';
        mostrandoResultado = true;
    }
}

/* ===== TECLADO DA CALCULADORA ===== */

document.addEventListener('keydown', function (evento) {
    if (!campo || evento.ctrlKey || evento.metaKey || evento.altKey) return;

    // não captura o teclado enquanto o usuário usa o orçamento (campos e botões)
    if (evento.target.closest && evento.target.closest('.orcamento, .orcamentos-salvos')) return;

    const tecla = evento.key;

    if (/^[0-9]$/.test(tecla)) adicionarCaractere(tecla);
    else if (tecla === ',' || tecla === '.') adicionarCaractere(',');
    else if (tecla === '+' || tecla === '-') adicionarCaractere(tecla);
    else if (tecla === '*' || tecla.toLowerCase() === 'x') adicionarCaractere('×');
    else if (tecla === '/') adicionarCaractere('÷');
    else if (tecla === 'Enter' || tecla === '=') calcular();
    else if (tecla === 'Backspace') apagar();
    else if (tecla === 'Escape') limpar();
    else return;

    evento.preventDefault();
});

/* ===== MÉDIA DE PREÇOS ===== */

(function () {
    const formulario = document.getElementById('formPreco');
    if (!formulario) return;

    const lista = document.getElementById('listaPrecos');
    const resumo = document.getElementById('resumo');

    let precos = carregarDados(CHAVES.precos);
    let indiceEdicao = null;

    function desenharPrecos() {
        lista.replaceChildren();

        if (!precos.length) {
            lista.innerHTML = '<tr><td colspan="5" class="vazio">Nenhum serviço cadastrado.</td></tr>';
        }

        precos.forEach((item, indice) => {
            const linha = document.createElement('tr');

            const nome = document.createElement('td');
            nome.textContent = item.nome;

            const unidade = document.createElement('td');
            unidade.textContent = item.unidade;

            const valor = document.createElement('td');
            valor.textContent = formatarMoeda(item.preco);

            const media = precos
                .filter(p => p.nome.toLowerCase() === item.nome.toLowerCase())
                .reduce((total, p) => total + p.preco, 0);

            const mediaCelula = document.createElement('td');
            mediaCelula.textContent = formatarMoeda(
                media / precos.filter(p => p.nome.toLowerCase() === item.nome.toLowerCase()).length
            );

            const acoes = document.createElement('td');

            const editar = document.createElement('button');
            editar.type = 'button';
            editar.className = 'btn';
            editar.textContent = 'Editar';

            editar.addEventListener('click', () => {
                document.getElementById('itemNome').value = item.nome;
                document.getElementById('itemUnidade').value = item.unidade;
                document.getElementById('itemPreco').value = item.preco;

                indiceEdicao = indice;
                document.getElementById('itemNome').focus();
            });

            const remover = document.createElement('button');
            remover.type = 'button';
            remover.className = 'btn-remover';
            remover.textContent = 'Remover';

            remover.addEventListener('click', () => {
                if (!confirm('Deseja remover este serviço?')) return;

                precos.splice(indice, 1);
                salvarDados(CHAVES.precos, precos);
                desenharPrecos();
            });

            acoes.append(editar, remover);
            linha.append(nome, unidade, valor, mediaCelula, acoes);
            lista.appendChild(linha);
        });

        if (resumo) {
            resumo.textContent = precos.length + (
                precos.length === 1 ? ' serviço cadastrado' : ' serviços cadastrados'
            );
        }
    }

    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();

        const nome = document.getElementById('itemNome').value.trim();
        const unidade = document.getElementById('itemUnidade').value;
        const preco = Number(document.getElementById('itemPreco').value);

        if (!nome || !unidade || !Number.isFinite(preco) || preco < 0) {
            alert('Preencha todos os campos corretamente.');
            return;
        }

        const item = { id: gerarId(), nome, unidade, preco };

        if (indiceEdicao !== null) {
            item.id = precos[indiceEdicao].id;
            precos[indiceEdicao] = item;
            indiceEdicao = null;
        } else {
            precos.push(item);
        }

        salvarDados(CHAVES.precos, precos);
        formulario.reset();
        desenharPrecos();
    });

    desenharPrecos();
})();

/* ===== MEUS CLIENTES ===== */

(function () {
    const formulario = document.getElementById('formCliente');
    const lista = document.getElementById('listaClientes');

    if (!lista) return;

    let clientes = carregarDados(CHAVES.clientes);

    function desenharClientes() {
        lista.replaceChildren();

        const obras = carregarDados(CHAVES.obras);

        const ativos = clientes.filter(cliente =>
            obras.some(obra =>
                obra.clienteId === cliente.id &&
                obra.status !== 'Concluída'
            )
        );

        if (!ativos.length) {
            lista.textContent = 'Nenhum cliente com obra em aberto.';
            return;
        }

        ativos.forEach(cliente => {
            const obrasCliente = obras.filter(obra =>
                obra.clienteId === cliente.id &&
                obra.status !== 'Concluída'
            );

            const card = document.createElement('article');
            card.className = 'card';

            const titulo = document.createElement('h3');
            titulo.textContent = cliente.nome;

            const telefone = document.createElement('p');
            telefone.textContent = 'Telefone: ' + cliente.telefone;

            const quantidade = document.createElement('p');
            quantidade.textContent = 'Obras em aberto: ' + obrasCliente.length;

            const prazo = document.createElement('p');
            const proximoPrazo = obrasCliente
                .map(obra => obra.prazo)
                .filter(Boolean)
                .sort()[0];

            prazo.textContent = 'Próximo prazo: ' + formatarData(proximoPrazo);

            card.append(titulo, telefone, quantidade, prazo);
            lista.appendChild(card);
        });
    }

    if (formulario) {
        formulario.addEventListener('submit', function (evento) {
            evento.preventDefault();

            const cliente = {
                id: gerarId(),
                nome: document.getElementById('clienteNome').value.trim(),
                telefone: document.getElementById('clienteTelefone').value.trim()
            };

            if (!cliente.nome || !cliente.telefone) return;

            clientes.push(cliente);
            salvarDados(CHAVES.clientes, clientes);

            formulario.reset();
            desenharClientes();
        });
    }

    desenharClientes();
})();

/* ===== OBRAS ===== */

(function () {
    const formulario = document.getElementById('formObra');
    const lista = document.getElementById('listaObras');

    if (!lista) return;

    let obras = carregarDados(CHAVES.obras);
    let clientes = carregarDados(CHAVES.clientes);

    function desenharObras() {
        lista.replaceChildren();

        const abertas = obras.filter(obra => obra.status !== 'Concluída');

        if (!abertas.length) {
            lista.textContent = 'Nenhuma obra em andamento.';
            return;
        }

        abertas.forEach(obra => {
            const cliente = clientes.find(c => c.id === obra.clienteId);

            const card = document.createElement('article');
            card.className = 'card';

            const titulo = document.createElement('h3');
            titulo.textContent = obra.nome;

            const nomeCliente = document.createElement('p');
            nomeCliente.textContent = 'Cliente: ' + (cliente ? cliente.nome : 'Não encontrado');

            const prazo = document.createElement('p');
            prazo.textContent = 'Prazo: ' + formatarData(obra.prazo);

            const progresso = document.createElement('p');
            progresso.textContent = 'Andamento: ' + obra.progresso + '%';

            const barra = document.createElement('div');
            barra.className = 'progresso';

            const preenchimento = document.createElement('div');
            preenchimento.className = 'progresso-barra';
            preenchimento.style.width = obra.progresso + '%';

            barra.appendChild(preenchimento);

            const status = document.createElement('p');
            status.textContent = 'Status: ' + obra.status;

            const atualizar = document.createElement('button');
            atualizar.type = 'button';
            atualizar.className = 'btn';
            atualizar.textContent = 'Atualizar andamento';

            atualizar.addEventListener('click', () => {
                const novo = prompt('Informe o andamento (0 a 100):', obra.progresso);

                if (novo === null) return;

                const valor = Number(novo);

                if (!Number.isInteger(valor) || valor < 0 || valor > 100) {
                    alert('Informe um número entre 0 e 100.');
                    return;
                }

                obra.progresso = valor;
                obra.status = valor === 100 ? 'Concluída' : 'Em andamento';

                salvarDados(CHAVES.obras, obras);
                desenharObras();
            });

            card.append(titulo, nomeCliente, prazo, progresso, barra, status, atualizar);
            lista.appendChild(card);
        });
    }

    if (formulario) {
        const campoCliente = document.getElementById('obraCliente');

        function preencherClientes() {
            campoCliente.replaceChildren();

            clientes.forEach(cliente => {
                const opcao = document.createElement('option');
                opcao.value = cliente.id;
                opcao.textContent = cliente.nome;
                campoCliente.appendChild(opcao);
            });
        }

        preencherClientes();

        formulario.addEventListener('submit', function (evento) {
            evento.preventDefault();

            const obra = {
                id: gerarId(),
                nome: document.getElementById('obraNome').value.trim(),
                clienteId: campoCliente.value,
                prazo: document.getElementById('obraPrazo').value,
                progresso: 0,
                status: 'Em andamento',
                materiais: []
            };

            if (!obra.nome || !obra.clienteId || !obra.prazo) {
                alert('Preencha todos os campos.');
                return;
            }

            obras.push(obra);
            salvarDados(CHAVES.obras, obras);

            formulario.reset();
            desenharObras();
        });
    }

    desenharObras();
})();

/* ===== MEU STATUS ===== */

(function () {
    const botao = document.getElementById('alterarStatus');
    const texto = document.getElementById('statusProfissional');

    if (!botao || !texto) return;

    let status = localStorage.getItem(CHAVES.status) || 'Disponível';

    function atualizar() {
        texto.textContent = status;
        texto.className = status === 'Disponível'
            ? 'status status-concluida'
            : 'status status-atencao';

        botao.textContent = status === 'Disponível'
            ? 'Estou trabalhando'
            : 'Estou disponível';
    }

    botao.addEventListener('click', () => {
        status = status === 'Disponível' ? 'Trabalhando' : 'Disponível';

        localStorage.setItem(CHAVES.status, status);
        atualizar();
    });

    atualizar();
})();

/* ===== OBRAS CONCLUÍDAS ===== */

(function () {
    const lista = document.getElementById('listaConcluidas');

    if (!lista) return;

    const obras = carregarDados(CHAVES.obras);
    const clientes = carregarDados(CHAVES.clientes);

    const concluidas = obras.filter(obra =>
        obra.status === 'Concluída' || obra.progresso === 100
    );

    lista.replaceChildren();

    if (!concluidas.length) {
        lista.textContent = 'Nenhuma obra concluída.';
        return;
    }

    concluidas.forEach(obra => {
        const cliente = clientes.find(c => c.id === obra.clienteId);

        const card = document.createElement('article');
        card.className = 'card';

        const titulo = document.createElement('h3');
        titulo.textContent = obra.nome;

        const nomeCliente = document.createElement('p');
        nomeCliente.textContent = 'Cliente: ' + (cliente ? cliente.nome : 'Não encontrado');

        const status = document.createElement('span');
        status.className = 'status status-concluida';
        status.textContent = 'Concluída';

        card.append(titulo, nomeCliente, status);
        lista.appendChild(card);
    });
})();

/* ===== ORÇAMENTO (montado junto da calculadora) ===== */

(function () {
    const formularioItem = document.getElementById('formItemOrcamento');
    if (!formularioItem) return;

    const AVISO = 'Este orçamento é uma estimativa de custos e não substitui um contrato formal entre as partes.';

    const porId = id => document.getElementById(id);

    const campos = {
        descricao: porId('orcDescricao'),
        tipo: porId('orcTipo'),
        unidade: porId('orcUnidade'),
        quantidade: porId('orcQuantidade'),
        preco: porId('orcPreco')
    };

    const titulo = porId('orcTitulo');
    const seletorCliente = porId('orcCliente');
    const observacoes = porId('orcObs');
    const tabela = porId('listaItensOrcamento');
    const totalTela = porId('orcTotal');
    const subtotaisTela = porId('orcSubtotais');
    const mensagem = porId('orcMensagem');
    const estado = porId('orcEstado');
    const listaSalvos = porId('listaOrcamentos');
    const documento = porId('orcamentoImpressao');

    const clientes = carregarDados(CHAVES.clientes);
    const precos = carregarDados(CHAVES.precos);

    let itens = [];
    let orcamentos = carregarDados(CHAVES.orcamentos);
    let idAtual = null;
    let alterado = false;

    /* ---------- utilidades ---------- */

    function hojeISO() {
        const d = new Date();
        return [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0')
        ].join('-');
    }

    const subtotalItem = item => item.quantidade * item.preco;
    const somar = lista => lista.reduce((total, item) => total + subtotalItem(item), 0);
    const formatarQuantidade = n => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

    function criar(tag, texto, classe) {
        const elemento = document.createElement(tag);
        if (texto !== undefined) elemento.textContent = texto;
        if (classe) elemento.className = classe;
        return elemento;
    }

    function avisar(texto, tipo) {
        mensagem.textContent = texto;
        mensagem.className = 'orc-msg' + (tipo ? ' orc-msg-' + tipo : '');
    }

    function atualizarEstado() {
        if (alterado) {
            estado.textContent = 'Alterações não salvas';
            estado.className = 'status status-atencao';
        } else if (idAtual) {
            estado.textContent = 'Orçamento salvo';
            estado.className = 'status status-concluida';
        } else {
            estado.textContent = 'Novo orçamento';
            estado.className = 'status status-andamento';
        }
    }

    function marcarAlterado() {
        alterado = true;
        atualizarEstado();
    }

    function confirmarDescarte() {
        return !(alterado && itens.length) || confirm('Descartar as alterações do orçamento atual?');
    }

    /* ---------- clientes e sugestões ---------- */

    function preencherClientes(selecionado) {
        seletorCliente.replaceChildren();

        const semCliente = criar('option', 'Sem cliente vinculado');
        semCliente.value = '';
        seletorCliente.appendChild(semCliente);

        clientes.forEach(cliente => {
            const opcao = criar('option', cliente.nome);
            opcao.value = cliente.id;
            seletorCliente.appendChild(opcao);
        });

        seletorCliente.value = clientes.some(c => c.id === selecionado) ? selecionado : '';
    }

    function preencherSugestoes() {
        const lista = porId('sugestoesPrecos');
        const nomes = [...new Set(precos.map(p => p.nome))];

        nomes.forEach(nome => {
            const opcao = document.createElement('option');
            opcao.value = nome;
            lista.appendChild(opcao);
        });
    }

    // Ao escolher um serviço da "Média de preços", sugere unidade e preço médio
    campos.descricao.addEventListener('change', () => {
        const nome = campos.descricao.value.trim().toLowerCase();
        const iguais = precos.filter(p => p.nome.toLowerCase() === nome);

        if (!iguais.length) return;

        if (!campos.unidade.value) campos.unidade.value = iguais[0].unidade;

        if (!campos.preco.value) {
            const media = iguais.reduce((total, p) => total + p.preco, 0) / iguais.length;
            campos.preco.value = media.toFixed(2);
        }
    });

    /* ---------- tabela de itens ---------- */

    function desenharItens() {
        tabela.replaceChildren();

        if (!itens.length) {
            const linha = document.createElement('tr');
            const celula = criar('td', 'Nenhum item adicionado. Preencha os campos acima e clique em "Adicionar item".', 'vazio');
            celula.colSpan = 6;
            linha.appendChild(celula);
            tabela.appendChild(linha);
        }

        itens.forEach((item, indice) => {
            const linha = document.createElement('tr');

            const acoes = document.createElement('td');
            const remover = criar('button', 'Remover', 'btn-remover');
            remover.type = 'button';
            remover.setAttribute('aria-label', 'Remover ' + item.descricao);
            remover.addEventListener('click', () => {
                itens.splice(indice, 1);
                marcarAlterado();
                desenharItens();
            });
            acoes.appendChild(remover);

            const celulaDescricao = document.createElement('td');
            celulaDescricao.append(criar('span', item.descricao), criar('small', item.tipo, 'tipo-item'));

            linha.append(
                celulaDescricao,
                criar('td', formatarQuantidade(item.quantidade)),
                criar('td', item.unidade),
                criar('td', formatarMoeda(item.preco)),
                criar('td', formatarMoeda(subtotalItem(item))),
                acoes
            );

            tabela.appendChild(linha);
        });

        totalTela.textContent = formatarMoeda(somar(itens));

        const servicos = somar(itens.filter(i => i.tipo === 'Serviço'));
        const materiais = somar(itens.filter(i => i.tipo === 'Material'));
        subtotaisTela.textContent = 'Serviços: ' + formatarMoeda(servicos) + '  ·  Materiais: ' + formatarMoeda(materiais);
    }

    formularioItem.addEventListener('submit', evento => {
        evento.preventDefault();

        const descricao = campos.descricao.value.trim();
        const unidade = campos.unidade.value.trim();
        const quantidade = Number(campos.quantidade.value);
        const preco = Number(campos.preco.value);

        if (!descricao || !unidade || !Number.isFinite(quantidade) || quantidade <= 0 ||
            !Number.isFinite(preco) || preco < 0) {
            avisar('Informe descrição, unidade, uma quantidade maior que zero e um preço válido.', 'erro');
            return;
        }

        itens.push({
            id: gerarId(),
            descricao,
            tipo: campos.tipo.value,
            unidade,
            quantidade,
            preco
        });

        formularioItem.reset();
        marcarAlterado();
        desenharItens();
        avisar('Item adicionado.', 'ok');
        campos.descricao.focus();
    });

    /* ---------- resultado da calculadora → campos do orçamento ---------- */

    function usarResultado(destino, rotulo) {
        const texto = campo ? campo.value.replace(',', '.') : '';
        const valor = Number(texto);

        if (!campo || texto === '' || campo.value === 'Erro' || !Number.isFinite(valor)) {
            avisar('Calcule um resultado primeiro (tecla =) para usá-lo no orçamento.', 'erro');
            return;
        }

        destino.value = destino === campos.preco ? valor.toFixed(2) : String(valor);
        avisar('Resultado aplicado como ' + rotulo + '.', 'ok');
        destino.focus();
    }

    const botaoQuantidade = porId('usarQuantidade');
    const botaoPreco = porId('usarPreco');

    if (botaoQuantidade) botaoQuantidade.addEventListener('click', () => usarResultado(campos.quantidade, 'quantidade'));
    if (botaoPreco) botaoPreco.addEventListener('click', () => usarResultado(campos.preco, 'preço unitário'));

    /* ---------- orçamento atual: salvar, novo, abrir ---------- */

    function nomeDoCliente(clienteId) {
        const cliente = clientes.find(c => c.id === clienteId);
        return cliente ? cliente.nome : '';
    }

    function lerOrcamentoAtual() {
        const existente = orcamentos.find(o => o.id === idAtual);

        return {
            id: idAtual || gerarId(),
            titulo: titulo.value.trim(),
            clienteId: seletorCliente.value,
            clienteNome: nomeDoCliente(seletorCliente.value),
            observacoes: observacoes.value.trim(),
            itens: itens.map(item => ({ ...item })),
            criadoEm: existente ? existente.criadoEm : hojeISO(),
            atualizadoEm: hojeISO()
        };
    }

    function salvarOrcamento() {
        if (!titulo.value.trim()) {
            avisar('Dê um nome ao orçamento antes de salvar.', 'erro');
            titulo.focus();
            return;
        }

        if (!itens.length) {
            avisar('Adicione pelo menos um item antes de salvar.', 'erro');
            return;
        }

        const orcamento = lerOrcamentoAtual();
        const indice = orcamentos.findIndex(o => o.id === orcamento.id);

        if (indice >= 0) orcamentos[indice] = orcamento;
        else orcamentos.push(orcamento);

        salvarDados(CHAVES.orcamentos, orcamentos);

        idAtual = orcamento.id;
        alterado = false;
        atualizarEstado();
        desenharSalvos();
        avisar('Orçamento salvo com sucesso.', 'ok');
    }

    function limparOrcamento() {
        itens = [];
        idAtual = null;
        alterado = false;
        titulo.value = '';
        observacoes.value = '';
        formularioItem.reset();
        preencherClientes('');
        atualizarEstado();
        desenharItens();
    }

    function novoOrcamento() {
        if (!confirmarDescarte()) return;

        limparOrcamento();
        avisar('', '');
        titulo.focus();
    }

    function abrirOrcamento(orcamento) {
        if (!confirmarDescarte()) return;

        itens = orcamento.itens.map(item => ({ ...item }));
        idAtual = orcamento.id;
        alterado = false;
        titulo.value = orcamento.titulo;
        observacoes.value = orcamento.observacoes || '';
        preencherClientes(orcamento.clienteId);
        atualizarEstado();
        desenharItens();
        avisar('Orçamento "' + orcamento.titulo + '" aberto para edição.', 'ok');
        titulo.scrollIntoView({ behavior: 'smooth', block: 'center' });
        titulo.focus();
    }

    /* ---------- impressão / PDF ---------- */

    function montarDocumento(orcamento) {
        documento.replaceChildren();

        documento.appendChild(criar('h2', 'Orçamento'));
        documento.appendChild(criar('p', orcamento.titulo || 'Sem título', 'doc-titulo'));

        const dados = criar('div', undefined, 'doc-dados');
        dados.append(
            criar('p', 'Cliente: ' + (orcamento.clienteNome || 'Não informado')),
            criar('p', 'Data: ' + formatarData(orcamento.atualizadoEm || hojeISO()))
        );
        documento.appendChild(dados);

        const tabelaDoc = document.createElement('table');
        const cabecalho = document.createElement('thead');
        const linhaCabecalho = document.createElement('tr');
        ['Descrição', 'Tipo', 'Qtd.', 'Unid.', 'Valor unit.', 'Subtotal'].forEach(texto => {
            linhaCabecalho.appendChild(criar('th', texto));
        });
        cabecalho.appendChild(linhaCabecalho);

        const corpo = document.createElement('tbody');
        orcamento.itens.forEach(item => {
            const linha = document.createElement('tr');
            linha.append(
                criar('td', item.descricao),
                criar('td', item.tipo),
                criar('td', formatarQuantidade(item.quantidade)),
                criar('td', item.unidade),
                criar('td', formatarMoeda(item.preco)),
                criar('td', formatarMoeda(subtotalItem(item)))
            );
            corpo.appendChild(linha);
        });

        tabelaDoc.append(cabecalho, corpo);
        documento.appendChild(tabelaDoc);

        documento.appendChild(criar('p', 'Total estimado: ' + formatarMoeda(somar(orcamento.itens)), 'doc-total'));

        if (orcamento.observacoes) {
            documento.appendChild(criar('h3', 'Observações'));
            documento.appendChild(criar('p', orcamento.observacoes));
        }

        documento.appendChild(criar('p', AVISO, 'doc-aviso'));
    }

    function imprimir(orcamento) {
        montarDocumento(orcamento);
        window.print();
    }

    /* ---------- orçamentos salvos ---------- */

    function desenharSalvos() {
        listaSalvos.replaceChildren();

        if (!orcamentos.length) {
            listaSalvos.textContent = 'Nenhum orçamento salvo.';
            return;
        }

        [...orcamentos].reverse().forEach(orcamento => {
            const card = criar('article', undefined, 'card');

            const acoes = criar('div', undefined, 'acoes-cartao');

            const abrir = criar('button', 'Abrir', 'btn');
            abrir.type = 'button';
            abrir.addEventListener('click', () => abrirOrcamento(orcamento));

            const imprimirBotao = criar('button', 'Imprimir / PDF', 'btn btn-claro');
            imprimirBotao.type = 'button';
            imprimirBotao.addEventListener('click', () => imprimir(orcamento));

            const excluir = criar('button', 'Excluir', 'btn-remover');
            excluir.type = 'button';
            excluir.setAttribute('aria-label', 'Excluir orçamento ' + orcamento.titulo);
            excluir.addEventListener('click', () => {
                if (!confirm('Deseja excluir este orçamento?')) return;

                orcamentos = orcamentos.filter(o => o.id !== orcamento.id);
                salvarDados(CHAVES.orcamentos, orcamentos);

                if (idAtual === orcamento.id) {
                    idAtual = null;
                    alterado = itens.length > 0;
                    atualizarEstado();
                }

                desenharSalvos();
            });

            acoes.append(abrir, imprimirBotao, excluir);

            card.append(
                criar('h3', orcamento.titulo),
                criar('p', 'Cliente: ' + (orcamento.clienteNome || 'Não informado')),
                criar('p', orcamento.itens.length + (orcamento.itens.length === 1 ? ' item' : ' itens')),
                criar('p', 'Total estimado: ' + formatarMoeda(somar(orcamento.itens))),
                criar('p', 'Atualizado em ' + formatarData(orcamento.atualizadoEm)),
                acoes
            );

            listaSalvos.appendChild(card);
        });
    }

    /* ---------- botões e inicialização ---------- */

    porId('btnSalvarOrc').addEventListener('click', salvarOrcamento);
    porId('btnNovoOrc').addEventListener('click', novoOrcamento);

    porId('btnImprimirOrc').addEventListener('click', () => {
        if (!itens.length) {
            avisar('Adicione pelo menos um item para imprimir ou gerar o PDF.', 'erro');
            return;
        }

        imprimir(lerOrcamentoAtual());
    });

    [titulo, seletorCliente, observacoes].forEach(elemento => {
        elemento.addEventListener('input', marcarAlterado);
    });

    preencherClientes('');
    preencherSugestoes();
    atualizarEstado();
    desenharItens();
    desenharSalvos();
})();