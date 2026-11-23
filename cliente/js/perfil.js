import { auth } from "../../database/firebase-browser.js";
import { obterPerfil, atualizarPerfil } from "../../database/services/perfis.js";
import { onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

const formulario = document.getElementById("formPerfil");
const campoNome = document.getElementById("nome");
const campoEmail = document.getElementById("email");
const campoTelefone = document.getElementById("telefone");
const mensagem = document.getElementById("mensagemPerfil");
const botao = document.getElementById("btnSalvar");
let usuarioAtual = null;

onAuthStateChanged(auth, async (usuario) => {
    if (!usuario) return;

    usuarioAtual = usuario;
    formulario.querySelectorAll("input, select, button").forEach((campo) => campo.disabled = true);
    mensagem.textContent = "Carregando seus dados...";

    try {
        const perfil = await obterPerfil("cliente", usuario.uid);
        campoNome.value = perfil.nome || usuario.displayName || "";
        campoEmail.value = perfil.email || usuario.email || "";
        campoTelefone.value = perfil.telefone || "";
        mensagem.textContent = "";
    } catch (erro) {
        console.error("Erro ao carregar perfil:", erro);
        mensagem.textContent = "Não foi possível carregar seus dados. Verifique sua conexão e as permissões do Firebase.";
    } finally {
        formulario.querySelectorAll("input, select, button").forEach((campo) => campo.disabled = campo === campoEmail);
    }
});

formulario.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!usuarioAtual) return;

    const nome = campoNome.value.trim();
    const telefone = campoTelefone.value.trim();

    if (nome.length < 3 || !telefone) {
        mensagem.textContent = "Preencha seu nome e telefone corretamente.";
        return;
    }

    botao.disabled = true;
    mensagem.textContent = "Salvando alterações...";

    try {
        await atualizarPerfil("cliente", usuarioAtual.uid, { nome, telefone });
        await updateProfile(usuarioAtual, { displayName: nome });
        mensagem.textContent = "Perfil atualizado com sucesso!";
    } catch (erro) {
        console.error("Erro ao atualizar perfil:", erro);
        mensagem.textContent = "Não foi possível salvar. Verifique as permissões do Firebase e tente novamente.";
    } finally {
        botao.disabled = false;
    }
});
