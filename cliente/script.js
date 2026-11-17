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


// ELEMENTOS DA PÁGINA

const filtroOficio = document.getElementById("filtroOficio");
const listaProfissionais = document.getElementById("listaProfissionais");
const contagem = document.getElementById("contagem");
const semResultados = document.getElementById("semResultados");

// FILTRAR PROFISSIONAIS

function filtrarProfissionais() {

    const oficioSelecionado = filtroOficio.value;

    const cartoes = document.querySelectorAll(
        ".cartao-profissional"
    );

    let quantidade = 0;

    cartoes.forEach(cartao => {

        const oficio = cartao.dataset.oficio;

        if (
            oficioSelecionado === "" ||
            oficio === oficioSelecionado
        ) {

            cartao.style.display = "block";
            quantidade++;

        } else {

            cartao.style.display = "none";

        }

    });

    contagem.textContent =
        `${quantidade} profissional(is) encontrado(s).`;

    semResultados.hidden = quantidade !== 0;
}

// ATUALIZAR FILTRO

filtroOficio.addEventListener(
    "change",
    filtrarProfissionais
);

// SOLICITAR VISITA TÉCNICA

const formularios = document.querySelectorAll(".form-visita");

formularios.forEach(formulario => {

    formulario.addEventListener("submit", function(event) {

        event.preventDefault();

        const cartao = formulario.closest(
            ".cartao-profissional"
        );

        const nome = cartao.querySelector("h3").textContent;

        const data = formulario.querySelector(
            'input[type="date"]'
        ).value;

        const periodo = formulario.querySelector(
            "select"
        ).value;

        const descricao = formulario.querySelector(
            "textarea"
        ).value;

        alert(
            "Solicitação registrada no protótipo!\n\n" +
            "Profissional: " + nome + "\n" +
            "Data: " + data + "\n" +
            "Período: " + periodo + "\n" +
            "Serviço: " + descricao
        );

        formulario.reset();

    });

});

// DEFINIR DATA MÍNIMA

document.querySelectorAll(
    '.form-visita input[type="date"]'
).forEach(campo => {

    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    campo.min = `${ano}-${mes}-${dia}`;

});

// INICIAR PÁGINA

filtrarProfissionais();
