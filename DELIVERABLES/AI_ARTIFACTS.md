Document your AI-assisted development:

- Include the actual prompts you used for each phase of your development process (planning, architecture, implementation, testing, etc.)
- Show the progression from initial problem understanding to final implementation
- Include at least one example where AI output required significant fixing and your follow-up prompts
- Note which IDE/tool you used (Cursor, Claude Code, Copilot, etc.)

## Prompts

### Planning

- Here are requirements for a project. I will build the solution as a full-stack web app. It will be centered on a chatbot (the copilot) with tool-calling abilities. The tools will be able to interact with the two workflows (i.e. CRUD apps, more or less). I will use one relational database with one file storage solution. For convenience, I will use Sveltekit with Tailwindcss and the hosting, database, and file storage will likely utilize Vercel's free tier services. Read through the requirements and be honest about whether you think my plan will suffice. Then, lay out a clean implementation plan for me. Don't be vague or high-level with generic bullet points, I need a technical plan to implement this quickly and efficiently.

### Implementation

- Change my POST function to take the user's request, then use my `streamInference` function to stream back the LLM response from the POST endpoint.

- Make the textarea in this component look good, and it should auto expand when text is added/removed, so it fits the size of the text. When the user clicks the "enter" button while the text area is focused, have it trigger a function called "handleSubmit"

- Look at my Chatbot component, and my server endpoint that produces a readable stream. When the user submits a chat message, it should send a post request to my server endpoint and create a stream of response objects back. Finish my chatbot component by adding a `ChatHistory` compnent in it, showing the chat messages including the newest content as its streamed in real-time.

- Take a look at my chatbot, and the server endpoint which streams from the LLM. My server endpoint is configured to also accept a parameter called useTools. Please modify my API endpoint and my chatbot to accept tool-calling. When the chatbot calls a tool, it should call the tool and add it to the chat history. You may have to make a new API endpoint in tools/+server.ts for executing tool calls. Ask me if you need help.
