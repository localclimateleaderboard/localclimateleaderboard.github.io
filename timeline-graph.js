// timeline-graph.js

class TimelineGraph extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['src', 'title'];
    }

    async connectedCallback() {
        this.renderSkeleton();
        await this.loadChartJS();
        await this.fetchAndRenderData();
    }

    renderSkeleton() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    max-width: 900px;
                    font-family: inherit;
                }
                .card {
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    border: 1px solid #e5e7eb;
                }
                .header {
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid #f3f4f6;
                    padding-bottom: 0.75rem;
                }
                .title {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #111827;
                }
                .chart-container {
                    position: relative;
                    height: 400px;
                    width: 100%;
                }
                .loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    color: #6b7280;
                    font-size: 0.875rem;
                }
            </style>
            <div class="card">
                <div class="header">
                    <h2 class="title">${this.getAttribute('title') || 'Timeline Graph'}</h2>
                </div>
                <div class="chart-container">
                    <div class="loading">Loading data...</div>
                    <canvas id="chart"></canvas>
                </div>
            </div>
        `;
    }

    loadChartJS() {
        return new Promise((resolve) => {
            if (window.Chart) return resolve();
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    async fetchAndRenderData() {
        const src = this.getAttribute('src');
        if (!src) return;

        try {
            // This will now fetch 'data.csv' if src="data.csv"
            const response = await fetch(src);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch CSV: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            this.drawChart(data);
        } catch (error) {
            const container = this.shadowRoot.querySelector('.chart-container');
            container.innerHTML = `<div class="loading" style="color: #ef4444;">Error: ${error.message}</div>`;
            console.error('Timeline component error:', error);
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index].trim();
                return obj;
            }, {});
        });
    }

    drawChart(data) {
        const loadingEl = this.shadowRoot.querySelector('.loading');
        if (loadingEl) loadingEl.remove();

        const canvas = this.shadowRoot.getElementById('chart');
        const ctx = canvas.getContext('2d');

        const dates = [...new Set(data.map(d => d.date))].sort();
        const cities = [...new Set(data.map(d => d.city))];
        const colors = ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

        const datasets = cities.map((city, index) => {
            const color = colors[index % colors.length];
            const cityData = dates.map(date => {
                const record = data.find(d => d.city === city && d.date === date);
                return record ? parseFloat(record.value) : null;
            });

            return {
                label: city,
                data: cityData,
                borderColor: color,
                backgroundColor: color,
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: color,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.3 
            };
        });

        new Chart(ctx, {
            type: 'line',
            data: { labels: dates, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { family: 'inherit' } } },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            afterLabel: (context) => {
                                const city = context.dataset.label;
                                const date = context.label;
                                const record = data.find(d => d.city === city && d.date === date);
                                return record && record.source ? `Source: ${record.source}` : '';
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { border: { display: false }, grid: { color: '#f3f4f6' } }
                }
            }
        });
    }

    getMockCSV() {
        return `date,city,value,source
2023-01-01,New York,120,Internal
2023-01-01,London,85,External
2023-01-01,Tokyo,150,Internal
2023-02-01,New York,135,Internal
2023-02-01,London,90,External
2023-02-01,Tokyo,145,Internal`;
    }
}

// Register the custom element
customElements.define('timeline-graph', TimelineGraph);