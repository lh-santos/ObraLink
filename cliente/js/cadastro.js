import { auth, db } from "../../database/firebase-browser.js";

import {
    createUserWithEmailAndPassword,
    updateProfile,
    deleteUser,
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import {
    ref,
    set,
    get,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

// FORMULÁRIOS
const formularioCadastro = document.getElementById("formCadastro");
const formularioLogin = document.getElementById("formLogin");

// CADASTRO DE CLIENTE
if (formularioCadastro) {
    formularioCadastro.addEventListener("submit", cadastrarCliente);
}

// LOGIN DE CLIENTE
if (formularioLogin) {
    formularioLogin.addEventListener("submit", realizarLogin);
}

// FUNÇÃO DE CADASTRO
async function cadastrarCliente(event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    const mensagem = document.getElementById("mensagem");
    const botao = document.getElementById("btnCadastrar");

    if (senha !== confirmarSenha) {
        mensagem.textContent = "As senhas não coincidem.";
        return;
    }

    if (nome.length < 3) {
        mensagem.textContent = "Informe seu nome completo.";
        return;
    }

    try {
        botao.disabled = true;
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
        botao.disabled = false;
    }
}

// FUNÇÃO DE LOGIN
async function realizarLogin(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    const mensagem = document.getElementById("mensagem");
    const botao = document.getElementById("btnEntrar");

    try {
        botao.disabled = true;
        mensagem.textContent = "Verificando suas credenciais...";

        const credencial = await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

        const usuario = credencial.user;

        const referencia = ref(db, `clientes/${usuario.uid}`);
        const snapshot = await get(referencia);

        if (!snapshot.exists()) {
            await signOut(auth);

            mensagem.textContent =
                "Esta conta não possui cadastro de cliente.";

            return;
        }

        const dados = snapshot.val();

        if (dados.tipo !== "cliente") {
            await signOut(auth);

            mensagem.textContent =
                "Esta conta não pertence à área de clientes.";

            return;
        }

        mensagem.textContent = "Login realizado com sucesso!";

        window.location.href = "cliente/index.html";

    } catch (error) {
        console.error("Erro no login:", error);

        const erros = {
            "auth/invalid-credential": "E-mail ou senha incorretos.",
            "auth/user-not-found": "Usuário não encontrado.",
            "auth/wrong-password": "Senha incorreta.",
            "auth/invalid-email": "Digite um e-mail válido.",
            "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco.",
            "auth/network-request-failed": "Verifique sua conexão com a internet."
        };

        mensagem.textContent =
            erros[error.code] || "Não foi possível realizar o login.";

    } finally {
        botao.disabled = false;
    }
}
