// Seleção dos elementos do HTML
const form = document.getElementById("qa-form");
const perguntaInput = document.getElementById("pergunta-input");
const respostaBox = document.getElementById("resposta-box");
const respostaTexto = document.getElementById("resposta-texto");
const noticiaLink = document.getElementById("noticia-link");
const linkTexto = document.getElementById("link-texto");
const btnAudio = document.getElementById("btn-audio");
const loading = document.getElementById("loading");

let leituraVoz = null;

// Função chamada pelos botões de atalho/sugestões
function preencherPergunta(texto) {
    perguntaInput.value = texto;
    buscarDuckDuckGo(texto);
}

// Evento ao submeter a pergunta
form.addEventListener("submit", function (e) {
    e.preventDefault();
    const pergunta = perguntaInput.value.trim();
    if (pergunta) {
        buscarDuckDuckGo(pergunta);
    }
});

// Integração com a API do DuckDuckGo e Fallback Wikipedia via JSONP/Fetch
async function buscarDuckDuckGo(termo) {
    pararVoz();
    respostaBox.style.display = "none";
    loading.style.display = "flex";

    // Adiciona palavras de contexto para refinar os resultados do vôlei feminino
    let buscaRefinada = termo;
    if (!termo.toLowerCase().includes("vôlei") && !termo.toLowerCase().includes("volei")) {
        buscaRefinada += " vôlei feminino brasil";
    }

    try {
        // 1. Consulta ao DuckDuckGo via API pública JSON
        const urlDuck = `https://api.duckduckgo.com/?q=${encodeURIComponent(buscaRefinada)}&format=json&kl=br-pt&no_html=1`;
        const respostaDuck = await fetch(urlDuck);
        const dadosDuck = await respostaDuck.json();

        // Se o DuckDuckGo retornar um resumo direto (Abstract)
        if (dadosDuck.AbstractText && dadosDuck.AbstractText.length > 20) {
            exibirResultado(dadosDuck.AbstractText, dadosDuck.AbstractURL || dadosDuck.Url);
            loading.style.display = "none";
            return;
        }

        // Se houver tópicos relacionados no DuckDuckGo
        if (dadosDuck.RelatedTopics && dadosDuck.RelatedTopics.length > 0 && dadosDuck.RelatedTopics[0].Text) {
            const topico = dadosDuck.RelatedTopics[0];
            exibirResultado(topico.Text, topico.FirstURL);
            loading.style.display = "none";
            return;
        }

        // 2. Se o DuckDuckGo não trouxer resumo direto, recorre à API da Wikipedia em PT
        const urlWiki = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(buscaRefinada)}`;
        const respostaWiki = await fetch(urlWiki);

        if (respostaWiki.ok) {
            const dadosWiki = await respostaWiki.json();
            if (dadosWiki.extract) {
                const urlFonte = dadosWiki.content_urls ? dadosWiki.content_urls.desktop.page : `https://duckduckgo.com/?q=${encodeURIComponent(termo)}`;
                exibirResultado(dadosWiki.extract, urlFonte);
                loading.style.display = "none";
                return;
            }
        }

        // 3. Caso não haja texto formatado disponível nas APIs diretas
        const mensagemFallback = `Pesquisa realizada para "${termo}": O Vôlei Feminino do Brasil é destaque mundial com atletas como Gabi Guimarães e comando do técnico Zé Roberto Guimarães. Clique no link abaixo para ver todos os resultados atualizados diretamente no DuckDuckGo.`;
        const urlDuckDirect = `https://duckduckgo.com/?q=${encodeURIComponent(buscaRefinada)}`;
        exibirResultado(mensagemFallback, urlDuckDirect);

    } catch (erro) {
        console.error("Erro na busca do DuckDuckGo:", erro);
        const mensagemErro = `Não foi possível puxar os dados automaticamente. Acompanhe a pesquisa completa sobre "${termo}" no motor do DuckDuckGo pelo link abaixo.`;
        const urlDuckDirect = `https://duckduckgo.com/?q=${encodeURIComponent(buscaRefinada)}`;
        exibirResultado(mensagemErro, urlDuckDirect);
    } finally {
        loading.style.display = "none";
    }
}

// Exibe o texto da resposta e insere a URL da notícia/artigo no card
function exibirResultado(texto, urlFonte) {
    respostaTexto.textContent = texto;
    noticiaLink.href = urlFonte || "#";
    linkTexto.textContent = urlFonte ? urlFonte : "Ver resultados no DuckDuckGo";
    respostaBox.style.display = "flex";
}

/* ==========================================
   SINTETIZADOR DE VOZ I.A (SpeechSynthesis API)
   ========================================== */
btnAudio.addEventListener("click", () => {
    if ('speechSynthesis' in window) {
        if (window.speechSynthesis.speaking) {
            pararVoz();
        } else {
            iniciarVoz(respostaTexto.textContent);
        }
    } else {
        alert("Navegador sem suporte para reprodução de voz.");
    }
});

function iniciarVoz(texto) {
    leituraVoz = new SpeechSynthesisUtterance(texto);
    leituraVoz.lang = 'pt-BR';
    leituraVoz.rate = 1.0;

    btnAudio.classList.add("lendo");
    btnAudio.innerHTML = `<i class="fa-solid fa-square"></i> <span>Parar Voz</span>`;

    leituraVoz.onend = resetarBotaoVoz;
    leituraVoz.onerror = resetarBotaoVoz;

    window.speechSynthesis.speak(leituraVoz);
}

function pararVoz() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    resetarBotaoVoz();
}

function resetarBotaoVoz() {
    btnAudio.classList.remove("lendo");
    btnAudio.innerHTML = `<i class="fa-solid fa-volume-high"></i> <span>Ouvir Voz</span>`;
}