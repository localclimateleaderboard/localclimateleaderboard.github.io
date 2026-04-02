// timeline-graph.js

class TimelineGraph extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
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
                    font-family: inherit;
                }
                .card {
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    border: 1px solid #e5e7eb;
                    box-sizing: border-box;
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
                    height: 400px; /* Base height */
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
                    <div class="loading">Loading graph...</div>
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
            const response = await fetch(src);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const csvText = await response.text();
            const data = this.parseCSV(csvText);
            this.drawChart(data);
        } catch (error) {
            this.shadowRoot.querySelector('.chart-container').innerHTML = 
                `<div class="loading" style="color: #ef4444;">Error: ${error.message}</div>`;
            console.error('Graph Error:', error);
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

        const ctx = this.shadowRoot.getElementById('chart').getContext('2d');
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
                pointRadius: 4,
                tension: 0.3 
            };
        });

        new Chart(ctx, {
            type: 'line',
            data: { labels: dates, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { usePointStyle: true, boxWidth: 8 } },
                    tooltip: {
                        callbacks: {
                            afterLabel: (ctx) => {
                                const record = data.find(d => d.city === ctx.dataset.label && d.date === ctx.label);
                                return record ? `Source: ${record.source}` : '';
                            }
                        }
                    }
                },
                scales: { x: { grid: { display: false } }, y: { border: { display: false } } }
            }
        });
    }
}
customElements.define('timeline-graph', TimelineGraph);