/* =====================================================
   ORÁCULO DA FOGUEIRA | Pesquisa Web Global + Local
   ===================================================== */

const CONFIG = {
    maxHistorico: 6
};

/* Base de conhecimento local instantânea para os clássicos */
const BASE_CONHECIMENTO = {
    "o que e um jogo souls-like": {
        resposta: "Jogos Souls-like formam um subgênero de RPGs de ação marcado por alta dificuldade, combate tático baseado em estamina, design de níveis interconectado em labirinto e narrativa ambiental sutil. O termo surgiu a partir de Demon's Souls e da trilogia Dark Souls, criados pela FromSoftware sob a direção de Hidetaka Miyazaki.\n\nOutras características marcantes incluem a perda de almas ou moeda ao morrer com chance única de resgate, fogueiras ou pontos de descanso que reabastecem recursos mas ressuscitam os inimigos, e confrontos implacáveis contra chefes épicos.",
        fontes: [
            { titulo: "Souls-like - Wikipédia", url: "https://pt.wikipedia.org/wiki/Souls-like" },
            { titulo: "Dark Souls - Wikipédia", url: "https://pt.wikipedia.org/wiki/Dark_Souls" }
        ]
    },
    "elden ring": {
        resposta: "Elden Ring é um RPG de ação desenvolvido pela FromSoftware e publicado pela Bandai Namco Entertainment em 2022, contando com a colaboração do escritor George R. R. Martin na criação da mitologia do vasto mundo aberto das Terras Intermédias.\n\nO título eleva a fórmula clássica dos jogos Souls ao introduzir exploração vertical livre com o cavalo Torrent, masmorras desafiadoras espalhadas pelo mapa e um sistema de combate refinado com cinzas de guerra e magias diversificadas, consagrando-se como um marco na história dos videogames.",
        fontes: [
            { titulo: "Elden Ring - Wikipédia", url: "https://pt.wikipedia.org/wiki/Elden_Ring" },
            { titulo: "FromSoftware - Wikipédia", url: "https://pt.wikipedia.org/wiki/FromSoftware" }
        ]
    },
    "bloodborne": {
        resposta: "Bloodborne é um RPG de ação desenvolvido pela FromSoftware e lançado em 2015 exclusivamente para PlayStation 4. Ambientado na sombria cidade gótica e vitoriana de Yharnam, o enredo gira em torno de uma praga urbana que transforma os cidadãos em feras monstruosas.\n\nO combate de Bloodborne incentiva uma postura agressiva e veloz, substituindo escudos tradicionais por armas de fogo rápidas para atordoamento e introduzindo o sistema de retaliação, que permite recuperar o vigor perdido ao contra-atacar rapidamente após sofrer dano.",
        fontes: [
            { titulo: "Bloodborne - Wikipédia", url: "https://pt.wikipedia.org/wiki/Bloodborne" },
            { titulo: "Hidetaka Miyazaki - Wikipédia", url: "https://pt.wikipedia.org/wiki/Hidetaka_Miyazaki" }
        ]
    },
    "sekiro": {
        resposta: "Sekiro: Shadows Die Twice é um jogo de ação e aventura desenvolvido pela FromSoftware lançado em 2019. A trama se passa no Japão do período Sengoku e acompanha um shinobi conhecido como Lobo em sua jornada para proteger seu jovem lorde.\n\nDiferente dos títulos tradicionais Souls, Sekiro não possui criação de personagens ou atributos de RPG para subir de nível. O foco absoluto reside no sistema de postura, parry com espada e combate rítmico, exigindo precisão implacável nos reflexos.",
        fontes: [
            { titulo: "Sekiro: Shadows Die Twice - Wikipédia", url: "https://pt.wikipedia.org/wiki/Sekiro:_Shadows_Die_Twice" }
        ]
    },
    "lies of p": {
        resposta: "Lies of P é um RPG de ação estilo Souls-like desenvolvido pela Neowiz Games e Round8 Studio em 2023. O jogo reimagina de forma sombria o conto clássico de Pinóquio, ambientado na cidade industrial de Krat, tomada por autômatos e marionetes assassinas.\n\nO título destaca-se pelo inovador sistema de montagem de armas, onde lâminas e cabos podem ser combinados livremente, e pelo sistema de escolhas morais baseado em mentir ou falar a verdade.",
        fontes: [
            { titulo: "Lies of P - Wikipédia", url: "https://pt.wikipedia.org/wiki/Lies_of_P" }
        ]
    }
};

/* ---------- PESQUISA NA WEB GLOBAL (DuckDuckGo + Wikipédia) ---------- */
async function perguntarOraculo(pergunta) {
    const termoLimpo = normalizar(pergunta);
    
    // 1. Verifica na base local
    for (const chave in BASE_CONHECIMENTO) {
        if (termoLimpo.includes(chave) || chave.includes(termoLimpo)) {
            return BASE_CONHECIMENTO[chave];
        }
    }

    // 2. Pesquisa ampla na internet via DuckDuckGo Instant Answer API
    try {
        const urlDDG = `https://api.duckduckgo.com/?q=${encodeURIComponent(pergunta + " jogo souls-like")}&format=json&no_redirect=1&no_html=1`;
        const respDDG = await fetch(urlDDG);
        if (respDDG.ok) {
            const dadosDDG = await respDDG.json();
            const topicos = dadosDDG.RelatedTopics || [];
            const fontesWeb = [];
            let textoResumo = dadosDDG.AbstractText || "";

            topicos.forEach(t => {
                if (t.Text && t.FirstURL) {
                    fontesWeb.push({ titulo: t.Text.slice(0, 60) + "...", url: t.FirstURL });
                    if (!textoResumo) textoResumo = t.Text;
                }
            });

            if (textoResumo) {
                return {
                    resposta: textoResumo,
                    fontes: fontesWeb.length ? fontesWeb.slice(0, 4) : [{ titulo: "Busca Web Global", url: dadosDDG.AbstractURL || "https://duckduckgo.com/?q=" + encodeURIComponent(pergunta) }]
                };
            }
        }
    } catch {
        // Se falhar a API web geral, prossegue para o backup da Wikipédia
    }

    // 3. Backup robusto na Wikipédia (Português e Inglês)
    return await consultarWikipedia(pergunta);
}

function normalizar(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function limparWiki(texto) {
    return texto.replace(/\[\d+\]/g, "").replace(/\s*\n+\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

function cortarFrases(texto, max) {
    if (texto.length <= max) return texto;
    const trecho = texto.slice(0, max);
    const fim = Math.max(trecho.lastIndexOf(". "), trecho.lastIndexOf("! "), trecho.lastIndexOf("? "));
    return fim > max * 0.4 ? trecho.slice(0, fim + 1) : trecho.trim() + "…";
}

async function buscarWikipedia(idioma, termos) {
    const url = `https://${idioma}.wikipedia.org/w/api.php?` + new URLSearchParams({
        action: "query",
        format: "json",
        origin: "*",
        generator: "search",
        gsrsearch: termos,
        gsrlimit: "4",
        prop: "extracts|info",
        exintro: "1",
        explaintext: "1",
        exlimit: "4",
        inprop: "url",
        redirects: "1"
    });

    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Erro ao acessar os registros.");
    const dados = await resp.json();
    const paginas = Object.values((dados.query && dados.query.pages) || {});
    return paginas
        .filter((p) => p.extract && p.fullurl)
        .sort((a, b) => a.index - b.index)
        .map((p) => ({ titulo: p.title, url: p.fullurl, texto: limparWiki(p.extract) }));
}

async function consultarWikipedia(pergunta) {
    if (!navigator.onLine) throw new Error("Você está sem conexão com a internet.");
    
    let resultados = [];
    try {
        resultados = await buscarWikipedia("pt", pergunta);
    } catch {
        try {
            resultados = await buscarWikipedia("en", pergunta);
        } catch {
            resultados = [];
        }
    }

    if (!resultados.length) {
        throw new Error("O Oráculo vasculhou toda a internet e os reinos digitais, mas não encontrou registros sobre isso. Tente o nome exato de um jogo.");
    }

    const [principal, ...outros] = resultados;
    const paragrafos = [cortarFrases(principal.texto, 800)];
    const extras = outros.slice(0, 2).map((r) => r.titulo + ": " + cortarFrases(r.texto, 200));
    if (extras.length) {
        paragrafos.push("Outros ecos encontrados: " + extras.join(" "));
    }

    return {
        resposta: paragrafos.join("\n\n"),
        fontes: resultados.slice(0, 4).map((r) => ({ titulo: r.titulo + " (Web)", url: r.url }))
    };
}

/* ---------- INTERFACE ---------- */
const $ = (id) => document.getElementById(id);
const modal = $("modal");
const btnFechar = $("btnFechar");
const btnReabrir = $("btnReabrir");
const form = $("formPergunta");
const campo = $("campoPergunta");
const btnPerguntar = $("btnPerguntar");
const sugestoes = $("sugestoes");
const caixaResultado = $("resultado");
const conteudo = $("conteudo");
const barraVoz = $("barraVoz");
const historicoBox = $("historico");
const listaHistorico = $("listaHistorico");

let ultimaResposta = "";
let ultimaLingua = "pt-BR";

function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

function dominioDe(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function mostrarCarregando() {
    caixaResultado.hidden = false;
    barraVoz.hidden = true;
    const bloco = criar("div", "carregando");
    bloco.append(criar("span", "brasa-mini"), criar("span", "", "Vasculhando as cinzas da internet..."));
    conteudo.replaceChildren(bloco);
}

function mostrarResposta(pergunta, r) {
    ultimaResposta = r.resposta;
    ultimaLingua = "pt-BR";

    const texto = criar("div", "texto-resultado");
    r.resposta.split(/\n{2,}/).forEach((par) => {
        if (par.trim()) texto.appendChild(criar("p", "", par.trim()));
    });

    const fontes = criar("div", "fontes");
    fontes.appendChild(criar("h3", "", "Fontes e Registros Encontrados"));
    const validas = (r.fontes || []).filter((f) => f && /^https?:\/\//i.test(f.url));
    
    if (validas.length) {
        const ul = criar("ul");
        validas.forEach((f) => {
            const li = criar("li");
            const a = document.createElement("a");
            a.href = f.url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.append(criar("span", "fonte-nome", f.titulo || f.url), criar("span", "fonte-dominio", dominioDe(f.url) + " ↗"));
            li.appendChild(a);
            ul.appendChild(li);
        });
        fontes.appendChild(ul);
    } else {
        fontes.appendChild(criar("p", "aviso", "Nenhum link externo associado a esta profecia."));
    }

    conteudo.replaceChildren(criar("h2", "pergunta-eco", "“" + pergunta + "”"), texto, fontes);
    barraVoz.hidden = false;
}

function mostrarErro(mensagem) {
    barraVoz.hidden = true;
    caixaResultado.hidden = false;
    conteudo.replaceChildren(criar("div", "erro", mensagem));
}

async function enviarPergunta(texto) {
    const pergunta = texto.trim();
    if (!pergunta) { campo.focus(); return; }
    pararVoz();
    mostrarCarregando();
    btnPerguntar.disabled = true;
    try {
        const r = await perguntarOraculo(pergunta);
        mostrarResposta(pergunta, r);
        salvarHistorico(pergunta);
    } catch (erro) {
        mostrarErro(erro.message || "A fogueira vacilou. Tente novamente.");
    } finally {
        btnPerguntar.disabled = false;
    }
}

form.addEventListener("submit", (e) => { e.preventDefault(); enviarPergunta(campo.value); });

sugestoes.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    campo.value = chip.textContent;
    enviarPergunta(chip.textContent);
});

/* ---------- HISTÓRICO ---------- */
function lerHistorico() {
    try { return JSON.parse(localStorage.getItem("oraculo_historico") || "[]"); }
    catch { return []; }
}

function salvarHistorico(pergunta) {
    const lista = [pergunta, ...lerHistorico().filter((p) => p !== pergunta)].slice(0, CONFIG.maxHistorico);
    try { localStorage.setItem("oraculo_historico", JSON.stringify(lista)); } catch { /* sem armazenamento */ }
    renderHistorico();
}

function renderHistorico() {
    const lista = lerHistorico();
    historicoBox.hidden = lista.length === 0;
    listaHistorico.replaceChildren();
    lista.forEach((p) => {
        const li = criar("li");
        const b = criar("button", "", p);
        b.type = "button";
        b.addEventListener("click", () => { campo.value = p; enviarPergunta(p); });
        li.appendChild(b);
        listaHistorico.appendChild(li);
    });
}

/* ---------- VOZ (Web Speech API) ---------- */
const btnOuvir = $("btnOuvir");
const btnPausar = $("btnPausar");
const btnParar = $("btnParar");
const sliderVel = $("velocidade");
const saidaVel = $("velocidadeValor");
const voz = { id: 0, blocos: [], lang: "pt-BR" };
const temVoz = "speechSynthesis" in window;

if (!temVoz) {
    [btnOuvir, btnPausar, btnParar].forEach((b) => { b.disabled = true; });
    btnOuvir.title = "Seu navegador não suporta leitura por voz.";
}

sliderVel.addEventListener("input", () => { saidaVel.textContent = Number(sliderVel.value).toFixed(1) + "x"; });

function dividirTexto(texto) {
    const frases = texto.replace(/\s+/g, " ").match(/[^.!?]+[.!?]*/g) || [texto];
    const blocos = [];
    let atual = "";
    for (const f of frases) {
        if (atual && (atual + f).length > 180) { blocos.push(atual.trim()); atual = f; }
        else atual += f;
    }
    if (atual.trim()) blocos.push(atual.trim());
    return blocos;
}

function escolherVoz(lang) {
    const vozes = speechSynthesis.getVoices();
    return vozes.find((v) => v.lang.replace("_", "-") === lang)
        || vozes.find((v) => v.lang.toLowerCase().startsWith("pt"))
        || null;
}

function estadoVoz(falando) {
    btnOuvir.disabled = falando || !temVoz;
    btnPausar.disabled = !falando;
    btnParar.disabled = !falando;
    btnPausar.textContent = "❚❚ Pausar";
}

function falarBloco(i, id) {
    if (id !== voz.id) return;
    if (i >= voz.blocos.length) { estadoVoz(false); return; }
    const u = new SpeechSynthesisUtterance(voz.blocos[i]);
    u.lang = voz.lang;
    u.rate = Number(sliderVel.value);
    const v = escolherVoz(voz.lang);
    if (v) u.voice = v;
    u.onend = () => falarBloco(i + 1, id);
    u.onerror = (e) => { if (e.error !== "interrupted" && e.error !== "canceled") estadoVoz(false); };
    speechSynthesis.speak(u);
}

function ouvirResposta() {
    if (!temVoz || !ultimaResposta) return;
    pararVoz();
    voz.blocos = dividirTexto(ultimaResposta);
    voz.lang = ultimaLingua;
    estadoVoz(true);
    falarBloco(0, voz.id);
}

function pausarOuContinuar() {
    if (!temVoz) return;
    if (speechSynthesis.paused) { speechSynthesis.resume(); btnPausar.textContent = "❚❚ Pausar"; }
    else { speechSynthesis.pause(); btnPausar.textContent = "▶ Continuar"; }
}

function pararVoz() {
    voz.id++;
    if (temVoz) speechSynthesis.cancel();
    estadoVoz(false);
}

btnOuvir.addEventListener("click", ouvirResposta);
btnPausar.addEventListener("click", pausarOuContinuar);
btnParar.addEventListener("click", pararVoz);
window.addEventListener("beforeunload", () => { if (temVoz) speechSynthesis.cancel(); });

/* ---------- MODAL ---------- */
function fecharModal() { pararVoz(); modal.hidden = true; btnReabrir.hidden = false; }
function abrirModal() { modal.hidden = false; btnReabrir.hidden = true; campo.focus(); }
btnFechar.addEventListener("click", fecharModal);
btnReabrir.addEventListener("click", abrirModal);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) fecharModal(); });

/* ---------- ESPADA 3D ---------- */
const PECAS = [
    { classe: "pomo",   w: 14, d: 14, h: 14,  y: 0 },
    { classe: "cabo",   w: 8,  d: 8,  h: 38,  y: 14 },
    { classe: "guarda", w: 66, d: 10, h: 9,   y: 52 },
    { classe: "lamina", w: 16, d: 6,  h: 140, y: 61 }
];

function montarEspada() {
    const espada = $("espada");
    if (!espada) return;
    PECAS.forEach((p) => {
        const bloco = criar("div", "bloco " + p.classe);
        bloco.style.cssText = "--w:" + p.w + "px;--d:" + p.d + "px;--h:" + p.h + "px;top:" + p.y + "px";
        for (let i = 0; i < 4; i++) bloco.appendChild(document.createElement("i"));
        espada.appendChild(bloco);
    });
}

const cena = $("cena");
if (cena) {
    cena.addEventListener("pointermove", (e) => {
        const r = cena.getBoundingClientRect();
        cena.style.setProperty("--px", ((e.clientX - r.left) / r.width) * 100 + "%");
        cena.style.setProperty("--py", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
    cena.addEventListener("pointerleave", () => {
        cena.style.removeProperty("--px");
        cena.style.removeProperty("--py");
    });
}

/* ---------- BRASAS NO CANVAS ---------- */
function iniciarBrasas() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = $("brasas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0;
    const total = innerWidth < 600 ? 30 : 60;
    const brasas = [];

    function ajustar() { w = canvas.width = innerWidth; h = canvas.height = innerHeight; }
    function nova(inicio) {
        return {
            x: Math.random() * w,
            y: inicio ? Math.random() * h : h + Math.random() * 40,
            r: Math.random() * 2.2 + 0.5,
            vy: Math.random() * 0.9 + 0.2,
            vx: (Math.random() - 0.5) * 0.5,
            a: Math.random() * 0.7 + 0.2,
            fase: Math.random() * 6.28
        };
    }

    ajustar();
    addEventListener("resize", ajustar);
    for (let i = 0; i < total; i++) brasas.push(nova(true));

    function quadro() {
        if (!document.hidden) {
            ctx.clearRect(0, 0, w, h);
            brasas.forEach((b, i) => {
                b.fase += 0.02;
                b.y -= b.vy;
                b.x += b.vx + Math.sin(b.fase) * 0.4;
                b.a -= 0.0012;
                if (b.y < -10 || b.a <= 0) {
                    brasas[i] = nova(false);
                    return;
                }
                ctx.fillStyle = `rgba(255, 90, 10, ${Math.max(0, b.a)})`;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        requestAnimationFrame(quadro);
    }
    quadro();
}

/* ---------- INICIALIZAÇÃO ---------- */
document.addEventListener("DOMContentLoaded", () => {
    montarEspada();
    iniciarBrasas();
    renderHistorico();
});