/**
 * Reads and extracts text content from a file stored in Vercel Blob storage.
 * Supports: .txt, .md, .json, .pdf, .docx
 *
 * @param fileUrl - The full URL to the file in Blob storage (from blob.url)
 * @returns The extracted text content from the file
 * @throws Error if file cannot be fetched or parsed
 */
export const readFileContent = async (fileUrl: string): Promise<string> => {
	try {
		// Fetch the file from Blob storage
		const response = await fetch(fileUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch file: ${response.statusText}`);
		}

		// Extract filename from URL to determine file extension
		const url = new URL(fileUrl);
		const pathname = decodeURIComponent(url.pathname);
		const filename = pathname.split('/').pop() || '';
		const extension = filename.toLowerCase().split('.').pop() || '';

		// Handle different file types
		switch (extension) {
			case 'txt':
			case 'md':
				return (await response.text()).trim();

			case 'json': {
				const jsonData = await response.json();
				// Pretty print JSON content
				return JSON.stringify(jsonData, null, 2);
			}

		case 'pdf': {
			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// Use pdf2json which is designed for Node.js serverless environments
			const PDFParserModule = await import('pdf2json');
			const PDFParser = PDFParserModule.default;

			return new Promise<string>((resolve, reject) => {
				const pdfParser = new PDFParser();

				pdfParser.on('pdfParser_dataError', (errData: any) => {
					console.error('PDF Parser Error:', errData);
					reject(new Error(errData.parserError));
				});

				pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
					try {
						// Extract text from the parsed PDF data structure
						const textParts: string[] = [];
						
						if (pdfData && pdfData.Pages) {
							for (const page of pdfData.Pages) {
								if (page.Texts && Array.isArray(page.Texts)) {
									for (const textItem of page.Texts) {
										// Each text item can have multiple runs (R)
										if (textItem.R && Array.isArray(textItem.R)) {
											for (const run of textItem.R) {
												if (run.T) {
													// Decode URI encoded text and add space between words
													const decodedText = decodeURIComponent(run.T);
													textParts.push(decodedText);
												}
											}
										}
									}
								}
								// Add paragraph breaks between pages
								textParts.push('\n\n');
							}
						}
						
						const text = textParts.join(' ').trim();
						
						if (!text) {
							console.warn('No text extracted from PDF. Data structure:', JSON.stringify(pdfData).substring(0, 500));
						}
						
						resolve(text);
					} catch (err) {
						console.error('Error extracting text from PDF data:', err);
						reject(err);
					}
				});

				pdfParser.parseBuffer(buffer);
			});
		}
			case 'docx': {
				const arrayBuffer = await response.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				// Dynamic import to avoid loading mammoth unless needed
				const mammoth = await import('mammoth');
				const result = await mammoth.extractRawText({ buffer });
				return result.value.trim();
			}

			default:
				throw new Error(`Unsupported file type: .${extension}`);
		}
	} catch (error) {
		console.error('Error reading file content:', error);
		throw new Error(
			`Failed to read content from ${fileUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
};
