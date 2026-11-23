import { auth, db } from "../../database/firebase-browser.js";

import {
    createUserWithEmailAndPassword,
    updateProfile,
    deleteUser
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    ref,
    set,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

const formulario = document.getElementById("formCadastro");
const mensagem = document.getElementById("mensagem");
const botaoCadastrar = document.getElementById("btnCadastrar");

formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (senha !== confirmarSenha) {
        mensagem.textContent = "As senhas não coincidem.";
        return;
    }

    if (nome.length < 3) {
        mensagem.textContent = "Informe seu nome completo.";
        return;
    }

    try {
        botaoCadastrar.disabled = true;
        mensagem.textContent = "Criando sua conta...";

        const credencial = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        const usuario = credencial.user;

        try {
            await updateProfile(usuario, {
                displayName: nome
            });

            await set(ref(db, `clientes/${usuario.uid}`), {
                nome: nome,
                email: email,
                telefone: telefone,
                tipo: "cliente",
                criadoEm: serverTimestamp()
            });

        } catch (erro) {
            await deleteUser(usuario);
            throw erro;
        }

        mensagem.textContent = "Cadastro realizado com sucesso!";

        formulario.reset();

        window.location.href = "index.html";

    } catch (error) {
        console.error("Erro no cadastro:", error);

        const erros = {
            "auth/email-already-in-use": "Este e-mail já está cadastrado.",
            "auth/invalid-email": "Digite um e-mail válido.",
            "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
            "auth/network-request-failed": "Verifique sua conexão com a internet.",
            "PERMISSION_DENIED": "Sem permissão para salvar os dados. Verifique as regras do Firebase."
        };

        mensagem.textContent =
            erros[error.code] || "Não foi possível realizar o cadastro.";

    } finally {
        botaoCadastrar.disabled = false;
    }
});
