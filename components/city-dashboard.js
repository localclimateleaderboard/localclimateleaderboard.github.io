// city-dashboard.js
class CityDashboard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const src = this.getAttribute('src') || 'dashboard-data.csv';
        const title = this.getAttribute('title') || 'City Performance';
        const order = this.getAttribute('order') || 'asc';
        const subtitle = this.getAttribute('subtitle') || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                .dashboard-grid {
                    display: grid;
                    gap: 2rem;
                    grid-template-columns: 1fr; /* Stacked on mobile */
                }

                /* Desktop layout: 60% / 30% split */
                @media (min-width: 1024px) {
                    .dashboard-grid {
                        grid-template-columns: 1.2fr 0.6fr; 
                        align-items: start;
                    }
                }

                h1 {
                    font-size: 1.5rem;
                    color: #111827;
                    margin-bottom: 1.5rem;
                }
            </style>
            
            <section>
                <h1>${title}</h1>
                <h3>${subtitle}</h3>
                <div class="dashboard-grid">
                    <timeline-graph src="${src}" title="Data Timeline"></timeline-graph>
                    <city-leaderboard src="${src}" order="${order}"></city-leaderboard>
                </div>
            </section>
        `;
    }
}

customElements.define('city-dashboard', CityDashboard);