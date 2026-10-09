const messages = document.querySelector('#messages');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');
const replyForm = document.querySelector('#reply-form');
const replyInput = document.querySelector('#reply-input');

let sessionText = '';
let sessionEnded = false;

function addMessage(text, kind) {
  const message = document.createElement('div');
  message.className = `message ${kind}`;
  message.textContent = text;
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}

async function requestMenu(text) {
  const response = await fetch('/ussd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ sessionId: 'browser-demo', serviceCode: '*123#', phoneNumber: 'demo', text }),
  });
  if (!response.ok) throw new Error('Could not reach the local USSD service.');
  return response.text();
}

async function startSession() {
  sessionText = '';
  sessionEnded = false;
  messages.replaceChildren();
  startButton.hidden = true;
  restartButton.hidden = false;
  replyForm.hidden = true;
  try {
    showServiceResponse(await requestMenu(''));
  } catch (error) {
    addMessage(error.message, 'service');
    finishSession();
  }
}

function showServiceResponse(responseText) {
  const [control, ...messageParts] = responseText.split(' ');
  const message = messageParts.join(' ').trim();
  addMessage(message, 'service');
  if (control === 'CON') {
    replyForm.hidden = false;
    replyInput.value = '';
    replyInput.focus();
  } else {
    finishSession();
  }
}

function finishSession() {
  sessionEnded = true;
  replyForm.hidden = true;
  startButton.hidden = true;
  restartButton.hidden = false;
}

replyForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (sessionEnded) return;
  const answer = replyInput.value.trim();
  if (!answer) {
    replyInput.focus();
    return;
  }
  addMessage(answer, 'user');
  sessionText = sessionText ? `${sessionText}*${answer}` : answer;
  replyForm.hidden = true;
  try {
    showServiceResponse(await requestMenu(sessionText));
  } catch (error) {
    addMessage(error.message, 'service');
    finishSession();
  }
});

startButton.addEventListener('click', startSession);
restartButton.addEventListener('click', startSession);
