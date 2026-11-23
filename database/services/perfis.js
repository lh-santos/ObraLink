import { db } from "../firebase-browser.js";
import { ref, get, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

function caminhoPerfil(tipo, uid) {
    const colecao = tipo === "profissional" ? "profissionais" : "clientes";
    return `${colecao}/${uid}`;
}

export async function obterPerfil(tipo, uid) {
    const snapshot = await get(ref(db, caminhoPerfil(tipo, uid)));

    if (!snapshot.exists()) {
        throw new Error("Perfil não encontrado no banco de dados.");
    }

    const perfil = snapshot.val();

    if (perfil.tipo !== tipo) {
        throw new Error("O tipo de conta não corresponde a esta área.");
    }

    return perfil;
}

export async function atualizarPerfil(tipo, uid, dados) {
    const atualizacoes = {
        nome: dados.nome.trim(),
        telefone: dados.telefone.trim(),
        atualizadoEm: serverTimestamp()
    };

    if (tipo === "profissional") {
        atualizacoes.especialidade = dados.especialidade;
    }

    await update(ref(db, caminhoPerfil(tipo, uid)), atualizacoes);
}
