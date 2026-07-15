const emissionFactors = {
    car_gasoline: 0.192,
    car_electric: 0.06,
    bus: 0.105,
    train: 0.041,
    plane: 0.255,
    motorcycle: 0.103,
    bike: 0,
    walk: 0,
};

const routeMultipliers = {
    urban: 1.0,
    highway: 0.9,
    mountain: 1.2,
    heavy_traffic: 1.15,
};

const transportNames = {
    car_gasoline: "carro a gasolina",
    car_electric: "carro elétrico",
    bus: "ônibus",
    train: "trem",
    plane: "avião",
    motorcycle: "moto",
    bike: "bicicleta",
    walk: "caminhada",
};

const form = document.getElementById("tripForm");
const distanceInput = document.getElementById("distance");
const transportSelect = document.getElementById("transport");
const routeProfileSelect = document.getElementById("routeProfile");
const passengersInput = document.getElementById("passengers");
const roundTripInput = document.getElementById("roundTrip");
const errorMsg = document.getElementById("errorMsg");

const resultKgEl = document.getElementById("resultKg");
const resultSummaryEl = document.getElementById("resultSummary");
const impactClassEl = document.getElementById("impactClass");
const treesNeededEl = document.getElementById("treesNeeded");
const alternativeEl = document.getElementById("alternative");
const swapScenarioBtn = document.getElementById("swapScenario");

let lastCalculation = null;

function calculateEmission({ distance, transport, routeProfile, passengers, roundTrip }) {
    const baseFactor = emissionFactors[transport];
    const routeFactor = routeMultipliers[routeProfile];
    const adjustedDistance = roundTrip ? distance * 2 : distance;

    let totalKg = adjustedDistance * baseFactor * routeFactor;

    if (["car_gasoline", "car_electric", "motorcycle"].includes(transport)) {
        totalKg = totalKg / passengers;
    }

    return totalKg;
}

function classifyImpact(totalKg) {
    if (totalKg < 5) {
        return { label: "Baixo", className: "low" };
    }

    if (totalKg < 20) {
        return { label: "Médio", className: "medium" };
    }

    return { label: "Alto", className: "high" };
}

function bestTransportAlternative(distance, routeProfile, roundTrip) {
    const candidateTransport = ["train", "bus", "car_electric", "bike", "walk"];
    const candidates = candidateTransport.map((transport) => {
        const emission = calculateEmission({
            distance,
            transport,
            routeProfile,
            passengers: 1,
            roundTrip,
        });
        return { transport, emission };
    });

    candidates.sort((a, b) => a.emission - b.emission);
    return candidates[0];
}

function formatKg(value) {
    return `${value.toFixed(2)} kg CO2e`;
}

function validateInputs() {
    const distance = Number(distanceInput.value);
    const passengers = Number(passengersInput.value);
    const transport = transportSelect.value;
    const routeProfile = routeProfileSelect.value;

    if (!distance || distance <= 0) {
        return "Informe uma distância válida maior que 0.";
    }

    if (!transport) {
        return "Selecione um meio de transporte.";
    }

    if (!routeProfile) {
        return "Selecione o perfil do trajeto.";
    }

    if (!passengers || passengers < 1) {
        return "Informe ao menos 1 passageiro.";
    }

    return "";
}

function renderResult(calculation, alternative) {
    const impact = classifyImpact(calculation.totalKg);
    const trees = Math.ceil(calculation.totalKg / 21);

    resultKgEl.textContent = formatKg(calculation.totalKg);
    resultSummaryEl.textContent = `Viagem de ${calculation.distance} km usando ${transportNames[calculation.transport]}${calculation.roundTrip ? " (ida e volta)" : ""}.`;

    impactClassEl.textContent = impact.label;
    impactClassEl.className = impact.className;

    treesNeededEl.textContent = trees <= 0 ? "0" : `${trees} por ano`;

    if (alternative) {
        const diff = Math.max(calculation.totalKg - alternative.emission, 0);
        alternativeEl.textContent = `${transportNames[alternative.transport]} pode reduzir ~${diff.toFixed(2)} kg CO2e`;
    } else {
        alternativeEl.textContent = "Sem alternativa calculada.";
    }
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorMsg.textContent = "";

    const validationError = validateInputs();
    if (validationError) {
        errorMsg.textContent = validationError;
        return;
    }

    const tripData = {
        distance: Number(distanceInput.value),
        transport: transportSelect.value,
        routeProfile: routeProfileSelect.value,
        passengers: Number(passengersInput.value),
        roundTrip: roundTripInput.checked,
    };

    const totalKg = calculateEmission(tripData);
    const alternative = bestTransportAlternative(tripData.distance, tripData.routeProfile, tripData.roundTrip);

    lastCalculation = {
        ...tripData,
        totalKg,
    };

    renderResult(lastCalculation, alternative);
});

swapScenarioBtn.addEventListener("click", () => {
    if (!lastCalculation) {
        errorMsg.textContent = "Primeiro, calcule uma viagem para comparar cenários.";
        return;
    }

    errorMsg.textContent = "";
    const best = bestTransportAlternative(lastCalculation.distance, lastCalculation.routeProfile, lastCalculation.roundTrip);
    renderResult(lastCalculation, best);
});
