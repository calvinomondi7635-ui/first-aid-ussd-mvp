const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const EMERGENCY_NUMBER = process.env.EMERGENCY_NUMBER || '';

const regions = {
  '1': {
    name: 'Head',
    symptoms: ['Headache or head pain', 'Dizziness or fainting', 'Head injury or bleeding', 'Other head concern'],
  },
  '2': {
    name: 'Chest',
    symptoms: ['Chest pain or pressure', 'Breathing problem', 'Cough or fever', 'Other chest concern'],
  },
  '3': {
    name: 'Abdomen',
    symptoms: ['Stomach pain', 'Vomiting or diarrhoea', 'Pregnancy-related concern', 'Other abdomen concern'],
  },
  '4': {
    name: 'Lower abdomen to feet',
    symptoms: ['Lower abdominal or pelvic pain', 'Urinary concern', 'Leg or foot pain or injury', 'Bleeding or swelling', 'Other concern'],
  },
};

const menu = (title, options) => `CON ${title}\n${options.map((option, index) => `${index + 1}. ${option}`).join('\n')}\n0. Exit`;

function emergencyMessage() {
  const contact = EMERGENCY_NUMBER
    ? `Call ${EMERGENCY_NUMBER} now or ask someone nearby to call.`
    : 'Call your local emergency number now, or ask someone nearby to help you reach the nearest health facility.';
  return `END This may need urgent help. ${contact} Do not wait for another USSD response. This service cannot diagnose or send help.`;
}

function handleUssd(rawText = '') {
  const text = String(rawText).trim();
  if (!text) {
    return menu('Select the area:', [
      'Head',
      'Chest',
      'Abdomen',
      'Lower abdomen to feet',
      'Emergency / severe symptoms',
    ]);
  }

  const answers = text.split('*').map((answer) => answer.trim());
  const regionChoice = answers[0];
  if (regionChoice === '0') return 'END Session ended.';
  if (regionChoice === '5') return emergencyMessage();
  if (!regions[regionChoice]) {
    return `CON Invalid selection.\n${menu('Select the area:', ['Head', 'Chest', 'Abdomen', 'Lower abdomen to feet', 'Emergency / severe symptoms']).replace(/^CON /, '')}`;
  }

  const region = regions[regionChoice];
  if (answers.length === 1) return menu(`What is your main concern? (${region.name})`, region.symptoms);
  if (answers[1] === '0') return 'END Session ended.';
  if (!Number.isInteger(Number(answers[1])) || Number(answers[1]) < 1 || Number(answers[1]) > region.symptoms.length) {
    return `CON Invalid selection.\n${menu(`What is your main concern? (${region.name})`, region.symptoms).replace(/^CON /, '')}`;
  }

  if (answers.length === 2) {
    return menu('Is any of this happening now: severe trouble breathing, unconsciousness, heavy bleeding, seizure, severe chest pain, sudden weakness, or rapidly worsening symptoms?', ['Yes', 'No', 'Not sure']);
  }

  if (answers[2] === '0') return 'END Session ended.';
  if (answers[2] === '1' || answers[2] === '3') return emergencyMessage();
  if (answers[2] !== '2') {
    return 'CON Choose one:\n1. Yes\n2. No\n3. Not sure\n0. Exit';
  }

  return 'END Contact a health worker or clinic for assessment as soon as practical. This service cannot diagnose or confirm that a problem is safe. If symptoms become severe or rapidly worsen, seek emergency help immediately.';
}

function sendText(response, statusCode, text) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(text);
}

function serveStatic(pathname, response) {
  const requestedPath = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const filePath = path.resolve(PUBLIC_DIR, `.${requestedPath}`);
  if (!filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500);
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    const extension = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
    };
    response.writeHead(200, { 'Content-Type': contentTypes[extension] || 'application/octet-stream' });
    response.end(contents);
  });
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'POST' && requestUrl.pathname === '/ussd') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 16_384) request.destroy();
    });
    request.on('end', () => {
      const contentType = request.headers['content-type'] || '';
      let input;
      try {
        if (contentType.includes('application/json')) {
          input = JSON.parse(body);
        } else {
          input = Object.fromEntries(new URLSearchParams(body));
        }
      } catch {
        sendText(response, 400, 'END Invalid request.');
        return;
      }
      sendText(response, 200, handleUssd(input.text || ''));
    });
    return;
  }

  if (request.method === 'GET') {
    serveStatic(requestUrl.pathname, response);
    return;
  }

  sendText(response, 405, 'Method not allowed');
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`First Aid USSD MVP running at http://localhost:${PORT}`);
  });
}

module.exports = { handleUssd, server };
