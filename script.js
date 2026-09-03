const header = document.querySelector("[data-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const faqSection = document.querySelector("#faq");
const currentSiteScript = document.currentScript;
const getSiteAssetUrl = (assetPath) =>
  currentSiteScript ? new URL(assetPath, currentSiteScript.src).href : assetPath;

const heroSection = document.querySelector(".hero");

if (
  heroSection
  && typeof HTMLCanvasElement !== "undefined"
  && typeof ResizeObserver !== "undefined"
  && typeof IntersectionObserver !== "undefined"
) {
  const waveCanvas = document.createElement("canvas");
  const waveContext = waveCanvas.getContext("2d", { alpha: true, desynchronized: true });

  if (waveContext) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileViewport = window.matchMedia("(max-width: 700px)");
    const saveData = navigator.connection?.saveData === true;
    const frameInterval = 1000 / 30;
    let canvasWidth = 0;
    let canvasHeight = 0;
    let pixelRatio = 1;
    let animationFrame = 0;
    let lastFrameTime = 0;
    let heroIsVisible = true;

    waveCanvas.className = "hero-wave-canvas";
    waveCanvas.setAttribute("aria-hidden", "true");
    heroSection.prepend(waveCanvas);

    function drawWaveBundle(options, time) {
      const {
        startX,
        endX,
        baseY,
        amplitude,
        slope,
        frequency,
        speed,
        count,
        spacing,
      } = options;
      const blueGradient = waveContext.createLinearGradient(startX, 0, endX, 0);
      const goldGradient = waveContext.createLinearGradient(startX, 0, endX, 0);

      blueGradient.addColorStop(0, "rgb(22 119 255 / 0)");
      blueGradient.addColorStop(0.22, "rgb(22 119 255 / 0.3)");
      blueGradient.addColorStop(0.62, "rgb(76 156 255 / 0.72)");
      blueGradient.addColorStop(0.82, "rgb(238 238 238 / 0.52)");
      blueGradient.addColorStop(1, "rgb(22 119 255 / 0)");
      goldGradient.addColorStop(0, "rgb(246 183 60 / 0)");
      goldGradient.addColorStop(0.55, "rgb(246 183 60 / 0.35)");
      goldGradient.addColorStop(1, "rgb(246 183 60 / 0)");

      for (let lineIndex = 0; lineIndex < count; lineIndex += 1) {
        const centeredLine = lineIndex - (count - 1) / 2;
        const highlighted = lineIndex % 9 === 0;
        const accentLine = lineIndex % 13 === 0;
        const phaseOffset = centeredLine * 0.075;

        waveContext.beginPath();

        for (let step = 0; step <= 42; step += 1) {
          const progress = step / 42;
          const envelope = Math.sin(progress * Math.PI);
          const x = startX + (endX - startX) * progress;
          const spread = centeredLine * spacing * (0.4 + progress * 0.6);
          const motion = Math.sin(progress * frequency + time * speed + phaseOffset);
          const y = baseY + slope * (progress - 0.5) + spread + amplitude * envelope * motion;

          if (step === 0) waveContext.moveTo(x, y);
          else waveContext.lineTo(x, y);
        }

        waveContext.globalAlpha = highlighted ? 0.82 : 0.34;
        waveContext.lineWidth = highlighted ? 1.2 : 0.55;
        waveContext.strokeStyle = accentLine ? goldGradient : blueGradient;
        waveContext.shadowBlur = highlighted ? 4 : 0;
        waveContext.shadowColor = accentLine ? "rgb(246 183 60 / 0.3)" : "rgb(22 119 255 / 0.45)";
        waveContext.stroke();
      }
    }

    function drawWaveFrame(timestamp = 0) {
      const isMobile = mobileViewport.matches;
      const time = timestamp * 0.001;

      waveContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      waveContext.clearRect(0, 0, canvasWidth, canvasHeight);
      waveContext.lineCap = "round";
      waveContext.lineJoin = "round";

      drawWaveBundle({
        startX: canvasWidth * (isMobile ? 0.5 : -0.08),
        endX: canvasWidth * 1.08,
        baseY: canvasHeight * (isMobile ? 0.24 : 0.22),
        amplitude: canvasHeight * (isMobile ? 0.09 : 0.12),
        slope: canvasHeight * (isMobile ? 0.16 : 0.18),
        frequency: isMobile ? 4.6 : 5.2,
        speed: 0.24,
        count: isMobile ? 15 : 30,
        spacing: isMobile ? 2.1 : 2.6,
      }, time);

      drawWaveBundle({
        startX: canvasWidth * (isMobile ? 0.64 : 0.55),
        endX: canvasWidth * 1.08,
        baseY: canvasHeight * 0.58,
        amplitude: canvasHeight * 0.06,
        slope: canvasHeight * -0.08,
        frequency: 3.4,
        speed: 0.14,
        count: isMobile ? 8 : 14,
        spacing: 2,
      }, time);

      waveContext.shadowBlur = 0;
      waveContext.globalAlpha = 1;
      waveContext.globalCompositeOperation = "destination-in";

      const bottomFade = waveContext.createLinearGradient(0, canvasHeight * 0.68, 0, canvasHeight * 0.94);
      bottomFade.addColorStop(0, "rgb(255 255 255 / 1)");
      bottomFade.addColorStop(1, "rgb(255 255 255 / 0)");
      waveContext.fillStyle = bottomFade;
      waveContext.fillRect(0, 0, canvasWidth, canvasHeight);
      waveContext.globalCompositeOperation = "source-over";
    }

    // size передаёт ResizeObserver — это избавляет от принудительной компоновки
    // (getBoundingClientRect внутри его же колбэка заставляет браузер пересчитать
    // раскладку). Функция также висит обработчиком matchMedia, который передаёт
    // событие, поэтому размеры берём только из объекта с числовой шириной.
    function resizeWaveCanvas(size) {
      const bounds = size && typeof size.width === "number"
        ? size
        : heroSection.getBoundingClientRect();
      canvasWidth = Math.max(1, Math.round(bounds.width));
      canvasHeight = Math.max(1, Math.round(bounds.height));
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      waveCanvas.width = Math.round(canvasWidth * pixelRatio);
      waveCanvas.height = Math.round(canvasHeight * pixelRatio);
      drawWaveFrame(performance.now());
    }

    function shouldAnimate() {
      return heroIsVisible && !document.hidden && !reducedMotion.matches && !saveData;
    }

    function runAnimation(timestamp) {
      animationFrame = 0;
      if (!shouldAnimate()) return;

      if (timestamp - lastFrameTime >= frameInterval) {
        drawWaveFrame(timestamp);
        lastFrameTime = timestamp;
      }

      animationFrame = requestAnimationFrame(runAnimation);
    }

    function updateAnimationState() {
      if (shouldAnimate()) {
        if (!animationFrame) animationFrame = requestAnimationFrame(runAnimation);
      } else {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        drawWaveFrame(0);
      }
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      // borderBoxSize совпадает с getBoundingClientRect: у .hero есть padding,
      // поэтому contentRect дал бы меньший размер и канвас не покрыл бы блок.
      const box = entry.borderBoxSize && entry.borderBoxSize[0];
      resizeWaveCanvas(box ? { width: box.inlineSize, height: box.blockSize } : undefined);
    });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      heroIsVisible = entry.isIntersecting;
      updateAnimationState();
    });

    resizeObserver.observe(heroSection);
    visibilityObserver.observe(heroSection);
    document.addEventListener("visibilitychange", updateAnimationState);
    reducedMotion.addEventListener("change", updateAnimationState);
    mobileViewport.addEventListener("change", resizeWaveCanvas);
    resizeWaveCanvas();
    updateAnimationState();
  }
}

if (faqSection && !document.querySelector("#block-91827")) {
  const formSection = document.createElement("section");
  const formImageUrl = getSiteAssetUrl("images/forma-obratnoy-svyazi-elecround.webp");

  formSection.className = "content-band";
  formSection.setAttribute("aria-labelledby", "contact-form-title");
  formSection.innerHTML = `
    <div class="block-13902">
      <div class="block-13902-intro">
        <h2 id="contact-form-title">Форма обратной связи</h2>
        <p>Опишите задачу и оставьте контактные данные. При необходимости приложите фотографии, схемы или документы — мы изучим обращение и свяжемся с вами.</p>
      </div>
      <div class="block-91827" id="block-91827">
        <img class="block-91827-background" src="${formImageUrl}" alt="" width="1200" height="500" loading="lazy" decoding="async" aria-hidden="true">
        <div data-formid="form_VZTQGFC_oIwFNF_za3cK9bgkLLfjqprU"></div>
      </div>
    </div>
  `;
  faqSection.before(formSection);
}

const qformContainer = document.querySelector('[data-formid="form_VZTQGFC_oIwFNF_za3cK9bgkLLfjqprU"]');

if (qformContainer && !document.querySelector("script[data-qform-loader]")) {
  const qformScript = document.createElement("script");
  qformScript.src = `https://cdn.qform.io/forms.js?v=${Date.now()}`;
  qformScript.async = true;
  qformScript.charset = "UTF-8";
  qformScript.dataset.qformLoader = "";
  document.head.append(qformScript);
}

if (header && navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-open");
    document.documentElement.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// Меню «Услуги» раскрывается средствами CSS (:hover и :focus-within),
// поэтому aria-expanded синхронизируем с обоими состояниями вручную.
document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
  const toggle = dropdown.querySelector(".nav-dropdown-toggle");
  if (!toggle) return;

  let hovered = false;
  let focused = false;

  function syncExpanded() {
    toggle.setAttribute("aria-expanded", String(hovered || focused));
  }

  dropdown.addEventListener("mouseenter", () => {
    hovered = true;
    syncExpanded();
  });

  dropdown.addEventListener("mouseleave", () => {
    hovered = false;
    syncExpanded();
  });

  dropdown.addEventListener("focusin", () => {
    focused = true;
    syncExpanded();
  });

  dropdown.addEventListener("focusout", (event) => {
    focused = dropdown.contains(event.relatedTarget);
    syncExpanded();
  });
});

const homeDirectionPanels = document.querySelectorAll(".block-88273");

if (homeDirectionPanels.length) {
  const homeDirectionItems = {
    install: {
      title: "Монтаж под ключ",
      subtitle: "Проводка, электрощиты, освещение, розетки и запуск системы.",
      image: getSiteAssetUrl("images/elektromontazhnye-raboty-transparent.webp"),
      alt: "Электромонтажные работы в Москве и Московской области",
      href: "elektromontazhnye-raboty.html",
      note: "Для электромонтажа сначала фиксируем объект, точки, группы, щит, трассы и требования к проверке результата.",
      facts: [
        "Квартиры, дома и коммерческие объекты",
        "Новые линии и модернизация проводки",
        "Проверка перед сдачей",
      ],
    },
    lab: {
      title: "Измерения и протоколы",
      subtitle: "Проверим электроустановку, выявим нарушения и подготовим документы.",
      image: getSiteAssetUrl("images/elektroizmeritelnaya-laboratoriya-transparent.webp"),
      alt: "Электроизмерительная лаборатория в Москве и Московской области",
      href: "elektroizmeritelnaya-laboratoriya.html",
      note: "Для электроизмерительной лаборатории заранее уточняем цель проверки, количество линий, щитов, УЗО, заземление и нужный формат отчета.",
      facts: [
        "Замеры сопротивления и изоляции",
        "Проверка автоматов и заземления",
        "Комплект протоколов",
      ],
    },
    maintenance: {
      title: "Надёжная работа электросистем",
      subtitle: "Плановые осмотры, диагностика и устранение неисправностей.",
      image: getSiteAssetUrl("images/tehnicheskoe-obsluzhivanie-transparent.webp"),
      alt: "Техническое обслуживание электроустановок в Москве и Московской области",
      href: "tehnicheskoe-obsluzhivanie-elektroustanovok.html",
      note: "Для обслуживания уточняем щиты, нагрузки, график доступа, состояние контактов, маркировку групп и документы по объекту.",
      facts: [
        "Щиты, линии и электрооборудование",
        "Профилактика аварий и перегрева",
        "Журнал выполненных работ",
      ],
    },
  };

  homeDirectionPanels.forEach((panel) => {
    const tabs = [...panel.querySelectorAll("[data-home-direction-tab]")];
    const image = panel.querySelector("[data-home-direction-image]");
    const link = panel.querySelector("[data-home-direction-link]");
    const title = panel.querySelector("[data-home-direction-title]");
    const subtitle = panel.querySelector("[data-home-direction-subtitle]");
    const facts = panel.querySelector("[data-home-direction-facts]");
    const note = panel.querySelector("[data-home-direction-note]");

    function renderDirection(key) {
      const item = homeDirectionItems[key];
      if (!item) return;

      tabs.forEach((tab) => {
        const isActive = tab.dataset.homeDirectionTab === key;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
      });

      if (image) {
        image.src = item.image;
        image.alt = item.alt;
      }

      if (link) {
        link.href = item.href;
        link.setAttribute("aria-label", `Подробнее: ${item.title}`);
      }

      if (title) title.textContent = item.title;
      if (subtitle) subtitle.textContent = item.subtitle;
      if (note) note.textContent = item.note;

      if (facts) {
        facts.replaceChildren(
          ...item.facts.map((fact) => {
            const listItem = document.createElement("li");
            listItem.textContent = fact;
            return listItem;
          })
        );
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        renderDirection(tab.dataset.homeDirectionTab);
      });

      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const currentIndex = tabs.indexOf(tab);
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const next = tabs[(currentIndex + direction + tabs.length) % tabs.length];
        next.focus();
        renderDirection(next.dataset.homeDirectionTab);
      });
    });

    const initialTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
    if (initialTab) {
      renderDirection(initialTab.dataset.homeDirectionTab);
    }
  });
}

const installObjectPanels = document.querySelectorAll(".block-13887");

if (installObjectPanels.length) {
  const installObjectItems = {
    residential: {
      title: "Жилые помещения",
      subtitle: "Квартиры, апартаменты и частные дома.",
      image: getSiteAssetUrl("images/zhilye-pomeshcheniya-redrawn.webp"),
      alt: "Электромонтажные работы и обслуживание электрики в жилых помещениях",
      noteTitle: "Учитываем планировку и доступ.",
      noteText:
        "Для жилых помещений заранее уточняем количество групп, состояние щита, доступ к помещениям, сроки и требования управляющей компании.",
      facts: [
        "Проводка, розетки и освещение",
        "Квартирные и домовые электрощиты",
        "Работы по согласованному графику",
      ],
    },
    commercial: {
      title: "Коммерческие объекты",
      subtitle: "Офисы, магазины, склады и другие коммерческие помещения.",
      image: getSiteAssetUrl("images/kommercheskie-pomeshcheniya-redrawn.webp"),
      alt: "Электромонтажные работы и обслуживание электрики в офисных помещениях",
      noteTitle: "Учитываем режим работы объекта.",
      noteText:
        "Для коммерческих объектов согласуем окна доступа, перечень щитов, рабочие зоны, оборудование и порядок работ без простоя.",
      facts: [
        "ВРУ и групповые электрощиты",
        "Рабочие и технические зоны",
        "Работы без длительного простоя",
      ],
    },
    municipal: {
      title: "Муниципальные объекты",
      subtitle: "Учреждения и общественные здания.",
      image: getSiteAssetUrl("images/munitsipalnye-pomeshcheniya-redrawn.webp"),
      alt: "Электромонтажные работы и обслуживание электрики в муниципальных помещениях",
      noteTitle: "Сначала фиксируем состав работ.",
      noteText:
        "Для муниципальных объектов заранее уточняем перечень помещений, ответственных лиц, доступ к щитам, график отключений и комплект документов.",
      facts: [
        "Помещения и щиты по перечню",
        "Работы в согласованные окна",
        "Акты и отчётные документы",
      ],
    },
  };

  installObjectPanels.forEach((panel) => {
    const tabs = [...panel.querySelectorAll("[data-install-object-tab]")];
    const image = panel.querySelector("[data-install-object-image]");
    const serviceImage = image?.src.includes("/service-illustration-") ? image.src : "";
    const panelObjectItems = Object.fromEntries(
      tabs
        .filter((tab) => tab.dataset.objectTitle)
        .map((tab) => [
          tab.dataset.installObjectTab,
          {
            title: tab.dataset.objectTitle,
            subtitle: tab.dataset.objectSubtitle,
            image: serviceImage,
            alt: tab.dataset.objectAlt,
            noteTitle: tab.dataset.objectNoteTitle,
            noteText: tab.dataset.objectNoteText,
            facts: (tab.dataset.objectFacts || "").split("|").filter(Boolean),
          },
        ])
    );
    const title = panel.querySelector("[data-install-object-title]");
    const subtitle = panel.querySelector("[data-install-object-subtitle]");
    const facts = panel.querySelector("[data-install-object-facts]");
    const noteTitle = panel.querySelector("[data-install-object-note-title]");
    const noteText = panel.querySelector("[data-install-object-note-text]");

    function renderObject(key) {
      const item = panelObjectItems[key] || installObjectItems[key];
      if (!item) return;

      tabs.forEach((tab) => {
        const isActive = tab.dataset.installObjectTab === key;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
      });

      if (image) {
        image.src = item.image;
        image.alt = item.alt;
      }
      if (title) title.textContent = item.title;
      if (subtitle) subtitle.textContent = item.subtitle;
      if (noteTitle) noteTitle.textContent = item.noteTitle;
      if (noteText) noteText.textContent = item.noteText;

      if (facts) {
        facts.replaceChildren(
          ...item.facts.map((fact) => {
            const listItem = document.createElement("li");
            listItem.textContent = fact;
            return listItem;
          })
        );
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        renderObject(tab.dataset.installObjectTab);
      });
    });

    const initialTab = tabs.find((tab) => tab.classList.contains("is-active")) || tabs[0];
    if (initialTab) {
      renderObject(initialTab.dataset.installObjectTab);
    }
  });
}

const costCalculators = document.querySelectorAll("[data-cost-calculator]");
const rubleFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

// Справочные данные по кабелю общие для калькуляторов автомата и сечения.
// Раньше таблицы были продублированы в обоих: правка в одном месте без правки
// в другом расходила бы результаты двух калькуляторов.
// Значения — для ПВХ-изоляции и трёх нагруженных жил.
const cableSections = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

const cableAmpacity = {
  copper: {
    open: [17.5, 24, 32, 41, 57, 76, 96, 119, 144, 184, 223, 259, 299, 341, 403],
    tray: [17.5, 24, 32, 41, 57, 76, 96, 119, 144, 184, 223, 259, 299, 341, 403],
    pipe: [15, 20, 27, 34, 46, 62, 80, 99, 118, 149, 179, 206, 225, 255, 297],
    concealed: [13, 17.5, 23, 29, 39, 52, 68, 83, 99, 125, 150, 172, 196, 223, 261],
  },
  aluminum: {
    open: [0, 18.5, 25, 32, 44, 59, 73, 90, 110, 140, 170, 197, 227, 259, 305],
    tray: [0, 18.5, 25, 32, 44, 59, 73, 90, 110, 140, 170, 197, 227, 259, 305],
    pipe: [0, 15.5, 21, 27, 36, 48, 62, 77, 92, 116, 139, 160, 176, 199, 232],
    concealed: [0, 13.5, 17.5, 23, 31, 41, 53, 65, 78, 98, 118, 135, 155, 176, 207],
  },
};

const temperatureFactors = { 20: 1.12, 25: 1.06, 30: 1, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71 };
const groupFactors = { 1: 1, 2: 0.8, 3: 0.7, 4: 0.65, 6: 0.57 };

const decimalFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function positiveNumber(field, fallback = 0) {
  return Math.max(0, Number(field?.value) || fallback);
}

function bindCalculator(calculator, update) {
  calculator.addEventListener("input", update);
  calculator.addEventListener("change", update);
  calculator.addEventListener("submit", (event) => event.preventDefault());
  update();
}

costCalculators.forEach((calculator) => {
  const rateFields = [...calculator.querySelectorAll("[data-rate]")];
  const priceFields = [...calculator.querySelectorAll("[data-price]")];
  const multiplierField = calculator.querySelector("[data-multiplier]");
  const totalOutput = calculator.querySelector("[data-calculator-total]");
  const minimum = Number(calculator.dataset.minimum) || 0;

  function updateTotal() {
    const rateTotal = rateFields.reduce((sum, field) => {
      const quantity = Math.max(0, Number(field.value) || 0);
      const rate = Math.max(0, Number(field.dataset.rate) || 0);
      return sum + quantity * rate;
    }, 0);

    const priceTotal = priceFields.reduce((sum, field) => {
      if (Number(field.value) === 0) return sum;
      return sum + Math.max(0, Number(field.dataset.price) || 0);
    }, 0);

    const multiplier = Math.max(0, Number(multiplierField?.value) || 1);
    const subtotal = (rateTotal + priceTotal) * multiplier;
    const total = subtotal > 0 ? Math.max(minimum, Math.round(subtotal / 100) * 100) : 0;

    if (totalOutput) {
      totalOutput.textContent = rubleFormatter.format(total);
    }
  }

  bindCalculator(calculator, updateTotal);
});

const breakerCalculators = document.querySelectorAll("[data-breaker-calculator]");

breakerCalculators.forEach((calculator) => {
  const fields = {
    network: calculator.querySelector("[data-breaker-network]"),
    inputMode: calculator.querySelector("[data-breaker-input-mode]"),
    power: calculator.querySelector("[data-breaker-power]"),
    current: calculator.querySelector("[data-breaker-current]"),
    powerFactor: calculator.querySelector("[data-breaker-power-factor]"),
    loadType: calculator.querySelector("[data-breaker-load-type]"),
    material: calculator.querySelector("[data-breaker-material]"),
    section: calculator.querySelector("[data-breaker-section]"),
    installation: calculator.querySelector("[data-breaker-installation]"),
    temperature: calculator.querySelector("[data-breaker-temperature]"),
    group: calculator.querySelector("[data-breaker-group]"),
  };
  const powerField = calculator.querySelector("[data-breaker-power-field]");
  const currentField = calculator.querySelector("[data-breaker-current-field]");
  const powerFactorField = calculator.querySelector("[data-breaker-power-factor-field]");
  const loadCurrentOutput = calculator.querySelector("[data-breaker-load-current]");
  const cableCurrentOutput = calculator.querySelector("[data-breaker-cable-current]");
  const ratingOutput = calculator.querySelector("[data-breaker-rating]");
  const statusOutput = calculator.querySelector("[data-breaker-status]");

  const sections = cableSections;
  const ampacity = cableAmpacity;
  const standardRatings = [6, 8, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];

  function updateBreakerCalculator() {
    const inputMode = fields.inputMode.value;
    const networkVoltage = positiveNumber(fields.network, 230);
    const powerFactor = Math.min(1, Math.max(0.5, positiveNumber(fields.powerFactor, 0.95)));
    const isThreePhase = networkVoltage === 400;
    const phaseFactor = isThreePhase ? Math.sqrt(3) : 1;
    const loadCurrent = inputMode === "current"
      ? positiveNumber(fields.current)
      : positiveNumber(fields.power) * 1000 / (phaseFactor * networkVoltage * powerFactor);

    const section = positiveNumber(fields.section);
    const sectionIndex = sections.indexOf(section);
    const baseAmpacity = ampacity[fields.material.value]?.[fields.installation.value]?.[sectionIndex] || 0;
    const temperatureFactor = temperatureFactors[fields.temperature.value] || 1;
    const groupFactor = groupFactors[fields.group.value] || 1;
    const cableCurrent = baseAmpacity * temperatureFactor * groupFactor;
    const rating = standardRatings.find((nominal) => nominal >= loadCurrent && nominal <= cableCurrent);
    const curve = fields.loadType.value;

    const usesPower = inputMode === "power";
    powerField.classList.toggle("is-disabled", !usesPower);
    currentField.classList.toggle("is-disabled", usesPower);
    powerFactorField.classList.toggle("is-disabled", !usesPower);
    fields.power.disabled = !usesPower;
    fields.current.disabled = usesPower;
    fields.powerFactor.disabled = !usesPower;
    loadCurrentOutput.textContent = `${decimalFormatter.format(loadCurrent)} А`;
    cableCurrentOutput.textContent = baseAmpacity > 0 ? `${decimalFormatter.format(cableCurrent)} А` : "Нет данных";

    statusOutput.classList.remove("is-warning");

    if (!loadCurrent) {
      ratingOutput.textContent = "—";
      statusOutput.textContent = "Укажите мощность или ток нагрузки больше нуля.";
      statusOutput.classList.add("is-warning");
      return;
    }

    if (!baseAmpacity) {
      ratingOutput.textContent = "—";
      statusOutput.textContent = "Для выбранного материала и сечения требуется отдельная проверка линии.";
      statusOutput.classList.add("is-warning");
      return;
    }

    if (!rating) {
      ratingOutput.textContent = "Не подобран";
      statusOutput.textContent = loadCurrent > cableCurrent
        ? "Расчётный ток превышает допустимый ток кабеля. Увеличьте сечение или уменьшите нагрузку."
        : "Для указанных условий нет подходящего стандартного номинала в диапазоне калькулятора.";
      statusOutput.classList.add("is-warning");
      return;
    }

    ratingOutput.textContent = `${curve}${rating}`;
    statusOutput.textContent = `Условие предварительного выбора выполнено: ${decimalFormatter.format(loadCurrent)} А ≤ ${rating} А ≤ ${decimalFormatter.format(cableCurrent)} А.`;
  }

  bindCalculator(calculator, updateBreakerCalculator);
});

const voltageDropCalculators = document.querySelectorAll("[data-voltage-drop-calculator]");

voltageDropCalculators.forEach((calculator) => {
  const fields = {
    network: calculator.querySelector("[data-voltage-network]"),
    inputMode: calculator.querySelector("[data-voltage-input-mode]"),
    power: calculator.querySelector("[data-voltage-power]"),
    current: calculator.querySelector("[data-voltage-current]"),
    powerFactor: calculator.querySelector("[data-voltage-power-factor]"),
    length: calculator.querySelector("[data-voltage-length]"),
    material: calculator.querySelector("[data-voltage-material]"),
    section: calculator.querySelector("[data-voltage-section]"),
    temperature: calculator.querySelector("[data-voltage-temperature]"),
    limit: calculator.querySelector("[data-voltage-limit]"),
  };
  const powerField = calculator.querySelector("[data-voltage-power-field]");
  const currentField = calculator.querySelector("[data-voltage-current-field]");
  const voltsOutput = calculator.querySelector("[data-voltage-drop-volts]");
  const percentOutput = calculator.querySelector("[data-voltage-drop-percent]");
  const loadVoltageOutput = calculator.querySelector("[data-voltage-load-voltage]");
  const statusOutput = calculator.querySelector("[data-voltage-status]");
  const resistivity = { copper: 0.0175, aluminum: 0.0285 };
  const temperatureCoefficient = { copper: 0.00393, aluminum: 0.00403 };

  function updateVoltageDropCalculator() {
    const usesPower = fields.inputMode.value === "power";
    const voltage = positiveNumber(fields.network, 230);
    const isThreePhase = voltage === 400;
    const phaseFactor = isThreePhase ? Math.sqrt(3) : 1;
    const powerFactor = Math.min(1, Math.max(0.5, positiveNumber(fields.powerFactor, 0.95)));
    const loadCurrent = usesPower
      ? positiveNumber(fields.power) * 1000 / (phaseFactor * voltage * powerFactor)
      : positiveNumber(fields.current);
    const length = positiveNumber(fields.length);
    const section = positiveNumber(fields.section);
    const temperature = positiveNumber(fields.temperature, 20);
    const limit = positiveNumber(fields.limit, 3);
    const material = fields.material.value;
    const rho20 = resistivity[material] || resistivity.copper;
    const alpha = temperatureCoefficient[material] || temperatureCoefficient.copper;
    const rho = rho20 * (1 + alpha * (temperature - 20));
    const resistancePerMeter = section ? rho / section : 0;
    const reactancePerMeter = 0.00008;
    const sinPhi = Math.sqrt(Math.max(0, 1 - powerFactor ** 2));
    const circuitFactor = isThreePhase ? Math.sqrt(3) : 2;
    const voltageDrop = circuitFactor * loadCurrent * length
      * (resistancePerMeter * powerFactor + reactancePerMeter * sinPhi);
    const voltageDropPercent = voltage ? voltageDrop / voltage * 100 : 0;
    const loadVoltage = Math.max(0, voltage - voltageDrop);

    powerField.classList.toggle("is-disabled", !usesPower);
    currentField.classList.toggle("is-disabled", usesPower);
    fields.power.disabled = !usesPower;
    fields.current.disabled = usesPower;
    statusOutput.classList.remove("is-warning");

    if (!loadCurrent || !length || !section) {
      voltsOutput.textContent = "—";
      percentOutput.textContent = "—";
      loadVoltageOutput.textContent = "—";
      statusOutput.textContent = "Укажите ток или мощность, длину линии и сечение кабеля больше нуля.";
      statusOutput.classList.add("is-warning");
      return;
    }

    voltsOutput.textContent = `${decimalFormatter.format(voltageDrop)} В`;
    percentOutput.textContent = `${decimalFormatter.format(voltageDropPercent)} %`;
    loadVoltageOutput.textContent = `${decimalFormatter.format(loadVoltage)} В`;

    if (voltageDropPercent <= limit) {
      statusOutput.textContent = `Расчётный ток — ${decimalFormatter.format(loadCurrent)} А. Потери не превышают выбранный предел ${decimalFormatter.format(limit)} %.`;
      return;
    }

    statusOutput.textContent = `Расчётный ток — ${decimalFormatter.format(loadCurrent)} А. Потери превышают выбранный предел ${decimalFormatter.format(limit)} % — проверьте сечение или длину линии.`;
    statusOutput.classList.add("is-warning");
  }

  bindCalculator(calculator, updateVoltageDropCalculator);
});

const cableSectionCalculators = document.querySelectorAll("[data-cable-section-calculator]");

cableSectionCalculators.forEach((calculator) => {
  const fields = {
    network: calculator.querySelector("[data-section-network]"),
    inputMode: calculator.querySelector("[data-section-input-mode]"),
    power: calculator.querySelector("[data-section-power]"),
    current: calculator.querySelector("[data-section-current]"),
    powerFactor: calculator.querySelector("[data-section-power-factor]"),
    material: calculator.querySelector("[data-section-material]"),
    installation: calculator.querySelector("[data-section-installation]"),
    temperature: calculator.querySelector("[data-section-temperature]"),
    group: calculator.querySelector("[data-section-group]"),
    length: calculator.querySelector("[data-section-length]"),
    limit: calculator.querySelector("[data-section-limit]"),
  };
  const powerField = calculator.querySelector("[data-section-power-field]");
  const currentField = calculator.querySelector("[data-section-current-field]");
  const currentSectionOutput = calculator.querySelector("[data-section-by-current]");
  const voltageSectionOutput = calculator.querySelector("[data-section-by-voltage]");
  const resultOutput = calculator.querySelector("[data-section-result]");
  const statusOutput = calculator.querySelector("[data-section-status]");
  const sections = cableSections;
  const ampacity = cableAmpacity;
  const resistivityAt70 = { copper: 0.02094, aluminum: 0.03424 };
  const sectionFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

  function formatSection(section) {
    return section ? `${sectionFormatter.format(section)} мм²` : "Не подобрано";
  }

  function updateCableSectionCalculator() {
    const usesPower = fields.inputMode.value === "power";
    const voltage = positiveNumber(fields.network, 230);
    const isThreePhase = voltage === 400;
    const powerFactor = Math.min(1, Math.max(0.5, positiveNumber(fields.powerFactor, 0.95)));
    const loadCurrent = usesPower
      ? positiveNumber(fields.power) * 1000 / ((isThreePhase ? Math.sqrt(3) : 1) * voltage * powerFactor)
      : positiveNumber(fields.current);
    const material = fields.material.value;
    const baseCurrents = ampacity[material][fields.installation.value];
    const correction = (temperatureFactors[fields.temperature.value] || 1)
      * (groupFactors[fields.group.value] || 1);
    const length = positiveNumber(fields.length);
    const limit = positiveNumber(fields.limit, 3);
    const sinPhi = Math.sqrt(Math.max(0, 1 - powerFactor ** 2));
    const circuitFactor = isThreePhase ? Math.sqrt(3) : 2;
    const rho = resistivityAt70[material];

    const currentIndex = loadCurrent > 0
      ? sections.findIndex((section, index) => baseCurrents[index] * correction >= loadCurrent && section > 0)
      : -1;
    const voltageIndex = loadCurrent > 0 && length > 0 ? sections.findIndex((section) => {
      const drop = circuitFactor * loadCurrent * length * (rho / section * powerFactor + 0.00008 * sinPhi);
      return drop / voltage * 100 <= limit;
    }) : -1;
    const resultIndex = currentIndex < 0 || voltageIndex < 0 ? -1 : Math.max(currentIndex, voltageIndex);
    const resultSection = resultIndex >= 0 ? sections[resultIndex] : 0;

    powerField.classList.toggle("is-disabled", !usesPower);
    currentField.classList.toggle("is-disabled", usesPower);
    fields.power.disabled = !usesPower;
    fields.current.disabled = usesPower;
    currentSectionOutput.textContent = formatSection(currentIndex >= 0 ? sections[currentIndex] : 0);
    voltageSectionOutput.textContent = formatSection(voltageIndex >= 0 ? sections[voltageIndex] : 0);
    resultOutput.textContent = formatSection(resultSection);
    statusOutput.classList.remove("is-warning");

    if (!loadCurrent || !length) {
      statusOutput.textContent = "Укажите ток или мощность нагрузки и длину линии больше нуля.";
      statusOutput.classList.add("is-warning");
      return;
    }

    if (!resultSection) {
      statusOutput.textContent = "В диапазоне калькулятора подходящее сечение не найдено. Требуется отдельный проектный расчёт.";
      statusOutput.classList.add("is-warning");
      return;
    }

    const allowedCurrent = baseCurrents[resultIndex] * correction;
    const voltageDrop = circuitFactor * loadCurrent * length * (rho / resultSection * powerFactor + 0.00008 * sinPhi);
    const voltageDropPercent = voltageDrop / voltage * 100;
    statusOutput.textContent = `Расчётный ток — ${decimalFormatter.format(loadCurrent)} А, допустимый ток выбранного сечения — ${decimalFormatter.format(allowedCurrent)} А, падение напряжения — ${decimalFormatter.format(voltageDropPercent)} %.`;
  }

  bindCalculator(calculator, updateCableSectionCalculator);
});

const reactivePowerCalculators = document.querySelectorAll("[data-reactive-power-calculator]");

reactivePowerCalculators.forEach((calculator) => {
  const fields = {
    inputMode: calculator.querySelector("[data-reactive-input-mode]"),
    activePower: calculator.querySelector("[data-reactive-active-power]"),
    currentPowerFactor: calculator.querySelector("[data-reactive-current-power-factor]"),
    reactivePower: calculator.querySelector("[data-reactive-power]"),
    targetPowerFactor: calculator.querySelector("[data-reactive-target-power-factor]"),
    voltage: calculator.querySelector("[data-reactive-voltage]"),
    harmonics: calculator.querySelector("[data-reactive-harmonics]"),
  };
  const powerFactorField = calculator.querySelector("[data-reactive-power-factor-field]");
  const reactivePowerField = calculator.querySelector("[data-reactive-power-field]");
  const compensationOutput = calculator.querySelector("[data-reactive-compensation]");
  const standardRatingOutput = calculator.querySelector("[data-reactive-standard-rating]");
  const currentOutput = calculator.querySelector("[data-reactive-current]");
  const statusOutput = calculator.querySelector("[data-reactive-status]");
  const standardRatings = [2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 750, 800, 1000];
  const ratingFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

  function tangentFromPowerFactor(powerFactor) {
    return Math.sqrt(Math.max(0, 1 / powerFactor ** 2 - 1));
  }

  function updateReactivePowerCalculator() {
    const usesPowerFactor = fields.inputMode.value === "power-factor";
    const activePower = positiveNumber(fields.activePower);
    const targetPowerFactor = Math.min(0.99, Math.max(0.5, positiveNumber(fields.targetPowerFactor, 0.95)));
    let currentPowerFactor;
    let currentReactivePower;

    if (usesPowerFactor) {
      currentPowerFactor = Math.min(0.99, Math.max(0.1, positiveNumber(fields.currentPowerFactor, 0.7)));
      currentReactivePower = activePower * tangentFromPowerFactor(currentPowerFactor);
    } else {
      currentReactivePower = positiveNumber(fields.reactivePower);
      currentPowerFactor = activePower
        ? activePower / Math.sqrt(activePower ** 2 + currentReactivePower ** 2)
        : 0;
    }

    const targetReactivePower = activePower * tangentFromPowerFactor(targetPowerFactor);
    const compensation = Math.max(0, currentReactivePower - targetReactivePower);
    const standardRating = standardRatings.find((rating) => rating >= compensation)
      || (compensation > 0 ? Math.ceil(compensation / 50) * 50 : 0);
    const voltage = positiveNumber(fields.voltage, 400);
    const phaseFactor = voltage === 400 ? Math.sqrt(3) : 1;
    const apparentPowerBefore = Math.sqrt(activePower ** 2 + currentReactivePower ** 2);
    const apparentPowerAfter = compensation > 0 ? activePower / targetPowerFactor : apparentPowerBefore;
    const currentBefore = apparentPowerBefore * 1000 / (phaseFactor * voltage);
    const currentAfter = apparentPowerAfter * 1000 / (phaseFactor * voltage);

    powerFactorField.classList.toggle("is-disabled", !usesPowerFactor);
    reactivePowerField.classList.toggle("is-disabled", usesPowerFactor);
    fields.currentPowerFactor.disabled = !usesPowerFactor;
    fields.reactivePower.disabled = usesPowerFactor;
    statusOutput.classList.remove("is-warning");

    if (!activePower) {
      compensationOutput.textContent = "—";
      standardRatingOutput.textContent = "—";
      currentOutput.textContent = "—";
      statusOutput.textContent = "Укажите активную мощность и выбранные исходные данные больше нуля.";
      statusOutput.classList.add("is-warning");
      return;
    }

    compensationOutput.textContent = `${decimalFormatter.format(compensation)} кВАр`;
    standardRatingOutput.textContent = compensation > 0 ? `${ratingFormatter.format(standardRating)} кВАр` : "Не требуется";
    currentOutput.textContent = `${decimalFormatter.format(currentBefore)} / ${decimalFormatter.format(currentAfter)} А`;

    if (!compensation) {
      statusOutput.textContent = `Текущий cos φ ${decimalFormatter.format(currentPowerFactor)} уже не ниже заданного значения.`;
      return;
    }

    statusOutput.textContent = `Расчёт выполнен для повышения cos φ с ${decimalFormatter.format(currentPowerFactor)} до ${decimalFormatter.format(targetPowerFactor)}.`;
    if (fields.harmonics.value === "yes") {
      statusOutput.textContent += " При наличии гармоник требуется проверка резонанса и подбор фильтрокомпенсирующей установки.";
      statusOutput.classList.add("is-warning");
    }
  }

  bindCalculator(calculator, updateReactivePowerCalculator);
});

const motorStartCalculators = document.querySelectorAll("[data-motor-start-calculator]");

motorStartCalculators.forEach((calculator) => {
  const powerField = calculator.querySelector("[data-motor-power]");
  const voltageField = calculator.querySelector("[data-motor-voltage]");
  const efficiencyField = calculator.querySelector("[data-motor-efficiency]");
  const powerFactorField = calculator.querySelector("[data-motor-power-factor]");
  const startMultipleField = calculator.querySelector("[data-motor-start-multiple]");
  const ratedCurrentOutput = calculator.querySelector("[data-motor-rated-current]");
  const startCurrentOutput = calculator.querySelector("[data-motor-start-current]");
  const startPowerOutput = calculator.querySelector("[data-motor-start-power]");
  const statusOutput = calculator.querySelector("[data-motor-status]");

  function updateMotorStartCalculator() {
    const power = positiveNumber(powerField);
    const voltage = positiveNumber(voltageField, 400);
    const efficiency = Math.min(0.99, Math.max(0.5, positiveNumber(efficiencyField, 90) / 100));
    const powerFactor = Math.min(0.99, Math.max(0.5, positiveNumber(powerFactorField, 0.82)));
    const startMultiple = positiveNumber(startMultipleField);
    const ratedCurrent = power * 1000 / (Math.sqrt(3) * voltage * efficiency * powerFactor);
    const startCurrent = ratedCurrent * startMultiple;
    const startApparentPower = Math.sqrt(3) * voltage * startCurrent / 1000;

    statusOutput.classList.remove("is-warning");
    if (!power || !startMultiple) {
      ratedCurrentOutput.textContent = "—";
      startCurrentOutput.textContent = "—";
      startPowerOutput.textContent = "—";
      statusOutput.textContent = "Укажите мощность двигателя и кратность пускового тока больше нуля.";
      statusOutput.classList.add("is-warning");
      return;
    }

    ratedCurrentOutput.textContent = `${decimalFormatter.format(ratedCurrent)} А`;
    startCurrentOutput.textContent = `${decimalFormatter.format(startCurrent)} А`;
    startPowerOutput.textContent = `${decimalFormatter.format(startApparentPower)} кВА`;
    statusOutput.textContent = `Расчёт выполнен для трёхфазного двигателя при КПД ${decimalFormatter.format(efficiency * 100)} % и cos φ ${decimalFormatter.format(powerFactor)}.`;
  }

  bindCalculator(calculator, updateMotorStartCalculator);
});

const powerCurrentCalculators = document.querySelectorAll("[data-power-current-calculator]");

powerCurrentCalculators.forEach((calculator) => {
  const networkField = calculator.querySelector("[data-power-current-network]");
  const modeField = calculator.querySelector("[data-power-current-mode]");
  const powerField = calculator.querySelector("[data-power-current-power]");
  const currentField = calculator.querySelector("[data-power-current-current]");
  const powerFactorField = calculator.querySelector("[data-power-current-factor]");
  const powerWrap = calculator.querySelector("[data-power-current-power-field]");
  const currentWrap = calculator.querySelector("[data-power-current-current-field]");
  const currentOutput = calculator.querySelector("[data-power-current-result-current]");
  const powerOutput = calculator.querySelector("[data-power-current-result-power]");
  const apparentOutput = calculator.querySelector("[data-power-current-result-apparent]");
  const statusOutput = calculator.querySelector("[data-power-current-status]");
  const formatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

  function updatePowerCurrentCalculator() {
    const voltage = Math.max(1, Number(networkField.value) || 230);
    const powerFactor = Math.min(1, Math.max(0.1, Number(powerFactorField.value) || 1));
    const phaseFactor = voltage === 400 ? Math.sqrt(3) : 1;
    const usesPower = modeField.value === "power";
    const activePower = usesPower
      ? Math.max(0, Number(powerField.value) || 0)
      : phaseFactor * voltage * Math.max(0, Number(currentField.value) || 0) * powerFactor / 1000;
    const current = usesPower
      ? activePower * 1000 / (phaseFactor * voltage * powerFactor)
      : Math.max(0, Number(currentField.value) || 0);
    const apparentPower = activePower / powerFactor;

    powerWrap.classList.toggle("is-disabled", !usesPower);
    currentWrap.classList.toggle("is-disabled", usesPower);
    powerField.disabled = !usesPower;
    currentField.disabled = usesPower;
    currentOutput.textContent = activePower ? `${formatter.format(current)} А` : "—";
    powerOutput.textContent = activePower ? `${formatter.format(activePower)} кВт` : "—";
    apparentOutput.textContent = activePower ? `${formatter.format(apparentPower)} кВА` : "—";
    statusOutput.textContent = activePower
      ? `Расчёт выполнен для сети ${voltage} В при cos φ ${formatter.format(powerFactor)}.`
      : "Укажите мощность или ток нагрузки больше нуля.";
    statusOutput.classList.toggle("is-warning", !activePower);
  }

  bindCalculator(calculator, updatePowerCurrentCalculator);
});

const phaseBalanceCalculators = document.querySelectorAll("[data-phase-balance-calculator]");

phaseBalanceCalculators.forEach((calculator) => {
  const currentFields = [...calculator.querySelectorAll("[data-phase-current]")];
  const powerFactorField = calculator.querySelector("[data-phase-balance-factor]");
  const averageOutput = calculator.querySelector("[data-phase-balance-average]");
  const imbalanceOutput = calculator.querySelector("[data-phase-balance-imbalance]");
  const powerOutput = calculator.querySelector("[data-phase-balance-power]");
  const statusOutput = calculator.querySelector("[data-phase-balance-status]");
  const formatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

  function updatePhaseBalanceCalculator() {
    const currents = currentFields.map((field) => Math.max(0, Number(field.value) || 0));
    const average = currents.reduce((sum, current) => sum + current, 0) / 3;
    const maxDeviation = Math.max(...currents.map((current) => Math.abs(current - average)));
    const imbalance = average ? maxDeviation / average * 100 : 0;
    const powerFactor = Math.min(1, Math.max(0.1, Number(powerFactorField.value) || 1));
    const totalPower = 230 * powerFactor * currents.reduce((sum, current) => sum + current, 0) / 1000;
    const lightestPhase = currents.indexOf(Math.min(...currents)) + 1;
    const heaviestPhase = currents.indexOf(Math.max(...currents)) + 1;

    averageOutput.textContent = average ? `${formatter.format(average)} А` : "—";
    imbalanceOutput.textContent = average ? `${formatter.format(imbalance)} %` : "—";
    powerOutput.textContent = average ? `${formatter.format(totalPower)} кВт` : "—";
    statusOutput.textContent = average
      ? imbalance <= 10
        ? "Нагрузка распределена достаточно равномерно."
        : `Рекомендуется перенести часть нагрузки с L${heaviestPhase} на L${lightestPhase}.`
      : "Укажите ток хотя бы одной фазы.";
    statusOutput.classList.toggle("is-warning", !average || imbalance > 10);
  }

  bindCalculator(calculator, updatePhaseBalanceCalculator);
});

const rcdCalculators = document.querySelectorAll("[data-rcd-calculator]");

rcdCalculators.forEach((calculator) => {
  const breakerField = calculator.querySelector("[data-rcd-breaker]");
  const purposeField = calculator.querySelector("[data-rcd-purpose]");
  const equipmentField = calculator.querySelector("[data-rcd-equipment]");
  const leakageField = calculator.querySelector("[data-rcd-leakage]");
  const ratingOutput = calculator.querySelector("[data-rcd-rating]");
  const residualOutput = calculator.querySelector("[data-rcd-residual]");
  const typeOutput = calculator.querySelector("[data-rcd-type]");
  const statusOutput = calculator.querySelector("[data-rcd-status]");
  const ratings = [25, 40, 63, 80, 100, 125];

  function updateRcdCalculator() {
    const breaker = Math.max(0, Number(breakerField.value) || 0);
    const leakage = Math.max(0, Number(leakageField.value) || 0);
    const rating = ratings.find((value) => value >= breaker) || ratings.at(-1);
    const residual = purposeField.value === "individual" ? 10 : purposeField.value === "fire" ? 300 : 30;
    const type = equipmentField.value === "inverter" ? "F" : equipmentField.value === "dc" ? "B" : "A";
    const leakageLimit = residual / 3;

    ratingOutput.textContent = `${rating} А`;
    residualOutput.textContent = `${residual} мА`;
    typeOutput.textContent = `Тип ${type}`;
    statusOutput.textContent = leakage > leakageLimit
      ? `Измеренная утечка выше ${leakageLimit.toLocaleString("ru-RU")} мА: сначала найдите её причину, иначе возможны ложные отключения.`
      : `Номинальный ток УЗО выбран не ниже номинала автомата ${breaker} А.`;
    statusOutput.classList.toggle("is-warning", leakage > leakageLimit);
  }

  bindCalculator(calculator, updateRcdCalculator);
});

const energyCalculators = document.querySelectorAll("[data-energy-calculator]");

energyCalculators.forEach((calculator) => {
  const powerField = calculator.querySelector("[data-energy-power]");
  const quantityField = calculator.querySelector("[data-energy-quantity]");
  const hoursField = calculator.querySelector("[data-energy-hours]");
  const daysField = calculator.querySelector("[data-energy-days]");
  const tariffField = calculator.querySelector("[data-energy-tariff]");
  const dailyOutput = calculator.querySelector("[data-energy-daily]");
  const monthlyOutput = calculator.querySelector("[data-energy-monthly]");
  const costOutput = calculator.querySelector("[data-energy-cost]");
  const statusOutput = calculator.querySelector("[data-energy-status]");
  const formatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

  function updateEnergyCalculator() {
    const power = Math.max(0, Number(powerField.value) || 0);
    const quantity = Math.max(1, Number(quantityField.value) || 1);
    const hours = Math.min(24, Math.max(0, Number(hoursField.value) || 0));
    const days = Math.min(31, Math.max(0, Number(daysField.value) || 0));
    const tariff = Math.max(0, Number(tariffField.value) || 0);
    const daily = power * quantity * hours;
    const monthly = daily * days;
    const monthlyCost = monthly * tariff;

    dailyOutput.textContent = daily ? `${formatter.format(daily)} кВт·ч` : "—";
    monthlyOutput.textContent = monthly ? `${formatter.format(monthly)} кВт·ч` : "—";
    costOutput.textContent = monthly ? rubleFormatter.format(monthlyCost) : "—";
    statusOutput.textContent = monthly
      ? `Ориентировочная стоимость за год — ${rubleFormatter.format(monthlyCost * 12)}.`
      : "Укажите мощность и время работы оборудования.";
    statusOutput.classList.toggle("is-warning", !monthly);
  }

  bindCalculator(calculator, updateEnergyCalculator);
});

const backupPowerCalculators = document.querySelectorAll("[data-backup-power-calculator]");

backupPowerCalculators.forEach((calculator) => {
  const continuousField = calculator.querySelector("[data-backup-continuous]");
  const peakField = calculator.querySelector("[data-backup-peak]");
  const factorField = calculator.querySelector("[data-backup-factor]");
  const reserveField = calculator.querySelector("[data-backup-reserve]");
  const activeOutput = calculator.querySelector("[data-backup-active]");
  const apparentOutput = calculator.querySelector("[data-backup-apparent]");
  const standardOutput = calculator.querySelector("[data-backup-standard]");
  const statusOutput = calculator.querySelector("[data-backup-status]");
  const standards = [1, 1.5, 2, 3, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 125, 160, 200];
  const formatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

  function updateBackupPowerCalculator() {
    const continuous = Math.max(0, Number(continuousField.value) || 0);
    const peak = Math.max(0, Number(peakField.value) || 0);
    const factor = Math.min(1, Math.max(0.1, Number(factorField.value) || 1));
    const reserve = Math.max(0, Number(reserveField.value) || 0) / 100;
    const requiredActive = Math.max(continuous * (1 + reserve), peak);
    const requiredApparent = requiredActive / factor;
    const standard = standards.find((value) => value >= requiredApparent);

    activeOutput.textContent = requiredActive ? `${formatter.format(requiredActive)} кВт` : "—";
    apparentOutput.textContent = requiredApparent ? `${formatter.format(requiredApparent)} кВА` : "—";
    standardOutput.textContent = standard ? `${formatter.format(standard)} кВА` : "Более 200 кВА";
    statusOutput.textContent = requiredActive
      ? "Перед выбором модели проверьте допустимую перегрузку, форму напряжения и пусковые характеристики оборудования."
      : "Укажите постоянную мощность нагрузки больше нуля.";
    statusOutput.classList.toggle("is-warning", !requiredActive || !standard);
  }

  bindCalculator(calculator, updateBackupPowerCalculator);
});

const lightingCalculators = document.querySelectorAll("[data-lighting-calculator]");

lightingCalculators.forEach((calculator) => {
  const areaField = calculator.querySelector("[data-lighting-area]");
  const illuminanceField = calculator.querySelector("[data-lighting-illuminance]");
  const fluxField = calculator.querySelector("[data-lighting-flux]");
  const powerField = calculator.querySelector("[data-lighting-power]");
  const utilizationField = calculator.querySelector("[data-lighting-utilization]");
  const maintenanceField = calculator.querySelector("[data-lighting-maintenance]");
  const countOutput = calculator.querySelector("[data-lighting-count]");
  const fluxOutput = calculator.querySelector("[data-lighting-total-flux]");
  const powerOutput = calculator.querySelector("[data-lighting-total-power]");
  const statusOutput = calculator.querySelector("[data-lighting-status]");
  const formatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

  function updateLightingCalculator() {
    const area = Math.max(0, Number(areaField.value) || 0);
    const illuminance = Math.max(0, Number(illuminanceField.value) || 0);
    const flux = Math.max(0, Number(fluxField.value) || 0);
    const fixturePower = Math.max(0, Number(powerField.value) || 0);
    const utilization = Math.min(1, Math.max(0.1, Number(utilizationField.value) || 0.1));
    const maintenance = Math.min(1, Math.max(0.1, Number(maintenanceField.value) || 0.1));
    const count = flux ? Math.ceil(area * illuminance / (flux * utilization * maintenance)) : 0;

    countOutput.textContent = count ? `${count} шт.` : "—";
    fluxOutput.textContent = count ? `${formatter.format(count * flux)} лм` : "—";
    powerOutput.textContent = count ? `${formatter.format(count * fixturePower)} Вт` : "—";
    statusOutput.textContent = count
      ? "Распределите светильники равномерно и проверьте результат светотехническим расчётом или измерением."
      : "Укажите площадь, освещённость и световой поток светильника.";
    statusOutput.classList.toggle("is-warning", !count);
  }

  bindCalculator(calculator, updateLightingCalculator);
});

const shortCircuitCalculators = document.querySelectorAll("[data-short-circuit-calculator]");

shortCircuitCalculators.forEach((calculator) => {
  const powerField = calculator.querySelector("[data-short-circuit-power]");
  const voltageField = calculator.querySelector("[data-short-circuit-voltage]");
  const impedanceField = calculator.querySelector("[data-short-circuit-impedance]");
  const materialField = calculator.querySelector("[data-short-circuit-material]");
  const sectionField = calculator.querySelector("[data-short-circuit-section]");
  const lengthField = calculator.querySelector("[data-short-circuit-length]");
  const terminalOutput = calculator.querySelector("[data-short-circuit-terminal]");
  const endOutput = calculator.querySelector("[data-short-circuit-end]");
  const capacityOutput = calculator.querySelector("[data-short-circuit-capacity]");
  const statusOutput = calculator.querySelector("[data-short-circuit-status]");
  const capacities = [4.5, 6, 10, 15, 25, 36, 50, 70, 100];
  const formatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

  function updateShortCircuitCalculator() {
    const transformerPower = Math.max(0, Number(powerField.value) || 0);
    const voltage = Math.max(1, Number(voltageField.value) || 400);
    const impedance = Math.max(0.1, Number(impedanceField.value) || 0.1);
    const section = Math.max(0, Number(sectionField.value) || 0);
    const length = Math.max(0, Number(lengthField.value) || 0);
    const rho = materialField.value === "aluminum" ? 0.0282 : 0.0175;
    const ratedCurrent = transformerPower * 1000 / (Math.sqrt(3) * voltage);
    const terminalCurrent = ratedCurrent * 100 / impedance;
    const sourceImpedance = terminalCurrent ? voltage / (Math.sqrt(3) * terminalCurrent) : 0;
    const cableImpedance = section ? rho * 1.25 * length / section : 0;
    const endCurrent = sourceImpedance + cableImpedance
      ? voltage / (Math.sqrt(3) * (sourceImpedance + cableImpedance))
      : 0;
    const terminalCurrentKa = terminalCurrent / 1000;
    const endCurrentKa = endCurrent / 1000;
    const capacity = capacities.find((value) => value >= terminalCurrentKa);

    terminalOutput.textContent = terminalCurrent ? `${formatter.format(terminalCurrentKa)} кА` : "—";
    endOutput.textContent = endCurrent ? `${formatter.format(endCurrentKa)} кА` : "—";
    capacityOutput.textContent = capacity ? `${formatter.format(capacity)} кА` : "Более 100 кА";
    statusOutput.textContent = endCurrent
      ? "Получено приближённое значение трёхфазного КЗ без учёта реактивного сопротивления и параметров внешней сети."
      : "Заполните параметры трансформатора и кабельной линии.";
    statusOutput.classList.toggle("is-warning", !endCurrent || !capacity);
  }

  bindCalculator(calculator, updateShortCircuitCalculator);
});
