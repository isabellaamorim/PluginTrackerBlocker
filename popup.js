document.addEventListener('DOMContentLoaded', function () {
    // Get elementos da interface (html)
    const statusBloqueio = document.getElementById('statusBloqueio');
    const historicoBloqueios = document.getElementById('historicoBloqueios');
    const dominioAdicionado = document.getElementById('novoDominio');
    const botaoAdicionar = document.getElementById('adicionarDominio');
    const listaDominiosPersonalizados = document.getElementById('listaDominiosPersonalizados');
    const toggleBloqueio = document.getElementById('toggleBloqueio');

    // Atualizar o status do bloqueio na interface e botão
    function atualizarEstadoBloqueio(bloqueioAtivo) {
        toggleBloqueio.textContent = bloqueioAtivo ? 'Desativar Bloqueio' : 'Ativar Bloqueio';
        dominioAdicionado.disabled = !bloqueioAtivo;
        botaoAdicionar.disabled = !bloqueioAtivo;
        statusBloqueio.textContent = bloqueioAtivo ? '' : 'Bloqueio está desativado.';

        mostrarHistoricoBloqueios();
    }

    // Get estado do bloqueio e atualiza interface
    browser.storage.local.get({ bloqueioAtivo: true }, function (result) {
        atualizarEstadoBloqueio(result.bloqueioAtivo);
    });

    // Alternar o estado do bloqueio ao clicar no botão
    toggleBloqueio.addEventListener('click', function () {
        browser.storage.local.get({ bloqueioAtivo: true }, function (result) {
            const novoEstado = !result.bloqueioAtivo;
            browser.storage.local.set({ bloqueioAtivo: novoEstado }, function () {
                atualizarEstadoBloqueio(novoEstado);
            });
        });
    });
  
    // Recuperar o histórico de bloqueios, agrupado por domínio
    function mostrarHistoricoBloqueios() {
        browser.storage.local.get({ bloqueios: [] }, function (result) {
            const bloqueios = result.bloqueios;

            // Agrupar bloqueios por domínio
            const dominioContagem = {};
            bloqueios.forEach(bloqueio => {
                const dominio = bloqueio.dominio;
                if (dominioContagem[dominio]) {
                    dominioContagem[dominio]++;
                } else {
                    dominioContagem[dominio] = 1;
                }
            });

            // Limpar a lista e mostrar histórico
            historicoBloqueios.innerHTML = Object.keys(dominioContagem).length === 0
                ? '<li>Nenhum rastreador bloqueado ainda.</li>'
                : '';
            for (const dominio in dominioContagem) {
                const li = document.createElement('li');
                li.textContent = `${dominio} - Bloqueado ${dominioContagem[dominio]} vez(es)`;
                historicoBloqueios.appendChild(li);
            }
        });
    }

    // Recuperar a lista de domínios adicionados pelo usuário
    function mostrarListaPersonalizados() {
        browser.storage.local.get({ dominiosPersonalizados: [] }, function (result) {
            const dominiosPersonalizados = result.dominiosPersonalizados;
            listaDominiosPersonalizados.innerHTML = '';
            dominiosPersonalizados.forEach(function (dominio) {
                const li = document.createElement('li');
                li.textContent = dominio;

                // Botão para remover domínio
                const botaoRemover = document.createElement('button');
                botaoRemover.textContent = 'Remover';
                botaoRemover.addEventListener('click', function () {
                    removerDominioPersonalizado(dominio);
                });
                
                li.appendChild(botaoRemover);
                listaDominiosPersonalizados.appendChild(li);
            });
        });
    }

    // Adicionar domínio personalizado
    function addDominioPersonalizado() {
        const novoDominio = dominioAdicionado.value.trim();
        if (novoDominio) {
            browser.storage.local.get({ dominiosPersonalizados: [] }, function (result) {
                const dominiosPersonalizados = result.dominiosPersonalizados;
                if (!dominiosPersonalizados.includes(novoDominio)) {
                    dominiosPersonalizados.push(novoDominio);
                    browser.storage.local.set({ dominiosPersonalizados: dominiosPersonalizados }, function () {
                        mostrarListaPersonalizados();
                        dominioAdicionado.value = '';
                    });
                } else {
                    alert('Domínio já adicionado.');
                }
            });
        }
    }

    // Remover domínio personalizado
    function removerDominioPersonalizado(dominio) {
        browser.storage.local.get({ dominiosPersonalizados: [] }, function (result) {
            const dominiosPersonalizados = result.dominiosPersonalizados;
            const index = dominiosPersonalizados.indexOf(dominio);
            if (index !== -1) {
                dominiosPersonalizados.splice(index, 1);
                browser.storage.local.set({ dominiosPersonalizados: dominiosPersonalizados }, function () {
                    mostrarListaPersonalizados();
                });
            }
        });
    }

    // Adicionar listener para o botão de adicionar domínio
    botaoAdicionar.addEventListener('click', addDominioPersonalizado);

    // Mostrar listas iniciais
    mostrarHistoricoBloqueios();
    mostrarListaPersonalizados();

    // Adicionar listener para atualizar histórico após bloqueio
    browser.runtime.onMessage.addListener(function (message) {
        if (message.action === 'atualizarHistorico') {
            mostrarHistoricoBloqueios();
        }
    });
});