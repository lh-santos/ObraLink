/* ===== Comum a todas as páginas ===== */
(function () {
    // Destaca no menu a página aberta
    var arquivo = decodeURIComponent(location.pathname.split('/').pop()) || 'index.html';
    document.querySelectorAll('nav .link').forEach(function (a) {
        var destino = decodeURIComponent(a.getAttribute('href').split('/').pop());
        if (destino === arquivo) a.setAttribute('aria-current', 'page');
    });

    // Se uma imagem não carregar, mostra um bloco cinza no lugar
    document.querySelectorAll('.contener a img, .anucios a img').forEach(function (img) {
        function falhou() {
            img.hidden = true;
            if (img.parentElement) img.parentElement.classList.add('sem-imagem');
        }
        img.addEventListener('error', falhou);
        if (img.complete && img.naturalWidth === 0) falhou();
    });
})();

/* ===== Calculadora ===== */
var campo = document.getElementById('meuInput');
var mostrandoResultado = false;
var OPERADORES = '+-×÷';

function ehOperador(c) { return OPERADORES.indexOf(c) !== -1; }

function adicionarCaractere(c) {
    if (!campo) return;
    var valor = campo.value;
    if (valor === 'Erro') valor = '';

    if (mostrandoResultado) {
        // Dígito ou vírgula começam um cálculo novo; operador continua do resultado
        if (!ehOperador(c)) valor = '';
        mostrandoResultado = false;
    }

    var ultimo = valor.slice(-1);

    if (ehOperador(c)) {
        if (valor === '') { if (c === '-') valor = '-'; campo.value = valor; return; }
        if (valor === '-') return;
        if (ehOperador(ultimo)) {
            // Troca o operador anterior (permite "5×-3")
            if (c === '-' && (ultimo === '×' || ultimo === '÷')) { campo.value = valor + c; return; }
            if (ehOperador(valor.slice(-2, -1))) valor = valor.slice(0, -1);
            campo.value = valor.slice(0, -1) + c;
            return;
        }
        campo.value = valor + c;
        return;
    }

    if (c === ',') {
        var partes = valor.split(/[+\-×÷]/);
        var numeroAtual = partes[partes.length - 1];
        if (numeroAtual.indexOf(',') !== -1) return;
        campo.value = valor + (numeroAtual === '' ? '0,' : ',');
        return;
    }

    campo.value = valor + c;
}

function limpar() {
    if (!campo) return;
    campo.value = '';
    mostrandoResultado = false;
}

function apagar() {
    if (!campo) return;
    if (mostrandoResultado || campo.value === 'Erro') { limpar(); return; }
    campo.value = campo.value.slice(0, -1);
}

function avaliar(expressao) {
    var t = [], num = '';
    for (var i = 0; i < expressao.length; i++) {
        var ch = expressao[i];
        if (/[0-9,]/.test(ch)) {
            num += ch === ',' ? '.' : ch;
        } else if (ch === '-' && num === '' && (t.length === 0 || ehOperador(t[t.length - 1]))) {
            num = '-';
        } else {
            if (num !== '' && num !== '-') { t.push(parseFloat(num)); num = ''; }
            t.push(ch);
        }
    }
    if (num !== '' && num !== '-') t.push(parseFloat(num));

    // 1ª passada: × e ÷
    var p = [t[0]];
    for (var j = 1; j < t.length; j += 2) {
        var op = t[j], n = t[j + 1];
        if (typeof n !== 'number' || isNaN(n)) throw new Error('inválido');
        if (op === '×') p[p.length - 1] *= n;
        else if (op === '÷') {
            if (n === 0) throw new Error('divisão por zero');
            p[p.length - 1] /= n;
        } else p.push(op, n);
    }
    // 2ª passada: + e −
    var r = p[0];
    for (var k = 1; k < p.length; k += 2) r = p[k] === '+' ? r + p[k + 1] : r - p[k + 1];
    return r;
}

function calcular() {
    if (!campo) return;
    var expressao = campo.value;
    while (expressao && (ehOperador(expressao.slice(-1)) || expressao.slice(-1) === ',')) {
        expressao = expressao.slice(0, -1);
    }
    if (!expressao || expressao === '-' || campo.value === 'Erro') return;
    try {
        var r = avaliar(expressao);
        if (!isFinite(r)) throw new Error('inválido');
        campo.value = String(Number(r.toFixed(10))).replace('.', ',');
        mostrandoResultado = true;
    } catch (e) {
        campo.value = 'Erro';
        mostrandoResultado = true;
    }
}

// Teclado: números, operadores, Enter, Backspace e Esc
document.addEventListener('keydown', function (e) {
    if (!campo || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (/^[0-9]$/.test(k)) adicionarCaractere(k);
    else if (k === ',' || k === '.') adicionarCaractere(',');
    else if (k === '+' || k === '-') adicionarCaractere(k);
    else if (k === '*' || k === 'x' || k === 'X') adicionarCaractere('×');
    else if (k === '/') adicionarCaractere('÷');
    else if (k === 'Enter' || k === '=') { if (document.activeElement.tagName !== 'BUTTON') calcular(); else return; }
    else if (k === 'Backspace') apagar();
    else if (k === 'Escape') limpar();
    else return;
    e.preventDefault();
});

/* ===== Média de preços ===== */
(function () {
    var form = document.getElementById('formPreco');
    if (!form) return;

    var CHAVE = 'obralink:media-precos';
    var corpo = document.getElementById('listaPrecos');
    var resumo = document.getElementById('resumo');
    var itens = carregar();

    function carregar() {
        try {
            var bruto = localStorage.getItem(CHAVE);
            var lista = bruto ? JSON.parse(bruto) : [];
            return Array.isArray(lista) ? lista : [];
        } catch (e) { return []; }
    }

    function salvar() {
        try { localStorage.setItem(CHAVE, JSON.stringify(itens)); return true; }
        catch (e) { return false; }
    }

    function celula(tr, texto) {
        var td = document.createElement('td');
        td.textContent = texto;
        tr.appendChild(td);
        return td;
    }

    function desenhar() {
        corpo.replaceChildren();

        if (!itens.length) {
            var vazio = document.createElement('tr');
            var td = document.createElement('td');
            td.colSpan = 4;
            td.className = 'vazio';
            td.textContent = 'Nenhum item cadastrado. Preencha o formulário acima para adicionar o primeiro.';
            vazio.appendChild(td);
            corpo.appendChild(vazio);
        }

        itens.forEach(function (item, i) {
            var tr = document.createElement('tr');
            celula(tr, item.nome);
            celula(tr, item.unidade);

            var tdPreco = document.createElement('td');
            tdPreco.className = 'celula-preco';
            var entrada = document.createElement('input');
            entrada.type = 'number';
            entrada.min = '0';
            entrada.step = '0.01';
            entrada.value = item.preco;
            entrada.setAttribute('aria-label', 'Preço médio de ' + item.nome + ', em reais');
            entrada.addEventListener('change', function () {
                var novo = parseFloat(entrada.value);
                if (isNaN(novo) || novo < 0) { entrada.value = item.preco; return; }
                item.preco = novo;
                salvar();
            });
            tdPreco.appendChild(entrada);
            tr.appendChild(tdPreco);

            var tdAcao = document.createElement('td');
            var remover = document.createElement('button');
            remover.type = 'button';
            remover.className = 'btn-remover';
            remover.textContent = 'Remover';
            remover.setAttribute('aria-label', 'Remover ' + item.nome);
            remover.addEventListener('click', function () {
                itens.splice(i, 1);
                salvar();
                desenhar();
            });
            tdAcao.appendChild(remover);
            tr.appendChild(tdAcao);

            corpo.appendChild(tr);
        });

        resumo.textContent = itens.length + (itens.length === 1 ? ' item cadastrado' : ' itens cadastrados');
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var nome = document.getElementById('itemNome').value.trim();
        var unidade = document.getElementById('itemUnidade').value;
        var preco = parseFloat(document.getElementById('itemPreco').value);
        if (!nome || isNaN(preco) || preco < 0) return;

        itens.push({ nome: nome, unidade: unidade, preco: preco });
        var salvou = salvar();
        form.reset();
        desenhar();
        if (!salvou) resumo.textContent += '. Não foi possível salvar neste navegador.';
        document.getElementById('itemNome').focus();
    });

    desenhar();
})();

/* ===== Área do cliente: filtro de profissionais por ofício ===== */
(function () {
    var seletor = document.getElementById('filtroOficio');
    if (!seletor) return;

    var cartoes = document.querySelectorAll('#listaProfissionais .cartao-profissional');
    var semResultados = document.getElementById('semResultados');
    var contagem = document.getElementById('contagem');

    function aplicar() {
        var filtro = seletor.value, total = 0;
        cartoes.forEach(function (c) {
            var mostrar = !filtro || c.dataset.oficio === filtro;
            c.hidden = !mostrar;
            if (mostrar) total++;
        });
        if (semResultados) semResultados.hidden = total > 0;
        if (contagem) contagem.textContent = total + (total === 1 ? ' profissional encontrado' : ' profissionais encontrados');
    }

    seletor.addEventListener('change', aplicar);
    aplicar();
})();
