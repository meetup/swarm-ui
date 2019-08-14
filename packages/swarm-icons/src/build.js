#!/usr/bin/env node

const fs = require('fs');
const argv = require('yargs').options('f', {
	alias: 'family',
	default: 'solid',
}).argv;

console.log(`building ${argv.family} icon set`);

function toCamelCase(s) {
	return s.replace(/-(\w)/g, g => g[1].toUpperCase());
}

const createIconComponent = (componentName, contents, size) => {
	return `import React from 'react';

const ${componentName} = props => (
	<svg data-swarm-icon height="${size}" width="${size}" viewBox="0 0 ${size} ${size}" {...props}>
		${contents}
	</svg>
);

export default ${componentName};
`;
};

fs.readdir(`${__dirname}/icons/${argv.family}`, function(err, files) {
	if (err) {
		console.error('Could not list the directory.', err);
		process.exit(1);
	}
	// initialize empty index file
	fs.writeFileSync(`${__dirname}/components/${argv.family}/index.js`, '');

	files
		.sort((a, b) => toCamelCase(a).localeCompare(toCamelCase(b)))
		.forEach(function(file, index) {
			// syncronous in order to keep alphabetical order
			const data = fs.readFileSync(`${__dirname}/icons/${argv.family}/${file}`);
			let contents = data.toString();

			// stripping outer svg tag
			contents = contents
				.replace(/<svg[^>]*>/, '')
				.replace('</svg>', '')
				.replace(/(\S)\/>/g, '$1 />')
				.replace(/\sfill="#[^"]*"/g, '')
				.replace(/fill-rule/g, 'fillRule');

			const camelCaseFilename = toCamelCase(file);
			const componentName =
				camelCaseFilename.charAt(0).toUpperCase() + // TitleCasing
				camelCaseFilename.slice(1).replace('.svg', ''); // stripping .svg extension

			// write component JSX
			fs.writeFileSync(
				`${__dirname}/components/${argv.family}/${componentName}.jsx`,
				createIconComponent(
					componentName,
					contents,
					argv.family === 'line' ? '24' : '18'
				)
			);

			// append export to index file
			fs.appendFileSync(
				`${__dirname}/components/${argv.family}/index.js`,
				`export { default as ${componentName} } from './${componentName}';\n`
			);
		});
});