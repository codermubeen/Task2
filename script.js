
const resultDisplay = document.getElementById("result");
const expressionDisplay = document.getElementById("expression");
const buttons = document.querySelector(".buttons");

let expression = "";
let justCalculated = false;
let errorState = false;

function formatNumber(number) {
    if (!Number.isFinite(number)) {
        throw new Error("Math error");
    }

    if (Math.abs(number) < 1e15 &&
        Number.isInteger(number)) {
        return String(number);
    }

    return String(Number(number.toPrecision(10)));
}

// Supports +, -, *, /, %, decimals and parentheses.
function evaluateExpression(input) {
    const tokens = input.match(
        /\d*\.?\d+|[()+*/%\-]/g
    ) || [];

    if (tokens.join("") !== input.replace(/\s/g, "")) {
        throw new Error("Invalid input");
    }

    let position = 0;

    function parsePrimary() {
        const token = tokens[position++];

        if (token === "+" || token === "-") {
            const value = parsePrimary();
            return token === "-" ? -value : value;
        }

        if (token === "(") {
            const value = parseAddSubtract();

            if (tokens[position++] !== ")") {
                throw new Error("Missing bracket");
            }

            return value;
        }

        if (token === undefined ||
            !/^\d*\.?\d+$/.test(token)) {
            throw new Error("Invalid number");
        }

        return Number(token);
    }

    function parseMultiplyDivide() {
        let value = parsePrimary();

        while (["*", "/", "%"].includes(tokens[position])) {
            const operator = tokens[position++];
            const next = parsePrimary();

            if ((operator === "/" || operator === "%") &&
                next === 0) {
                throw new Error("Cannot divide by zero");
            }

            if (operator === "*") value *= next;
            if (operator === "/") value /= next;
            if (operator === "%") value %= next;
        }

        return value;
    }

    function parseAddSubtract() {
        let value = parseMultiplyDivide();

        while (["+", "-"].includes(tokens[position])) {
            const operator = tokens[position++];
            const next = parseMultiplyDivide();

            if (operator === "+") value += next;
            if (operator === "-") value -= next;
        }

        return value;
    }

    if (tokens.length === 0) {
        throw new Error("Empty expression");
    }

    const answer = parseAddSubtract();

    if (position !== tokens.length) {
        throw new Error("Invalid expression");
    }

    if (!Number.isFinite(answer)) {
        throw new Error("Math error");
    }

    return answer;
}

function updateDisplay() {
    expressionDisplay.textContent = expression;

    if (!expression) {
        resultDisplay.textContent = "0";
        return;
    }

    try {
        const answer = evaluateExpression(expression);
        resultDisplay.textContent = formatNumber(answer);
    } catch {
        resultDisplay.textContent = "…";
    }
}

function clearCalculator() {
    expression = "";
    justCalculated = false;
    errorState = false;
    updateDisplay();
}

function deleteLast() {
    if (errorState) {
        clearCalculator();
        return;
    }

    expression = expression.slice(0, -1);
    justCalculated = false;
    updateDisplay();
}

function addValue(value) {
    if (errorState) clearCalculator();

    const operators = ["+", "-", "*", "/", "%"];

    if (justCalculated) {
        if (operators.includes(value)) {
            // Continue calculating from the displayed answer.
            expression = resultDisplay.textContent;
        } else {
            expression = "";
        }

        justCalculated = false;
    }

    const last = expression.slice(-1);

    if (value === ".") {
        const currentNumber = expression.split(/[+\-*/%()]/).pop();

        if (currentNumber.includes(".")) return;

        if (!currentNumber) {
            expression += "0";
        }
    }

    if (operators.includes(value)) {
        if (!expression && value !== "-") return;

        if (operators.includes(last)) {
            if (value === "-" && last !== "-") {
                expression += value;
            } else {
                expression = expression.slice(0, -1) + value;
            }
            updateDisplay();
            return;
        }
    }

    expression += value;
    updateDisplay();
}

function calculate() {
    if (!expression || errorState) return;

    try {
        const answer = evaluateExpression(expression);
        const formatted = formatNumber(answer);

        expressionDisplay.textContent = expression + " =";
        resultDisplay.textContent = formatted;

        expression = formatted;
        justCalculated = true;
    } catch {
        resultDisplay.textContent = "Error";
        errorState = true;
    }
}

function toggleSign() {
    if (!expression || errorState) return;

    try {
        const answer = evaluateExpression(expression);
        expression = formatNumber(-answer);
        justCalculated = false;
        updateDisplay();
    } catch {
        // Ignore incomplete expressions.
    }
}

buttons.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.value !== undefined) {
        addValue(button.dataset.value);
        return;
    }

    switch (button.dataset.action) {
        case "clear":
            clearCalculator();
            break;
        case "delete":
            deleteLast();
            break;
        case "calculate":
            calculate();
            break;
        case "sign":
            toggleSign();
            break;
    }
});

document.addEventListener("keydown", event => {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        addValue(key);
    } else if (["+", "-", "*", "/", "%"].includes(key)) {
        addValue(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Backspace") {
        deleteLast();
    } else if (key === "Escape") {
        clearCalculator();
    }
});

updateDisplay();
