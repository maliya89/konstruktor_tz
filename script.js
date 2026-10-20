(function () {
  "use strict";

  var form = document.getElementById("tz-form");
  var actionsList = document.getElementById("actions-list");
  var addActionBtn = document.getElementById("add-action");
  var clearBtn = document.getElementById("clear-btn");
  var copyBtn = document.getElementById("copy-btn");
  var copyStatus = document.getElementById("copy-status");
  var resultArea = document.getElementById("result");
  var actionCounter = 0;
  var lastBuiltDocument = "";

  function trim(value) {
    return String(value || "").trim();
  }

  function hasText(value) {
    return trim(value).length > 0;
  }

  function getRadioValue(name) {
    var selected = form.querySelector('input[name="' + name + '"]:checked');
    return selected ? selected.value : "";
  }

  function createActionRow(value) {
    actionCounter += 1;
    var id = "action-" + actionCounter;
    var row = document.createElement("div");
    row.className = "action-row";
    row.dataset.actionRow = "true";

    var input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.name = "actions[]";
    input.autocomplete = "off";
    input.placeholder = "Например: добавить привычку";
    if (value) {
      input.value = value;
    }

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-danger";
    removeBtn.textContent = "Удалить";
    removeBtn.setAttribute("aria-label", "Удалить действие");
    removeBtn.addEventListener("click", function () {
      var rows = actionsList.querySelectorAll('[data-action-row="true"]');
      if (rows.length <= 1) {
        input.value = "";
        input.focus();
        return;
      }
      row.remove();
      updateRemoveButtons();
    });

    row.appendChild(input);
    row.appendChild(removeBtn);
    return row;
  }

  function updateRemoveButtons() {
    var rows = actionsList.querySelectorAll('[data-action-row="true"]');
    rows.forEach(function (row) {
      var btn = row.querySelector("button");
      if (!btn) return;
      btn.disabled = rows.length <= 1;
      btn.title = rows.length <= 1
        ? "Нужно хотя бы одно поле действия"
        : "Удалить действие";
    });
  }

  function addAction(value) {
    actionsList.appendChild(createActionRow(value || ""));
    updateRemoveButtons();
  }

  function getActions() {
    var inputs = actionsList.querySelectorAll('input[name="actions[]"]');
    var values = [];
    inputs.forEach(function (input) {
      var value = trim(input.value);
      if (value) {
        values.push(value);
      }
    });
    return values;
  }

  function clearFieldErrors() {
    form.querySelectorAll(".field.has-error").forEach(function (field) {
      field.classList.remove("has-error");
    });
    form.querySelectorAll(".error").forEach(function (error) {
      error.hidden = true;
      error.textContent = "";
    });
  }

  function showError(fieldEl, errorId, message, focusTarget) {
    var field = fieldEl
      ? (fieldEl.classList && fieldEl.classList.contains("field")
        ? fieldEl
        : fieldEl.closest(".field"))
      : null;
    var error = document.getElementById(errorId);
    if (field) {
      field.classList.add("has-error");
    }
    if (error) {
      error.hidden = false;
      error.textContent = message;
    }
    return focusTarget || null;
  }

  function validate() {
    clearFieldErrors();

    var firstInvalid = null;

    function remember(target) {
      if (!firstInvalid && target) {
        firstInvalid = target;
      }
    }

    var idea = document.getElementById("product-idea");
    if (!hasText(idea.value)) {
      remember(showError(
        idea,
        "error-product-idea",
        "Опишите, что хотите создать.",
        idea
      ));
    }

    var productType = getRadioValue("productType");
    var firstType = form.querySelector('input[name="productType"]');
    if (!productType) {
      remember(showError(
        firstType,
        "error-product-type",
        "Выберите тип продукта.",
        firstType
      ));
    }

    var audience = document.getElementById("audience");
    if (!hasText(audience.value)) {
      remember(showError(
        audience,
        "error-audience",
        "Укажите, для кого создаётся продукт.",
        audience
      ));
    }

    var userTask = document.getElementById("user-task");
    if (!hasText(userTask.value)) {
      remember(showError(
        userTask,
        "error-user-task",
        "Опишите задачу пользователя.",
        userTask
      ));
    }

    var actions = getActions();
    var firstActionInput = actionsList.querySelector('input[name="actions[]"]');
    if (actions.length === 0) {
      remember(showError(
        document.getElementById("actions-field"),
        "error-actions",
        "Добавьте хотя бы одно основное действие пользователя.",
        firstActionInput
      ));
    }

    return {
      valid: !firstInvalid,
      firstInvalid: firstInvalid
    };
  }

  function asParagraph(value) {
    return trim(value);
  }

  function asBulletList(items) {
    return items.map(function (item) {
      return "- " + item;
    }).join("\n");
  }

  function preserveMultiline(value) {
    return trim(value);
  }

  function buildDocument(data) {
    var lines = [];
    var questions = [];

    function pushSection(title) {
      lines.push("## " + title);
      lines.push("");
    }

    function pushText(text) {
      lines.push(text);
      lines.push("");
    }

    function pushOrQuestion(text, question) {
      if (hasText(text)) {
        pushText(preserveMultiline(text));
      } else {
        pushText("Требуется уточнение.");
        questions.push(question);
      }
    }

    var projectName = asParagraph(data.projectName);
    var title = projectName || "Продукт без названия";

    lines.push("# " + title);
    lines.push("");

    // 1. Название и описание продукта
    pushSection("1. Название и описание продукта");
    if (projectName) {
      lines.push("**Название:** " + projectName);
      lines.push("");
    } else {
      questions.push("Какое название у проекта?");
    }
    lines.push("**Тип продукта:** " + data.productType);
    lines.push("");
    lines.push("**Описание:**");
    lines.push(preserveMultiline(data.productIdea));
    lines.push("");

    // 2. Целевая аудитория
    pushSection("2. Целевая аудитория");
    pushText(preserveMultiline(data.audience));

    // 3. Задача и ожидаемый результат
    pushSection("3. Задача и ожидаемый результат");
    lines.push("**Задача пользователя:**");
    lines.push(preserveMultiline(data.userTask));
    lines.push("");
    if (hasText(data.outputResult)) {
      lines.push("**Ожидаемый результат для пользователя:**");
      lines.push(preserveMultiline(data.outputResult));
      lines.push("");
    } else {
      lines.push("**Ожидаемый результат для пользователя:** требуется уточнение.");
      lines.push("");
      questions.push("Какой результат пользователь должен получать?");
    }

    // 4. Состав первой версии
    pushSection("4. Состав первой версии");
    lines.push("Основные действия пользователя:");
    lines.push(asBulletList(data.actions));
    lines.push("");
    if (data.actions.length < 3) {
      questions.push("Какие ещё 3–5 основных действий нужны в первой версии?");
    }

    // 5. Основной пользовательский сценарий
    pushSection("5. Основной пользовательский сценарий");
    // Сценарий явно не собирается формой — не выдумываем последовательность
    pushText("Последовательность действий пользователя не описана и требует уточнения.");
    questions.push("Каков основной пользовательский сценарий по шагам?");

    // 6. Страницы, экраны или разделы
    pushSection("6. Страницы, экраны или разделы");
    pushOrQuestion(data.pages, "Какие страницы, экраны или разделы нужны в первой версии?");

    // 7. Вводимые данные и результаты
    pushSection("7. Вводимые данные и результаты");
    if (hasText(data.inputData)) {
      lines.push("**Вводимые данные:**");
      lines.push(preserveMultiline(data.inputData));
      lines.push("");
    } else {
      lines.push("**Вводимые данные:** требуется уточнение.");
      lines.push("");
      questions.push("Какие данные пользователь вводит?");
    }
    if (hasText(data.outputResult)) {
      lines.push("**Результаты:**");
      lines.push(preserveMultiline(data.outputResult));
      lines.push("");
    } else {
      lines.push("**Результаты:** требуется уточнение.");
      lines.push("");
      if (questions.indexOf("Какой результат пользователь должен получать?") === -1) {
        questions.push("Какой результат пользователь должен получать?");
      }
    }

    // 8. Регистрация, оплата, сохранение данных и AI
    pushSection("8. Регистрация, оплата, сохранение данных и AI");
    lines.push("- Регистрация / вход: " + data.needAuth);
    lines.push("- Оплата: " + data.needPayment);
    lines.push("- Сохранение данных: " + data.needStorage);
    lines.push("- AI: " + data.needAi);
    lines.push("");

    if (data.needAuth === "Пока не знаю") {
      questions.push("Нужна ли регистрация или вход пользователя?");
    }
    if (data.needPayment === "Пока не знаю") {
      questions.push("Нужна ли оплата в первой версии?");
    }
    if (data.needStorage === "Пока не знаю") {
      questions.push("Нужно ли сохранение данных между сеансами?");
    }
    if (data.needAi === "Пока не знаю") {
      questions.push("Нужны ли функции на основе AI в первой версии?");
    }

    if (data.needAuth === "Да") {
      lines.push("Важно: отдельно определить сервис авторизации и способ безопасного подключения. Не запрашивать и не хранить пароли, токены или секретные ключи в открытом виде в задании.");
      lines.push("");
    }
    if (data.needPayment === "Да") {
      lines.push("Важно: отдельно определить платёжный сервис и способ безопасного подключения. Не запрашивать секретные ключи в открытом виде.");
      lines.push("");
    }
    if (data.needAi === "Да") {
      lines.push("Важно: отдельно определить AI-сервис и способ безопасного подключения. Не запрашивать API-ключи или токены в открытом виде.");
      lines.push("");
    }
    if (data.needStorage === "Да") {
      lines.push("Важно: отдельно определить, где и как сохраняются данные, и требования к безопасности хранения.");
      lines.push("");
    }

    // 9. Дизайн и адаптивность
    pushSection("9. Дизайн и адаптивность");
    if (hasText(data.designWish)) {
      lines.push("**Стиль, цвета и настроение:**");
      lines.push(preserveMultiline(data.designWish));
      lines.push("");
    } else {
      lines.push("**Стиль, цвета и настроение:** требуется уточнение.");
      lines.push("");
      questions.push("Какой стиль, цвета и настроение нужны продукту?");
    }
    if (hasText(data.references)) {
      lines.push("**Референсы:**");
      lines.push(preserveMultiline(data.references));
      lines.push("");
    } else {
      lines.push("**Референсы:** не указаны.");
      lines.push("");
    }
    lines.push("**Где будут пользоваться:** " + (data.device || "не указано"));
    lines.push("");
    if (!data.device) {
      questions.push("Где будут пользоваться продуктом: компьютер, телефон или оба?");
    }

    // 10. Технологии и ограничения
    pushSection("10. Технологии и ограничения");
    if (hasText(data.technologies)) {
      lines.push("**Технологии / платформа:**");
      lines.push(preserveMultiline(data.technologies));
      lines.push("");
    } else {
      pushText("Предложи подходящие технологии и объясни выбор перед реализацией.");
    }
    if (hasText(data.constraints)) {
      lines.push("**Дополнительные ограничения и пожелания:**");
      lines.push(preserveMultiline(data.constraints));
      lines.push("");
    } else {
      lines.push("**Дополнительные ограничения и пожелания:** не указаны.");
      lines.push("");
    }

    // 11. Что не входит в первую версию
    pushSection("11. Что не входит в первую версию");
    pushOrQuestion(
      data.outOfScope,
      "Что сознательно не входит в первую версию?"
    );

    // 12. Критерии приёмки
    pushSection("12. Критерии приёмки");
    if (hasText(data.successSign)) {
      lines.push("**Как пользователь поймёт, что продукт работает:**");
      lines.push(preserveMultiline(data.successSign));
      lines.push("");
    } else {
      lines.push("**Как пользователь поймёт, что продукт работает:** требуется уточнение.");
      lines.push("");
      questions.push("Как пользователь поймёт, что продукт работает?");
    }
    if (hasText(data.mustWork)) {
      lines.push("**Обязательные успешные действия:**");
      lines.push(preserveMultiline(data.mustWork));
      lines.push("");
    } else {
      lines.push("**Обязательные успешные действия:** требуется уточнение.");
      lines.push("");
      questions.push("Какие действия обязательно должны успешно выполняться?");
    }

    // 13. Вопросы, которые нужно уточнить
    pushSection("13. Вопросы, которые нужно уточнить");
    if (questions.length > 0) {
      // Убираем дубликаты, сохраняя порядок
      var unique = [];
      questions.forEach(function (q) {
        if (unique.indexOf(q) === -1) {
          unique.push(q);
        }
      });
      lines.push(asBulletList(unique));
      lines.push("");
    } else {
      pushText("Существенных неопределённостей по заполненным полям не отмечено. Перед реализацией всё равно перепроверьте объём первой версии.");
    }

    // 14. Инструкция приложению для разработки
    pushSection("14. Инструкция приложению для разработки");
    pushText("Сначала изучи требования. Если есть существенные неопределённости, задай уточняющие вопросы. Затем предложи план реализации первой версии. Не добавляй функции вне согласованного объёма. После реализации объясни, как запустить проект и проверить критерии приёмки. Не выполняй публикацию, commit или push без отдельной команды.");

    return lines.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  function collectData() {
    return {
      projectName: document.getElementById("project-name").value,
      productIdea: document.getElementById("product-idea").value,
      productType: getRadioValue("productType"),
      audience: document.getElementById("audience").value,
      userTask: document.getElementById("user-task").value,
      actions: getActions(),
      pages: document.getElementById("pages").value,
      inputData: document.getElementById("input-data").value,
      outputResult: document.getElementById("output-result").value,
      needAuth: getRadioValue("needAuth") || "Пока не знаю",
      needPayment: getRadioValue("needPayment") || "Пока не знаю",
      needStorage: getRadioValue("needStorage") || "Пока не знаю",
      needAi: getRadioValue("needAi") || "Пока не знаю",
      outOfScope: document.getElementById("out-of-scope").value,
      designWish: document.getElementById("design-wish").value,
      references: document.getElementById("references").value,
      device: getRadioValue("device"),
      technologies: document.getElementById("technologies").value,
      constraints: document.getElementById("constraints").value,
      successSign: document.getElementById("success-sign").value,
      mustWork: document.getElementById("must-work").value
    };
  }

  function formHasData() {
    var textFields = form.querySelectorAll('input[type="text"], textarea');
    for (var i = 0; i < textFields.length; i += 1) {
      if (hasText(textFields[i].value)) {
        return true;
      }
    }
    if (getRadioValue("productType")) {
      return true;
    }
    var defaultsUnknown = ["needAuth", "needPayment", "needStorage", "needAi"];
    for (var j = 0; j < defaultsUnknown.length; j += 1) {
      if (getRadioValue(defaultsUnknown[j]) !== "Пока не знаю") {
        return true;
      }
    }
    if (getRadioValue("device") && getRadioValue("device") !== "Оба") {
      return true;
    }
    if (hasText(resultArea.value)) {
      return true;
    }
    return false;
  }

  function clearCopyStatus() {
    copyStatus.hidden = true;
    copyStatus.textContent = "";
    copyStatus.classList.remove("is-manual");
  }

  function showCopyStatus(message, isManual) {
    copyStatus.hidden = false;
    copyStatus.textContent = message;
    if (isManual) {
      copyStatus.classList.add("is-manual");
    } else {
      copyStatus.classList.remove("is-manual");
    }
  }

  function updateCopyButtonState() {
    copyBtn.disabled = !hasText(resultArea.value);
  }

  function selectResultText() {
    resultArea.focus();
    resultArea.select();
    try {
      resultArea.setSelectionRange(0, resultArea.value.length);
    } catch (error) {
      // Некоторые окружения не поддерживают setSelectionRange для textarea.
    }
  }

  function copyWithExecCommand() {
    selectResultText();
    try {
      return Boolean(document.execCommand("copy"));
    } catch (error) {
      return false;
    }
  }

  function copyResultText() {
    var text = resultArea.value;
    if (!hasText(text)) {
      updateCopyButtonState();
      clearCopyStatus();
      return;
    }

    clearCopyStatus();

    function onSuccess() {
      showCopyStatus("ТЗ скопировано", false);
    }

    function onManualFallback() {
      selectResultText();
      showCopyStatus(
        "Автоматическое копирование недоступно. Текст выделен — скопируйте вручную: Ctrl+C (на Mac: ⌘C).",
        true
      );
    }

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(text).then(onSuccess).catch(function () {
        if (copyWithExecCommand()) {
          onSuccess();
        } else {
          onManualFallback();
        }
      });
      return;
    }

    if (copyWithExecCommand()) {
      onSuccess();
    } else {
      onManualFallback();
    }
  }

  function resetForm() {
    form.reset();
    actionsList.innerHTML = "";
    actionCounter = 0;
    addAction("");
    clearFieldErrors();
    resultArea.value = "";
    lastBuiltDocument = "";
    clearCopyStatus();
    updateCopyButtonState();
    document.getElementById("project-name").focus();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var validation = validate();
    if (!validation.valid) {
      if (validation.firstInvalid && typeof validation.firstInvalid.focus === "function") {
        validation.firstInvalid.focus();
        if (typeof validation.firstInvalid.scrollIntoView === "function") {
          validation.firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    var currentResult = resultArea.value;
    var hasManualEdits =
      hasText(currentResult) &&
      currentResult !== lastBuiltDocument;

    if (hasText(currentResult)) {
      var message = hasManualEdits
        ? "Готовое ТЗ будет собрано заново. Ручные правки в поле результата будут заменены. Продолжить?"
        : "Собрать ТЗ заново? Текущий текст в поле результата будет заменён.";
      if (!window.confirm(message)) {
        return;
      }
    }

    var documentText = buildDocument(collectData());
    resultArea.value = documentText;
    lastBuiltDocument = documentText;
    clearCopyStatus();
    updateCopyButtonState();
    resultArea.focus();
    resultArea.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  clearBtn.addEventListener("click", function () {
    if (formHasData()) {
      var ok = window.confirm("Очистить все ответы и готовое ТЗ? Это действие нельзя отменить.");
      if (!ok) {
        return;
      }
    }
    resetForm();
  });

  copyBtn.addEventListener("click", function () {
    copyResultText();
  });

  resultArea.addEventListener("input", function () {
    clearCopyStatus();
    updateCopyButtonState();
  });

  addActionBtn.addEventListener("click", function () {
    addAction("");
    var inputs = actionsList.querySelectorAll('input[name="actions[]"]');
    var last = inputs[inputs.length - 1];
    if (last) {
      last.focus();
    }
  });

  // Старт: одно пустое действие
  addAction("");
  updateCopyButtonState();
})();
