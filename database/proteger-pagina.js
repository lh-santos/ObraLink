import { auth, db } from "./firebase-browser.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-database.js";

export function protegerPagina(tipoEsperado, caminhoLogin) {
    onAuthStateChanged(auth, async (usuario) => {
        if (!usuario) {
            window.location.replace(caminhoLogin);
            return;
        }

        try {
            const snapshot = await get(ref(db, `${tipoEsperado === "profissional" ? "profissionais" : "clientes"}/${usuario.uid}`));

            if (!snapshot.exists() || snapshot.val().tipo !== tipoEsperado) {
                await signOut(auth);
                window.location.replace(caminhoLogin);
            }
        } catch (erro) {
            console.error("Erro ao verificar acesso:", erro);
            document.body.innerHTML = "<main><h2>Não foi possível verificar seu acesso.</h2><p>Verifique sua conexão e tente novamente.</p></main>";
        }
    });
}
