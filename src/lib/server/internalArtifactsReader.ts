import { getProjectArtifacts } from './db';
import { readFileContent } from './readFileContent';

export const getTextOverviewOfInternalArtifacts = async (): Promise<string> => {
	// Get all artifacts with no project_id (internal artifacts)
	const artifacts = await getProjectArtifacts(null);

	if (artifacts.length === 0) {
		return 'No documents available.';
	}

	// Iterate over artifacts and read their text content
	let overview = '# Documents\n\n';

	for (const artifact of artifacts) {
		try {
			const content = await readFileContent(artifact.file_url);
			overview += `## ${artifact.file_name}\n\n${content}\n\n---\n\n`;
		} catch (error) {
			console.error(`Failed to read artifact ${artifact.file_name}:`, error);
			overview += `## ${artifact.file_name}\n\n_[Error reading file content]_\n\n---\n\n`;
		}
	}

	return overview;
};
