npm start# First Aid USSD MVP

A small, runnable prototype with a browser-based USSD simulator and a `POST /ussd` endpoint. It uses only built-in Node.js modules. The flow is a demonstration, not clinically validated guidance or a substitute for care.

## Requirements

- Node.js 18 or newer

## Run locally

From this directory:

```powershell
npm start
```

Open [http://localhost:3000](http://localhost:3000). To use another port, set `PORT` before starting the server:

```powershell
$env:PORT = '3100'
npm start
```

Optional emergency number shown by the urgent-help response:

```powershell
$env:EMERGENCY_NUMBER = 'your-local-number'
npm start
```

Do not configure a number until it has been confirmed for the deployment area. Without it, the flow tells the user to contact their local emergency number or reach the nearest health facility.

## Run tests

```powershell
npm test
```

## USSD gateway integration

The server accepts `POST /ussd` with URL-encoded fields (`sessionId`, `serviceCode`, `phoneNumber`, `text`) and returns a plain-text response beginning with `CON` or `END`. It also accepts JSON for local integration tests. The `text` field is the gateway's accumulated sequence of menu selections, such as `2*1*2`.

For a live telecom integration, deploy this server behind a public HTTPS URL and configure your USSD provider to call `/ussd`. Provider account setup, request signing/verification, availability, local language translations, emergency contacts, referral facilities, privacy/legal review, and clinical approval are not included. Add the provider's authentication and request validation before exposing the endpoint publicly.

## Safety and deployment

- The first menu lists Head, Chest, Abdomen, Lower abdomen to feet, then Emergency / severe symptoms.
- A user reporting a danger sign or uncertainty is routed to urgent-help instructions. A non-danger response receives a referral to a health worker; it does not receive a diagnosis or medication recommendation.
- The prototype does not dispatch help, locate facilities, contact clinicians, retain patient records, or guarantee a response.
- The wording and triage rules are placeholders. Qualified local clinicians must validate every question, red flag, translation, and recommended action before real-world use. Do not launch as a clinical service until this work and applicable regulatory, privacy, and security reviews are complete.
