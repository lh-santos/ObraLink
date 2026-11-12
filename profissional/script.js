






















/*Area de adicionar um produto quando é solicitado para adicionar*/
const btn = document.getElementById("addP");
const addSevisos = document.getElementById("addSevisos");

btn.addEventListener("click", () => {
    addSevisos.classList.toggle("oculto");
});


function adicionarCaractere(caractere) {
  const input = document.getElementById('meuInput');
  input.value += caractere; // Adiciona o caractere ao final do texto existente
}
