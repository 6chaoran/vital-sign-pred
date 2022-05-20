import Chart from "chart.js/auto";

function plotChart(canvas, x, y, label, seriesColor) {
    const data = {
        labels: x,
        datasets: [
            {
                label: label,
                backgroundColor: seriesColor,
                borderColor: seriesColor,
                data: y,
            }
        ]
    };
    const config = {
        type: "line",
        data,
        options: {
            maintainAspectRatio: false,
            elements: {
                point: {
                    radius: 0,
                }
            },
            plugins: {
                legend: {
                    align: "start",
                },
            }
        }
    };
    const obj = new Chart(canvas, config);
    return obj;
}

export { plotChart };