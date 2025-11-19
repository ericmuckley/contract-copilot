import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

// POST /api/file-extractor - Extract text content from uploaded file without storing it
export async function POST({ request }: RequestEvent) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ error: 'File is required' }, { status: 400 });
		}

		// Get file extension
		const filename = file.name.toLowerCase();
		const extension = filename.split('.').pop() || '';

		let textContent: string;

		// Handle different file types
		switch (extension) {
			case 'txt':
			case 'md':
				textContent = (await file.text()).trim();
				break;

			case 'json': {
				const jsonText = await file.text();
				const jsonData = JSON.parse(jsonText);
				// Pretty print JSON content
				textContent = JSON.stringify(jsonData, null, 2).trim();
				break;
			}

		case 'pdf': {
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// Use pdf2json which is designed for Node.js serverless environments
			const PDFParser = (await import('pdf2json')).default;

			textContent = await new Promise<string>((resolve, reject) => {
				const pdfParser = new PDFParser();

				pdfParser.on('pdfParser_dataError', (errData: any) => {
					reject(new Error(errData.parserError));
				});

				pdfParser.on('pdfParser_dataReady', () => {
					const text = (pdfParser as any).getRawTextContent();
					resolve(text.trim());
				});

				pdfParser.parseBuffer(buffer);
			});
			break;
		}
			case 'docx': {
				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				// Dynamic import to avoid loading mammoth unless needed
				const mammoth = await import('mammoth');
				const result = await mammoth.extractRawText({ buffer });
				textContent = result.value.trim();
				break;
			}

			default:
				return json(
					{
						error: `Unsupported file type: .${extension}. Supported types: .txt, .md, .json, .pdf, .docx`
					},
					{ status: 400 }
				);
		}

		if (!textContent) {
			return json({ error: 'File is empty or could not be read' }, { status: 400 });
		}

		return json({ text_content: textContent }, { status: 200 });
	} catch (error) {
		console.error('Error extracting file content:', error);
		return json(
			{
				error: `Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`
			},
			{ status: 500 }
		);
	}
}
