document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('prediction-form');
    const predictionPercentageElement = document.getElementById('prediction-percentage');
    const riskLevelElement = document.getElementById('risk-level');
    const statusMessage = document.getElementById('status-message');
    const ctx = document.getElementById('predictionChart').getContext('2d');

    // Initialize the Chart.js Pie/Doughnut Chart
    const predictionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Heart Disease Risk', 'Remaining Health'],
            datasets: [{
                data: [0, 100], 
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)', 
                    'rgba(75, 192, 192, 0.8)'  
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Heart Disease Risk Breakdown'
                }
            }
        }
    });

    // Form Submission Handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        statusMessage.textContent = 'Analyzing data...';
        statusMessage.className = 'mt-2 text-center text-info';

        // 1. Collect all form data
        const formData = new FormData(form);
        const data = {};
        
        // This loop collects all 13 features from the HTML form
        for (let [key, value] of formData.entries()) {
            // Convert numerical inputs to float/integer
            data[key] = isNaN(parseFloat(value)) ? value : parseFloat(value);
        }
        
        // 2. Send data to Flask API
        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                const percentage = result.prediction_percentage;
                const remaining = 100 - percentage;
                
                // 3. Update the displayed percentage
                predictionPercentageElement.textContent = `${percentage}%`;
                
                // 4. Update the risk level text
                let levelText = '';
                if (percentage < 30) {
                    levelText = 'Low Risk';
                    riskLevelElement.className = 'lead text-success';
                } else if (percentage < 60) {
                    levelText = 'Moderate Risk';
                    riskLevelElement.className = 'lead text-warning';
                } else {
                    levelText = 'High Risk - Consult a Physician!';
                    riskLevelElement.className = 'lead text-danger';
                }
                riskLevelElement.textContent = levelText;
                
                // 5. Update the Chart.js graph
                predictionChart.data.datasets[0].data = [percentage, remaining];
                predictionChart.update();

                statusMessage.textContent = 'Prediction complete!';
                statusMessage.className = 'mt-2 text-center text-success';

            } else {
                // If the Flask app returns success: false
                predictionPercentageElement.textContent = 'Error';
                riskLevelElement.textContent = 'Prediction failed. Check console.';
                statusMessage.textContent = `Error: ${result.error}`;
                statusMessage.className = 'mt-2 text-center text-danger';
                console.error('API Error:', result.error);
            }

        } catch (error) {
            // If the fetch call itself fails (e.g., server down, network issue)
            console.error('Fetch error:', error);
            statusMessage.textContent = 'Network or Server Error.';
            statusMessage.className = 'mt-2 text-center text-danger';
        }
    });
});