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
				return JSON.stringify(jsonData.trim(), null, 2);
			}

			case 'pdf': {
				const arrayBuffer = await response.arrayBuffer();

				// Use pdfjs-dist which works in Node.js/serverless environments
				const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
				const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

				let fullText = '';
				for (let i = 1; i <= pdf.numPages; i++) {
					const page = await pdf.getPage(i);
					const textContent = await page.getTextContent();
					const pageText = textContent.items.map((item: any) => item.str).join(' ');
					fullText += pageText + '\n';
				}

				return fullText.trim();
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
