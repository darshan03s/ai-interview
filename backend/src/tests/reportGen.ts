import dotenv from 'dotenv';
dotenv.config();
import { generateReportPrompt } from '@/llm/prompts';
import { AiMessageType } from '@/llm/types';
import { GeminiClient } from '@/llm/geminiClient';

const messages: AiMessageType[] = [
  {
    role: 'user',
    parts: [
      {
        text: 'Here is my resume. I have chosen to do a technical interview.'
      }
    ]
  },
  {
    role: 'model',
    parts: [
      {
        text: "Ok John Doe, let's start the interview. I have reviewed your resume. Your background in full-stack development and AI integration is impressive. Let's begin with your latest project. Can you explain its architecture?"
      }
    ]
  },
  {
    role: 'user',
    parts: [
      {
        text: 'It is a full-stack e-commerce application built using Spring Boot for backend and React for frontend. I implemented JWT authentication and deployed the backend on AWS EC2.'
      }
    ]
  },
  {
    role: 'model',
    parts: [
      {
        text: 'Good. How did you handle authentication and authorization in your application?'
      }
    ]
  },
  {
    role: 'user',
    parts: [
      {
        text: 'I implemented JWT-based authentication with stateless sessions. I also used role-based authorization for admin and user routes.'
      }
    ]
  },
  {
    role: 'model',
    parts: [
      {
        text: 'Thank you for your time, we will get back to you with the results.'
      }
    ]
  }
];

async function main() {
  const geminiClient = new GeminiClient(
    'flash',
    messages,
    generateReportPrompt + 'Interview created at: ' + `${new Date().toLocaleString()}`
  );

  const response = await geminiClient!.chatWithGemini('Now generate report.');

  console.dir(response, { depth: null, colors: true });
}

main();
