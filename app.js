const DEFAULTS = {
  wgs: {
    labels: ["Latitude", "Longitude"],
    values: ["37.51667430329217", "127.11382325859017"],
  },
  katec: {
    labels: ["X", "Y"],
    values: ["321857", "546422"],
  },
};

const state = {
  mode: "wgs",
  lastResult: [],
};

const form = document.getElementById("converterForm");
const value1Input = document.getElementById("value1");
const value2Input = document.getElementById("value2");
const label1 = document.getElementById("label1");
const label2 = document.getElementById("label2");
const resultPanel = document.getElementById("resultPanel");
const resultText = document.getElementById("resultText");
const statusText = document.getElementById("status");
const modeButtons = [...document.querySelectorAll(".mode-tab")];

function configureProj4() {
  if (!window.proj4) {
    statusText.textContent = "proj4 라이브러리를 불러오지 못했습니다.";
    return false;
  }

  proj4.defs("WGS84", "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs");
  proj4.defs(
    "KATEC",
    "+proj=tmerc +lat_0=38 +lon_0=128 +k=0.9999 +x_0=400000 +y_0=600000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43",
  );

  return true;
}

function parsePair() {
  const defaults = DEFAULTS[state.mode].values;
  const first = Number.parseFloat(value1Input.value || defaults[0]);
  const second = Number.parseFloat(value2Input.value || defaults[1]);

  if (Number.isNaN(first) || Number.isNaN(second)) {
    throw new Error("두 값을 모두 숫자로 입력해주세요.");
  }

  return [first, second];
}

function formatNumber(value) {
  return Number(value).toFixed(10).replace(/\.?0+$/, "");
}

function convertCoordinates() {
  const [first, second] = parsePair();

  if (state.mode === "wgs") {
    const [x, y] = proj4("WGS84", "KATEC", [second, first]);
    return {
      labels: ["X", "Y"],
      values: [x, y],
    };
  }

  const [longitude, latitude] = proj4("KATEC", "WGS84", [first, second]);
  return {
    labels: ["Latitude", "Longitude"],
    values: [latitude, longitude],
  };
}

function renderMode(nextMode) {
  state.mode = nextMode;
  const config = DEFAULTS[nextMode];

  label1.textContent = config.labels[0];
  label2.textContent = config.labels[1];
  value1Input.placeholder = config.values[0];
  value2Input.placeholder = config.values[1];
  value1Input.value = "";
  value2Input.value = "";
  statusText.textContent = "";
  resultPanel.hidden = true;

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === nextMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function splitPastedPair() {
  const raw = value1Input.value;
  const divider = raw.includes("\t") ? "\t" : raw.includes(",") ? "," : null;

  if (!divider) return;

  const [first, second] = raw.split(divider);
  value1Input.value = first.trim();
  value2Input.value = (second || "").trim();
}

function renderResult(event) {
  event.preventDefault();
  statusText.textContent = "";

  try {
    const result = convertCoordinates();
    state.lastResult = result.values.map(formatNumber);
    resultText.replaceChildren(
      ...result.labels.map((label, index) => {
        const item = document.createElement("div");
        item.className = "result-item";

        const resultLabel = document.createElement("span");
        resultLabel.className = "result-item-label";
        resultLabel.textContent = `${label}:`;

        const control = document.createElement("div");
        control.className = "result-control";

        const value = document.createElement("output");
        value.className = "result-value";
        value.textContent = state.lastResult[index];

        const button = document.createElement("button");
        button.className = "icon-button";
        button.type = "button";
        button.dataset.resultIndex = String(index);
        button.setAttribute("aria-label", `${label} 값 복사`);
        button.title = `${label} 값 복사`;
        button.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 8h10v12H8z"></path>
            <path d="M6 16H4V4h12v2"></path>
          </svg>
        `;

        control.append(value, button);
        item.append(resultLabel, control);
        return item;
      }),
    );
    resultPanel.hidden = false;
  } catch (error) {
    resultPanel.hidden = true;
    statusText.textContent = error.message;
  }
}

async function copyResult(event) {
  const button = event.target.closest("[data-result-index]");
  if (!button) return;

  const value = state.lastResult[Number(button.dataset.resultIndex)];
  if (!value) return;

  try {
    await navigator.clipboard.writeText(value);
    statusText.textContent = "복사했습니다.";
  } catch {
    statusText.textContent = "브라우저에서 복사를 허용하지 않았습니다.";
  }
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => renderMode(button.dataset.mode));
});

value1Input.addEventListener("input", splitPastedPair);
resultText.addEventListener("click", copyResult);
form.addEventListener("submit", renderResult);

configureProj4();
renderMode(state.mode);
