$(document).ready(function () {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");

  const user = JSON.parse(userStr);

  function initializeDashboard() {
    let metasData = [];
    let metasChart;

    function loadMetas() {
      $.ajax({
        url: `/api/metas?userId=${user.id}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        success: function (data) {
          metasData = data;
          updateDashboard();
          renderMetas();
        },
        error: function (xhr) {
          Swal.fire({
            icon: "error",
            title: "Erro!",
            text: "Não foi possível carregar as metas.",
          });
        },
      });
    }

    function updateDashboard() {
      const total = metasData.length;
      const concluidas = metasData.filter((meta) => meta.concluida).length;
      const pendentes = total - concluidas;

      $("#totalMetas").text(total);
      $("#metasConcluidas").text(concluidas);
      $("#metasPendentes").text(pendentes);

      updateChart(concluidas, pendentes);
      updateUpcomingGoals();
    }

    function updateUpcomingGoals() {
      const upcomingGoalsTable = $("#upcomingGoalsTable tbody");
      upcomingGoalsTable.empty();

      const today = new Date();
      const upcomingMetas = metasData
        .filter((meta) => !meta.concluida && meta.data_vencimento)
        .sort(
          (a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento)
        )
        .slice(0, 5);

      upcomingMetas.forEach((meta) => {
        const dueDate = new Date(meta.data_vencimento);
        const daysUntilDue = Math.ceil(
          (dueDate - today) / (1000 * 60 * 60 * 24)
        );
        let status = "";

        if (daysUntilDue <= 0) {
          status = "<span class='status-atrasada'>Atrasada</span>";
        } else if (daysUntilDue <= 3) {
          status = "<span class='status-urgente'>Urgente</span>";
        } else {
          status = "<span class='status-pendente'>Pendente</span>";
        }

        const row = $(`
          <tr>
            <td>${meta.titulo}</td>
            <td>${meta.descricao || "-"}</td>
            <td>${new Date(meta.data_vencimento).toLocaleDateString(
              "pt-BR"
            )}</td>
            <td>${status}</td>
          </tr>
        `);

        upcomingGoalsTable.append(row);
      });
    }

    function updateChart(concluidas, pendentes) {
      const ctx = document.getElementById("metasChart").getContext("2d");

      if (metasChart) {
        metasChart.destroy();
      }

      metasChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Concluídas", "Pendentes"],
          datasets: [
            {
              data: [concluidas, pendentes],
              backgroundColor: ["#4CAF50", "#FFA726"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    }

    function renderMetas() {
      const metasList = $("#metasList");
      metasList.empty();

      metasData.forEach((meta) => {
        const deadlineStr = meta.data_vencimento
          ? new Date(meta.data_vencimento).toLocaleDateString("pt-BR")
          : "Sem prazo";

        const metaElement = $(`
                <div class="meta-item ${meta.concluida ? "completed" : ""}">
                    <div class="meta-content">
                        <h3>${meta.titulo}</h3>
                        <p>${meta.descricao || ""}</p>
                        <p class="meta-deadline">Vencimento: ${deadlineStr}</p>
                    </div>
                    <div class="meta-actions">
                        <button class="toggle-status" data-id="${meta.id}">
                            ${meta.concluida ? "Desfazer" : "Concluir"}
                        </button>
                        <button class="edit-meta" data-id="${meta.id}">
                            Editar
                        </button>
                        <button class="delete-meta" data-id="${meta.id}">
                            Excluir
                        </button>
                    </div>
                </div>
            `);

        metasList.append(metaElement);
      });
    }

    // Event handler for adding new meta
    $("#addMetaBtn").on("click", function () {
      Swal.fire({
        title: "Nova Meta",
        html: `
          <input id="titulo" class="swal2-input" placeholder="Título">
          <textarea id="descricao" class="swal2-textarea" placeholder="Descrição"></textarea>
        `,
        showCancelButton: true,
        confirmButtonText: "Salvar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          const titulo = document.getElementById("titulo").value;
          const descricao = document.getElementById("descricao").value;
          return { titulo, descricao };
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const { titulo, descricao } = result.value;
          $.ajax({
            url: "/api/metas",
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            data: JSON.stringify({
              titulo,
              descricao,
              user_id: user.id,
            }),
            contentType: "application/json",
            success: function () {
              Swal.fire("Sucesso!", "Meta criada com sucesso!", "success");
              loadMetas();
            },
            error: function () {
              Swal.fire("Erro!", "Não foi possível criar a meta.", "error");
            },
          });
        }
      });
    });

    // Event handlers for meta actions
    $("#metasList").on("click", ".toggle-status", async function () {
      const metaId = $(this).data("id");
      const meta = metasData.find((m) => m.id === metaId);
      console.log(meta);

      // Se a meta não está concluída, a ação é concluir e deve exibir o loading
      const isConcluir = !meta.concluida;

      if (isConcluir) {
        Swal.fire({
          title: "Processando...",
          html: "Gerando mensagem personalizada...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
      }

      try {
        // Atualiza o status da meta
        await $.ajax({
          url: `/api/metas/${metaId}`,
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          data: JSON.stringify({ ...meta, concluida: !meta.concluida }),
          contentType: "application/json",
        });

        // Se a ação for concluir (e não desfazer), chama a API da IA
        if (isConcluir) {
          const response = await $.ajax({
            url: `/api/ai/completion-message`,
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            data: JSON.stringify({
              deadline: meta.data_vencimento,
              user: user.name,
              titulo: meta.titulo,
            }),
            contentType: "application/json",
          });

          Swal.close(); // Fecha o popup de loading

          const dueDate = new Date(meta.data_vencimento);
          const today = new Date();
          const isLate = dueDate < today;

          Swal.fire({
            title: "Meta Concluída!",
            text: response.message,
            icon: isLate ? "warning" : "success",
            iconHtml: isLate ? '<i class="fas fa-angry"></i>' : undefined,
          });
        }

        loadMetas();
      } catch (error) {
        Swal.close();
        Swal.fire("Erro!", "Não foi possível atualizar a meta.", "error");
      }
    });

    $("#metasList").on("click", ".delete-meta", function () {
      const metaId = $(this).data("id");
      Swal.fire({
        title: "Tem certeza?",
        text: "Esta ação não pode ser desfeita!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          $.ajax({
            url: `/api/metas/${metaId}`,
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            success: function () {
              loadMetas();
              Swal.fire("Sucesso!", "Meta excluída com sucesso!", "success");
            },
            error: function () {
              Swal.fire("Erro!", "Não foi possível excluir a meta.", "error");
            },
          });
        }
      });
    });

    $("#metasList").on("click", ".edit-meta", function () {
      const metaId = $(this).data("id");
      const meta = metasData.find((m) => m.id === metaId);

      Swal.fire({
        title: "Editar Meta",
        html: `
          <input id="titulo" class="swal2-input" value="${
            meta.titulo
          }" placeholder="Título">
          <textarea id="descricao" class="swal2-textarea" placeholder="Descrição">${
            meta.descricao || ""
          }</textarea>
        `,
        showCancelButton: true,
        confirmButtonText: "Salvar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          const titulo = document.getElementById("titulo").value;
          const descricao = document.getElementById("descricao").value;
          return { titulo, descricao };
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const { titulo, descricao } = result.value;
          $.ajax({
            url: `/api/metas/${metaId}`,
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            data: JSON.stringify({
              ...meta,
              titulo,
              descricao,
            }),
            contentType: "application/json",
            success: function () {
              loadMetas();
              Swal.fire("Sucesso!", "Meta atualizada com sucesso!", "success");
            },
            error: function () {
              Swal.fire("Erro!", "Não foi possível atualizar a meta.", "error");
            },
          });
        }
      });
    });

    loadMetas();
  }

  initializeDashboard();
});
