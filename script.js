// AgroX Plant Hybridization Frontend
// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global variables for charts
let typeChart, toleranceChart, regionChart;

// DOM Elements
const form = document.getElementById('hybridForm');
const resultContent = document.getElementById('resultContent');
const predictButton = document.querySelector('.predict-button');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('AgroX Frontend Initialized');
    
    // Update slider displays
    setupSliders();
    
    // Load initial data
    loadInitialData();
    
    // Setup form submission
    setupForm();
    
    // Setup example buttons
    setupExamples();
    
    // Setup chart generation button
    setupChartButton();
});

function setupSliders() {
    // Drought tolerance slider
    const droughtSlider = document.getElementById('drought');
    const droughtValue = document.getElementById('droughtValue');
    
    droughtSlider.addEventListener('input', function() {
        droughtValue.textContent = this.value + '%';
    });
    
    // Salinity tolerance slider
    const salinitySlider = document.getElementById('salinity');
    const salinityValue = document.getElementById('salinityValue');
    
    salinitySlider.addEventListener('input', function() {
        salinityValue.textContent = this.value + '%';
    });
}

function loadInitialData() {
    // Check API health
    checkAPIHealth();
    
    // Load statistics
    loadStatistics();
    
    // Load examples
    loadExamples();
}

function checkAPIHealth() {
    fetch(`${API_BASE_URL}/health`)
        .then(response => response.json())
        .then(data => {
            console.log('API Health:', data);
            if (data.model_loaded) {
                showNotification('AI model loaded successfully!', 'success');
            } else {
                showNotification('Using fallback predictions', 'warning');
            }
        })
        .catch(error => {
            console.error('API Health check failed:', error);
            showNotification('Backend server not responding', 'error');
        });
}

function loadStatistics() {
    fetch(`${API_BASE_URL}/statistics`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                updateStatisticsDisplay(data.statistics);
            }
        })
        .catch(error => {
            console.error('Error loading statistics:', error);
        });
}

function updateStatisticsDisplay(stats) {
    // You can update any statistics display elements here
    console.log('Model Statistics:', stats);
    
    // Example: Update accuracy display if you have one
    const accuracyElement = document.getElementById('modelAccuracy');
    if (accuracyElement && stats.accuracy) {
        accuracyElement.textContent = `Model Accuracy: ${stats.accuracy}%`;
    }
}

function loadExamples() {
    fetch(`${API_BASE_URL}/examples`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Examples loaded:', Object.keys(data.examples));
            }
        })
        .catch(error => {
            console.error('Error loading examples:', error);
        });
}

function setupForm() {
    if (predictButton) {
        predictButton.addEventListener('click', predictHybridization);
    }
}

function setupExamples() {
    // Setup example buttons if they exist
    const exampleButtons = document.querySelectorAll('.example-btn');
    exampleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const exampleType = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            loadExample(exampleType);
        });
    });
}

function setupChartButton() {
    const chartButton = document.querySelector('.generate-charts-btn');
    if (chartButton) {
        chartButton.addEventListener('click', generateCharts);
    }
}

// Load example configuration
function loadExample(exampleName) {
    fetch(`${API_BASE_URL}/examples`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const example = data.examples[exampleName];
                if (example) {
                    // Fill form with example data
                    document.getElementById('plantType').value = example.plantType;
                    document.getElementById('lifespan').value = example.lifespan;
                    document.getElementById('woodiness').value = example.woodiness;
                    
                    // Update sliders
                    const droughtSlider = document.getElementById('drought');
                    droughtSlider.value = example.drought_tolerance;
                    document.getElementById('droughtValue').textContent = example.drought_tolerance + '%';
                    
                    const salinitySlider = document.getElementById('salinity');
                    salinitySlider.value = example.salinity_tolerance;
                    document.getElementById('salinityValue').textContent = example.salinity_tolerance + '%';
                    
                    document.getElementById('region').value = example.region;
                    
                    // Show notification
                    showNotification(`Loaded ${example.name} configuration`, 'info');
                    
                    // Auto-predict if desired
                    // predictHybridization();
                }
            }
        })
        .catch(error => {
            console.error('Error loading example:', error);
            showNotification('Error loading example', 'error');
        });
}

// Main prediction function
async function predictHybridization() {
    // Show loading state
    showLoading();
    
    // Collect form data
    const formData = {
        plantType: document.getElementById('plantType').value,
        lifespan: document.getElementById('lifespan').value,
        woodiness: document.getElementById('woodiness').value,
        drought_tolerance: parseInt(document.getElementById('drought').value),
        salinity_tolerance: parseInt(document.getElementById('salinity').value),
        region: document.getElementById('region').value
    };
    
    try {
        // Call prediction API
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            displayResults(result);
            showNotification('Prediction completed successfully!', 'success');
        } else {
            throw new Error(result.error || 'Prediction failed');
        }
        
    } catch (error) {
        console.error('Prediction error:', error);
        displayError(error.message);
        showNotification('Error making prediction', 'error');
    }
}

function showLoading() {
    resultContent.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Analyzing plant characteristics...</p>
            <p class="loading-subtext">Evaluating drought tolerance, salinity resistance, and genetic compatibility</p>
        </div>
    `;
    resultContent.style.display = 'block';
    
    // Add loading class to results card
    const resultsCard = document.getElementById('resultsCard');
    resultsCard.classList.add('loading-state');
}

function displayResults(data) {
    const prediction = data.prediction;
    const region = data.region_analysis;
    const recommendations = data.recommendations || [];
    const factors = data.success_factors || [];
    
    // Determine result color and icon
    let resultColor, resultIcon, resultClass;
    if (prediction.success && prediction.confidence >= 70) {
        resultColor = '#51cf66';
        resultIcon = 'fas fa-check-circle';
        resultClass = 'high-success';
    } else if (prediction.success && prediction.confidence >= 50) {
        resultColor = '#ffd43b';
        resultIcon = 'fas fa-check-circle';
        resultClass = 'medium-success';
    } else {
        resultColor = '#ff6b6b';
        resultIcon = 'fas fa-times-circle';
        resultClass = 'low-success';
    }
    
    // Create results HTML
    resultContent.innerHTML = `
        <div class="prediction-result ${resultClass}">
            <!-- Result Header -->
            <div class="result-header">
                <i class="${resultIcon} result-icon"></i>
                <div class="result-title">
                    <h4>${prediction.success ? 'Hybridization Recommended' : 'Hybridization Not Recommended'}</h4>
                    <p class="result-subtitle">Confidence: ${prediction.confidence}%</p>
                </div>
            </div>
            
            <!-- Confidence Meter -->
            <div class="confidence-meter">
                <div class="meter-background">
                    <div class="meter-fill" style="width: ${prediction.confidence}%; background-color: ${resultColor};"></div>
                </div>
                <div class="meter-labels">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                </div>
            </div>
            
            <!-- Region Analysis -->
            <div class="region-analysis">
                <h5><i class="fas fa-map-marker-alt"></i> ${region.region_name}</h5>
                <div class="region-scores">
                    <div class="region-score">
                        <span class="score-label">Suitability</span>
                        <span class="score-value ${region.level}">${region.suitability_score}%</span>
                    </div>
                    <div class="region-score">
                        <span class="score-label">Drought Match</span>
                        <span class="score-value">${region.drought_match}%</span>
                    </div>
                    <div class="region-score">
                        <span class="score-label">Salinity Match</span>
                        <span class="score-value">${region.salinity_match}%</span>
                    </div>
                </div>
                <p class="region-recommendation"><i class="fas fa-info-circle"></i> ${region.recommendation}</p>
            </div>
            
            <!-- Success Factors -->
            <div class="success-factors">
                <h5><i class="fas fa-chart-line"></i> Key Success Factors</h5>
                <div class="factors-list">
                    ${factors.map(factor => `
                        <div class="factor-item">
                            <span class="factor-name">${factor.factor}</span>
                            <span class="factor-impact ${factor.impact.includes('+') ? 'positive' : factor.impact.includes('-') ? 'negative' : 'neutral'}">
                                ${factor.impact}
                            </span>
                            <p class="factor-reason">${factor.reason}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Recommendations -->
            <div class="recommendations">
                <h5><i class="fas fa-lightbulb"></i> Recommendations</h5>
                <ul class="recommendations-list">
                    ${recommendations.map(rec => `
                        <li>${rec}</li>
                    `).join('')}
                </ul>
            </div>
            
            <!-- Plant Features Summary -->
            <div class="features-summary">
                <h5><i class="fas fa-seedling"></i> Plant Characteristics</h5>
                <div class="features-grid">
                    <div class="feature">
                        <span class="feature-label">Type</span>
                        <span class="feature-value">${document.getElementById('plantType').options[document.getElementById('plantType').selectedIndex].text}</span>
                    </div>
                    <div class="feature">
                        <span class="feature-label">Lifespan</span>
                        <span class="feature-value">${document.getElementById('lifespan').options[document.getElementById('lifespan').selectedIndex].text}</span>
                    </div>
                    <div class="feature">
                        <span class="feature-label">Woodiness</span>
                        <span class="feature-value">${document.getElementById('woodiness').value === '1' ? 'Woody' : 'Non-woody'}</span>
                    </div>
                    <div class="feature">
                        <span class="feature-label">Drought Tolerance</span>
                        <span class="feature-value">${document.getElementById('drought').value}%</span>
                    </div>
                    <div class="feature">
                        <span class="feature-label">Salinity Tolerance</span>
                        <span class="feature-value">${document.getElementById('salinity').value}%</span>
                    </div>
                </div>
            </div>
            
            <!-- Timestamp -->
            <div class="timestamp">
                <small><i class="far fa-clock"></i> Prediction generated at ${new Date().toLocaleTimeString()}</small>
            </div>
        </div>
    `;
    
    // Remove loading class
    const resultsCard = document.getElementById('resultsCard');
    resultsCard.classList.remove('loading-state');
}

function displayError(errorMessage) {
    resultContent.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle error-icon"></i>
            <h4>Prediction Error</h4>
            <p>${errorMessage}</p>
            <button onclick="predictHybridization()" class="retry-button">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;
    resultContent.style.display = 'block';
    
    // Remove loading class
    const resultsCard = document.getElementById('resultsCard');
    resultsCard.classList.remove('loading-state');
}

// Generate charts
async function generateCharts() {
    try {
        // Show loading state for charts
        const chartButton = document.querySelector('.generate-charts-btn');
        const originalText = chartButton.innerHTML;
        chartButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Charts...';
        chartButton.disabled = true;
        
        // Fetch chart data
        const response = await fetch(`${API_BASE_URL}/charts`);
        const data = await response.json();
        
        if (data.status === 'success') {
            createCharts(data.charts);
            showNotification('Charts generated successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to generate charts');
        }
        
    } catch (error) {
        console.error('Chart generation error:', error);
        showNotification('Error generating charts', 'error');
        
        // Use sample data if API fails
        createSampleCharts();
    } finally {
        // Reset button
        const chartButton = document.querySelector('.generate-charts-btn');
        chartButton.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerate Charts';
        chartButton.disabled = false;
    }
}

function createCharts(chartData) {
    // Destroy existing charts
    if (typeChart) typeChart.destroy();
    if (toleranceChart) toleranceChart.destroy();
    if (regionChart) regionChart.destroy();
    
    // Chart 1: Success by Plant Type
    const typeCtx = document.getElementById('typeChart').getContext('2d');
    typeChart = new Chart(typeCtx, {
        type: 'bar',
        data: {
            labels: chartData.type_chart.labels,
            datasets: [{
                label: 'Success Rate (%)',
                data: chartData.type_chart.success_rates,
                backgroundColor: chartData.type_chart.colors,
                borderColor: chartData.type_chart.colors.map(color => color.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Hybridization Success by Plant Type'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Success Rate (%)'
                    }
                }
            }
        }
    });
    
    // Chart 2: Drought Tolerance Distribution
    const toleranceCtx = document.getElementById('toleranceChart').getContext('2d');
    toleranceChart = new Chart(toleranceCtx, {
        type: 'line',
        data: {
            labels: chartData.tolerance_chart.labels,
            datasets: [
                {
                    label: 'Number of Plants',
                    data: chartData.tolerance_chart.counts,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Success Rate (%)',
                    data: chartData.tolerance_chart.success_rates,
                    borderColor: '#51cf66',
                    backgroundColor: 'rgba(81, 207, 102, 0.1)',
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Drought Tolerance Analysis'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Number of Plants'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    max: 100,
                    title: {
                        display: true,
                        text: 'Success Rate (%)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
    
    // Chart 3: Region Analysis
    const regionCtx = document.getElementById('regionChart').getContext('2d');
    regionChart = new Chart(regionCtx, {
        type: 'radar',
        data: {
            labels: chartData.region_chart.labels,
            datasets: [{
                label: 'Suitability Score',
                data: chartData.region_chart.suitability_scores,
                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                borderColor: 'rgb(33, 150, 243)',
                pointBackgroundColor: 'rgb(33, 150, 243)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(33, 150, 243)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Regional Suitability Analysis'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });
}

function createSampleCharts() {
    // Sample data for charts when API is not available
    const sampleData = {
        type_chart: {
            labels: ['Herbaceous', 'Shrubs', 'Trees'],
            success_rates: [58.3, 72.1, 68.7],
            colors: ['#4CAF50', '#8BC34A', '#CDDC39']
        },
        tolerance_chart: {
            labels: ['Low (<30%)', 'Medium (30-70%)', 'High (>70%)'],
            counts: [25, 50, 25],
            success_rates: [32.0, 65.5, 84.2]
        },
        region_chart: {
            labels: ['Coastal', 'High Plateaus', 'Sahara'],
            suitability_scores: [78.5, 62.3, 45.7],
            colors: ['#2196F3', '#FF9800', '#F44336']
        }
    };
    
    createCharts(sampleData);
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS for notifications and loading states
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .notification-success {
        background: linear-gradient(135deg, #51cf66, #40c057);
        border-left: 4px solid #2b8a3e;
    }
    
    .notification-error {
        background: linear-gradient(135deg, #ff6b6b, #fa5252);
        border-left: 4px solid #c92a2a;
    }
    
    .notification-warning {
        background: linear-gradient(135deg, #ffd43b, #fab005);
        border-left: 4px solid #e67700;
        color: #333;
    }
    
    .notification-info {
        background: linear-gradient(135deg, #339af0, #228be6);
        border-left: 4px solid #1864ab;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        margin-left: auto;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .loading {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }
    
    .loading i {
        margin-bottom: 20px;
        color: #4CAF50;
    }
    
    .loading-subtext {
        font-size: 0.9em;
        color: #888;
        margin-top: 10px;
    }
    
    .loading-state {
        position: relative;
    }
    
    .loading-state::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.8);
        z-index: 1;
    }
    
    .prediction-result {
        padding: 20px;
    }
    
    .result-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
    }
    
    .result-icon {
        font-size: 2.5em;
    }
    
    .high-success .result-icon {
        color: #51cf66;
    }
    
    .medium-success .result-icon {
        color: #ffd43b;
    }
    
    .low-success .result-icon {
        color: #ff6b6b;
    }
    
    .confidence-meter {
        margin: 25px 0;
    }
    
    .meter-background {
        height: 10px;
        background: #e9ecef;
        border-radius: 5px;
        overflow: hidden;
    }
    
    .meter-fill {
        height: 100%;
        border-radius: 5px;
        transition: width 1s ease-out;
    }
    
    .meter-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        font-size: 0.8em;
        color: #666;
    }
    
    .region-analysis, .success-factors, .recommendations, .features-summary {
        margin: 25px 0;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 10px;
    }
    
    .region-scores {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        margin: 15px 0;
    }
    
    .region-score {
        text-align: center;
        padding: 10px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .score-label {
        display: block;
        font-size: 0.8em;
        color: #666;
        margin-bottom: 5px;
    }
    
    .score-value {
        display: block;
        font-size: 1.5em;
        font-weight: bold;
    }
    
    .score-value.high {
        color: #51cf66;
    }
    
    .score-value.medium {
        color: #ffd43b;
    }
    
    .score-value.low {
        color: #ff6b6b;
    }
    
    .factors-list {
        margin-top: 15px;
    }
    
    .factor-item {
        padding: 10px;
        margin: 10px 0;
        background: white;
        border-radius: 8px;
        border-left: 4px solid #ddd;
    }
    
    .factor-item .positive {
        color: #51cf66;
    }
    
    .factor-item .negative {
        color: #ff6b6b;
    }
    
    .factor-item .neutral {
        color: #666;
    }
    
    .recommendations-list {
        margin: 0;
        padding-left: 20px;
    }
    
    .recommendations-list li {
        margin: 8px 0;
        padding-left: 5px;
    }
    
    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin-top: 15px;
    }
    
    .feature {
        padding: 10px;
        background: white;
        border-radius: 8px;
        text-align: center;
    }
    
    .feature-label {
        display: block;
        font-size: 0.8em;
        color: #666;
        margin-bottom: 5px;
    }
    
    .feature-value {
        display: block;
        font-weight: bold;
        color: #333;
    }
    
    .timestamp {
        text-align: center;
        margin-top: 20px;
        color: #888;
        font-size: 0.9em;
    }
    
    .error-message {
        text-align: center;
        padding: 40px 20px;
        color: #ff6b6b;
    }
    
    .error-icon {
        font-size: 3em;
        margin-bottom: 20px;
    }
    
    .retry-button {
        margin-top: 20px;
        padding: 10px 20px;
        background: #ff6b6b;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background 0.3s;
    }
    
    .retry-button:hover {
        background: #fa5252;
    }
`;
document.head.appendChild(style);