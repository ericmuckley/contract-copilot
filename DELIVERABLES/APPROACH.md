# Approach

My approach to the problem.

## AI tools

- **Copilot inside VSCode**: My dominant AI tool while coding. Recently I find that Claude Sonnet 4.5 gives me the most robust epxerience overall in terms of quality and speed, and in VSCode I can easily switch to lower-quality models for specific tasks (like editing CSS) to help conserve premium tokens. I generally keep Copilot in agent mode so it directly edits the files in VSCode inresponse to my chat messages. I review and refine the changes, usually by some combination of manual editing and providing followup prompts in the chat.

- **Github Copilot Agent**: For complex or long-running tasks. I create a GitHub issue and assign the issue to Copilot. After Copilot opens a pull request, I pull the changes, run locally, refine, and then merge the PR.

- **AWS Bedrock**: For embedding AI in applications like RAG apps or chatbots. I create a Bedrock API key specific to the application, then I can call multiple embeddings models and LLMs from the same SDK or API interface. This is even better when the app is hosted in AWS, because I can give the backend container or lambda function permission to access Bedrock without providing API keys at all.

## Prompting strategy

- **Providing the right context**: I add specific files to the LLM context and I reference those filenames in my prompt to indicate how I expect them to be used, and why I'm adding them to context.

- **Setting guardrails**: I mention existing function names, component names, variable names, or API endpoints, and tell the LLM to use those resources to solve a task. I will also create a couple empty files or components in the locations I want them in the codebase, and tell the LLM to populate its solution there. This helps prevent deduplication of things like utility functions, variables, and installation of redundant packages.

- **Keeping consistent memory**: My repo contains a `.github/copiot-instructions.md` file that gives an overview of stack, architecture and coding style. This helps maintain consistency across the repo. As the codebase grows, I often have the LLM rebuild the instructions file to reflect the new changes.

## Biggest pivot/surprise during implementation

Before I spent the effort to really understand the problem statement, I gave the problem to Copilot Agent to see if it could one-shot the contracts workflow. The agent created a full working contracts workflow and successfully integrated it with my Postgres and Blob storage services, so I decided to keep building on top of that success.

After building more on that initial implementation, I realized that it was a complete mess. The agent had created about 12 different interrelated tables in Postgres just for the contracts workflow piece. I decided that if I wanted to build out a solid solution, I'd have to remove the current data model, think harder about a simpler data model, and commit to a large refactor to implement it. The pivot was time-consuming but necessary, and (once again) proved that spending effort to plan with human-in-the-loop is critical. Skipping the planning stages is usually a mistake, even when the agent can one-shot something that looks workable right off the bat.

## What I'd do differently with more time

With more time I'd merge the concept of the contract/agreement workflow with the project estimate workflow. I'd create a higher-level "project" abstraction, which contains an estimate workflow, as well as multiple contracts / agreements under it. The current problem description, and my implementation, place an artificial separation between the contract workflow and estimate workflow, which hurts the user experience.
