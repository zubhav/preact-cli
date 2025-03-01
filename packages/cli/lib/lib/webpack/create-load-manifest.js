module.exports = (assets, namedChunkGroups) => {
	/**
	 * This is a mapping of generic/pre-build filenames to their postbuild output
	 *
	 * bundle.js -> bundle.29bec.esm.js
	 * route-home.css -> styles/route-home.chunk.8aeee.css
	 *
	 * Even if a user alters the output name, we still have keys we can expect & rely on
	 */
	assets = JSON.parse(assets['asset-manifest.json']._value);

	const mainJs = assets['bundle.js'];
	const mainCss = assets['bundle.css'];

	const defaults = {
			...(mainCss && {
				[mainCss]: {
					type: 'style',
					weight: 1,
				},
			}),
			...(mainJs && {
				[mainJs]: {
					type: 'script',
					weight: 1,
				},
			}),
		},
		manifest = {
			'/': defaults,
		};

	Object.keys(assets)
		.filter(asset => /^route-.*\.js$/.test(asset))
		.map(asset => asset.replace(/\.js$/, ''))
		.forEach(route => {
			const routeManifest = Object.assign({}, defaults);

			const routeCss = assets[`${route}.css`];
			const routeJs = assets[`${route}.js`];

			routeManifest[routeJs] = { type: 'script', weight: 0.9 };
			if (routeCss) routeManifest[routeCss] = { type: 'script', weight: 0.9 };

			const path = route.replace(/^route-/, '/').replace(/^\/home/, '/');

			if (namedChunkGroups) {
				// async files to be loaded, generated by splitChunksPlugin
				const asyncFiles = namedChunkGroups.get(route) || {};
				if (asyncFiles && asyncFiles.chunks) {
					asyncFiles.chunks.forEach(asset => {
						asset.files = asset.files || [];
						asset.files.forEach(file => {
							if (/\.css$/.test(file)) {
								routeManifest[file] = { type: 'style', weight: 0.9 };
							} else if (/\.js$/.test(file)) {
								routeManifest[file] = { type: 'script', weight: 0.9 };
							}
						});
					});
				}
			}
			manifest[path] = routeManifest;
		});

	return manifest;
};
