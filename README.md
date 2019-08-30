# Test Scenarios Extractor

## Features

The extension is able to extract test scenarios written in the comments in source code files. Currently there are two available commands:
 - `Test Scenarios Extractor: Extract from active editor`: Allows you to extract scenarios from active editor and transforms it to csv format.
 - `Test Scenarios Extractor: Extract from directory`: Allows you to select a directory within the opened workspace and then extracts scenarios from all the files inside the selected directory.

## Requirements

There are no additional requirements other than the VS Code itself

## Extension Settings

This extension contributes the following settings:

* `tags.areaTag`: set the tag to match the one that occours once in each file and describes the scope of the test object
* `tags.scenariosTag`: set the tag to match the one that describes the scenario of each test
* `tags.beforeTestTag`: set the tag to match the one that describes the preconditions of each test
* `tags.testActivityTag`: set the tag to match the one that describes the activity that happens during the test
* `tags.testAssertionTag`: set the tag to match the one that describes the assertions and expected results of the test

## Known Issues

Currently none...

## Release Notes

### 0.0.1

Initial release of Test Scenarios Extractor
