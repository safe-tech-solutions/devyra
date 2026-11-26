document.addEventListener("DOMContentLoaded", function () {
  const botao = document.getElementById("testar");
  const status = document.getElementById("status");

  botao.addEventListener("click", function () {
    status.textContent = "Painel carregado corretamente!";
    status.style.color = "#c9a45c";

    botao.textContent = "PAINEL FUNCIONANDO";
    botao.disabled = true;
  });
});
