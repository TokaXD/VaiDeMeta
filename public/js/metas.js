$(document).ready(function () {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = JSON.parse(userStr);

  let metasData = [];
  let deadlineChart;

  function loadMetas() {
    $.ajax({
      url: `/api/metas?userId=${user.id}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      success: function (data) {
        metasData = data;
        applyFilters();
        updateDeadlineChart();
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

  function updateDeadlineChart() {
    const ctx = document.getElementById("deadlineChart").getContext("2d");
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingMetas = metasData
      .filter((meta) => !meta.concluida && meta.data_vencimento)
      .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento))
      .slice(0, 5);

    if (deadlineChart) {
      deadlineChart.destroy();
    }

    deadlineChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: upcomingMetas.map((meta) => meta.titulo),
        datasets: [
          {
            label: "Dias até o vencimento",
            data: upcomingMetas.map((meta) => {
              const daysUntilDeadline = Math.ceil(
                (new Date(meta.data_vencimento) - today) / (1000 * 60 * 60 * 24)
              );
              return daysUntilDeadline;
            }),
            backgroundColor: upcomingMetas.map((meta) => {
              const daysUntilDeadline = Math.ceil(
                (new Date(meta.data_vencimento) - today) / (1000 * 60 * 60 * 24)
              );
              if (daysUntilDeadline <= 0) return "#dc3545";
              if (daysUntilDeadline <= 3) return "#ffc107";
              return "#28a745";
            }),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Dias até o vencimento",
            },
          },
        },
      },
    });
  }

  function applyFilters() {
    const searchTerm = $("#searchInput").val().toLowerCase();
    const statusFilter = $("#statusFilter").val();
    const deadlineFilter = $("#deadlineFilter").val();
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate()
    );

    let filteredMetas = metasData.filter((meta) => {
      const matchesSearch =
        meta.titulo.toLowerCase().includes(searchTerm) ||
        (meta.descricao && meta.descricao.toLowerCase().includes(searchTerm));

      let matchesStatus = true;
      if (statusFilter === "pendentes") matchesStatus = !meta.concluida;
      if (statusFilter === "concluidas") matchesStatus = meta.concluida;

      let matchesDeadline = true;
      if (meta.data_vencimento) {
        const deadlineDate = new Date(meta.data_vencimento);
        if (deadlineFilter === "hoje") {
          matchesDeadline =
            deadlineDate.toDateString() === today.toDateString();
        } else if (deadlineFilter === "semana") {
          matchesDeadline = deadlineDate <= nextWeek && deadlineDate >= today;
        } else if (deadlineFilter === "mes") {
          matchesDeadline = deadlineDate <= nextMonth && deadlineDate >= today;
        }
      }

      return matchesSearch && matchesStatus && matchesDeadline;
    });

    renderMetas(filteredMetas);
  }

  function renderMetas(metas) {
    const metasList = $("#metasList");
    metasList.empty();

    metas.forEach((meta) => {
      const deadlineStr = meta.data_vencimento
        ? new Date(meta.data_vencimento).toLocaleDateString("pt-BR")
        : "Sem prazo";

      const metaElement = $(`
        <div class="meta-item ${meta.concluida ? "completed" : ""} ${
        isOverdue(meta) ? "overdue" : ""
      }">
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

  function isOverdue(meta) {
    if (!meta.data_vencimento || meta.concluida) return false;
    return new Date(meta.data_vencimento) < new Date();
  }

  // Filtros
  $("#searchInput").on("input", applyFilters);
  $("#statusFilter").on("change", applyFilters);
  $("#deadlineFilter").on("change", applyFilters);

  // Adicionar nova meta
  $("#addMetaBtn").on("click", function () {
    Swal.fire({
      title: "Nova Meta",
      html: `
        <input id="titulo" class="swal2-input" placeholder="Título">
        <textarea id="descricao" class="swal2-textarea" placeholder="Descrição"></textarea>
        <input id="data_vencimento" type="date" class="swal2-input">
      `,
      showCancelButton: true,
      confirmButtonText: "Salvar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const titulo = document.getElementById("titulo").value;
        const descricao = document.getElementById("descricao").value;
        const data_vencimento =
          document.getElementById("data_vencimento").value;
        return { titulo, descricao, data_vencimento };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const { titulo, descricao, data_vencimento } = result.value;
        $.ajax({
          url: "/api/metas",
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: JSON.stringify({
            titulo,
            descricao,
            data_vencimento,
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

  // Ação de concluir/desfazer meta (atualizada)
  $("#metasList").on("click", ".toggle-status", async function () {
    const metaId = $(this).data("id");
    const meta = metasData.find((m) => m.id === metaId);
    const isCompleting = !meta.concluida; // Se a meta não estiver concluída, a ação é concluir

    if (isCompleting) {
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
        data: JSON.stringify({
          ...meta,
          concluida: !meta.concluida,
        }),
        contentType: "application/json",
      });

      // Se for ação de concluir, chama a API da IA
      if (isCompleting) {
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

        Swal.close();

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

  // Excluir meta
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

  // Editar meta
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
        <input id="data_vencimento" type="date" class="swal2-input" value="${
          meta.data_vencimento || ""
        }">
      `,
      showCancelButton: true,
      confirmButtonText: "Salvar",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const titulo = document.getElementById("titulo").value;
        const descricao = document.getElementById("descricao").value;
        const data_vencimento =
          document.getElementById("data_vencimento").value;
        return { titulo, descricao, data_vencimento };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const { titulo, descricao, data_vencimento } = result.value;
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
            data_vencimento,
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
});
