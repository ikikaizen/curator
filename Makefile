.PHONY: install compile package test

install:
	npm install

compile:
	npm run compile

package: install compile
	npx @vscode/vsce package --no-dependencies

test:
	npm test
