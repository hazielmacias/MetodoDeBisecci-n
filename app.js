let currentIteration = 0;
let iterationData = [];
let isStepByStep = false;

// Parser de funciones matemáticas
function parseFunction(expr) {
    // Reemplazar operadores matemáticos comunes
    expr = expr.replace(/\^/g, '**');
    expr = expr.replace(/sin/g, 'Math.sin');
    expr = expr.replace(/cos/g, 'Math.cos');
    expr = expr.replace(/tan/g, 'Math.tan');
    expr = expr.replace(/ln/g, 'Math.log');
    expr = expr.replace(/log/g, 'Math.log10');
    expr = expr.replace(/sqrt/g, 'Math.sqrt');
    expr = expr.replace(/abs/g, 'Math.abs');
    expr = expr.replace(/exp/g, 'Math.exp');
    expr = expr.replace(/pi/g, 'Math.PI');
    expr = expr.replace(/e(?![x])/g, 'Math.E');
    
    return new Function('x', `return ${expr}`);
}

function evaluateFunction(f, x) {
    try {
        return f(x);
    } catch (e) {
        throw new Error('Error al evaluar la función');
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

function bisectionMethod(f, a, b, tolerance, maxIter) {
    iterationData = [];
    let iter = 0;
    let fa = evaluateFunction(f, a);
    let fb = evaluateFunction(f, b);

    if (fa * fb > 0) {
        throw new Error('La función no cambia de signo en el intervalo dado. f(a)·f(b) debe ser < 0');
    }

    while (iter < maxIter && Math.abs(b - a) > tolerance) {
        let c = (a + b) / 2;
        let fc = evaluateFunction(f, c);
        let signProduct = fa * fc;

        iterationData.push({
            iteration: iter + 1,
            a: a,
            b: b,
            c: c,
            sign: signProduct < 0 ? 'Negativo' : 'Positivo',
            fc: fc
        });

        if (Math.abs(fc) < tolerance) {
            break;
        }

        if (signProduct < 0) {
            b = c;
            fb = fc;
        } else {
            a = c;
            fa = fc;
        }

        iter++;
    }

    return iterationData;
}

function updateTable(data, highlight = false) {
    const tbody = document.getElementById('tableBody');
    
    if (!highlight) {
        tbody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.iteration}</td>
                <td>${row.a.toFixed(6)}</td>
                <td>${row.b.toFixed(6)}</td>
                <td>${row.c.toFixed(6)}</td>
                <td>${row.sign}</td>
                <td>${row.fc.toExponential(4)}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        // Para paso a paso, agregar solo la última fila con animación
        if (data.length > 0) {
            const lastRow = data[data.length - 1];
            const tr = document.createElement('tr');
            tr.classList.add('highlight');
            tr.innerHTML = `
                <td>${lastRow.iteration}</td>
                <td>${lastRow.a.toFixed(6)}</td>
                <td>${lastRow.b.toFixed(6)}</td>
                <td>${lastRow.c.toFixed(6)}</td>
                <td>${lastRow.sign}</td>
                <td>${lastRow.fc.toExponential(4)}</td>
            `;
            tbody.appendChild(tr);
            
            // Scroll automático
            const tableContainer = document.getElementById('tableContainer');
            tableContainer.scrollTop = tableContainer.scrollHeight;
        }
    }
}

function drawGraph(f, a, b, iterations) {
    const canvas = document.getElementById('graph');
    const ctx = canvas.getContext('2d');
    
    // Ajustar tamaño del canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;
    
    const padding = 40;
    const width = canvas.width - 2 * padding;
    const height = canvas.height - 2 * padding;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Determinar rango de visualización
    let xMin = Math.min(a, b) - 1;
    let xMax = Math.max(a, b) + 1;
    
    // Calcular valores de y
    let yMin = Infinity;
    let yMax = -Infinity;
    const numPoints = 200;
    const xStep = (xMax - xMin) / numPoints;
    
    for (let x = xMin; x <= xMax; x += xStep) {
        try {
            const y = evaluateFunction(f, x);
            if (!isNaN(y) && isFinite(y)) {
                yMin = Math.min(yMin, y);
                yMax = Math.max(yMax, y);
            }
        } catch (e) {}
    }
    
    // Ajustar rango de y
    const yPadding = (yMax - yMin) * 0.1;
    yMin -= yPadding;
    yMax += yPadding;
    
    // Funciones de transformación
    const xToCanvas = (x) => padding + ((x - xMin) / (xMax - xMin)) * width;
    const yToCanvas = (y) => padding + ((yMax - y) / (yMax - yMin)) * height;
    
    // Dibujar grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    // Grid vertical
    for (let i = 0; i <= 10; i++) {
        const x = padding + (width / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + height);
        ctx.stroke();
    }
    
    // Grid horizontal
    for (let i = 0; i <= 10; i++) {
        const y = padding + (height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + width, y);
        ctx.stroke();
    }
    
    // Dibujar ejes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    // Eje X
    const y0 = yToCanvas(0);
    if (y0 >= padding && y0 <= padding + height) {
        ctx.beginPath();
        ctx.moveTo(padding, y0);
        ctx.lineTo(padding + width, y0);
        ctx.stroke();
    }
    
    // Eje Y
    const x0 = xToCanvas(0);
    if (x0 >= padding && x0 <= padding + width) {
        ctx.beginPath();
        ctx.moveTo(x0, padding);
        ctx.lineTo(x0, padding + height);
        ctx.stroke();
    }
    
    // Dibujar función
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let firstPoint = true;
    
    for (let x = xMin; x <= xMax; x += xStep) {
        try {
            const y = evaluateFunction(f, x);
            if (!isNaN(y) && isFinite(y)) {
                const canvasX = xToCanvas(x);
                const canvasY = yToCanvas(y);
                
                if (firstPoint) {
                    ctx.moveTo(canvasX, canvasY);
                    firstPoint = false;
                } else {
                    ctx.lineTo(canvasX, canvasY);
                }
            }
        } catch (e) {}
    }
    ctx.stroke();
    
    // Dibujar iteraciones
    if (iterations && iterations.length > 0) {
        // Dibujar líneas verticales en a, b y c
        const lastIter = iterations[iterations.length - 1];
        
        // Línea en a
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(xToCanvas(lastIter.a), padding);
        ctx.lineTo(xToCanvas(lastIter.a), padding + height);
        ctx.stroke();
        
        // Línea en b
        ctx.beginPath();
        ctx.moveTo(xToCanvas(lastIter.b), padding);
        ctx.lineTo(xToCanvas(lastIter.b), padding + height);
        ctx.stroke();
        
        // Línea en c (punto medio)
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(xToCanvas(lastIter.c), padding);
        ctx.lineTo(xToCanvas(lastIter.c), padding + height);
        ctx.stroke();
        
        // Marcar el punto de la raíz
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(xToCanvas(lastIter.c), yToCanvas(lastIter.fc), 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Dibujar el intervalo actual
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fillRect(
            xToCanvas(lastIter.a),
            padding,
            xToCanvas(lastIter.b) - xToCanvas(lastIter.a),
            height
        );
        
        // Etiquetas
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('a', xToCanvas(lastIter.a), padding + height + 20);
        ctx.fillText('b', xToCanvas(lastIter.b), padding + height + 20);
        ctx.fillText('c', xToCanvas(lastIter.c), padding + height + 20);
        
        // Valores de las etiquetas
        ctx.font = '10px Arial';
        ctx.fillText(lastIter.a.toFixed(3), xToCanvas(lastIter.a), padding + height + 35);
        ctx.fillText(lastIter.b.toFixed(3), xToCanvas(lastIter.b), padding + height + 35);
        ctx.fillText(lastIter.c.toFixed(3), xToCanvas(lastIter.c), padding + height + 35);
    }
    
    // Etiquetas de ejes
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('x', canvas.width - 20, y0 >= padding && y0 <= padding + height ? y0 - 10 : padding + height / 2);
    ctx.textAlign = 'right';
    ctx.fillText('f(x)', x0 >= padding && x0 <= padding + width ? x0 - 10 : padding + width / 2, 20);
}

function calculate() {
    try {
        isStepByStep = false;
        currentIteration = 0;
        
        const funcStr = document.getElementById('function').value;
        const a = parseFloat(document.getElementById('a').value);
        const b = parseFloat(document.getElementById('b').value);
        const tolerance = parseFloat(document.getElementById('tolerance').value);
        const maxIter = parseInt(document.getElementById('maxIter').value);
        
        if (!funcStr || isNaN(a) || isNaN(b) || isNaN(tolerance) || isNaN(maxIter)) {
            showError('Por favor, complete todos los campos correctamente');
            return;
        }
        
        const f = parseFunction(funcStr);
        const result = bisectionMethod(f, a, b, tolerance, maxIter);
        
        updateTable(result);
        drawGraph(f, a, b, result);
        
        if (result.length > 0) {
            const lastResult = result[result.length - 1];
            showResult(lastResult);
            updateStats(lastResult, result.length);
        }
        
    } catch (error) {
        showError(error.message);
    }
}

function stepByStep() {
    try {
        if (!isStepByStep) {
            // Iniciar modo paso a paso
            isStepByStep = true;
            currentIteration = 0;
            iterationData = [];
            
            // Limpiar tabla
            document.getElementById('tableBody').innerHTML = '';
            
            // Preparar datos
            const funcStr = document.getElementById('function').value;
            const a = parseFloat(document.getElementById('a').value);
            const b = parseFloat(document.getElementById('b').value);
            const tolerance = parseFloat(document.getElementById('tolerance').value);
            const maxIter = parseInt(document.getElementById('maxIter').value);
            
            if (!funcStr || isNaN(a) || isNaN(b) || isNaN(tolerance) || isNaN(maxIter)) {
                showError('Por favor, complete todos los campos correctamente');
                isStepByStep = false;
                return;
            }
            
            const f = parseFunction(funcStr);
            
            // Validar cambio de signo
            const fa = evaluateFunction(f, a);
            const fb = evaluateFunction(f, b);
            
            if (fa * fb > 0) {
                showError('La función no cambia de signo en el intervalo dado');
                isStepByStep = false;
                return;
            }
        }
        
        // Ejecutar una iteración
        const funcStr = document.getElementById('function').value;
        let a = parseFloat(document.getElementById('a').value);
        let b = parseFloat(document.getElementById('b').value);
        const tolerance = parseFloat(document.getElementById('tolerance').value);
        const maxIter = parseInt(document.getElementById('maxIter').value);
        
        const f = parseFunction(funcStr);
        
        if (iterationData.length > 0) {
            const lastIter = iterationData[iterationData.length - 1];
            const fa = evaluateFunction(f, lastIter.a);
            const fc = evaluateFunction(f, lastIter.c);
            
            if (fa * fc < 0) {
                a = lastIter.a;
                b = lastIter.c;
            } else {
                a = lastIter.c;
                b = lastIter.b;
            }
        }
        
        if (currentIteration < maxIter && Math.abs(b - a) > tolerance) {
            const c = (a + b) / 2;
            const fa = evaluateFunction(f, a);
            const fc = evaluateFunction(f, c);
            
            const newRow = {
                iteration: currentIteration + 1,
                a: a,
                b: b,
                c: c,
                sign: fa * fc < 0 ? 'Negativo' : 'Positivo',
                fc: fc
            };
            
            iterationData.push(newRow);
            updateTable([newRow], true);
            drawGraph(f, a, b, iterationData);
            
            currentIteration++;
            
            if (Math.abs(fc) < tolerance || Math.abs(b - a) < tolerance) {
                showResult(newRow);
                updateStats(newRow, iterationData.length);
                isStepByStep = false;
            }
        } else {
            if (iterationData.length > 0) {
                showResult(iterationData[iterationData.length - 1]);
                updateStats(iterationData[iterationData.length - 1], iterationData.length);
            }
            isStepByStep = false;
        }
        
    } catch (error) {
        showError(error.message);
        isStepByStep = false;
    }
}

function showResult(result) {
    const resultBox = document.getElementById('resultBox');
    resultBox.innerHTML = `
        ✅ <strong>Raíz encontrada:</strong> x ≈ ${result.c.toFixed(8)}<br>
        📊 <strong>Valor de f(x):</strong> ${result.fc.toExponential(4)}
    `;
    resultBox.classList.add('show');
}

function updateStats(result, iterations) {
    document.getElementById('statsContainer').style.display = 'grid';
    document.getElementById('rootValue').textContent = result.c.toFixed(6);
    document.getElementById('iterValue').textContent = iterations;
    document.getElementById('errorValue').textContent = Math.abs(result.b - result.a).toExponential(3);
    document.getElementById('fValue').textContent = result.fc.toExponential(3);
}

function reset() {
    // Limpiar inputs
    document.getElementById('function').value = '';
    document.getElementById('a').value = '';
    document.getElementById('b').value = '';
    document.getElementById('tolerance').value = '0.0001';
    document.getElementById('maxIter').value = '100';
    
    // Limpiar tabla
    document.getElementById('tableBody').innerHTML = '';
    
    // Limpiar gráfica
    const canvas = document.getElementById('graph');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Ocultar resultados
    document.getElementById('resultBox').classList.remove('show');
    document.getElementById('statsContainer').style.display = 'none';
    document.getElementById('errorMessage').classList.remove('show');
    
    // Resetear variables
    currentIteration = 0;
    iterationData = [];
    isStepByStep = false;
}

// Agregar eventos de teclado
document.addEventListener('DOMContentLoaded', function() {
    // Permitir Enter para calcular
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !isStepByStep) {
            calculate();
        }
    });
    
    // Redimensionar canvas cuando cambia el tamaño de la ventana
    window.addEventListener('resize', function() {
        if (iterationData.length > 0) {
            const funcStr = document.getElementById('function').value;
            const f = parseFunction(funcStr);
            const a = parseFloat(document.getElementById('a').value);
            const b = parseFloat(document.getElementById('b').value);
            drawGraph(f, a, b, iterationData);
        }
    });
    
    // Ejemplo inicial
    setTimeout(() => {
        const exampleButton = document.createElement('button');
        exampleButton.textContent = '📚 Cargar Ejemplo';
        exampleButton.style.background = '#17a2b8';
        exampleButton.style.color = 'white';
        exampleButton.onclick = loadExample;
        document.querySelector('.button-container').appendChild(exampleButton);
    }, 100);
});

function loadExample() {
    // Cargar un ejemplo predefinido
    document.getElementById('function').value = 'x^3 - x - 2';
    document.getElementById('a').value = '1';
    document.getElementById('b').value = '2';
    document.getElementById('tolerance').value = '0.0001';
    document.getElementById('maxIter').value = '100';
    
    // Calcular automáticamente
    calculate();
}