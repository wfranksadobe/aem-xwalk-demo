/*
 * Table Tournament Block
 * Fetches tournament data from AEM GraphQL and renders a sortable table.
 * Falls back to static authored content if the feed is unavailable.
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

const FEED_URL = 'https://publish-p154716-e1630108.adobeaemcloud.com/graphql/execute.json/aem-xwalk-demo/Tournaments';

const COLUMN_HEADERS = ['Start', 'End', 'Events', 'Category', 'Surface', 'Region'];

function formatDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function fetchTournaments() {
  try {
    const resp = await fetch(FEED_URL);
    if (!resp.ok) return null;
    const json = await resp.json();
    const items = json?.data?.tournamentsList?.items;
    if (!items || items.length === 0) return null;
    items.sort((a, b) => a.startDate.localeCompare(b.startDate));
    return items;
  } catch {
    return null;
  }
}

function buildFeedTable(tournaments) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const headerRow = document.createElement('tr');
  COLUMN_HEADERS.forEach((text) => {
    const th = document.createElement('th');
    th.setAttribute('scope', 'column');
    th.textContent = text;
    headerRow.append(th);
  });
  thead.append(headerRow);

  tournaments.forEach((t) => {
    const tr = document.createElement('tr');

    const tdStart = document.createElement('td');
    tdStart.textContent = formatDate(t.startDate);

    const tdEnd = document.createElement('td');
    tdEnd.textContent = formatDate(t.endDate);

    const tdEvents = document.createElement('td');
    const pName = document.createElement('p');
    pName.textContent = t.eventName;
    tdEvents.append(pName);
    if (t.eventVenue) {
      const pVenue = document.createElement('p');
      pVenue.textContent = `Venue: ${t.eventVenue}`;
      tdEvents.append(pVenue);
    }

    const tdCategory = document.createElement('td');
    tdCategory.textContent = t.category;

    const tdSurface = document.createElement('td');
    tdSurface.textContent = t.surface;

    const tdRegion = document.createElement('td');
    tdRegion.textContent = t.region;

    tr.append(tdStart, tdEnd, tdEvents, tdCategory, tdSurface, tdRegion);
    tbody.append(tr);
  });

  table.append(thead, tbody);
  return table;
}

function buildStaticTable(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const header = !block.classList.contains('no-header');

  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);

    [...row.children].forEach((cell) => {
      const td = document.createElement(i === 0 && header ? 'th' : 'td');
      if (i === 0) td.setAttribute('scope', 'column');
      td.innerHTML = cell.innerHTML;
      tr.append(td);
    });
    if (i === 0 && header) thead.append(tr);
    else tbody.append(tr);
  });
  table.append(thead, tbody);
  return table;
}

export default async function decorate(block) {
  const tournaments = await fetchTournaments();

  if (tournaments) {
    block.replaceChildren(buildFeedTable(tournaments));
  } else {
    block.replaceChildren(buildStaticTable(block));
  }
}
