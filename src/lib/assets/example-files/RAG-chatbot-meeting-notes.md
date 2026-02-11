### **Meeting Notes — RAG Chatbot Implementation Review**

**Date:** Nov 18, 2025
**Attendees:**

* **Sarah L.** (Lead Engineer)
* **James P.** (Product Manager)

---

### **1. Status Update on RAG Chatbot Implementation**

**Sarah:**

* Core RAG pipeline is working end-to-end.
* Using **OpenAI embeddings** for indexing documents. Chunk size currently 800 tokens with 200-token overlap.
* Retrieval accuracy looks “good but inconsistent” on long-form PDFs.
* Pinecone index integration completed; latency is ~220–260 ms per retrieval, which is acceptable but may need tuning.
* Guardrails added around hallucination detection: outputs with low retrieval confidence trigger a clarification question to the user.

**James:**

* Wants consistency improvements before rolling out to beta testers.
* Asked whether we can add logging around retrieval confidence levels to help measure when hallucinations occur.

---

### **2. Issues Identified**

**Sarah:**

* Some user questions are too vague, causing the model to answer confidently with irrelevant chunks.
* Long markdown files cause chunk boundaries to split mid-list or mid-table, hurting retrieval relevance.
* Need better parser for HTML documents—current one strips some structure, harming embeddings.

**James:**

* Beta customers reported the bot occasionally “makes up” configuration steps that aren’t in docs.
* Wants to add an explicit “show sources” mode by default for advanced users.

---

### **3. Feature Requests**

**James:**

1. **Inline Citations**

   * Users want to see which paragraph or doc section the answer came from.
   * Prefer hyperlinks if the doc has stable anchors.

2. **Chat History Awareness**

   * The bot currently treats each question independently.
   * Need multi-turn context retention (but also need to avoid injecting entire history into prompt).

3. **Selective Retrieval by Content Type**

   * Allow users to specify what to search:

     * “Search only product manuals”
     * “Search release notes only”
   * Might need metadata tagging in the index.

4. **Admin Dashboard for Document Status**

   * To show:

     * Last ingestion time
     * Failed ingestion jobs
     * Number of vectors per document
   * Useful for troubleshooting customer complaints.

**Sarah:**

* All items doable but will need prioritization.
* Inline citations require tweaking the prompt and storing document-level metadata in the index.
* Chat history awareness might require separate short-term memory embeddings.

---

### **4. Action Items**

**Sarah:**

* Test smaller chunk sizes (maybe 400–500 tokens) and compare accuracy.
* Add improved HTML ingestion pipeline using Readability or custom DOM traversal.
* Implement retrieval-confidence logging for the next sprint.

**James:**

* Draft specs for “Selective Retrieval” UI.
* Prepare customer-facing examples showing how citations will look.
* Provide prioritized list of feature requests by end of week.

---

### **5. Next Steps**

* Reconvene Friday for a review of retrieval accuracy and confidence metrics.
* Target: Deliver improved prototype to 5 beta customers by December 1.

---

If you want, I can generate **more versions**, longer notes, or versions styled as **Slack threads**, **email summaries**, or **transcripts**.
