# Russian classroom voice chatbot

A Netlify-ready Russian conversation partner using Gemini Live, real microphone audio, spoken replies, live captions, microphone mute, interruptions and transcript download. English instructions; slow beginner Russian; one question at a time; five questions per activity. No server conversation storage or audio recording.

## Set up Netlify

1. At https://app.netlify.com choose **Add new project → Import an existing project → GitHub**.
2. Select **Serafima805/Russianchatbot-** and the **main** branch. The repository supplies the build command (`npm run build`) and publish directory (`dist`).
3. In the site's **Environment variables**, add `GEMINI_API_KEY` (your key from https://aistudio.google.com/apikey) and `CLASS_ACCESS_CODE` (a long classroom password of your choice). Keep both scoped to Functions/runtime and never put the API key in GitHub or browser code.
4. Upload your slides in **classroom-materials**. Read the instructions in that folder. Edit `classroom-config.json` to set the active week and assignment for everyone.
5. Deploy/redeploy. Open the HTTPS Netlify URL, enter the classroom code, press **Start conversation**, and allow microphone access. Test with headphones before sharing with students.

A Gemini API account with access and quota for Live is required; Google usage may incur charges. Set Google billing budgets/quotas. A shared class code is a simple access gate, not per-student authentication. Anyone with that code can request sessions; rotate it if shared outside class. Each token starts one session, expires after at most eight minutes, and is locked to the teacher's model and course instructions. For institution-wide use add individual sign-in and durable rate limiting.

Default model: `gemini-3.8-live`, following Google's current Live documentation. Set `GEMINI_LIVE_MODEL` in Netlify to another available compatible Live model if your Google project requires it; set `GEMINI_API_VERSION` if needed (default `v1beta`). Model availability can change. Neither a Gemini key nor Netlify deployment is included in this repository.

## Classroom content

The build extracts PPTX slide text, DOCX, text-based PDF, TXT and MD files. Documents must have `Week N` in their filename. Each new deployment re-extracts all materials; new conversations use the updated data. Sessions already running keep their original context. `maxWeek` controls which documents Gemini receives. The full eligible context is injected in server-locked system instructions; this is suitable for a small class and caps context at 180,000 characters, failing clearly if exceeded. AI compliance with level and question-count constraints is best effort; teacher review remains necessary.

The repository is public. Change it to private before adding private course materials. Course text and microphone audio go to Google; students' transcripts remain in their browser until downloaded and are lost on refresh. This version does not save recordings or submit student work to a teacher.

## Local development

Use Node 22 or newer. Run `npm ci`, `npm test`, then `npm run build`. Copy `.env.example` to `.env`, fill values locally, and run `npm run dev` (Netlify CLI serves both frontend and function). Restart development after editing materials and run the build to regenerate them. Never commit `.env`.

## Architecture

Netlify serves the Vite-built frontend. A Netlify Function validates the classroom access code, loads extracted materials, and mints a short-lived constrained Gemini token. The browser streams PCM16 16kHz microphone audio directly to Gemini via the Google SDK and plays PCM 24kHz responses. The long-lived key stays on Netlify. Browser AudioWorklet capture includes resampling. End, disconnection, permission errors and the session timer release the microphone and audio resources.

Reference: https://aistudio.google.com/docs/live-api and https://aistudio.google.com/docs/live-api/ephemeral-tokens
