
/* ===== CONFIGURAÇÕES GERAIS ===== */

const CHAVES = {
    clientes: 'obralink:clientes',
    obras: 'obralink:obras',
    precos: 'obralink:media-precos',
    status: 'obralink:status'
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


