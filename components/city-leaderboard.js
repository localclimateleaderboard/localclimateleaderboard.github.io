// city-leaderboard.js

class CityLeaderboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    // Observe the 'order' attribute so we can re-render if it changes dynamically
    static get observedAttributes() {
        return ['order'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'order' && oldValue !== newValue) {
            this.fetchAndRenderData(); // Re-render if order changes
        }
    }

    async connectedCallback() {
        this.renderSkeleton();
        await this.fetchAndRenderData();
    }

    renderSkeleton() {
        // Encapsulated Modern Leaderboard Styles
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
                    margin-bottom: 1.25rem;
                }
                .title {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #111827;
                }
                .subtitle {
                    margin: 0.25rem 0 0;
                    font-size: 0.8rem;
                    color: #6b7280;
                }
                .list {
                    margin: 0;
                    padding: 0;
                    list-style: none;
                }
                .list-item {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    background: #f9fafb;
                    border: 1px solid transparent;
                }
                .list-item:hover {
                    background: #f3f4f6;
                    border-color: #e5e7eb;
                }
                /* Rank number styling */
                .rank {
                    font-weight: 700;
                    font-size: 1.1rem;
                    color: #6b7280;
                    width: 1.5rem;
                    margin-right: 1rem;
                    text-align: right;
                }
                /* Special styling for top rank */
                .list-item:nth-child(1) {
                    background: #ecfdf5; /* Light green */
                    border-color: #a7f3d0;
                }
                .list-item:nth-child(1) .rank {
                    color: #059669; /* Emerald green */
                }
                .city-name {
                    flex-grow: 1;
                    font-weight: 500;
                    color: #374151;
                    font-size: 0.95rem;
                }
                .value {
                    font-weight: 700;
                    font-size: 1.1rem;
                    color: #111827;
                }
                .loading {
                    text-align: center;
                    color: #6b7280;
                    font-size: 0.875rem;
                    padding: 2rem 0;
                }
            </style>
            <div class="card">
                <div class="header">
                    <h2 class="title">City Leaderboard</h2>
                    <p class="subtitle" id="subtitle">According to most recent data</p>
                </div>
                <div id="content">
                    <div class="loading">Loading ranks...</div>
                </div>
            </div>
        `;
    }

    async fetchAndRenderData() {
        const src = this.getAttribute('src');
        if (!src) return;

        try {
            const response = await fetch(src);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const csvText = await response.text();
            
            const rawData = this.parseCSV(csvText);
            const sortedData = this.processLeaderboardData(rawData);
            
            this.renderList(sortedData);
        } catch (error) {
            this.shadowRoot.getElementById('content').innerHTML = 
                `<div class="loading" style="color: #ef4444;">Error: ${error.message}</div>`;
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

    processLeaderboardData(data) {
        if (data.length === 0) return [];

        // 1. Group by city and keep only the most recent entry
        const latestByCity = data.reduce((acc, current) => {
            const city = current.city;
            const currentDate = current.date;

            // If we haven't seen this city, or this record is newer than the one stored
            if (!acc[city] || currentDate > acc[city].date) {
                acc[city] = {
                    ...current,
                    value: parseFloat(current.value) || 0
                };
            }
            return acc;
        }, {});

        // 2. Convert the object back into an array
        const recentData = Object.values(latestByCity);


        // 4. Sort based on the 'order' prop
        const order = this.getAttribute('order') || 'asc';
        recentData.sort((a, b) => {
            return order === 'desc' ? b.value - a.value : a.value - b.value;
        });

        return recentData;
    }

    renderList(sortedData) {
        const contentEl = this.shadowRoot.getElementById('content');
        
        if (sortedData.length === 0) {
            contentEl.innerHTML = `<div class="loading">No data available for leaderboard.</div>`;
            return;
        }

        // Build the list HTML dynamically
        const listHTML = `
            <ol class="list">
                ${sortedData.map((item, index) => `
                    <li class="list-item">
                        <span class="rank">${index + 1}</span>
                        <span class="city-name">${item.city}</span>
                        <span class="value">${item.value.toLocaleString()}</span>
                    </li>
                `).join('')}
            </ol>
        `;
        
        contentEl.innerHTML = listHTML;
    }
}
customElements.define('city-leaderboard', CityLeaderboard);