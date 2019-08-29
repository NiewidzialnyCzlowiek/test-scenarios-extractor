// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface FolderQuickPickItem extends vscode.QuickPickItem {
	uri: vscode.Uri;
}

const areaTag = "tags.areaTag";
const scenariosTag = "tags.scenariosTag";
const preconditionsTag = "tags.preconditionsTag";
const activityTag = "tags.activitiesTag";
const assertionTag = "tags.assertionsTag";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('testExtractor.extractFromActiveEditor', () => {
		let scenarios = extractTestScenariosFromEditor(vscode.window.activeTextEditor);
		openNewDocumentWithContent(scenarios, "There are no active editors. Please open an editor to perform this action.");
		
	}));
	context.subscriptions.push(vscode.commands.registerCommand('testExtractor.extractFromDirectory', async () => {
		let scenarios = await extractTestScenariosFromSelectedDirectory();
		openNewDocumentWithContent(scenarios, "Operation has been cancelled");
	}));
	
}

// this method is called when your extension is deactivated
export function deactivate() {}

function openNewDocumentWithContent(content: string, errorMessage: string) {
	if (content !== '') {
		vscode.workspace.openTextDocument({language: "plaintext", content: content}).then(doc => {
			vscode.window.showTextDocument(doc);
		});
	}
	else {
		vscode.window.showErrorMessage(errorMessage);
	}

}

function extractTestScenariosFromEditor(editor: vscode.TextEditor | undefined): string {
	let result = createCsvFileHeader();
	if (editor) {
		result += extractTestScenariosFromText(editor.document.getText(), 1);
	}
	return result;
}

async function extractTestScenariosFromSelectedDirectory(): Promise<string> {
	let items = await createWorspaceDirectoriesAsQuickPickItems();
	let selected = await vscode.window.showQuickPick(items, {canPickMany: false});
	let scenarios = '';
	if(selected) {
		scenarios = await extractTestScenariosFromDirectory(selected.uri);
	}
	return scenarios;
}

async function extractTestScenariosFromDirectory(uri: vscode.Uri) {
	let testScenarios = createCsvFileHeader();
	let areaNo = 1;
	let dirContent = await vscode.workspace.fs.readDirectory(uri);
	let files = dirContent.filter((value) => { return value[1] !== vscode.FileType.Directory; });
	for (const file of files) {
		let fileContent = (await vscode.workspace.fs.readFile(vscode.Uri.parse(uri + '/' + file[0]))).toString();
		testScenarios += extractTestScenariosFromText(fileContent, areaNo);
		areaNo += 1;
	}
	return testScenarios;
}

async function createWorspaceDirectoriesAsQuickPickItems(): Promise<FolderQuickPickItem[]> {
	if(vscode.workspace.workspaceFolders) {
		let items = [] as FolderQuickPickItem[];
		for (const workspaceFolder of vscode.workspace.workspaceFolders) {
			items.push({
				label: workspaceFolder.name,
				detail: workspaceFolder.uri.fsPath,
				uri: workspaceFolder.uri
			} as FolderQuickPickItem);
			let dirContent = await vscode.workspace.fs.readDirectory(workspaceFolder.uri);
			let directories = dirContent.filter((value) => { return value[1] === vscode.FileType.Directory; });
			for (const directory of directories) {
				let uri = vscode.Uri.parse(workspaceFolder.uri + '/' + directory[0]);
				items.push({
					label: directory[0],
					detail: uri.fsPath,
					uri: uri
				} as FolderQuickPickItem);
			}	
		}
		return items;
	}
	return [];
}

function extractTestScenariosFromText(text: string, areaNo: number): string {
	let filteredContent = filterScenariosTags(text);
	let formatedToCsv = formatScenarioTagsToCsvFormat(filteredContent, areaNo);
	return formatedToCsv;
	
}

function filterScenariosTags(text: string): string {
	let filterRegexString = `.*\\[?${getTagForRegexFromConfiguration(scenariosTag)}\\]?.*|.*\\[?${getTagForRegexFromConfiguration(preconditionsTag)}\\]?.*|.*\\[?${getTagForRegexFromConfiguration(activityTag)}\\]?.*|.*\\[?${getTagForRegexFromConfiguration(assertionTag)}\\]?.*|.*\\[?${getTagForRegexFromConfiguration(areaTag)}\\]?.*`;
	let filterRegex = new RegExp(filterRegexString, 'gmi');
	let result: RegExpExecArray | null;
	let filteredContent = '';
	while((result = filterRegex.exec(text)) !== null) {
		filteredContent += result + '\n';
	}
	return filteredContent;
}

function formatScenarioTagsToCsvFormat(text: string, areaNo: number): string {
	const testTagsRegexString = `(\\r?\\n.*\\[?${getTagForRegexFromConfiguration(assertionTag)}\\]?|\\r?\\n.*\\[?${getTagForRegexFromConfiguration(activityTag)}\\]?|\\r?\\n.*\\[?${getTagForRegexFromConfiguration(preconditionsTag)}\\]?)\\s?(.*)`;
	const testTagsRegex = new RegExp(testTagsRegexString, 'igm');
	const scenarioRegexString = `.*\\[?${getTagForRegexFromConfiguration(scenariosTag)}\\]?\\s?(.*)`;
	const scenarioRegex = new RegExp(scenarioRegexString, 'ig');
	const areaRegexString = `.*\\[?${getTagForRegexFromConfiguration(areaTag)}\\]?\\s?(.*)`;
	const areaRegex = new RegExp(areaRegexString, 'ig');
	if (!scenarioTagsArePresent(text)) {
		text = addScenarioTagsBeforePreconditionsTags(text);
	}
	text = text.replace(testTagsRegex, ";$2");
	text = text.replace(scenarioRegex, ";;;$1");
	text = text.replace(areaRegex, `${areaNo};$1;;;;;`);
	return text;
}

function scenarioTagsArePresent(text: string): boolean {
	let scenarioRegex = new RegExp(`.*\\[?${getTagForRegexFromConfiguration('tags.scenariosTag')}\\]?.*`,'ig');
	return scenarioRegex.exec(text) !== null;
}

function addScenarioTagsBeforePreconditionsTags(text: string): string {
	let givenRegex = new RegExp(`(.*\\[?${getTagForRegexFromConfiguration(preconditionsTag)}\\]?.*)`,'ig');
	return text.replace(givenRegex, `[${getTagFromConfiguration(scenariosTag)}]\n$1`);
}

function getTagFromConfiguration(key: string) {
	return vscode.workspace.getConfiguration('test-scenarios-extractor').get(key) as string;
	
}

function getTagForRegexFromConfiguration(key: string) {
	return getTagFromConfiguration(key)
		.replace("[", "\\[")
		.replace("]", "\\]")
		.replace("(", "\\(")
		.replace(")", "\\)");
}

function createCsvFileHeader(): string {
	return `Area No.;Area Name;Scenario No.;Scenario;${getTagFromConfiguration(preconditionsTag)};${getTagFromConfiguration(activityTag)};${getTagFromConfiguration(assertionTag)}\n`;
}
