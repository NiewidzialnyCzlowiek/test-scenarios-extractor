import * as assert from 'assert';
import { before } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as testScenariosExtractor from '../extension';

let maxlength = () => 10;
function zeroNegative(val: number) {
	if(val < 0) {
		return 0;
	}
	else { 
		return val;
	}
}

suite('Extension Test Suite', () => {
	before(() => {
		vscode.window.showInformationMessage('Start all tests.');
	});

});
