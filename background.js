let domainsEasyPrivacy = []
let bloqueioAtivo = true;
let dominiosPersonalizados = [];
 
// Importando a lista de domínios extraídos de EasyPrivacy
// Acesso a lista em: https://easylist.to/easylist/easyprivacy.txt
// A lista foi convertida para JSON e está disponível em: domains.json

fetch(browser.runtime.getURL('domains.json'))
    .then(response => response.json())
    .then(data => {
        domainsEasyPrivacy = data;
    })
    .catch((error) => {
        console.error('Erro ao carregar a lista de domínios:', error);
    });

// Função para registrar o domínio bloqueado
function salvarBloqueio(hostname) {
    // Recuperar a lista atual de bloqueios
    browser.storage.local.get({ bloqueios: [] }, function (result) {
        let bloqueios = result.bloqueios;

        // Adicionar o domínio bloqueado à lista
        bloqueios.push({
            dominio: hostname,
            dataHora: new Date().toISOString()
        });

        // Salvar a lista atualizada no storage
        browser.storage.local.set({ bloqueios: bloqueios }, function () {
            console.log(`Domínio ${hostname} bloqueado.`);

            // Enviar mensagem para o popup.js atualizar o histórico
            browser.runtime.sendMessage({ action: 'atualizarHistorico' });
        });
    });
}

// Atualizar configurações de Storage Local
function atualizarConfigs() {
    browser.storage.local.get({ bloqueioAtivo: true, dominiosPersonalizados: [] }, (result) => {
        bloqueioAtivo = result.bloqueioAtivo;
        dominiosPersonalizados = result.dominiosPersonalizados;
    });
}

// Configuração iniciais 
atualizarConfigs();

// Adicionando listener para alterações no storage
browser.storage.onChanged.addListener(atualizarConfigs);

// Adicionando listener para bloquear requests
browser.webRequest.onBeforeRequest.addListener(
    function(details) {
        const domain = new URL(details.url).hostname;

        if (!bloqueioAtivo) {

            // Se o bloqueio estiver desativado, ignora
            console.log(`Bloqueio ignorado para o domínio ${domain} porque o bloqueio está desativado.`);
            return { cancel: false };
        }
        
        // Se o bloqueio estiver ativo, verifica se o domínio está na lista e bloqueia
        if (domainsEasyPrivacy.includes(domain) || dominiosPersonalizados.includes(domain)) {
            // Registrar o domínio bloqueado
            salvarBloqueio(domain);
            console.log(`Domínio ${domain} bloqueado.`);
            return { cancel: true };
        }
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);



